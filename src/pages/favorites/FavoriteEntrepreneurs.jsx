import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFavorites,
  removeFavorite,
  getEntrepreneurHistory,
  updateFavoriteNotes
} from '../../utils/api';
import { FaStar, FaTrash, FaCommentAlt, FaHistory, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
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

  // Remove favorite by bid_id
  const handleRemoveFavorite = async (bidId, entrepreneurName) => {
    if (!window.confirm(`Remove ${entrepreneurName} from favorites?`)) {
      return;
    }

    try {
      await removeFavorite(bidId);
      setFavorites(prev => prev.filter(fav => fav.bid_id !== bidId));

      // If this was the selected entrepreneur, close the history panel
      if (selectedEntrepreneur?.bid_id === bidId) {
        setSelectedEntrepreneur(null);
        setJobHistory([]);
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove favorite. Please try again.');
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
      alert('Failed to load job history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start conversation with entrepreneur
  const handleMessage = async (favorite) => {
    // Check if bid is approved before allowing messaging
    if (favorite.bid_status !== 'approved') {
      alert('You can only message contractors with approved bids. Please approve the bid first from the Submissions page.');
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
      alert('Failed to open messages. Please try again.');
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
      alert('Failed to save notes. Please try again.');
    }
  };

  // Cancel editing notes
  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  if (loading) {
    return (
      <div className="fav-favorite-entrepreneurs-page">
        <Nav />
        <div className="fav-loading-container">
          <div className="fav-spinner-large"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-favorite-entrepreneurs-page">
      <Nav />

      <div className="fav-favorites-container">
        <div className="fav-favorites-header">
          <h1>Favorite Contractors</h1>
          <p className="fav-favorites-subtitle">
            {favorites.length === 0
              ? 'No favorites yet. Add contractors you like for easy access later!'
              : `You have ${favorites.length} favorite contractor${favorites.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

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
            <div className="fav-empty-icon">💙</div>
            <h2>No Favorite Contractors Yet</h2>
            <p>
              When you find contractors you like, click the heart button on their bids
              to save them here for future projects.
            </p>
            <button
              className="fav-browse-button"
              onClick={() => navigate('/submissions/property_manager')}
            >
              Browse Bids
            </button>
          </div>
        ) : (
          <div className="fav-favorites-grid">
            {favorites.map(favorite => (
              <div key={favorite.bid_id || favorite.favorite_id} className="fav-favorite-card">
                <div className="fav-card-header">
                  <div className="fav-entrepreneur-info">
                    <div className="fav-avatar">
                      {favorite.profile_picture_url ? (
                        <img src={favorite.profile_picture_url} alt={favorite.first_name} />
                      ) : (
                        <div className="fav-avatar-placeholder">
                          {favorite.first_name?.charAt(0)}{favorite.last_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="fav-name-rating">
                      <h3>{favorite.first_name} {favorite.last_name}</h3>
                      <div className="fav-rating">
                        <FaStar className="fav-star-icon" />
                        <span>{Number(favorite.average_rating).toFixed(1)}</span>
                        <span className="fav-review-count">({favorite.review_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="fav-remove-button"
                    onClick={() => handleRemoveFavorite(favorite.bid_id, `${favorite.first_name} ${favorite.last_name}`)}
                    title="Remove from favorites"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="fav-card-body">
                    <div className="fav-stat">
                      <span className="fav-stat-value">{favorite.completed_jobs || 0}</span>
                      <span className="fav-stat-label">Completed Jobs</span>
                    </div>

                  {favorite.last_job_title && (
                    <div className="fav-last-job">
                      <strong>Last Job:</strong> {favorite.last_job_title}
                      {favorite.last_bid_amount && (
                        <span className="fav-bid-amount">${Number(favorite.last_bid_amount).toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {/* Bid Status Indicator */}
                  <div className="fav-bid-status-indicator">
                    <span className={`fav-status-badge ${favorite.bid_status === 'approved' ? 'fav-accepted' : 'fav-pending'}`}>
                      {favorite.bid_status === 'approved' ? '✓ Bid Approved' : '⏳ Bid Pending'}
                    </span>
                    {favorite.bid_status !== 'approved' && (
                      <span className="fav-status-note">Approve bid in Submissions to message</span>
                    )}
                  </div>

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
                            className="fav-save-button"
                            onClick={() => handleSaveNotes(favorite.favorite_id)}
                          >
                            <FaSave /> Save
                          </button>
                          <button
                            className="fav-cancel-button"
                            onClick={handleCancelEdit}
                          >
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="fav-notes-display">
                        <div className="fav-notes-header">
                          <strong>Notes:</strong>
                          <button
                            className="fav-edit-notes-button"
                            onClick={() => handleEditNotes(favorite)}
                          >
                            <FaEdit /> Edit
                          </button>
                        </div>
                        <p className="fav-notes-text">
                          {favorite.notes || 'No notes yet. Click Edit to add notes.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fav-card-actions">
                  <button
                    className={`fav-action-button ${favorite.bid_status === 'approved' ? 'fav-primary' : 'fav-disabled'}`}
                    onClick={() => handleMessage(favorite)}
                    disabled={favorite.bid_status !== 'approved'}
                    title={favorite.bid_status === 'approved' ? 'Send a message' : 'Bid must be approved to message'}
                  >
                    <FaCommentAlt /> Message
                  </button>
                  <button
                    className="fav-action-button fav-secondary"
                    onClick={() => handleViewHistory(favorite)}
                  >
                    <FaHistory /> View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {selectedEntrepreneur && (
        <div className="fav-history-sidebar">
          <div className="fav-sidebar-header">
            <h2>Job History</h2>
            <button
              className="fav-close-sidebar"
              onClick={() => setSelectedEntrepreneur(null)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="fav-entrepreneur-summary">
            <h3>{selectedEntrepreneur.first_name} {selectedEntrepreneur.last_name}</h3>
            <p className="fav-email">{selectedEntrepreneur.email}</p>
          </div>

          <div className="fav-history-content">
            {loadingHistory ? (
              <div className="fav-loading-history">
                <div className="fav-spinner"></div>
                <p>Loading history...</p>
              </div>
            ) : jobHistory.length === 0 ? (
              <div className="fav-no-history">
                <p>No job history with this contractor yet.</p>
              </div>
            ) : (
              <div className="fav-history-list">
                {jobHistory.map(job => (
                  <div key={job.job_id} className="fav-history-item">
                    <div className="fav-job-title">{job.title}</div>
                    <div className="fav-job-details">
                      <span className="fav-category">{job.category}</span>
                      <span className={`fav-status fav-status-${job.status}`}>{job.status}</span>
                    </div>
                    <div className="fav-bid-info">
                      <strong>Bid Amount:</strong> ${Number(job.bid_amount).toFixed(2)}
                      <span className={`fav-bid-status ${job.bid_status}`}>
                        {job.bid_status}
                      </span>
                    </div>
                    <div className="fav-property-name">
                      <strong>Property:</strong> {job.property_name}
                    </div>
                    {job.bid_message && (
                      <div className="fav-bid-message">
                        "{job.bid_message}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteEntrepreneurs;