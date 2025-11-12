import React from 'react';
import { AlertTriangle, Clock, Calendar } from "lucide-react";

function SummarySection({ repairs }) {
  // Calculate counts
  const urgentCount = repairs.filter(r => r.category.includes("Urgent")).length;
  const nextYearCount = repairs.filter(r => r.category.includes("Next Year")).length;
  const longTermCount = repairs.filter(r => r.category.includes("Year After")).length;

  return (
    <section className="pm-summary-section">
      <div className="pm-summary-card pm-urgent">
        <div className="pm-card-icon pm-urgent-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="pm-card-content">
          <p className="pm-card-label">Urgent (Current Year)</p>
          <h3 className="pm-card-value">{urgentCount}</h3>
        </div>
      </div>

      <div className="pm-summary-card pm-warning">
        <div className="pm-card-icon pm-warning-icon">
          <Clock size={24} />
        </div>
        <div className="pm-card-content">
          <p className="pm-card-label">Next Year</p>
          <h3 className="pm-card-value">{nextYearCount}</h3>
        </div>
      </div>

      <div className="pm-summary-card pm-info">
        <div className="pm-card-icon pm-info-icon">
          <Calendar size={24} />
        </div>
        <div className="pm-card-content">
          <p className="pm-card-label">Year After</p>
          <h3 className="pm-card-value">{longTermCount}</h3>
        </div>
      </div>
    </section>
  );
}

export default SummarySection;