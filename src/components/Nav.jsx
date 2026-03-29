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
      fetchUnreadCount();
    }
    setIsLoading(false)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => fetchUnreadCount();
      const handleMessagesRead = () => fetchUnreadCount();
      socket.on('message_notification', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      return () => {
        socket.off('message_notification', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket])

  useEffect(() => {
    const interval = setInterval(() => {
      if (userProfile) fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [userProfile])

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
    if (clearNotifications) clearNotifications();
    if (socket) socket.disconnect();
    logout().catch(error => console.error("Logout API error:", error));
    localStorage.removeItem("userProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("selectedPropertyId");
    window.location.href = "/";
  };

  const handleViewProfile = () => { setShowProfileMenu(false); navigate('/profile/' + role); };
  const handleReport = () => { setShowProfileMenu(false); setShowReportModal(true); };
  const handleCustomerService = () => { setShowProfileMenu(false); navigate('/customer-service'); };

  const getUserInitials = () => {
    if (!userProfile) return 'U';
    const first = userProfile.first_name?.[0] || '';
    const last = userProfile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleDisplay = () => {
    if (role === 'property_manager') return t('nav.propertyManager');
    if (role === 'entrepreneur') return t('nav.entrepreneur');
    if (role === 'resident') return t('nav.resident');
    return role[0].toUpperCase() + role.substring(1);
  };

  return (
    <>
      {showReportModal && (
        <ReportModal onClose={() => setShowReportModal(false)} userRole={role} />
      )}

      {isLoading ? (
        <div className="sidebar" />
      ) : (
        <nav className="sidebar">
          {/* Brand */}
          <div className="nav-brand" onClick={() => navigate('/homepage/' + role)}>
            <div className="nav-logo-wrap">
              <img src={logo} alt="Logo" className="nav-logo-img" />
            </div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">INTERVOS</span>
              <span className="nav-brand-role">{getRoleDisplay()}</span>
            </div>
          </div>

          {/* Nav Section */}
          <div className="nav-section">
            <span className="nav-section-label">{t('nav.mainMenu')}</span>
            <ul className="nav-links">
              <li>
                <NavLink to={'/homepage/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <div className="nav-icon"><Home size={20} /></div>
                  <span className="nav-text">{t('nav.home')}</span>
                </NavLink>
              </li>

              <li>
                <NavLink to={'/messages/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}>
                  <div className="nav-icon"><MessageSquare size={20} /></div>
                  <span className="nav-text">{t('nav.messages')}</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </NavLink>
              </li>

              {role !== 'resident' && (
                <li>
                  <NavLink to={'/submissions/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <div className="nav-icon"><FileText size={20} /></div>
                    <span className="nav-text">{t('nav.biddings')}</span>
                  </NavLink>
                </li>
              )}

              {role === 'resident' && (
                <li>
                  <NavLink to={'/members/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <div className="nav-icon"><Users size={20} /></div>
                    <span className="nav-text">{t('nav.members')}</span>
                  </NavLink>
                </li>
              )}

              {role === 'property_manager' && (
                <li>
                  <NavLink to={'/favorites/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <div className="nav-icon"><Heart size={20} /></div>
                    <span className="nav-text">{t('nav.favorites')}</span>
                  </NavLink>
                </li>
              )}

              {role === 'entrepreneur' && (
                <li>
                  <NavLink to={'/jobs/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <div className="nav-icon"><Wrench size={20} /></div>
                    <span className="nav-text">{t('nav.jobs')}</span>
                  </NavLink>
                </li>
              )}

              {/* Profile — mobile only */}
              <li className="nav-profile-link">
                <NavLink to={'/profile/' + role} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <div className="nav-icon"><User size={20} /></div>
                  <span className="nav-text">{userProfile?.first_name || t('nav.profile')}</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="nav-footer" ref={profileMenuRef}>
            <div
              className={`nav-user ${showProfileMenu ? 'active' : ''}`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="nav-avatar">{getUserInitials()}</div>
              <div className="nav-user-info">
                <div className="nav-user-name">{userProfile?.first_name || 'User'}</div>
                <div className="nav-user-role">{getRoleDisplay()}</div>
              </div>
              <ChevronUp size={18} className={`nav-chevron ${showProfileMenu ? 'open' : ''}`} />
            </div>

            {showProfileMenu && (
              <div className="nav-dropdown">
                <button className="nav-dropdown-item" onClick={handleViewProfile}>
                  <User size={18} /><span>{t('nav.viewProfile')}</span>
                </button>
                <button className="nav-dropdown-item" onClick={handleCustomerService}>
                  <Headphones size={18} /><span>{t('nav.customerService')}</span>
                </button>
                <button className="nav-dropdown-item" onClick={handleReport}>
                  <Flag size={18} /><span>{t('nav.report')}</span>
                </button>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={18} /><span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {isLoggingOut && (
        <div className="logout-overlay">
          <div className="logout-spinner" />
          <p>{t('nav.loggingOut')}</p>
        </div>
      )}
    </>
  );
}

export default Nav;
