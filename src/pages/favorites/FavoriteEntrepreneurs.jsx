import React, { useState, useMemo } from "react";
import Nav from "../../components/Nav";
import { Heart, MapPin, Phone, Mail, MessageCircle, Search } from "lucide-react";
import "../../styles/manager/favoriteentrepreneurs.css"

function FavoriteEntrepreneurs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      company: "Skyline Roofing Co.",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-45821",
      yearsInBusiness: 12,
      address: "123 Elm St, Toronto, ON",
      specialization: "Roof repair & waterproofing",
      averageRating: 4.7,
      contact: {
        phone: "(416) 555-0123",
        email: "info@skylineroofing.ca",
      },
      isFavorite: true,
    },
    {
      id: 2,
      company: "UrbanBuild Contractors",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-78213",
      yearsInBusiness: 8,
      address: "45 Wellington Ave, Toronto, ON",
      specialization: "Interior renovations & painting",
      averageRating: 4.5,
      contact: {
        phone: "(416) 555-0198",
        email: "contact@urbanbuild.ca",
      },
      isFavorite: true,
    },
    {
      id: 3,
      company: "Apex Maintenance Group",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-12489",
      yearsInBusiness: 15,
      address: "99 Front St E, Toronto, ON",
      specialization: "Building maintenance & HVAC",
      averageRating: 4.9,
      contact: {
        phone: "(416) 555-0205",
        email: "support@apexgroup.ca",
      },
      isFavorite: true,
    },
    {
      id: 4,
      company: "Precision Plumbing Inc.",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-65104",
      yearsInBusiness: 20,
      address: "20 King St W, Toronto, ON",
      specialization: "Commercial & residential plumbing",
      averageRating: 4.6,
      contact: {
        phone: "(416) 555-0311",
        email: "service@precisionplumbing.ca",
      },
      isFavorite: true,
    },
    {
      id: 5,
      company: "GreenThumb Landscaping",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-90210",
      yearsInBusiness: 7,
      address: "15 Queen St E, Toronto, ON",
      specialization: "Garden design & lawn care",
      averageRating: 4.8,
      contact: {
        phone: "(416) 555-0450",
        email: "hello@greenthumb.ca",
      },
      isFavorite: true,
    },
    {
      id: 6,
      company: "Volt Electrical Services",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-30592",
      yearsInBusiness: 18,
      address: "55 Bay St, Toronto, ON",
      specialization: "Wiring, panels, and lighting installation",
      averageRating: 4.7,
      contact: {
        phone: "(416) 555-0522",
        email: "support@voltelectrical.ca",
      },
      isFavorite: true,
    },
    {
      id: 7,
      company: "Cornerstone Masonry",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-88401",
      yearsInBusiness: 25,
      address: "10 Bloor St W, Toronto, ON",
      specialization: "Brick repair & stone work",
      averageRating: 4.9,
      contact: {
        phone: "(416) 555-0678",
        email: "info@cornerstonemasonry.ca",
      },
      isFavorite: true,
    },
    {
      id: 8,
      company: "Rapid Glass Repair",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-11234",
      yearsInBusiness: 5,
      address: "30 Yonge St, Toronto, ON",
      specialization: "Window & door glass replacement",
      averageRating: 4.4,
      contact: {
        phone: "(416) 555-0707",
        email: "sales@rapidglass.ca",
      },
      isFavorite: true,
    },
    {
      id: 9,
      company: "SafeGuard Security Systems",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-74567",
      yearsInBusiness: 10,
      address: "77 Church St, Toronto, ON",
      specialization: "Alarm systems & CCTV installation",
      averageRating: 4.5,
      contact: {
        phone: "(416) 555-0819",
        email: "contact@safeguardsecurity.ca",
      },
      isFavorite: true,
    },
    {
      id: 10,
      company: "Driveway Dynamics",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-29876",
      yearsInBusiness: 14,
      address: "50 Lakeshore Blvd E, Toronto, ON",
      specialization: "Asphalt and concrete paving",
      averageRating: 4.6,
      contact: {
        phone: "(416) 555-0900",
        email: "info@drivewaydynamics.ca",
      },
      isFavorite: true,
    },
  ]);

  const handleRemoveFavorite = (id) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  // Filter and search logic
  const filteredFavorites = useMemo(() => {
    let result = favorites;

    // Apply search
    if (searchQuery) {
      result = result.filter(
        (fav) =>
          fav.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fav.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fav.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (selectedFilter !== "all") {
      if (selectedFilter === "high-rated") {
        result = result.filter((fav) => fav.averageRating >= 4.7);
      } else if (selectedFilter === "experienced") {
        result = result.filter((fav) => fav.yearsInBusiness >= 15);
      }
    }

    return result;
  }, [favorites, searchQuery, selectedFilter]);

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        <header className="page-header fav">
          <h1>Favorite Entrepreneurs</h1>
          <p>View and manage your favorite construction partners.</p>
        </header>

        {/* Search and Filter Section */}
        <div className="search-filter-container">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, specialization, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <span className="filter-label">Filter by:</span>
            <div className="filter-buttons">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`filter-button ${selectedFilter === "all" ? "active" : ""}`}
              >
                All <span className="count">({favorites.length})</span>
              </button>
              <button
                onClick={() => setSelectedFilter("high-rated")}
                className={`filter-button ${selectedFilter === "high-rated" ? "active" : ""}`}
              >
                High Rated <span className="count">(4.7+)</span>
              </button>
              <button
                onClick={() => setSelectedFilter("experienced")}
                className={`filter-button ${selectedFilter === "experienced" ? "active" : ""}`}
              >
                Experienced <span className="count">(15+ years)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="favorites-grid">
          {filteredFavorites.length > 0 ? (
            filteredFavorites.map((fav) => (
              <div key={fav.id} className="entrep-card">
                <div className="card-header fav">
                  <div className="company-info">
                    <div className="logo">
                      <img src={fav.logo} alt={fav.company} />
                    </div>
                    <div className="header-info fav">
                      <h3 className="company-name">{fav.company}</h3>
                      <div className="location">
                        <MapPin size={14} />
                        <span>{fav.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="header-actions fav">
                    <button
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="remove-favorite-btn"
                      aria-label="Remove from favorites"
                    >
                      <Heart size={20} fill="#E74C3C" color="#E74C3C" />
                    </button>
                    <button className="message-btn-header">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stat-box">
                    <p className="stat-value fav">⭐ {fav.averageRating}</p>
                    <p className="stat-label">Rating</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-value fav">{fav.yearsInBusiness} Yrs</p>
                    <p className="stat-label">Experience</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-value fav">{fav.licenseNumber}</p>
                    <p className="stat-label">License</p>
                  </div>
                </div>

                <div className="specialization-section">
                  <p>{fav.specialization}</p>
                </div>

                <div className="contact-section">
                  <div className="contact-list">
                    <a href={`tel:${fav.contact.phone}`} className="contact-link">
                      <Phone size={14} />
                      <span>{fav.contact.phone}</span>
                    </a>
                    <a href={`mailto:${fav.contact.email}`} className="contact-link">
                      <Mail size={14} />
                      <span>{fav.contact.email}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>
                {searchQuery || selectedFilter !== "all"
                  ? "No entrepreneurs match your search criteria."
                  : "You haven't added any favorite entrepreneurs yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavoriteEntrepreneurs;