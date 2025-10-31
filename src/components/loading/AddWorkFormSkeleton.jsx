import React from "react";
import "../../styles/manager/addworkform.css";

const AddWorkFormSkeleton = () => {
  return (
    <div className="add-work-page">
      <div className="main-container">
        <header className="form-header">
          <div className="aw-header-buttons">
            <div className="skeleton skeleton-button" style={{ width: '100px' }} />
            <div className="skeleton skeleton-button" style={{ width: '150px' }} />
          </div>
          <div>
            <div className="skeleton skeleton-title" style={{ width: '300px', height: '32px', marginBottom: '8px' }} />
            <div className="skeleton skeleton-line" style={{ width: '250px' }} />
          </div>
        </header>

        <div className="add-work-form">
          {/* Property Selection Skeleton */}
          <section className="form-section">
            <div className="skeleton skeleton-line" style={{ width: '150px', marginBottom: '16px' }} />
            <div className="form-group">
              <div className="skeleton skeleton-line" style={{ width: '80px', marginBottom: '8px' }} />
              <div className="skeleton skeleton-input" />
            </div>
          </section>

          {/* Work Details Skeleton */}
          <section className="form-section">
            <div className="skeleton skeleton-line" style={{ width: '120px', marginBottom: '16px' }} />

            <div className="form-group">
              <div className="skeleton skeleton-line" style={{ width: '60px', marginBottom: '8px' }} />
              <div className="skeleton skeleton-input" />
            </div>

            <div className="form-group">
              <div className="skeleton skeleton-line" style={{ width: '90px', marginBottom: '8px' }} />
              <div className="skeleton skeleton-textarea" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '70px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '70px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '80px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '100px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '120px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
              <div className="form-group">
                <div className="skeleton skeleton-line" style={{ width: '120px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-input" />
              </div>
            </div>
          </section>

          {/* Image Upload Skeleton */}
          <section className="form-section">
            <div className="skeleton skeleton-line" style={{ width: '130px', marginBottom: '16px' }} />
            <div className="skeleton skeleton-upload-area" />
          </section>

          {/* Form Actions Skeleton */}
          <div className="form-actions">
            <div className="skeleton skeleton-button" style={{ width: '100px' }} />
            <div className="skeleton skeleton-button" style={{ width: '100px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWorkFormSkeleton;
