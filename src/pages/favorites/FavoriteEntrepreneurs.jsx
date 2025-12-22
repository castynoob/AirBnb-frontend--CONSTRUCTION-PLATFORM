import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFavorites,
  removeFavorite,
  getEntrepreneurHistory,
  updateFavoriteNotes
} from '../../utils/api';
import {
  Star,
  Trash2,
  MessageCircle,
  History,
  Edit3,
  Save,
  X,
  Heart,
  CheckCircle,
  Clock,
  Briefcase,
  FileText
} from 'lucide-react';
import Nav from '../../components/Nav';
import '../../styles/manager/favoriteentrepreneurs.css';

const FavoriteEntrepreneurs = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      setFavorites(response.favorites || []);
      setError(null);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation modal for removing favorite
  const handleRemoveFavorite = (bidId, entrepreneurName) => {
    setConfirmModal({
      bidId,
      entrepreneurName,
    });
  };

  // Actually remove favorite after confirmation
  const confirmRemoveFavorite = async () => {
    if (!confirmModal) return;

    const { bidId } = confirmModal;
    setConfirmModal(null);

    try {
      await removeFavorite(bidId);
      setFavorites(prev => prev.filter(fav => fav.bid_id !== bidId));
      showNotification('Contractor removed from favorites.', 'success');

      // If this was the selected entrepreneur, close the history panel
      if (selectedEntrepreneur?.bid_id === bidId) {
        setSelectedEntrepreneur(null);
        setJobHistory([]);
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      showNotification('Failed to remove favorite. Please try again.', 'error');
    }
  };

  // Load job history for an entrepreneur
  const handleViewHistory = async (entrepreneur) => {
    setSelectedEntrepreneur(entrepreneur);
    setLoadingHistory(true);

    try {
      const response = await getEntrepreneurHistory(entrepreneur.entrepreneur_id);
      setJobHistory(response.history || []);
    } catch (err) {
      console.error('Error loading history:', err);
      showNotification('Failed to load job history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start conversation with entrepreneur
  const handleMessage = async (favorite) => {
    // Check if bid is approved before allowing messaging
    if (favorite.bid_status !== 'approved') {
      showNotification('You can only message contractors with approved bids. Please approve the bid first from the Submissions page.', 'warning');
      return;
    }

    try {
      // Store target user info in localStorage for Messages component to pick up
      localStorage.setItem('targetReceiverId', favorite.user_id);
      localStorage.setItem('targetReceiverName', `${favorite.first_name} ${favorite.last_name}`);
      if (favorite.job_id) {
        localStorage.setItem('targetJobId', favorite.job_id);
      }

      // Navigate to messages page - Messages component will handle opening the chat
      navigate('/messages/property_manager');
    } catch (err) {
      console.error('Error navigating to messages:', err);
      showNotification('Failed to open messages. Please try again.', 'error');
    }
  };

  // Edit notes
  const handleEditNotes = (favorite) => {
    setEditingNotes(favorite.favorite_id);
    setNotesText(favorite.notes || '');
  };

  // Save notes
  const handleSaveNotes = async (favoriteId) => {
    try {
      await updateFavoriteNotes(favoriteId, notesText);
      setFavorites(prev => prev.map(fav =>
        fav.favorite_id === favoriteId
          ? { ...fav, notes: notesText }
          : fav
      ));
      setEditingNotes(null);
    } catch (err) {
      console.error('Error saving notes:', err);
      showNotification('Failed to save notes. Please try again.', 'error');
    }
  };

  // Cancel editing notes
  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  if (loading) {
    return (
      <div className="fav-favorites-container">
        <Nav />
        <div className="fav-favorites-content">
          <div className="fav-loading-container">
            <div className="fav-spinner-large"></div>
            <p>Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-favorites-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`fav-toast fav-toast-${notification.type}`}>
          <span className="fav-toast-message">{notification.message}</span>
          <button className="fav-toast-close" onClick={() => setNotification(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <Nav />

      <div className="fav-favorites-content">
        {/* Page Header - PM Style */}
        <header className="fav-page-header">
          <div className="fav-header-left">
            <div className="fav-header-title-group">
              <h1>FAVORITES</h1>
              <span className="fav-count-badge">{favorites.length} contractors</span>
            </div>
          </div>
          <div className="fav-header-actions">
            <button
              className="fav-btn fav-btn-primary"
              onClick={() => navigate('/submissions/property_manager')}
            >
              <FileText size={18} />
              <span>Browse Bids</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="fav-error-message">
            {error}
            <button onClick={loadFavorites} className="fav-retry-button">
              Retry
            </button>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="fav-empty-state">
            <Heart size={48} />
            <h2>No Favorite Contractors Yet</h2>
            <p>
              When you find contractors you like, click the heart button on their bids
              to save them here for future projects.
            </p>
            <button
              className="fav-btn fav-btn-primary"
              onClick={() => navigate('/submissions/property_manager')}
            >
              Browse Bids
            </button>
          </div>
        ) : (
          <div className="fav-cards-grid">
            {favorites.map(favorite => (
              <div key={favorite.bid_id || favorite.favorite_id} className="fav-card">
                <div className="fav-card-header">
                  <div className="fav-contractor-info">
                    <div className="fav-avatar">
                      {favorite.profile_picture_url ? (
                        <img src={favorite.profile_picture_url} alt={favorite.first_name} />
                      ) : (
                        <span className="fav-avatar-initials">
                          {favorite.first_name?.charAt(0)}{favorite.last_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="fav-contractor-details">
                      <h3 className="fav-contractor-name">{favorite.first_name} {favorite.last_name}</h3>
                      <div className="fav-contractor-rating">
                        <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                        <span>{Number(favorite.average_rating).toFixed(1)}</span>
                        <span className="fav-review-count">({favorite.review_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="fav-remove-btn"
                    onClick={() => handleRemoveFavorite(favorite.bid_id, `${favorite.first_name} ${favorite.last_name}`)}
                    title="Remove from favorites"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="fav-card-body">
                  <div className="fav-stats-row">
                    <div className="fav-stat-item">
                      <Briefcase size={14} />
                      <span className="fav-stat-value">{favorite.completed_jobs || 0}</span>
                      <span className="fav-stat-label">Jobs Done</span>
                    </div>
                  </div>

                  {favorite.last_job_title && (
                    <div className="fav-last-job">
                      <span className="fav-last-job-label">Last Job:</span>
                      <span className="fav-last-job-title">{favorite.last_job_title}</span>
                      {favorite.last_bid_amount && (
                        <span className="fav-last-job-amount">${Number(favorite.last_bid_amount).toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {/* Bid Status */}
                  <div className={`fav-status-badge ${favorite.bid_status === 'approved' ? 'approved' : 'pending'}`}>
                    {favorite.bid_status === 'approved' ? (
                      <><CheckCircle size={12} /> Bid Approved</>
                    ) : (
                      <><Clock size={12} /> Bid Pending</>
                    )}
                  </div>
                  {favorite.bid_status !== 'approved' && (
                    <p className="fav-status-note">Approve bid in Submissions to message</p>
                  )}

                  {/* Notes Section */}
                  <div className="fav-notes-section">
                    {editingNotes === favorite.favorite_id ? (
                      <div className="fav-notes-edit">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add notes about this contractor..."
                          rows="3"
                        />
                        <div className="fav-notes-actions">
                          <button
                            className="fav-btn fav-btn-sm fav-btn-primary"
                            onClick={() => handleSaveNotes(favorite.favorite_id)}
                          >
                            <Save size={14} /> Save
                          </button>
                          <button
                            className="fav-btn fav-btn-sm fav-btn-secondary"
                            onClick={handleCancelEdit}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="fav-notes-display">
                        <div className="fav-notes-header">
                          <span className="fav-notes-label">Notes</span>
                          <button
                            className="fav-edit-btn"
                            onClick={() => handleEditNotes(favorite)}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        <p className="fav-notes-text">
                          {favorite.notes || 'No notes yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fav-card-footer">
                  <button
                    className={`fav-btn fav-btn-action ${favorite.bid_status === 'approved' ? 'fav-btn-primary' : 'fav-btn-disabled'}`}
                    onClick={() => handleMessage(favorite)}
                    disabled={favorite.bid_status !== 'approved'}
                    title={favorite.bid_status === 'approved' ? 'Send a message' : 'Bid must be approved to message'}
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                  <button
                    className="fav-btn fav-btn-action fav-btn-secondary"
                    onClick={() => handleViewHistory(favorite)}
                  >
                    <History size={14} /> History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {selectedEntrepreneur && (
        <div className="fav-sidebar-overlay" onClick={() => setSelectedEntrepreneur(null)}>
          <div className="fav-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="fav-sidebar-header">
              <h2>Job History</h2>
              <button
                className="fav-sidebar-close"
                onClick={() => setSelectedEntrepreneur(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="fav-sidebar-contractor">
              <h3>{selectedEntrepreneur.first_name} {selectedEntrepreneur.last_name}</h3>
              <p>{selectedEntrepreneur.email}</p>
            </div>

            <div className="fav-sidebar-content">
              {loadingHistory ? (
                <div className="fav-sidebar-loading">
                  <div className="fav-spinner"></div>
                  <p>Loading history...</p>
                </div>
              ) : jobHistory.length === 0 ? (
                <div className="fav-sidebar-empty">
                  <History size={32} />
                  <p>No job history with this contractor yet.</p>
                </div>
              ) : (
                <div className="fav-history-list">
                  {jobHistory.map(job => (
                    <div key={job.job_id} className="fav-history-item">
                      <div className="fav-history-title">{job.title}</div>
                      <div className="fav-history-meta">
                        <span className="fav-history-category">{job.category}</span>
                        <span className={`fav-history-status status-${job.status}`}>{job.status}</span>
                      </div>
                      <div className="fav-history-bid">
                        <span>Bid: ${Number(job.bid_amount).toFixed(2)}</span>
                        <span className={`fav-history-bid-status ${job.bid_status}`}>
                          {job.bid_status}
                        </span>
                      </div>
                      <div className="fav-history-property">
                        Property: {job.property_name}
                      </div>
                      {job.bid_message && (
                        <div className="fav-history-message">
                          "{job.bid_message}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fav-confirm-overlay" onClick={() => setConfirmModal(null)}>
          <div className="fav-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fav-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3>Remove from Favorites?</h3>
            <p>Are you sure you want to remove <strong>{confirmModal.entrepreneurName}</strong> from your favorites?</p>
            <div className="fav-confirm-actions">
              <button
                className="fav-btn fav-btn-secondary"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="fav-btn fav-btn-danger"
                onClick={confirmRemoveFavorite}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteEntrepreneurs;