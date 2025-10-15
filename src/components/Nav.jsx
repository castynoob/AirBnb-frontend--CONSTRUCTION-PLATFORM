import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
// 🛠️ Importing new icons: Heart for Favorites, FileText for Submissions
import { Home, MessageSquare, User, LogOut, Heart, FileText } from "lucide-react"; 

function Nav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Example logout behavior — clear auth token and redirect to login
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="sidebar">
      <div className="brand">
        <span>Construction Pro</span>
      </div>

      <ul className="nav-links">
        <li>
          <NavLink
            to="/homepage"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/messages"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <MessageSquare size={18} />
            <span>Messages</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/favorites"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {/* Proper icon for Favorites */}
            <Heart size={18} /> 
            <span>Favorites</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/submissions" // 💡 Changed to a more logical path for "Submissions"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {/* Proper icon for Submissions (e.g., job postings or bids) */}
            <FileText size={18} /> 
            <span>Submissions</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {/* Dedicated icon for the main profile page */}
            <User size={18} /> 
            <span>Profile</span>
          </NavLink>
        </li>
      </ul>

      <button className="logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Log out</span>
      </button>
    </nav>
  );
}

export default Nav;