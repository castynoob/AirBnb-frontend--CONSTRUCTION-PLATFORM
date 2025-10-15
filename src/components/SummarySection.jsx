import React from 'react'
import { Bell, AlertTriangle, Wrench, Clock, Calendar } from "lucide-react";

function SummarySection() {
  return (
    <section className="summary-section">
          <div className="summary-card urgent">
            <AlertTriangle size={22} />
            <div>
              <h3>Urgent (Current Year)</h3>
              <p>8 inspections flagged</p>
            </div>
          </div>

          <div className="summary-card next-year">
            <Clock size={22} />
            <div>
              <h3>Next Year</h3>
              <p>12 scheduled repairs</p>
            </div>
          </div>

          <div className="summary-card long-term">
            <Calendar size={22} />
            <div>
              <h3>Year After</h3>
              <p>5 long-term repairs</p>
            </div>
          </div>
    </section>
  )
}

export default SummarySection