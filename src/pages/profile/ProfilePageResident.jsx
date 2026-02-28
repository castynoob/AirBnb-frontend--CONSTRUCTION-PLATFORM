import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Mail,
  Phone,
  LogOut,
  Edit,
  Save,
  X,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Check,
  AlertCircle,
  Menu,
  Settings,
  Globe
} from 'lucide-react';
import Nav from '../../components/Nav';
import toast from 'react-hot-toast';
import '../../styles/resident/profilepageresident.css';
import { logout } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResidentProfile, useInvalidateResidentData } from '../../hooks/useResidentData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfilePageResident = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // TanStack Query: resident profile (shared with HomePageResident)
  const { data: profile = null, isLoading: profileLoading } = useResidentProfile();
  const { invalidateProfile } = useInvalidateResidentData();
  const loading = profileLoading && !profile;

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
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    unit_number: '',
    floor: '',
    building_section: '',
    move_in_date: '',
    show_email: true,
    show_phone: true,
    show_unit: true,
    show_move_in_date: false,
    allow_messages: true,
    show_online_status: true,
    contact_via_email: true,
    contact_via_phone: true,
    contact_via_message: true
  });

  // Language context
  const { t, language, changeLanguage, languages } = useLanguage();

  // Tab labels for mobile header
  const tabLabels = {
    account: t('profilePageResident.account'),
    settings: t('profilePageResident.settings')
  };

  // Sync profile data → form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        unit_number: profile.unit_number || '',
        floor: profile.floor || '',
        building_section: profile.building_section || '',
        move_in_date: profile.move_in_date ? profile.move_in_date.split('T')[0] : '',
        show_email: profile.show_email ?? true,
        show_phone: profile.show_phone ?? true,
        show_unit: profile.show_unit ?? true,
        show_move_in_date: profile.show_move_in_date ?? false,
        allow_messages: profile.allow_messages ?? true,
        show_online_status: profile.show_online_status ?? true,
        contact_via_email: profile.contact_via_email ?? true,
        contact_via_phone: profile.contact_via_phone ?? true,
        contact_via_message: profile.contact_via_message ?? true
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));

      const response = await fetch(`${API_BASE_URL}/api/residents/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      if (data.success) {
        invalidateProfile();
        setIsEditing(false);
        toast.success(t('profilePageResident.profileUpdatedSuccess'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t('profilePageResident.failedToSaveChanges'));
      toast.error(t('profilePageResident.failedToSaveChanges'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: profile.bio || '',
      unit_number: profile.unit_number || '',
      floor: profile.floor || '',
      building_section: profile.building_section || '',
      move_in_date: profile.move_in_date ? profile.move_in_date.split('T')[0] : '',
      show_email: profile.show_email ?? true,
      show_phone: profile.show_phone ?? true,
      show_unit: profile.show_unit ?? true,
      show_move_in_date: profile.show_move_in_date ?? false,
      allow_messages: profile.allow_messages ?? true,
      show_online_status: profile.show_online_status ?? true,
      contact_via_email: profile.contact_via_email ?? true,
      contact_via_phone: profile.contact_via_phone ?? true,
      contact_via_message: profile.contact_via_message ?? true
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    if (isEditing) {
      handleCancel();
    }
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
      t('profilePageResident.veryWeak'),
      t('profilePageResident.weak'),
      t('profilePageResident.fair'),
      t('profilePageResident.good'),
      t('profilePageResident.strong')
    ];
    return labels[strength - 1] || t('profilePageResident.veryWeak');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('profilePageResident.allFieldsRequired'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('profilePageResident.passwordsMustMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('profilePageResident.passwordMinLength'));
      return;
    }

    setIsChangingPassword(true);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        throw new Error(t('profilePageResident.pleaseLoginToChange'));
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

      setPasswordSuccess(t('profilePageResident.passwordChangedSuccess'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success(t('profilePageResident.passwordChangedSuccess'));
    } catch (error) {
      setPasswordError(error.message);
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    const email = userProfile?.email
    if (!email) return
    setIsSendingReset(true)
    try {
      await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      toast.success(t('profilePageResident.resetEmailSent'))
    } catch {
      toast.error(t('profilePageResident.resetEmailFailed'))
    } finally {
      setIsSendingReset(false)
    }
  }

  if (loading) {
    return (
      <div className="rp-profile-page">
        <Nav />
        <div className="rp-loading-container">
          <div className="rp-loader"></div>
          <p>{t('profilePageResident.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rp-profile-page">
        <Nav />
        <div className="rp-error-container">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button className="rp-btn rp-btn-primary" onClick={() => invalidateProfile()}>
            {t('profilePageResident.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-profile-page">
      <Nav />

      <div className="rp-layout">
        {/* Mobile Header */}
        <div className="rp-mobile-header">
          <button
            className="rp-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="rp-mobile-title">{tabLabels[activeTab]}</span>
          <div className="rp-mobile-actions">
            {activeTab === 'account' && !isEditing && (
              <button
                className="rp-mobile-action-btn"
                onClick={() => setIsEditing(true)}
                title="Edit Profile"
              >
                <Edit size={18} />
              </button>
            )}
            {activeTab === 'account' && isEditing && (
              <>
                <button
                  className="rp-mobile-action-btn rp-mobile-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                  title="Save"
                >
                  <Save size={18} />
                </button>
                <button
                  className="rp-mobile-action-btn"
                  onClick={handleCancel}
                  disabled={saving}
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </>
            )}
            <button
              className="rp-mobile-action-btn rp-mobile-logout-btn"
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
            className="rp-mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`rp-sidebar ${isMobileSidebarOpen ? 'rp-sidebar-open' : ''}`}>
          <button
            className="rp-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>

          <div className="rp-sidebar-header">
            <div className="rp-sidebar-avatar">
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.first_name} />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="rp-sidebar-user">
              <h3>{profile?.first_name} {profile?.last_name}</h3>
              <span>{t('profilePageResident.resident')}</span>
            </div>
          </div>

          <nav className="rp-sidebar-nav">
            <button
              className={`rp-nav-item ${activeTab === 'account' ? 'rp-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>{t('profilePageResident.account')}</span>
            </button>
            <button
              className={`rp-nav-item ${activeTab === 'settings' ? 'rp-nav-active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={18} />
              <span>{t('profilePageResident.settings')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="rp-main-content">
          <div className="rp-tab-content">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <>
                <div className="rp-content-header">
                  <div className="rp-content-header-left">
                    <h2>{t('profilePageResident.accountInformation')}</h2>
                    <p>{t('profilePageResident.manageProfileDetails')}</p>
                  </div>
                  {!isEditing ? (
                    <button className="rp-btn rp-btn-primary rp-desktop-only" onClick={() => setIsEditing(true)}>
                      <Edit size={16} />
                      {t('profilePageResident.editProfile')}
                    </button>
                  ) : (
                    <div className="rp-edit-actions rp-desktop-only">
                      <button className="rp-btn rp-btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? t('profilePageResident.saving') : t('profilePageResident.save')}
                      </button>
                      <button className="rp-btn rp-btn-ghost" onClick={handleCancel} disabled={saving}>
                        <X size={16} />
                        {t('profilePageResident.cancel')}
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rp-alert rp-alert-error">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                {/* Profile Card */}
                <div className="rp-profile-card">
                  <div className="rp-profile-card-left">
                    <div className="rp-avatar-container">
                      <div className="rp-avatar">
                        {profile?.profile_picture ? (
                          <img src={profile.profile_picture} alt={profile.first_name} />
                        ) : (
                          <User size={36} />
                        )}
                      </div>
                      {profile?.is_online && (
                        <span className="rp-online-indicator"></span>
                      )}
                    </div>
                    <div className="rp-profile-info">
                      <h3>{profile?.first_name} {profile?.last_name}</h3>
                      <span className="rp-role-tag">
                        <User size={12} />
                        {t('profilePageResident.resident')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">{t('profilePageResident.aboutMe')}</h4>
                  {isEditing ? (
                    <div className="rp-form-group">
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder={t('profilePageResident.bioPlaceholder')}
                        rows={4}
                        className="rp-form-textarea"
                      />
                    </div>
                  ) : (
                    <p className="rp-bio-text">
                      {profile?.bio || t('profilePageResident.noBioYet')}
                    </p>
                  )}
                </div>

                {/* Unit Information */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">{t('profilePageResident.unitInformation')}</h4>
                  {isEditing ? (
                    <div className="rp-form-grid">
                      <div className="rp-form-group">
                        <label className="rp-form-label">
                          <MapPin size={14} />
                          {t('profilePageResident.unitNumber')}
                        </label>
                        <input
                          type="text"
                          value={formData.unit_number}
                          onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                          placeholder="e.g., 101"
                          className="rp-form-input"
                        />
                      </div>
                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.floor')}</label>
                        <input
                          type="number"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          placeholder="e.g., 1"
                          className="rp-form-input"
                        />
                      </div>
                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.buildingSection')}</label>
                        <input
                          type="text"
                          value={formData.building_section}
                          onChange={(e) => setFormData({ ...formData, building_section: e.target.value })}
                          placeholder="e.g., North Wing"
                          className="rp-form-input"
                        />
                      </div>
                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.moveInDate')}</label>
                        <input
                          type="date"
                          value={formData.move_in_date}
                          onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                          className="rp-form-input"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rp-info-grid">
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>{t('profilePageResident.unit')}</label>
                          <span>{profile?.unit_number || t('profilePageResident.notSpecified')}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>{t('profilePageResident.floor')}</label>
                          <span>{profile?.floor || t('profilePageResident.notSpecified')}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>{t('profilePageResident.section')}</label>
                          <span>{profile?.building_section || t('profilePageResident.notSpecified')}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>{t('profilePageResident.moveInDate')}</label>
                          <span>
                            {profile?.move_in_date
                              ? new Date(profile.move_in_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                              : t('profilePageResident.notSpecified')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">{t('profilePageResident.contactInformation')}</h4>
                  <div className="rp-info-grid">
                    <div className="rp-info-item">
                      <div className="rp-info-icon">
                        <Mail size={18} />
                      </div>
                      <div className="rp-info-details">
                        <label>{t('profilePageResident.email')}</label>
                        <span>{profile?.email || t('profilePageResident.notProvided')}</span>
                      </div>
                    </div>
                    <div className="rp-info-item">
                      <div className="rp-info-icon">
                        <Phone size={18} />
                      </div>
                      <div className="rp-info-details">
                        <label>{t('profilePageResident.phone')}</label>
                        <span>{profile?.phone || t('profilePageResident.notProvided')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings (only when editing) */}
                {isEditing && (
                  <div className="rp-info-section">
                    <h4 className="rp-info-section-title">{t('profilePageResident.privacySettings')}</h4>
                    <div className="rp-privacy-settings">
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_email}
                          onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                        />
                        <span>{t('profilePageResident.showEmailToResidents')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_phone}
                          onChange={(e) => setFormData({ ...formData, show_phone: e.target.checked })}
                        />
                        <span>{t('profilePageResident.showPhoneToResidents')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_unit}
                          onChange={(e) => setFormData({ ...formData, show_unit: e.target.checked })}
                        />
                        <span>{t('profilePageResident.showUnitToResidents')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_move_in_date}
                          onChange={(e) => setFormData({ ...formData, show_move_in_date: e.target.checked })}
                        />
                        <span>{t('profilePageResident.showMoveInDate')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_online_status}
                          onChange={(e) => setFormData({ ...formData, show_online_status: e.target.checked })}
                        />
                        <span>{t('profilePageResident.showOnlineStatus')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.allow_messages}
                          onChange={(e) => setFormData({ ...formData, allow_messages: e.target.checked })}
                        />
                        <span>{t('profilePageResident.allowMessages')}</span>
                      </label>

                      <h5 className="rp-subsection-title">{t('profilePageResident.contactPreferences')}</h5>

                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_email}
                          onChange={(e) => setFormData({ ...formData, contact_via_email: e.target.checked })}
                        />
                        <span>{t('profilePageResident.allowContactViaEmail')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_phone}
                          onChange={(e) => setFormData({ ...formData, contact_via_phone: e.target.checked })}
                        />
                        <span>{t('profilePageResident.allowContactViaPhone')}</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_message}
                          onChange={(e) => setFormData({ ...formData, contact_via_message: e.target.checked })}
                        />
                        <span>{t('profilePageResident.allowContactViaMessage')}</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                <div className="rp-content-header">
                  <div className="rp-content-header-left">
                    <h2>{t('profilePageResident.settings')}</h2>
                    <p>{t('profilePageResident.customizePreferences')}</p>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="rp-settings-section">
                  <div className="rp-settings-card">
                    <div className="rp-settings-card-header">
                      <div className="rp-settings-icon">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h3 className="rp-settings-title">{t('profilePageResident.language')}</h3>
                        <p className="rp-settings-subtitle">{t('profilePageResident.selectPreferredLanguage')}</p>
                      </div>
                    </div>

                    <div className="rp-language-options">
                      {Object.values(languages).map((lang) => (
                        <button
                          key={lang.code}
                          className={`rp-language-option ${language === lang.code ? 'rp-language-active' : ''}`}
                          onClick={() => changeLanguage(lang.code)}
                        >
                          <span className="rp-language-flag">{lang.flag}</span>
                          <div className="rp-language-info">
                            <span className="rp-language-name">{lang.nativeName}</span>
                            <span className="rp-language-native">{t(`profilePageResident.language${lang.code === 'en' ? 'English' : 'French'}`)}</span>
                          </div>
                          {language === lang.code && (
                            <Check size={18} className="rp-language-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="rp-settings-section">
                  <div className="rp-settings-card">
                    <div className="rp-settings-card-header">
                      <div className="rp-settings-icon">
                        <Key size={20} />
                      </div>
                      <div>
                        <h3 className="rp-settings-title">{t('profilePageResident.changePassword')}</h3>
                        <p className="rp-settings-subtitle">{t('profilePageResident.updateAccountPassword')}</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="rp-password-form">
                      {passwordError && (
                        <div className="rp-alert rp-alert-error">
                          <AlertCircle size={18} />
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="rp-alert rp-alert-success">
                          <Check size={18} />
                          {passwordSuccess}
                        </div>
                      )}

                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.currentPassword')}</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profilePageResident.enterCurrentPassword')}
                            className="rp-form-input"
                          />
                          <button
                            type="button"
                            className="rp-input-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isSendingReset}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-secondary, #14919B)',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            cursor: isSendingReset ? 'not-allowed' : 'pointer',
                            padding: '0.25rem 0',
                            marginTop: '0.25rem',
                            alignSelf: 'flex-end',
                            opacity: isSendingReset ? 0.6 : 1
                          }}
                        >
                          {isSendingReset ? t('profilePageResident.sendingResetLink') : t('profilePageResident.forgotPasswordLink')}
                        </button>
                      </div>

                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.newPassword')}</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profilePageResident.enterNewPassword')}
                            className="rp-form-input"
                          />
                          <button
                            type="button"
                            className="rp-input-toggle"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordForm.newPassword && (
                          <>
                            <div className="rp-strength-indicator">
                              <div className="rp-strength-bar">
                                <div
                                  className="rp-strength-fill"
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
                            <div className="rp-requirements-grid">
                              <span className={`rp-req-item ${passwordForm.newPassword.length >= 8 ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> {t('profilePageResident.characters')}
                              </span>
                              <span className={`rp-req-item ${/[A-Z]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> {t('profilePageResident.uppercase')}
                              </span>
                              <span className={`rp-req-item ${/[a-z]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> {t('profilePageResident.lowercase')}
                              </span>
                              <span className={`rp-req-item ${/[0-9]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> {t('profilePageResident.number')}
                              </span>
                              <span className={`rp-req-item ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> {t('profilePageResident.specialChar')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="rp-form-group">
                        <label className="rp-form-label">{t('profilePageResident.confirmNewPassword')}</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder={t('profilePageResident.confirmPasswordPlaceholder')}
                            className="rp-form-input"
                          />
                          <button
                            type="button"
                            className="rp-input-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                          <span className="rp-input-error">{t('profilePageResident.passwordsDoNotMatch')}</span>
                        )}
                      </div>

                      <div className="rp-form-actions">
                        <button
                          type="button"
                          className="rp-btn rp-btn-ghost"
                          onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                          disabled={isChangingPassword}
                        >
                          {t('profilePageResident.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="rp-btn rp-btn-primary"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <span className="rp-spinner"></span>
                              {t('profilePageResident.changing')}
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              {t('profilePageResident.changePassword')}
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
    </div>
  );
};

export default ProfilePageResident;
