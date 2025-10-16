import React from 'react';
import { Building2, Home, DollarSign, Users } from 'lucide-react';

function RepairList({ repairs, handleRepairClicked }) {
  return (
    <section className="repairs-section">
      <div className="section-header">
        <h2>All Repair Work</h2>
        <p className="section-subtitle">{repairs.length} repair{repairs.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="repair-cards-grid">
        {repairs.map((repair) => (
          <div
            className="repair-card-modern"
            key={repair.id}
            onClick={() => handleRepairClicked(false, repair)}
          >
            <div className="repair-image-container">
              <img src={repair.images[0]} alt={repair.property} />
              <span
                className={`category-badge ${
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

            <div className="repair-content">
              <div className="repair-header">
                <div className="property-info">
                  <Building2 size={16} className="property-icon" />
                  <div>
                    <h3 className="property-name">{repair.property}</h3>
                    <p className="property-address">{repair.address}</p>
                  </div>
                </div>
              </div>

              <div className="apartment-info">
                <Home size={14} />
                <span>{repair.apartment}</span>
              </div>

              <p className="repair-description">{repair.description}</p>

              <div className="repair-footer">
                <div className="footer-item">
                  <Users size={14} />
                  <span>{repair.bids} bids</span>
                </div>
                <div className="footer-item budget">
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