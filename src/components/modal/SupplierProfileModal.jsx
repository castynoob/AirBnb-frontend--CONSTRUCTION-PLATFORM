import React, { useState } from "react";
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
} from "lucide-react";
import "../../styles/modal/supplierprofilemodal.css";

const SupplierProfileModal = ({ isOpen, onClose, profile, onRequestMaterials }) => {
  const [activeTab, setActiveTab] = useState("company");

  if (!isOpen || !profile) return null;

  const tabs = [
    { id: "company", label: "Company Info", icon: Building2 },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "delivery", label: "Delivery Areas", icon: Truck },
    { id: "business", label: "Business Overview", icon: Briefcase },
    { id: "catalog", label: "Product Catalog", icon: Package },
    { id: "services", label: "Services", icon: Shield },
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
                <p className="spm-profile-role">Supplier</p>
                <div className="spm-rating-display">
                  {renderStars(profile.average_rating || 0)}
                  <span className="spm-rating-text">
                    {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
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
                  <span className="spm-info-label">Company Name</span>
                  <span className="spm-info-value">
                    {profile.company_name || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <Briefcase size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">Business Type</span>
                  <span className="spm-info-value">
                    {profile.business_type || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">Years in Business</span>
                  <span className="spm-info-value">
                    {profile.years_in_business
                      ? `${profile.years_in_business} years`
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="spm-info-card">
                <div className="spm-info-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="spm-info-details">
                  <span className="spm-info-label">Status</span>
                  <span className="spm-info-value spm-status-active">Active</span>
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
              <h4>Contact Information</h4>
            </div>

            <div className="spm-contact-list">
              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <User size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">Contact Person</span>
                  <span className="spm-contact-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()
                      : "Not provided"}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Mail size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">Email Address</span>
                  <span className="spm-contact-value">
                    {profile.email || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Phone size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">Phone Number</span>
                  <span className="spm-contact-value">
                    {profile.phone || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <Globe size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">Website</span>
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
                    <span className="spm-contact-value">Not provided</span>
                  )}
                </div>
              </div>

              <div className="spm-contact-item">
                <div className="spm-contact-icon">
                  <MapPin size={18} />
                </div>
                <div className="spm-contact-details">
                  <span className="spm-contact-label">Business Address</span>
                  <span className="spm-contact-value">
                    {profile.address || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "delivery":
        return (
          <div className="spm-tab-content">
            <div className="spm-section-header">
              <Truck size={20} />
              <h4>Delivery Areas</h4>
            </div>

            <div className="spm-delivery-content">
              {profile.delivery_areas && profile.delivery_areas.length > 0 ? (
                <>
                  <p className="spm-delivery-intro">
                    This supplier delivers to the following areas:
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
                  <h5>No Delivery Areas Listed</h5>
                  <p>This supplier has not specified their delivery areas yet.</p>
                </div>
              )}

              <div className="spm-delivery-note">
                <Award size={18} />
                <p>
                  Contact the supplier directly for specific delivery schedules
                  and coverage in your area.
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
              <h4>Business Overview</h4>
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
                  <span className="spm-business-stat-label">Years in Business</span>
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
                  <span className="spm-business-stat-label">Delivery Areas</span>
                </div>
              </div>
            </div>

            <div className="spm-business-details">
              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <FileText size={14} />
                  Business Registration
                </span>
                <span className="spm-business-info-value">
                  {profile.business_registration || "Not provided"}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Briefcase size={14} />
                  Business Type
                </span>
                <span className="spm-business-info-value">
                  {profile.business_type || "Not specified"}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Shield size={14} />
                  Tax ID
                </span>
                <span className="spm-business-info-value">
                  {profile.tax_id || "Not provided"}
                </span>
              </div>

              <div className="spm-business-info-row">
                <span className="spm-business-info-label">
                  <Award size={14} />
                  Business License
                </span>
                <span className="spm-business-info-value">
                  {profile.business_license ? "Verified" : "Not provided"}
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
              <h4>Product Catalog</h4>
            </div>

            <div className="spm-catalog-content">
              {profile.catalog_pdf_url ? (
                <div className="spm-catalog-card">
                  <div className="spm-catalog-icon">
                    <FileText size={48} />
                  </div>
                  <div className="spm-catalog-info">
                    <h5>Product Catalog Available</h5>
                    <p>View or download the supplier's complete product catalog</p>
                    <a
                      href={profile.catalog_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spm-catalog-btn"
                    >
                      <FileText size={16} />
                      View Catalog
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="spm-empty-state">
                  <Package size={48} />
                  <h5>No Catalog Available</h5>
                  <p>This supplier has not uploaded a product catalog yet.</p>
                  <p className="spm-empty-hint">
                    Contact them directly for product information.
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
              <h4>Service Information</h4>
            </div>

            <div className="spm-services-content">
              <div className="spm-service-card">
                <div className="spm-service-header">
                  <div className="spm-service-icon">
                    <Package size={24} />
                  </div>
                  <h5>Supply Services</h5>
                </div>
                <p className="spm-service-desc">
                  {profile.company_name || "This supplier"} provides construction materials
                  and supplies to contractors and property managers.
                </p>
              </div>

              <div className="spm-service-features">
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>Quality Materials</span>
                </div>
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>Competitive Pricing</span>
                </div>
                <div className="spm-service-feature">
                  <CheckCircle size={16} />
                  <span>Reliable Delivery</span>
                </div>
                {profile.years_in_business && profile.years_in_business >= 5 && (
                  <div className="spm-service-feature">
                    <CheckCircle size={16} />
                    <span>Established Business</span>
                  </div>
                )}
              </div>

              <div className="spm-services-note">
                <Award size={18} />
                <p>
                  Contact the supplier for quotes, bulk pricing, and specific
                  product inquiries.
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
                  {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
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
              Request Materials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierProfileModal;
