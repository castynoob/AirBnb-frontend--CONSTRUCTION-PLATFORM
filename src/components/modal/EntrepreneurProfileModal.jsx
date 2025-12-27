import React, { useState } from "react";
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
} from "lucide-react";
import "../../styles/modal/entrepreneurprofilemodal.css";

const EntrepreneurProfileModal = ({ isOpen, onClose, profile }) => {
  const [activeTab, setActiveTab] = useState("account");

  if (!isOpen || !profile) return null;

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "performance", label: "Performance", icon: Star },
    { id: "specializations", label: "Specializations", icon: Briefcase },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "company", label: "Company", icon: Building2 },
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
          <div className="epm-tab-content">
            <div className="epm-profile-header">
              <div className="epm-avatar-large">
                {profile.company_name?.charAt(0) || "E"}
              </div>
              <div className="epm-profile-info">
                <h3>{profile.company_name || "Company Name"}</h3>
                <p className="epm-profile-role">Entrepreneur</p>
                <div className="epm-rating-display">
                  {renderStars(profile.average_rating || 0)}
                  <span className="epm-rating-text">
                    {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
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
                  <span className="epm-info-label">Full Name</span>
                  <span className="epm-info-value">
                    {profile.first_name && profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : "Not provided"}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">Years in Business</span>
                  <span className="epm-info-value">
                    {profile.years_in_business
                      ? `${profile.years_in_business} years`
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <Shield size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">License Number</span>
                  <span className="epm-info-value">
                    {profile.license_number || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="epm-info-card">
                <div className="epm-info-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="epm-info-details">
                  <span className="epm-info-label">Status</span>
                  <span className="epm-info-value epm-status-active">Active</span>
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
                  Based on {profile.total_reviews || 0} reviews
                </span>
              </div>
            </div>

            <div className="epm-stats-grid">
              <div className="epm-stat-card">
                <div className="epm-stat-value">{profile.total_reviews || 0}</div>
                <div className="epm-stat-label">Total Reviews</div>
              </div>
              <div className="epm-stat-card">
                <div className="epm-stat-value">
                  {profile.years_in_business || 0}
                </div>
                <div className="epm-stat-label">Years Experience</div>
              </div>
              <div className="epm-stat-card">
                <div className="epm-stat-value">{profile.num_employees || 0}</div>
                <div className="epm-stat-label">Team Members</div>
              </div>
            </div>

            <div className="epm-performance-note">
              <Award size={18} />
              <p>
                This entrepreneur has been verified and maintains a professional
                track record in the construction industry.
              </p>
            </div>
          </div>
        );

      case "specializations":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <Briefcase size={20} />
              <h4>Areas of Expertise</h4>
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
                <p>No specializations listed</p>
              </div>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="epm-tab-content">
            <div className="epm-section-header">
              <Phone size={20} />
              <h4>Contact Information</h4>
            </div>

            <div className="epm-contact-list">
              <div className="epm-contact-item">
                <div className="epm-contact-icon">
                  <Mail size={18} />
                </div>
                <div className="epm-contact-details">
                  <span className="epm-contact-label">Email Address</span>
                  <span className="epm-contact-value">
                    {profile.email || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="epm-contact-item">
                <div className="epm-contact-icon">
                  <MapPin size={18} />
                </div>
                <div className="epm-contact-details">
                  <span className="epm-contact-label">Business Address</span>
                  <span className="epm-contact-value">
                    {profile.address || "Not provided"}
                  </span>
                </div>
              </div>

              {profile.delivery_coverage && (
                <div className="epm-contact-item">
                  <div className="epm-contact-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="epm-contact-details">
                    <span className="epm-contact-label">Service Area</span>
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
              <h4>Company Information</h4>
            </div>

            <div className="epm-company-details">
              <div className="epm-company-card">
                <div className="epm-company-header">
                  <div className="epm-company-avatar">
                    {profile.company_name?.charAt(0) || "C"}
                  </div>
                  <div className="epm-company-name-section">
                    <h3>{profile.company_name || "Company Name"}</h3>
                    <span className="epm-company-type">Construction Company</span>
                  </div>
                </div>

                <div className="epm-company-info-list">
                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Shield size={14} />
                      License Number
                    </span>
                    <span className="epm-company-info-value">
                      {profile.license_number || "Not provided"}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Users size={14} />
                      Number of Employees
                    </span>
                    <span className="epm-company-info-value">
                      {profile.num_employees || "Not specified"}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <Calendar size={14} />
                      Years in Business
                    </span>
                    <span className="epm-company-info-value">
                      {profile.years_in_business
                        ? `${profile.years_in_business} years`
                        : "Not specified"}
                    </span>
                  </div>

                  <div className="epm-company-info-row">
                    <span className="epm-company-info-label">
                      <MapPin size={14} />
                      Location
                    </span>
                    <span className="epm-company-info-value">
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
    <div className="epm-overlay" onClick={onClose}>
      <div className="epm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="epm-header">
          <div className="epm-header-left">
            <div className="epm-header-avatar">
              {profile.company_name?.charAt(0) || "E"}
            </div>
            <div className="epm-header-info">
              <h2>{profile.company_name || "Entrepreneur Profile"}</h2>
              <div className="epm-header-meta">
                <Star size={12} fill="#facc15" stroke="#facc15" />
                <span>
                  {Number(profile.average_rating || 0).toFixed(1)} ({profile.total_reviews || 0} reviews)
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
