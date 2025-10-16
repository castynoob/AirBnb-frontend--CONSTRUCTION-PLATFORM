import React from 'react';
import { AlertTriangle, Clock, Calendar, TrendingUp } from "lucide-react";

function SummarySection({ repairs }) {
  // Calculate counts
  const urgentCount = repairs.filter(r => r.category.includes("Urgent")).length;
  const nextYearCount = repairs.filter(r => r.category.includes("Next Year")).length;
  const longTermCount = repairs.filter(r => r.category.includes("Year After")).length;

  return (
    <section className="summary-section">
      <div className="summary-card urgent">
        <div className="card-icon urgent-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="card-content">
          <p className="card-label">Urgent (Current Year)</p>
          <h3 className="card-value">{urgentCount}</h3>
          <p className="card-subtitle">Requires immediate attention</p>
        </div>
      </div>

      <div className="summary-card warning">
        <div className="card-icon warning-icon">
          <Clock size={24} />
        </div>
        <div className="card-content">
          <p className="card-label">Next Year</p>
          <h3 className="card-value">{nextYearCount}</h3>
          <p className="card-subtitle">Scheduled for next year</p>
        </div>
      </div>

      <div className="summary-card info">
        <div className="card-icon info-icon">
          <Calendar size={24} />
        </div>
        <div className="card-content">
          <p className="card-label">Year After</p>
          <h3 className="card-value">{longTermCount}</h3>
          <p className="card-subtitle">Long-term planning</p>
        </div>
      </div>
    </section>
  );
}

export default SummarySection;