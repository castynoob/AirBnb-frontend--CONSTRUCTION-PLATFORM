import React, { useState } from "react";
import Nav from "../components/Nav";
import {
  Building2,
  Home,
  CalendarDays,
  DollarSign,
  FileText,
  Star,
  MapPin,
  Wrench,
  BadgeCheck,
  Clock,
} from "lucide-react";
import "../styles/submissions.css";

function Submissions() {
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      bidder: "Skyline Roofing Co.",
      logo: "https://via.placeholder.com/60x60.png?text=SR",
      licenseNumber: "LIC-45821",
      yearsInBusiness: 12,
      address: "123 Elm St, Toronto, ON",
      specialization: "Roof repair & waterproofing",
      averageRating: 4.7,
      property: "Maple Heights",
      apartment: "Unit 304",
      budget: 5200,
      projectDate: "2025-11-10",
      submissionDate: "2025-10-12",
      status: "pending",
    },
    {
      id: 2,
      bidder: "UrbanBuild Contractors",
      logo: "https://via.placeholder.com/60x60.png?text=UB",
      licenseNumber: "LIC-78213",
      yearsInBusiness: 8,
      address: "45 Wellington Ave, Toronto, ON",
      specialization: "Interior renovations & painting",
      averageRating: 4.5,
      property: "Lakeside Towers",
      apartment: "Unit 112",
      budget: 3400,
      projectDate: "2025-11-22",
      submissionDate: "2025-10-14",
      status: "pending",
    },
    {
      id: 3,
      bidder: "Apex Maintenance Group",
      logo: "https://via.placeholder.com/60x60.png?text=AM",
      licenseNumber: "LIC-12489",
      yearsInBusiness: 15,
      address: "99 Front St E, Toronto, ON",
      specialization: "Building maintenance & HVAC",
      averageRating: 4.9,
      property: "Cedarwood Complex",
      apartment: "Unit 502",
      budget: 6100,
      projectDate: "2025-12-01",
      submissionDate: "2025-10-10",
      status: "accepted",
    },
    {
      id: 4,
      bidder: "NorthPoint Renovations",
      logo: "https://via.placeholder.com/60x60.png?text=NP",
      licenseNumber: "LIC-33125",
      yearsInBusiness: 10,
      address: "15 King St W, Toronto, ON",
      specialization: "Kitchen & bathroom remodeling",
      averageRating: 4.4,
      property: "Sunset Residences",
      apartment: "Unit 410",
      budget: 7800,
      projectDate: "2025-11-18",
      submissionDate: "2025-10-13",
      status: "pending",
    },
    {
      id: 5,
      bidder: "BlueHaven Builders",
      logo: "https://via.placeholder.com/60x60.png?text=BH",
      licenseNumber: "LIC-56788",
      yearsInBusiness: 9,
      address: "302 Bayview Blvd, Toronto, ON",
      specialization: "General contracting & extensions",
      averageRating: 4.2,
      property: "Oakridge Condos",
      apartment: "Unit 225",
      budget: 4500,
      projectDate: "2025-11-30",
      submissionDate: "2025-10-11",
      status: "declined",
    },
    {
      id: 6,
      bidder: "CraftPro Solutions",
      logo: "https://via.placeholder.com/60x60.png?text=CP",
      licenseNumber: "LIC-67823",
      yearsInBusiness: 6,
      address: "20 Dundas Sq, Toronto, ON",
      specialization: "Electrical & lighting systems",
      averageRating: 4.6,
      property: "Riverview Apartments",
      apartment: "Unit 703",
      budget: 3800,
      projectDate: "2025-12-15",
      submissionDate: "2025-10-09",
      status: "pending",
    },
    {
      id: 7,
      bidder: "MetroFix Experts",
      logo: "https://via.placeholder.com/60x60.png?text=MF",
      licenseNumber: "LIC-44211",
      yearsInBusiness: 14,
      address: "54 Liberty Village, Toronto, ON",
      specialization: "Plumbing & pipe maintenance",
      averageRating: 4.8,
      property: "Hilltop Homes",
      apartment: "Unit 101",
      budget: 8900,
      projectDate: "2025-12-05",
      submissionDate: "2025-10-10",
      status: "accepted",
    },
    {
      id: 8,
      bidder: "Everest Construction",
      logo: "https://via.placeholder.com/60x60.png?text=EC",
      licenseNumber: "LIC-55678",
      yearsInBusiness: 18,
      address: "210 Queen St W, Toronto, ON",
      specialization: "Concrete restoration & structural work",
      averageRating: 4.9,
      property: "Aspen Gardens",
      apartment: "Unit 330",
      budget: 5600,
      projectDate: "2025-12-20",
      submissionDate: "2025-10-08",
      status: "pending",
    },
    {
      id: 9,
      bidder: "RenovaWorks Inc.",
      logo: "https://via.placeholder.com/60x60.png?text=RW",
      licenseNumber: "LIC-98231",
      yearsInBusiness: 11,
      address: "1 Spadina Ave, Toronto, ON",
      specialization: "Exterior painting & repair",
      averageRating: 4.5,
      property: "Silver Oaks",
      apartment: "Unit 609",
      budget: 7200,
      projectDate: "2025-11-27",
      submissionDate: "2025-10-13",
      status: "pending",
    },
    {
      id: 10,
      bidder: "PrimeEdge Contractors",
      logo: "https://via.placeholder.com/60x60.png?text=PE",
      licenseNumber: "LIC-11345",
      yearsInBusiness: 7,
      address: "77 Richmond St, Toronto, ON",
      specialization: "Masonry & structural restoration",
      averageRating: 4.3,
      property: "Elmwood Lofts",
      apartment: "Unit 202",
      budget: 4900,
      projectDate: "2025-12-08",
      submissionDate: "2025-10-15",
      status: "pending",
    },
  ]);

  const handleAction = (id, newStatus) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
    );
  };

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        <header className="page-header">
          <h1>Submissions</h1>
          <p>Review and manage all contractor bids across your properties.</p>
        </header>

        <div className="submissions-grid">
          {submissions.map((sub) => (
            <div key={sub.id} className="submission-card">
              <div className="submission-header">
                <div className="bidder-info">
                  <img
                    src={sub.logo}
                    alt={`${sub.bidder} logo`}
                    className="bidder-logo"
                  />
                  <div>
                    <h3>{sub.bidder}</h3>
                    <p className="license">
                      <BadgeCheck size={14} /> {sub.licenseNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`status-badge ${
                    sub.status === "accepted"
                      ? "accepted"
                      : sub.status === "declined"
                      ? "declined"
                      : "pending"
                  }`}
                >
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>

              <div className="company-details">
                <div className="company-item">
                  <Clock size={16} />
                  <p>{sub.yearsInBusiness} yrs in business</p>
                </div>
                <div className="company-item">
                  <Wrench size={16} />
                  <p>{sub.specialization}</p>
                </div>
                <div className="company-item">
                  <MapPin size={16} />
                  <p>{sub.address}</p>
                </div>
                <div className="company-item rating">
                  <Star size={16} />
                  <p>{sub.averageRating.toFixed(1)} / 5.0</p>
                </div>
              </div>

              <div className="submission-details">
                <div className="detail-item">
                  <Building2 size={18} />
                  <p>
                    <strong>Property:</strong> {sub.property}
                  </p>
                </div>
                <div className="detail-item">
                  <Home size={18} />
                  <p>
                    <strong>Apartment:</strong> {sub.apartment}
                  </p>
                </div>
                <div className="detail-item">
                  <DollarSign size={18} />
                  <p>
                    <strong>Budget:</strong> ${sub.budget.toLocaleString()}
                  </p>
                </div>
                <div className="detail-item">
                  <CalendarDays size={18} />
                  <p>
                    <strong>Project Date:</strong> {sub.projectDate}
                  </p>
                </div>
                <div className="detail-item">
                  <FileText size={18} />
                  <p>
                    <strong>Submitted:</strong> {sub.submissionDate}
                  </p>
                </div>
              </div>

              <div className="submission-actions">
                {sub.status === "pending" ? (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => handleAction(sub.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => handleAction(sub.id, "declined")}
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <small className="status-note">
                    This bid has been {sub.status}.
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Submissions;
