import { useState, useEffect, useRef } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/manager/addpropertymodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AddPropertyModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);

  const [formData, setFormData] = useState({
    building_name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    num_units: '',
    building_type: 'Apartment',
    latitude: 14.5995,
    longitude: 120.9842,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const buildingTypes = [
    'Apartment',
    'Condominium',
    'High-Rise',
    'Townhouse',
    'Duplex',
    'Triplex',
    'Single Family',
    'Multi-Family',
    'Commercial Building',
    'Mixed-Use',
    'Student Housing',
    'Senior Living'
  ];

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;

    const existingScript = document.querySelector('script[src*="leaflet.js"]');

    if (window.L && mapRef.current) {
      // Leaflet already loaded
      initializeMap(formData.latitude, formData.longitude, window.L);
    } else if (!existingScript) {
      script.onload = () => {
        if (mapRef.current && window.L) {
          const L = window.L;

          // Attempt to get user's location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                setFormData(prev => ({
                  ...prev,
                  latitude: userLat,
                  longitude: userLng
                }));

                initializeMap(userLat, userLng, L);
              },
              (error) => {
                console.warn("Geolocation error, using default location", error);
                initializeMap(formData.latitude, formData.longitude, L);
              }
            );
          } else {
            initializeMap(formData.latitude, formData.longitude, L);
          }
        }
      };
      document.head.appendChild(script);
    } else if (existingScript) {
      // Script exists but may not be loaded yet
      existingScript.addEventListener('load', () => {
        if (mapRef.current && window.L) {
          initializeMap(formData.latitude, formData.longitude, window.L);
        }
      });
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [isOpen]);

  // Reverse geocode coordinates to get address information
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'INTERVOS Construction Platform'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;

        // Extract address components
        const road = address.road || '';
        const houseNumber = address.house_number || '';
        const suburb = address.suburb || address.neighbourhood || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const province = address.state || address.province || '';
        const postalCode = address.postcode || '';

        // Construct full address
        let fullAddress = '';
        if (houseNumber) fullAddress += houseNumber + ' ';
        if (road) fullAddress += road;
        if (suburb && !fullAddress.includes(suburb)) fullAddress += (fullAddress ? ', ' : '') + suburb;

        // Update form data with geocoded information
        setFormData(prev => ({
          ...prev,
          address: fullAddress.trim() || prev.address,
          city: city || prev.city,
          province: province || prev.province,
          postal_code: postalCode || prev.postal_code,
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const initializeMap = (lat, lng, L) => {
    if (!mapRef.current || map) return;

    const mapInstance = L.map(mapRef.current).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);

    marker.on('dragend', (e) => {
      const position = marker.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng
      }));

      reverseGeocode(position.lat, position.lng);
    });

    mapInstance.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));

      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    markerRef.current = marker;
    setMap(mapInstance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('Please log in to add properties');
      }

      const response = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          num_units: parseInt(formData.num_units) || 0,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create property');
      }

      const data = await response.json();

      // Reset form
      setFormData({
        building_name: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        num_units: '',
        building_type: 'Apartment',
        latitude: 14.5995,
        longitude: 120.9842,
      });

      if (onSuccess) onSuccess(data.property);

      toast.success('Property added successfully', {
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

      onClose();
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error.message);

      toast.error(error.message || 'Failed to add property', {
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
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="property-overlay" onClick={onClose}>
      <div className="property-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="property-header">
          <div className="property-title-wrapper">
            <Building2 size={20} className="property-icon" />
            <div>
              <h2>{t('addPropertyModal.addNewProperty')}</h2>
              <p className="property-subtitle">{t('addPropertyModal.subtitle')}</p>
            </div>
          </div>
          <button className="property-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="property-body">
          {error && (
            <div className="error-message-box">
              {error}
            </div>
          )}

          {/* Building Name - Full Width */}
          <div className="form-group">
            <label htmlFor="building_name" className="form-label">
              <Building2 size={14} />
              {t('addPropertyModal.buildingName')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="building_name"
              name="building_name"
              value={formData.building_name}
              onChange={handleChange}
              className="form-input"
              placeholder={t('addPropertyModal.buildingNamePlaceholder')}
              required
            />
          </div>

          {/* Map Section - Full Width */}
          <div className="property-map-section-large">
            <h4 className="map-section-title">
              <MapPin size={18} />
              {t('addPropertyModal.pinLocation')}
            </h4>
            <p className="map-instruction">
              📍 {t('addPropertyModal.mapInstruction')}
            </p>
            <div ref={mapRef} className="property-map-container-large" />

            {/* Coordinates Display */}
            <div className="coordinates-display">
              <h4 className="coordinates-title">
                <MapPin size={16} />
                {t('addPropertyModal.selectedCoordinates')}
              </h4>
              <div className="coordinates-row">
                <div className="coordinate-item">
                  <span className="coordinate-label">{t('addPropertyModal.latitude')}:</span>
                  <span className="coordinate-value">{formData.latitude.toFixed(6)}</span>
                </div>
                <div className="coordinate-item">
                  <span className="coordinate-label">{t('addPropertyModal.longitude')}:</span>
                  <span className="coordinate-value">{formData.longitude.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Fields Section */}
          <div className="address-section">
            <h4 className="section-title">{t('addPropertyModal.autoFilledAddress')}</h4>
            <p className="section-description">{t('addPropertyModal.autoFillDescription')}</p>

            <div className="property-form-grid">
              {/* Address */}
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  {t('addPropertyModal.streetAddress')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={t('addPropertyModal.willAutoFill')}
                  required
                />
              </div>

              {/* City and Province Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    {t('addPropertyModal.city')} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t('addPropertyModal.willAutoFill')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="province" className="form-label">
                    {t('addPropertyModal.provinceState')}
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t('addPropertyModal.willAutoFill')}
                    required
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div className="form-group">
                <label htmlFor="postal_code" className="form-label">
                  {t('addPropertyModal.postalCode')}
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={t('addPropertyModal.willAutoFill')}
                />
              </div>
            </div>
          </div>

          {/* Building Details Section */}
          <div className="building-details-section">
            <h4 className="section-title">{t('addPropertyModal.buildingDetails')}</h4>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="building_type" className="form-label">
                  {t('addPropertyModal.buildingType')} <span className="required">*</span>
                </label>
                <select
                  id="building_type"
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {buildingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="num_units" className="form-label">
                  {t('addPropertyModal.numberOfUnits')} <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="num_units"
                  name="num_units"
                  value={formData.num_units}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={t('addPropertyModal.unitsPlaceholder')}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="property-footer">
            <button
              type="button"
              onClick={onClose}
              className="property-btn property-btn-secondary"
              disabled={isSubmitting}
            >
              {t('addPropertyModal.cancel')}
            </button>
            <button
              type="submit"
              className="property-btn property-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('addPropertyModal.adding') : t('addPropertyModal.addProperty')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
