import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, MessageSquare, User, LogOut, Heart, FileText, Crown, Wrench   } from "lucide-react"; 
import logo from '../assets/logo-light.png'
import '../styles/nav.css'

function Nav() {
  const navigate = useNavigate();
  const [role, setRole] = useState('property_manager')
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const profileString = localStorage.getItem('userProfile');

    if (profileString) {
      const user = JSON.parse(profileString);
      setUserProfile(user)
      setRole(user.role)
    } else {
      console.log("User profile not found.");
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    navigate("/");
  };

  return (
    <>
      {
        isLoading?
        <div className="sidebar"></div>:
        <nav className="sidebar">
          <div className="brand nav">
            <div className="logo-container nav">
              <img src={logo} alt="Logo" className="logo-light" />
            </div>
            <div className="brand-text">
              <span className="brand-name nav">INTERVOS</span>
              <span className="brand-subtitle">{role[0].toLocaleUpperCase() + role.substring(1, role.length)}</span>
            </div>
          </div>

          <div className="nav-section">
            <span className="section-label">Main Menu</span>
            <ul className="nav-links">
              <li>
                <NavLink
                  to={'/homepage/'+role}
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
                  to={'/messages/'+role}
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
                  to={'/submissions/'+role}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  <div className="nav-icon">
                    <FileText size={20} />
                  </div>
                  <span className="nav-text">Biddings</span>
                </NavLink>
              </li>

              {
                role == 'manager' &&
                <li>
                  <NavLink
                    to={'/favorites/'+role}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <Heart size={20} />
                    </div>
                    <span className="nav-text">Favorites</span>
                  </NavLink>
                </li>
                
              }

              {
                role == 'entrepreneur' &&
                <li>
                  <NavLink
                    to={'/jobs/'+role}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <Wrench size={20} />
                    </div>
                    <span className="nav-text">Jobs</span>
                  </NavLink>
                </li>
              }

              <li>
                <NavLink
                  to={'/profile/' + role}
                  className={({ isActive }) => (isActive ? "nav-link active profile" : "nav-link profile")}
                >
                  <div className="nav-icon">
                    <User size={20} />
                  </div>
                  <span className="nav-text">Profile</span>
                </NavLink>
              </li>
              
            </ul>
          </div>

          <div className="nav-section account">
            <span className="section-label">Account</span>
            <ul className="nav-links">
              <li>
                <NavLink
                  to={'/profile/' + role}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  <div className="nav-icon">
                    <User size={20} />
                  </div>
                  <span className="nav-text">Profile</span>
                </NavLink>
              </li>
              {
                userProfile != null && role == 'entrepreneur' &&
                <li>
                  <NavLink
                    to={'/subscription/' + role}
                    className={({ isActive }) => (isActive ? `nav-link active ${userProfile.subscription.plan_type == 'premium'? 'premium-endicator' : ''}`  : `nav-link ${userProfile.subscription.plan_type == 'premium'? 'premium-endicator' : ''}`)}
                  >
                    <div className="nav-icon">
                      <Crown size={20} />
                    </div>
                    <span className="nav-text">Subscription</span>
                  </NavLink>
                </li>
              }
            </ul>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <div className="nav-icon">
              <LogOut size={20} />
            </div>
            <span className="nav-text">Log out</span>
          </button>
        </nav>
      }
    </>
  );
}

export default Nav;