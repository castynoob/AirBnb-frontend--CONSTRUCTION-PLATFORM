import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X, Briefcase, MessageSquare, Hammer, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/notificationbell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
        return t('notifications.newBid').replace('{{name}}', notif.bidder || t('notifications.defaultContractor'));
      case 'bid_approved':
        return t('notifications.bidApproved');
      case 'bid_declined':
        return t('notifications.bidDeclined');
      case 'message':
        return t('notifications.messageFrom').replace('{{name}}', notif.senderName || t('notifications.defaultSomeone'));
      case 'started':
        return t('notifications.workStarted').replace('{{name}}', notif.contractor || t('notifications.defaultContractor'));
      case 'completed':
        return t('notifications.workCompleted').replace('{{name}}', notif.contractor || t('notifications.defaultContractor'));
      default:
        return t('notifications.notification');
    }
  };

  const getNotificationBody = (notif) => {
    switch (notif.type) {
      case 'bid':
        if (notif.budget) {
          return t('notifications.bidBody')
            .replace('{{amount}}', `$${Number(notif.budget).toLocaleString()}`)
            .replace('{{job}}', notif.jobTitle || '');
        }
        return t('notifications.newBidBody').replace('{{job}}', notif.jobTitle || '');
      case 'bid_approved':
        return t('notifications.bidApprovedBody').replace('{{job}}', notif.jobTitle || '');
      case 'bid_declined':
        return t('notifications.bidDeclinedBody').replace('{{job}}', notif.jobTitle || '');
      case 'message':
        return notif.content || t('notifications.newMessageBody');
      case 'started':
        return t('notifications.workStartedBody').replace('{{job}}', notif.jobTitle || notif.workTitle || '');
      case 'completed':
        return t('notifications.workCompletedBody').replace('{{job}}', notif.workTitle || notif.jobTitle || '');
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

    if (diffInSeconds < 60) return t('notifications.justNow');
    if (diffInSeconds < 3600) return t('notifications.minutesAgo').replace('{{count}}', Math.floor(diffInSeconds / 60));
    if (diffInSeconds < 86400) return t('notifications.hoursAgo').replace('{{count}}', Math.floor(diffInSeconds / 3600));
    if (diffInSeconds < 604800) return t('notifications.daysAgo').replace('{{count}}', Math.floor(diffInSeconds / 86400));
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('notifications.title')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="notification-backdrop-mobile"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={() => markAllAsRead()}
                title={t('notifications.markAllRead')}
              >
                <CheckCheck size={16} />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>{t('notifications.noNotifications')}</p>
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
                {notifications.length === 1
                  ? t('notifications.notificationCount').replace('{{count}}', notifications.length)
                  : t('notifications.notificationCountPlural').replace('{{count}}', notifications.length)}
              </span>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
