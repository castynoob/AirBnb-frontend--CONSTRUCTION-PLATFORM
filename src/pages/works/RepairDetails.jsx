import React, { useState } from "react";
import Nav from "../../components/Nav";
import {
  ArrowLeft,
  Building2,
  Home,
  Wrench,
  DollarSign,
  ClipboardList,
  Star,
  Heart,
  CheckCircle2,
  Filter,
  TrendingUp,
} from "lucide-react";
import "../../styles/repairdetails.css";

function RepairDetails({ handleRepairClicked, repair }) {
  if (!repair) return null;

  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("rating");

  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  // Enhanced bidders data with additional information
  const bidders = [
    { 
      company_name: "Skyline Roofing Co.", 
      address: "22 King St W, Toronto", 
      average_rating: 4.8, 
      total_reviews: 132,
      bid_amount: 3200,
      completion_time: "5-7 days",
      verified: true
    },
    { 
      company_name: "UrbanBuild Contractors", 
      address: "102 Queen St E, Toronto", 
      average_rating: 4.5, 
      total_reviews: 89,
      bid_amount: 3450,
      completion_time: "7-10 days",
      verified: true
    },
    { 
      company_name: "Maple Restoration Ltd.", 
      address: "85 Front St, Toronto", 
      average_rating: 4.9, 
      total_reviews: 201,
      bid_amount: 2950,
      completion_time: "3-5 days",
      verified: true
    },
    { 
      company_name: "Precision Engineering Works", 
      address: "33 Adelaide St E, Toronto", 
      average_rating: 4.3, 
      total_reviews: 77,
      bid_amount: 3600,
      completion_time: "10-14 days",
      verified: false
    },
    { 
      company_name: "Apex Maintenance Group", 
      address: "17 Dundas Square, Toronto", 
      average_rating: 4.6, 
      total_reviews: 154,
      bid_amount: 3100,
      completion_time: "5-7 days",
      verified: true
    },
    { 
      company_name: "NorthPoint Constructions", 
      address: "210 Bayview Ave, Toronto", 
      average_rating: 4.4, 
      total_reviews: 64,
      bid_amount: 3750,
      completion_time: "7-10 days",
      verified: false
    },
    { 
      company_name: "Everest Repair Solutions", 
      address: "520 College St, Toronto", 
      average_rating: 4.7, 
      total_reviews: 92,
      bid_amount: 3250,
      completion_time: "6-8 days",
      verified: true
    },
    { 
      company_name: "Summit Infrastructure Inc.", 
      address: "40 Spadina Ave, Toronto", 
      average_rating: 4.2, 
      total_reviews: 58,
      bid_amount: 3800,
      completion_time: "12-15 days",
      verified: false
    },
    { 
      company_name: "BlueRock Civil Works", 
      address: "290 Bloor St W, Toronto", 
      average_rating: 4.9, 
      total_reviews: 174,
      bid_amount: 2900,
      completion_time: "4-6 days",
      verified: true
    },
    { 
      company_name: "RapidFix Contractors", 
      address: "600 Richmond St W, Toronto", 
      average_rating: 4.5, 
      total_reviews: 121,
      bid_amount: 3350,
      completion_time: "5-7 days",
      verified: true
    },
  ];

  // Sort bidders based on selected criteria
  const sortedBidders = [...bidders].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.average_rating - a.average_rating;
      case "price-low":
        return a.bid_amount - b.bid_amount;
      case "price-high":
        return b.bid_amount - a.bid_amount;
      case "reviews":
        return b.total_reviews - a.total_reviews;
      default:
        return 0;
    }
  });

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        {/* Header */}
        <header className="details-header">
          <div
            className="back-btn rd"
            onClick={() => handleRepairClicked(true, null)}
          >
            <ArrowLeft size={18} />
            Back
          </div>

          <h2>Repair Details</h2>
          
          {/* Status Badge */}
          <div className="status-badge">
            <CheckCircle2 size={16} />
            Active Bidding
          </div>
        </header>

        {/* Repair Details */}
        <div className="details-card enhanced">
          <div className="details-left">
            <img
              src={repair.images[0]}
              alt={repair.description}
              className="details-image"
            />
            <div className="image-badge">
              {repair.bids} Bids Received
            </div>
          </div>

          <div className="details-right">
            <h3 className="repair-title">
              <Wrench size={22} />
              {repair.description}
            </h3>

            <div className="details-grid">
              <div className="detail-box">
                <div className="icon-circle blue">
                  <Building2 size={18} />
                </div>
                <div>
                  <label>Property</label>
                  <p>{repair.property}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle green">
                  <Home size={18} />
                </div>
                <div>
                  <label>Apartment Code</label>
                  <p>{repair.apartment}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle orange">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <label>Category</label>
                  <p>{repair.category}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle purple">
                  <DollarSign size={18} />
                </div>
                <div>
                  <label>Budget</label>
                  <p className="budget">${repair.budget}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bidders Section */}
        <section className="bidders-section">
          <div className="bidders-header">
            <h3>Bidders ({bidders.length})</h3>
            
            <div className="sort-controls">
              <Filter size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="rating">Highest Rated</option>
                <option value="price-low">Lowest Price</option>
                <option value="price-high">Highest Price</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>

          <div className="bidders-list">
            {sortedBidders.map((bidder, index) => (
              <div key={index} className="bidder-card">
                {/* Verified Badge */}
                {bidder.verified && (
                  <div className="verified-badge">
                    <CheckCircle2 size={14} />
                    Verified
                  </div>
                )}

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
                    aria-label="Add to favorites"
                  >
                    <Heart
                      size={18}
                      fill={
                        favorites.includes(bidder.company_name)
                          ? "#E74C3C"
                          : "none"
                      }
                      stroke="#E74C3C"
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

                {/* Bid Details */}
                <div className="bid-details">
                  <div className="bid-detail-item">
                    <label>Bid Amount</label>
                    <p className="bid-amount">
                      ${bidder.bid_amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bid-detail-item">
                    <label>
                      <TrendingUp size={12} />
                      Timeline
                    </label>
                    <p>{bidder.completion_time}</p>
                  </div>
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