import React, { useState } from 'react';
import { Building2, Home, DollarSign, Users, Grid3x3, List } from 'lucide-react';

function RepairList({ repairs, handleRepairClicked }) {
  const PLACEHOLDER_IMAGE = "/defaultjobs.png";
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const handleImageError = (e) => {
    console.log("Image failed to load:", e.target.src);
    console.log("Fallback to:", PLACEHOLDER_IMAGE);
    e.target.src = PLACEHOLDER_IMAGE;
    // Force show the image even on error
    e.target.style.display = 'block';
  };

  const handleImageLoad = (repairId, imageSrc) => {
    console.log("Image loaded successfully:", imageSrc, "for repair:", repairId);
    setImagesLoaded(prev => ({ ...prev, [repairId]: true }));
  };

  return (
    <section className="hp-repairs-section">
      <div className="hp-section-header">
        <div className="hp-section-title-group">
          <h2>All Repair Work</h2>
          <p className="hp-section-subtitle">{repairs.length} repair{repairs.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className="hp-view-toggle">
          <button
            className={`hp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            className={`hp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'hp-repair-cards-grid' : 'hp-repair-cards-list'}>
        {repairs.map((repair) => {
          console.log(`Repair ${repair.id} - Image URL:`, repair.images[0]);
          return (
          <div
            className="hp-repair-card-modern"
            key={repair.id}
            onClick={() => handleRepairClicked(false, repair)}
          >
            <div className="hp-repair-image-container">
              {!imagesLoaded[repair.id] && (
                <div className="hp-image-skeleton">
                  <div className="hp-shimmer"></div>
                </div>
              )}
              <img
                src={repair.images[0]}
                alt={repair.property}
                onError={handleImageError}
                onLoad={(e) => handleImageLoad(repair.id, e.target.src)}
                style={{
                  display: imagesLoaded[repair.id] ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <span
                className={`hp-category-badge ${
                  repair.category.includes("Urgent")
                    ? "hp-urgent"
                    : repair.category.includes("Next")
                    ? "hp-warning"
                    : "hp-info"
                }`}
              >
                {repair.category}
              </span>
            </div>

            <div className="hp-repair-content">
              <div className="hp-repair-header">
                <div className="hp-property-info">
                  <Building2 size={16} className="hp-property-icon" />
                  <div>
                    <h3 className="hp-property-name">{repair.property}</h3>
                    <p className="hp-property-address">{repair.address}</p>
                  </div>
                </div>
              </div>

              <div className="hp-apartment-info">
                <Home size={14} />
                <span>{repair.apartment}</span>
              </div>

              <p className="hp-repair-description">{repair.description}</p>

              <div className="hp-repair-footer">
                <div className="hp-footer-item">
                  <Users size={14} />
                  <span>{repair.bids} bids</span>
                </div>
                <div className="hp-footer-item hp-budget">
                  <DollarSign size={14} />
                  <span>{repair.budget}</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}

export default RepairList;