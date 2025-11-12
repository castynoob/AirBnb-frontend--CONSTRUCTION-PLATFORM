import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Award, Briefcase, MapPin, Calendar, Mail, Phone, LogOut, MessageSquare, User, Upload, Camera, X, Crown, TrendingUp, Check, Zap, Shield, Activity, DollarSign, FileText } from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/entrepreneur/profilepageentrepreneur.css';
import '../../styles/entrepreneur/subscriptionpage.css';
import { useNavigate } from 'react-router-dom';
import EntrepreneurProfileSkeleton from '../../components/loading/EntrepreneurProfileSkeleton'
import logo from "../../assets/logo.png"

function ProfilePageEntrepreneur() {
  const [activeTab, setActiveTab] = useState('specialization');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [subscription, setSubscription] = useState({})
  const [userProfile, setUserProfile] = useState(null)
  const navigate = useNavigate();

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

    // Load user profile and subscription data
    const uProfile = localStorage.getItem('userProfile')
    if (uProfile) {
      const u = JSON.parse(uProfile)
      setUserProfile(u)
      if (u.entrepProfile && u.entrepProfile.subscription) {
        setSubscription(u.entrepProfile.subscription.subscription || {})
      }
    }
  }, [])

  // Subscription helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getTrialInfo = () => {
    if (!subscription.trial_end) return null;
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    const totalTrialDays = 14;

    const timeRemaining = trialEndDate - now;
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
    const percentage = Math.min(Math.max((daysRemaining / totalTrialDays) * 100, 0), 100);
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return {
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      percentage,
      totalDays: totalTrialDays
    };
  };

  const getSubscriptionDuration = () => {
    if (!subscription.start || !subscription.current_period_end) return null;
    const start = new Date(subscription.start);
    const end = new Date(subscription.current_period_end);
    const now = new Date();

    const totalDuration = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return { percentage, daysRemaining, endDate: end };
  };

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
        userId: user.id,
        companyName: entrepData.profile.company_name,
        licenseNumber: entrepData.profile.license_number,
        yearsInBusiness: entrepData.profile.years_in_business,
        numEmployees: entrepData.profile.num_employees,
        address: entrepData.profile.address,
        phone: entrepData.profile.phone || 'Not provided',
        email: entrepData.profile.email,
        specializations: entrepData.profile.specializations,
        averageRating: entrepData.profile.average_rating,
        totalReviews: entrepData.profile.total_reviews || 0,
        image: entrepData.profile.image
      }

      setProfile(newEntrepData)
      setIsLoading(false)

      // Fetch reviews after profile is loaded
      fetchReviews(user.id, user.token)
    }
  }

  const fetchReviews = async (userId, token) => {
    setReviewsLoading(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

    try {
      const reviewsResponse = await fetch(`${API_BASE_URL}/api/reviews/reviewed/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if(reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setReviews(reviewsData.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should not exceed 5MB')
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.license_number || !formData.years_in_business ||
        !formData.num_employees || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUpdating(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const userProfile = localStorage.getItem('userProfile')

    try {
      if (userProfile) {
        const user = JSON.parse(userProfile)

        // 1. Update profile picture if new image selected
        if (profileImage) {
          setIsUploadingImage(true)
          const imageFormData = new FormData()
          imageFormData.append('image', profileImage)

          const imageResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile-picture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.token}`
            },
            body: imageFormData
          })

          if (!imageResponse.ok) {
            throw new Error('Failed to upload profile picture')
          }

          setIsUploadingImage(false)
        }

        // 2. Update entrepreneur profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/entrepreneur/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            company_name: formData.company_name,
            license_number: formData.license_number,
            years_in_business: parseInt(formData.years_in_business),
            num_employees: parseInt(formData.num_employees),
            address: formData.address,
            specializations: formData.specializations
          })
        })

        if (!profileResponse.ok) {
          throw new Error('Failed to update profile')
        }

        // 3. Update phone number if different
        if (formData.phone !== profile.phone) {
          await fetch(`${API_BASE_URL}/api/users/phone`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              phone: formData.phone
            })
          })
        }

        // Refresh profile data
        await fetchEntreprenuerProfile()

        // Reset image states
        setProfileImage(null)
        setProfileImagePreview(null)

        setIsEditModalOpen(false)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsUpdating(false)
      setIsUploadingImage(false)
    }
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
                  src={profile.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200"}
                  alt={profile.companyName}
                  className="entrepreneur-company-logo"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200"
                  }}
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
            
            <div className="entrepreneur-header-actions">
              <button
                className="entrepreneur-edit-button"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </button>
              <button
                className="entrepreneur-logout-button"
                onClick={() => handleLogout()}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
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
              Performance & Reviews
            </button>
            <button
              className={`entrepreneur-tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <Crown size={18} style={{marginRight: '8px'}} />
              Subscription
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
                        <div className="entrepreneur-metric-value">{calculateAverageRating() || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <Award size={24} color="#2ECC71" />
                      <div>
                        <div className="entrepreneur-metric-label">Total Reviews</div>
                        <div className="entrepreneur-metric-value">{reviews.length}</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <CheckCircle size={24} color="#00A5A9" />
                      <div>
                        <div className="entrepreneur-metric-label">Experience</div>
                        <div className="entrepreneur-metric-value">{profile.yearsInBusiness} Years</div>
                      </div>
                    </div>
                    <div className="entrepreneur-metric-card">
                      <Briefcase size={24} color="#3498DB" />
                      <div>
                        <div className="entrepreneur-metric-label">Employees</div>
                        <div className="entrepreneur-metric-value">{profile.numEmployees}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <h2 className="entrepreneur-section-title" style={{ marginTop: '2rem' }}>Reviews</h2>
                {reviewsLoading ? (
                  <div className="entrepreneur-reviews-loading">
                    <div className="entrepreneur-loader"></div>
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="entrepreneur-reviews-grid">
                    {reviews.map((review) => (
                      <div key={review.id} className="entrepreneur-review-card">
                        <div className="entrepreneur-review-header">
                          <div className="entrepreneur-review-author">
                            <div className="entrepreneur-review-avatar">
                              <User size={20} />
                            </div>
                            <div>
                              <div className="entrepreneur-review-author-name">
                                {review.reviewer_first_name} {review.reviewer_last_name}
                              </div>
                              <div className="entrepreneur-review-date">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="entrepreneur-review-rating">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < review.rating ? '#F39C12' : 'none'}
                                color="#F39C12"
                              />
                            ))}
                          </div>
                        </div>
                        {review.job_title && (
                          <div className="entrepreneur-review-job">
                            <Briefcase size={14} />
                            <span>{review.job_title}</span>
                          </div>
                        )}
                        <p className="entrepreneur-review-comment">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="entrepreneur-review-images">
                            {review.images.map((image, idx) => (
                              <img
                                key={image.id}
                                src={image.image_url}
                                alt={`Review ${idx + 1}`}
                                className="entrepreneur-review-image"
                                onClick={() => window.open(image.image_url, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="entrepreneur-no-reviews">
                    <MessageSquare size={48} color="#ccc" />
                    <p>No reviews yet</p>
                    <span>Complete jobs to receive reviews from clients</span>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="entrepreneur-tab-panel">
                <h2 className="entrepreneur-section-title">Subscription Management</h2>

                {/* Trial Banner - Only show during trial */}
                {subscription.is_trial && getTrialInfo() && (
                  <div className="status-banner trial-banner">
                    <div className="banner-content">
                      <div className="banner-icon-wrapper">
                        <Zap size={28} />
                      </div>
                      <div className="banner-info">
                        <div className="banner-header">
                          <h3 className="banner-title">Premium Trial Active</h3>
                          <div className="trial-badge">Trial Period</div>
                        </div>
                        <p className="banner-text">
                          {getTrialInfo().daysRemaining} {getTrialInfo().daysRemaining === 1 ? 'day' : 'days'}, {getTrialInfo().hoursRemaining} {getTrialInfo().hoursRemaining === 1 ? 'hour' : 'hours'}, {getTrialInfo().minutesRemaining} {getTrialInfo().minutesRemaining === 1 ? 'minute' : 'minutes'} remaining
                        </p>
                        <p className="banner-subtext">
                          Trial ends on {formatDate(subscription.trial_end)}
                        </p>
                        <div className="trial-progress-bar">
                          <div
                            className="trial-progress-fill"
                            style={{ width: `${getTrialInfo().percentage}%` }}
                          ></div>
                        </div>
                        <div className="trial-progress-label">
                          {getTrialInfo().daysRemaining} of {getTrialInfo().totalDays} days remaining ({Math.round(getTrialInfo().percentage)}%)
                        </div>
                      </div>
                      <div className="trial-countdown">
                        <div className="countdown-number">{getTrialInfo().daysRemaining}</div>
                        <div className="countdown-label">Days Left</div>
                        {getTrialInfo().hoursRemaining > 0 && (
                          <div className="countdown-hours">{getTrialInfo().hoursRemaining}h {getTrialInfo().minutesRemaining}m</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Plan Display - Only show if not on trial */}
                {!subscription.is_trial && subscription.plan_type && (
                  <div className="current-plan-section">
                    <div className="plan-overview-grid">
                      {/* Plan Info Card */}
                      <div className="plan-info-card">
                        <div className="card-header">
                          <div className="card-icon">
                            <Shield size={24} />
                          </div>
                          <div className="status-indicator active">
                            <span className="status-dot"></span>
                            Active
                          </div>
                        </div>
                        <h2 className="plan-name">{subscription.plan_type === 'premium' ? 'Premium' : 'Basic'} Plan</h2>
                        <p className="plan-desc">
                          {subscription.plan_type === 'premium' ? 'Best for professionals' : 'Perfect for getting started'}
                        </p>
                        <div className="plan-price">
                          <span className="price-symbol">$</span>
                          <span className="price-value">{subscription.price || (subscription.plan_type === 'premium' ? 429 : 250)}</span>
                          <span className="price-period">/month</span>
                        </div>
                      </div>

                      {/* Billing Timeline Card */}
                      <div className="billing-timeline-card">
                        <div className="card-header">
                          <div className="card-icon">
                            <Calendar size={24} />
                          </div>
                          <h3 className="card-title">Billing Cycle</h3>
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-dates">
                            <div className="date-item">
                              <span className="date-label">Started</span>
                              <span className="date-value">{formatDate(subscription.start_date || subscription.start)}</span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">Next Billing</span>
                              <span className="date-value">{formatDate(subscription.current_period_end)}</span>
                            </div>
                          </div>
                          {getSubscriptionDuration() && (
                            <div className="timeline-progress">
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${getSubscriptionDuration().percentage}%` }}
                                ></div>
                              </div>
                              <div className="progress-info">
                                <span className="progress-text">{getSubscriptionDuration().daysRemaining} days until renewal</span>
                                <span className="progress-percentage">{Math.round(getSubscriptionDuration().percentage)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage Stats */}
                <div className="dashboard-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <Activity size={24} />
                    </div>
                    <div className="section-text">
                      <h2 className="section-title">Usage Analytics</h2>
                      <p className="section-subtitle">Monitor your monthly bidding activity</p>
                    </div>
                  </div>

                  <div className="stats-grid subs">
                    <div className="stat-card subs">
                      <div className="stat-header subs">
                        <div className="stat-icon bids">
                          <FileText size={22} />
                        </div>
                        <span className="stat-label">Bids Submitted</span>
                      </div>
                      <div className="stat-value subsval">
                        {subscription?.bids?.used || 0}
                        {subscription?.bids?.limit !== 'unlimited' && subscription?.bids?.limit && (
                          <span className="stat-total"> / {subscription.bids.limit}</span>
                        )}
                      </div>
                      {subscription?.bids?.limit !== 'unlimited' && subscription?.bids?.limit && (
                        <div className="stat-progress">
                          <div
                            className="stat-progress-fill"
                            style={{ width: `${(subscription.bids.used / subscription.bids.limit) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="stat-card subs">
                      <div className="stat-header subs">
                        <div className="stat-icon remaining">
                          <Zap size={22} />
                        </div>
                        <span className="stat-label">Remaining Bids</span>
                      </div>
                      <div className="stat-value accent subsval">
                        {subscription?.bids?.remaining === 'unlimited'
                          ? '∞'
                          : subscription?.bids?.remaining || '∞'}
                      </div>
                    </div>

                    <div className="stat-card subs">
                      <div className="stat-header subs">
                        <div className="stat-icon budget">
                          <DollarSign size={22} />
                        </div>
                        <span className="stat-label">Budget Unlocks</span>
                      </div>
                      <div className="stat-value subsval">Unlimited</div>
                    </div>

                    <div className="stat-card subs">
                      <div className="stat-header subs">
                        <div className="stat-icon messages">
                          <MessageSquare size={22} />
                        </div>
                        <span className="stat-label">Active Chats</span>
                      </div>
                      <div className="stat-value subsval">Unlimited</div>
                    </div>
                  </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="comparison-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <Crown size={24} />
                    </div>
                    <div className="section-text">
                      <h2 className="section-title">Feature Comparison</h2>
                      <p className="section-subtitle">Compare all features across subscription tiers</p>
                    </div>
                  </div>

                  <div className="comparison-table-wrapper">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th className="feature-col">Feature</th>
                          <th className="tier-col">No Subscription</th>
                          <th className="tier-col">Trial (Basic)</th>
                          <th className="tier-col premium-col">Trial (Premium)</th>
                          <th className="tier-col">Active Basic</th>
                          <th className="tier-col premium-col">Active Premium</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="feature-name">Browse construction jobs</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                        <tr>
                          <td className="feature-name">View job details & specs</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                        <tr>
                          <td className="feature-name">Submit bids</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell">
                            <Check className="icon-yes" size={20} />
                            <span className="feature-note">(30 max)</span>
                          </td>
                          <td className="tier-cell premium-cell">
                            <Check className="icon-yes" size={20} />
                            <span className="feature-note">(unlimited)</span>
                          </td>
                          <td className="tier-cell">
                            <Check className="icon-yes" size={20} />
                            <span className="feature-note">(30 max)</span>
                          </td>
                          <td className="tier-cell premium-cell">
                            <Check className="icon-yes" size={20} />
                            <span className="feature-note">(unlimited)</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="feature-name">Unlock project budgets</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                        <tr>
                          <td className="feature-name">Message on approved projects</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                        <tr>
                          <td className="feature-name">Priority support</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                        <tr>
                          <td className="feature-name">Advanced analytics</td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                          <td className="tier-cell"><X className="icon-no" size={20} /></td>
                          <td className="tier-cell premium-cell"><Check className="icon-yes" size={20} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
              {/* Profile Image Upload */}
              <div className="edit-form-group">
                <label className="edit-form-label">Company Logo / Profile Picture</label>
                <div className="edit-image-upload-container">
                  <div className="edit-image-preview">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" className="edit-preview-img" />
                    ) : profile.image ? (
                      <img src={profile.image} alt="Current" className="edit-preview-img" />
                    ) : (
                      <div className="edit-no-image">
                        <Camera size={40} />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="edit-image-actions">
                    <label className="edit-upload-btn">
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
                        className="edit-remove-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={18} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="edit-image-hint">Recommended: Square image, max 5MB (JPG, PNG)</p>
                </div>
              </div>

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
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="edit-cancel-btn"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="edit-submit-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      {isUploadingImage ? 'Uploading Image...' : 'Saving Changes...'}
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

export default ProfilePageEntrepreneur;