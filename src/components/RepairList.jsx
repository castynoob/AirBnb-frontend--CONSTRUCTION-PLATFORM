import React, { useState } from 'react';
import { Building2, Home, DollarSign, Users } from 'lucide-react';

function RepairList({ repairs, handleRepairClicked }) {
  const PLACEHOLDER_IMAGE = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=";
  const [imagesLoaded, setImagesLoaded] = useState({});

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  const handleImageLoad = (repairId) => {
    setImagesLoaded(prev => ({ ...prev, [repairId]: true }));
  };

  return (
    <section className="hp-repairs-section">
      <div className="hp-section-header">
        <h2>All Repair Work</h2>
        <p className="hp-section-subtitle">{repairs.length} repair{repairs.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="hp-repair-cards-grid">
        {repairs.map((repair) => (
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
                loading="lazy"
                onError={handleImageError}
                onLoad={() => handleImageLoad(repair.id)}
                style={{ display: imagesLoaded[repair.id] ? 'block' : 'none' }}
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
        ))}
      </div>
    </section>
  );
}

export default RepairList;
