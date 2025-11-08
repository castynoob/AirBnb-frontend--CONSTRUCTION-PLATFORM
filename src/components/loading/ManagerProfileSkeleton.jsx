import React from "react";
import "../../styles/manager/profilepagemanager.css";

const ManagerProfileSkeleton = () => {
  return (
    <div className="mp-profile-page-manager">
      <div className="mp-profile-content">
        {/* Profile Header Skeleton */}
        <div className="mp-profile-header">
          <div className="mp-profile-banner skeleton"></div>
          <div className="mp-profile-info-section">
            <div className="mp-profile-avatar-container">
              <div className="mp-profile-avatar skeleton">
                <div className="skeleton-circle"></div>
              </div>
            </div>
            <div className="mp-profile-details">
              <div className="mp-profile-name-section">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-badge"></div>
              </div>
              <div className="mp-profile-contact-info">
                <div className="skeleton skeleton-line"></div>
                <div className="skeleton skeleton-line short"></div>
              </div>
            </div>
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="mp-stats-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mp-stat-card">
              <div className="skeleton skeleton-icon"></div>
              <div className="mp-stat-content">
                <div className="skeleton skeleton-stat-value"></div>
                <div className="skeleton skeleton-stat-label"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Properties Section Skeleton */}
        <div className="mp-properties-section">
          <div className="mp-section-header">
            <div className="mp-section-title-group">
              <div className="skeleton skeleton-section-title"></div>
              <div className="skeleton skeleton-count-badge"></div>
            </div>
            <div className="skeleton skeleton-button"></div>
          </div>

          <div className="mp-properties-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mp-property-card skeleton-card">
                <div className="mp-property-card-header">
                  <div className="skeleton skeleton-badge"></div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
                <div className="mp-property-card-body">
                  <div className="skeleton skeleton-line"></div>
                  <div className="skeleton skeleton-line short"></div>
                </div>
                <div className="mp-property-card-footer">
                  <div className="skeleton skeleton-line short"></div>
                  <div className="skeleton skeleton-button small"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfileSkeleton;
