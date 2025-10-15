import React from 'react'
import { NavLink } from 'react-router-dom'

function RepairList({ repairs, handleRepairClicked }) {
  return (
    <section className="repairs-list">
      <h2>All Repair Work</h2>
      <div className="repair-cards">
        {repairs.map((repair) => (
          <div
            className="repair-card"
            key={repair.id}
            onClick={() => {
              handleRepairClicked(false, repair)
            }}
          >
            <div className="repair-image">
              <img src={repair.images[0]} alt={repair.property} />
              <span
                className={`urgency-badge ${
                  repair.category.includes("Urgent")
                    ? "urgent"
                    : repair.category.includes("Next")
                    ? "next-year"
                    : "long-term"
                }`}
              >
                {repair.category}
              </span>
            </div>

            <div className="repair-body">
              <h3>{repair.property}</h3>
              <p>{repair.apartment}</p>
              <p>{repair.description}</p>
              <div className="repair-meta">
                <span className="bids">
                  <strong>Bids:</strong> {repair.bids}
                </span>
                <span>
                  <strong>Budget:</strong> {repair.budget}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


export default RepairList