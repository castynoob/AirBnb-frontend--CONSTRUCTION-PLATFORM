// ProfilePageManager.jsx
import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import "../../styles/manager/profilepagemanager.css"
import { User, Mail, Shield, Home, Plus, MapPin, Calendar, X, LogOut, Package, Building2, ChevronRight, Briefcase, Phone, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EditManagerProfileModal from '../../components/modal/EditManagerProfileModal'
import ManagerProfileSkeleton from '../../components/loading/ManagerProfileSkeleton'

function ProfilePageManager() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [user, setUser] = useState({})
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const navigate = useNavigate()
  const [uProfile, setUProfile] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

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

  const handelLogout = () => {
    localStorage.removeItem('userProfile')
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

  if (isLoading) {
    return (
      <>
        <Nav />
        <ManagerProfileSkeleton />
      </>
    )
  }

  return (
    <div className="mp-profile-page">
      <Nav />

      <div className="mp-container">
        {/* Page Header */}
        <header className="mp-page-header">
          <div className="mp-header-left">
            <div className="mp-header-title-group">
              <h1>PROFILE</h1>
              <span className="mp-role-badge">
                <Shield size={12} />
                {user?.role || 'Manager'}
              </span>
            </div>
          </div>
          <div className="mp-header-actions">
            <button className="mp-btn mp-btn-secondary" onClick={handelLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Profile Section - User Information */}
        <div className="mp-section">
          <div className="mp-section-header-bar">
            <div className="mp-section-title">
              <User size={18} />
              <h2>Account Information</h2>
            </div>
            <button className="mp-btn mp-btn-primary mp-btn-sm" onClick={() => setIsEditingProfile(true)}>
              <Camera size={14} />
              <span>Edit Photo</span>
            </button>
          </div>

          <div className="mp-section-body">
            {/* Profile Header with Avatar and Name */}
            <div className="mp-profile-header-card">
              <div className="mp-profile-avatar-section">
                <div className="mp-avatar-large">
                  {uProfile?.profile?.image ? (
                    <img src={uProfile.profile.image} alt="Profile" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <button className="mp-avatar-edit-btn" onClick={() => setIsEditingProfile(true)}>
                  <Camera size={14} />
                </button>
              </div>
              <div className="mp-profile-header-info">
                <h2 className="mp-profile-name-large">
                  {uProfile?.profile?.first_name && uProfile?.profile?.last_name
                    ? `${uProfile.profile.first_name} ${uProfile.profile.last_name}`
                    : 'Property Manager'}
                </h2>
                <div className="mp-profile-role-tag">
                  <Shield size={12} />
                  <span>{user?.role || 'Property Manager'}</span>
                </div>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="mp-user-info-grid">
              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <User size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>First Name</label>
                  <p>{uProfile?.profile?.first_name || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <User size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Last Name</label>
                  <p>{uProfile?.profile?.last_name || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <Mail size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Email Address</label>
                  <p>{uProfile?.profile?.email || user?.email || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <Briefcase size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Company Name</label>
                  <p>{uProfile?.profile?.company_name || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <MapPin size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Address</label>
                  <p>{uProfile?.profile?.address || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <Phone size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Phone Number</label>
                  <p>{uProfile?.profile?.phone || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <Shield size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Account ID</label>
                  <p>{user?.id || '—'}</p>
                </div>
              </div>

              <div className="mp-user-info-card">
                <div className="mp-user-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="mp-user-info-content">
                  <label>Member Since</label>
                  <p>{uProfile?.profile?.created_at
                    ? new Date(uProfile.profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })
                    : '—'}</p>
                </div>
              </div>
            </div>

            <p className="mp-profile-edit-note">
              To update your profile information, please contact support.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mp-section">
          <div className="mp-section-header-bar">
            <div className="mp-section-title">
              <Building2 size={18} />
              <h2>Overview</h2>
            </div>
          </div>

          <div className="mp-section-body">
            <div className="mp-stats-grid">
              <div className="mp-stat-card">
                <div className="mp-stat-icon">
                  <Home size={20} />
                </div>
                <div className="mp-stat-content">
                  <div className="mp-stat-value">{totalProperties}</div>
                  <div className="mp-stat-label">Properties</div>
                </div>
              </div>
              <div className="mp-stat-card">
                <div className="mp-stat-icon">
                  <Package size={20} />
                </div>
                <div className="mp-stat-content">
                  <div className="mp-stat-value">{totalUnits}</div>
                  <div className="mp-stat-label">Total Units</div>
                </div>
              </div>
              <div className="mp-stat-card">
                <div className="mp-stat-icon">
                  <Calendar size={20} />
                </div>
                <div className="mp-stat-content">
                  <div className="mp-stat-value">{totalProperties}</div>
                  <div className="mp-stat-label">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mp-section">
          <div className="mp-section-header-bar">
            <div className="mp-section-title">
              <Home size={18} />
              <h2>Properties</h2>
              <span className="mp-count-badge">{properties.length}</span>
            </div>
            <button className="mp-btn mp-btn-primary mp-btn-sm" onClick={handleAddProperty}>
              <Plus size={14} />
              <span>Add Property</span>
            </button>
          </div>

          <div className="mp-section-body">
            {properties.length > 0 ? (
              <div className="mp-properties-list">
                {properties.map((property) => (
                  <div key={property.id} className="mp-property-item" onClick={() => handlePropertyClick(property)}>
                    <div className="mp-property-main">
                      <h3 className="mp-property-address">{property.building_name || property.address}</h3>
                      <div className="mp-property-meta">
                        <span className="mp-property-tag">{property.building_type}</span>
                        <span className="mp-property-units">{property.num_units} {property.num_units === 1 ? 'Unit' : 'Units'}</span>
                      </div>
                      <div className="mp-property-location">
                        <MapPin size={12} />
                        <span>{property.address}, {property.city}, {property.province}</span>
                      </div>
                    </div>
                    <div className="mp-property-action">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mp-empty-state">
                <div className="mp-empty-icon">
                  <Home size={32} />
                </div>
                <h3>No properties yet</h3>
                <p>Add your first property to get started</p>
                <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                  <Plus size={16} />
                  <span>Add Property</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="mp-modal-overlay" onClick={handleCloseModal}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
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
            </div>

            <div className="mp-modal-footer">
              <button className="mp-btn mp-btn-secondary" onClick={handleCloseModal}>
                Close
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
    </div>
  )
}

export default ProfilePageManager
