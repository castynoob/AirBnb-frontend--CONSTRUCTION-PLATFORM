import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Upload,
  Camera,
  X,
  Download,
  Calendar,
  Truck,
  CreditCard,
  Award,
  LogOut
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/supplier/supplierprofile.css';
import { useNavigate } from 'react-router-dom';

function SupplierProfile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [catalogFile, setCatalogFile] = useState(null);
  const [isUploadingCatalog, setIsUploadingCatalog] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: '',
    business_license: '',
    years_in_business: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    delivery_areas: []
  });

  const serviceAreaOptions = [
    'Metro Manila',
    'Quezon City',
    'Manila',
    'Caloocan',
    'Pasig',
    'Makati',
    'Taguig',
    'Paranaque',
    'Las Pinas',
    'Muntinlupa',
    'Mandaluyong',
    'Marikina',
    'Pasay',
    'Valenzuela',
    'Malabon',
    'Navotas',
    'San Juan',
    'Cavite',
    'Laguna',
    'Batangas',
    'Rizal',
    'Bulacan',
    'Pampanga'
  ];

  useEffect(() => {
    fetchSupplierProfile();
  }, []);

  const fetchSupplierProfile = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (userProfile) {
      const user = JSON.parse(userProfile);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/supplier/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();

        const supplierData = {
          userId: user.id,
          companyName: data.profile.company_name,
          businessLicense: data.profile.business_license,
          yearsInBusiness: data.profile.years_in_business,
          address: data.profile.address,
          phone: data.profile.phone || 'Not provided',
          email: data.profile.email,
          website: data.profile.website || 'Not provided',
          deliveryAreas: data.profile.delivery_areas || [],
          catalogUrl: data.profile.catalog_pdf_url,
          image: data.profile.catalog_pdf_url // Note: Using catalog_pdf_url temporarily for image
        };

        setProfile(supplierData);
      } catch (error) {
        console.error('Error fetching supplier profile:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isEditModalOpen && profile) {
      setFormData({
        company_name: profile.companyName,
        business_license: profile.businessLicense,
        years_in_business: profile.yearsInBusiness,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        delivery_areas: profile.deliveryAreas
      });
    }
  }, [isEditModalOpen, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceAreaChange = (area) => {
    setFormData(prev => ({
      ...prev,
      delivery_areas: prev.delivery_areas.includes(area)
        ? prev.delivery_areas.filter(a => a !== area)
        : [...prev.delivery_areas, area]
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should not exceed 5MB');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCatalogSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('PDF size should not exceed 50MB');
        return;
      }

      setCatalogFile(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.business_license || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    try {
      if (userProfile) {
        const user = JSON.parse(userProfile);

        // 1. Upload profile picture if new image selected
        if (profileImage) {
          setIsUploadingImage(true);
          const imageFormData = new FormData();
          imageFormData.append('image', profileImage);

          const imageResponse = await fetch(`${API_BASE_URL}/api/users/supplier/profile-picture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.token}`
            },
            body: imageFormData
          });

          if (!imageResponse.ok) {
            throw new Error('Failed to upload profile picture');
          }

          setIsUploadingImage(false);
        }

        // 2. Upload catalog PDF if new file selected
        if (catalogFile) {
          setIsUploadingCatalog(true);
          const catalogFormData = new FormData();
          catalogFormData.append('catalog', catalogFile);

          const catalogResponse = await fetch(`${API_BASE_URL}/api/users/supplier/catalog`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.token}`
            },
            body: catalogFormData
          });

          if (!catalogResponse.ok) {
            throw new Error('Failed to upload catalog');
          }

          setIsUploadingCatalog(false);
          setCatalogFile(null);
        }

        // 3. Update supplier profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/supplier/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            company_name: formData.company_name,
            business_license: formData.business_license,
            years_in_business: parseInt(formData.years_in_business),
            address: formData.address,
            phone: formData.phone,
            website: formData.website,
            delivery_areas: formData.delivery_areas
          })
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile');
        }

        // Refresh profile data
        await fetchSupplierProfile();

        // Reset states
        setProfileImage(null);
        setProfileImagePreview(null);
        setCatalogFile(null);

        setIsEditModalOpen(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
      setIsUploadingImage(false);
      setIsUploadingCatalog(false);
    }
  };

  const handleDownloadCatalog = () => {
    if (profile?.catalogUrl) {
      window.open(profile.catalogUrl, '_blank');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("selectedPropertyId");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="sp-supplier-app-layout">
        <Nav />
        <div className="sp-supplier-loading">
          <div className="sp-supplier-loader"></div>
          <p>Loading supplier profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-supplier-app-layout">
      {!isEditModalOpen && <Nav />}
      <div className="sp-supplier-profile-container">
        {/* Content Wrapper */}
        <div className="sp-supplier-content-wrapper">
          {/* Profile Header Card */}
          <div className="sp-supplier-profile-header">
            <div className="sp-supplier-profile-header-left">
              <div className="sp-supplier-profile-image-container">
                <img
                  src={profile?.image || "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200"}
                  alt={profile?.companyName}
                  className="sp-supplier-company-logo"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200"
                  }}
                />
              </div>
              <div className="sp-supplier-profile-info">
                <h1 className="sp-supplier-profile-title">{profile?.companyName || 'Supplier Company'}</h1>
                <span className="sp-supplier-license-badge">
                  <Award size={16} />
                  {profile?.businessLicense || 'Not specified'}
                </span>

                {/* Contact Details */}
                <div className="sp-supplier-header-details">
                  <div className="sp-supplier-header-detail-item">
                    <div className="sp-supplier-header-detail-label">
                      <Phone size={12} />
                      Phone
                    </div>
                    <div className="sp-supplier-header-detail-value">
                      {profile?.phone || 'Not provided'}
                    </div>
                  </div>
                  <div className="sp-supplier-header-detail-item">
                    <div className="sp-supplier-header-detail-label">
                      <Mail size={12} />
                      Email
                    </div>
                    <div className="sp-supplier-header-detail-value">
                      {profile?.email || 'Not provided'}
                    </div>
                  </div>
                  <div className="sp-supplier-header-detail-item">
                    <div className="sp-supplier-header-detail-label">
                      <Globe size={12} />
                      Website
                    </div>
                    <div className="sp-supplier-header-detail-value">
                      {profile?.website !== 'Not provided' ? (
                        <a href={profile?.website} target="_blank" rel="noopener noreferrer">
                          {profile?.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </div>
                  <div className="sp-supplier-header-detail-item sp-supplier-header-address">
                    <div className="sp-supplier-header-detail-label">
                      <MapPin size={12} />
                      Address
                    </div>
                    <div className="sp-supplier-header-detail-value">
                      {profile?.address || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sp-supplier-header-actions">
              <button
                className="sp-supplier-edit-button"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </button>
              <button
                className="sp-supplier-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="sp-supplier-tab-navigation">
            <button
              className={`sp-supplier-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Business Overview
            </button>
            <button
              className={`sp-supplier-tab-button ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              Product Catalog
            </button>
            <button
              className={`sp-supplier-tab-button ${activeTab === 'service' ? 'active' : ''}`}
              onClick={() => setActiveTab('service')}
            >
              Service Information
            </button>
          </div>

          {/* Tab Content */}
          <div className="sp-supplier-tab-content">
            {/* Business Overview Tab */}
            {activeTab === 'overview' && (
              <div className="sp-supplier-tab-panel">
                <h2 className="sp-supplier-section-title">Business Information</h2>
                <div className="sp-supplier-info-grid">
                  <div className="sp-supplier-info-card">
                    <Calendar size={24} color="#00A5A9" />
                    <div>
                      <div className="sp-supplier-info-label">Years in Business</div>
                      <div className="sp-supplier-info-value">
                        {profile?.yearsInBusiness || 0} Years
                      </div>
                    </div>
                  </div>
                  <div className="sp-supplier-info-card">
                    <Award size={24} color="#F39C12" />
                    <div>
                      <div className="sp-supplier-info-label">Business License</div>
                      <div className="sp-supplier-info-value">
                        {profile?.businessLicense || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Areas */}
                <h2 className="sp-supplier-section-title" style={{ marginTop: '1.5rem' }}>Delivery Areas</h2>
                <div className="sp-supplier-service-areas">
                  {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                    <div className="sp-supplier-areas-grid">
                      {profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-supplier-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="sp-supplier-no-data">No delivery areas specified</p>
                  )}
                </div>
              </div>
            )}

            {/* Product Catalog Tab */}
            {activeTab === 'catalog' && (
              <div className="sp-supplier-tab-panel">
                <h2 className="sp-supplier-section-title">Product Catalog</h2>
                <div className="sp-supplier-catalog-section">
                  {profile?.catalogUrl ? (
                    <div className="sp-supplier-catalog-card">
                      <div className="sp-supplier-catalog-icon">
                        <FileText size={48} color="#00A5A9" />
                      </div>
                      <div className="sp-supplier-catalog-info">
                        <h3>Product Catalog PDF</h3>
                        <p>View our complete product catalog with pricing and specifications</p>
                        <button
                          className="sp-supplier-download-btn"
                          onClick={handleDownloadCatalog}
                        >
                          <Download size={18} />
                          Download Catalog
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="sp-supplier-no-catalog">
                      <FileText size={64} color="#ccc" />
                      <h3>No Catalog Uploaded</h3>
                      <p>Upload a PDF catalog to showcase your products to potential clients</p>
                      <button
                        className="sp-supplier-upload-catalog-btn"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Upload size={18} />
                        Upload Catalog
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Information Tab */}
            {activeTab === 'service' && (
              <div className="sp-supplier-tab-panel">
                <h2 className="sp-supplier-section-title">Delivery Coverage</h2>
                <div className="sp-supplier-service-areas">
                  {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                    <div className="sp-supplier-areas-grid">
                      {profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-supplier-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="sp-supplier-no-data">No delivery areas specified</p>
                  )}
                </div>

                <h2 className="sp-supplier-section-title" style={{ marginTop: '1.5rem' }}>Company Experience</h2>
                <div className="sp-supplier-info-grid">
                  <div className="sp-supplier-info-card">
                    <Calendar size={24} color="#F39C12" />
                    <div>
                      <div className="sp-supplier-info-label">Years in Business</div>
                      <div className="sp-supplier-info-value">
                        {profile?.yearsInBusiness || 0} years in the construction supply industry
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Supplier Profile Modal */}
      {isEditModalOpen && (
        <div className="sp-profile-edit-modal-backdrop">
          <div className="sp-profile-edit-modal-container">
            <div className="sp-profile-edit-modal-header">
              <div className="sp-profile-edit-header-content">
                <h2 className="sp-profile-edit-modal-title">Edit Supplier Profile</h2>
                <p className="sp-profile-edit-modal-subtitle">Update your business information</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="sp-profile-edit-close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="sp-profile-edit-modal-body">
              {/* Profile Image Upload */}
              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Company Logo</label>
                <div className="sp-profile-edit-image-upload-container">
                  <div className="sp-profile-edit-image-preview">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" className="sp-profile-edit-preview-img" />
                    ) : profile?.image ? (
                      <img src={profile.image} alt="Current" className="sp-profile-edit-preview-img" />
                    ) : (
                      <div className="sp-profile-edit-no-image">
                        <Camera size={40} />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="sp-profile-edit-image-actions">
                    <label className="sp-profile-edit-upload-btn">
                      <Upload size={18} />
                      {profileImage ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {(profileImage || profileImagePreview) && (
                      <button
                        type="button"
                        className="sp-profile-edit-remove-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={18} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="sp-profile-edit-image-hint">Recommended: Square image, max 5MB (JPG, PNG)</p>
                </div>
              </div>

              {/* Catalog Upload */}
              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Product Catalog (PDF)</label>
                <div className="sp-profile-edit-catalog-upload">
                  <label className="sp-profile-edit-catalog-upload-btn">
                    <FileText size={20} />
                    {catalogFile ? catalogFile.name : 'Upload Catalog PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleCatalogSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {catalogFile && (
                    <button
                      type="button"
                      className="sp-profile-edit-remove-btn"
                      onClick={() => setCatalogFile(null)}
                    >
                      <X size={18} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="sp-profile-edit-image-hint">Upload your product catalog (PDF, max 50MB)</p>
              </div>

              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="sp-profile-edit-form-input"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Business License *</label>
                <input
                  type="text"
                  name="business_license"
                  value={formData.business_license}
                  onChange={handleInputChange}
                  className="sp-profile-edit-form-input"
                  placeholder="Enter business license number"
                />
              </div>

              <div className="sp-profile-edit-form-row">
                <div className="sp-profile-edit-form-group">
                  <label className="sp-profile-edit-form-label">Years in Business</label>
                  <input
                    type="number"
                    name="years_in_business"
                    value={formData.years_in_business}
                    onChange={handleInputChange}
                    className="sp-profile-edit-form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="sp-profile-edit-form-group">
                  <label className="sp-profile-edit-form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="sp-profile-edit-form-input"
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
              </div>

              <div className="sp-profile-edit-form-row">
                <div className="sp-profile-edit-form-group">
                  <label className="sp-profile-edit-form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="sp-profile-edit-form-input"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="sp-profile-edit-form-group">
                  <label className="sp-profile-edit-form-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="sp-profile-edit-form-input"
                    placeholder="https://www.yourcompany.com"
                  />
                </div>
              </div>

              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Business Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="sp-profile-edit-form-textarea"
                  placeholder="Enter your business address"
                  rows="3"
                />
              </div>

              <div className="sp-profile-edit-form-group">
                <label className="sp-profile-edit-form-label">Delivery Areas</label>
                <div className="sp-profile-edit-specializations-grid">
                  {serviceAreaOptions.map(area => (
                    <label key={area} className="sp-profile-edit-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.delivery_areas.includes(area)}
                        onChange={() => handleServiceAreaChange(area)}
                        className="sp-profile-edit-checkbox-input"
                      />
                      <span className="sp-profile-edit-checkbox-text">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sp-profile-edit-button-group">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="sp-profile-edit-cancel-btn"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="sp-profile-edit-submit-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      {isUploadingImage ? 'Uploading Image...' : isUploadingCatalog ? 'Uploading Catalog...' : 'Saving Changes...'}
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierProfile;
