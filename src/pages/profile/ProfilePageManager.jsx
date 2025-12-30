// ProfilePageManager.jsx
import React, { useEffect, useState, lazy, Suspense } from 'react'
import Nav from '../../components/Nav'
import "../../styles/manager/profilepagemanager.css"
import {
  User, Mail, Shield, Home, Plus, MapPin, Calendar, X, LogOut,
  Package, Building2, ChevronRight, Briefcase, Phone, Camera,
  Lock, Eye, EyeOff, Key, Check, AlertCircle, BarChart3, Settings, Menu, Edit
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EditManagerProfileModal from '../../components/modal/EditManagerProfileModal'
import EditPropertyModal from '../../components/modal/EditPropertyModal'
import ManagerProfileSkeleton from '../../components/loading/ManagerProfileSkeleton'
import { logout } from '../../utils/api'

// Lazy load PropertyMap component to prevent Leaflet initialization errors
const PropertyMap = lazy(() => import('../../components/map/PropertyMap'))

function ProfilePageManager() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [user, setUser] = useState({})
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const navigate = useNavigate()
  const [uProfile, setUProfile] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingProperty, setIsEditingProperty] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    getProfileAndProperties()
  }, [])

  const getProfileAndProperties = async () => {
    setIsLoading(true)
    const userProfile = localStorage.getItem('userProfile')
    if (userProfile) {
      const userData = JSON.parse(userProfile)
      setUser(userData)

      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/users/manager/${userData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
          },
        })
        if (!profileRes.ok) throw new Error('Error getting manager profile')
        const profileData = await profileRes.json()
        setUProfile(profileData)

        const propertiesRes = await fetch(`${API_BASE_URL}/api/properties`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
          },
        })
        if (!propertiesRes.ok) throw new Error('Error getting properties')
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties || [])
      } catch (error) {
        console.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAddProperty = () => {
    navigate("/profile/add-property")
  }

  const handlePropertyClick = (property) => {
    setSelectedProperty(property)
  }

  const handleCloseModal = () => {
    setSelectedProperty(null)
  }

  const handelLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    navigate("/");
  }

  const closeEditModal = () => {
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async () => {
    await getProfileAndProperties()
    setIsEditingProfile(false)
  }

  const totalUnits = properties.reduce((sum, prop) => sum + (prop.num_units || 0), 0)
  const totalProperties = properties.length

  // Password validation function
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    return requirements
  }

  const getPasswordStrength = (password) => {
    const requirements = validatePassword(password)
    const passedCount = Object.values(requirements).filter(Boolean).length
    if (passedCount <= 2) return { label: 'Weak', color: '#ef4444' }
    if (passedCount <= 4) return { label: 'Medium', color: '#f59e0b' }
    return { label: 'Strong', color: '#22c55e' }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    const requirements = validatePassword(passwordForm.newPassword)
    if (!Object.values(requirements).every(Boolean)) {
      setPasswordError('Password does not meet all requirements')
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
  }

  // Tab configuration
  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Building2, badge: properties.length },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  if (isLoading) {
    return (
      <>
        <Nav />
        <ManagerProfileSkeleton />
      </>
    )
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>Account Information</h2>
              <p>Manage your personal information and profile settings</p>
            </div>

            {/* Profile Card */}
            <div className="mp-profile-card-modern">
              <div className="mp-profile-card-left">
                <div className="mp-avatar-container">
                  <div className="mp-avatar-modern">
                    {uProfile?.profile?.image ? (
                      <img src={uProfile.profile.image} alt="Profile" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <button className="mp-avatar-edit-modern" onClick={() => setIsEditingProfile(true)}>
                    <Camera size={14} />
                  </button>
                </div>
                <div className="mp-profile-info-modern">
                  <h3>
                    {uProfile?.profile?.first_name && uProfile?.profile?.last_name
                      ? `${uProfile.profile.first_name} ${uProfile.profile.last_name}`
                      : 'Property Manager'}
                  </h3>
                  <span className="mp-role-tag-modern">
                    <Shield size={12} />
                    {user?.role || 'Property Manager'}
                  </span>
                </div>
              </div>
              <button className="mp-btn mp-btn-outline" onClick={() => setIsEditingProfile(true)}>
                <Camera size={16} />
                Edit Photo
              </button>
            </div>

            {/* Info Grid */}
            <div className="mp-info-section">
              <h4 className="mp-info-section-title">Personal Details</h4>
              <div className="mp-info-grid-modern">
                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <User size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>First Name</label>
                    <span>{uProfile?.profile?.first_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <User size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Last Name</label>
                    <span>{uProfile?.profile?.last_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Mail size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Email Address</label>
                    <span>{uProfile?.profile?.email || user?.email || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Phone size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Phone Number</label>
                    <span>{uProfile?.profile?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mp-info-section">
              <h4 className="mp-info-section-title">Business Information</h4>
              <div className="mp-info-grid-modern">
                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Briefcase size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Company Name</label>
                    <span>{uProfile?.profile?.company_name || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <MapPin size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Address</label>
                    <span>{uProfile?.profile?.address || '—'}</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Shield size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Account ID</label>
                    <span className="mp-text-mono">{user?.id?.slice(0, 8) || '—'}...</span>
                  </div>
                </div>

                <div className="mp-info-item-modern">
                  <div className="mp-info-icon-modern">
                    <Calendar size={18} />
                  </div>
                  <div className="mp-info-details">
                    <label>Member Since</label>
                    <span>
                      {uProfile?.profile?.created_at
                        ? new Date(uProfile.profile.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mp-info-note">
              <Settings size={16} />
              <span>To update your profile information, please contact support.</span>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>Overview</h2>
              <p>Quick summary of your property management stats</p>
            </div>

            <div className="mp-stats-grid-modern">
              <div className="mp-stat-card-modern mp-stat-primary">
                <div className="mp-stat-icon-modern">
                  <Building2 size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalProperties}</span>
                  <span className="mp-stat-label-modern">Total Properties</span>
                </div>
              </div>

              <div className="mp-stat-card-modern mp-stat-secondary">
                <div className="mp-stat-icon-modern">
                  <Package size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalUnits}</span>
                  <span className="mp-stat-label-modern">Total Units</span>
                </div>
              </div>

              <div className="mp-stat-card-modern mp-stat-tertiary">
                <div className="mp-stat-icon-modern">
                  <Home size={24} />
                </div>
                <div className="mp-stat-info">
                  <span className="mp-stat-value-modern">{totalProperties}</span>
                  <span className="mp-stat-label-modern">Active Properties</span>
                </div>
              </div>
            </div>

            {/* Recent Properties */}
            <div className="mp-recent-section">
              <div className="mp-recent-header">
                <h4>Recent Properties</h4>
                <button className="mp-link-btn" onClick={() => setActiveTab('properties')}>
                  View all
                  <ChevronRight size={16} />
                </button>
              </div>

              {properties.length > 0 ? (
                <div className="mp-recent-list">
                  {properties.slice(0, 3).map((property) => (
                    <div key={property.id} className="mp-recent-item" onClick={() => handlePropertyClick(property)}>
                      <div className="mp-recent-icon">
                        <Building2 size={20} />
                      </div>
                      <div className="mp-recent-info">
                        <h5>{property.building_name || property.address}</h5>
                        <span>{property.city}, {property.province}</span>
                      </div>
                      <div className="mp-recent-meta">
                        <span className="mp-unit-badge">{property.num_units} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mp-empty-recent">
                  <p>No properties added yet</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'properties':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <div className="mp-content-header-left">
                <h2>Properties</h2>
                <p>Manage your properties and units</p>
              </div>
              <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                <Plus size={18} />
                Add Property
              </button>
            </div>

            {properties.length > 0 ? (
              <div className="mp-properties-grid">
                {properties.map((property) => (
                  <div key={property.id} className="mp-property-card-modern" onClick={() => handlePropertyClick(property)}>
                    <div className="mp-property-card-header">
                      <div className="mp-property-icon">
                        <Building2 size={24} />
                      </div>
                      <span className="mp-property-type-badge">{property.building_type}</span>
                    </div>
                    <div className="mp-property-card-body">
                      <h4>{property.building_name || property.address}</h4>
                      <div className="mp-property-location">
                        <MapPin size={14} />
                        <span>{property.address}, {property.city}</span>
                      </div>
                    </div>
                    <div className="mp-property-card-footer">
                      <div className="mp-property-stat">
                        <Package size={14} />
                        <span>{property.num_units} {property.num_units === 1 ? 'Unit' : 'Units'}</span>
                      </div>
                      <ChevronRight size={18} className="mp-property-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mp-empty-state-modern">
                <div className="mp-empty-icon-modern">
                  <Home size={48} />
                </div>
                <h3>No properties yet</h3>
                <p>Add your first property to get started managing your units</p>
                <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                  <Plus size={18} />
                  Add Property
                </button>
              </div>
            )}
          </div>
        )

      case 'security':
        return (
          <div className="mp-tab-content">
            <div className="mp-content-header">
              <h2>Security</h2>
              <p>Manage your password and account security</p>
            </div>

            {/* Success Message */}
            {passwordSuccess && (
              <div className="mp-alert mp-alert-success">
                <Check size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Section */}
            <div className="mp-security-card">
              <div className="mp-security-card-header">
                <div className="mp-security-icon">
                  <Key size={20} />
                </div>
                <div className="mp-security-info">
                  <h4>Password</h4>
                  <p>Change your password to keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mp-password-form-modern">
                {/* Error Message */}
                {passwordError && (
                  <div className="mp-alert mp-alert-error">
                    <AlertCircle size={18} />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Current Password */}
                <div className="mp-form-group">
                  <label>Current Password</label>
                  <div className="mp-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="mp-input-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mp-form-group">
                  <label>New Password</label>
                  <div className="mp-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="mp-input-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {passwordForm.newPassword && (
                    <>
                      <div className="mp-strength-indicator">
                        <div className="mp-strength-bar-modern">
                          <div
                            className="mp-strength-fill-modern"
                            style={{
                              width: `${(Object.values(validatePassword(passwordForm.newPassword)).filter(Boolean).length / 5) * 100}%`,
                              backgroundColor: getPasswordStrength(passwordForm.newPassword).color
                            }}
                          />
                        </div>
                        <span style={{ color: getPasswordStrength(passwordForm.newPassword).color }}>
                          {getPasswordStrength(passwordForm.newPassword).label}
                        </span>
                      </div>

                      <div className="mp-requirements-grid">
                        {[
                          { key: 'minLength', label: '8+ characters' },
                          { key: 'hasUpperCase', label: 'Uppercase' },
                          { key: 'hasLowerCase', label: 'Lowercase' },
                          { key: 'hasNumber', label: 'Number' },
                          { key: 'hasSpecialChar', label: 'Special char' }
                        ].map((req) => (
                          <div
                            key={req.key}
                            className={`mp-req-item ${validatePassword(passwordForm.newPassword)[req.key] ? 'mp-req-met' : ''}`}
                          >
                            {validatePassword(passwordForm.newPassword)[req.key] ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}
                            <span>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mp-form-group">
                  <label>Confirm New Password</label>
                  <div className="mp-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="mp-input-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="mp-input-error">Passwords do not match</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mp-form-actions">
                  <button
                    type="button"
                    className="mp-btn mp-btn-ghost"
                    onClick={resetPasswordForm}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mp-btn mp-btn-primary"
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="mp-spinner"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get current tab info for mobile header
  const currentTab = tabs.find(tab => tab.id === activeTab)

  const handleMobileTabClick = (tabId) => {
    setActiveTab(tabId)
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="mp-profile-page-modern">
      <Nav />

      <div className="mp-layout">
        {/* Mobile Header */}
        <div className="mp-mobile-header">
          <button
            className="mp-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="mp-mobile-title">{currentTab?.label || 'Profile'}</span>
          <button
            className="mp-mobile-logout-btn"
            onClick={handelLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="mp-mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`mp-sidebar ${isMobileSidebarOpen ? 'mp-sidebar-open' : ''}`}>
          <div className="mp-sidebar-header">
            <div className="mp-sidebar-avatar">
              {uProfile?.profile?.image ? (
                <img src={uProfile.profile.image} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="mp-sidebar-user">
              <h3>
                {uProfile?.profile?.first_name
                  ? `${uProfile.profile.first_name} ${uProfile.profile.last_name || ''}`
                  : 'Property Manager'}
              </h3>
              <span>{user?.email}</span>
            </div>
            <button
              className="mp-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mp-sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`mp-nav-item ${activeTab === tab.id ? 'mp-nav-active' : ''}`}
                  onClick={() => handleMobileTabClick(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="mp-nav-badge">{tab.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mp-sidebar-footer">
            <button className="mp-nav-item mp-nav-logout" onClick={handelLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="mp-main-content">
          {renderTabContent()}
        </main>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="mp-modal-overlay" onClick={handleCloseModal}>
          <div className="mp-modal mp-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <div className="mp-modal-title">
                <Building2 size={18} />
                <h2>Property Details</h2>
              </div>
              <button className="mp-modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <div className="mp-modal-body">
              <div className="mp-modal-section">
                <h3>Address Information</h3>
                <div className="mp-modal-grid">
                  <div className="mp-modal-field">
                    <label>Building Name</label>
                    <p>{selectedProperty.building_name || '—'}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Address</label>
                    <p>{selectedProperty.address}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>City</label>
                    <p>{selectedProperty.city}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Province</label>
                    <p>{selectedProperty.province}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Postal Code</label>
                    <p>{selectedProperty.postal_code}</p>
                  </div>
                </div>
              </div>

              <div className="mp-modal-section">
                <h3>Property Details</h3>
                <div className="mp-modal-grid">
                  <div className="mp-modal-field">
                    <label>Building Type</label>
                    <p>{selectedProperty.building_type}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Number of Units</label>
                    <p>{selectedProperty.num_units}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Property ID</label>
                    <p>{selectedProperty.id}</p>
                  </div>
                  <div className="mp-modal-field">
                    <label>Created At</label>
                    <p>{new Date(selectedProperty.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              {/* Property Location Map */}
              {/* Only show map when not editing to avoid Leaflet conflicts */}
              {selectedProperty.latitude && selectedProperty.longitude && !isEditingProperty && (
                <div className="mp-modal-section">
                  <h3>
                    <MapPin size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Property Location
                  </h3>
                  <div className="mp-property-map-container">
                    <Suspense fallback={
                      <div style={{
                        height: '250px',
                        width: '100%',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}>
                        Loading map...
                      </div>
                    }>
                      <PropertyMap
                        latitude={selectedProperty.latitude}
                        longitude={selectedProperty.longitude}
                        propertyName={selectedProperty.building_name}
                        address={selectedProperty.address}
                        city={selectedProperty.city}
                        height="250px"
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            <div className="mp-modal-footer">
              <button className="mp-btn mp-btn-ghost" onClick={handleCloseModal}>
                Close
              </button>
              <button
                className="mp-btn mp-btn-primary"
                onClick={() => {
                  setIsEditingProperty(true)
                }}
              >
                <Edit size={16} />
                Edit Property
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingProfile && (
        <EditManagerProfileModal
          userProfile={uProfile}
          onClose={closeEditModal}
          onSave={handleSaveProfile}
        />
      )}

      {isEditingProperty && selectedProperty && (
        <EditPropertyModal
          isOpen={isEditingProperty}
          onClose={() => setIsEditingProperty(false)}
          onSuccess={(updatedProperty) => {
            setProperties(prev =>
              prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
            )
            setSelectedProperty(updatedProperty)
            setIsEditingProperty(false)
          }}
          property={selectedProperty}
        />
      )}
    </div>
  )
}

export default ProfilePageManager
