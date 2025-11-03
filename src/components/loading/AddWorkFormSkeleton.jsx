import React from "react";

function AddWorkFormSkeleton() {
  return (
    <div className="aws-add-work-page">
      <div className="aws-main-container">
        <header className="aws-form-header aws-skeleton-header">
          <div className="aws-skeleton-btns">
            <div className="aws-skeleton-btn"></div>
            <div className="aws-skeleton-btn"></div>
          </div>
          <div>
            <div className="aws-skeleton-title"></div>
            <div className="aws-skeleton-subtitle"></div>
          </div>
        </header>

        <div className="aws-add-work-form aws-skeleton">
          {/* Section 1 */}
          <section className="aws-form-section">
            <div className="aws-skeleton-section-title"></div>
            <div className="aws-skeleton-input"></div>
          </section>

          {/* Section 2 */}
          <section className="aws-form-section">
            <div className="aws-skeleton-section-title"></div>
            <div className="aws-skeleton-input"></div>
            <div className="aws-skeleton-textarea"></div>
            <div className="aws-form-row">
              <div className="aws-skeleton-input"></div>
              <div className="aws-skeleton-input"></div>
            </div>
            <div className="aws-form-row">
              <div className="aws-skeleton-input"></div>
              <div className="aws-skeleton-input"></div>
            </div>
          </section>

          {/* Upload Section */}
          <section className="aws-form-section">
            <div className="aws-skeleton-section-title"></div>
            <div className="aws-skeleton-upload"></div>
          </section>

          <div className="aws-form-actions">
            <div className="aws-skeleton-btn-action"></div>
            <div className="aws-skeleton-btn-action"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWorkFormSkeleton;