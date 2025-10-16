import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, MessageSquare, User, LogOut, Heart, FileText } from "lucide-react"; 
import logo from '../assets/logo-light.png'
import '../styles/nav.css'

function Nav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo-light" />
        </div>
        <div className="brand-text">
          <span className="brand-name">INVERTOS</span>
          <span className="brand-subtitle">Management</span>
        </div>
      </div>

      <div className="nav-section">
        <span className="section-label">Main Menu</span>
        <ul className="nav-links">
          <li>
            <NavLink
              to="/homepage/manager"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <div className="nav-icon">
                <Home size={20} />
              </div>
              <span className="nav-text">Home</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/messages"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <div className="nav-icon">
                <MessageSquare size={20} />
              </div>
              <span className="nav-text">Messages</span>
              <span className="notification-badge">3</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/submissions"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <div className="nav-icon">
                <FileText size={20} />
              </div>
              <span className="nav-text">Submissions</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/favorites/manager"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <div className="nav-icon">
                <Heart size={20} />
              </div>
              <span className="nav-text">Favorites</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="nav-section">
        <span className="section-label">Account</span>
        <ul className="nav-links">
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <div className="nav-icon">
                <User size={20} />
              </div>
              <span className="nav-text">Profile</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        <div className="nav-icon">
          <LogOut size={20} />
        </div>
        <span className="nav-text">Log out</span>
      </button>
    </nav>
  );
}

export default Nav;