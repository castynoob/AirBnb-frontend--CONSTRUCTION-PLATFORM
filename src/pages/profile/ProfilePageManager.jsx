import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Building2, Home, Calendar, Edit2, Mail, Phone, User, Briefcase, Plus } from "lucide-react";
import Nav from "../../components/Nav";
import "../../styles/manager/profilepagemanager.css"

function ProfilePageManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('properties');
  const [isEditing, setIsEditing] = useState(false);

  const [managerProfile] = useState({
    id: "1",
    user_id: "user-123",
    property_name: "Skyline Property Management",
    address: "123 Main Street, Downtown District",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    email: "manager@skylinepm.com",
    phone: "+1 (555) 123-4567",
    created_at: "2023-01-15T10:30:00",
    updated_at: "2024-10-15T14:20:00"
  });

  const [properties] = useState([
    {
      id: "prop-1",
      manager_id: "1",
      address: "456 Oak Avenue",
      city: "Metro City",
      province: "Central Province",
      postal_code: "12345",
      num_units: 24,
      building_type: "Apartment Complex",
      created_at: "2023-02-10T09:00:00",
      updated_at: "2024-09-20T11:30:00"
    },
    {
      id: "prop-2",
      manager_id: "1",
      address: "789 Pine Street",
      city: "Metro City",
      province: "Central Province",
      postal_code: "12346",
      num_units: 12,
      building_type: "Condominium",
      created_at: "2023-03-15T10:15:00",
      updated_at: "2024-08-10T16:45:00"
    },
    {
      id: "prop-3",
      manager_id: "1",
      address: "321 Elm Boulevard",
      city: "Riverside",
      province: "Eastern Province",
      postal_code: "54321",
      num_units: 36,
      building_type: "High-Rise",
      created_at: "2023-05-20T14:00:00",
      updated_at: "2024-10-01T09:20:00"
    }
  ]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const totalUnits = properties.reduce((sum, prop) => sum + prop.num_units, 0);
  const totalCities = new Set(properties.map(p => p.city)).size;

  // Handler for navigating to add property page
  const handleAddProperty = () => {
    navigate('/profile/add-property');
  };

  return (
    <div className="profile-page">
      <Nav />
      
      <div className="profile-gradient-bg" />
      
      <main className="profile-content main-container">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <h1 className="page-title">Manager Profile</h1>
            <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-main">
              <div className="profile-image-section">
                <img 
                  src={managerProfile.image} 
                  alt="Manager" 
                  className="profile-image"
                />
                <div className="profile-badge">Manager</div>
              </div>

              <div className="profile-info">
                <h2 className="profile-name">{managerProfile.property_name}</h2>
                <div className="profile-detail">
                  <MapPin size={16} />
                  <span>{managerProfile.address}</span>
                </div>
                <div className="profile-detail">
                  <Calendar size={16} />
                  <span>Member since {formatDate(managerProfile.created_at)}</span>
                </div>
                <div className="profile-detail">
                  <Mail size={16} />
                  <span>{managerProfile.email}</span>
                </div>
                <div className="profile-detail">
                  <Phone size={16} />
                  <span>{managerProfile.phone}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <Building2 size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{properties.length}</div>
                  <div className="stat-label">Properties</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Home size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{totalUnits}</div>
                  <div className="stat-label">Total Units</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <MapPin size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{totalCities}</div>
                  <div className="stat-label">Cities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button 
              className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              <Building2 size={16} />
              <span>Properties</span>
              <span className="tab-count">{properties.length}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <Mail size={16} />
              <span>Contact</span>
            </button>
            <button 
              className={`tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <User size={16} />
              <span>About</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'properties' && (
              <div className="properties-section">
                <div className="section-header">
                  <h2 className="section-title">Managed Properties</h2>
                  <span className="property-count">{properties.length} Properties</span>
                </div>

                <div className="properties-grid">
                  {properties.map((property) => (
                    <div key={property.id} className="property-card">
                      <div className="property-header">
                        <div className="property-type-badge">
                          {property.building_type}
                        </div>
                        <div className="property-units">
                          {property.num_units} Units
                        </div>
                      </div>

                      <div className="property-body">
                        <h3 className="property-address">{property.address}</h3>
                        
                        <div className="property-details">
                          <div className="property-detail-item">
                            <MapPin size={14} />
                            <span>{property.city}, {property.province}</span>
                          </div>
                          <div className="property-detail-item">
                            <Building2 size={14} />
                            <span>{property.postal_code}</span>
                          </div>
                        </div>

                        <div className="property-footer">
                          <div className="property-date">
                            <Calendar size={12} />
                            <span>Added {formatDate(property.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <button className="view-property-btn">
                        View Details
                      </button>
                    </div>
                  ))}

                  {/* Add Property Card with onClick handler */}
                  <div className="add-property-card" onClick={handleAddProperty}>
                    <div className="add-property-content">
                      <Plus size={40} />
                      <p>Add New Property</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="contact-section">
                <div className="section-header">
                  <h2 className="section-title">Contact Information</h2>
                </div>

                <div className="contact-grid">
                  <div className="contact-card">
                    <div className="contact-icon">
                      <Mail size={20} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-label">Email Address</div>
                      <div className="contact-value">{managerProfile.email}</div>
                    </div>
                  </div>

                  <div className="contact-card">
                    <div className="contact-icon">
                      <Phone size={20} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-label">Phone Number</div>
                      <div className="contact-value">{managerProfile.phone}</div>
                    </div>
                  </div>

                  <div className="contact-card">
                    <div className="contact-icon">
                      <MapPin size={20} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-label">Office Address</div>
                      <div className="contact-value">{managerProfile.address}</div>
                    </div>
                  </div>

                  <div className="contact-card">
                    <div className="contact-icon">
                      <Briefcase size={20} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-label">Company</div>
                      <div className="contact-value">{managerProfile.property_name}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="about-section">
                <div className="about-card">
                  <h3>Account Information</h3>
                  <div className="about-grid">
                    <div className="about-item">
                      <div className="about-label">User ID</div>
                      <div className="about-value">{managerProfile.user_id}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Profile ID</div>
                      <div className="about-value">{managerProfile.id}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Account Created</div>
                      <div className="about-value">{formatDate(managerProfile.created_at)}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Last Updated</div>
                      <div className="about-value">{formatDate(managerProfile.updated_at)}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Total Properties</div>
                      <div className="about-value">{properties.length} properties</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Total Managed Units</div>
                      <div className="about-value">{totalUnits} units</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePageManager;