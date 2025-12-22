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
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/manager/addworkmodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddWorkModal = ({ isOpen, onClose, onSuccess, onOpenExcelUpload }) => {
  const [formData, setFormData] = useState({
    property_id: '',
    title: '',
    description: '',
    category: 'Roofing',
    urgency: 'Urgent (Current Year)',
    due_date: '',
    estimated_duration_days: '',
    budget_min: '',
    budget_max: '',
    is_budget_hidden: false,
    is_emergency: false,
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ stage: '', message: '' });

  const categories = [
    'Roofing',
    'Plumbing',
    'Electrical',
    'Painting',
    'HVAC',
    'Flooring',
    'Carpentry',
    'Masonry',
    'Landscaping',
    'Other'
  ];

  const urgencyLevels = [
    'Urgent (Current Year)',
    'Next Year',
    'Year After'
  ];

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProperties();
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
      setProperties(data.properties || []);

      // Auto-select first property if available
      if (data.properties && data.properties.length > 0) {
        setFormData(prev => ({
          ...prev,
          property_id: data.properties[0].id
        }));
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties', {
        duration: 4000,
        style: {
          borderRadius: '4px',
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.budget_min) newErrors.budget_min = 'Minimum budget is required';
    if (!formData.budget_max) newErrors.budget_max = 'Maximum budget is required';

    if (formData.budget_min && formData.budget_max) {
      if (parseFloat(formData.budget_min) > parseFloat(formData.budget_max)) {
        newErrors.budget_max = 'Max budget must be greater than min budget';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress({ stage: 'creating', message: 'Creating job...' });

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('Please log in to create jobs');
      }

      const jobData = {
        property_id: formData.property_id || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        due_date: formData.due_date || null,
        estimated_duration_days: parseInt(formData.estimated_duration_days) || null,
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        is_budget_hidden: formData.is_budget_hidden || false,
        is_emergency: formData.is_emergency || false,
        status: 'Open',
      };

      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create job');
      }

      const data = await response.json();
      const jobId = data.job.id;

      // Upload images if any
      if (images.length > 0) {
        setUploadProgress({
          stage: 'uploading',
          message: `Uploading ${images.length} image(s)...`
        });

        const uploadFormData = new FormData();
        images.forEach(img => {
          uploadFormData.append('images', img.file);
        });

        try {
          const uploadRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userProfile.token}`,
            },
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            console.error('Image upload failed');
            toast.error('Job created but image upload failed', {
              duration: 4000,
              style: {
                borderRadius: '4px',
                background: '#fff',
                color: '#1f2937',
                border: '1px solid #f59e0b',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            });
          } else {
            setUploadProgress({
              stage: 'complete',
              message: 'Job and images uploaded successfully!'
            });
          }
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
        }
      } else {
        setUploadProgress({
          stage: 'complete',
          message: 'Job created successfully!'
        });
      }

      // Reset form
      setFormData({
        property_id: properties.length > 0 ? properties[0].id : '',
        title: '',
        description: '',
        category: 'Roofing',
        urgency: 'Urgent (Current Year)',
        due_date: '',
        estimated_duration_days: '',
        budget_min: '',
        budget_max: '',
        is_budget_hidden: false,
        is_emergency: false,
      });
      setImages([]);

      if (onSuccess) onSuccess(data.job);

      toast.success('Job created successfully', {
        duration: 5000,
        style: {
          borderRadius: '4px',
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #14919b',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });

      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Failed to create job', {
        duration: 4000,
        style: {
          borderRadius: '4px',
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });
      setUploadProgress({ stage: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content work-modal-large" onClick={(e) => e.stopPropagation()}>
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="work-modal-loading-overlay">
            <div className="work-modal-loading-content">
              {uploadProgress.stage === 'complete' ? (
                <CheckCircle size={48} className="work-success-icon" />
              ) : (
                <Loader2 size={48} className="work-spinner-icon" />
              )}
              <h3>{uploadProgress.message}</h3>
              {uploadProgress.stage === 'creating' && <p>Please wait...</p>}
              {uploadProgress.stage === 'uploading' && <p>Uploading images...</p>}
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Tag size={24} className="modal-icon" />
            <div>
              <h2>Add New Work | Repair | Job</h2>
              <p className="modal-subtitle">Submit a new repair request for your property</p>
            </div>
          </div>
          <div className="modal-header-actions">
            <button
              className="btn-excel-upload"
              onClick={() => {
                if (onOpenExcelUpload) {
                  onOpenExcelUpload(formData.property_id);
                }
              }}
              disabled={isSubmitting}
              type="button"
            >
              <ClipboardList size={18} />
              <span>Upload Excel</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" disabled={isSubmitting}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body work-modal-body">
          {/* Top Section - Property & Title */}
          <div className="work-top-section">
            {/* Property Selection */}
            <div className="form-group">
              <label htmlFor="property_id" className="form-label">
                <Building2 size={16} /> Property <span className="required">*</span>
              </label>
              {isLoadingProperties ? (
                <div className="loading-text">Loading properties...</div>
              ) : properties.length === 0 ? (
                <div className="info-message">
                  No properties found. Please add a property first.
                </div>
              ) : (
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className={`form-select ${errors.property_id ? 'error-border' : ''}`}
                  required
                  disabled={isSubmitting}
                >
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.building_name || property.address}
                    </option>
                  ))}
                </select>
              )}
              {errors.property_id && (
                <span className="error-text">
                  <AlertCircle size={14} /> {errors.property_id}
                </span>
              )}
            </div>

            {/* Job Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                <Tag size={16} /> Job Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`form-input ${errors.title ? 'error-border' : ''}`}
                placeholder="e.g., Roof Repair Needed"
                required
                disabled={isSubmitting}
              />
              {errors.title && (
                <span className="error-text">
                  <AlertCircle size={14} /> {errors.title}
                </span>
              )}
            </div>
          </div>

          {/* Logistics Grid - 2 Columns */}
          <div className="work-logistics-grid">
            <div className="form-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="urgency" className="form-label">
                Urgency
                {formData.is_emergency && (
                  <span className="emergency-badge">
                    <AlertTriangle size={12} /> Emergency
                  </span>
                )}
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                {urgencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="is_emergency"
                  checked={formData.is_emergency}
                  onChange={handleChange}
                  className="form-checkbox-inline"
                  disabled={isSubmitting}
                />
                <span>Mark as Emergency</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="due_date" className="form-label">
                <Calendar size={16} /> Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estimated_duration_days" className="form-label">
                <Clock size={16} /> Duration (Days)
              </label>
              <input
                type="number"
                id="estimated_duration_days"
                name="estimated_duration_days"
                value={formData.estimated_duration_days}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 5"
                min="1"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Budget Section */}
          <div className="work-budget-section">
            <h4 className="section-subtitle">
              <DollarSign size={18} /> Budget
            </h4>
            <div className="budget-row">
              <div className="form-group">
                <label htmlFor="budget_min" className="form-label">
                  Minimum <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="budget_min"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  className={`form-input ${errors.budget_min ? 'error-border' : ''}`}
                  placeholder="5000"
                  min="0"
                  required
                  disabled={isSubmitting}
                />
                {errors.budget_min && (
                  <span className="error-text">
                    <AlertCircle size={14} /> {errors.budget_min}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="budget_max" className="form-label">
                  Maximum <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="budget_max"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  className={`form-input ${errors.budget_max ? 'error-border' : ''}`}
                  placeholder="8000"
                  min="0"
                  required
                  disabled={isSubmitting}
                />
                {errors.budget_max && (
                  <span className="error-text">
                    <AlertCircle size={14} /> {errors.budget_max}
                  </span>
                )}
              </div>
            </div>

            <label className="checkbox-label budget-checkbox">
              <input
                type="checkbox"
                name="is_budget_hidden"
                checked={formData.is_budget_hidden}
                onChange={handleChange}
                className="form-checkbox"
                disabled={isSubmitting}
              />
              <span>Hide budget from entrepreneurs</span>
            </label>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              <FileText size={16} /> Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-textarea ${errors.description ? 'error-border' : ''}`}
              placeholder="Describe the work to be done..."
              rows={4}
              required
              disabled={isSubmitting}
            />
            {errors.description && (
              <span className="error-text">
                <AlertCircle size={14} /> {errors.description}
              </span>
            )}
          </div>

          {/* Image Upload */}
          <div className="work-upload-section">
            <h4 className="section-subtitle">
              <Upload size={18} /> Upload Images (Optional)
            </h4>
            <div className="work-upload-zone">
              <input
                type="file"
                id="work-image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
              <label htmlFor="work-image-upload" className="work-upload-label">
                <Upload size={32} />
                <p>Click to upload or drag and drop</p>
                <span>PNG, JPG, JPEG up to 10MB each</span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="work-image-previews">
                {images.map((image, index) => (
                  <div key={index} className="work-image-preview">
                    <img src={image.preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="work-remove-image"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                    </button>
                    <span className="work-image-name">{image.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || properties.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkModal;
