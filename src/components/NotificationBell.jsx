import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X, Briefcase, MessageSquare, Hammer, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import '../styles/notificationbell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid':
        return <Briefcase size={18} className="notif-icon notif-icon-bid" />;
      case 'bid_approved':
        return <CheckCircle size={18} className="notif-icon notif-icon-approved" />;
      case 'bid_declined':
        return <XCircle size={18} className="notif-icon notif-icon-declined" />;
      case 'message':
        return <MessageSquare size={18} className="notif-icon notif-icon-message" />;
      case 'started':
        return <Hammer size={18} className="notif-icon notif-icon-started" />;
      case 'completed':
        return <CheckCircle size={18} className="notif-icon notif-icon-completed" />;
      default:
        return <Bell size={18} className="notif-icon" />;
    }
  };

  const getNotificationTitle = (notif) => {
    switch (notif.type) {
      case 'bid':
        return `New Bid from ${notif.bidder || 'Contractor'}`;
      case 'bid_approved':
        return 'Bid Approved!';
      case 'bid_declined':
        return 'Bid Not Selected';
      case 'message':
        return `Message from ${notif.senderName || 'Someone'}`;
      case 'started':
        return `${notif.contractor || 'Contractor'} Started Work`;
      case 'completed':
        return `${notif.contractor || 'Contractor'} Completed Work`;
      default:
        return 'Notification';
    }
  };

  const getNotificationBody = (notif) => {
    switch (notif.type) {
      case 'bid':
        return `${notif.budget ? `$${Number(notif.budget).toLocaleString()} bid` : 'New bid'} for ${notif.jobTitle || 'a job'}`;
      case 'bid_approved':
        return notif.content || `Your bid for "${notif.jobTitle}" has been approved!`;
      case 'bid_declined':
        return notif.content || `Your bid for "${notif.jobTitle}" was not selected.`;
      case 'message':
        return notif.content || 'New message received';
      case 'started':
        return `Working on ${notif.jobTitle || notif.workTitle || 'a project'}`;
      case 'completed':
        return `Finished ${notif.workTitle || notif.jobTitle || 'a project'}`;
      default:
        return notif.content || '';
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.read) {
      await markAsRead(notif.id);
    }

    // Get user role
    const userProfile = localStorage.getItem('userProfile');
    const user = userProfile ? JSON.parse(userProfile) : null;
    const role = user?.role || 'entrepreneur';

    // Navigate based on notification type
    switch (notif.type) {
      case 'bid':
        navigate(`/submissions/${role}`);
        break;
      case 'bid_approved':
      case 'bid_declined':
        navigate(`/submissions/${role}`);
        break;
      case 'message':
        navigate(`/messages/${role}`);
        break;
      case 'started':
      case 'completed':
        if (role === 'entrepreneur') {
          navigate(`/jobs/${role}`);
        } else {
          navigate(`/submissions/${role}`);
        }
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={() => markAllAsRead()}
                title="Mark all as read"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul className="notification-list">
                {notifications.slice(0, 20).map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.type}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-item-icon">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-item-content">
                      <p className="notification-item-title">
                        {getNotificationTitle(notif)}
                      </p>
                      <p className="notification-item-body">
                        {getNotificationBody(notif)}
                      </p>
                      <span className="notification-item-time">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="notification-unread-dot" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <span className="notification-count">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
