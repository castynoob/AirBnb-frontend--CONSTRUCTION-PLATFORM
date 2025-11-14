import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, MessageSquare, User, LogOut, Heart, FileText, Crown, Wrench, ShoppingCart, Users } from "lucide-react";
import logo from '../assets/logo-light.png'
import '../styles/nav.css'
import { getUnreadCount } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

function Nav() {
  const navigate = useNavigate();
  const [role, setRole] = useState('property_manager')
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const socket = useSocket();

  useEffect(() => {
    const profileString = localStorage.getItem('userProfile');

    if (profileString) {
      const user = JSON.parse(profileString);
      setUserProfile(user)
      setRole(user.role)

      // Fetch initial unread count
      fetchUnreadCount();
    } else {
      console.log("User profile not found.");
    }
    setIsLoading(false)
  }, [])

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Listen for real-time message notifications via socket
  useEffect(() => {
    if (socket) {
      // Update unread count when new message arrives
      const handleNewMessage = () => {
        fetchUnreadCount();
      };

      // Update unread count when messages are marked as read
      const handleMessagesRead = () => {
        fetchUnreadCount();
      };

      socket.on('message_notification', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.off('message_notification', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket])

  // Poll for unread count every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (userProfile) {
        fetchUnreadCount();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userProfile])

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("selectedPropertyId")
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
              <span className="brand-subtitle">
                {role === 'property_manager' ? 'Property Manager' :
                 role === 'supplier' ? 'Supplier' :
                 role[0].toUpperCase() + role.substring(1)}
              </span>
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
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </NavLink>
              </li>

              {
                role !== 'supplier' && role != 'resident' &&
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
              }

              {
                role == 'resident' &&
                <li>
                  <NavLink
                    to={'/members/'+role}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <Users size={20} />
                    </div>
                    <span className="nav-text">Members</span>
                  </NavLink>
                </li>
              }


              {
                role == 'property_manager' &&
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
                <>
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
                <li>
                  <NavLink
                    to={'/supplier'}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <ShoppingCart size={20} />
                    </div>
                    <span className="nav-text">Supplier</span>
                  </NavLink>
                </li>
                </>
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
