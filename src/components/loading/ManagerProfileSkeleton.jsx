import React from "react";
import "../../styles/manager/profilepagemanager.css";

const ManagerProfileSkeleton = () => {
  return (
    <div className="mp-profile-page-modern">
      <div className="mp-layout">
        {/* Sidebar Skeleton */}
        <aside className="mp-sidebar mps-sidebar">
          <div className="mp-sidebar-header">
            <div className="mps-avatar mps-skeleton"></div>
            <div className="mp-sidebar-user">
              <div className="mps-skeleton mps-text-lg"></div>
              <div className="mps-skeleton mps-text-sm"></div>
            </div>
          </div>

          <nav className="mp-sidebar-nav">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="mps-nav-item mps-skeleton"></div>
            ))}
          </nav>

          <div className="mp-sidebar-footer">
            <div className="mps-nav-item mps-skeleton"></div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="mp-main-content">
          <div className="mp-tab-content">
            {/* Header Skeleton */}
            <div className="mp-content-header">
              <div className="mps-skeleton mps-heading"></div>
              <div className="mps-skeleton mps-text-md"></div>
            </div>

            {/* Profile Card Skeleton */}
            <div className="mp-profile-card-modern mps-card">
              <div className="mp-profile-card-left">
                <div className="mp-avatar-container">
                  <div className="mps-avatar-large mps-skeleton"></div>
                </div>
                <div className="mp-profile-info-modern">
                  <div className="mps-skeleton mps-text-lg"></div>
                  <div className="mps-skeleton mps-badge"></div>
                </div>
              </div>
              <div className="mps-skeleton mps-button"></div>
            </div>

            {/* Info Section Skeleton */}
            <div className="mp-info-section">
              <div className="mps-skeleton mps-section-title"></div>
              <div className="mp-info-grid-modern">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="mp-info-item-modern mps-info-item">
                    <div className="mps-icon mps-skeleton"></div>
                    <div className="mp-info-details">
                      <div className="mps-skeleton mps-label"></div>
                      <div className="mps-skeleton mps-value"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Info Section Skeleton */}
            <div className="mp-info-section">
              <div className="mps-skeleton mps-section-title"></div>
              <div className="mp-info-grid-modern">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="mp-info-item-modern mps-info-item">
                    <div className="mps-icon mps-skeleton"></div>
                    <div className="mp-info-details">
                      <div className="mps-skeleton mps-label"></div>
                      <div className="mps-skeleton mps-value"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Skeleton */}
            <div className="mp-info-note mps-note">
              <div className="mps-icon-sm mps-skeleton"></div>
              <div className="mps-skeleton mps-text-md" style={{ flex: 1 }}></div>
            </div>
          </div>
        </main>
      </div>

      {/* Skeleton Styles */}
      <style>{`
        /* Manager Profile Skeleton (mps-) styles */
        .mps-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: mps-shimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes mps-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .mps-sidebar {
          opacity: 0.7;
        }

        .mps-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .mps-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
        }

        .mps-text-sm {
          height: 12px;
          width: 80%;
          margin-top: 4px;
        }

        .mps-text-md {
          height: 14px;
          width: 60%;
        }

        .mps-text-lg {
          height: 18px;
          width: 120px;
        }

        .mps-heading {
          height: 28px;
          width: 200px;
          margin-bottom: 8px;
        }

        .mps-nav-item {
          height: 44px;
          width: 100%;
          margin-bottom: 4px;
          border-radius: 8px;
        }

        .mps-card {
          opacity: 0.8;
        }

        .mps-button {
          height: 40px;
          width: 120px;
          border-radius: 8px;
        }

        .mps-badge {
          height: 24px;
          width: 100px;
          border-radius: 12px;
          margin-top: 4px;
        }

        .mps-section-title {
          height: 20px;
          width: 150px;
          margin-bottom: 16px;
        }

        .mps-info-item {
          opacity: 0.8;
        }

        .mps-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
        }

        .mps-icon-sm {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .mps-label {
          height: 12px;
          width: 80px;
          margin-bottom: 6px;
        }

        .mps-value {
          height: 16px;
          width: 120px;
        }

        .mps-note {
          opacity: 0.6;
        }

        /* Hide actual content in skeleton state */
        .mps-card .mp-profile-info-modern h3,
        .mps-card .mp-profile-info-modern span,
        .mps-info-item .mp-info-details label,
        .mps-info-item .mp-info-details span {
          color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ManagerProfileSkeleton;
