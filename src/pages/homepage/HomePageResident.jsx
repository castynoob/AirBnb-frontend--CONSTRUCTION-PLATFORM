import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Search, Bell, Calendar, Wrench, AlertTriangle, Megaphone } from 'lucide-react';
import Nav from '../../components/Nav';
import AnnouncementCard from '../../components/AnnouncementCard';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/resident/homepageresident.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const HomePageResident = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [propertyId, setPropertyId] = useState(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError(t('homePageResident.authenticationRequired'));
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/residents/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(t('homePageResident.failedToFetchProfile'));
        }

        const data = await response.json();
        
        if (data.success && data.profile.property_id) {
          setPropertyId(data.profile.property_id);
          console.log('✅ Property ID:', data.profile.property_id);
        } else {
          setError(t('homePageResident.noPropertyAssigned'));
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error fetching user profile:', err);
        setError(t('homePageResident.failedToLoadProfile'));
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [t]);

  // ============================================
  // FETCH ANNOUNCEMENTS (triggered when propertyId changes)
  // ============================================
  useEffect(() => {
    if (propertyId) {
      console.log('🚀 Fetching announcements for property:', propertyId);
      fetchAnnouncements();
    }
  }, [propertyId, activeFilter, search]);

  // ============================================
  // FETCH ANNOUNCEMENTS FUNCTION
  // ============================================
  const fetchAnnouncements = async () => {
    try {
      if (!propertyId) {
        console.warn('⚠️ Property ID not available');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('homePageResident.authenticationRequired'));
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (activeFilter !== 'All') {
        params.append('type', activeFilter);
      }
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '50');
      params.append('offset', '0');

      const url = `${API_BASE_URL}/api/residents/announcements?${params.toString()}`;
      console.log('🔍 Fetching from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Response error:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch announcements');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements || []);
        setError(null);
      } else {
        setAnnouncements([]);
        setError(data.message || t('homePageResident.noAnnouncementsAvailable'));
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching announcements:', err);
      setError(err.message || t('homePageResident.failedToFetchAnnouncements'));
      setLoading(false);
    }
  };

  // ============================================
  // SETUP SOCKET.IO FOR REAL-TIME UPDATES
  // ============================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !propertyId) return;

    // Connect to Socket.IO
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: token
      }
    });

    setSocket(newSocket);

    // Join property room for announcements
    newSocket.emit('join_property', { property_id: propertyId });

    // Listen for new announcements
    newSocket.on('new_announcement', (announcement) => {
      console.log('📢 New announcement received:', announcement);
      setAnnouncements(prev => [announcement, ...prev]);

      // Show notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t('homePageResident.newAnnouncement'), {
          body: announcement.title,
          icon: '/logo.png'
        });
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [propertyId, t]);

  // ============================================
  // REQUEST NOTIFICATION PERMISSION
  // ============================================
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Filter types with icons
  const filterTypes = [
    { name: 'All', label: t('homePageResident.all'), icon: null },
    { name: 'Maintenance', label: t('homePageResident.maintenance'), icon: Wrench },
    { name: 'Event', label: t('homePageResident.event'), icon: Calendar },
    { name: 'Notice', label: t('homePageResident.notice'), icon: Megaphone },
    { name: 'Emergency', label: t('homePageResident.emergency'), icon: AlertTriangle }
  ];

  return (
    <>
      <div className="resident-fullmain-container">
        <Nav />
        <div className="resident-main-container">
          {/* Page Header */}
          <div className="resident-page-header">
            <div>
              <h1>{t('homePageResident.title')}</h1>
              <p>{t('homePageResident.subtitle')}</p>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="resident-filter-section">
            <div className="resident-search-box-filter">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder={t('homePageResident.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="resident-search-input-filter"
              />
              {search && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label={t('homePageResident.clearSearch')}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="resident-filter-buttons">
              {filterTypes.map(({ name, label, icon: Icon }) => (
                <button
                  key={name}
                  className={`resident-filter-btn ${
                    activeFilter === name ? 'resident-filter-btn-active' : ''
                  }`}
                  onClick={() => setActiveFilter(name)}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('homePageResident.loadingAnnouncements')}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button
                className="retry-btn"
                onClick={fetchAnnouncements}
              >
                {t('homePageResident.tryAgain')}
              </button>
            </div>
          )}

          {/* Announcements List */}
          {!loading && !error && announcements.length > 0 && (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && announcements.length === 0 && (
            <div className="resident-no-results-home">
              <div className="empty-state-icon">📭</div>
              <h3>{t('homePageResident.noAnnouncementsFound')}</h3>
              <p>
                {search || activeFilter !== 'All'
                  ? t('homePageResident.adjustSearchOrFilter')
                  : t('homePageResident.noAnnouncementsAtThisTime')}
              </p>
              {(search || activeFilter !== 'All') && (
                <button
                  className="reset-filter-btn"
                  onClick={() => {
                    setSearch('');
                    setActiveFilter('All');
                  }}
                >
                  {t('homePageResident.clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePageResident;