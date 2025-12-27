import { useState, useEffect, useRef } from 'react';
import { X, Building2, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/manager/addpropertymodal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EditPropertyModal = ({ isOpen, onClose, onSuccess, property }) => {
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

  // Initialize form data when property changes
  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        building_name: property.building_name || '',
        address: property.address || '',
        city: property.city || '',
        province: property.province || '',
        postal_code: property.postal_code || '',
        num_units: property.num_units?.toString() || '',
        building_type: property.building_type || 'Apartment',
        latitude: parseFloat(property.latitude) || 14.5995,
        longitude: parseFloat(property.longitude) || 120.9842,
      });
    }
  }, [property, isOpen]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !property) return;

    let mapInstance = null;
    let isMounted = true;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix marker icons
        if (L.Icon?.Default?.prototype) {
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
        }

        if (!isMounted || !mapRef.current) return;

        // Check if container already has a map and remove it
        if (mapRef.current._leaflet_id) {
          return; // Map already initialized on this container
        }

        const lat = parseFloat(property.latitude) || 14.5995;
        const lng = parseFloat(property.longitude) || 120.9842;

        mapInstance = L.map(mapRef.current).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        }).addTo(mapInstance);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);

        marker.on('dragend', () => {
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
        if (isMounted) {
          setMap(mapInstance);
        }
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstance) {
        mapInstance.remove();
      }
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [isOpen, property]);

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

        const road = address.road || '';
        const houseNumber = address.house_number || '';
        const suburb = address.suburb || address.neighbourhood || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const province = address.state || address.province || '';
        const postalCode = address.postcode || '';

        let fullAddress = '';
        if (houseNumber) fullAddress += houseNumber + ' ';
        if (road) fullAddress += road;
        if (suburb && !fullAddress.includes(suburb)) fullAddress += (fullAddress ? ', ' : '') + suburb;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('Please log in to edit properties');
      }

      const response = await fetch(`${API_BASE_URL}/api/properties/${property.id}`, {
        method: 'PUT',
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
        throw new Error(data.message || 'Failed to update property');
      }

      const data = await response.json();

      if (onSuccess) onSuccess(data.property);

      toast.success('Property updated successfully', {
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
      console.error('Error updating property:', error);
      setError(error.message);

      toast.error(error.message || 'Failed to update property', {
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

  if (!isOpen || !property) return null;

  return (
    <div className="property-overlay" onClick={onClose}>
      <div className="property-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="property-header">
          <div className="property-title-wrapper">
            <Building2 size={20} className="property-icon" />
            <div>
              <h2>Edit Property</h2>
              <p className="property-subtitle">Update property information</p>
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
              Building Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="building_name"
              name="building_name"
              value={formData.building_name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Sunrise Apartments, Oak Tower, etc."
              required
            />
          </div>

          {/* Map Section - Full Width */}
          <div className="property-map-section-large">
            <h4 className="map-section-title">
              <MapPin size={18} />
              Property Location
            </h4>
            <p className="map-instruction">
              Click on the map or drag the marker to update the location. Address fields will auto-fill.
            </p>
            <div ref={mapRef} className="property-map-container-large" />

            {/* Coordinates Display */}
            <div className="coordinates-display">
              <h4 className="coordinates-title">
                <MapPin size={16} />
                Current Coordinates
              </h4>
              <div className="coordinates-row">
                <div className="coordinate-item">
                  <span className="coordinate-label">Latitude:</span>
                  <span className="coordinate-value">{formData.latitude.toFixed(6)}</span>
                </div>
                <div className="coordinate-item">
                  <span className="coordinate-label">Longitude:</span>
                  <span className="coordinate-value">{formData.longitude.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Fields Section */}
          <div className="address-section">
            <h4 className="section-title">Address Information</h4>
            <p className="section-description">Edit the address details or update via the map above.</p>

            <div className="property-form-grid">
              {/* Address */}
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Street Address <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Street address"
                  required
                />
              </div>

              {/* City and Province Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="province" className="form-label">
                    Province/State <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Province/State"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div className="form-group">
                <label htmlFor="postal_code" className="form-label">
                  Postal/Zip Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          {/* Building Details Section */}
          <div className="building-details-section">
            <h4 className="section-title">Building Details</h4>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="building_type" className="form-label">
                  Building Type <span className="required">*</span>
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
                  Number of Units <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="num_units"
                  name="num_units"
                  value={formData.num_units}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 24"
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
              Cancel
            </button>
            <button
              type="submit"
              className="property-btn property-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
