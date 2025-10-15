import React, { useState } from "react";
import Nav from "../components/Nav";
import {
  ArrowLeft,
  Building2,
  Home,
  Wrench,
  DollarSign,
  ClipboardList,
  Image as ImageIcon,
  Star,
  Heart,
} from "lucide-react";
import "../styles/repairdetails.css";

function RepairDetails({ handleRepairClicked, repair }) {
  if (!repair) return null;

  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  const bidders = [
    { company_name: "Skyline Roofing Co.", address: "22 King St W, Toronto", average_rating: 4.8, total_reviews: 132 },
    { company_name: "UrbanBuild Contractors", address: "102 Queen St E, Toronto", average_rating: 4.5, total_reviews: 89 },
    { company_name: "Maple Restoration Ltd.", address: "85 Front St, Toronto", average_rating: 4.9, total_reviews: 201 },
    { company_name: "Precision Engineering Works", address: "33 Adelaide St E, Toronto", average_rating: 4.3, total_reviews: 77 },
    { company_name: "Apex Maintenance Group", address: "17 Dundas Square, Toronto", average_rating: 4.6, total_reviews: 154 },
    { company_name: "NorthPoint Constructions", address: "210 Bayview Ave, Toronto", average_rating: 4.4, total_reviews: 64 },
    { company_name: "Everest Repair Solutions", address: "520 College St, Toronto", average_rating: 4.7, total_reviews: 92 },
    { company_name: "Summit Infrastructure Inc.", address: "40 Spadina Ave, Toronto", average_rating: 4.2, total_reviews: 58 },
    { company_name: "BlueRock Civil Works", address: "290 Bloor St W, Toronto", average_rating: 4.9, total_reviews: 174 },
    { company_name: "RapidFix Contractors", address: "600 Richmond St W, Toronto", average_rating: 4.5, total_reviews: 121 },
  ];

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        {/* Header */}
        <header className="details-header">
          <button
            className="back-btn"
            onClick={() => handleRepairClicked(true, null)}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h2>Repair Details</h2>
        </header>

        {/* Repair Details */}
        <div className="details-card enhanced">
          <div className="details-left">
            <img
              src={repair.images[0]}
              alt={repair.description}
              className="details-image"
            />
          </div>

          <div className="details-right">
            <h3 className="repair-title">
              <Wrench size={22} />
              {repair.description}
            </h3>

            <div className="details-grid">
              <div className="detail-box">
                <div className="icon-circle blue"><Building2 size={18} /></div>
                <div>
                  <label>Property</label>
                  <p>{repair.property}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle green"><Home size={18} /></div>
                <div>
                  <label>Apartment Code</label>
                  <p>{repair.apartment}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle orange"><ClipboardList size={18} /></div>
                <div>
                  <label>Category</label>
                  <p>{repair.category}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle purple"><DollarSign size={18} /></div>
                <div>
                  <label>Budget</label>
                  <p className="budget">${repair.budget}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle yellow"><ImageIcon size={18} /></div>
                <div>
                  <label>Bids Received</label>
                  <p>{repair.bids}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bidders Section */}
        <section className="bidders-section">
          <h3>Bidders</h3>

          <div className="bidders-list">
            {bidders.map((bidder, index) => (
              <div key={index} className="bidder-card">
                <div className="bidder-header">
                  <div className="bidder-info">
                    <h4>{bidder.company_name}</h4>
                    <p>{bidder.address}</p>
                  </div>
                  <button
                    className={`favorite-btn ${
                      favorites.includes(bidder.company_name) ? "favorited" : ""
                    }`}
                    onClick={() => toggleFavorite(bidder.company_name)}
                  >
                    <Heart
                      size={18}
                      fill={
                        favorites.includes(bidder.company_name)
                          ? "#ef4444"
                          : "none"
                      }
                      stroke="#ef4444"
                    />
                  </button>
                </div>

                <div className="bidder-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.round(bidder.average_rating) ? "#facc15" : "none"}
                        stroke="#facc15"
                      />
                    ))}
                  </div>
                  <small>
                    {bidder.average_rating} ({bidder.total_reviews} reviews)
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default RepairDetails;
