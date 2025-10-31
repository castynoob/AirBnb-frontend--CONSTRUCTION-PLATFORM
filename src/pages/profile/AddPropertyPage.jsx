import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Building2, ArrowLeft, Save, X } from "lucide-react";
import Nav from "../../components/Nav";
import "../../styles/manager/addpropertypagemanager.css";

function AddPropertyPage() {
  const navigate = useNavigate();
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

  const buildingTypes = [
    "Apartment",
    "Condominium",
    "High-Rise",
    "Townhouse",
    "Duplex",
    "Triplex",
    "Single Family",
    "Multi-Family",
    "Commercial Building",
    "Mixed-Use",
    "Student Housing",
    "Senior Living"
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
  }, []);

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
    });

    mapInstance.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
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
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (formData.num_units < 0) {
      newErrors.num_units = "Number of units cannot be negative";
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
            throw new Error(data.message || "Failed to create property");
        }

        alert('Property added')
      }
      
      // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Property submitted:", formData);
      
      // Navigate back to profile page
      navigate('/profile/property_manager');
      
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to add property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
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
                <span>Back to Profile</span>
            </button>
            
          </div>
          <div className="add-title-ap">
            <h1 className="page-title ap">Add New Property</h1>
            <p className="page-subtitle ap">
                Fill in the details below to add a new property to your portfolio
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
                  Property Details
                </h2>

                <div className="form-fields">
                  {/* Building name */}
                  <div className="form-group">
                    <label className="form-label">
                      Building name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="building_name"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Building name"
                    />
                    {errors.address && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-group">
                    <label className="form-label">
                      Address <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      className={`form-input ${errors.address ? 'error' : ''}`}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g., 456 Oak Avenue"
                    />
                    {errors.address && (
                      <span className="error-message">{errors.address}</span>
                    )}
                  </div>

                  {/* City and Province */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        City <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        className={`form-input ${errors.city ? 'error' : ''}`}
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Metro City"
                      />
                      {errors.city && (
                        <span className="error-message">{errors.city}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Province</label>
                      <input
                        type="text"
                        name="province"
                        className="form-input"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="e.g., Central Province"
                      />
                    </div>
                  </div>

                  {/* Postal Code and Building Type */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        className="form-input"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        placeholder="e.g., 12345"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Building Type</label>
                      <select
                        name="building_type"
                        className="form-select"
                        value={formData.building_type}
                        onChange={handleInputChange}
                      >
                        {buildingTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Number of Units */}
                  <div className="form-group">
                    <label className="form-label">Number of Units</label>
                    <input
                      type="number"
                      name="num_units"
                      className={`form-input ${errors.num_units ? 'error' : ''}`}
                      value={formData.num_units}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="e.g., 24"
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
                  Coordinates
                </h3>
                <div className="coordinates-grid">
                  <div className="coordinate-field">
                    <label className="coordinate-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="coordinate-input"
                      value={formData.latitude.toFixed(6)}
                      readOnly
                    />
                  </div>
                  <div className="coordinate-field">
                    <label className="coordinate-label">Longitude</label>
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
                  Property Location
                </h2>
                <p className="map-instruction">
                  Click on the map or drag the marker to set the property location
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
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              <Save size={16} />
              {isSubmitting ? 'Adding Property...' : 'Add Property'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddPropertyPage;