import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Home,
  DollarSign,
  Star,
  Heart,
  X,
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/manager/repairdetails.css";
import toast from "react-hot-toast";
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal";
import { useLanguage } from "../../contexts/LanguageContext";

// Custom marker icon for the map
const createPropertyIcon = () => {
  return L.divIcon({
    className: "rd-map-marker",
    html: `<div class="rd-marker-pin">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#0F223D"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });
};

function RepairDetails({ isOpen, onClose, repair }) {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [bidders, setBidders] = useState([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBidders, setIsLoadingBidders] = useState(true);
  const [propertyCoords, setPropertyCoords] = useState(null);
  const [isLoadingCoords, setIsLoadingCoords] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const showNotification = (message, type = "success") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  // Fetch property coordinates for map
  useEffect(() => {
    if (!repair?.data?.propertyId) {
      setIsLoadingCoords(false);
      return;
    }

    const fetchPropertyCoords = async () => {
      try {
        setIsLoadingCoords(true);
        const userProfile = localStorage.getItem("userProfile");
        if (!userProfile) return;

        const user = JSON.parse(userProfile);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(
          `${API_BASE_URL}/api/properties/${repair.data.propertyId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch property: ${response.status}`);
        }

        const data = await response.json();
        const property = data.property;

        if (property.latitude && property.longitude) {
          setPropertyCoords({
            lat: Number(property.latitude),
            lng: Number(property.longitude),
            name: property.building_name || property.name || property.address,
          });
        }
      } catch (err) {
        console.error("Error fetching property coordinates:", err);
        setPropertyCoords(null);
      } finally {
        setIsLoadingCoords(false);
      }
    };

    fetchPropertyCoords();
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
    setShowBidModal(true);
  };

  const handleProfileClick = (e, bidder) => {
    e.stopPropagation();
    setSelectedProfile(bidder.profile);
    setShowProfileModal(true);
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
        throw new Error(`Failed to approve bid: ${response.status}`);
      }

      const data = await response.json();

      await fetch(`${API_BASE_URL}/api/jobs/${repair.data.jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted', entrepreneur_id: `${selectedBidder.profile.id}` })
      });

      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "approved" }
            : bidder.bid_status === "pending"
            ? { ...bidder, bid_status: "declined" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "approved" }));
      showNotification(data.message || "Bid approved successfully!", "success");
      setShowBidModal(false);
    } catch (error) {
      console.error("Error accepting bid:", error);
      showNotification(error.message || "Failed to approve bid.", "error");
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
        throw new Error(data.message || `Failed to decline bid`);
      }

      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "declined" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "declined" }));
      showNotification(data.message || "Bid declined", "info");
      setShowBidModal(false);
    } catch (error) {
      console.error("Error declining bid:", error);
      showNotification(error.message || "Failed to decline bid.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysSincePosted = () => {
    if (!repair?.created_at) return 0;
    const posted = new Date(repair.created_at);
    const now = new Date();
    return Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  };

  const getHighestBid = () => {
    if (bidders.length === 0) return null;
    return Math.max(...bidders.map(b => b.bid_amount));
  };

  if (!isOpen || !repair) return null;

  return (
    <>
      {/* Main Modal Overlay */}
      <div className="rd-modal-overlay" onClick={onClose}>
        <div className="rd-modal-compact" onClick={(e) => e.stopPropagation()}>

          {/* Compact Header */}
          <div className="rd-compact-header">
            <div className="rd-compact-header-left">
              <button className="rd-compact-back" onClick={onClose}>
                <ArrowLeft size={18} />
              </button>
              <div className="rd-compact-title-group">
                <h2>{repair.apartment}</h2>
                <div className="rd-compact-meta">
                  <span className="rd-compact-property">
                    {repair.property === "Residential" ? <Home size={12} /> : <Building2 size={12} />}
                    {repair.property}
                  </span>
                  <span className="rd-compact-divider">•</span>
                  <span>{repair.category || t('repairDetails.general')}</span>
                </div>
              </div>
            </div>
            <div className="rd-compact-header-right">
              <span className={`rd-compact-status ${
                repair.category?.includes("Urgent") ? "urgent" :
                repair.category?.includes("Next") ? "warning" : "active"
              }`}>
                {repair.status || t('repairDetails.open')}
              </span>
              <button className="rd-compact-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="rd-compact-body">

            {/* Quick Stats */}
            <div className="rd-compact-stats">
              <div className="rd-compact-stat">
                <Clock size={14} />
                <span>{getDaysSincePosted()} {t('repairDetails.daysAgo')}</span>
              </div>
              <div className="rd-compact-stat">
                <Users size={14} />
                <span>{bidders.length} {bidders.length === 1 ? t('repairDetails.bid') : t('repairDetails.bids')}</span>
              </div>
              {getHighestBid() && (
                <div className="rd-compact-stat highlight">
                  <DollarSign size={14} />
                  <span>{t('repairDetails.highestBid')} ${getHighestBid().toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Content Grid */}
            <div className="rd-compact-grid">

              {/* Left: Details */}
              <div className="rd-compact-details">
                <div className="rd-compact-section">
                  <label className="rd-compact-label">{t('repairDetails.description')}</label>
                  <p className="rd-compact-description">
                    {repair.description || t('repairDetails.noDescription')}
                  </p>
                </div>

                <div className="rd-compact-info-list">
                  <div className="rd-compact-info-item">
                    <DollarSign size={14} />
                    <span className="rd-info-key">{t('repairDetails.budget')}</span>
                    <span className="rd-info-val">{repair.budget}</span>
                  </div>
                  <div className="rd-compact-info-item">
                    <Building2 size={14} />
                    <span className="rd-info-key">{t('repairDetails.type')}</span>
                    <span className="rd-info-val">{repair.building_type || "N/A"}</span>
                  </div>
                  <div className="rd-compact-info-item">
                    <Calendar size={14} />
                    <span className="rd-info-key">{t('repairDetails.posted')}</span>
                    <span className="rd-info-val">{new Date(repair.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}</span>
                  </div>
                  <div className="rd-compact-info-item">
                    <MapPin size={14} />
                    <span className="rd-info-key">{t('repairDetails.location')}</span>
                    <span className="rd-info-val">{repair.address || repair.property}</span>
                  </div>
                </div>
              </div>

              {/* Right: Map */}
              <div className="rd-compact-media">
                <div className="rd-compact-map-wrapper">
                  {isLoadingCoords ? (
                    <div className="rd-compact-map-loading">
                      <div className="rd-spinner"></div>
                    </div>
                  ) : propertyCoords ? (
                    <MapContainer
                      center={[propertyCoords.lat, propertyCoords.lng]}
                      zoom={16}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                      scrollWheelZoom={true}
                      dragging={true}
                      doubleClickZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        subdomains="abcd"
                      />
                      <Marker
                        position={[propertyCoords.lat, propertyCoords.lng]}
                        icon={createPropertyIcon()}
                      >
                        <Popup>
                          <div className="rd-map-popup">
                            <strong>{propertyCoords.name}</strong>
                            <p>{repair.address || repair.property}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="rd-compact-map-fallback">
                      <MapPin size={32} />
                      <p>{t('repairDetails.locationNotAvailable')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bids Section */}
            <div className="rd-compact-bids-section">
              <div className="rd-compact-bids-header">
                <h3>
                  <FileText size={16} />
                  {t('repairDetails.reviewBids')}
                  {bidders.length > 0 && <span className="rd-bids-badge">{bidders.length}</span>}
                </h3>
              </div>

              <div className="rd-compact-bids-list">
                {isLoadingBidders ? (
                  <div className="rd-compact-bids-empty">
                    <div className="rd-spinner"></div>
                    <p>{t('repairDetails.loadingBids')}</p>
                  </div>
                ) : bidders.length === 0 ? (
                  <div className="rd-compact-bids-empty">
                    <Users size={32} />
                    <p>{t('repairDetails.noBidsYet')}</p>
                  </div>
                ) : (
                  [...bidders]
                    .sort((a, b) => b.bid_amount - a.bid_amount)
                    .map((bidder, index) => (
                      <div
                        key={bidder.id}
                        className={`rd-compact-bid-card ${index === 0 ? 'top' : ''}`}
                        onClick={() => handleBidderClick(bidder)}
                      >
                        <div
                          className="rd-bid-avatar rd-bid-avatar-clickable"
                          onClick={(e) => handleProfileClick(e, bidder)}
                          title={t('repairDetails.viewProfile')}
                        >
                          {bidder.company_name?.charAt(0) || 'C'}
                        </div>
                        <div className="rd-bid-main">
                          <div
                            className="rd-bid-name rd-bid-name-clickable"
                            onClick={(e) => handleProfileClick(e, bidder)}
                            title={t('repairDetails.viewProfile')}
                          >
                            {bidder.company_name}
                          </div>
                          <div className="rd-bid-meta">
                            <Star size={10} fill="#facc15" stroke="#facc15" />
                            <span>{Number(bidder.average_rating || 0).toFixed(1)}</span>
                            <span className="rd-bid-reviews">({bidder.total_reviews || 0})</span>
                            <MapPin size={10} />
                            <span>{bidder.address?.split(',')[0] || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="rd-bid-amount">${bidder.bid_amount.toLocaleString()}</div>
                        <span className={`rd-bid-status ${bidder.bid_status || 'pending'}`}>
                          {bidder.bid_status || t('repairDetails.pending')}
                        </span>
                        <button
                          className="rd-bid-fav"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(bidder.company_name); }}
                        >
                          <Heart
                            size={14}
                            fill={favorites.includes(bidder.company_name) ? "#ef4444" : "none"}
                            stroke={favorites.includes(bidder.company_name) ? "#ef4444" : "#94a3b8"}
                          />
                        </button>
                        <ChevronRight size={16} className="rd-bid-arrow" />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Details Sub-Modal */}
      {showBidModal && selectedBidder && (
        <div className="rd-submodal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="rd-submodal" onClick={(e) => e.stopPropagation()}>
            <div className="rd-submodal-header">
              <div className="rd-submodal-title">
                <div className="rd-submodal-avatar">{selectedBidder.company_name?.charAt(0) || 'C'}</div>
                <div>
                  <h3>{selectedBidder.company_name}</h3>
                  <div className="rd-submodal-rating">
                    <Star size={12} fill="#facc15" stroke="#facc15" />
                    <span>{Number(selectedBidder.average_rating || 0).toFixed(1)} ({selectedBidder.total_reviews || 0} {t('repairDetails.reviews')})</span>
                  </div>
                </div>
              </div>
              <button className="rd-submodal-close" onClick={() => setShowBidModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="rd-submodal-body">
              {/* Bid Amount Highlight */}
              <div className="rd-submodal-amount-box">
                <span className="rd-amount-label">{t('repairDetails.bidAmount')}</span>
                <span className="rd-amount-value">${selectedBidder.bid_amount.toLocaleString()}</span>
                <span className={`rd-amount-status ${selectedBidder.bid_status || 'pending'}`}>
                  {selectedBidder.bid_status || t('repairDetails.pending')}
                </span>
              </div>

              {/* Message */}
              {selectedBidder.bid_message && (
                <div className="rd-submodal-section">
                  <label>{t('repairDetails.message')}</label>
                  <p className="rd-submodal-message">{selectedBidder.bid_message}</p>
                </div>
              )}

              {/* Company Info */}
              <div className="rd-submodal-section">
                <label>{t('repairDetails.companyDetails')}</label>
                <div className="rd-submodal-grid">
                  <div><span>{t('repairDetails.license')}</span><strong>{selectedBidder.profile.license_number || "N/A"}</strong></div>
                  <div><span>{t('repairDetails.employees')}</span><strong>{selectedBidder.profile.num_employees || "N/A"}</strong></div>
                  <div><span>{t('repairDetails.years')}</span><strong>{selectedBidder.profile.years_in_business || "N/A"}</strong></div>
                  <div><span>{t('repairDetails.email')}</span><strong>{selectedBidder.profile.email}</strong></div>
                </div>
              </div>

              {/* Specializations */}
              {selectedBidder.profile.specializations?.length > 0 && (
                <div className="rd-submodal-section">
                  <label>{t('repairDetails.specializations')}</label>
                  <div className="rd-submodal-tags">
                    {selectedBidder.profile.specializations.map((s, i) => (
                      <span key={i} className="rd-submodal-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rd-submodal-footer">
              {selectedBidder.bid_status !== "approved" && selectedBidder.bid_status !== "declined" ? (
                <>
                  <button className="rd-submodal-btn secondary" onClick={handleDeclineBid} disabled={isProcessing}>
                    {isProcessing ? "..." : t('repairDetails.decline')}
                  </button>
                  <button className="rd-submodal-btn primary" onClick={handleAcceptBid} disabled={isProcessing}>
                    {isProcessing ? "..." : t('repairDetails.acceptBid')}
                  </button>
                </>
              ) : (
                <div className="rd-submodal-decided">
                  {t('repairDetails.bidDecided')} <strong>{selectedBidder.bid_status}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entrepreneur Profile Modal */}
      <EntrepreneurProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
      />
    </>
  );
}

export default RepairDetails;
