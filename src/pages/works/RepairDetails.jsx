import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import {
  ArrowLeft,
  Building2,
  Home,
  DollarSign,
  Star,
  Heart,
  Filter,
  X,
  Mail,
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import "../../styles/manager/repairdetails.css";

function RepairDetails({ handleRepairClicked, repair }) {
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [bidders, setBidders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingBidders, setIsLoadingBidders] = useState(true);

  const PLACEHOLDER_IMAGE = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=";
  
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  // Fetch job images
  useEffect(() => {
    if (!repair?.data?.jobId) {
      setIsLoadingImages(false);
      return;
    }

    const fetchJobImages = async () => {
      try {
        setIsLoadingImages(true);
        const userProfile = localStorage.getItem("userProfile");
        if (!userProfile) return;

        const user = JSON.parse(userProfile);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(
          `${API_BASE_URL}/api/jobs/${repair.data.jobId}/images`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched job images:", data.images);
        setJobImages(data.images || []);
      } catch (err) {
        console.error("Error fetching job images:", err);
        setJobImages([]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchJobImages();
  }, [repair]);

  // Fetch bidders
  useEffect(() => {
    if (!repair?.data?.jobId) {
      setIsLoadingBidders(false);
      return;
    }

    setBidders([]);
    setIsLoadingBidders(true);
    const userProfile = localStorage.getItem("userProfile");

    const fetchBids = async () => {
      if (userProfile) {
        const user = JSON.parse(userProfile);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/bids/job/${repair.data.jobId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch jobs: ${response.status}`);
          }

          const data = await response.json();
          console.log(data.bids);

          if (data.bids.length === 0) {
            setIsLoadingBidders(false);
            return;
          }

          data.bids.forEach((bid) => {
            getEntrepreneur(bid, user);
          });

          setIsLoadingBidders(false);
        } catch (error) {
          console.error('Error fetching bids:', error);
          setIsLoadingBidders(false);
        }
      }
    };

    fetchBids();
  }, [repair]);

  const getEntrepreneur = async (bid, user) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/${bid.entrepreneur_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ERROR: ${response.status}`);
      }

      const data = await response.json();
      console.log("CONTRACTOR:", data.profile);
      
      setBidders((prevBidders) => {
        const exists = prevBidders.some((existing) => existing.id === bid.id);
        if (exists) return prevBidders;
        
        return [
          ...prevBidders,
          {
            id: bid.id,
            company_name: data.profile.company_name,
            address: data.profile.address,
            average_rating: data.profile.average_rating,
            total_reviews: data.profile.total_reviews,
            bid_amount: Number(bid.amount),
            bid_message: bid.message,
            bid_status: bid.status,
            profile: data.profile,
          },
        ];
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleBidderClick = (bidder) => {
    setSelectedBidder(bidder);
    setShowModal(true);
  };

  const handleAcceptBid = async () => {
    if (!selectedBidder) return;
    setIsProcessing(true);

    try {
      const userProfile = localStorage.getItem("userProfile");
      const user = JSON.parse(userProfile);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(
        `${API_BASE_URL}/api/bids/${selectedBidder.id}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(data.message || `Failed to approve bid: ${response.status}`);
      }

      const data = await response.json();

      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/${repair.data.jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted', entrepreneur_id: `${selectedBidder.profile.id}` })
      });

      if (!jobResponse.ok) {
        throw new Error(data.message || `Failed to approve bid: ${response.status}`);
      }

      const bidsOnJob = await fetch(`${API_BASE_URL}/api/bids/job/${repair.data.jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!bidsOnJob.ok) {
        throw new Error(data.message || `Failed to approve bid: ${response.status}`);
      }

      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "approved" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "approved" }));
      
      showNotification(
        data.message || "Bid approved successfully! Messaging is now unlocked.",
        "success"
      );

      setShowModal(false);
    } catch (error) {
      console.error("Error accepting bid:", error);
      showNotification(
        error.message || "Failed to approve bid. Please try again.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineBid = async () => {
    if (!selectedBidder) return;
    setIsProcessing(true);

    try {
      const userProfile = localStorage.getItem("userProfile");
      const user = JSON.parse(userProfile);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(
        `${API_BASE_URL}/api/bids/${selectedBidder.id}/decline`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to decline bid: ${response.status}`);
      }

      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "declined" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "declined" }));
      showNotification(data.message || "Bid declined successfully", "info");
      setShowModal(false);
    } catch (error) {
      console.error("Error declining bid:", error);
      showNotification(
        error.message || "Failed to decline bid. Please try again.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

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

  // Get the display image - first job image or placeholder
  const displayImage = jobImages.length > 0 ? jobImages[0].image_url : PLACEHOLDER_IMAGE;

  // Handle null repair after hooks
  if (!repair) return null;

  return (
    <div className="homepage">
      <Nav />
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === "success" && <CheckCircle size={24} />}
              {notification.type === "error" && <XCircle size={24} />}
              {notification.type === "info" && <AlertCircle size={24} />}
            </div>
            <div className="notification-message">{notification.message}</div>
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="main-container">
        {/* Header */}
        <header className="rd-header">
          <button
            className="rd-back-btn"
            onClick={() => handleRepairClicked(true, null)}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h1 className="rd-title">
            {repair.property_type === "Residential"
              ? "Residential"
              : "Commercial"}{" "}
            Repair Details
          </h1>
          <div className="rd-header-badge">
            <span className={`rd-category-badge ${
              repair.category?.includes("Urgent")
                ? "urgent"
                : repair.category?.includes("Next")
                ? "warning"
                : "info"
            }`}>
              {repair.category || repair.status || "Active"}
            </span>
          </div>
        </header>

        {/* Main Details Card */}
        <div className="rd-details-card">
          <div className="rd-image-container">
            {isLoadingImages ? (
              <div className="rd-image-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <img
                src={displayImage}
                alt="Property repair"
                className="rd-image"
                loading="lazy"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            )}
          </div>

          <div className="rd-info">
            <h2 className="rd-apartment">{repair.apartment}</h2>

            <div className="rd-info-grid">
              <div className="rd-info-item">
                <div className="rd-info-icon">
                  {repair.property === "Residential" ? (
                    <Home size={16} />
                  ) : (
                    <Building2 size={16} />
                  )}
                </div>
                <div className="rd-info-content">
                  <label>Property</label>
                  <p>{repair.property}</p>
                </div>
              </div>

              <div className="rd-info-item">
                <div className="rd-info-icon">
                  <DollarSign size={16} />
                </div>
                <div className="rd-info-content">
                  <label>Budget</label>
                  <p>{repair.budget}</p>
                </div>
              </div>

              <div className="rd-info-item">
                <div className="rd-info-icon">
                  <Building2 size={16} />
                </div>
                <div className="rd-info-content">
                  <label>Building Type</label>
                  <p>{repair.building_type}</p>
                </div>
              </div>

              <div className="rd-info-item">
                <div className="rd-info-icon">
                  <Calendar size={16} />
                </div>
                <div className="rd-info-content">
                  <label>Posted Date</label>
                  <p>{new Date(repair.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="rd-description">
              <label>Description</label>
              <p>{repair.description}</p>
            </div>
          </div>
        </div>

        {/* Bidders Section */}
        <section className="rd-bidders-section">
          <div className="rd-bidders-header">
            <h2>Bidders</h2>
            <div className="rd-sort-controls">
              <Filter size={16} />
              <select
                className="rd-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Highest Rating</option>
                <option value="price-low">Lowest Price</option>
                <option value="price-high">Highest Price</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>

          {isLoadingBidders ? (
            <div className="rd-no-bidders">
              <div className="loading-spinner"></div>
              <p>Loading bidders...</p>
            </div>
          ) : sortedBidders.length === 0 ? (
            <div className="rd-no-bidders">
              <Users size={48} className="rd-no-bidders-icon" />
              <h3>No Bidders Yet</h3>
              <p>There are currently no bids for this job. Check back later for contractor submissions.</p>
            </div>
          ) : (
            <div className="rd-bidders-table">
              <div className="rd-table-header">
                <div className="rd-th rd-th-company">Company</div>
                <div className="rd-th rd-th-rating">Rating</div>
                <div className="rd-th rd-th-amount">Bid Amount</div>
                <div className="rd-th rd-th-status">Status</div>
                <div className="rd-th rd-th-actions"></div>
              </div>

              {sortedBidders.map((bidder) => (
                <div
                  key={bidder.id}
                  className="rd-table-row"
                  onClick={() => handleBidderClick(bidder)}
                >
                  <div className="rd-td rd-td-company">
                    <div className="rd-company-info">
                      <h4>{bidder.company_name}</h4>
                      <p>
                        <MapPin size={12} />
                        {bidder.address}
                      </p>
                    </div>
                  </div>

                  <div className="rd-td rd-td-rating">
                    <div className="rd-rating">
                      <div className="rd-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={
                              i < Math.round(bidder.average_rating)
                                ? "#facc15"
                                : "none"
                            }
                            stroke="#facc15"
                          />
                        ))}
                      </div>
                      <span className="rd-rating-text">
                        {bidder.average_rating} ({bidder.total_reviews})
                      </span>
                    </div>
                  </div>

                  <div className="rd-td rd-td-amount">
                    <span className="rd-amount">${bidder.bid_amount.toLocaleString()}</span>
                  </div>

                  <div className="rd-td rd-td-status">
                    <span className={`rd-status-badge status-${bidder.bid_status}`}>
                      {bidder.bid_status || "pending"}
                    </span>
                  </div>

                  <div className="rd-td rd-td-actions">
                    <button
                      className="rd-favorite-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(bidder.company_name);
                      }}
                      aria-label="Add to favorites"
                    >
                      <Heart
                        size={16}
                        fill={
                          favorites.includes(bidder.company_name)
                            ? "#E74C3C"
                            : "none"
                        }
                        stroke="#E74C3C"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bid Details Modal */}
      {showModal && selectedBidder && (
        <div className="rd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <h2>Bid Details</h2>
              <button
                className="rd-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="rd-modal-body">
              {/* Company Information */}
              <section className="rd-modal-section">
                <h3 className="rd-section-title">
                  <Building2 size={16} />
                  Company Information
                </h3>
                <div className="rd-modal-grid">
                  <div className="rd-modal-item">
                    <label>Company Name</label>
                    <p>{selectedBidder.profile.company_name}</p>
                  </div>
                  <div className="rd-modal-item">
                    <label>License Number</label>
                    <p>{selectedBidder.profile.license_number || "N/A"}</p>
                  </div>
                  <div className="rd-modal-item">
                    <label>Employees</label>
                    <p>{selectedBidder.profile.num_employees || "N/A"}</p>
                  </div>
                  <div className="rd-modal-item">
                    <label>Years in Business</label>
                    <p>{selectedBidder.profile.years_in_business || "N/A"}</p>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="rd-modal-section">
                <h3 className="rd-section-title">
                  <Mail size={16} />
                  Contact Information
                </h3>
                <div className="rd-modal-grid">
                  <div className="rd-modal-item">
                    <label>Email</label>
                    <p>{selectedBidder.profile.email}</p>
                  </div>
                  <div className="rd-modal-item">
                    <label>Address</label>
                    <p>{selectedBidder.profile.address}</p>
                  </div>
                </div>
              </section>

              {/* Rating & Reviews */}
              <section className="rd-modal-section">
                <h3 className="rd-section-title">
                  <Star size={16} />
                  Rating & Reviews
                </h3>
                <div className="rd-modal-rating">
                  <div className="rd-modal-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={
                          i < Math.round(selectedBidder.average_rating)
                            ? "#facc15"
                            : "none"
                        }
                        stroke="#facc15"
                      />
                    ))}
                  </div>
                  <p className="rd-modal-rating-text">
                    {selectedBidder.average_rating} out of 5 stars
                  </p>
                  <p className="rd-modal-review-count">
                    Based on {selectedBidder.total_reviews} reviews
                  </p>
                </div>
              </section>

              {/* Specializations */}
              {selectedBidder.profile.specializations &&
                selectedBidder.profile.specializations.length > 0 && (
                  <section className="rd-modal-section">
                    <h3 className="rd-section-title">
                      <Building2 size={16} />
                      Specializations
                    </h3>
                    <div className="rd-modal-tags">
                      {selectedBidder.profile.specializations.map(
                        (spec, index) => (
                          <span key={index} className="rd-modal-tag">
                            {spec}
                          </span>
                        )
                      )}
                    </div>
                  </section>
                )}

              {/* Bid Information */}
              <section className="rd-modal-section rd-modal-highlight">
                <h3 className="rd-section-title">
                  <DollarSign size={16} />
                  Bid Information
                </h3>
                <div className="rd-modal-bid-info">
                  <div className="rd-modal-amount">
                    <label>Bid Amount</label>
                    <p className="rd-amount-value">
                      ${selectedBidder.bid_amount.toLocaleString()}
                    </p>
                  </div>
                  {selectedBidder.bid_message && (
                    <div className="rd-modal-message">
                      <label>Message from Contractor</label>
                      <p>{selectedBidder.bid_message}</p>
                    </div>
                  )}
                  <div className="rd-modal-status">
                    <label>Current Status</label>
                    <span
                      className={`rd-status-badge status-${selectedBidder.bid_status}`}
                    >
                      {selectedBidder.bid_status || "pending"}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer with Actions */}
            <div className="rd-modal-footer">
              {selectedBidder.bid_status !== "approved" &&
                selectedBidder.bid_status !== "declined" && (
                  <>
                    <button
                      className="rd-btn rd-btn-secondary"
                      onClick={handleDeclineBid}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Decline Bid"}
                    </button>
                    <button
                      className="rd-btn rd-btn-primary"
                      onClick={handleAcceptBid}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Accept Bid"}
                    </button>
                  </>
                )}
              {(selectedBidder.bid_status === "approved" ||
                selectedBidder.bid_status === "declined") && (
                <p className="rd-modal-status-msg">
                  This bid has been {selectedBidder.bid_status}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepairDetails;