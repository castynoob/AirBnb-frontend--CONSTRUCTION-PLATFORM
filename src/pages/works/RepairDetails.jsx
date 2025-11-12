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
  X,
  Mail,
  Phone,
  Calendar,
  Users,
  Award,
  Briefcase,
  MapPin,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import "../../styles/manager/repairdetails.css";

function RepairDetails({ handleBackFromDetails, repair }) {
  const [favorites, setFavorites] = useState([]); // Now stores bid IDs instead of company names
  const [sortBy, setSortBy] = useState("rating");
  const [bidders, setBidders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingBidders, setIsLoadingBidders] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  const PLACEHOLDER_IMAGE = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=";
  
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch favorites for current bidders
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoadingFavorites(true);
        const userProfile = localStorage.getItem("userProfile");
        if (!userProfile) return;

        const user = JSON.parse(userProfile);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${API_BASE_URL}/api/favorites`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch favorites: ${response.status}`);
        }

        const data = await response.json();
        // Extract bid IDs from favorites
        const favoriteBidIds = data.favorites
          .filter(fav => fav.bid_id)
          .map(fav => fav.bid_id);
        setFavorites(favoriteBidIds);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, []);

  const toggleFavorite = async (bidder) => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        showNotification("Please log in to add favorites", "error");
        return;
      }

      const user = JSON.parse(userProfile);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const isFavorited = favorites.includes(bidder.id);

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(
          `${API_BASE_URL}/api/favorites/bid/${bidder.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to remove favorite: ${response.status}`);
        }

        setFavorites((prev) => prev.filter((id) => id !== bidder.id));
        showNotification("Removed from favorites", "info");
      } else {
        // Add to favorites
        const response = await fetch(`${API_BASE_URL}/api/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entrepreneurId: bidder.profile.id,
            jobId: repair.data.jobId,
            bidId: bidder.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to add favorite: ${response.status}`);
        }

        setFavorites((prev) => [...prev, bidder.id]);
        showNotification("Added to favorites", "success");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showNotification(error.message || "Failed to update favorites", "error");
    }
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
        <header className="details-header">
          <div
            className="back-btn rd"
            onClick={handleBackFromDetails}
          >
            <ArrowLeft size={18} />
            Back
          </div>
          <h2>
            {repair.property_type === "Residential"
              ? "Residential"
              : "Commercial"}{" "}
            Repair Details
          </h2>
          <span className="status-badge">
            <CheckCircle2 size={16} />
            {repair.status || "Active"}
          </span>
        </header>

        {/* Main Details Card */}
        <div className="details-card enhanced">
          {/* Left side - Image */}
          <div className="details-left">
            {isLoadingImages ? (
              <div className="image-loading">
                <p>Loading image...</p>
              </div>
            ) : (
              <img
                src={displayImage}
                alt="Property repair"
                className="details-image"
                loading="lazy"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            )}
          </div>

          {/* Right side - Details */}
          <div className="details-right">
            <h3 className="repair-title">
              <Wrench size={24} />
              {repair.apartment}
            </h3>
            
            <div className="details-grid">
              <div className="detail-box">
                <div className="icon-circle blue">
                  {repair.property === "Residential" ? (
                    <Home size={20} />
                  ) : (
                    <Building2 size={20} />
                  )}
                </div>
                <div>
                  <label>Property</label>
                  <p>{repair.property}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle green">
                  <DollarSign size={20} />
                </div>
                <div>
                  <label>Budget</label>
                  <p className="budget">{repair.budget}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle orange">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <label>Building Type</label>
                  <p>{repair.building_type}</p>
                </div>
              </div>

              <div className="detail-box">
                <div className="icon-circle purple">
                  <Calendar size={20} />
                </div>
                <div>
                  <label>Posted Date</label>
                  <p>{new Date(repair.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="description">
              <label>Description</label>
              <p>{repair.description}</p>
            </div>
          </div>
        </div>

        {/* Bidders Section */}
        <section className="bidders-section">
          <div className="bidders-header">
            <h3>Available Bidders</h3>
            <div className="sort-controls">
              <Filter size={18} />
              <select
                className="sort-select"
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

          <div className="bidders-list">
            {isLoadingBidders ? (
              // Loading skeleton
              <div className="no-bidders-container">
                <div className="loading-spinner"></div>
                <p>Loading bidders...</p>
              </div>
            ) : sortedBidders.length === 0 ? (
              // No bidders available
              <div className="no-bidders-container">
                <div className="no-bidders-icon">
                  <Users size={48} />
                </div>
                <h3>No Bidders Yet</h3>
                <p>There are currently no bids for this job. Check back later for contractor submissions.</p>
              </div>
            ) : (
              sortedBidders.map((bidder) => (
              <div
                key={bidder.id}
                className="bidder-card"
                onClick={() => handleBidderClick(bidder)}
              >
                <div className="bidder-header">
                  <div className="bidder-info">
                    <h4>{bidder.company_name}</h4>
                    <p className="bidder-location">
                      <MapPin size={14} />
                      {bidder.address}
                    </p>
                  </div>
                  <button
                    className="favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(bidder);
                    }}
                    aria-label="Add to favorites"
                  >
                    <Heart
                      size={18}
                      fill={
                        favorites.includes(bidder.id)
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
                        fill={
                          i < Math.round(bidder.average_rating)
                            ? "#facc15"
                            : "none"
                        }
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
                    <label>Status</label>
                    <p className={`bid-status status-${bidder.bid_status}`}>
                      {bidder.bid_status || "pending"}
                    </p>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Bid Details Modal */}
      {showModal && selectedBidder && (
        <div className="bid-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h2>Bid Details</h2>
              <button
                className="bid-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              {/* Company Information */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Building2 size={20} />
                  Company Information
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>Company Name</label>
                    <p>{selectedBidder.profile.company_name}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>License Number</label>
                    <p>{selectedBidder.profile.license_number || "N/A"}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>
                      <Users size={14} /> Employees
                    </label>
                    <p>{selectedBidder.profile.num_employees || "N/A"}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>
                      <Calendar size={14} /> Years in Business
                    </label>
                    <p>{selectedBidder.profile.years_in_business || "N/A"}</p>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Mail size={20} />
                  Contact Information
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>
                      <Mail size={14} /> Email
                    </label>
                    <p>{selectedBidder.profile.email}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>
                      <MapPin size={14} /> Address
                    </label>
                    <p>{selectedBidder.profile.address}</p>
                  </div>
                </div>
              </section>

              {/* Rating & Reviews */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Award size={20} />
                  Rating & Reviews
                </h3>
                <div className="bid-rating-display">
                  <div className="bid-rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        fill={
                          i < Math.round(selectedBidder.average_rating)
                            ? "#facc15"
                            : "none"
                        }
                        stroke="#facc15"
                      />
                    ))}
                  </div>
                  <p className="bid-rating-text">
                    {selectedBidder.average_rating} out of 5 stars
                  </p>
                  <p className="bid-review-count">
                    Based on {selectedBidder.total_reviews} reviews
                  </p>
                </div>
              </section>

              {/* Specializations */}
              {selectedBidder.profile.specializations &&
                selectedBidder.profile.specializations.length > 0 && (
                  <section className="bid-modal-section">
                    <h3 className="bid-section-title">
                      <Briefcase size={20} />
                      Specializations
                    </h3>
                    <div className="bid-specializations-list">
                      {selectedBidder.profile.specializations.map(
                        (spec, index) => (
                          <span key={index} className="bid-specialization-tag">
                            {spec}
                          </span>
                        )
                      )}
                    </div>
                  </section>
                )}

              {/* Bid Information */}
              <section className="bid-modal-section bid-modal-highlight">
                <h3 className="bid-section-title">
                  <DollarSign size={20} />
                  Bid Information
                </h3>
                <div className="bid-info-display">
                  <div className="bid-amount-display">
                    <label>Bid Amount</label>
                    <p className="amount">
                      ${selectedBidder.bid_amount.toLocaleString()}
                    </p>
                  </div>
                  {selectedBidder.bid_message && (
                    <div className="bid-message">
                      <label>
                        <MessageSquare size={14} /> Message from Contractor
                      </label>
                      <p>{selectedBidder.bid_message}</p>
                    </div>
                  )}
                  <div className="bid-status-display">
                    <label>Current Status</label>
                    <span
                      className={`bid-status-badge-modal status-${selectedBidder.bid_status}`}
                    >
                      {selectedBidder.bid_status || "pending"}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer with Actions */}
            <div className="bid-modal-footer">
              {selectedBidder.bid_status !== "approved" &&
                selectedBidder.bid_status !== "declined" && (
                  <>
                    <button
                      className="bid-btn-decline"
                      onClick={handleDeclineBid}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Decline Bid"}
                    </button>
                    <button
                      className="bid-btn-accept"
                      onClick={handleAcceptBid}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Accept Bid"}
                    </button>
                  </>
                )}
              {(selectedBidder.bid_status === "approved" ||
                selectedBidder.bid_status === "declined") && (
                <p className="bid-status-message">
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