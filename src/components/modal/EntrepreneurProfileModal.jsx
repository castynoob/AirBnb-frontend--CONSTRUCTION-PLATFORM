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
  Users,
  Shield,
  CheckCircle,
  MessageSquare,
  Loader2,
  Home,
} from "lucide-react";
import "../../styles/modal/entrepreneurprofilemodal.css";
import { useLanguage } from "../../contexts/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const EntrepreneurProfileModal = ({ isOpen, onClose, profile }) => {
  const { t, language } = useLanguage();
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
    { id: "account", label: t('profileModal.tab_account') || "Account", icon: User },
    { id: "performance", label: t('profileModal.tab_performance') || "Performance", icon: Star },
    { id: "reviews", label: t('profileModal.tab_reviews') || "Reviews", icon: MessageSquare, badge: reviews.length > 0 ? reviews.length : undefined },
    { id: "specializations", label: t('profileModal.tab_specializations') || "Specializations", icon: Briefcase },
    { id: "contact", label: t('profileModal.tab_contact') || "Contact", icon: Phone },
    { id: "company", label: t('profileModal.tab_company') || "Company", icon: Building2 },
  ];

  const reviewsLabel = (n) => {
    const count = Number(n) || 0;
    return count === 1
      ? (t('profileModal.reviewsCountOne') || '{{count}} review').replace('{{count}}', count)
      : (t('profileModal.reviewsCountMany') || '{{count}} reviews').replace('{{count}}', count);
  };

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
          <div className="epm-tab-content">
            <div className="epm-profile-header">
              <div className="epm-avatar-large">
                {profile.company_name?.charAt(0) || "E"}
              </div>
              <div className="epm-profile-info">
                <h3>{profile.company_name || (t('profileModal.companyName') || 'Company Name')}</h3>
                <p className="epm-profile-role">{t('profileModal.entrepreneur') || 'Entrepreneur'}</p>
                <div className="epm-rating-display">
                  {renderStars(profile.average_rating || 0)}
                  <span className="epm-rating-text">
                    {Number(profile.average_rating || 0).toFixed(1)} ({reviewsLabel(profile.total_reviews)})
                  </span>
                </div>
              </div>
            </div>

            <div className="epm-info-grid">
              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <User size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">{t('profileModal.fullName') || 'Full Name'}</span>
                  <span className="epm-info-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : (t('profileModal.notProvided') || 'Not provided')}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">{t('profileModal.yearsInBusiness') || 'Years in Business'}</span>
                  <span className="epm-info-value">
                    {profile.years_in_business
                      ? `${profile.years_in_business} ${t('profileModal.years') || 'years'}`
                      : (t('profileModal.notSpecified') || 'Not specified')}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <Shield size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">{t('profileModal.licenseNumber') || 'License Number'}</span>
                  <span className="epm-info-value">
                    {profile.license_number || (t('profileModal.notProvided') || 'Not provided')}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">{t('profile.statusLabel') || 'Status'}</span>
                  <span className="epm-info-value epm-status-active">{t('profile.statusActive') || 'Active'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="epm-tab-content">
            <div className="epm-performance-header">
              <div className="epm-rating-large">
                <span className="epm-rating-number">
                  {Number(profile.average_rating || 0).toFixed(1)}
                </span>
                <div className="epm-rating-stars">
                  {renderStars(profile.average_rating || 0)}
                </div>
                <span className="epm-rating-count">
                  {(t('profileModal.basedOnReviews') || 'Based on {{count}} reviews').replace('{{count}}', profile.total_reviews || 0)}
                </span>
              </div>
            </div>

            <div className="epm-stats-grid">
              <div className="epm-stat-card">
                <div className="epm-stat-value">{profile.total_reviews || 0}</div>
                <div className="epm-stat-label">{t('profileModal.totalReviews') || 'Total Reviews'}</div>
              </div>
              <div className="epm-stat-card">
                <div className="epm-stat-value">
                  {profile.years_in_business || 0}
                </div>
                <div className="epm-stat-label">{t('profileModal.yearsExperience') || 'Years Experience'}</div>
              </div>
              <div className="epm-stat-card">
                <div className="epm-stat-value">{profile.num_employees || 0}</div>
                <div className="epm-stat-label">{t('profileModal.teamMembers') || 'Team Members'}</div>
              </div>
            </div>

            <div className="epm-performance-note">
              <Award size={18} />
              <p>
                {t('profileModal.entTrackRecord') || 'This entrepreneur has been verified and maintains a professional track record in the construction industry.'}
              </p>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <MessageSquare size={20} />
              <h4>{t('profileModal.reviewsFromManagers') || 'Reviews from Property Managers'}</h4>
            </div>

            {reviewsLoading ? (
              <div className="epm-reviews-loading">
                <Loader2 size={24} className="epm-spinner" />
                <span>{t('profileModal.loadingReviews') || 'Loading reviews...'}</span>
              </div>
            ) : reviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                <div className="epm-reviews-summary">
                  <div className="epm-reviews-rating-box">
                    <span className="epm-reviews-avg">
                      {reviewStats.averageRating.toFixed(1)}
                    </span>
                    <div className="epm-reviews-stars">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <span className="epm-reviews-count">
                      {reviewsLabel(reviewStats.totalReviews)}
                    </span>
                  </div>
                  <div className="epm-rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewStats.ratingDistribution[star];
                      const percentage = reviewStats.totalReviews > 0
                        ? (count / reviewStats.totalReviews) * 100
                        : 0;
                      return (
                        <div key={star} className="epm-rating-bar-row">
                          <span className="epm-rating-bar-label">{star}</span>
                          <Star size={12} fill="#facc15" stroke="#facc15" />
                          <div className="epm-rating-bar-track">
                            <div
                              className="epm-rating-bar-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="epm-rating-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="epm-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="epm-review-card">
                      <div className="epm-review-header">
                        <div className="epm-review-avatar">
                          {review.reviewer?.profile_picture ? (
                            <img
                              src={review.reviewer.profile_picture}
                              alt={review.reviewer?.company_name || 'Reviewer'}
                            />
                          ) : (
                            review.reviewer?.company_name?.charAt(0) || 'R'
                          )}
                        </div>
                        <div className="epm-review-meta">
                          <h5>{review.reviewer?.company_name || (t('profileModal.anonymous') || 'Anonymous')}</h5>
                          <div className="epm-review-rating">
                            {renderStars(review.rating)}
                            <span className="epm-review-date">
                              {new Date(review.created_at).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.job && (
                        <div className="epm-review-job">
                          <Home size={14} />
                          <span>{review.job.title}</span>
                        </div>
                      )}
                      {review.comment && (
                        <p className="epm-review-comment">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="epm-reviews-empty">
                <MessageSquare size={40} />
                <h4>{t('profileModal.noReviewsYet') || 'No Reviews Yet'}</h4>
                <p>{t('profileModal.entNoReviewsDesc') || "This entrepreneur hasn't received any reviews from property managers yet."}</p>
              </div>
            )}
          </div>
        );

      case "specializations":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <Briefcase size={20} />
              <h4>{t('profileModal.areasOfExpertise') || 'Areas of Expertise'}</h4>
            </div>

            {profile.specializations && profile.specializations.length > 0 ? (
              <div className="epm-specializations-grid">
                {profile.specializations.map((spec, index) => (
                  <div key={index} className="epm-specialization-card">
                    <CheckCircle size={16} />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="epm-empty-state">
                <Briefcase size={32} />
                <p>{t('profileModal.noSpecializations') || 'No specializations listed'}</p>
              </div>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <Phone size={20} />
              <h4>{t('profileModal.contactInformation') || 'Contact Information'}</h4>
            </div>

            <div className="epm-contact-list">
              <div className="epm-contact-item">
                <div className="epm-contact-icon">
                  <Mail size={18} />
                </div>
                <div className="epm-contact-details">
                  <span className="epm-contact-label">{t('profileModal.emailAddress') || 'Email Address'}</span>
                  <span className="epm-contact-value">
                    {profile.email || (t('profileModal.notProvided') || 'Not provided')}
                  </span>
                </div>
              </div>

              <div className="epm-contact-item">
                <div className="epm-contact-icon">
                  <MapPin size={18} />
                </div>
                <div className="epm-contact-details">
                  <span className="epm-contact-label">{t('profileModal.businessAddress') || 'Business Address'}</span>
                  <span className="epm-contact-value">
                    {profile.address || (t('profileModal.notProvided') || 'Not provided')}
                  </span>
                </div>
              </div>

              {profile.delivery_coverage && (
                <div className="epm-contact-item">
                  <div className="epm-contact-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="epm-contact-details">
                    <span className="epm-contact-label">{t('profileModal.serviceArea') || 'Service Area'}</span>
                    <span className="epm-contact-value">
                      {profile.delivery_coverage}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "company":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <Building2 size={20} />
              <h4>{t('profileModal.companyInformation') || 'Company Information'}</h4>
            </div>

            <div className="epm-company-details">
              <div className="epm-company-card">
                <div className="epm-company-header">
                  <div className="epm-company-avatar">
                    {profile.company_name?.charAt(0) || "C"}
                  </div>
                  <div className="epm-company-name-section">
                    <h3>{profile.company_name || (t('profileModal.companyName') || 'Company Name')}</h3>
                    <span className="epm-company-type">{t('profileModal.constructionCompany') || 'Construction Company'}</span>
                  </div>
                </div>

                <div className="epm-company-info-list">
                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Shield size={14} />
                      {t('profileModal.licenseNumber') || 'License Number'}
                    </span>
                    <span className="epm-company-info-value">
                      {profile.license_number || (t('profileModal.notProvided') || 'Not provided')}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Users size={14} />
                      {t('profileModal.numberOfEmployees') || 'Number of Employees'}
                    </span>
                    <span className="epm-company-info-value">
                      {profile.num_employees || (t('profileModal.notSpecified') || 'Not specified')}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Calendar size={14} />
                      {t('profileModal.yearsInBusiness') || 'Years in Business'}
                    </span>
                    <span className="epm-company-info-value">
                      {profile.years_in_business
                        ? `${profile.years_in_business} ${t('profileModal.years') || 'years'}`
                        : (t('profileModal.notSpecified') || 'Not specified')}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <MapPin size={14} />
                      {t('profileModal.location') || 'Location'}
                    </span>
                    <span className="epm-company-info-value">
                      {profile.address || (t('profileModal.notProvided') || 'Not provided')}
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
    <div className="epm-overlay" onClick={onClose}>
      <div className="epm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="epm-header">
          <div className="epm-header-left">
            <div className="epm-header-avatar">
              {profile.company_name?.charAt(0) || "E"}
            </div>
            <div className="epm-header-info">
              <h2>{profile.company_name || (t('profileModal.entrepreneurProfileTitle') || 'Entrepreneur Profile')}</h2>
              <div className="epm-header-meta">
                <Star size={12} fill="#facc15" stroke="#facc15" />
                <span>
                  {Number(profile.average_rating || 0).toFixed(1)} ({reviewsLabel(profile.total_reviews)})
                </span>
              </div>
            </div>
          </div>
          <button className="epm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Layout with Sidebar Tabs */}
        <div className="epm-layout">
          {/* Sidebar Tabs */}
          <aside className="epm-sidebar">
            <nav className="epm-sidebar-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`epm-sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="epm-body">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default EntrepreneurProfileModal;
