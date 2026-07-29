import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFavorites,
  removeFavorite,
  getEntrepreneurHistory,
  updateFavoriteNotes,
  updateFavoriteCategory
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
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';
import Nav from '../../components/Nav';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/manager/favoriteentrepreneurs.css';
import toast from 'react-hot-toast';
import EntrepreneurProfileModal from '../../components/modal/EntrepreneurProfileModal';
import InviteToBidModal from '../../components/modal/InviteToBidModal';
import { Send } from 'lucide-react';

// Helper: returns fallback if t() returns the key itself
const tx = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

const FavoriteEntrepreneurs = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Invite-to-bid state — same shared modal used in the specialist directory.
  // `inviteTarget` holds {user_id, display_name} while the modal is open.
  // `invitedIds` toggles the button label from "Invite to Bid" to
  // "Invited · Invite to another job" after a successful send this session.
  const [inviteTarget, setInviteTarget] = useState(null);
  const [invitedIds, setInvitedIds] = useState(() => new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // New state for filtering/searching
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filters, setFilters] = useState({
    minRating: '',
    minJobs: '',
  });

  // Get unique categories from favorites
  const categories = useMemo(() => {
    const cats = favorites
      .map(f => f.category)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
    return cats
  }, [favorites])

  // Handle category update
  const handleUpdateCategory = async (favoriteId, newCategory) => {
    try {
      await updateFavoriteCategory(favoriteId, newCategory)
      setFavorites(prev => prev.map(f =>
        f.favorite_id === favoriteId ? { ...f, category: newCategory } : f
      ))
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  // Tabs configuration
  const tabs = [
    { id: 'all', label: tx(t, 'favorites.allFavorites', 'All Favorites'), icon: Heart },
    { id: 'approved', label: tx(t, 'favorites.approved', 'Approved'), icon: CheckCircle },
    { id: 'pending', label: tx(t, 'favorites.pending', 'Pending'), icon: Clock },
  ];

  // Filtered favorites based on tab and search
  const filteredFavorites = useMemo(() => {
    let result = [...favorites];

    // Filter by tab
    if (activeTab === 'approved') {
      result = result.filter(fav => fav.bid_status === 'approved');
    } else if (activeTab === 'pending') {
      result = result.filter(fav => fav.bid_status !== 'approved');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fav =>
        `${fav.first_name} ${fav.last_name}`.toLowerCase().includes(query) ||
        fav.company_name?.toLowerCase().includes(query) ||
        fav.last_job_title?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        result = result.filter(fav => !fav.category);
      } else {
        result = result.filter(fav => fav.category === categoryFilter);
      }
    }

    // Apply additional filters
    if (filters.minRating) {
      result = result.filter(fav => Number(fav.average_rating) >= Number(filters.minRating));
    }
    if (filters.minJobs) {
      result = result.filter(fav => (fav.completed_jobs || 0) >= Number(filters.minJobs));
    }

    return result;
  }, [favorites, activeTab, searchQuery, filters, categoryFilter]);

  // Get counts for tabs
  const tabCounts = useMemo(() => ({
    all: favorites.length,
    approved: favorites.filter(fav => fav.bid_status === 'approved').length,
    pending: favorites.filter(fav => fav.bid_status !== 'approved').length,
  }), [favorites]);

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      setFavorites(response.favorites || []);
      setError(null);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError(t('favorites.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites on mount
  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({ minRating: '', minJobs: '' });
    setShowFilters(false);
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
      showNotification(t('favorites.removedSuccess'), 'success');

      if (selectedEntrepreneur?.bid_id === bidId) {
        setSelectedEntrepreneur(null);
        setJobHistory([]);
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      showNotification(t('favorites.removeFailed'), 'error');
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
      showNotification(t('favorites.historyFailed'), 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start conversation with entrepreneur
  const handleMessage = async (favorite) => {
    if (favorite.bid_status !== 'approved') {
      showNotification(t('favorites.messageNotApproved'), 'warning');
      return;
    }

    try {
      localStorage.setItem('targetReceiverId', favorite.user_id);
      localStorage.setItem('targetReceiverName', favorite.company_name || `${favorite.first_name} ${favorite.last_name}`);
      if (favorite.job_id) {
        localStorage.setItem('targetJobId', favorite.job_id);
      }
      navigate('/messages/property_manager');
    } catch (err) {
      console.error('Error navigating to messages:', err);
      showNotification(t('favorites.messageFailed'), 'error');
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
      showNotification(t('favorites.notesSaved'), 'success');
    } catch (err) {
      console.error('Error saving notes:', err);
      showNotification(t('favorites.notesFailed'), 'error');
    }
  };

  // Cancel editing notes
  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  // Fetch and show entrepreneur profile modal
  const handleViewProfile = async (favorite) => {
    const userId = favorite.user_id;
    if (!userId || isLoadingProfile) return;

    setIsLoadingProfile(true);
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (!userProfile) return;

      const user = JSON.parse(userProfile);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/user/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setSelectedProfile(data.profile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching entrepreneur profile:', error);
      showNotification(t('favorites.profileFailed'), 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="fav-card fav-skeleton-card">
      <div className="fav-card-top">
        <div className="fav-skeleton fav-skeleton-badge"></div>
        <div className="fav-skeleton fav-skeleton-btn"></div>
      </div>
      <div className="fav-card-main">
        <div className="fav-skeleton fav-skeleton-avatar"></div>
        <div className="fav-card-main-info">
          <div className="fav-skeleton fav-skeleton-name"></div>
          <div className="fav-skeleton fav-skeleton-rating"></div>
        </div>
      </div>
      <div className="fav-card-stats">
        <div className="fav-skeleton fav-skeleton-stat"></div>
        <div className="fav-skeleton fav-skeleton-stat"></div>
      </div>
      <div className="fav-skeleton fav-skeleton-notes"></div>
      <div className="fav-card-actions">
        <div className="fav-skeleton fav-skeleton-action-btn"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fav-container">
        <Nav />
        <div className="fav-content">
          <header className="fav-page-header">
            <div className="fav-header-left">
              <div className="fav-header-title-group">
                <h1>{t('favorites.title')}</h1>
                <span className="fav-count-badge">{t('common.loading')}</span>
              </div>
            </div>
          </header>

          <div className="fav-tabs-container">
            {[1, 2, 3].map(i => (
              <div key={i} className="fav-tab-btn">
                <div className="fav-skeleton" style={{ width: '80px', height: '16px' }}></div>
              </div>
            ))}
          </div>

          <div className="fav-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-container">
      <Nav />

      <div className="fav-content">
        {/* Page Header */}
        <header className="fav-page-header">
          <div className="fav-header-left">
            <div className="fav-header-title-group">
              <h1>{t('favorites.title')}</h1>
              <span className="fav-count-badge">
                {filteredFavorites.length} {t('favorites.contractors')}
              </span>
            </div>
          </div>
          <div className="fav-header-actions">
            <button
              className="fav-btn fav-btn-primary"
              onClick={() => navigate('/submissions/property_manager')}
            >
              <FileText size={18} />
              <span>{t('favorites.browseBids')}</span>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="fav-tabs-container">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`fav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
                <span className="fav-tab-count">{tabCounts[tab.id]}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="fav-category-pills">
            <button
              className={`fav-cat-pill ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              {tx(t, 'favorites.allCategories', 'All Categories')}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`fav-cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
                <span className="fav-cat-pill-count">
                  {favorites.filter(f => f.category === cat).length}
                </span>
              </button>
            ))}
            {favorites.some(f => !f.category) && (
              <button
                className={`fav-cat-pill ${categoryFilter === 'uncategorized' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('uncategorized')}
              >
                {tx(t, 'favorites.uncategorized', 'Uncategorized')}
                <span className="fav-cat-pill-count">
                  {favorites.filter(f => !f.category).length}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Controls Bar */}
        <div className="fav-controls-bar">
          <div className="fav-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('favorites.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="fav-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className={`fav-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>{t('favorites.filters')}</span>
            <ChevronDown size={14} className={showFilters ? 'rotated' : ''} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="fav-filters-panel">
            <div className="fav-filters-grid">
              <div className="fav-filter-item">
                <label>{t('favorites.minRating')}</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
                >
                  <option value="">{t('favorites.anyRating')}</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4.0+</option>
                  <option value="3.5">3.5+</option>
                  <option value="3">3.0+</option>
                </select>
              </div>
              <div className="fav-filter-item">
                <label>{t('favorites.minCompletedJobs')}</label>
                <select
                  value={filters.minJobs}
                  onChange={(e) => setFilters(prev => ({ ...prev, minJobs: e.target.value }))}
                >
                  <option value="">{t('favorites.anyJobs')}</option>
                  <option value="10">10+</option>
                  <option value="5">5+</option>
                  <option value="3">3+</option>
                  <option value="1">1+</option>
                </select>
              </div>
              <button className="fav-clear-all-btn" onClick={clearAllFilters}>
                <X size={14} />
                {t('favorites.clearAll')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="fav-error-message">
            {error}
            <button onClick={loadFavorites} className="fav-retry-button">
              {t('favorites.retry')}
            </button>
          </div>
        )}

        {filteredFavorites.length === 0 ? (
          <div className="fav-empty-state">
            <Heart size={48} />
            <h2>{favorites.length === 0 ? t('favorites.noFavorites') : t('favorites.noResults')}</h2>
            <p>
              {favorites.length === 0
                ? t('favorites.noFavoritesDescription')
                : t('favorites.noResultsDescription')
              }
            </p>
            {favorites.length === 0 && (
              <button
                className="fav-btn fav-btn-primary"
                onClick={() => navigate('/submissions/property_manager')}
              >
                {t('favorites.browseBids')}
              </button>
            )}
          </div>
        ) : (
          <div className="fav-grid">
            {filteredFavorites.map(favorite => (
              <div key={favorite.bid_id || favorite.favorite_id} className="fav-card">
                {/* Card Top - Status & Actions */}
                <div className="fav-card-top">
                  <div className={`fav-status-badge ${favorite.bid_status === 'approved' ? 'approved' : 'pending'}`}>
                    {favorite.bid_status === 'approved' ? (
                      <><CheckCircle size={12} /> {t('favorites.bidApproved')}</>
                    ) : (
                      <><Clock size={12} /> {t('favorites.bidPending')}</>
                    )}
                  </div>
                  <div className="fav-card-top-right">
                    {favorite.last_bid_amount && (
                      <span className="fav-bid-amount">${Number(favorite.last_bid_amount).toLocaleString()}</span>
                    )}
                    <button
                      className="fav-favorite-btn active"
                      onClick={() => handleRemoveFavorite(favorite.bid_id, favorite.company_name || `${favorite.first_name} ${favorite.last_name}`)}
                      aria-label={t('favorites.removeFromFavorites')}
                    >
                      <Heart size={16} fill="#E74C3C" stroke="#E74C3C" />
                    </button>
                  </div>
                </div>

                {/* Main Info */}
                <div className="fav-card-main">
                  <div
                    className="fav-avatar fav-avatar-clickable"
                    onClick={() => handleViewProfile(favorite)}
                    title={t('favorites.viewProfile')}
                  >
                    {favorite.profile_picture_url ? (
                      <img src={favorite.profile_picture_url} alt={favorite.first_name} />
                    ) : (
                      <span className="fav-avatar-initials">
                        {favorite.company_name ? favorite.company_name.charAt(0) : `${favorite.first_name?.charAt(0)}${favorite.last_name?.charAt(0)}`}
                      </span>
                    )}
                  </div>
                  <div className="fav-card-main-info">
                    <h3
                      className="fav-contractor-name fav-contractor-name-clickable"
                      onClick={() => handleViewProfile(favorite)}
                      title={t('favorites.viewProfile')}
                    >
                      {favorite.company_name || `${favorite.first_name} ${favorite.last_name}`}
                    </h3>
                    <div className="fav-contractor-rating">
                      <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                      <span>{Number(favorite.average_rating).toFixed(1)}</span>
                      <span className="fav-review-count">({favorite.review_count} {t('favorites.reviews')})</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="fav-card-stats">
                  <div className="fav-stat-item">
                    <Briefcase size={14} />
                    <span className="fav-stat-value">{favorite.completed_jobs || 0}</span>
                    <span className="fav-stat-label">{t('favorites.jobsDone')}</span>
                  </div>
                  {favorite.last_job_title && (
                    <div className="fav-stat-item fav-last-job">
                      <FileText size={14} />
                      <span className="fav-last-job-title">{favorite.last_job_title}</span>
                    </div>
                  )}
                </div>

                {/* Specializations + Category */}
                <div className="fav-category-section">
                  {/* Contractor's specializations — capped at 5 so profiles
                      like the "all-trades" ones don't balloon the card into a
                      wall of chips. Remainder rolls up into a +N pill. */}
                  {favorite.specializations && favorite.specializations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      {favorite.specializations.slice(0, 5).map((spec, si) => (
                        <span key={si} style={{ fontSize: '0.6875rem', padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px', fontWeight: 500 }}>{spec}</span>
                      ))}
                      {favorite.specializations.length > 5 && (
                        <button
                          type="button"
                          onClick={() => handleViewProfile(favorite)}
                          title={favorite.specializations.slice(5).join(', ')}
                          style={{
                            fontSize: '0.6875rem', padding: '2px 8px',
                            background: '#eef4ff', color: '#1e40af',
                            borderRadius: '4px', fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          +{favorite.specializations.length - 5} more
                        </button>
                      )}
                    </div>
                  )}
                  {/* PM's category label */}
                  {editingCategory === favorite.favorite_id ? (
                    <div className="fav-category-edit">
                      <select
                        className="fav-category-select"
                        defaultValue={favorite.category || ''}
                        onChange={(e) => handleUpdateCategory(favorite.favorite_id, e.target.value || null)}
                        autoFocus
                        onBlur={() => setEditingCategory(null)}
                      >
                        <option value="">{tx(t, 'favorites.noCategory', 'No Category')}</option>
                        <option value="Roofing">{tx(t, 'favorites.catRoofing', 'Roofing')}</option>
                        <option value="Plumbing">{tx(t, 'favorites.catPlumbing', 'Plumbing')}</option>
                        <option value="Electrical">{tx(t, 'favorites.catElectrical', 'Electrical')}</option>
                        <option value="Carpentry">{tx(t, 'favorites.catCarpentry', 'Carpentry')}</option>
                        <option value="Painting">{tx(t, 'favorites.catPainting', 'Painting')}</option>
                        <option value="Flooring">{tx(t, 'favorites.catFlooring', 'Flooring')}</option>
                        <option value="Landscaping">{tx(t, 'favorites.catLandscaping', 'Landscaping')}</option>
                        <option value="Masonry">{tx(t, 'favorites.catMasonry', 'Masonry')}</option>
                        <option value="HVAC">{tx(t, 'favorites.catHVAC', 'HVAC')}</option>
                        <option value="Windows/Doors">{tx(t, 'favorites.catWindowsDoors', 'Windows/Doors')}</option>
                        <option value="General Repair">{tx(t, 'favorites.catGeneralRepair', 'General Repair')}</option>
                        <option value="Other">{tx(t, 'favorites.catOther', 'Other')}</option>
                      </select>
                    </div>
                  ) : (
                    <button
                      className="fav-category-tag"
                      onClick={() => setEditingCategory(favorite.favorite_id)}
                      title={tx(t, 'favorites.changeCategory', 'Change category')}
                    >
                      {favorite.category ? (
                        <><span className="fav-cat-dot" />{favorite.category}</>
                      ) : (
                        <><Edit3 size={12} /> {tx(t, 'favorites.addCategory', 'Add Category')}</>
                      )}
                    </button>
                  )}
                </div>

                {/* Notes Section */}
                <div className="fav-notes-section">
                  {editingNotes === favorite.favorite_id ? (
                    <div className="fav-notes-edit">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder={t('favorites.notesPlaceholder')}
                        rows="3"
                      />
                      <div className="fav-notes-actions">
                        <button
                          className="fav-btn fav-btn-sm fav-btn-primary"
                          onClick={() => handleSaveNotes(favorite.favorite_id)}
                        >
                          <Save size={14} /> {t('favorites.save')}
                        </button>
                        <button
                          className="fav-btn fav-btn-sm fav-btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          <X size={14} /> {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="fav-notes-display">
                      <div className="fav-notes-header">
                        <span className="fav-notes-label">{t('favorites.notes')}</span>
                        <button
                          className="fav-edit-btn"
                          onClick={() => handleEditNotes(favorite)}
                        >
                          <Edit3 size={12} /> {t('favorites.edit')}
                        </button>
                      </div>
                      <p className="fav-notes-text">
                        {favorite.notes || t('favorites.noNotes')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions — Invite to Bid is the primary action so it
                    sits full-width on top. Secondary actions (Message,
                    History, Details) share a row below with equal width so
                    the labels don't wrap. */}
                <div className="fav-card-actions">
                  <button
                    className="fav-action-btn primary fav-action-primary-full"
                    onClick={() => setInviteTarget({
                      user_id: favorite.user_id,
                      display_name: favorite.company_name || `${favorite.first_name || ''} ${favorite.last_name || ''}`.trim(),
                    })}
                    title="Invite this contractor to bid on one of your jobs"
                  >
                    <Send size={14} />
                    <span>{invitedIds.has(favorite.user_id) ? 'Invited · Invite again' : 'Invite to Bid'}</span>
                  </button>
                  <div className="fav-action-secondary-row">
                    <button
                      className={`fav-action-btn ${favorite.bid_status === 'approved' ? 'secondary' : 'disabled'}`}
                      onClick={() => handleMessage(favorite)}
                      disabled={favorite.bid_status !== 'approved'}
                      title={favorite.bid_status === 'approved' ? t('favorites.sendMessage') : t('favorites.approveFirst')}
                    >
                      <MessageCircle size={14} />
                      <span>{t('favorites.message')}</span>
                    </button>
                    <button
                      className="fav-action-btn secondary"
                      onClick={() => handleViewHistory(favorite)}
                    >
                      <History size={14} />
                      <span>{t('favorites.history')}</span>
                    </button>
                    <button
                      className="fav-action-btn secondary"
                      onClick={() => handleViewProfile(favorite)}
                    >
                      <span>{t('favorites.details')}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
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
              <h2>{t('favorites.jobHistory')}</h2>
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
                  <p>{t('favorites.loadingHistory')}</p>
                </div>
              ) : jobHistory.length === 0 ? (
                <div className="fav-sidebar-empty">
                  <History size={32} />
                  <p>{t('favorites.noHistory')}</p>
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
                        <span>{t('favorites.bid')}: ${Number(job.bid_amount).toFixed(2)}</span>
                        <span className={`fav-history-bid-status ${job.bid_status}`}>
                          {job.bid_status}
                        </span>
                      </div>
                      <div className="fav-history-property">
                        {t('favorites.property')}: {job.property_name}
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
            <h3>{t('favorites.removeConfirmTitle')}</h3>
            <p>{t('favorites.removeConfirmMessage')} <strong>{confirmModal.entrepreneurName}</strong>?</p>
            <div className="fav-confirm-actions">
              <button
                className="fav-btn fav-btn-secondary"
                onClick={() => setConfirmModal(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="fav-btn fav-btn-danger"
                onClick={confirmRemoveFavorite}
              >
                <Trash2 size={14} /> {t('favorites.remove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entrepreneur Profile Modal */}
      <EntrepreneurProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
      />

      {/* Shared Invite-to-Bid picker — same modal used on /find-contractors. */}
      <InviteToBidModal
        contractor={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onInvited={(userId) => setInvitedIds((prev) => new Set(prev).add(userId))}
      />
    </div>
  );
};

export default FavoriteEntrepreneurs;
