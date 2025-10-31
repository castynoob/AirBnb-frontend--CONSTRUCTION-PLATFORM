import React from "react";
import "../../styles/entrepreneur/profilepageentrepreneur.css";

const EntrepreneurProfileSkeleton = () => {
  return (
    <div className="entrepreneur-app-layout">
      <div className="entrepreneur-profile-container">
        <div className="entrepreneur-gradient-bg"></div>
        <div className="entrepreneur-content-wrapper">
          {/* Header Skeleton */}
          <div className="entrepreneur-profile-header">
            <div className="entrepreneur-profile-header-left">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-info">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
            <div className="skeleton skeleton-button" />
          </div>

          {/* Tab Buttons Skeleton */}
          <div className="entrepreneur-tab-navigation">
            <div className="skeleton skeleton-tab" />
            <div className="skeleton skeleton-tab" />
            <div className="skeleton skeleton-tab" />
          </div>

          {/* Tab Content Skeleton */}
          <div className="entrepreneur-tab-content">
            <div className="entrepreneur-form-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="entrepreneur-card">
                  <div className="skeleton skeleton-image-card" />
                  <div className="entrepreneur-card-body">
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                  <div className="skeleton skeleton-button" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntrepreneurProfileSkeleton;