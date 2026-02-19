import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, MessageSquare, User, LogOut, Heart, FileText, Crown, Wrench, ShoppingCart, Users, Flag, ChevronUp, Headphones } from "lucide-react";
import logo from '../assets/logo-light.png'
import '../styles/nav.css'
import { getUnreadCount, logout } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { useLanguage } from '../contexts/LanguageContext';
import ReportModal from './modal/ReportModal';

function Nav() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [role, setRole] = useState('property_manager')
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileMenuRef = useRef(null);
  const { socket, clearNotifications } = useSocket();

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);

    // Clear notifications and disconnect socket immediately
    if (clearNotifications) {
      clearNotifications();
    }
    if (socket) {
      socket.disconnect();
    }

    // Call backend logout API in background (don't block redirect)
    logout().catch(error => console.error("Logout API error:", error));

    // Clear all auth-related localStorage items
    localStorage.removeItem("userProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("selectedPropertyId");

    // Redirect immediately
    window.location.href = "/";
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);
    navigate('/profile/' + role);
  };

  const handleReport = () => {
    setShowProfileMenu(false);
    setShowReportModal(true);
  };

  const handleCustomerService = () => {
    setShowProfileMenu(false);
    navigate('/customer-service');
  };

  const getUserInitials = () => {
    if (!userProfile) return 'U';
    const first = userProfile.first_name?.[0] || '';
    const last = userProfile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUserFullName = () => {
    if (!userProfile) return 'User';
    return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User';
  };

  const getRoleDisplay = () => {
    if (role === 'property_manager') return t('nav.propertyManager');
    // SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
    // if (role === 'supplier') return t('nav.supplierRole');
    if (role === 'entrepreneur') return t('nav.entrepreneur');
    if (role === 'resident') return t('nav.resident');
    return role[0].toUpperCase() + role.substring(1);
  };

  return (
    <>
      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          userRole={role}
        />
      )}

      {
        isLoading?
        <div className="sidebar"></div>:
        <nav className="sidebar">
          <div className="brand nav" onClick={() => navigate('/homepage/' + role)} style={{ cursor: 'pointer' }}>
            <div className="logo-container nav">
              <img src={logo} alt="Logo" className="logo-light" />
            </div>
            <div className="brand-text">
              <span className="brand-name nav">INTERVOS</span>
              <span className="brand-subtitle">
                {getRoleDisplay()}
              </span>
            </div>
          </div>

          <div className="nav-section">
            <span className="section-label">{t('nav.mainMenu')}</span>
            <ul className="nav-links">
              <li>
                <NavLink
                  to={'/homepage/'+role}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  <div className="nav-icon">
                    <Home size={20} />
                  </div>
                  <span className="nav-text">{t('nav.home')}</span>
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
                  <span className="nav-text">{t('nav.messages')}</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </NavLink>
              </li>

              {
                role != 'resident' && /* SUPPLIER TEMPORARILY DISABLED — was: role !== 'supplier' && role != 'resident' */
                <li>
                  <NavLink
                    to={'/submissions/'+role}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <FileText size={20} />
                    </div>
                    <span className="nav-text">{t('nav.biddings')}</span>
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
                    <span className="nav-text">{t('nav.members')}</span>
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
                    <span className="nav-text">{t('nav.favorites')}</span>
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
                    <span className="nav-text">{t('nav.jobs')}</span>
                  </NavLink>
                </li>
                {/* SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable */}
                {/* <li>
                  <NavLink
                    to={'/supplier'}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <div className="nav-icon">
                      <ShoppingCart size={20} />
                    </div>
                    <span className="nav-text">{t('nav.supplier')}</span>
                  </NavLink>
                </li> */}
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
                  <span className="nav-text">{userProfile?.first_name || t('nav.profile')}</span>
                </NavLink>
              </li>
              
            </ul>
          </div>

          {/* Sidebar Footer with User Profile */}
          <div className="sidebar-footer" ref={profileMenuRef}>
            <div
              className={`sidebar-user ${showProfileMenu ? 'active' : ''}`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="sidebar-avatar">
                {getUserInitials()}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userProfile?.first_name || 'User'}</div>
                <div className="sidebar-user-role">{getRoleDisplay()}</div>
              </div>
              <ChevronUp
                size={18}
                className={`sidebar-chevron ${showProfileMenu ? 'open' : ''}`}
              />
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="sidebar-dropdown">
                <button className="sidebar-dropdown-item" onClick={handleViewProfile}>
                  <User size={18} />
                  <span>{t('nav.viewProfile')}</span>
                </button>
                <button className="sidebar-dropdown-item" onClick={handleCustomerService}>
                  <Headphones size={18} />
                  <span>{t('nav.customerService')}</span>
                </button>
                <button className="sidebar-dropdown-item" onClick={handleReport}>
                  <Flag size={18} />
                  <span>{t('nav.report')}</span>
                </button>
                <div className="sidebar-dropdown-divider" />
                <button className="sidebar-dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      }

      {isLoggingOut && (
        <div className="logout-overlay">
          <div className="logout-spinner"></div>
          <p>{t('nav.loggingOut')}</p>
        </div>
      )}
    </>
  );
}

export default Nav;
