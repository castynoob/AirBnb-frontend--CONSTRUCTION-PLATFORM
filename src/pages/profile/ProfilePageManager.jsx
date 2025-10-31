import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import "../../styles/manager/profilepagemanager.css"
import { FiUser, FiMail, FiShield, FiHome, FiPlus, FiMapPin, FiCalendar, FiEdit2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import EditManagerProfileModal from '../../components/modal/EditManagerProfileModal'

function ProfilePageManager() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [user, setUser] = useState({})
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const navigate = useNavigate()
  const [uProfile, setUProfile] = useState({})

  // edit
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    const getProfileAndProperties = async () => {
      const userProfile = localStorage.getItem('userProfile')

      if (userProfile) {
        const userData = JSON.parse(userProfile)
        setUser(userData)

        try {
          // 🟢 Fetch Manager Profile
          const profileRes = await fetch(`${API_BASE_URL}/api/users/manager/${userData.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userData.token}`,
            },
          })

          if (!profileRes.ok) throw new Error('Error getting manager profile')
          const profileData = await profileRes.json()
          console.log("MANAGER DATA:", profileData)
          setUProfile(profileData)

          // 🟢 Fetch Manager Properties
          const propertiesRes = await fetch(`${API_BASE_URL}/api/properties`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userData.token}`,
            },
          })

          if (!propertiesRes.ok) throw new Error('Error getting properties')
          const propertiesData = await propertiesRes.json()
          console.log("PROPERTIES:", propertiesData)
          setProperties(propertiesData.properties || [])

        } catch (error) {
          console.error(error.message)
        }
      }
    }

    getProfileAndProperties()
  }, [])

  const handleAddProperty = () => {
    navigate("/profile/add-property")
  }

  const handleEditProfile = () => {
    // TODO: Add edit profile logic
    alert("Edit profile functionality")
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

  // Calculate stats
  const totalUnits = properties.reduce((sum, prop) => sum + (prop.num_units || 0), 0)
  const totalProperties = properties.length

  return (
    <div className="mp-profile-page-manager">
      <Nav />
      <div className="mp-profile-content">
        {/* Profile Header */}
        <div className="mp-profile-header">
          <div className="mp-profile-banner"></div>
          <div className="mp-profile-info-section">
            <div className="mp-profile-avatar-container">
              <div className="mp-profile-avatar">
                <FiUser size={48} />
              </div>
              <button className="mp-edit-avatar-btn" onClick={handleEditProfile}>
                <FiEdit2 size={14} />
              </button>
            </div>
            <div className="mp-profile-details">
              <div className="mp-profile-name-section">
                <h1 className="mp-profile-name">{uProfile?.profile?.first_name + ' ' + uProfile?.profile?.last_name || 'Property Manager'}</h1>
                <span className="mp-profile-role-badge">
                  <FiShield size={14} />
                  {user?.role || 'Manager'}
                </span>
              </div>
              <div className="mp-profile-contact-info">
                <div className="mp-contact-item">
                  <FiMail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="mp-contact-item">
                  <FiUser size={16} />
                  <span>ID: {user?.id}</span>
                </div>
              </div>
            </div>
            <button className="mp-edit-profile-btn" onClick={() => {
              setIsEditingProfile(true)
            }}>
              <FiEdit2 size={16} />
              Edit Profile
            </button>
            <button className="mp-edit-profile-btn" onClick={handelLogout}>
              Log out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mp-stats-grid">
          <div className="mp-stat-card">
            <div className="mp-stat-icon mp-properties">
              <FiHome size={24} />
            </div>
            <div className="mp-stat-content">
              <h3 className="mp-stat-value">{totalProperties}</h3>
              <p className="mp-stat-label">Total Properties</p>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon mp-units">
              <FiMapPin size={24} />
            </div>
            <div className="mp-stat-content">
              <h3 className="mp-stat-value">{totalUnits}</h3>
              <p className="mp-stat-label">Total Units</p>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon mp-active">
              <FiCalendar size={24} />
            </div>
            <div className="mp-stat-content">
              <h3 className="mp-stat-value">{totalProperties > 0 ? totalProperties : '0'}</h3>
              <p className="mp-stat-label">Active Listings</p>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mp-properties-section">
          <div className="mp-section-header">
            <div className="mp-section-title-group">
              <h2 className="mp-section-title">My Properties</h2>
              <span className="mp-property-count">{properties.length} {properties.length === 1 ? 'Property' : 'Properties'}</span>
            </div>
            <button onClick={handleAddProperty} className="mp-add-property-btn">
              <FiPlus size={18} />
              Add New Property
            </button>
          </div>

          {properties.length > 0 ? (
            <div className="mp-properties-grid">
              {properties.map((property) => (
                <div key={property.id} className="mp-property-card" onClick={() => handlePropertyClick(property)}>
                  <div className="mp-property-card-header">
                    <div className="mp-property-type-badge">
                      {property.building_type}
                    </div>
                    <div className="mp-property-units-badge">
                      {property.num_units} {property.num_units === 1 ? 'Unit' : 'Units'}
                    </div>
                  </div>
                  <div className="mp-property-card-body">
                    <h3 className="mp-property-address">{property.address}</h3>
                    <div className="mp-property-location">
                      <FiMapPin size={14} />
                      <span>{property.city}, {property.province} {property.postal_code}</span>
                    </div>
                  </div>
                  <div className="mp-property-card-footer">
                    <div className="mp-property-date">
                      <FiCalendar size={14} />
                      <span>Added {new Date(property.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <button className="mp-view-property-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mp-empty-state">
              <div className="mp-empty-state-icon">
                <FiHome size={48} />
              </div>
              <h3>No Properties Yet</h3>
              <p>Start by adding your first property to manage</p>
              <button onClick={handleAddProperty} className="mp-empty-state-btn">
                <FiPlus size={18} />
                Add Your First Property
              </button>
            </div>
          )}
        </div>

        {/* Property Details Modal */}
        {selectedProperty && (
          <div className="mp-modal-overlay" onClick={handleCloseModal}>
            <div className="mp-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="mp-modal-header">
                <h2>Property Details</h2>
                <button className="mp-modal-close-btn" onClick={handleCloseModal}>
                  <FiX size={24} />
                </button>
              </div>
              <div className="mp-modal-body">
                <div className="mp-modal-section">
                  <h3 className="mp-modal-section-title">Address Information</h3>
                  <div className="mp-modal-info-grid">
                    <div className="mp-modal-info-item">
                      <label>Address</label>
                      <p>{selectedProperty.address}</p>
                    </div>
                    <div className="mp-modal-info-item">
                      <label>City</label>
                      <p>{selectedProperty.city}</p>
                    </div>
                    <div className="mp-modal-info-item">
                      <label>Province</label>
                      <p>{selectedProperty.province}</p>
                    </div>
                    <div className="mp-modal-info-item">
                      <label>Postal Code</label>
                      <p>{selectedProperty.postal_code}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mp-modal-section">
                  <h3 className="mp-modal-section-title">Property Details</h3>
                  <div className="mp-modal-info-grid">
                    <div className="mp-modal-info-item">
                      <label>Building Type</label>
                      <p>{selectedProperty.building_type}</p>
                    </div>
                    <div className="mp-modal-info-item">
                      <label>Number of Units</label>
                      <p>{selectedProperty.num_units}</p>
                    </div>
                    <div className="mp-modal-info-item">
                      <label>Property ID</label>
                      <p>{selectedProperty.id}</p>
                    </div>
                    <div className="mp-modal-info-item">
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
      </div>
      
      { isEditingProfile &&
        <EditManagerProfileModal userProfile={uProfile} onClose={closeEditModal} onSave={closeEditModal} />
      }
    </div>
  )
}

export default ProfilePageManager