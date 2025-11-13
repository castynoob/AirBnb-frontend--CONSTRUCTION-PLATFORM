// ProfilePageManager.jsx
import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import "../../styles/manager/profilepagemanager.css"
import { FiUser, FiMail, FiShield, FiHome, FiPlus, FiMapPin, FiCalendar, FiEdit2, FiX, FiLogOut, FiPackage } from 'react-icons/fi'
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

  const handleSaveProfile = async (updatedProfile) => {
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
        {/* Profile Card */}
        <div className="mp-profile-card">
          <div className="mp-profile-header">
            <div className="mp-avatar-section">
              <div className="mp-avatar">
                {uProfile?.profile?.image ? (
                  <img src={uProfile.profile.image} alt="Profile" />
                ) : (
                  <FiUser size={32} />
                )}
              </div>
              <button className="mp-avatar-edit" onClick={() => setIsEditingProfile(true)} aria-label="Edit profile picture">
                <FiEdit2 size={12} />
              </button>
            </div>

            <div className="mp-profile-info">
              <h1 className="mp-name">
                {uProfile?.profile?.first_name + ' ' + uProfile?.profile?.last_name || 'Property Manager'}
              </h1>
              <div className="mp-role">
                <FiShield size={14} />
                <span>{user?.role || 'Manager'}</span>
              </div>
            </div>

            <div className="mp-actions">
              <button className="mp-btn mp-btn-primary" onClick={() => setIsEditingProfile(true)}>
                <FiEdit2 size={16} />
                <span>Edit Profile</span>
              </button>
              <button className="mp-btn mp-btn-secondary" onClick={handelLogout}>
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="mp-profile-details">
            <div className="mp-detail-item">
              <FiMail size={16} />
              <span>{user?.email}</span>
            </div>
            <div className="mp-detail-item">
              <FiUser size={16} />
              <span>ID: {user?.id}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mp-stats">
          <div className="mp-stat-item">
            <div className="mp-stat-icon">
              <FiHome size={20} />
            </div>
            <div className="mp-stat-content">
              <div className="mp-stat-value">{totalProperties}</div>
              <div className="mp-stat-label">Properties</div>
            </div>
          </div>
          <div className="mp-stat-item">
            <div className="mp-stat-icon">
              <FiPackage size={20} />
            </div>
            <div className="mp-stat-content">
              <div className="mp-stat-value">{totalUnits}</div>
              <div className="mp-stat-label">Total Units</div>
            </div>
          </div>
          <div className="mp-stat-item">
            <div className="mp-stat-icon">
              <FiCalendar size={20} />
            </div>
            <div className="mp-stat-content">
              <div className="mp-stat-value">{totalProperties}</div>
              <div className="mp-stat-label">Active</div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mp-properties-section">
          <div className="mp-section-header">
            <div className="mp-section-title">
              <h2>Properties</h2>
              <span className="mp-count-badge">{properties.length}</span>
            </div>
            <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
              <FiPlus size={18} />
              <span>Add Property</span>
            </button>
          </div>

          {properties.length > 0 ? (
            <div className="mp-properties-list">
              {properties.map((property) => (
                <div key={property.id} className="mp-property-item" onClick={() => handlePropertyClick(property)}>
                  <div className="mp-property-header">
                    <h3 className="mp-property-address">{property.address}</h3>
                    <span className="mp-badge">{property.num_units} {property.num_units === 1 ? 'Unit' : 'Units'}</span>
                  </div>
                  
                  <div className="mp-property-info">
                    <div className="mp-property-detail">
                      <FiMapPin size={14} />
                      <span>{property.city}, {property.province} {property.postal_code}</span>
                    </div>
                    <div className="mp-property-detail">
                      <FiHome size={14} />
                      <span>{property.building_type}</span>
                    </div>
                  </div>

                  <div className="mp-property-footer">
                    <div className="mp-property-date">
                      <FiCalendar size={14} />
                      <span>{new Date(property.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <button className="mp-link-btn">View Details →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mp-empty-state">
              <div className="mp-empty-icon">
                <FiHome size={40} />
              </div>
              <h3>No properties yet</h3>
              <p>Add your first property to get started</p>
              <button className="mp-btn mp-btn-primary" onClick={handleAddProperty}>
                <FiPlus size={18} />
                <span>Add Property</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <div className="mp-modal-overlay" onClick={handleCloseModal}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <h2>Property Details</h2>
              <button className="mp-modal-close" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="mp-modal-body">
              <div className="mp-modal-section">
                <h3>Address Information</h3>
                <div className="mp-modal-grid">
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
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>
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