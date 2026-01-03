import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Star,
  Briefcase,
  Phone,
  Building2,
  MapPin,
  Mail,
  Calendar,
  Award,
  Home,
  Shield,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Loader2,
} from "lucide-react";
import "../../styles/modal/propertymanagerprofilemodal.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PropertyManagerProfileModal = ({ isOpen, onClose, profile }) => {
  const [activeTab, setActiveTab] = useState("account");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && profile?.id) {
      fetchReviews(profile.id);
    }
  }, [isOpen, profile?.id]);

  const fetchReviews = async (userId) => {
    setReviewsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/reviews/reviewed/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);

        // Calculate stats
        if (data.length > 0) {
          const total = data.reduce((sum, r) => sum + r.rating, 0);
          const avg = total / data.length;
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          data.forEach(r => {
            if (distribution[r.rating] !== undefined) {
              distribution[r.rating]++;
            }
          });
          setReviewStats({
            averageRating: avg,
            totalReviews: data.length,
            ratingDistribution: distribution
          });
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (!isOpen || !profile) return null;

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "reviews", label: "Reviews", icon: MessageSquare, badge: reviews.length > 0 ? reviews.length : undefined },
    { id: "personal", label: "Personal Details", icon: Shield },
    { id: "properties", label: "Properties", icon: Home },
    { id: "business", label: "Business Info", icon: Building2 },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} size={16} fill="#facc15" stroke="#facc15" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} size={16} fill="#facc15" stroke="#facc15" style={{ clipPath: "inset(0 50% 0 0)" }} />
        );
      } else {
        stars.push(
          <Star key={i} size={16} fill="none" stroke="#d1d5db" />
        );
      }
    }
    return stars;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-profile-header">
              <div className="pmpm-avatar-large">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt={profile.company_name} />
                ) : (
                  profile.company_name?.charAt(0) || profile.first_name?.charAt(0) || "P"
                )}
              </div>
              <div className="pmpm-profile-info">
                <h3>{profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`}</h3>
                <p className="pmpm-profile-role">Property Manager</p>
                <div className="pmpm-rating-display">
                  {renderStars(profile.average_rating || 0)}
                  <span className="pmpm-rating-text">
                    {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="pmpm-info-grid">
              <div className="pmpm-info-card">
                <div className="pmpm-info-icon">
                  <User size={18} />
                </div>
                <div className="pmpm-info-details">
                  <span className="pmpm-info-label">Full Name</span>
                  <span className="pmpm-info-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()
                      : "Not provided"}
                  </span>
                </div>
              </div>

              <div className="pmpm-info-card">
                <div className="pmpm-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="pmpm-info-details">
                  <span className="pmpm-info-label">Years of Experience</span>
                  <span className="pmpm-info-value">
                    {profile.years_experience
                      ? `${profile.years_experience} years`
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="pmpm-info-card">
                <div className="pmpm-info-icon">
                  <Briefcase size={18} />
                </div>
                <div className="pmpm-info-details">
                  <span className="pmpm-info-label">Expertise Area</span>
                  <span className="pmpm-info-value">
                    {profile.expertise_area || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="pmpm-info-card">
                <div className="pmpm-info-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="pmpm-info-details">
                  <span className="pmpm-info-label">Status</span>
                  <span className="pmpm-info-value pmpm-status-active">Active</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-performance-header">
              <div className="pmpm-rating-large">
                <span className="pmpm-rating-number">
                  {Number(profile.average_rating || 0).toFixed(1)}
                </span>
                <div className="pmpm-rating-stars">
                  {renderStars(profile.average_rating || 0)}
                </div>
                <span className="pmpm-rating-count">
                  Based on {profile.total_reviews || 0} reviews
                </span>
              </div>
            </div>

            <div className="pmpm-stats-grid">
              <div className="pmpm-stat-card">
                <div className="pmpm-stat-value">{profile.total_reviews || 0}</div>
                <div className="pmpm-stat-label">Total Reviews</div>
              </div>
              <div className="pmpm-stat-card">
                <div className="pmpm-stat-value">
                  {profile.years_experience || 0}
                </div>
                <div className="pmpm-stat-label">Years Experience</div>
              </div>
              <div className="pmpm-stat-card">
                <div className="pmpm-stat-value">{profile.total_properties || 0}</div>
                <div className="pmpm-stat-label">Properties Managed</div>
              </div>
            </div>

            <div className="pmpm-performance-note">
              <Award size={18} />
              <p>
                This property manager maintains a professional track record
                in managing properties and working with contractors.
              </p>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-section-header">
              <MessageSquare size={20} />
              <h4>Reviews from Contractors</h4>
            </div>

            {reviewsLoading ? (
              <div className="pmpm-reviews-loading">
                <Loader2 size={24} className="pmpm-spinner" />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                <div className="pmpm-reviews-summary">
                  <div className="pmpm-reviews-rating-box">
                    <span className="pmpm-reviews-avg">
                      {reviewStats.averageRating.toFixed(1)}
                    </span>
                    <div className="pmpm-reviews-stars">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <span className="pmpm-reviews-count">
                      {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="pmpm-rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewStats.ratingDistribution[star];
                      const percentage = reviewStats.totalReviews > 0
                        ? (count / reviewStats.totalReviews) * 100
                        : 0;
                      return (
                        <div key={star} className="pmpm-rating-bar-row">
                          <span className="pmpm-rating-bar-label">{star}</span>
                          <Star size={12} fill="#facc15" stroke="#facc15" />
                          <div className="pmpm-rating-bar-track">
                            <div
                              className="pmpm-rating-bar-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="pmpm-rating-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="pmpm-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="pmpm-review-card">
                      <div className="pmpm-review-header">
                        <div className="pmpm-review-avatar">
                          {review.reviewer?.profile_picture ? (
                            <img
                              src={review.reviewer.profile_picture}
                              alt={review.reviewer?.company_name || 'Reviewer'}
                            />
                          ) : (
                            review.reviewer?.company_name?.charAt(0) || 'R'
                          )}
                        </div>
                        <div className="pmpm-review-meta">
                          <h5>{review.reviewer?.company_name || 'Anonymous'}</h5>
                          <div className="pmpm-review-rating">
                            {renderStars(review.rating)}
                            <span className="pmpm-review-date">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.job && (
                        <div className="pmpm-review-job">
                          <Briefcase size={14} />
                          <span>{review.job.title}</span>
                        </div>
                      )}
                      {review.comment && (
                        <p className="pmpm-review-comment">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="pmpm-reviews-empty">
                <MessageSquare size={40} />
                <h4>No Reviews Yet</h4>
                <p>This property manager hasn't received any reviews from contractors yet.</p>
              </div>
            )}
          </div>
        );

      case "personal":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-section-header">
              <Shield size={20} />
              <h4>Personal Information</h4>
            </div>

            <div className="pmpm-personal-list">
              <div className="pmpm-personal-item">
                <div className="pmpm-personal-icon">
                  <User size={18} />
                </div>
                <div className="pmpm-personal-details">
                  <span className="pmpm-personal-label">Full Name</span>
                  <span className="pmpm-personal-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()
                      : "Not provided"}
                  </span>
                </div>
              </div>

              <div className="pmpm-personal-item">
                <div className="pmpm-personal-icon">
                  <Mail size={18} />
                </div>
                <div className="pmpm-personal-details">
                  <span className="pmpm-personal-label">Email Address</span>
                  <span className="pmpm-personal-value">
                    {profile.email || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="pmpm-personal-item">
                <div className="pmpm-personal-icon">
                  <Phone size={18} />
                </div>
                <div className="pmpm-personal-details">
                  <span className="pmpm-personal-label">Phone Number</span>
                  <span className="pmpm-personal-value">
                    {profile.phone || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="pmpm-personal-item">
                <div className="pmpm-personal-icon">
                  <MapPin size={18} />
                </div>
                <div className="pmpm-personal-details">
                  <span className="pmpm-personal-label">Location</span>
                  <span className="pmpm-personal-value">
                    {profile.city && profile.province
                      ? `${profile.city}, ${profile.province}`
                      : profile.address || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "properties":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-section-header">
              <Home size={20} />
              <h4>Properties Overview</h4>
            </div>

            <div className="pmpm-properties-summary">
              <div className="pmpm-property-stat-card">
                <div className="pmpm-property-stat-icon">
                  <Building2 size={24} />
                </div>
                <div className="pmpm-property-stat-info">
                  <span className="pmpm-property-stat-value">
                    {profile.total_properties || 0}
                  </span>
                  <span className="pmpm-property-stat-label">Total Properties</span>
                </div>
              </div>

              <div className="pmpm-property-stat-card">
                <div className="pmpm-property-stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="pmpm-property-stat-info">
                  <span className="pmpm-property-stat-value">
                    {profile.years_experience || 0}+
                  </span>
                  <span className="pmpm-property-stat-label">Years Managing</span>
                </div>
              </div>
            </div>

            {profile.expertise_area && (
              <div className="pmpm-expertise-section">
                <h5>Primary Expertise</h5>
                <div className="pmpm-expertise-badge">
                  <Briefcase size={14} />
                  <span>{profile.expertise_area}</span>
                </div>
              </div>
            )}

            <div className="pmpm-properties-note">
              <Home size={18} />
              <p>
                This property manager oversees {profile.total_properties || 0} properties
                and has {profile.years_experience || 0} years of experience in property management.
              </p>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="pmpm-tab-content">
            <div className="pmpm-section-header">
              <Building2 size={20} />
              <h4>Business Information</h4>
            </div>

            <div className="pmpm-business-details">
              <div className="pmpm-business-card">
                <div className="pmpm-business-header">
                  <div className="pmpm-business-avatar">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.company_name} />
                    ) : (
                      profile.company_name?.charAt(0) || "C"
                    )}
                  </div>
                  <div className="pmpm-business-name-section">
                    <h3>{profile.company_name || "Property Management Company"}</h3>
                    <span className="pmpm-business-type">Property Management</span>
                  </div>
                </div>

                <div className="pmpm-business-info-list">
                  <div className="pmpm-business-info-row">
                    <span className="pmpm-business-info-label">
                      <Briefcase size={14} />
                      Expertise Area
                    </span>
                    <span className="pmpm-business-info-value">
                      {profile.expertise_area || "General Property Management"}
                    </span>
                  </div>

                  <div className="pmpm-business-info-row">
                    <span className="pmpm-business-info-label">
                      <Home size={14} />
                      Properties Managed
                    </span>
                    <span className="pmpm-business-info-value">
                      {profile.total_properties || 0} properties
                    </span>
                  </div>

                  <div className="pmpm-business-info-row">
                    <span className="pmpm-business-info-label">
                      <Calendar size={14} />
                      Years in Business
                    </span>
                    <span className="pmpm-business-info-value">
                      {profile.years_experience
                        ? `${profile.years_experience} years`
                        : "Not specified"}
                    </span>
                  </div>

                  <div className="pmpm-business-info-row">
                    <span className="pmpm-business-info-label">
                      <MapPin size={14} />
                      Business Address
                    </span>
                    <span className="pmpm-business-info-value">
                      {profile.address || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pmpm-overlay" onClick={onClose}>
      <div className="pmpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pmpm-header">
          <div className="pmpm-header-left">
            <div className="pmpm-header-avatar">
              {profile.profile_picture || profile.image ? (
                <img src={profile.profile_picture || profile.image} alt={profile.company_name} />
              ) : (
                profile.company_name?.charAt(0) || profile.first_name?.charAt(0) || "P"
              )}
            </div>
            <div className="pmpm-header-info">
              <h2>{profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Property Manager"}</h2>
              <div className="pmpm-header-meta">
                <Star size={12} fill="#facc15" stroke="#facc15" />
                <span>
                  {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
                </span>
              </div>
            </div>
          </div>
          <button className="pmpm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Layout with Sidebar Tabs */}
        <div className="pmpm-layout">
          {/* Sidebar Tabs */}
          <aside className="pmpm-sidebar">
            <nav className="pmpm-sidebar-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`pmpm-sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="pmpm-body">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default PropertyManagerProfileModal;
