import { useState, useEffect } from 'react';
import { X, CheckCircle, Edit2, Trash2, Save, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/manager/jobspreviewmodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const JobsPreviewModal = ({ isOpen, onClose, parsedData, inspectionId, onSuccess }) => {
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
    'Urgent (Current Year)',
    'Next Year',
    'Year After'
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
      toast.error('Job title is required');
      return;
    }

    const updatedJobs = [...jobs];
    updatedJobs[editingIndex] = editedJob;
    setJobs(updatedJobs);
    setEditingIndex(null);
    setEditedJob(null);
    toast.success('Job updated');
  };

  const deleteJob = (index) => {
    if (jobs.length === 1) {
      toast.error('Cannot delete the last job. At least one job is required.');
      return;
    }

    const updatedJobs = jobs.filter((_, i) => i !== index);
    setJobs(updatedJobs);
    toast.success('Job removed');
  };

  const handleEditChange = (field, value) => {
    setEditedJob(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateJobs = async () => {
    if (jobs.length === 0) {
      toast.error('No jobs to create');
      return;
    }

    // Validate all jobs
    const invalidJobs = jobs.filter(job => !job.title?.trim());
    if (invalidJobs.length > 0) {
      toast.error('All jobs must have a title');
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
        throw new Error(errorData.message || 'Failed to create jobs');
      }

      const result = await response.json();

      toast.success(`Successfully created ${result.jobs.length} job(s)!`, {
        duration: 3000,
        icon: '✅'
      });

      setTimeout(() => {
        onSuccess && onSuccess(result.jobs);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error creating jobs:', error);
      toast.error(error.message || 'Failed to create jobs');
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
              <h3>Creating Jobs...</h3>
              <p>Please wait while we create your jobs</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="preview-header">
          <div className="preview-title-wrapper">
            <CheckCircle size={24} className="preview-icon-success" />
            <div>
              <h2>Review Extracted Jobs</h2>
              <p className="preview-subtitle">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} extracted from Excel • Review and edit before creating
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
            <span className="preview-stat-label">Total Rows</span>
          </div>
          <div className="preview-stat-card success">
            <span className="preview-stat-value">{jobs.length}</span>
            <span className="preview-stat-label">Valid Jobs</span>
          </div>
          <div className="preview-stat-card error">
            <span className="preview-stat-value">{parsedData?.errorCount || 0}</span>
            <span className="preview-stat-label">Errors</span>
          </div>
        </div>

        {/* Jobs List */}
        <div className="preview-body">
          {jobs.length === 0 ? (
            <div className="preview-empty">
              <AlertCircle size={48} />
              <p>No valid jobs to display</p>
            </div>
          ) : (
            <div className="preview-jobs-list">
              {jobs.map((job, index) => (
                <div key={index} className="preview-job-card">
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="preview-job-edit">
                      <div className="preview-edit-header">
                        <span className="preview-job-number">Job #{index + 1}</span>
                        <div className="preview-edit-actions">
                          <button
                            onClick={saveEdit}
                            className="preview-action-btn save"
                            type="button"
                          >
                            <Save size={16} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="preview-action-btn cancel"
                            type="button"
                          >
                            <XCircle size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>

                      <div className="preview-edit-form">
                        {/* Title */}
                        <div className="preview-form-group">
                          <label className="preview-label">
                            Title <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            value={editedJob.title || ''}
                            onChange={(e) => handleEditChange('title', e.target.value)}
                            className="preview-input"
                            placeholder="Job title"
                          />
                        </div>

                        {/* Category & Urgency */}
                        <div className="preview-form-row">
                          <div className="preview-form-group">
                            <label className="preview-label">Category</label>
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
                            <label className="preview-label">Urgency</label>
                            <select
                              value={editedJob.urgency || 'Next Year'}
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
                          <label className="preview-label">Description</label>
                          <textarea
                            value={editedJob.description || ''}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="preview-textarea"
                            rows="2"
                            placeholder="Job description"
                          />
                        </div>

                        {/* Budget & Location */}
                        <div className="preview-form-row">
                          <div className="preview-form-group">
                            <label className="preview-label">Budget</label>
                            <input
                              type="number"
                              value={editedJob.budget || ''}
                              onChange={(e) => handleEditChange('budget', parseFloat(e.target.value))}
                              className="preview-input"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="preview-form-group">
                            <label className="preview-label">Location</label>
                            <input
                              type="text"
                              value={editedJob.location || ''}
                              onChange={(e) => handleEditChange('location', e.target.value)}
                              className="preview-input"
                              placeholder="Location"
                            />
                          </div>
                        </div>

                        {/* Due Date */}
                        <div className="preview-form-group">
                          <label className="preview-label">Due Date</label>
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
                          <span className="preview-job-number">Job #{index + 1}</span>
                          <h3 className="preview-job-title">{job.title || 'Untitled Job'}</h3>
                        </div>
                        <div className="preview-job-actions">
                          <button
                            onClick={() => startEditing(index)}
                            className="preview-action-btn edit"
                            disabled={isSubmitting}
                            type="button"
                          >
                            <Edit2 size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteJob(index)}
                            className="preview-action-btn delete"
                            disabled={isSubmitting}
                            type="button"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="preview-job-details">
                        <div className="preview-detail-row">
                          <span className="preview-detail-label">Category:</span>
                          <span className="preview-detail-value">{job.category || 'Other'}</span>
                        </div>
                        <div className="preview-detail-row">
                          <span className="preview-detail-label">Urgency:</span>
                          <span className={`preview-urgency-badge ${
                            job.urgency?.includes('Urgent') ? 'urgent' :
                            job.urgency?.includes('Next') ? 'medium' : 'low'
                          }`}>
                            {job.urgency || 'Next Year'}
                          </span>
                        </div>
                        {job.description && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">Description:</span>
                            <span className="preview-detail-value">{job.description}</span>
                          </div>
                        )}
                        {job.budget && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">Budget:</span>
                            <span className="preview-detail-value">${job.budget}</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">Location:</span>
                            <span className="preview-detail-value">{job.location}</span>
                          </div>
                        )}
                        {job.dueDate && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">Due Date:</span>
                            <span className="preview-detail-value">{job.dueDate}</span>
                          </div>
                        )}
                        {job.sourceRow && (
                          <div className="preview-detail-row">
                            <span className="preview-detail-label">Source:</span>
                            <span className="preview-detail-value">Row {job.sourceRow}</span>
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
            Cancel
          </button>
          <button
            onClick={handleCreateJobs}
            className="preview-btn preview-btn-primary"
            disabled={isSubmitting || jobs.length === 0}
            type="button"
          >
            {isSubmitting ? 'Creating...' : `Create ${jobs.length} Job${jobs.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobsPreviewModal;
