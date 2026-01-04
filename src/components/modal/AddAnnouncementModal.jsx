import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/manager/addannouncementmodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddAnnouncementModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    property_id: '',
    title: '',
    content: '',
    type: 'Notice',
    priority: 'normal',
    is_pinned: false
  });
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch manager's properties when modal opens
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

      // GET /api/properties/ returns properties for the authenticated manager
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
      console.error('❌ Error fetching properties:', error);
      setError('Failed to load properties');
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('Please log in to create announcements');
      }

      const response = await fetch(`${API_BASE_URL}/api/residents/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create announcement');
      }

      const data = await response.json();

      // Reset form
      setFormData({
        property_id: properties.length > 0 ? properties[0].id : '',
        title: '',
        content: '',
        type: 'Notice',
        priority: 'normal',
        is_pinned: false
      });

      if (onSuccess) onSuccess(data.announcement);
      // show a quick success toast then close
      try {
        toast.success(t('announcementModal.createdSuccess'));
      } catch (e) {
        // ignore if toast fails
      }
      onClose();
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="announcement-overlay" onClick={onClose}>
      <div className="announcement-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="announcement-header">
          <div className="announcement-title-wrapper">
            <Megaphone size={20} className="announcement-icon" />
            <div>
              <h2>{t('announcementModal.title')}</h2>
              <p className="announcement-subtitle">{t('announcementModal.subtitle')}</p>
            </div>
          </div>
          <button className="announcement-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="announcement-body">
          {error && (
            <div className="error-message-box">
              {error}
            </div>
          )}

          {/* Property Selection */}
          <div className="form-group">
            <label htmlFor="property_id" className="form-label">
              {t('announcementModal.buildingProperty')} <span className="required">*</span>
            </label>
            {isLoadingProperties ? (
              <div className="loading-text">{t('announcementModal.loadingProperties')}</div>
            ) : properties.length === 0 ? (
              <div className="info-message">
                {t('announcementModal.noPropertiesFound')}
              </div>
            ) : (
              <select
                id="property_id"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.building_name || property.address} - {property.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t('announcementModal.titleLabel')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder={t('announcementModal.titlePlaceholder')}
              required
              maxLength={200}
            />
          </div>

          {/* Type and Priority Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type" className="form-label">
                Type <span className="required">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="Notice">Notice</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Event">Event</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority <span className="required">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Enter announcement details..."
              rows={6}
              required
            />
          </div>

          {/* Pin Announcement */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_pinned"
                checked={formData.is_pinned}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>Pin this announcement to the top</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="announcement-footer">
            <button
              type="button"
              onClick={onClose}
              className="announcement-btn announcement-btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="announcement-btn announcement-btn-primary"
              disabled={isSubmitting || properties.length === 0 || isLoadingProperties}
            >
              {isSubmitting ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAnnouncementModal;
