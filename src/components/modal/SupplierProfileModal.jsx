import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Star,
  Phone,
  Building2,
  MapPin,
  Mail,
  Calendar,
  Award,
  Truck,
  Globe,
  FileText,
  Package,
  Briefcase,
  Shield,
  ExternalLink,
  CheckCircle,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import "../../styles/modal/supplierprofilemodal.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SupplierProfileModal = ({ isOpen, onClose, profile, onRequestMaterials }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("company");
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
    { id: "company", label: t('supplierProfileModal.tabCompanyInfo'), icon: Building2 },
    { id: "contact", label: t('supplierProfileModal.tabContact'), icon: Phone },
    { id: "reviews", label: t('supplierProfileModal.tabReviews'), icon: MessageSquare, badge: reviews.length > 0 ? reviews.length : undefined },
    { id: "delivery", label: t('supplierProfileModal.tabDeliveryAreas'), icon: Truck },
    { id: "business", label: t('supplierProfileModal.tabBusinessOverview'), icon: Briefcase },
    { id: "catalog", label: t('supplierProfileModal.tabProductCatalog'), icon: Package },
    { id: "services", label: t('supplierProfileModal.tabServices'), icon: Shield },
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
      case "company":
        return (
          <div className="spm-tab-content">
            <div className="spm-profile-header">
              <div className="spm-avatar-large">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt={profile.company_name} />
                ) : (
                  profile.company_name?.charAt(0) || profile.first_name?.charAt(0) || "S"
                )}
              </div>
              <div className="spm-profile-info">
                <h3>{profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`}</h3>
                <p className="spm-profile-role">{t('supplierProfileModal.supplier')}</p>
                <div className="spm-rating-display">
                  {renderStars(profile.average_rating || 0)}
                  <span className="spm-rating-text">
                    {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} {t('supplierProfileModal.reviews')})
                  </span>
                </div>
              </div>
            </div>

            <div className="spm-info-grid">
              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <Building2 size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">{t('supplierProfileModal.companyName')}</span>
                  <span className="spm-info-value">
                    {profile.company_name || t('supplierProfileModal.notProvided')}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <Briefcase size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">{t('supplierProfileModal.businessType')}</span>
                  <span className="spm-info-value">
                    {profile.business_type || t('supplierProfileModal.notSpecified')}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">{t('supplierProfileModal.yearsInBusiness')}</span>
                  <span className="spm-info-value">
                    {profile.years_in_business
                      ? `${profile.years_in_business} ${t('supplierProfileModal.years')}`
                      : t('supplierProfileModal.notSpecified')}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">{t('supplierProfileModal.status')}</span>
                  <span className="spm-info-value spm-status-active">{t('supplierProfileModal.active')}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Phone size={20} />
              <h4>{t('supplierProfileModal.contactInformation')}</h4>
            </div>

            <div className="spm-contact-list">
              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <User size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">{t('supplierProfileModal.contactPerson')}</span>
                  <span className="spm-contact-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()
                      : t('supplierProfileModal.notProvided')}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Mail size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">{t('supplierProfileModal.emailAddress')}</span>
                  <span className="spm-contact-value">
                    {profile.email || t('supplierProfileModal.notProvided')}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Phone size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">{t('supplierProfileModal.phoneNumber')}</span>
                  <span className="spm-contact-value">
                    {profile.phone || t('supplierProfileModal.notProvided')}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Globe size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">{t('supplierProfileModal.website')}</span>
                  {profile.website ? (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spm-contact-link"
                    >
                      {profile.website}
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="spm-contact-value">{t('supplierProfileModal.notProvided')}</span>
                  )}
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <MapPin size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">{t('supplierProfileModal.businessAddress')}</span>
                  <span className="spm-contact-value">
                    {profile.address || t('supplierProfileModal.notProvided')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <MessageSquare size={20} />
              <h4>{t('supplierProfileModal.customerReviews')}</h4>
            </div>

            {reviewsLoading ? (
              <div className="spm-reviews-loading">
                <Loader2 size={24} className="spm-spinner" />
                <span>{t('supplierProfileModal.loadingReviews')}</span>
              </div>
            ) : reviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                <div className="spm-reviews-summary">
                  <div className="spm-reviews-rating-box">
                    <span className="spm-reviews-avg">
                      {reviewStats.averageRating.toFixed(1)}
                    </span>
                    <div className="spm-reviews-stars">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <span className="spm-reviews-count">
                      {reviewStats.totalReviews} {reviewStats.totalReviews !== 1 ? t('supplierProfileModal.reviews') : t('supplierProfileModal.review')}
                    </span>
                  </div>
                  <div className="spm-rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewStats.ratingDistribution[star];
                      const percentage = reviewStats.totalReviews > 0
                        ? (count / reviewStats.totalReviews) * 100
                        : 0;
                      return (
                        <div key={star} className="spm-rating-bar-row">
                          <span className="spm-rating-bar-label">{star}</span>
                          <Star size={12} fill="#facc15" stroke="#facc15" />
                          <div className="spm-rating-bar-track">
                            <div
                              className="spm-rating-bar-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="spm-rating-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="spm-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="spm-review-card">
                      <div className="spm-review-header">
                        <div className="spm-review-avatar">
                          {review.reviewer?.profile_picture ? (
                            <img
                              src={review.reviewer.profile_picture}
                              alt={review.reviewer?.company_name || t('supplierProfileModal.reviewer')}
                            />
                          ) : (
                            review.reviewer?.company_name?.charAt(0) || 'R'
                          )}
                        </div>
                        <div className="spm-review-meta">
                          <h5>{review.reviewer?.company_name || t('supplierProfileModal.anonymous')}</h5>
                          <div className="spm-review-rating">
                            {renderStars(review.rating)}
                            <span className="spm-review-date">
                              {new Date(review.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="spm-review-comment">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="spm-reviews-empty">
                <MessageSquare size={40} />
                <h4>{t('supplierProfileModal.noReviewsYet')}</h4>
                <p>{t('supplierProfileModal.noReviewsMessage')}</p>
              </div>
            )}
          </div>
        );

      case "delivery":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Truck size={20} />
              <h4>{t('supplierProfileModal.deliveryAreas')}</h4>
            </div>

            <div className="spm-delivery-content">
              {profile.delivery_areas && profile.delivery_areas.length > 0 ? (
                <>
                  <p className="spm-delivery-intro">
                    {t('supplierProfileModal.deliveryIntro')}
                  </p>
                  <div className="spm-delivery-tags">
                    {profile.delivery_areas.map((area, index) => (
                      <div key={index} className="spm-delivery-tag">
                        <MapPin size={14} />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="spm-empty-state">
                  <Truck size={48} />
                  <h5>{t('supplierProfileModal.noDeliveryAreas')}</h5>
                  <p>{t('supplierProfileModal.noDeliveryAreasMessage')}</p>
                </div>
              )}

              <div className="spm-delivery-note">
                <Award size={18} />
                <p>
                  {t('supplierProfileModal.deliveryNote')}
                </p>
              </div>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Briefcase size={20} />
              <h4>{t('supplierProfileModal.businessOverview')}</h4>
            </div>

            <div className="spm-business-cards">
              <div className="spm-business-stat-card">
                <div className="spm-business-stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="spm-business-stat-info">
                  <span className="spm-business-stat-value">
                    {profile.years_in_business || 0}+
                  </span>
                  <span className="spm-business-stat-label">{t('supplierProfileModal.yearsInBusiness')}</span>
                </div>
              </div>

              <div className="spm-business-stat-card">
                <div className="spm-business-stat-icon">
                  <Truck size={24} />
                </div>
                <div className="spm-business-stat-info">
                  <span className="spm-business-stat-value">
                    {profile.delivery_areas?.length || 0}
                  </span>
                  <span className="spm-business-stat-label">{t('supplierProfileModal.deliveryAreas')}</span>
                </div>
              </div>
            </div>

            <div className="spm-business-details">
              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <FileText size={14} />
                  {t('supplierProfileModal.businessRegistration')}
                </span>
                <span className="spm-business-info-value">
                  {profile.business_registration || t('supplierProfileModal.notProvided')}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Briefcase size={14} />
                  {t('supplierProfileModal.businessType')}
                </span>
                <span className="spm-business-info-value">
                  {profile.business_type || t('supplierProfileModal.notSpecified')}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Shield size={14} />
                  {t('supplierProfileModal.taxId')}
                </span>
                <span className="spm-business-info-value">
                  {profile.tax_id || t('supplierProfileModal.notProvided')}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Award size={14} />
                  {t('supplierProfileModal.businessLicense')}
                </span>
                <span className="spm-business-info-value">
                  {profile.business_license ? t('supplierProfileModal.verified') : t('supplierProfileModal.notProvided')}
                </span>
              </div>
            </div>
          </div>
        );

      case "catalog":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Package size={20} />
              <h4>{t('supplierProfileModal.productCatalog')}</h4>
            </div>

            <div className="spm-catalog-content">
              {profile.catalog_pdf_url ? (
                <div className="spm-catalog-card">
                  <div className="spm-catalog-icon">
                    <FileText size={48} />
                  </div>
                  <div className="spm-catalog-info">
                    <h5>{t('supplierProfileModal.catalogAvailable')}</h5>
                    <p>{t('supplierProfileModal.catalogDescription')}</p>
                    <a
                      href={profile.catalog_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spm-catalog-btn"
                    >
                      <FileText size={16} />
                      {t('supplierProfileModal.viewCatalog')}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="spm-empty-state">
                  <Package size={48} />
                  <h5>{t('supplierProfileModal.noCatalog')}</h5>
                  <p>{t('supplierProfileModal.noCatalogMessage')}</p>
                  <p className="spm-empty-hint">
                    {t('supplierProfileModal.contactForInfo')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "services":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Shield size={20} />
              <h4>{t('supplierProfileModal.serviceInformation')}</h4>
            </div>

            <div className="spm-services-content">
              <div className="spm-service-card">
                <div className="spm-service-header">
                  <div className="spm-service-icon">
                    <Package size={24} />
                  </div>
                  <h5>{t('supplierProfileModal.supplyServices')}</h5>
                </div>
                <p className="spm-service-desc">
                  {t('supplierProfileModal.supplyServicesDesc', { companyName: profile.company_name || t('supplierProfileModal.thisSupplier') })}
                </p>
              </div>

              <div className="spm-service-features">
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>{t('supplierProfileModal.qualityMaterials')}</span>
                </div>
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>{t('supplierProfileModal.competitivePricing')}</span>
                </div>
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>{t('supplierProfileModal.reliableDelivery')}</span>
                </div>
                {profile.years_in_business && profile.years_in_business >= 5 && (
                  <div className="spm-service-feature">
                    <CheckCircle size={16} />
                    <span>{t('supplierProfileModal.establishedBusiness')}</span>
                  </div>
                )}
              </div>

              <div className="spm-services-note">
                <Award size={18} />
                <p>
                  {t('supplierProfileModal.servicesNote')}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="spm-overlay" onClick={onClose}>
      <div className="spm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="spm-header">
          <div className="spm-header-left">
            <div className="spm-header-avatar">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.company_name} />
              ) : (
                profile.company_name?.charAt(0) || profile.first_name?.charAt(0) || "S"
              )}
            </div>
            <div className="spm-header-info">
              <h2>{profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Supplier"}</h2>
              <div className="spm-header-meta">
                <Star size={12} fill="#facc15" stroke="#facc15" />
                <span>
                  {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} {t('supplierProfileModal.reviews')})
                </span>
              </div>
            </div>
          </div>
          <button className="spm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Layout with Sidebar Tabs */}
        <div className="spm-layout">
          {/* Sidebar Tabs */}
          <aside className="spm-sidebar">
            <nav className="spm-sidebar-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`spm-sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="spm-body">{renderTabContent()}</div>
        </div>

        {/* Footer with Request Materials Button */}
        {onRequestMaterials && (
          <div className="spm-footer">
            <button className="spm-request-btn" onClick={onRequestMaterials}>
              <Send size={18} />
              {t('supplierProfileModal.requestMaterials')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierProfileModal;
