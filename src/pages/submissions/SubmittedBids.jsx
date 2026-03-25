import React, { useEffect, useState } from 'react';
import Nav from '../../components/Nav';
import '../../styles/manager/submissions.css'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Search,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  FileText,
  X,
  ChevronRight,
  User,
  Building2,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PropertyManagerProfileModal from '../../components/modal/PropertyManagerProfileModal';

const SubmittedBids = () => {
  const { t, language } = useLanguage();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [bids, setBids] = useState({ all: [], pending: [], accepted: [], declined: [] });
  const [summary, setSummary] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);

  // Property Manager Profile Modal states
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedManagerProfile, setSelectedManagerProfile] = useState(null);
  const [isLoadingManagerProfile, setIsLoadingManagerProfile] = useState(false);

  // Withdraw bid states
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawBidId, setWithdrawBidId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);


  const navigate = useNavigate()

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const userProfile = localStorage.getItem('userProfile');

        if (!userProfile) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userProfile);
        const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/mine`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!bidsResponse.ok) {
          throw new Error('Error in getting bids');
        }

        const data = await bidsResponse.json();

        // Backend returns: { bids: { all, pending, approved, declined }, summary: { total, pending, approved, declined } }
        const allBids = data.bids?.all || [];
        const pendingBids = data.bids?.pending || [];
        const approvedBids = data.bids?.approved || [];
        const declinedBids = data.bids?.declined || [];

        // Use backend summary if available, otherwise calculate from arrays
        const mappedBids = {
          all: allBids,
          pending: pendingBids,
          accepted: approvedBids, // Map 'approved' from backend to 'accepted' for UI
          declined: declinedBids
        };

        const mappedSummary = {
          total: data.summary?.total || allBids.length,
          pending: data.summary?.pending || pendingBids.length,
          accepted: data.summary?.approved || approvedBids.length,
          declined: data.summary?.declined || declinedBids.length
        };

        console.log(mappedBids)
        setBids(mappedBids);
        console.log("Mapped bids: ", mappedBids)
        setSummary(mappedSummary);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBids();
  }, [API_BASE_URL]);

  const getStatusLabel = (status) => {
    const normalizedStatus = status?.toLowerCase();
    return normalizedStatus?.charAt(0).toUpperCase() + normalizedStatus?.slice(1);
  };

  const formatDate = (dateString) => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t('submittedBids.today');
    if (diffInDays === 1) return t('submittedBids.oneDayAgo');
    if (diffInDays < 7) return `${diffInDays} ${t('submittedBids.daysAgo')}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${t('submittedBids.weeksAgo')}`;
    return `${Math.floor(diffInDays / 30)} ${t('submittedBids.monthsAgo')}`;
  };

  // Helper function to translate job categories
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'Roofing': t('submittedBids.categoryRoofing'),
      'Carpentry': t('submittedBids.categoryCarpentry'),
      'Masonry': t('submittedBids.categoryMasonry'),
      'Plumbing': t('submittedBids.categoryPlumbing'),
      'Electrical': t('submittedBids.categoryElectrical'),
      'Painting': t('submittedBids.categoryPainting'),
      'Flooring': t('submittedBids.categoryFlooring'),
      'Landscaping': t('submittedBids.categoryLandscaping'),
      'HVAC': t('submittedBids.categoryHVAC'),
      'Windows/Doors': t('submittedBids.categoryWindowsDoors'),
      'General Repair': t('submittedBids.categoryGeneralRepair'),
      'Other': t('submittedBids.categoryOther'),
    };
    return categoryMap[category] || category;
  };

  const getCurrentBids = () => {
    return bids[activeTab] || [];
  };

  const filteredBids = getCurrentBids().filter(bid => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bid.job_title?.toLowerCase().includes(searchLower) ||
      bid.category?.toLowerCase().includes(searchLower) ||
      bid.property_address?.toLowerCase().includes(searchLower) ||
      bid.city?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (bid) => {
    setSelectedBid(bid);
    setShowDetailsModal(true);
  };

  const handleWithdrawBid = async () => {
    if (!withdrawBidId) return;
    setIsWithdrawing(true);
    try {
      const user = JSON.parse(localStorage.getItem('userProfile'));
      const res = await fetch(`${API_BASE_URL}/api/bids/${withdrawBidId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to withdraw bid');
      }
      // Remove bid from local state
      setBids(prev => ({
        all: prev.all.filter(b => b.id !== withdrawBidId),
        pending: prev.pending.filter(b => b.id !== withdrawBidId),
        accepted: prev.accepted,
        declined: prev.declined,
      }));
      setSummary(prev => ({
        ...prev,
        total: prev.total - 1,
        pending: prev.pending - 1,
      }));
      setShowWithdrawConfirm(false);
      setWithdrawBidId(null);
      // Close detail modal if viewing the withdrawn bid
      if (selectedBid?.id === withdrawBidId) {
        setShowDetailsModal(false);
        setSelectedBid(null);
      }
      toast.success(t('submittedBids.bidWithdrawn') || 'Bid withdrawn successfully');
    } catch (err) {
      toast.error(err.message || t('submittedBids.withdrawError') || 'Failed to withdraw bid');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMessageClicked = (bid) => {
    const userProfileData = localStorage.getItem('userProfile')

    if (!userProfileData) {
      toast.error(t('submittedBids.pleaseLogin') || 'Please log in to send messages');
      return;
    }

    try {
      const user = JSON.parse(userProfileData)

      // Use manager info directly from bid data (already fetched from backend)
      const managerId = bid.manager_user_id;
      const managerName = `${bid.manager_first_name || ''} ${bid.manager_last_name || ''}`.trim() || t('submittedBids.manager') || 'Manager';

      if (!managerId) {
        toast.error(t('submittedBids.cannotFindManager') || 'Cannot find property manager for this job');
        return;
      }

      if (managerId === user.id) {
        toast.error(t('submittedBids.cannotMessageSelf') || 'Cannot message yourself');
        return;
      }

      // Set target info and navigate - messages page will handle finding existing conversations
      localStorage.setItem("targetReceiverId", managerId);
      localStorage.setItem("targetReceiverName", managerName);
      localStorage.removeItem("targetConversationId");
      if (bid.job_id) localStorage.setItem("targetJobId", bid.job_id);
      navigate('/messages/entrepreneur');

    } catch (error) {
      console.error('Error handling message click:', error);
      toast.error(t('submittedBids.failedOpenMessages') || 'Failed to open messages. Please try again.');
    }
  }

  // Handle viewing property manager profile
  const handleViewManagerProfile = async (bid) => {
    const userId = bid.manager_user_id;
    if (!userId || isLoadingManagerProfile) return;

    setIsLoadingManagerProfile(true);
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (!userProfile) return;

      const user = JSON.parse(userProfile);

      const response = await fetch(
        `${API_BASE_URL}/api/users/manager/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch manager profile');
      }

      const data = await response.json();
      // Use the profile data directly - it now includes all user fields from the backend
      setSelectedManagerProfile(data.profile);
      setShowManagerModal(true);
    } catch (error) {
      console.error('Error fetching manager profile:', error);
      toast.error(t('toasts.failedLoadManagerProfile'));
    } finally {
      setIsLoadingManagerProfile(false);
    }
  };

  // Skeleton Loading Component
  const SubmittedBidsSkeleton = () => (
    <div className="subs-submissions-container">
      <Nav />
      <div className="subs-submissions-content">
        {/* Header Skeleton */}
        <header className="subs-page-header">
          <div className="subs-header-left">
            <div className="subs-header-title-group">
              <div className="skeleton skeleton-title" style={{ width: '200px', height: '32px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '80px', height: '24px', marginLeft: '12px' }}></div>
            </div>
          </div>
          <div className="subs-header-actions">
            <div className="skeleton skeleton-button" style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
          </div>
        </header>

        {/* Tabs Skeleton */}
        <div className="subs-tabs-container">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-tab" style={{ width: '100px', height: '40px', borderRadius: '8px' }}></div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="subs-controls-bar">
          <div className="skeleton skeleton-search" style={{ width: '100%', maxWidth: '400px', height: '44px', borderRadius: '8px' }}></div>
        </div>

        {/* Bids Grid Skeleton */}
        <div className="subs-bids-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="subs-bid-card skeleton-card">
              {/* Top Row */}
              <div className="subs-card-top">
                <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '4px' }}></div>
              </div>

              {/* Title */}
              <div className="skeleton" style={{ width: '85%', height: '24px', marginTop: '12px', borderRadius: '4px' }}></div>

              {/* Info Items */}
              <div className="subs-card-info" style={{ marginTop: '16px' }}>
                <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '80px', height: '16px', borderRadius: '4px' }}></div>
              </div>

              {/* Actions */}
              <div className="subs-card-actions" style={{ marginTop: '16px' }}>
                <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  if (loading) {
    return <SubmittedBidsSkeleton />;
  }

  if (error) {
    return (
      <div className="subs-submissions-container">
        <Nav />
        <div className="subs-submissions-content">
          <div className="subs-empty-state">
            <XCircle size={48} />
            <h3>{t('submittedBids.errorLoading')}</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subs-submissions-container">
      <Nav />

      <div className="subs-submissions-content">
        <header className="subs-page-header">
          <div className="subs-header-left">
            <div className="subs-header-title-group">
              <h1>{t('submittedBids.title')}</h1>
              <span className="subs-submission-count">{summary.total} {t('submittedBids.bids')}</span>
            </div>
          </div>
          <div className="subs-header-actions">
            <div className="subs-btn subs-btn-secondary">
              <AlertCircle size={18} />
              <span>{summary.pending} {t('submittedBids.pending')}</span>
            </div>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="subs-tabs-container">
          <button
            className={`subs-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t('submittedBids.allBids')}
            <span className="subs-tab-count">{summary.total}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {t('submittedBids.pending')}
            <span className="subs-tab-count">{summary.pending}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            {t('submittedBids.accepted')}
            <span className="subs-tab-count">{summary.accepted}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'declined' ? 'active' : ''}`}
            onClick={() => setActiveTab('declined')}
          >
            {t('submittedBids.declined')}
            <span className="subs-tab-count">{summary.declined}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="subs-controls-bar">
          <div className="subs-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('submittedBids.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="subs-clear-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <div className="subs-empty-state">
            <MessageSquare size={48} />
            <h3>{t('submittedBids.noBidsFound')}</h3>
            <p>
              {searchTerm
                ? t('submittedBids.adjustSearch')
                : activeTab === 'all'
                ? t('submittedBids.noSubmittedBids')
                : t('submittedBids.noStatusBids', { status: t(`submittedBids.${activeTab}`) })
              }
            </p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredBids.map(bid => {
              const getStatusInfo = (status) => {
                const normalizedStatus = status?.toLowerCase();
                const statusMap = {
                  pending: { class: "status-pending", icon: AlertCircle, label: t('submittedBids.pending') },
                  accepted: { class: "status-accepted", icon: CheckCircle, label: t('submittedBids.accepted') },
                  approved: { class: "status-accepted", icon: CheckCircle, label: t('submittedBids.approved') },
                  declined: { class: "status-declined", icon: XCircle, label: t('submittedBids.declined') },
                };
                return statusMap[normalizedStatus] || { class: "status-pending", icon: Clock, label: status };
              };
              const statusInfo = getStatusInfo(bid.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={bid.id} className="subs-bid-card" onClick={() => handleViewDetails(bid)}>
                  {/* Top Row: Status + Amount */}
                  <div className="subs-card-top">
                    <div className={`subs-status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </div>
                    <div className="subs-card-top-right">
                      <span className="subs-bid-amount">{formatCurrency(bid.amount)}</span>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="subs-job-title">{bid.job_title}</h3>

                  {/* Info Row */}
                  <div className="subs-card-info">
                    <div className="subs-info-item">
                      <FileText size={12} />
                      <span>{getCategoryLabel(bid.category)}</span>
                    </div>
                    {(bid.property_address || bid.city) && (
                      <div className="subs-info-item">
                        <MapPin size={12} />
                        <span>{bid.property_address}{bid.city ? `, ${bid.city}` : ''}</span>
                      </div>
                    )}
                    <div className="subs-info-item">
                      <Calendar size={12} />
                      <span>{getTimeAgo(bid.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="subs-card-actions">
                    <button className="subs-details-btn" onClick={(e) => { e.stopPropagation(); handleViewDetails(bid); }}>
                      {t('submittedBids.details')}
                      <ChevronRight size={14} />
                    </button>

                    {(bid.status === 'accepted' || bid.status === 'approved') && (
                      <button className="subs-chat-btn" onClick={(e) => { e.stopPropagation(); handleMessageClicked(bid); }}>
                        <MessageSquare size={18} />
                        <span>{t('submittedBids.chat') || 'Chat'}</span>
                      </button>
                    )}

                    {bid.status === 'pending' && (
                      <button
                        className="subs-withdraw-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWithdrawBidId(bid.id);
                          setShowWithdrawConfirm(true);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{t('submittedBids.withdraw') || 'Withdraw'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bid Details Modal */}
        {showDetailsModal && selectedBid && (
          <div className="bid-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="bid-modal-header">
                <h2>{t('submittedBids.bidDetails')}</h2>
                <button
                  className="bid-modal-close"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bid-modal-body">
                {/* Job Information */}
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <FileText size={20} />
                    {t('submittedBids.jobInformation')}
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label>{t('submittedBids.jobTitle')}</label>
                      <p>{selectedBid.job_title}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>{t('submittedBids.category')}</label>
                      <p>{getCategoryLabel(selectedBid.category)}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Clock size={14} /> {t('submittedBids.urgency')}
                      </label>
                      <p>{selectedBid.urgency}</p>
                    </div>
                    {selectedBid.due_date && (
                      <div className="bid-info-item">
                        <label>
                          <Calendar size={14} /> {t('submittedBids.dueDate')}
                        </label>
                        <p>{formatDate(selectedBid.due_date)}</p>
                      </div>
                    )}
                  </div>
                  <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                    <label>{t('submittedBids.description')}</label>
                    <p>{selectedBid.job_description}</p>
                  </div>
                  {(selectedBid.property_address || selectedBid.city) && (
                    <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                      <label>
                        <MapPin size={14} /> {t('submittedBids.propertyLocation')}
                      </label>
                      <p>{selectedBid.property_address}{selectedBid.city ? `, ${selectedBid.city}` : ''}</p>
                    </div>
                  )}
                </section>

                {/* Property Manager Information */}
                {(selectedBid.manager_first_name || selectedBid.manager_company_name) && (
                  <section className="bid-modal-section">
                    <h3 className="bid-section-title">
                      <User size={20} />
                      {t('submittedBids.propertyManager')}
                    </h3>
                    <div
                      className="bid-manager-card"
                      onClick={() => handleViewManagerProfile(selectedBid)}
                      title={t('submittedBids.viewManagerProfile')}
                    >
                      <div className="bid-manager-avatar">
                        {selectedBid.manager_company_name?.charAt(0) || selectedBid.manager_first_name?.charAt(0) || 'P'}
                      </div>
                      <div className="bid-manager-info">
                        <span className="bid-manager-name">
                          {selectedBid.manager_company_name || `${selectedBid.manager_first_name || ''} ${selectedBid.manager_last_name || ''}`.trim()}
                        </span>
                        {selectedBid.manager_first_name && selectedBid.manager_company_name && (
                          <span className="bid-manager-contact">
                            {`${selectedBid.manager_first_name} ${selectedBid.manager_last_name || ''}`.trim()}
                          </span>
                        )}
                        {selectedBid.manager_email && (
                          <span className="bid-manager-email">{selectedBid.manager_email}</span>
                        )}
                      </div>
                      <ChevronRight size={18} className="bid-manager-chevron" />
                    </div>
                  </section>
                )}

                {/* Bid Information */}
                <section className="bid-modal-section bid-modal-highlight">
                  <h3 className="bid-section-title">
                    <DollarSign size={20} />
                    {t('submittedBids.yourBidInformation')}
                  </h3>
                  <div className="bid-info-display">
                    <div className="bid-amount-display">
                      <label>{t('submittedBids.bidAmount')}</label>
                      <p className="amount">
                        {formatCurrency(selectedBid.amount)}
                      </p>
                    </div>
                    {selectedBid.message && (
                      <div className="bid-message">
                        <label>
                          <MessageSquare size={14} /> {t('submittedBids.yourProposalMessage')}
                        </label>
                        <p>{selectedBid.message}</p>
                      </div>
                    )}
                    <div className="bid-info-grid" style={{ marginTop: '1rem' }}>
                      <div className="bid-info-item">
                        <label>
                          <Calendar size={14} /> {t('submittedBids.submittedOn')}
                        </label>
                        <p>{formatDate(selectedBid.created_at)}</p>
                      </div>
                      <div className="bid-info-item">
                        <label>{t('submittedBids.status')}</label>
                        <span className={`bid-status-badge-modal status-${selectedBid.status}`}>
                          {getStatusLabel(selectedBid.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="bid-modal-footer">
                {selectedBid.status === 'pending' && (
                  <button
                    className="bid-btn-withdraw"
                    onClick={() => {
                      setWithdrawBidId(selectedBid.id);
                      setShowWithdrawConfirm(true);
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    <Trash2 size={16} />
                    {t('submittedBids.withdrawBid') || 'Withdraw Bid'}
                  </button>
                )}
                {(selectedBid.status === 'accepted' || selectedBid.status === 'approved') && (
                  <button
                    className="bid-btn-accept"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleMessageClicked(selectedBid);
                    }}
                  >
                    <MessageSquare size={16} />
                    {t('submittedBids.messageManager')}
                  </button>
                )}
                <button
                  className="bid-btn-decline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  {t('submittedBids.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Bid Confirmation Modal */}
        {showWithdrawConfirm && (
          <div className="release-confirm-overlay" onClick={() => { if (!isWithdrawing) { setShowWithdrawConfirm(false); setWithdrawBidId(null); } }}>
            <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="release-confirm-icon" style={{ color: '#ef4444' }}>
                <AlertCircle size={32} />
              </div>
              <h3>{t('submittedBids.withdrawConfirmTitle') || 'Withdraw Bid?'}</h3>
              <p>{t('submittedBids.withdrawConfirmMessage') || 'Are you sure you want to withdraw this bid? This action cannot be undone and the property manager will be notified.'}</p>
              <div className="release-confirm-actions">
                <button
                  className="release-confirm-cancel"
                  onClick={() => { setShowWithdrawConfirm(false); setWithdrawBidId(null); }}
                  disabled={isWithdrawing}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  className="release-confirm-submit"
                  onClick={handleWithdrawBid}
                  disabled={isWithdrawing}
                  style={{ background: '#ef4444' }}
                >
                  {isWithdrawing ? (
                    <>
                      <span className="btn-spinner" style={{ width: 16, height: 16, marginRight: 8 }}></span>
                      {t('submittedBids.withdrawing') || 'Withdrawing...'}
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} style={{ marginRight: 6 }} />
                      {t('submittedBids.confirmWithdraw') || 'Yes, Withdraw'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Property Manager Profile Modal */}
        <PropertyManagerProfileModal
          isOpen={showManagerModal}
          onClose={() => setShowManagerModal(false)}
          profile={selectedManagerProfile}
        />
      </div>
    </div>
  );
};

export default SubmittedBids;