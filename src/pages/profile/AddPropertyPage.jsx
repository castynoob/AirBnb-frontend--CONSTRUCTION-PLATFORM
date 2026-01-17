import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Building2, ArrowLeft, Save, X } from "lucide-react";
import Nav from "../../components/Nav";
import { useLanguage } from "../../contexts/LanguageContext";
import "../../styles/manager/addpropertypagemanager.css";

function AddPropertyPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);

  const [formData, setFormData] = useState({
    building_name: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    num_units: 0,
    building_type: "Apartment",
    latitude: 14.5995,
    longitude: 120.9842,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Building types with value (stored in DB) and translation key
  const buildingTypes = [
    { value: "Apartment", key: "apartment" },
    { value: "Condominium", key: "condominium" },
    { value: "High-Rise", key: "highRise" },
    { value: "Townhouse", key: "townhouse" },
    { value: "Duplex", key: "duplex" },
    { value: "Triplex", key: "triplex" },
    { value: "Single Family", key: "singleFamily" },
    { value: "Multi-Family", key: "multiFamily" },
    { value: "Commercial Building", key: "commercialBuilding" },
    { value: "Mixed-Use", key: "mixedUse" },
    { value: "Student Housing", key: "studentHousing" },
    { value: "Senior Living", key: "seniorLiving" }
  ];

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;

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
              // Use default coordinates
              initializeMap(formData.latitude, formData.longitude, L);
            }
          );
        } else {
          // Browser doesn't support geolocation, use default
          initializeMap(formData.latitude, formData.longitude, L);
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      if (map) {
        map.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to initialize map

  // Reverse geocode coordinates to get address information
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
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
      // Silently fail - coordinates are still updated
    }
  };

  const initializeMap = (lat, lng, L) => {
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

      // Reverse geocode the new position
      reverseGeocode(position.lat, position.lng);
    });

    mapInstance.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));

      // Reverse geocode the clicked position
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    markerRef.current = marker;
    setMap(mapInstance);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_units' ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = t('addPropertyPage.addressRequired');
    }

    if (!formData.city.trim()) {
      newErrors.city = t('addPropertyPage.cityRequired');
    }

    if (formData.num_units < 0) {
      newErrors.num_units = t('addPropertyPage.unitsNegativeError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userProfile = localStorage.getItem('userProfile')

      if(userProfile) {
        const user = JSON.parse(userProfile);
        const token = user.token

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

        const response = await fetch(`${API_BASE_URL}/api/properties`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })

        const data = await response.json();

        if(!response.ok) {
            throw new Error(data.message || t('addPropertyPage.addFailed'));
        }

        alert(t('addPropertyPage.propertyAdded'))
      }
      
      // Simulate API callss
    //   await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Property submitted:", formData);
      
      // Navigate back to profile page
      navigate('/profile/property_manager');
      
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(t('addPropertyPage.addFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm(t('addPropertyPage.cancelConfirm'))) {
      navigate('/profile/property_manager');
    }
  };

  return (
    <div className="add-property-page">
      <Nav />
      
      <main className="add-property-content">
        {/* Header */}
        <div className="page-header-ap">
          <div className="header-title-ap">
            <button className="back-button" onClick={() => navigate('/profile/property_manager')}>
                <ArrowLeft size={20} />
                <span>{t('addPropertyPage.backToProfile')}</span>
            </button>

          </div>
          <div className="add-title-ap">
            <h1 className="page-title ap">{t('addPropertyPage.title')}</h1>
            <p className="page-subtitle ap">
                {t('addPropertyPage.subtitle')}
            </p>
          </div>
        </div>

        <form className="property-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Left Column - Form Fields */}
            <div className="form-column">
              {/* Property Details Section */}
              <div className="form-section">
                <h2 className="section-title">
                  <Building2 size={20} />
                  {t('addPropertyPage.propertyDetails')}
                </h2>

                <div className="form-fields">
                  {/* Building name */}
                  <div className="form-group">
                    <label className="form-label">
                      {t('addPropertyPage.buildingName')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="building_name"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('addPropertyPage.buildingNamePlaceholder')}
                    />
                    {errors.address && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-group">
                    <label className="form-label">
                      {t('addPropertyPage.address')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      className={`form-input ${errors.address ? 'error' : ''}`}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={t('addPropertyPage.addressPlaceholder')}
                    />
                    {errors.address && (
                      <span className="error-message">{errors.address}</span>
                    )}
                  </div>

                  {/* City and Province */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        {t('addPropertyPage.city')} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        className={`form-input ${errors.city ? 'error' : ''}`}
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder={t('addPropertyPage.cityPlaceholder')}
                      />
                      {errors.city && (
                        <span className="error-message">{errors.city}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('addPropertyPage.province')}</label>
                      <input
                        type="text"
                        name="province"
                        className="form-input"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder={t('addPropertyPage.provincePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Postal Code and Building Type */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('addPropertyPage.postalCode')}</label>
                      <input
                        type="text"
                        name="postal_code"
                        className="form-input"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        placeholder={t('addPropertyPage.postalCodePlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('addPropertyPage.buildingType')}</label>
                      <select
                        name="building_type"
                        className="form-select"
                        value={formData.building_type}
                        onChange={handleInputChange}
                      >
                        {buildingTypes.map(type => (
                          <option key={type.value} value={type.value}>{t(`addPropertyPage.${type.key}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Number of Units */}
                  <div className="form-group">
                    <label className="form-label">{t('addPropertyPage.numberOfUnits')}</label>
                    <input
                      type="number"
                      name="num_units"
                      className={`form-input ${errors.num_units ? 'error' : ''}`}
                      value={formData.num_units}
                      onChange={handleInputChange}
                      min="0"
                      placeholder={t('addPropertyPage.unitsPlaceholder')}
                    />
                    {errors.num_units && (
                      <span className="error-message">{errors.num_units}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Coordinates */}
              <div className="coordinates-section">
                <h3 className="coordinates-title">
                  <MapPin size={18} />
                  {t('addPropertyPage.coordinates')}
                </h3>
                <div className="coordinates-grid">
                  <div className="coordinate-field">
                    <label className="coordinate-label">{t('addPropertyPage.latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      className="coordinate-input"
                      value={formData.latitude.toFixed(6)}
                      readOnly
                    />
                  </div>
                  <div className="coordinate-field">
                    <label className="coordinate-label">{t('addPropertyPage.longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      className="coordinate-input"
                      value={formData.longitude.toFixed(6)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="map-column">
              <div className="map-section">
                <h2 className="section-title">
                  <MapPin size={20} />
                  {t('addPropertyPage.propertyLocation')}
                </h2>
                <p className="map-instruction">
                  {t('addPropertyPage.mapInstruction')}
                </p>

                <div ref={mapRef} className="map-container" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
            >
              <X size={16} />
              {t('addPropertyPage.cancel')}
            </button>

            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              <Save size={16} />
              {isSubmitting ? t('addPropertyPage.addingProperty') : t('addPropertyPage.addProperty')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddPropertyPage;