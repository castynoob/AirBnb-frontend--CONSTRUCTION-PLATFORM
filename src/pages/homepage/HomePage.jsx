import React, { useCallback, useState, useEffect, useRef } from "react";
import { Bell, Wrench, Search, Plus, X, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/manager/homepage.css"
import Nav from "../../components/Nav";
import RepairList from "../../components/RepairList";
import SummarySection from '../../components/SummarySection'
import RepairDetails from "../works/RepairDetails";

function HomePage() {
  const navigate = useNavigate();
  
  const [repairs] = useState([
    {
      id: 1,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "A2010",
      category: "Urgent (Current Year)",
      description: "Roof leakage above living room — needs immediate waterproofing.",
      bids: 8,
      budget: "$12,000 - $15,000",
      images: ["https://constrofacilitator.com/wp-content/uploads/2022/02/roof-repairing.jpg.webp"],
    },
    {
      id: 2,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "B2010",
      category: "Next Year",
      description: "Elevator door alignment issue — minor panel replacement required.",
      bids: 5,
      budget: "$4,500 - $6,000",
      images: ["https://doorguardinc.com/wp-content/uploads/2025/06/Flooring-1-scaled.jpg"],
    },
    {
      id: 3,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "C2010",
      category: "Year After",
      description: "Exterior wall repaint — faded color and minor cracks visible.",
      bids: 3,
      budget: "$28,000 - $32,000",
      images: ["https://www.thespruce.com/thmb/si4-qP1QEDzkql3hxQiRCZMcvJg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce-fadedyellowwallpaint-GettyImagesChristinaReichlPhotography-f7d53cdeff8749328b8cb8ba1cb379d4.png"],
    },
    {
      id: 4,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "D2010",
      category: "Urgent (Current Year)",
      description: "Boiler malfunction — no heat in multiple upper-floor units.",
      bids: 10,
      budget: "$18,000 - $22,000",
      images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXaqgmaQuIpVCHq4ILPczBJsclbw9OfLt9Xw&s"],
    },
    {
      id: 5,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "E2010",
      category: "Next Year",
      description: "Install new CCTV security cameras throughout corridors.",
      bids: 6,
      budget: "$7,000 - $8,500",
      images: ["https://www.phscompliance.co.uk/images/services/fire___security/cctv_outside.pagespeed.1586195523.jpg/rs-960x10000a.jpg"],
    },
    {
      id: 6,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "F2010",
      category: "Year After",
      description: "Upgrade lobby lighting to LED fixtures for better energy savings.",
      bids: 4,
      budget: "$2,500 - $3,000",
      images: ["https://picsum.photos/seed/lobby led lighting upgrade/500/300"],
    },
    {
      id: 7,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "G2010",
      category: "Urgent (Current Year)",
      description: "Broken fire escape railing — safety compliance update required.",
      bids: 9,
      budget: "$9,000 - $10,500",
      images: ["https://randpc.com/files/cache/6139af251090a805f96e1b34adbbdd9f_f389.jpg"],
    },
    {
      id: 8,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "H2010",
      category: "Next Year",
      description: "Balcony railing reinforcement for safety standards compliance.",
      bids: 7,
      budget: "$14,000 - $16,000",
      images: ["https://www.balconette.co.uk/content/uploads/a024f6b3-f021-484a-9607-2636757a232d/hung.jpg"],
    },
    {
      id: 9,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "I2010",
      category: "Year After",
      description: "Repaint underground parking and add new directional signage.",
      bids: 3,
      budget: "$4,000 - $4,800",
      images: ["https://picsum.photos/seed/underground parking repaint signage/500/300"],
    },
    {
      id: 10,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "J2010",
      category: "Urgent (Current Year)",
      description: "Burst pipe in laundry room — water damage on lower floor.",
      bids: 11,
      budget: "$6,000 - $7,500",
      images: ["https://picsum.photos/seed/burst pipe water damage floor/500/300"],
    },
    {
      id: 11,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "K2010",
      category: "Next Year",
      description: "Replace communal flooring with slip-resistant tiles.",
      bids: 5,
      budget: "$10,000 - $12,000",
      images: ["https://picsum.photos/seed/slip resistant communal tile/500/300"],
    },
    {
      id: 12,
      property: "Maple Heights",
      address: "123 Main St, Toronto",
      apartment: "L2010",
      category: "Year After",
      description: "Replace window seals for improved insulation and efficiency.",
      bids: 3,
      budget: "$8,000 - $9,000",
      images: ["https://picsum.photos/seed/window seal replacement insulation/500/300"],
    },
  ]);

  const [notifications] = useState([
    { 
      id: 1, 
      type: "bid",
      bidder: "Skyline Roofing Co.", 
      logo: "https://via.placeholder.com/60x60.png?text=SR", 
      licenseNumber: "LIC-45821", 
      yearsInBusiness: 12, 
      address: "123 Elm St, Toronto, ON", 
      averageRating: 4.7, 
      property: "Maple Heights", 
      apartment: "Unit 304", 
      budget: 5200, 
      projectDate: "2025-11-10", 
      submissionDate: "2025-10-12", 
      status: "pending",
      read: false
    },
    { 
      id: 2, 
      type: "bid",
      bidder: "ProFix Solutions Inc.", 
      logo: "https://via.placeholder.com/60x60.png?text=PF", 
      licenseNumber: "LIC-39204", 
      yearsInBusiness: 8, 
      address: "456 Oak Ave, Toronto, ON", 
      averageRating: 4.5, 
      property: "Maple Heights", 
      apartment: "Unit A2010", 
      budget: 13500, 
      projectDate: "2025-11-15", 
      submissionDate: "2025-10-13", 
      status: "pending",
      read: false
    },
    { 
      id: 3, 
      type: "completed",
      property: "Maple Heights", 
      apartment: "Unit B2010", 
      workTitle: "Elevator door alignment repair",
      contractor: "Elevator Experts Ltd.",
      completionDate: "2025-10-14",
      read: false
    },
    { 
      id: 4, 
      type: "completed",
      property: "Maple Heights", 
      apartment: "Unit E2010", 
      workTitle: "CCTV camera installation",
      contractor: "SecureView Systems",
      completionDate: "2025-10-15",
      read: true
    },
    { 
      id: 5, 
      type: "bid",
      bidder: "BuildRight Contractors", 
      logo: "https://via.placeholder.com/60x60.png?text=BR", 
      licenseNumber: "LIC-52981", 
      yearsInBusiness: 15, 
      address: "789 Pine St, Toronto, ON", 
      averageRating: 4.9, 
      property: "Maple Heights", 
      apartment: "Unit D2010", 
      budget: 19800, 
      projectDate: "2025-11-20", 
      submissionDate: "2025-10-16", 
      status: "pending",
      read: false
    }
  ]);

  const [isHome, setIsHome] = useState(true);
  const [repair, setRepair] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);

  const handleUrgentRequest = () => {
    alert("Urgent Request Triggered — This would notify all entrepreneurs.");
  };

  const handleAddWork = () => {
    navigate("/add-work/manager");
  };

  const handleRepairClicked = useCallback((value, repair) => {
    setIsHome(value);
    setRepair(repair);
  }, []);

  const handleSearchFocus = () => {
    setSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setSearchExpanded(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const filteredRepairs = repairs.filter(
    (repair) =>
      repair.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="homepage">
      <Nav />
      {isHome ? (
        <div className="main-container">
          <header className="page-header">
            <div>
              <h1>Repair Work Overview</h1>
            </div>
            <div className="header-actions">
              <div className={`search-box-header ${searchExpanded ? 'expanded' : ''}`}>
                <button 
                  className="search-trigger-btn"
                  onClick={handleSearchFocus}
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search repairs, apartments, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="search-input-header"
                />
              </div>
              <button 
                onClick={handleUrgentRequest} 
                className="urgent-button-icon"
                aria-label="Urgent Request"
              >
                <Wrench size={20} />
              </button>
              <button 
                onClick={handleAddWork} 
                className="add-work-btn-icon"
                aria-label="Add New Work"
              >
                <Plus size={20} />
              </button>
              <div className="notification-wrapper" ref={notificationRef}>
                <button 
                  className="notification-btn" 
                  aria-label="Notifications"
                  onClick={toggleNotifications}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-modal">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button 
                        className="close-notification-btn"
                        onClick={toggleNotifications}
                        aria-label="Close notifications"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifications">
                          <Bell size={32} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          >
                            {notification.type === "bid" ? (
                              <>
                                <div className="notification-icon bid-icon">
                                  <FileText size={20} />
                                </div>
                                <div className="notification-content">
                                  <div className="notification-title">
                                    New Bid Submission
                                    {!notification.read && <span className="unread-dot"></span>}
                                  </div>
                                  <div className="notification-body">
                                    <strong>{notification.bidder}</strong> submitted a bid for <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="notification-meta">
                                    <span>Budget: ${notification.budget.toLocaleString()}</span>
                                    <span className="notification-dot">•</span>
                                    <span>License: {notification.licenseNumber}</span>
                                  </div>
                                  <div className="notification-time">
                                    {new Date(notification.submissionDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="notification-icon completed-icon">
                                  <CheckCircle size={20} />
                                </div>
                                <div className="notification-content">
                                  <div className="notification-title">
                                    Work Completed
                                    {!notification.read && <span className="unread-dot"></span>}
                                  </div>
                                  <div className="notification-body">
                                    <strong>{notification.workTitle}</strong> at <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="notification-meta">
                                    <span>Contractor: {notification.contractor}</span>
                                  </div>
                                  <div className="notification-time">
                                    {new Date(notification.completionDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <SummarySection repairs={repairs} />

          <RepairList repairs={filteredRepairs} handleRepairClicked={handleRepairClicked} />

          {filteredRepairs.length === 0 && (
            <div className="no-results-home">
              <p>No repairs found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        <RepairDetails handleRepairClicked={handleRepairClicked} repair={repair} />
      )}
    </div>
  );
}

export default HomePage;