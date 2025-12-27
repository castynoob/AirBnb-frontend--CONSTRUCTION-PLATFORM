import React, { useEffect, useState } from 'react';
import Nav from '../../components/Nav';
import '../../styles/manager/submissions.css'
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PropertyManagerProfileModal from '../../components/modal/PropertyManagerProfileModal';

const SubmittedBids = () => {
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

        // Backend doesn't group accepted bids, so we filter them from "all"
        const allBids = data.bids.all || [];

        // Filter bids by status from the "all" array
        // Inside fetchBids:
        const acceptedBids = allBids.filter(bid => bid.status?.toLowerCase() === 'approved' || bid.status?.toLowerCase() === 'accepted');  // Changed from 'accepted'
        const pendingBids = data.bids.pending || [];
        const declinedBids = data.bids.declined || [];

        // Calculate accurate counts
        const acceptedCount = acceptedBids.length;
        const pendingCount = pendingBids.length;
        const declinedCount = declinedBids.length;

        const mappedBids = {
          all: allBids,
          pending: pendingBids,
          accepted: acceptedBids,
          declined: declinedBids
        };

        const mappedSummary = {
          total: allBids.length,
          pending: pendingCount,
          accepted: acceptedCount,
          declined: declinedCount
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
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

  const handleMessageClicked = async (bid) => {
    const userProfile = localStorage.getItem('userProfile')

    if (!userProfile) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      const user = JSON.parse(userProfile)

      // Use manager info directly from bid data (already fetched from backend)
      const managerId = bid.manager_user_id;
      const managerName = `${bid.manager_first_name || ''} ${bid.manager_last_name || ''}`.trim() || 'Manager';

      if (!managerId || managerId === user.id) {
        toast.error('Cannot find property manager for this job');
        return;
      }

      // Check for existing conversation with this manager
      const conversationsResponse = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        const conversations = conversationsData.conversations || [];

        // Find existing conversation with this manager (optionally matching job_id)
        const existingConversation = conversations.find(conv =>
          String(conv.other_user_id) === String(managerId) &&
          (!conv.job_id || String(conv.job_id) === String(bid.job_id))
        );

        if (existingConversation) {
          // Existing conversation found - navigate to it
          console.log("💬 Found existing conversation:", existingConversation.id);
          localStorage.setItem("targetReceiverId", managerId);
          localStorage.setItem("targetReceiverName", managerName);
          localStorage.setItem("targetConversationId", existingConversation.id);
          if (bid.job_id) localStorage.setItem("targetJobId", bid.job_id);
          toast.success('Opening existing conversation...');
          navigate('/messages/entrepreneur');
          return;
        }
      }

      // No existing conversation - create new chat
      console.log("🆕 Creating new conversation with manager:", managerId);
      localStorage.setItem("targetReceiverId", managerId);
      localStorage.setItem("targetReceiverName", managerName);
      localStorage.removeItem("targetConversationId"); // Clear any previous conversation ID
      if (bid.job_id) localStorage.setItem("targetJobId", bid.job_id);
      navigate('/messages/entrepreneur');

    } catch (error) {
      console.error('Error handling message click:', error);
      toast.error('Failed to open messages. Please try again.');
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
      setSelectedManagerProfile({
        ...data.profile,
        first_name: bid.manager_first_name,
        last_name: bid.manager_last_name,
        email: bid.manager_email,
        phone: bid.manager_phone,
      });
      setShowManagerModal(true);
    } catch (error) {
      console.error('Error fetching manager profile:', error);
      toast.error('Failed to load manager profile');
    } finally {
      setIsLoadingManagerProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="subs-submissions-container">
        <Nav />
        <div className="subs-submissions-content">
          <div className="subs-loading-state">
            <div className="subs-spinner"></div>
            <p>Loading your bids...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subs-submissions-container">
        <Nav />
        <div className="subs-submissions-content">
          <div className="subs-empty-state">
            <XCircle size={48} />
            <h3>Error Loading Bids</h3>
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
              <h1>SUBMITTED BIDS</h1>
              <span className="subs-submission-count">{summary.total} bids</span>
            </div>
          </div>
          <div className="subs-header-actions">
            <div className="subs-btn subs-btn-secondary">
              <AlertCircle size={18} />
              <span>{summary.pending} Pending</span>
            </div>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="subs-tabs-container">
          <button
            className={`subs-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Bids
            <span className="subs-tab-count">{summary.total}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            <span className="subs-tab-count">{summary.pending}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Accepted
            <span className="subs-tab-count">{summary.accepted}</span>
          </button>
          <button
            className={`subs-tab-btn ${activeTab === 'declined' ? 'active' : ''}`}
            onClick={() => setActiveTab('declined')}
          >
            Declined
            <span className="subs-tab-count">{summary.declined}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="subs-controls-bar">
          <div className="subs-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by job title, category, or location..."
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
            <h3>No bids found</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search criteria'
                : activeTab === 'all'
                ? 'You haven\'t submitted any bids yet'
                : `No ${activeTab} bids at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredBids.map(bid => {
              const getStatusInfo = (status) => {
                const normalizedStatus = status?.toLowerCase();
                const statusMap = {
                  pending: { class: "status-pending", icon: AlertCircle, label: "Pending" },
                  accepted: { class: "status-accepted", icon: CheckCircle, label: "Accepted" },
                  approved: { class: "status-accepted", icon: CheckCircle, label: "Approved" },
                  declined: { class: "status-declined", icon: XCircle, label: "Declined" },
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
                      {bid.urgency && bid.urgency.includes('Urgent') && (
                        <span className="subs-urgency urgent">Urgent</span>
                      )}
                      <span className="subs-bid-amount">{formatCurrency(bid.amount)}</span>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="subs-job-title">{bid.job_title}</h3>

                  {/* Info Row */}
                  <div className="subs-card-info">
                    <div className="subs-info-item">
                      <FileText size={12} />
                      <span>{bid.category}</span>
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
                      Details
                      <ChevronRight size={14} />
                    </button>

                    {(bid.status === 'accepted' || bid.status === 'approved') && (
                      <button className="subs-chat-btn" onClick={(e) => { e.stopPropagation(); handleMessageClicked(bid); }}>
                        <MessageSquare size={14} />
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
                <h2>Bid Details</h2>
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
                    Job Information
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label>Job Title</label>
                      <p>{selectedBid.job_title}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>Category</label>
                      <p>{selectedBid.category}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Clock size={14} /> Urgency
                      </label>
                      <p>{selectedBid.urgency}</p>
                    </div>
                    {selectedBid.due_date && (
                      <div className="bid-info-item">
                        <label>
                          <Calendar size={14} /> Due Date
                        </label>
                        <p>{formatDate(selectedBid.due_date)}</p>
                      </div>
                    )}
                  </div>
                  <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                    <label>Description</label>
                    <p>{selectedBid.job_description}</p>
                  </div>
                  {(selectedBid.property_address || selectedBid.city) && (
                    <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                      <label>
                        <MapPin size={14} /> Property Location
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
                      Property Manager
                    </h3>
                    <div
                      className="bid-manager-card"
                      onClick={() => handleViewManagerProfile(selectedBid)}
                      title="View property manager profile"
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
                    Your Bid Information
                  </h3>
                  <div className="bid-info-display">
                    <div className="bid-amount-display">
                      <label>Bid Amount</label>
                      <p className="amount">
                        {formatCurrency(selectedBid.amount)}
                      </p>
                    </div>
                    {selectedBid.message && (
                      <div className="bid-message">
                        <label>
                          <MessageSquare size={14} /> Your Proposal Message
                        </label>
                        <p>{selectedBid.message}</p>
                      </div>
                    )}
                    <div className="bid-info-grid" style={{ marginTop: '1rem' }}>
                      <div className="bid-info-item">
                        <label>
                          <Calendar size={14} /> Submitted On
                        </label>
                        <p>{formatDate(selectedBid.created_at)}</p>
                      </div>
                      <div className="bid-info-item">
                        <label>Status</label>
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
                {(selectedBid.status === 'accepted' || selectedBid.status === 'approved') && (
                  <button
                    className="bid-btn-accept"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleMessageClicked(selectedBid);
                    }}
                  >
                    <MessageSquare size={16} />
                    Message Manager
                  </button>
                )}
                <button
                  className="bid-btn-decline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
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