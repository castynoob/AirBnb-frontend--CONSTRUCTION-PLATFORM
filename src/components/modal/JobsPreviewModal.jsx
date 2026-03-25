import { useState, useEffect } from 'react';
import { X, CheckCircle, Edit2, Trash2, Save, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/manager/jobspreviewmodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const JobsPreviewModal = ({ isOpen, onClose, parsedData, inspectionId, onSuccess }) => {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedJob, setEditedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update jobs when parsedData changes
  useEffect(() => {
    if (parsedData?.jobs && Array.isArray(parsedData.jobs)) {
      setJobs(parsedData.jobs);
    }
  }, [parsedData]);

  const categories = [
    'Roofing', 'Plumbing', 'Electrical', 'Painting', 'HVAC',
    'Flooring', 'Carpentry', 'Masonry', 'Landscaping', 'Other'
  ];

  const urgencyLevels = [
    'Urgent',
    'Planned',
  ];

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditedJob({ ...jobs[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditedJob(null);
  };

  const saveEdit = () => {
    if (!editedJob.title?.trim()) {
      toast.error(t('jobsPreview.jobTitleRequired'));
      return;
    }

    const updatedJobs = [...jobs];
    updatedJobs[editingIndex] = editedJob;
    setJobs(updatedJobs);
    setEditingIndex(null);
    setEditedJob(null);
    toast.success(t('jobsPreview.jobUpdated'));
  };

  const deleteJob = (index) => {
    if (jobs.length === 1) {
      toast.error(t('jobsPreview.cannotDeleteLast'));
      return;
    }

    const updatedJobs = jobs.filter((_, i) => i !== index);
    setJobs(updatedJobs);
    toast.success(t('jobsPreview.jobRemoved'));
  };

  const handleEditChange = (field, value) => {
    setEditedJob(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateJobs = async () => {
    if (jobs.length === 0) {
      toast.error(t('jobsPreview.noJobsToCreate'));
      return;
    }

    // Validate all jobs
    const invalidJobs = jobs.filter(job => !job.title?.trim());
    if (invalidJobs.length > 0) {
      toast.error(t('jobsPreview.allJobsMustHaveTitle'));
      return;
    }

    // Warn about jobs missing budget
    const jobsWithoutBudget = jobs.filter(job => !job.budget_min || !job.budget_max || job.budget_min <= 0 || job.budget_max <= 0);
    if (jobsWithoutBudget.length > 0) {
      toast.error(`${jobsWithoutBudget.length} job(s) are missing a budget. Please add budget min and max to all jobs.`);
      return;
    }

    // Validate budget_min <= budget_max
    const invalidBudget = jobs.filter(job => parseFloat(job.budget_min) > parseFloat(job.budget_max));
    if (invalidBudget.length > 0) {
      toast.error(`${invalidBudget.length} job(s) have budget min greater than budget max. Please fix them.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));

      const response = await fetch(`${API_BASE_URL}/api/inspections/${inspectionId}/create-jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobs })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('jobsPreview.failedToCreateJobs'));
      }

      const result = await response.json();

      toast.success(t('jobsPreview.successfullyCreated', { count: result.jobs.length }), {
        duration: 3000,
        icon: '✅'
      });

      setTimeout(() => {
        onSuccess && onSuccess(result.jobs);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error creating jobs:', error);
      toast.error(error.message || t('jobsPreview.failedToCreateJobs'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="preview-loading-overlay">
            <div className="preview-loading-content">
              <Loader2 size={48} className="preview-spinner" />
              <h3>{t('jobsPreview.creatingJobs')}</h3>
              <p>{t('jobsPreview.pleaseWait')}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="preview-header">
          <div className="preview-title-wrapper">
            <CheckCircle size={24} className="preview-icon-success" />
            <div>
              <h2>{t('jobsPreview.reviewExtractedJobs')}</h2>
              <p className="preview-subtitle">
                {jobs.length} {jobs.length !== 1 ? t('jobsPreview.jobs') : t('jobsPreview.job')} {t('jobsPreview.extractedFromExcel')}
              </p>
            </div>
          </div>
          <button className="preview-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="preview-stats">
          <div className="preview-stat-card">
            <span className="preview-stat-value">{parsedData?.totalRows || 0}</span>
            <span className="preview-stat-label">{t('jobsPreview.totalRows')}</span>
          </div>
          <div className="preview-stat-card success">
            <span className="preview-stat-value">{jobs.length}</span>
            <span className="preview-stat-label">{t('jobsPreview.validJobs')}</span>
          </div>
          <div className="preview-stat-card error">
            <span className="preview-stat-value">{parsedData?.errorCount || 0}</span>
            <span className="preview-stat-label">{t('jobsPreview.errors')}</span>
          </div>
        </div>

        {/* Jobs List */}
        <div className="preview-body">
          {jobs.length === 0 ? (
            <div className="preview-empty">
              <AlertCircle size={48} />
              <p>{t('jobsPreview.noValidJobs')}</p>
            </div>
          ) : (
            <div className="preview-jobs-list">
              {jobs.map((job, index) => (
                <div key={index} className="preview-job-card">
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="preview-job-edit">
                      <div className="preview-edit-header">
                        <span className="preview-job-number">{t('jobsPreview.job')} #{index + 1}</span>
                        <div className="preview-edit-actions">
                          <button
                            onClick={saveEdit}
                            className="preview-action-btn save"
                            type="button"
                          >
                            <Save size={16} />
                            <span>{t('jobsPreview.save')}</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="preview-action-btn cancel"
                            type="button"
                          >
                            <XCircle size={16} />
                            <span>{t('jobsPreview.cancel')}</span>
                          </button>
                        </div>
                      </div>

                      <div className="preview-edit-form">
                        {/* Title */}
                        <div className="preview-form-group">
                          <label className="preview-label">
                            {t('jobsPreview.title')} <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            value={editedJob.title || ''}
                            onChange={(e) => handleEditChange('title', e.target.value)}
                            className="preview-input"
                            placeholder={t('jobsPreview.jobTitlePlaceholder')}
                          />
                        </div>

                        {/* Category & Urgency */}
                        <div className="preview-form-row">
                          <div className="preview-form-group">
                            <label className="preview-label">{t('jobsPreview.category')}</label>
                            <select
                              value={editedJob.category || 'Other'}
                              onChange={(e) => handleEditChange('category', e.target.value)}
                              className="preview-select"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="preview-form-group">
                            <label className="preview-label">{t('jobsPreview.urgency')}</label>
                            <select
                              value={editedJob.urgency || 'Planned'}
                              onChange={(e) => handleEditChange('urgency', e.target.value)}
                              className="preview-select"
                            >
                              {urgencyLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="preview-form-group">
                          <label className="preview-label">{t('jobsPreview.description')}</label>
                          <textarea
                            value={editedJob.description || ''}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="preview-textarea"
                            rows="2"
                            placeholder={t('jobsPreview.descriptionPlaceholder')}
                          />
                        </div>

                        {/* Budget Min & Max */}
                        <div className="preview-form-row">
                          <div className="preview-form-group">
                            <label className="preview-label">{t('jobsPreview.budgetMin')} <span className="required">*</span></label>
                            <input
                              type="number"
                              value={editedJob.budget_min ?? ''}
                              onChange={(e) => handleEditChange('budget_min', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="preview-input"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="preview-form-group">
                            <label className="preview-label">{t('jobsPreview.budgetMax')} <span className="required">*</span></label>
                            <input
                              type="number"
                              value={editedJob.budget_max ?? ''}
                              onChange={(e) => handleEditChange('budget_max', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="preview-input"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="preview-form-row">
                          <div className="preview-form-group">
                            <label className="preview-label">{t('jobsPreview.location')}</label>
                            <input
                              type="text"
                              value={editedJob.location || ''}
                              onChange={(e) => handleEditChange('location', e.target.value)}
                              className="preview-input"
                              placeholder={t('jobsPreview.locationPlaceholder')}
                            />
                          </div>
                        </div>

                        {/* Due Date */}
                        <div className="preview-form-group">
                          <label className="preview-label">{t('jobsPreview.dueDate')}</label>
                          <input
                            type="date"
                            value={editedJob.dueDate || ''}
                            onChange={(e) => handleEditChange('dueDate', e.target.value)}
                            className="preview-input"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="preview-job-header">
                        <div className="preview-job-title-section">
                          <span className="preview-job-number">{t('jobsPreview.job')} #{index + 1}</span>
                          <h3 className="preview-job-title">{job.title || t('jobsPreview.untitledJob')}</h3>
                        </div>
                        <div className="preview-job-actions">
                          <button
                            onClick={() => startEditing(index)}
                            className="preview-action-btn edit"
                            disabled={isSubmitting}
                            type="button"
                          >
                            <Edit2 size={16} />
                            <span>{t('jobsPreview.edit')}</span>
                          </button>
                          <button
                            onClick={() => deleteJob(index)}
                            className="preview-action-btn delete"
                            disabled={isSubmitting}
                            type="button"
                          >
                            <Trash2 size={16} />
                            <span>{t('jobsPreview.delete')}</span>
                          </button>
                        </div>
                      </div>

                      <div className="preview-job-details">
                        <div className="preview-detail-row">
                          <span className="preview-detail-label">{t('jobsPreview.category')}:</span>
                          <span className="preview-detail-value">{job.category || 'Other'}</span>
                        </div>
                        <div className="preview-detail-row">
                          <span className="preview-detail-label">{t('jobsPreview.urgency')}:</span>
                          <span className={`preview-urgency-badge ${
                            job.urgency?.toLowerCase().includes('urgent') ? 'urgent' : 'low'
                          }`}>
                            {job.urgency || 'Planned'}
                          </span>
                        </div>
                        {job.description && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">{t('jobsPreview.description')}:</span>
                            <span className="preview-detail-value">{job.description}</span>
                          </div>
                        )}
                        {(job.budget_min != null || job.budget_max != null) && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">{t('jobsPreview.budget')}:</span>
                            <span className="preview-detail-value">
                              ${job.budget_min ?? '—'} - ${job.budget_max ?? '—'}
                            </span>
                          </div>
                        )}
                        {job.location && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">{t('jobsPreview.location')}:</span>
                            <span className="preview-detail-value">{job.location}</span>
                          </div>
                        )}
                        {job.dueDate && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">{t('jobsPreview.dueDate')}:</span>
                            <span className="preview-detail-value">{job.dueDate}</span>
                          </div>
                        )}
                        {job.sourceRow && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">{t('jobsPreview.source')}:</span>
                            <span className="preview-detail-value">{t('jobsPreview.row')} {job.sourceRow}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="preview-footer">
          <button
            onClick={onClose}
            className="preview-btn preview-btn-secondary"
            disabled={isSubmitting}
            type="button"
          >
            {t('jobsPreview.cancel')}
          </button>
          <button
            onClick={handleCreateJobs}
            className="preview-btn preview-btn-primary"
            disabled={isSubmitting || jobs.length === 0}
            type="button"
          >
            {isSubmitting ? t('jobsPreview.creating') : `${t('jobsPreview.create')} ${jobs.length} ${jobs.length !== 1 ? t('jobsPreview.jobs') : t('jobsPreview.job')}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobsPreviewModal;
