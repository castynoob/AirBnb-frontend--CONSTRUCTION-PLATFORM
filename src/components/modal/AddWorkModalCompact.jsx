import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Tag,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle,
  Download,
  File,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import JobsPreviewModal from './JobsPreviewModal';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/manager/addworkmodalcompact.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddWorkModalCompact = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [parsedJobsData, setParsedJobsData] = useState(null);
  const [inspectionId, setInspectionId] = useState(null);
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'excel'
  const [formData, setFormData] = useState({
    property_id: '',
    title: '',
    description: '',
    category: 'Roofing',
    urgency: 'Urgent',
    due_date: '',
    estimated_duration_days: '',
    budget_min: '',
    budget_max: '',
    is_budget_hidden: true,
    is_emergency: false,
  });

  const [images, setImages] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ stage: '', message: '', percent: 0 });

  const categories = [
    { value: 'Roofing', key: 'roofing' },
    { value: 'Plumbing', key: 'plumbing' },
    { value: 'Electrical', key: 'electrical' },
    { value: 'Painting', key: 'painting' },
    { value: 'HVAC', key: 'hvac' },
    { value: 'Flooring', key: 'flooring' },
    { value: 'Carpentry', key: 'carpentry' },
    { value: 'Masonry', key: 'masonry' },
    { value: 'Landscaping', key: 'landscaping' },
    { value: 'Other', key: 'other' }
  ];

  const urgencyLevels = [
    { value: 'Urgent', key: 'urgent' },
    { value: 'Planned', key: 'planned' },
  ];

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      // Reset form
      setInputMethod('manual');
      setExcelFile(null);
      setExcelPreview(null);
      setImages([]);
      setErrors({});
    }
  }, [isOpen]);

  const fetchProperties = async () => {
    try {
      setIsLoadingProperties(true);
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/properties/`, {
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();

      // Remove duplicate properties based on property ID
      const uniqueProperties = [];
      const seenIds = new Set();

      (data.properties || []).forEach(property => {
        if (!seenIds.has(property.id)) {
          seenIds.add(property.id);
          uniqueProperties.push(property);
        }
      });

      setProperties(uniqueProperties);

      // Auto-select first property if available
      if (uniqueProperties.length > 0) {
        setFormData(prev => ({
          ...prev,
          property_id: uniqueProperties[0].id
        }));
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error(t('toasts.failedLoadProperties'));
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (newImages.length !== files.length) {
      toast.error(t('toasts.imageSkipped'));
    }

    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error(t('toasts.invalidExcelFile'));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('toasts.fileTooLarge'));
      return;
    }

    setExcelFile(file);
    setExcelPreview({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB'
    });
  };

  const downloadTemplate = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      // Download French template by default (Plan de maintien format)
      const response = await fetch(`${API_BASE_URL}/api/inspections/template?lang=fr`, {
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plan-de-maintien-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('toasts.templateDownloaded'));
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('toasts.templateDownloadFail'));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.budget_min) newErrors.budget_min = 'Minimum budget is required';
    if (!formData.budget_max) newErrors.budget_max = 'Maximum budget is required';
    if (formData.budget_min && formData.budget_max && parseFloat(formData.budget_min) > parseFloat(formData.budget_max)) {
      newErrors.budget_max = 'Max budget must be greater than min budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('toasts.fillRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ stage: 'creating', message: 'Creating job...' });

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));

      // Create job first
      const jobData = {
        property_id: formData.property_id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        due_date: formData.due_date || null,
        estimated_duration_days: formData.estimated_duration_days ? parseInt(formData.estimated_duration_days) : null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        budget_visible: !formData.is_budget_hidden,
        is_emergency: formData.is_emergency
      };

      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      const result = await response.json();
      const jobId = result.job.id;

      // Upload images if any
      if (images.length > 0) {
        setUploadProgress({ stage: 'uploading', message: `Uploading ${images.length} image(s)...` });

        const formDataImages = new FormData();
        images.forEach(image => {
          formDataImages.append('images', image);
        });

        const imageResponse = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userProfile.token}`
          },
          body: formDataImages
        });

        if (!imageResponse.ok) {
          console.warn('Image upload failed, but job was created');
        }
      }

      setUploadProgress({ stage: 'complete', message: 'Job created successfully!' });

      toast.success(t('toasts.jobCreatedSuccess'), {
        duration: 3000,
        icon: '✅'
      });

      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(t('common.failedCreateJob') || 'Failed to create job');
      setUploadProgress({ stage: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();

    if (!formData.property_id) {
      toast.error(t('toasts.selectProperty'));
      return;
    }

    if (!excelFile) {
      toast.error(t('toasts.selectExcelFile'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ stage: 'uploading', message: 'Uploading Excel file...', percent: 5 });

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));

      const formDataUpload = new FormData();
      formDataUpload.append('file', excelFile);
      formDataUpload.append('property_id', formData.property_id);

      const response = await fetch(`${API_BASE_URL}/api/inspections/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formDataUpload
      });

      // Read SSE stream for progress updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // Keep incomplete chunk

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.stage === 'reading') {
              setUploadProgress({
                stage: 'reading',
                message: `Found ${data.totalRows} rows (${data.totalBatches} batches)`,
                percent: 10,
              });
            } else if (data.stage === 'extracting') {
              const percent = data.totalBatches > 0
                ? Math.round(10 + (data.currentBatch / data.totalBatches) * 75)
                : 50;
              setUploadProgress({
                stage: 'extracting',
                message: data.message,
                percent,
                jobsFound: data.jobsFound,
                rowsProcessed: data.rowsProcessed,
                totalRows: data.totalRows,
              });
            } else if (data.stage === 'saving') {
              setUploadProgress({
                stage: 'saving',
                message: 'Saving inspection record...',
                percent: 90,
              });
            } else if (data.stage === 'complete') {
              finalResult = data.result;
              setUploadProgress({
                stage: 'complete',
                message: `Found ${data.result.parsedData.successCount} jobs!`,
                percent: 100,
              });
            } else if (data.stage === 'error') {
              throw new Error(data.message);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error('No result received from server');
      }

      toast.success(`Successfully parsed ${finalResult.parsedData.successCount} jobs from Excel`, {
        duration: 2000,
      });

      // Store parsed data and show preview modal
      setParsedJobsData(finalResult.parsedData);
      setInspectionId(finalResult.inspection.id);

      setTimeout(() => {
        setShowPreviewModal(true);
      }, 500);

    } catch (error) {
      console.error('Error uploading Excel:', error);
      toast.error(t('common.failedUploadExcel') || 'Failed to upload Excel file');
      setUploadProgress({ stage: '', message: '', percent: 0 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-compact" onClick={onClose}>
      <div className="modal-content-compact" onClick={(e) => e.stopPropagation()}>
        {/* Loading Overlay with Progress */}
        {isSubmitting && (
          <div className="compact-loading-overlay">
            <div className="compact-loading-content">
              {uploadProgress.stage === 'complete' ? (
                <CheckCircle size={48} className="success-icon-compact" />
              ) : (
                <Loader2 size={48} className="spinner-icon-compact" />
              )}
              <h3>{uploadProgress.message || 'Processing...'}</h3>
              {uploadProgress.percent > 0 && (
                <div className="compact-progress-bar-wrapper">
                  <div className="compact-progress-bar">
                    <div
                      className={`compact-progress-fill ${uploadProgress.stage === 'complete' ? 'complete' : ''}`}
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  <span className="compact-progress-percent">{uploadProgress.percent}%</span>
                </div>
              )}
              {uploadProgress.jobsFound != null && (
                <p className="compact-progress-detail">
                  {uploadProgress.rowsProcessed}/{uploadProgress.totalRows} rows processed — {uploadProgress.jobsFound} jobs found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="compact-header">
          <div className="compact-title-wrapper">
            <Tag size={20} className="compact-icon" />
            <h2>{t('addWorkModal.addNewJob')}</h2>
          </div>
          <button className="compact-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Global Property Selection */}
        <div className="compact-body">
          <div className="compact-property-section">
            <label className="compact-label">
              <Building2 size={14} />
              {inputMethod === 'excel' ? t('addWorkModal.propertyForAllJobs') : t('addWorkModal.selectProperty')}
              <span className="required">*</span>
            </label>
            {isLoadingProperties ? (
              <div className="compact-loading-text">{t('addWorkModal.loading')}</div>
            ) : properties.length === 0 ? (
              <div className="compact-info-message">
                <AlertCircle size={16} />
                <span>{t('addWorkModal.noPropertiesFound')}</span>
              </div>
            ) : (
              <>
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className="compact-select"
                  disabled={isSubmitting}
                >
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.building_name || property.address}
                    </option>
                  ))}
                </select>
                {inputMethod === 'excel' && (
                  <div className="compact-info-message" style={{ marginTop: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{t('addWorkModal.allJobsForProperty')}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Method Selector - Segmented Control */}
          <div className="compact-method-selector">
            <button
              type="button"
              className={`compact-method-btn ${inputMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setInputMethod('manual')}
              disabled={isSubmitting}
            >
              <Edit3 size={16} />
              <span>{t('addWorkModal.manualEntry')}</span>
            </button>
            <button
              type="button"
              className={`compact-method-btn ${inputMethod === 'excel' ? 'active' : ''}`}
              onClick={() => setInputMethod('excel')}
              disabled={isSubmitting}
            >
              <FileText size={16} />
              <span>{t('addWorkModal.uploadExcel')}</span>
            </button>
          </div>

          {/* Manual Entry Form */}
          {inputMethod === 'manual' && (
            <form onSubmit={handleManualSubmit} className="compact-form">
              {/* Job Title */}
              <div className="compact-form-group">
                <label className="compact-label">
                  {t('addWorkModal.jobTitle')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`compact-input ${errors.title ? 'error' : ''}`}
                  placeholder={t('addWorkModal.jobTitlePlaceholder')}
                  disabled={isSubmitting}
                />
                {errors.title && <span className="compact-error-text">{errors.title}</span>}
              </div>

              {/* Category & Urgency */}
              <div className="compact-form-row">
                <div className="compact-form-group">
                  <label className="compact-label">{t('addWorkModal.category')}</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="compact-select"
                    disabled={isSubmitting}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{t(`addWorkModal.cat_${cat.key}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="compact-form-group">
                  <label className="compact-label">{t('addWorkModal.urgency')}</label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="compact-select"
                    disabled={isSubmitting}
                  >
                    {urgencyLevels.map(level => (
                      <option key={level.value} value={level.value}>{t(`addWorkModal.urg_${level.key}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Checkbox */}
              <div className="compact-checkbox-group">
                <input
                  type="checkbox"
                  id="is_emergency"
                  name="is_emergency"
                  checked={formData.is_emergency}
                  onChange={handleChange}
                  className="compact-checkbox"
                  disabled={isSubmitting}
                />
                <label htmlFor="is_emergency" className="compact-checkbox-label">
                  <AlertTriangle size={14} className="emergency-icon" />
                  {t('addWorkModal.markAsEmergency')}
                </label>
              </div>

              {/* Due Date & Duration */}
              <div className="compact-form-row">
                <div className="compact-form-group">
                  <label className="compact-label">
                    <Calendar size={14} /> {t('addWorkModal.dueDate')}
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="compact-input"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="compact-form-group">
                  <label className="compact-label">
                    <Clock size={14} /> {t('addWorkModal.duration')} <span className="compact-optional">({t('addWorkModal.optional')})</span>
                  </label>
                  <input
                    type="number"
                    name="estimated_duration_days"
                    value={formData.estimated_duration_days}
                    onChange={handleChange}
                    className="compact-input"
                    placeholder={t('addWorkModal.durationPlaceholder')}
                    min="1"
                    disabled={isSubmitting}
                  />
                  <span className="compact-hint">{t('addWorkModal.durationHint')}</span>
                </div>
              </div>

              {/* Budget Section */}
              <div className="compact-budget-box">
                <label className="compact-label">
                  <DollarSign size={14} /> {t('addWorkModal.budgetRange')}
                </label>
                <span className="compact-hint">{t('addWorkModal.budgetHint')}</span>
                <div className="compact-form-row">
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    className="compact-input"
                    placeholder={t('addWorkModal.min')}
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    className="compact-input"
                    placeholder={t('addWorkModal.max')}
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                {(errors.budget_min || errors.budget_max) && <span className="compact-error-text">{errors.budget_min || errors.budget_max}</span>}
                <span className="compact-hint compact-hint-note">{t('addWorkModal.budgetVisibilityNote')}</span>
              </div>

              {/* Description */}
              <div className="compact-form-group">
                <label className="compact-label">{t('addWorkModal.description')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="compact-textarea"
                  rows="3"
                  placeholder={t('addWorkModal.descriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Image Upload */}
              <div className="compact-form-group">
                <label className="compact-label">
                  <Upload size={14} /> {t('addWorkModal.uploadImages')}
                </label>
                <div className="compact-upload-zone">
                  <input
                    type="file"
                    id="job-images"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="compact-file-input"
                    disabled={isSubmitting || images.length >= 5}
                  />
                  <label htmlFor="job-images" className="compact-upload-label">
                    <Upload size={20} />
                    <span>{t('addWorkModal.clickToUpload')}</span>
                    <small>{t('addWorkModal.imageLimit')}</small>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="compact-image-previews">
                    {images.map((image, index) => (
                      <div key={index} className="compact-image-preview">
                        <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="compact-remove-image"
                          disabled={isSubmitting}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="compact-footer">
                <button
                  type="button"
                  onClick={onClose}
                  className="compact-btn compact-btn-secondary"
                  disabled={isSubmitting}
                >
                  {t('addWorkModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="compact-btn compact-btn-primary"
                  disabled={isSubmitting || properties.length === 0}
                >
                  {isSubmitting ? t('addWorkModal.creating') : t('addWorkModal.createJob')}
                </button>
              </div>
            </form>
          )}

          {/* Excel Upload Form */}
          {inputMethod === 'excel' && (
            <form onSubmit={handleExcelSubmit} className="compact-form">
              {/* Template Download */}
              <div className="compact-template-section">
                <div className="compact-template-info">
                  <FileText size={20} className="template-icon" />
                  <div>
                    <h4>{t('addWorkModal.excelTemplate')}</h4>
                    <p>{t('addWorkModal.templateDescription')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="compact-btn compact-btn-outline"
                  disabled={isSubmitting}
                >
                  <Download size={16} />
                  {t('addWorkModal.downloadTemplate')}
                </button>
              </div>

              {/* Excel Upload Zone */}
              <div className="compact-excel-upload-zone">
                <input
                  type="file"
                  id="excel-file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelChange}
                  className="compact-file-input"
                  disabled={isSubmitting}
                />
                <label htmlFor="excel-file" className="compact-excel-label">
                  <File size={32} className="excel-icon" />
                  <p>{t('addWorkModal.dragDropExcel')}</p>
                  <span>{t('addWorkModal.orClickBrowse')}</span>
                  <small>{t('addWorkModal.supportedFormats')}</small>
                </label>
              </div>

              {/* Excel Preview */}
              {excelPreview && (
                <div className="compact-excel-preview">
                  <CheckCircle size={20} className="preview-icon" />
                  <div className="preview-details">
                    <strong>{excelPreview.name}</strong>
                    <span>{excelPreview.size}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExcelFile(null);
                      setExcelPreview(null);
                    }}
                    className="preview-remove"
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="compact-footer">
                <button
                  type="button"
                  onClick={onClose}
                  className="compact-btn compact-btn-secondary"
                  disabled={isSubmitting}
                >
                  {t('addWorkModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="compact-btn compact-btn-primary"
                  disabled={isSubmitting || !excelFile || properties.length === 0}
                >
                  {isSubmitting ? t('addWorkModal.parsing') : t('addWorkModal.previewJobs')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Jobs Preview Modal */}
      <JobsPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setParsedJobsData(null);
          setInspectionId(null);
        }}
        parsedData={parsedJobsData}
        inspectionId={inspectionId}
        onSuccess={(createdJobs) => {
          setShowPreviewModal(false);
          setParsedJobsData(null);
          setInspectionId(null);
          onSuccess && onSuccess(createdJobs);
          onClose();
        }}
      />
    </div>
  );
};

export default AddWorkModalCompact;
