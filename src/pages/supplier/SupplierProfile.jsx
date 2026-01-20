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
  Minus,
  Settings
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/supplier/supplierprofile-modern.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';

function SupplierProfile() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, language, changeLanguage, languages } = useLanguage();
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
    account: t('supplierProfile.account'),
    overview: t('supplierProfile.overview'),
    catalog: t('supplierProfile.catalog'),
    service: t('supplierProfile.service'),
    settings: t('supplierProfile.settings')
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
          companyName: data.profile.company_name || '',
          businessLicense: data.profile.business_license || '',
          yearsInBusiness: data.profile.years_in_business || 0,
          address: data.profile.address || '',
          phone: data.profile.phone || 'Not provided',
          email: data.profile.email || '',
          website: data.profile.website || 'Not provided',
          deliveryAreas: data.profile.delivery_areas || [],
          catalogUrl: data.profile.catalog_pdf_url || null,
          image: data.profile.profile_image_url || null
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
        toast.error(t('supplierProfile.selectValidImage'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('supplierProfile.imageSizeLimit'));
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
        toast.error(t('supplierProfile.selectPdfFile'));
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(t('supplierProfile.pdfSizeLimit'));
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
      toast.error(t('supplierProfile.fillRequiredFields'));
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
        toast.success(t('supplierProfile.profileUpdatedSuccess'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('supplierProfile.failedToUpdate'));
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("userProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
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
    const labels = [
      t('supplierProfile.veryWeak'),
      t('supplierProfile.weak'),
      t('supplierProfile.fair'),
      t('supplierProfile.good'),
      t('supplierProfile.strong')
    ];
    return labels[strength - 1] || t('supplierProfile.veryWeak');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('supplierProfile.allFieldsRequired'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('supplierProfile.passwordsMustMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('supplierProfile.passwordMinLength'));
      return;
    }

    setIsChangingPassword(true);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error(t('supplierProfile.pleaseLoginToChange'));
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

      setPasswordSuccess(t('supplierProfile.passwordChangedSuccess'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success(t('supplierProfile.passwordChangedSuccess'));
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
          <p>{t('supplierProfile.loadingProfile')}</p>
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
              <h3>{profile?.companyName || t('supplierProfile.supplier')}</h3>
              <span>{t('supplierProfile.supplier')}</span>
            </div>
          </div>

          <nav className="sp-sidebar-nav">
            <button
              className={`sp-nav-item ${activeTab === 'account' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>{t('supplierProfile.account')}</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'overview' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <BarChart3 size={18} />
              <span>{t('supplierProfile.overview')}</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'catalog' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('catalog')}
            >
              <FileText size={18} />
              <span>{t('supplierProfile.catalog')}</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'service' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('service')}
            >
              <Truck size={18} />
              <span>{t('supplierProfile.service')}</span>
            </button>
            <button
              className={`sp-nav-item ${activeTab === 'settings' ? 'sp-nav-active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={18} />
              <span>{t('supplierProfile.settings')}</span>
            </button>
          </nav>

          <div className="sp-sidebar-footer">
            <button className="sp-nav-item sp-nav-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>{t('supplierProfile.logout')}</span>
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
                    <h2>{t('supplierProfile.accountInformation')}</h2>
                    <p>{t('supplierProfile.manageCompanyProfile')}</p>
                  </div>
                  <button className="sp-btn sp-btn-primary sp-desktop-only" onClick={() => setIsEditModalOpen(true)}>
                    <Edit size={16} />
                    {t('supplierProfile.editProfile')}
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
                          {t('supplierProfile.supplier')}
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
                  <h4 className="sp-info-section-title">{t('supplierProfile.companyInformation')}</h4>
                  <div className="sp-info-grid-modern">
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Building2 size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.companyName')}</label>
                        <span>{profile?.companyName}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Award size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.businessLicense')}</label>
                        <span>{profile?.businessLicense}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Calendar size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.yearsInBusiness')}</label>
                        <span>{profile?.yearsInBusiness} {t('supplierProfile.years')}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Globe size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.website')}</label>
                        <span>{profile?.website !== 'Not provided' ? (
                          <a href={profile?.website} target="_blank" rel="noopener noreferrer">
                            {profile?.website}
                          </a>
                        ) : t('supplierProfile.notProvided')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">{t('supplierProfile.contactInformation')}</h4>
                  <div className="sp-info-grid-modern">
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Mail size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.email')}</label>
                        <span>{profile?.email}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern">
                      <div className="sp-info-icon-modern">
                        <Phone size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.phone')}</label>
                        <span>{profile?.phone}</span>
                      </div>
                    </div>
                    <div className="sp-info-item-modern sp-info-full-width">
                      <div className="sp-info-icon-modern">
                        <MapPin size={18} />
                      </div>
                      <div className="sp-info-details">
                        <label>{t('supplierProfile.address')}</label>
                        <span>{profile?.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Areas */}
                <div className="sp-delivery-section">
                  <h4 className="sp-info-section-title">{t('supplierProfile.deliveryAreas')}</h4>
                  <div className="sp-delivery-grid">
                    {profile?.deliveryAreas && profile.deliveryAreas.length > 0 ? (
                      profile.deliveryAreas.map((area) => (
                        <span key={area} className="sp-area-badge">
                          <MapPin size={14} />
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="sp-no-data">{t('supplierProfile.noDeliveryAreas')}</p>
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
                    <h2>{t('supplierProfile.businessOverview')}</h2>
                    <p>{t('supplierProfile.viewBusinessStats')}</p>
                  </div>
                </div>

                <div className="sp-stats-grid">
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon experience">
                      <Calendar size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">{t('supplierProfile.yearsInBusiness')}</span>
                      <span className="sp-stat-value">{profile?.yearsInBusiness || 0}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon rating">
                      <Award size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">{t('supplierProfile.businessLicense')}</span>
                      <span className="sp-stat-value">{profile?.businessLicense || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon coverage">
                      <Truck size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">{t('supplierProfile.deliveryAreas')}</span>
                      <span className="sp-stat-value">{profile?.deliveryAreas?.length || 0}</span>
                    </div>
                  </div>
                  <div className="sp-stat-card">
                    <div className="sp-stat-icon products">
                      <FileText size={24} />
                    </div>
                    <div className="sp-stat-content">
                      <span className="sp-stat-label">{t('supplierProfile.catalogStatus')}</span>
                      <span className="sp-stat-value">{profile?.catalogUrl ? t('supplierProfile.uploaded') : t('supplierProfile.notUploaded')}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Coverage */}
                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">
                    {t('supplierProfile.deliveryCoverage')}
                    {profile?.deliveryAreas?.length > 0 && (
                      <span className="sp-coverage-count">{profile.deliveryAreas.length} {t('supplierProfile.areas')}</span>
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
                    <p className="sp-empty-text">{t('supplierProfile.noDeliveryAreas')}</p>
                  )}
                </div>
              </>
            )}

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>{t('supplierProfile.productCatalog')}</h2>
                    <p>{t('supplierProfile.manageCatalog')}</p>
                  </div>
                </div>

                <div className="sp-catalog-section">
                  {profile?.catalogUrl ? (
                    <div className="sp-catalog-card">
                      <div className="sp-catalog-icon">
                        <FileText size={48} />
                      </div>
                      <div className="sp-catalog-info">
                        <h3>{t('supplierProfile.productCatalogPDF')}</h3>
                        <p>{t('supplierProfile.viewCatalogDescription')}</p>
                        <button
                          className="sp-btn sp-btn-primary"
                          onClick={handleDownloadCatalog}
                        >
                          <Download size={18} />
                          {t('supplierProfile.downloadCatalog')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="sp-no-catalog">
                      <FileText size={64} />
                      <h3>{t('supplierProfile.noCatalogUploaded')}</h3>
                      <p>{t('supplierProfile.uploadCatalogDescription')}</p>
                      <button
                        className="sp-btn sp-btn-primary"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Upload size={18} />
                        {t('supplierProfile.uploadCatalog')}
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
                    <h2>{t('supplierProfile.serviceInformation')}</h2>
                    <p>{t('supplierProfile.viewDeliveryCoverage')}</p>
                  </div>
                </div>

                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">
                    {t('supplierProfile.deliveryCoverage')}
                    {profile?.deliveryAreas?.length > 0 && (
                      <span className="sp-coverage-count">{profile.deliveryAreas.length} {t('supplierProfile.areas')}</span>
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
                    <p className="sp-empty-text">{t('supplierProfile.noDeliveryAreas')}</p>
                  )}
                </div>

                <div className="sp-info-section">
                  <h4 className="sp-info-section-title">{t('supplierProfile.companyExperience')}</h4>
                  <div className="sp-stats-grid sp-stats-2col">
                    <div className="sp-stat-card">
                      <div className="sp-stat-icon experience">
                        <Calendar size={24} />
                      </div>
                      <div className="sp-stat-content">
                        <span className="sp-stat-label">{t('supplierProfile.yearsInIndustry')}</span>
                        <span className="sp-stat-value">{profile?.yearsInBusiness || 0} {t('supplierProfile.years')}</span>
                      </div>
                    </div>
                    <div className="sp-stat-card">
                      <div className="sp-stat-icon coverage">
                        <Truck size={24} />
                      </div>
                      <div className="sp-stat-content">
                        <span className="sp-stat-label">{t('supplierProfile.serviceAreas')}</span>
                        <span className="sp-stat-value">{profile?.deliveryAreas?.length || 0} {t('supplierProfile.locations')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                <div className="sp-content-header">
                  <div className="sp-content-header-left">
                    <h2>{t('supplierProfile.settings')}</h2>
                    <p>{t('supplierProfile.managePreferences')}</p>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="sp-settings-section">
                  <div className="sp-settings-card">
                    <div className="sp-settings-card-header">
                      <div className="sp-settings-icon">
                        <Globe size={20} />
                      </div>
                      <div className="sp-settings-info">
                        <h3>{t('supplierProfile.language')}</h3>
                        <p>{t('supplierProfile.chooseLanguage')}</p>
                      </div>
                    </div>
                    <div className="sp-language-options">
                      {Object.values(languages).map((lang) => (
                        <button
                          key={lang.code}
                          className={`sp-language-option ${language === lang.code ? 'active' : ''}`}
                          onClick={() => changeLanguage(lang.code)}
                        >
                          <span className="sp-language-flag">{lang.flag}</span>
                          <div className="sp-language-details">
                            <span className="sp-language-name">{lang.nativeName}</span>
                            <span className="sp-language-native">{t(`supplierProfile.language${lang.code === 'en' ? 'English' : 'French'}`)}</span>
                          </div>
                          {language === lang.code && (
                            <Check size={18} className="sp-language-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="sp-settings-section">
                  <div className="sp-settings-card">
                    <div className="sp-settings-card-header">
                      <div className="sp-settings-icon">
                        <Key size={20} />
                      </div>
                      <div className="sp-settings-info">
                        <h3>{t('supplierProfile.changePassword')}</h3>
                        <p>{t('supplierProfile.updatePassword')}</p>
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
                        <label>{t('supplierProfile.currentPassword')}</label>
                        <div className="sp-input-wrapper">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('supplierProfile.enterCurrentPassword')}
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
                        <label>{t('supplierProfile.newPassword')}</label>
                        <div className="sp-input-wrapper">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('supplierProfile.enterNewPassword')}
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
                                <Check size={12} /> {t('supplierProfile.characters')}
                              </span>
                              <span className={`sp-req-item ${/[A-Z]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                                <Check size={12} /> {t('supplierProfile.uppercase')}
                              </span>
                              <span className={`sp-req-item ${/[a-z]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                                <Check size={12} /> {t('supplierProfile.lowercase')}
                              </span>
                              <span className={`sp-req-item ${/[0-9]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                                <Check size={12} /> {t('supplierProfile.number')}
                              </span>
                              <span className={`sp-req-item ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'sp-req-met' : ''}`}>
                                <Check size={12} /> {t('supplierProfile.specialChar')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="sp-form-group">
                        <label>{t('supplierProfile.confirmNewPassword')}</label>
                        <div className="sp-input-wrapper">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('supplierProfile.confirmPasswordPlaceholder')}
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
                          <span className="sp-input-error">{t('supplierProfile.passwordsDoNotMatch')}</span>
                        )}
                      </div>

                      <div className="sp-form-actions">
                        <button
                          type="button"
                          className="sp-btn sp-btn-ghost"
                          onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                          disabled={isChangingPassword}
                        >
                          {t('supplierProfile.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="sp-btn sp-btn-primary"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <span className="sp-spinner"></span>
                              {t('supplierProfile.changing')}
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              {t('supplierProfile.changePassword')}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Supplier Profile Modal - Compact & Formal */}
      {isEditModalOpen && (
        <div className="sp-edit-modal-backdrop">
          <div className="sp-edit-modal-container sp-edit-compact">
            <div className="sp-edit-modal-header">
              <h2 className="sp-edit-modal-title">{t('supplierProfile.editProfile')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="sp-edit-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="sp-edit-modal-body">
              {/* Logo & Catalog Row */}
              <div className="sp-edit-uploads-row">
                <div className="sp-edit-upload-item">
                  <div className="sp-edit-image-preview-compact">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" />
                    ) : profile?.image ? (
                      <img src={profile.image} alt="Current" />
                    ) : (
                      <Camera size={24} />
                    )}
                  </div>
                  <div className="sp-edit-upload-actions">
                    <label className="sp-edit-upload-link">
                      {profileImage ? t('supplierProfile.change') : t('supplierProfile.uploadLogo')}
                      <input type="file" accept="image/*" onChange={handleImageSelect} hidden />
                    </label>
                    {(profileImage || profileImagePreview) && (
                      <button type="button" className="sp-edit-remove-link" onClick={handleRemoveImage}>
                        {t('supplierProfile.remove')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="sp-edit-upload-item">
                  <div className="sp-edit-catalog-preview">
                    <FileText size={24} />
                  </div>
                  <div className="sp-edit-upload-actions">
                    <label className="sp-edit-upload-link">
                      {catalogFile ? catalogFile.name.substring(0, 15) + '...' : t('supplierProfile.uploadCatalog')}
                      <input type="file" accept="application/pdf" onChange={handleCatalogSelect} hidden />
                    </label>
                    {catalogFile && (
                      <button type="button" className="sp-edit-remove-link" onClick={() => setCatalogFile(null)}>
                        {t('supplierProfile.remove')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="sp-edit-form-grid">
                <div className="sp-edit-field sp-edit-full">
                  <label>{t('supplierProfile.companyName')} <span>*</span></label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder={t('supplierProfile.companyName')}
                  />
                </div>

                <div className="sp-edit-field">
                  <label>{t('supplierProfile.businessLicense')} <span>*</span></label>
                  <input
                    type="text"
                    name="business_license"
                    value={formData.business_license}
                    onChange={handleInputChange}
                    placeholder={t('supplierProfile.licenseNumber')}
                  />
                </div>

                <div className="sp-edit-field">
                  <label>{t('supplierProfile.yearsInBusiness')}</label>
                  <input
                    type="number"
                    name="years_in_business"
                    value={formData.years_in_business}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="sp-edit-field">
                  <label>{t('supplierProfile.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div className="sp-edit-field">
                  <label>{t('supplierProfile.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@company.com"
                  />
                </div>

                <div className="sp-edit-field sp-edit-full">
                  <label>{t('supplierProfile.website')}</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.company.com"
                  />
                </div>

                <div className="sp-edit-field sp-edit-full">
                  <label>{t('supplierProfile.businessAddress')} <span>*</span></label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t('supplierProfile.fullBusinessAddress')}
                    rows="2"
                  />
                </div>
              </div>

              {/* Delivery Areas - Compact */}
              <div className="sp-edit-delivery-compact">
                <div className="sp-edit-delivery-header">
                  <label>{t('supplierProfile.deliveryAreas')}</label>
                  <span className="sp-edit-count">{formData.delivery_areas.length}</span>
                </div>
                <div className="sp-edit-delivery-input">
                  <input
                    type="text"
                    value={newDeliveryArea}
                    onChange={(e) => setNewDeliveryArea(e.target.value)}
                    onKeyPress={handleDeliveryAreaKeyPress}
                    placeholder={t('supplierProfile.addArea')}
                  />
                  <button type="button" onClick={addDeliveryArea} disabled={!newDeliveryArea.trim()}>
                    <Plus size={16} />
                  </button>
                </div>
                {formData.delivery_areas.length > 0 && (
                  <div className="sp-edit-delivery-tags">
                    {formData.delivery_areas.map((area, index) => (
                      <span key={index} className="sp-edit-tag">
                        {area}
                        <button type="button" onClick={() => removeDeliveryArea(area)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sp-edit-modal-footer">
              <button onClick={() => setIsEditModalOpen(false)} className="sp-edit-btn-cancel" disabled={isUpdating}>
                {t('supplierProfile.cancel')}
              </button>
              <button onClick={handleSubmit} className="sp-edit-btn-save" disabled={isUpdating}>
                {isUpdating ? t('supplierProfile.saving') : t('supplierProfile.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierProfile;
