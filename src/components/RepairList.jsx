import React from 'react';
import { Building2, Home, DollarSign, Users } from 'lucide-react';

function RepairList({ repairs, handleRepairClicked }) {
  return (
    <section className="pm-repairs-section">
      <div className="pm-section-header">
        <h2>All Repair Work</h2>
        <p className="pm-section-subtitle">{repairs.length} repair{repairs.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="pm-repair-cards-grid">
        {repairs.map((repair) => (
          <div
            className="pm-repair-card-modern"
            key={repair.id}
            onClick={() => handleRepairClicked(false, repair)}
          >
            <div className="pm-repair-image-container">
              <img src={repair.images[0]} alt={repair.property} />
              <span
                className={`pm-category-badge ${
                  repair.category.includes("Urgent")
                    ? "urgent"
                    : repair.category.includes("Next")
                    ? "warning"
                    : "info"
                }`}
              >
                {repair.category}
              </span>
            </div>

            <div className="pm-repair-content">
              <div className="pm-repair-header">
                <div className="pm-property-info">
                  <Building2 size={16} className="pm-property-icon" />
                  <div>
                    <h3 className="pm-property-name">{repair.property}</h3>
                    <p className="pm-property-address">{repair.address}</p>
                  </div>
                </div>
              </div>

              <div className="pm-apartment-info">
                <Home size={14} />
                <span>{repair.apartment}</span>
              </div>

              <p className="pm-repair-description">{repair.description}</p>

              <div className="pm-repair-footer">
                <div className="pm-footer-item">
                  <Users size={14} />
                  <span>{repair.bids} bids</span>
                </div>
                <div className="pm-footer-item budget">
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