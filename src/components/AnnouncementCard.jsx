import React from 'react';
import '../styles/resident/announcementcard.css';

const AnnouncementCard = ({ announcement }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Maintenance':
        return '🔧';
      case 'Event':
        return '📅';
      case 'Notice':
        return '⚠️';
      case 'Emergency':
        return '🚨';
      default:
        return '📢';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'Maintenance':
        return 'announcement-maintenance';
      case 'Event':
        return 'announcement-event';
      case 'Notice':
        return 'announcement-notice';
      case 'Emergency':
        return 'announcement-emergency';
      default:
        return 'announcement-info';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`announcement-card ${getTypeClass(announcement.type)} ${getPriorityClass(announcement.priority)}`}>
      {announcement.is_pinned}

      <div className="announcement-header">
        <div className="announcement-type-badge">
          <span className="announcement-icon">{getTypeIcon(announcement.type)}</span>
          <span className="announcement-type-text">{announcement.type}</span>
        </div>

        <div className="announcement-meta">
          <span className="announcement-date">{formatDate(announcement.created_at)}</span>
          <span className="announcement-time">{formatTime(announcement.created_at)}</span>
        </div>
      </div>

      <h3 className="announcement-title">{announcement.title}</h3>

      <p className="announcement-content">{announcement.content}</p>

      <div className="announcement-footer">
        <div className="announcement-author">
          <span className="author-label">Posted by:</span>
          <span className="author-name">{announcement.posted_by_name}</span>
        </div>

        {announcement.priority && announcement.priority !== 'normal' && (
          <div className={`announcement-priority ${getPriorityClass(announcement.priority)}`}>
            {announcement.priority === 'urgent' && '🔴'}
            {announcement.priority === 'high' && '🟠'}
            {announcement.priority === 'low' && '🟢'}
            <span className="priority-text">{announcement.priority.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;