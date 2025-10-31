import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Award, Briefcase, MapPin, Calendar, Mail, Phone, Building } from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/entrepreneur/profilepageentrepreneur.css';
import { useNavigate } from 'react-router-dom';
import EntrepreneurProfileSkeleton from '../../components/loading/EntrepreneurProfileSkeleton'

function ProfilePageEntrepreneur() {
  const [activeTab, setActiveTab] = useState('specialization');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate();

  const performanceMetrics = {
    averageRating: 4.8,
    totalReviews: 156,
    completedJobs: 342,
    totalProperties: 3,
    totalUnits: 72,
    cities: 2
  };

  const [formData, setFormData] = useState({
    company_name: '',
    license_number: '',
    years_in_business: '',
    num_employees: '',
    address: '',
    phone: '',
    email: '',
    specializations: []
  });

  useEffect(() => {
    fetchEntreprenuerProfile()
  }, [])

  const fetchEntreprenuerProfile = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const userProfile = localStorage.getItem('userProfile')

    if(userProfile) {
      const user = JSON.parse(userProfile)
      const entrepResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if(!entrepResponse.ok) {
        throw new Error(`Error ${entrepResponse.status}`)
      }

      const entrepData = await entrepResponse.json()

      const newEntrepData = {
        companyName: entrepData.profile.company_name,
        licenseNumber: entrepData.profile.license_number,
        yearsInBusiness: entrepData.profile.years_in_business,
        numEmployees: entrepData.profile.num_employees,
        address: entrepData.profile.address,
        phone: '09xxxxxxxxx',
        email: entrepData.profile.email,
        specializations: entrepData.profile.specializations,
        averageRating: entrepData.profile.average_rating,
        portfolio: [
          { id: 1, url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', description: 'Modern Office Renovation - Complete electrical and HVAC upgrade', location: 'Metro City, Central Province', propertyId: '12345', dateAdded: 'February 10, 2023' },
          { id: 2, url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400', description: 'Residential Plumbing Installation - New home construction project', location: 'Metro City, Central Province', propertyId: '12346', dateAdded: 'March 15, 2023' },
          { id: 3, url: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400', description: 'Commercial Electrical System - 5-story building complete wiring', location: 'Riverside, Eastern Province', propertyId: '54321', dateAdded: 'May 20, 2023' }
        ]
      }

      setProfile(newEntrepData)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isEditModalOpen) {
      setFormData({
        company_name: profile.companyName,
        license_number: profile.licenseNumber,
        years_in_business: profile.yearsInBusiness,
        num_employees: profile.numEmployees,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        specializations: profile.specializations
      });
    }
  }, [isEditModalOpen, profile]);

  const specializationOptions = [
    'Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Roofing', 'HVAC',
    'Painting', 'Drywall', 'Flooring', 'Concrete Work', 'Demolition', 'Excavation',
    'Foundation Work', 'Framing', 'Steel Erection', 'Siding Installation',
    'Waterproofing', 'Glazing/Windows', 'Landscaping', 'Paving/Asphalt',
    'Tile Work', 'Insulation', 'Cabinetry', 'Fire Protection', 'Solar Installation',
    'Welding', 'General Contracting'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleSubmit = () => {
    if (!formData.company_name || !formData.license_number || !formData.years_in_business || 
        !formData.num_employees || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsEditModalOpen(false); // Close modal and go back
  };

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("selectedPropertyId")
    navigate("/");
  };

  if(isLoading) {
    return (
      <>
        <div>
          <Nav />
          <EntrepreneurProfileSkeleton />
        </div>
      </>
    )
  }

  return (
    <div className="entrepreneur-app-layout">
      {!isEditModalOpen && <Nav />}
      <div className="entrepreneur-profile-container">
        {/* Gradient Background */}
        <div className="entrepreneur-gradient-bg"></div>
        
        {/* Content Wrapper */}
        <div className="entrepreneur-content-wrapper">
          {/* Profile Header Card */}
          <div className="entrepreneur-profile-header">
            <div className="entrepreneur-profile-header-left">
              <div className="entrepreneur-profile-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200" 
                  alt={profile.companyName}
                  className="entrepreneur-company-logo"
                />
              </div>
              <div className="entrepreneur-profile-info">
                <h1 className="entrepreneur-profile-title">{profile.companyName}</h1>
                <span className="entrepreneur-license-verified">
                  {profile.licenseNumber} <CheckCircle size={16} />
                </span>
                
                {/* Additional Details */}
                <div className="entrepreneur-header-details">
                  <div className="entrepreneur-header-detail-item">
                    <div className="entrepreneur-header-detail-label">
                      Years in Business
                    </div>
                    <div className="entrepreneur-header-detail-value">
                      {profile.yearsInBusiness} years
                    </div>
                  </div>
                  <div className="entrepreneur-header-detail-item">
                    <div className="entrepreneur-header-detail-label">
                      Employees
                    </div>
                    <div className="entrepreneur-header-detail-value">
                      {profile.numEmployees} employees
                    </div>
                  </div>
                  <div className="entrepreneur-header-detail-item">
                    <div className="entrepreneur-header-detail-label">
                      <Phone size={12} />
                      Phone
                    </div>
                    <div className="entrepreneur-header-detail-value light">
                      {profile.phone}
                    </div>
                  </div>
                  <div className="entrepreneur-header-detail-item">
                    <div className="entrepreneur-header-detail-label">
                      <Mail size={12} />
                      Email
                    </div>
                    <div className="entrepreneur-header-detail-value light">
                      {profile.email}
                    </div>
                  </div>
                  <div className="entrepreneur-header-detail-item entrepreneur-header-address">
                    <div className="entrepreneur-header-detail-label">
                      <MapPin size={12} />
                      Address
                    </div>
                    <div className="entrepreneur-header-detail-value light">
                      {profile.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="entrepreneur-edit-button"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </button>
            <button 
              className="entrepreneur-edit-button entrep-logout"
              onClick={() => handleLogout()}
            >
              Log out
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="entrepreneur-tab-navigation">
            <button 
              className={`entrepreneur-tab-button ${activeTab === 'specialization' ? 'active' : ''}`}
              onClick={() => setActiveTab('specialization')}
            >
              Specialization
            </button>
            <button 
              className={`entrepreneur-tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              Performance Metrics
            </button>
            <button 
              className={`entrepreneur-tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
          </div>

          {/* Tab Content */}
          <div className="entrepreneur-tab-content">
            {/* Specialization Tab */}
            {activeTab === 'specialization' && (
              <div className="entrepreneur-tab-panel">
                <h2 className="entrepreneur-section-title">Specializations</h2>
                <div className="entrepreneur-specialization-grid">
                  <div className="entrepreneur-card">
                    <div className="entrepreneur-card-body">
                      <div className="entrepreneur-specializations-display">
                        {profile.specializations.map((spec) => (
                          <span key={spec} className="entrepreneur-spec-badge">{spec}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="entrepreneur-tab-panel">
                <h2 className="entrepreneur-section-title">Performance Metrics</h2>
                <div className="entrepreneur-metrics-container">
                  <div className="entrepreneur-metrics-grid">
                    <div className="entrepreneur-metric-card">
                      <Star size={24} color="#F39C12" fill="#F39C12" />
                      <div>
                        <div className="entrepreneur-metric-label">Average Rating</div>
                        <div className="entrepreneur-metric-value">{performanceMetrics.averageRating}</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <Award size={24} color="#2ECC71" />
                      <div>
                        <div className="entrepreneur-metric-label">Total Reviews</div>
                        <div className="entrepreneur-metric-value">{performanceMetrics.totalReviews}</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <Briefcase size={24} color="#3498DB" />
                      <div>
                        <div className="entrepreneur-metric-label">Completed Jobs</div>
                        <div className="entrepreneur-metric-value">{performanceMetrics.completedJobs}</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <CheckCircle size={24} color="#00A5A9" />
                      <div>
                        <div className="entrepreneur-metric-label">Experience</div>
                        <div className="entrepreneur-metric-value">{profile.yearsInBusiness} Years</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div className="entrepreneur-tab-panel">
                <h2 className="entrepreneur-section-title">Project Portfolio</h2>
                <div className="entrepreneur-form-grid">
                  {profile.portfolio.map((item, index) => (
                    <div key={item.id} className="entrepreneur-card">
                      <div className="entrepreneur-card-header">
                        <span className="entrepreneur-card-badge">
                          {index === 0 ? 'Commercial' : index === 1 ? 'Residential' : 'Commercial'}
                        </span>
                        <span className="entrepreneur-card-count">
                          {index === 0 ? 'Electrical' : index === 1 ? 'Plumbing' : 'Electrical'}
                        </span>
                      </div>
                      
                      <img src={item.url} alt={item.description} className="entrepreneur-portfolio-image" />
                      
                      <div className="entrepreneur-card-body">
                        <h3 className="entrepreneur-card-title">{item.description.split(' - ')[0]}</h3>
                        
                        <div className="entrepreneur-display-field">
                          <div className="entrepreneur-display-label">
                            <MapPin size={14} />
                            Location
                          </div>
                          <div className="entrepreneur-display-value">{item.location}</div>
                        </div>
                        
                        <div className="entrepreneur-display-field">
                          <div className="entrepreneur-display-label">
                            <Building size={14} />
                            Project ID
                          </div>
                          <div className="entrepreneur-display-value">{item.propertyId}</div>
                        </div>
                        
                        <div className="entrepreneur-display-field">
                          <div className="entrepreneur-display-label">
                            <Calendar size={14} />
                            Completed
                          </div>
                          <div className="entrepreneur-display-value">{item.dateAdded}</div>
                        </div>
                      </div>
                      
                      <button className="entrepreneur-view-details-button">View Details</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Company Form Modal */}
      {isEditModalOpen && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal-container">
            <div className="edit-modal-header">
              <div className="edit-header-content">
                <h2 className="edit-modal-title">Edit Company Profile</h2>
                <p className="edit-modal-subtitle">Update your business information</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="edit-close-btn">
                <svg className="edit-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="edit-modal-body">
              <div className="edit-form-group">
                <label className="edit-form-label">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">License Number *</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="edit-form-input"
                  placeholder="Enter business license number"
                />
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label className="edit-form-label">Years in Business *</label>
                  <input
                    type="number"
                    name="years_in_business"
                    value={formData.years_in_business}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">Number of Employees *</label>
                  <input
                    type="number"
                    name="num_employees"
                    value={formData.num_employees}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="0"
                    min="1"
                  />
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label className="edit-form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="edit-form-input"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Business Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="edit-form-textarea"
                  placeholder="Enter your business address"
                  rows="3"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label edit-specializations-label">Specializations</label>
                <div className="edit-specializations-grid">
                  {specializationOptions.map(spec => (
                    <label key={spec} className="edit-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={() => handleSpecializationChange(spec)}
                        className="edit-checkbox-input"
                      />
                      <span className="edit-checkbox-text">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="edit-button-group">
                <button onClick={() => setIsEditModalOpen(false)} className="edit-cancel-btn">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="edit-submit-btn">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePageEntrepreneur;