import React, { useState } from "react";
import Nav from "../../components/Nav";
import { Star, MapPin, Phone, Mail, X, Award, BadgeCheck } from "lucide-react";
import "../../styles/favoriteentrepreneurs.css";

function FavoriteEntrepreneurs() {
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
    {
      id: 11,
      company: "HeatWave HVAC Solutions",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-55012",
      yearsInBusiness: 9,
      address: "111 Commerce Dr, Toronto, ON",
      specialization: "Furnace & A/C repair and installation",
      averageRating: 4.7,
      contact: {
        phone: "(416) 555-1011",
        email: "service@heatwavehvac.ca",
      },
      isFavorite: true,
    },
    {
      id: 12,
      company: "The Deck Masters",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-40040",
      yearsInBusiness: 11,
      address: "88 Garden Ave, Toronto, ON",
      specialization: "Custom deck and fence building",
      averageRating: 4.8,
      contact: {
        phone: "(416) 555-1122",
        email: "build@deckmasters.ca",
      },
      isFavorite: true,
    },
    {
      id: 13,
      company: "CleanSweep Chimney Services",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK7tD4SdaUsdPOAvaMIJFbZd5-qk2v26quSw&s",
      licenseNumber: "LIC-01234",
      yearsInBusiness: 6,
      address: "22 Mill St, Toronto, ON",
      specialization: "Chimney cleaning & inspection",
      averageRating: 4.3,
      contact: {
        phone: "(416) 555-1234",
        email: "contact@cleansweep.ca",
      },
      isFavorite: true,
    },
  ]);

  const handleRemoveFavorite = (id) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        <header className="page-header">
          <h1>Favorite Entrepreneurs</h1>
          <p>View and manage your favorite construction partners.</p>
        </header>

        <div className="favorites-grid">
          {favorites.length > 0 ? (
            favorites.map((fav) => (
              <div key={fav.id} className="entrep-card">
                <button
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="remove-favorite-btn"
                  aria-label="Remove from favorites"
                >
                  <X size={18} />
                </button>

                <div className="card-header">
                  <div className="logo">
                    <img src={fav.logo} alt={fav.company} />
                  </div>
                  <div className="header-info">
                    <h3 className="company-name">{fav.company}</h3>
                    <div className="location">
                      <MapPin size={14} />
                      <span>{fav.address}</span>
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stat-box">
                    <p className="stat-label">Rating</p>
                    <p className="stat-value">{fav.averageRating}</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-label">Experience</p>
                    <p className="stat-value">{fav.yearsInBusiness} Years</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-label">License</p>
                    <p className="stat-value">{fav.licenseNumber}</p>
                  </div>
                </div>

                <div className="contact-section">
                  <h4 className="section-title">Contact</h4>
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
              <p>You haven't added any favorite entrepreneurs yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavoriteEntrepreneurs;