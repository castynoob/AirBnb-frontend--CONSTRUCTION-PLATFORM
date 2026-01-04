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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfilePageResident = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const { language, changeLanguage, languages } = useLanguage();

  // Tab labels for mobile header
  const tabLabels = {
    account: 'Account',
    settings: 'Settings'
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/residents/profile`, {
        headers: {
          'Authorization': `Bearer ${userProfile.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setFormData({
          bio: data.profile.bio || '',
          unit_number: data.profile.unit_number || '',
          floor: data.profile.floor || '',
          building_section: data.profile.building_section || '',
          move_in_date: data.profile.move_in_date ? data.profile.move_in_date.split('T')[0] : '',
          show_email: data.profile.show_email ?? true,
          show_phone: data.profile.show_phone ?? true,
          show_unit: data.profile.show_unit ?? true,
          show_move_in_date: data.profile.show_move_in_date ?? false,
          allow_messages: data.profile.allow_messages ?? true,
          show_online_status: data.profile.show_online_status ?? true,
          contact_via_email: data.profile.contact_via_email ?? true,
          contact_via_phone: data.profile.contact_via_phone ?? true,
          contact_via_message: data.profile.contact_via_message ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
        setProfile(data.profile);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to save changes');
      toast.error('Failed to save changes');
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

  if (loading) {
    return (
      <div className="rp-profile-page">
        <Nav />
        <div className="rp-loading-container">
          <div className="rp-loader"></div>
          <p>Loading profile...</p>
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
          <button className="rp-btn rp-btn-primary" onClick={fetchProfile}>
            Try Again
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
              <span>Resident</span>
            </div>
          </div>

          <nav className="rp-sidebar-nav">
            <button
              className={`rp-nav-item ${activeTab === 'account' ? 'rp-nav-active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <User size={18} />
              <span>Account</span>
            </button>
            <button
              className={`rp-nav-item ${activeTab === 'settings' ? 'rp-nav-active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={18} />
              <span>Settings</span>
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
                    <h2>Account Information</h2>
                    <p>Manage your profile and contact details</p>
                  </div>
                  {!isEditing ? (
                    <button className="rp-btn rp-btn-primary rp-desktop-only" onClick={() => setIsEditing(true)}>
                      <Edit size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="rp-edit-actions rp-desktop-only">
                      <button className="rp-btn rp-btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="rp-btn rp-btn-ghost" onClick={handleCancel} disabled={saving}>
                        <X size={16} />
                        Cancel
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
                        Resident
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">About Me</h4>
                  {isEditing ? (
                    <div className="rp-form-group">
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell your neighbors about yourself..."
                        rows={4}
                        className="rp-form-textarea"
                      />
                    </div>
                  ) : (
                    <p className="rp-bio-text">
                      {profile?.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>

                {/* Unit Information */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">Unit Information</h4>
                  {isEditing ? (
                    <div className="rp-form-grid">
                      <div className="rp-form-group">
                        <label className="rp-form-label">
                          <MapPin size={14} />
                          Unit Number
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
                        <label className="rp-form-label">Floor</label>
                        <input
                          type="number"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          placeholder="e.g., 1"
                          className="rp-form-input"
                        />
                      </div>
                      <div className="rp-form-group">
                        <label className="rp-form-label">Building Section</label>
                        <input
                          type="text"
                          value={formData.building_section}
                          onChange={(e) => setFormData({ ...formData, building_section: e.target.value })}
                          placeholder="e.g., North Wing"
                          className="rp-form-input"
                        />
                      </div>
                      <div className="rp-form-group">
                        <label className="rp-form-label">Move-in Date</label>
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
                          <label>Unit</label>
                          <span>{profile?.unit_number || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>Floor</label>
                          <span>{profile?.floor || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>Section</label>
                          <span>{profile?.building_section || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="rp-info-item">
                        <div className="rp-info-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="rp-info-details">
                          <label>Move-in Date</label>
                          <span>
                            {profile?.move_in_date
                              ? new Date(profile.move_in_date).toLocaleDateString()
                              : 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="rp-info-section">
                  <h4 className="rp-info-section-title">Contact Information</h4>
                  <div className="rp-info-grid">
                    <div className="rp-info-item">
                      <div className="rp-info-icon">
                        <Mail size={18} />
                      </div>
                      <div className="rp-info-details">
                        <label>Email</label>
                        <span>{profile?.email || 'Not provided'}</span>
                      </div>
                    </div>
                    <div className="rp-info-item">
                      <div className="rp-info-icon">
                        <Phone size={18} />
                      </div>
                      <div className="rp-info-details">
                        <label>Phone</label>
                        <span>{profile?.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings (only when editing) */}
                {isEditing && (
                  <div className="rp-info-section">
                    <h4 className="rp-info-section-title">Privacy Settings</h4>
                    <div className="rp-privacy-settings">
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_email}
                          onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                        />
                        <span>Show email to other residents</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_phone}
                          onChange={(e) => setFormData({ ...formData, show_phone: e.target.checked })}
                        />
                        <span>Show phone to other residents</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_unit}
                          onChange={(e) => setFormData({ ...formData, show_unit: e.target.checked })}
                        />
                        <span>Show unit number to other residents</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_move_in_date}
                          onChange={(e) => setFormData({ ...formData, show_move_in_date: e.target.checked })}
                        />
                        <span>Show move-in date</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.show_online_status}
                          onChange={(e) => setFormData({ ...formData, show_online_status: e.target.checked })}
                        />
                        <span>Show when I'm online</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.allow_messages}
                          onChange={(e) => setFormData({ ...formData, allow_messages: e.target.checked })}
                        />
                        <span>Allow other residents to message me</span>
                      </label>

                      <h5 className="rp-subsection-title">Contact Preferences</h5>

                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_email}
                          onChange={(e) => setFormData({ ...formData, contact_via_email: e.target.checked })}
                        />
                        <span>Allow contact via email</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_phone}
                          onChange={(e) => setFormData({ ...formData, contact_via_phone: e.target.checked })}
                        />
                        <span>Allow contact via phone</span>
                      </label>
                      <label className="rp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.contact_via_message}
                          onChange={(e) => setFormData({ ...formData, contact_via_message: e.target.checked })}
                        />
                        <span>Allow contact via direct message</span>
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
                    <h2>Settings</h2>
                    <p>Customize your preferences and security</p>
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
                        <h3 className="rp-settings-title">Language</h3>
                        <p className="rp-settings-subtitle">Select your preferred language</p>
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
                            <span className="rp-language-name">{lang.name}</span>
                            <span className="rp-language-native">{lang.nativeName}</span>
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
                        <h3 className="rp-settings-title">Change Password</h3>
                        <p className="rp-settings-subtitle">Update your account password</p>
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
                        <label className="rp-form-label">Current Password</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter current password"
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
                      </div>

                      <div className="rp-form-group">
                        <label className="rp-form-label">New Password</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter new password"
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
                                <Check size={12} /> 8+ characters
                              </span>
                              <span className={`rp-req-item ${/[A-Z]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> Uppercase
                              </span>
                              <span className={`rp-req-item ${/[a-z]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> Lowercase
                              </span>
                              <span className={`rp-req-item ${/[0-9]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> Number
                              </span>
                              <span className={`rp-req-item ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'rp-req-met' : ''}`}>
                                <Check size={12} /> Special char
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="rp-form-group">
                        <label className="rp-form-label">Confirm New Password</label>
                        <div className="rp-input-wrapper">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm new password"
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
                          <span className="rp-input-error">Passwords do not match</span>
                        )}
                      </div>

                      <div className="rp-form-actions">
                        <button
                          type="button"
                          className="rp-btn rp-btn-ghost"
                          onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                          disabled={isChangingPassword}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rp-btn rp-btn-primary"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <span className="rp-spinner"></span>
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
