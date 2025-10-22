import React, { useEffect, useState } from "react";
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
import "../../styles/manager/repairdetails.css"

function RepairDetails({ handleRepairClicked, repair }) {
  if (!repair) return null;

  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [bidders, setBidders] = useState([])

  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  useEffect(() => {
    setBidders([])
    const userProfile = localStorage.getItem('userProfile')
    const fetchBids = async () => {
      if(userProfile) {
        const user = JSON.parse(userProfile)
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/api/bids/job/${repair.data.jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })

        if(!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`)
        }

        const data = await response.json()
        console.log(data.bids)
        data.bids.forEach(bid => {
          getEntrepreneur(bid, user)
        })
      }
    }

    fetchBids()
  }, [])

  const getEntrepreneur = async (bid, user) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/users/entrepreneur/${bid.entrepreneur_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (!response.ok) {
        throw new Error(`ERROR: ${response.status}`)
      }

      const data = await response.json()
      console.log("CONTRACTOR:", data.profile)

      setBidders(prevBidders => {
        // ✅ Check if bid ID already exists
        const exists = prevBidders.some(existing => existing.id === bid.id)
        if (exists) return prevBidders

        // ✅ Add only if not existing
        return [
          ...prevBidders,
          {
            id: bid.id,
            company_name: data.profile.company_name,
            address: data.profile.address,
            average_rating: data.profile.average_rating,
            total_reviews: data.profile.total_reviews,
            bid_amount: Number(bid.amount),
          }
        ]
      })
    } catch (err) {
      console.log(err)
    }
  }


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
                  <p className="budget">{repair.budget}</p>
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