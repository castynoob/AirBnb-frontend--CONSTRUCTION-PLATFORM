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
  Award,
  LogOut,
  User,
  Shield,
  Package,
  Menu,
  Edit,
  Lock,
  Eye,
  EyeOff,
  Key,
  Check,
  AlertCircle,
  BarChart3,
  Plus,
  Minus
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/supplier/supplierprofile-modern.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function SupplierProfile() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState('account');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [catalogFile, setCatalogFile] = useState(null);
  const [isUploadingCatalog, setIsUploadingCatalog] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Tab labels for mobile header
  const tabLabels = {
    account: 'Account',
    overview: 'Overview',
    catalog: 'Catalog',
    service: 'Service',
    security: 'Security'
  };

  // State for new delivery area input
  const [newDeliveryArea, setNewDeliveryArea] = useState('');

  // Add a new delivery area
  const addDeliveryArea = () => {
    const trimmedArea = newDeliveryArea.trim();
    if (trimmedArea && !formData.delivery_areas.includes(trimmedArea)) {
      setFormData(prev => ({
        ...prev,
        delivery_areas: [...prev.delivery_areas, trimmedArea]
      }));
      setNewDeliveryArea('');
    }
  };

  // Remove a delivery area
  const removeDeliveryArea = (areaToRemove) => {
    setFormData(prev => ({
      ...prev,
      delivery_areas: prev.delivery_areas.filter(area => area !== areaToRemove)
    }));
  };

  // Handle Enter key to add delivery area
  const handleDeliveryAreaKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeliveryArea();
    }
  };

  useEffect(() => {
    fetchSupplierProfile();
  }, []);

  const fetchSupplierProfile = async () => {
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
          image: data.profile.profile_image_url || data.profile.catalog_pdf_url
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
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
        toast.error('Please select a PDF file');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error('PDF size should not exceed 50MB');
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
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
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
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
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

  // Password change functions
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    return colors[strength - 1] || colors[0];
  };

  const getStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength - 1] || 'Very Weak';
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error('Please log in to change password');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully!');
    } catch (error) {
      setPasswordError(error.message);
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sp-profile-page-modern">
        <Nav />
        <div className="sp-loading-container">
          <div className="sp-loader"></div>
          <p>Loading supplier profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-profile-page-modern">
      <Nav />

      <div className="sp-layout">
        {/* Mobile Header */}
        <div className="sp-mobile-header">
          <button
            className="sp-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="sp-mobile-title">{tabLabels[activeTab]}</span>
          <div className="sp-mobile-actions">
            {activeTab === 'account' && (
              <button
                className="sp-mobile-action-btn"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit Profile"
              >
                <Edit size={18} />
              </button>
            )}
            <button
              className="sp-mobile-action-btn sp-mobile-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="sp-mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`sp-sidebar ${isMobileSidebarOpen ? 'sp-sidebar-open' : ''}`}>
          <button
            className="sp-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>

          <div className="sp-sidebar-header">
            <div className="sp-sidebar-avatar">
              {profile?.image ? (
                <img src={profile.image} alt={profile.companyName} />
              ) : (
                <Package size={24} />
              )}
            </div>
            <div className="sp-sidebar-user">
              <h3>{profile?.companyName || 'Supplier'}</h3>
              <span>Supplier</span>
            </div>
          </div>

          <nav className="sp-sidebar-nav">
            <button
              className={`sp-nav-item ${activeTab === 'account' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>Account</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'overview' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <BarChart3 size={18} />
              <span>Overview</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'catalog' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('catalog')}
            >
              <FileText size={18} />
              <span>Catalog</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'service' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('service')}
            >
              <Truck size={18} />
              <span>Service</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'security' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('security')}
            >
              <Shield size={18} />
              <span>Security</span>
            </button>
          </nav>

          <div className="sp-sidebar-footer">
            <button className="sp-nav-item sp-nav-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="sp-main-content">
          <div className="sp-tab-content">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>Account Information</h2>
                    <p>Manage your company profile and contact details</p>
                  </div>
                  <button className="sp-btn sp-btn-primary sp-desktop-only" onClick={() => setIsEditModalOpen(true)}>
                    <Edit size={16} />
                    Edit Profile
                  </button>
                </div>

                {/* Profile Card */}
                <div className="sp-profile-card-modern">
                  <div className="sp-profile-card-left">
                    <div className="sp-avatar-container">
                      <div className="sp-avatar-modern">
                        {profile?.image ? (
                          <img src={profile.image} alt={profile.companyName} />
                        ) : (
                          <Package size={36} />
                        )}
                      </div>
                    </div>
                    <div className="sp-profile-info-modern">
                      <h3>{profile?.companyName}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span className="sp-role-tag-modern">
                          <Package size={12} />
                          Supplier
                        </span>
                        <span className="sp-license-badge">
                          <Award size={12} />
                          {profile?.businessLicense}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">Company Information</h4>
                  <div className="sp-info-grid-modern">
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Building2 size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Company Name</label>
                        <span>{profile?.companyName}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Award size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Business License</label>
                        <span>{profile?.businessLicense}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Calendar size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Years in Business</label>
                        <span>{profile?.yearsInBusiness} years</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Globe size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Website</label>
                        <span>{profile?.website !== 'Not provided' ? (
                          <a href={profile?.website} target="_blank" rel="noopener noreferrer">
                            {profile?.website}
                          </a>
                        ) : 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">Contact Information</h4>
                  <div className="sp-info-grid-modern">
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Mail size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Email</label>
                        <span>{profile?.email}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Phone size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Phone</label>
                        <span>{profile?.phone}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern sp-info-full-width">
                      <div className="sp-info-icon-modern">
                        <MapPin size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>Address</label>
                        <span>{profile?.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Areas */}
                <div className="sp-delivery-section">
                  <h4 className="sp-info-section-title">Delivery Areas</h4>
                  <div className="sp-delivery-grid">
                    {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                      profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="sp-no-data">No delivery areas specified</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>Business Overview</h2>
                    <p>View your business statistics and performance</p>
                  </div>
                </div>

                <div className="sp-stats-grid">
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon experience">
                      <Calendar size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">Years in Business</span>
                      <span className="sp-stat-value">{profile?.yearsInBusiness || 0}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon rating">
                      <Award size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">Business License</span>
                      <span className="sp-stat-value">{profile?.businessLicense || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon coverage">
                      <Truck size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">Delivery Areas</span>
                      <span className="sp-stat-value">{profile?.deliveryAreas?.length || 0}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon products">
                      <FileText size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">Catalog Status</span>
                      <span className="sp-stat-value">{profile?.catalogUrl ? 'Uploaded' : 'Not Uploaded'}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Coverage */}
                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">
                    Delivery Coverage
                    {profile?.deliveryAreas?.length > 0 && (
                      <span className="sp-coverage-count">{profile.deliveryAreas.length} areas</span>
                    )}
                  </h4>
                  {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                    <div className="sp-delivery-grid">
                      {profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="sp-empty-text">No delivery areas specified</p>
                  )}
                </div>
              </>
            )}

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>Product Catalog</h2>
                    <p>Manage your product catalog and documentation</p>
                  </div>
                </div>

                <div className="sp-catalog-section">
                  {profile?.catalogUrl ? (
                    <div className="sp-catalog-card">
                      <div className="sp-catalog-icon">
                        <FileText size={48} />
                      </div>
                      <div className="sp-catalog-info">
                        <h3>Product Catalog PDF</h3>
                        <p>View our complete product catalog with pricing and specifications</p>
                        <button
                          className="sp-btn sp-btn-primary"
                          onClick={handleDownloadCatalog}
                        >
                          <Download size={18} />
                          Download Catalog
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="sp-no-catalog">
                      <FileText size={64} />
                      <h3>No Catalog Uploaded</h3>
                      <p>Upload a PDF catalog to showcase your products to potential clients</p>
                      <button
                        className="sp-btn sp-btn-primary"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Upload size={18} />
                        Upload Catalog
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Service Tab */}
            {activeTab === 'service' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>Service Information</h2>
                    <p>View delivery coverage and service areas</p>
                  </div>
                </div>

                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">
                    Delivery Coverage
                    {profile?.deliveryAreas?.length > 0 && (
                      <span className="sp-coverage-count">{profile.deliveryAreas.length} areas</span>
                    )}
                  </h4>
                  {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                    <div className="sp-delivery-grid">
                      {profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="sp-empty-text">No delivery areas specified</p>
                  )}
                </div>

                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">Company Experience</h4>
                  <div className="sp-stats-grid sp-stats-2col">
                    <div className="sp-stat-card">
                      <div className="sp-stat-icon experience">
                        <Calendar size={24} />
                      </div>
                      <div className="sp-stat-content">
                        <span className="sp-stat-label">Years in Industry</span>
                        <span className="sp-stat-value">{profile?.yearsInBusiness || 0} years</span>
                      </div>
                    </div>
                    <div className="sp-stat-card">
                      <div className="sp-stat-icon coverage">
                        <Truck size={24} />
                      </div>
                      <div className="sp-stat-content">
                        <span className="sp-stat-label">Service Areas</span>
                        <span className="sp-stat-value">{profile?.deliveryAreas?.length || 0} locations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>Security Settings</h2>
                    <p>Manage your password and security preferences</p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="sp-security-section">
                  <div className="sp-security-header">
                    <div className="sp-security-header-left">
                      <div className="sp-security-icon">
                        <Key size={20} />
                      </div>
                      <div>
                        <h3 className="sp-security-title">Change Password</h3>
                        <p className="sp-security-subtitle">Update your account password</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="sp-password-form-modern">
                    {passwordError && (
                      <div className="sp-alert sp-alert-error">
                        <AlertCircle size={18} />
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="sp-alert sp-alert-success">
                        <Check size={18} />
                        {passwordSuccess}
                      </div>
                    )}

                    <div className="sp-form-group">
                      <label>Current Password</label>
                      <div className="sp-input-wrapper">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="sp-input-toggle"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="sp-form-group">
                      <label>New Password</label>
                      <div className="sp-input-wrapper">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="sp-input-toggle"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordForm.newPassword && (
                        <>
                          <div className="sp-strength-indicator">
                            <div className="sp-strength-bar-modern">
                              <div
                                className="sp-strength-fill-modern"
                                style={{
                                  width: `${(getPasswordStrength(passwordForm.newPassword) / 5) * 100}%`,
                                  backgroundColor: getStrengthColor(getPasswordStrength(passwordForm.newPassword))
                                }}
                              />
                            </div>
                            <span style={{ color: getStrengthColor(getPasswordStrength(passwordForm.newPassword)) }}>
                              {getStrengthLabel(getPasswordStrength(passwordForm.newPassword))}
                            </span>
                          </div>
                          <div className="sp-requirements-grid">
                            <span className={`sp-req-item ${passwordForm.newPassword.length >= 8 ? 'sp-req-met' : ''}`}>
                              <Check size={12} /> 8+ characters
                            </span>
                            <span className={`sp-req-item ${/[A-Z]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                              <Check size={12} /> Uppercase
                            </span>
                            <span className={`sp-req-item ${/[a-z]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                              <Check size={12} /> Lowercase
                            </span>
                            <span className={`sp-req-item ${/[0-9]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                              <Check size={12} /> Number
                            </span>
                            <span className={`sp-req-item ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                              <Check size={12} /> Special char
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="sp-form-group">
                      <label>Confirm New Password</label>
                      <div className="sp-input-wrapper">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordInputChange}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="sp-input-toggle"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <span className="sp-input-error">Passwords do not match</span>
                      )}
                    </div>

                    <div className="sp-form-actions">
                      <button
                        type="button"
                        className="sp-btn sp-btn-ghost"
                        onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="sp-btn sp-btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="sp-spinner"></span>
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Supplier Profile Modal */}
      {isEditModalOpen && (
        <div className="sp-edit-modal-backdrop">
          <div className="sp-edit-modal-container">
            <div className="sp-edit-modal-header">
              <div className="sp-edit-header-content">
                <h2 className="sp-edit-modal-title">Edit Supplier Profile</h2>
                <p className="sp-edit-modal-subtitle">Update your business information</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="sp-edit-close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="sp-edit-modal-body">
              {/* Profile Image Upload */}
              <div className="sp-edit-section">
                <div className="sp-edit-section-header">
                  <Camera size={18} className="sp-edit-section-icon" />
                  <span>Company Logo</span>
                </div>
                <div className="sp-edit-image-upload-container">
                  <div className="sp-edit-image-preview">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" className="sp-edit-preview-img" />
                    ) : profile?.image ? (
                      <img src={profile.image} alt="Current" className="sp-edit-preview-img" />
                    ) : (
                      <div className="sp-edit-no-image">
                        <Camera size={40} />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="sp-edit-image-actions">
                    <label className="sp-edit-upload-btn">
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
                        className="sp-edit-remove-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={18} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="sp-edit-image-hint">Recommended: Square image, max 5MB (JPG, PNG)</p>
                </div>
              </div>

              {/* Catalog Upload */}
              <div className="sp-edit-section">
                <div className="sp-edit-section-header">
                  <FileText size={18} className="sp-edit-section-icon" />
                  <span>Product Catalog (PDF)</span>
                </div>
                <div className="sp-edit-catalog-upload">
                  <label className="sp-edit-catalog-upload-btn">
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
                      className="sp-edit-remove-btn"
                      onClick={() => setCatalogFile(null)}
                    >
                      <X size={18} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="sp-edit-image-hint">Upload your product catalog (PDF, max 50MB)</p>
              </div>

              {/* Company Information Section */}
              <div className="sp-edit-section">
                <div className="sp-edit-section-header">
                  <Building2 size={18} className="sp-edit-section-icon" />
                  <span>Company Information</span>
                </div>

                <div className="sp-edit-form-group">
                  <label className="sp-edit-form-label">
                    <Building2 size={14} />
                    Company Name <span className="sp-edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="sp-edit-form-input"
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="sp-edit-form-group">
                  <label className="sp-edit-form-label">
                    <Award size={14} />
                    Business License <span className="sp-edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="business_license"
                    value={formData.business_license}
                    onChange={handleInputChange}
                    className="sp-edit-form-input"
                    placeholder="Enter business license number"
                  />
                </div>

                <div className="sp-edit-form-row">
                  <div className="sp-edit-form-group">
                    <label className="sp-edit-form-label">
                      <Calendar size={14} />
                      Years in Business
                    </label>
                    <input
                      type="number"
                      name="years_in_business"
                      value={formData.years_in_business}
                      onChange={handleInputChange}
                      className="sp-edit-form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="sp-edit-form-group">
                    <label className="sp-edit-form-label">
                      <Phone size={14} />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="sp-edit-form-input"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                </div>

                <div className="sp-edit-form-row">
                  <div className="sp-edit-form-group">
                    <label className="sp-edit-form-label">
                      <Mail size={14} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="sp-edit-form-input"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="sp-edit-form-group">
                    <label className="sp-edit-form-label">
                      <Globe size={14} />
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="sp-edit-form-input"
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>

                <div className="sp-edit-form-group">
                  <label className="sp-edit-form-label">
                    <MapPin size={14} />
                    Business Address <span className="sp-edit-required">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="sp-edit-form-textarea"
                    placeholder="Enter your business address"
                    rows="3"
                  />
                </div>
              </div>

              {/* Delivery Areas Section */}
              <div className="sp-edit-section">
                <div className="sp-edit-section-header">
                  <Truck size={18} className="sp-edit-section-icon" />
                  <span>Delivery Areas</span>
                  <span className="sp-edit-selected-count">
                    {formData.delivery_areas.length} added
                  </span>
                </div>

                {/* Add new delivery area input */}
                <div className="sp-delivery-input-container">
                  <input
                    type="text"
                    value={newDeliveryArea}
                    onChange={(e) => setNewDeliveryArea(e.target.value)}
                    onKeyPress={handleDeliveryAreaKeyPress}
                    placeholder="Enter delivery area (e.g., Manila, Cebu City)"
                    className="sp-delivery-input"
                  />
                  <button
                    type="button"
                    onClick={addDeliveryArea}
                    className="sp-delivery-add-btn"
                    disabled={!newDeliveryArea.trim()}
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>

                {/* List of added delivery areas */}
                <div className="sp-delivery-areas-list">
                  {formData.delivery_areas.length > 0 ? (
                    formData.delivery_areas.map((area, index) => (
                      <div key={index} className="sp-delivery-area-item">
                        <div className="sp-delivery-area-content">
                          <MapPin size={14} />
                          <span>{area}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeliveryArea(area)}
                          className="sp-delivery-remove-btn"
                          title="Remove area"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="sp-delivery-empty-text">No delivery areas added yet</p>
                  )}
                </div>
              </div>

              <div className="sp-edit-button-group">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="sp-edit-cancel-btn"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="sp-edit-submit-btn"
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
