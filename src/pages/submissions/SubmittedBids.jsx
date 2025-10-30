import React, { useEffect, useState } from 'react';
import Nav from '../../components/Nav';
import '../../styles/entrepreneur/submittedbids.css'
import { Search, Calendar, DollarSign, Clock, Eye, MessageSquare, MoreVertical, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubmittedBids = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [bids, setBids] = useState({ all: [], pending: [], accepted: [], declined: [] });
  const [summary, setSummary] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
        const acceptedBids = allBids.filter(bid => bid.status?.toLowerCase() === 'accepted');
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

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'accepted':
        return <CheckCircle size={18} />;
      case 'declined':
        return <XCircle size={18} />;
      case 'pending':
        return <AlertCircle size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'accepted':
        return 'eb-status-accepted';
      case 'declined':
        return 'eb-status-declined';
      case 'pending':
        return 'eb-status-pending';
      default:
        return '';
    }
  };

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

  const handleMessageClicked = async (bid) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const userProfile = localStorage.getItem('userProfile')

    if(userProfile) {
      const user = JSON.parse(userProfile)
      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/${bid.job_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if(!jobResponse.ok) {
        throw new Error('Error', jobResponse.status)
      }

      const data = await jobResponse.json()
      const manageId = data.manager_id;
      localStorage.setItem("targetReceiverId", manageId);
      localStorage.setItem("targetReceiverName", "THIS IS NAME");
      if (data.id) localStorage.setItem("targetJobId", data.id);
      navigate('/messages/entrepreneur')
    }
  }

  if (loading) {
    return (
      <div className="eb-page-container">
        <Nav />
        <main className="eb-main-content">
          <div className="eb-loading-state">
            <div className="eb-loader"></div>
            <p>Loading your bids...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eb-page-container">
        <Nav />
        <main className="eb-main-content">
          <div className="eb-error-state">
            <XCircle size={48} />
            <h3>Error Loading Bids</h3>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="eb-page-container">
      <Nav />
      
      <main className="eb-main-content">
        <div className="eb-page-header">
          <div className="eb-header-content">
            <h1 className="eb-page-title">Submitted Bids</h1>
            <p className="eb-page-subtitle">Track and manage all your project proposals</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="eb-tabs-container">
          <div className="eb-tabs">
            <button
              className={`eb-tab ${activeTab === 'all' ? 'eb-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="eb-tab-label">All Bids</span>
              <span className="eb-tab-count">{summary.total}</span>
            </button>
            <button
              className={`eb-tab ${activeTab === 'pending' ? 'eb-active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span className="eb-tab-label">Pending</span>
              <span className="eb-tab-count">{summary.pending}</span>
            </button>
            <button
              className={`eb-tab ${activeTab === 'accepted' ? 'eb-active' : ''}`}
              onClick={() => setActiveTab('accepted')}
            >
              <span className="eb-tab-label">Accepted</span>
              <span className="eb-tab-count">{summary.accepted}</span>
            </button>
            <button
              className={`eb-tab ${activeTab === 'declined' ? 'eb-active' : ''}`}
              onClick={() => setActiveTab('declined')}
            >
              <span className="eb-tab-label">Declined</span>
              <span className="eb-tab-count">{summary.declined}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="eb-search-container">
            <Search className="eb-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by job title, category, or location..."
              className="eb-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bids List */}
        <div className="eb-bids-container">
          {filteredBids.length === 0 ? (
            <div className="eb-empty-state">
              <div className="eb-empty-icon">
                <MessageSquare size={48} />
              </div>
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
            filteredBids.map(bid => (
              <div key={bid.id} className="eb-bid-card">
                <div className="eb-bid-header">
                  <div className="eb-bid-title-section">
                    <h3 className="eb-bid-title">{bid.job_title}</h3>
                    <span className="eb-bid-category">{bid.category}</span>
                  </div>
                  <div className={`eb-bid-status ${getStatusClass(bid.status)}`}>
                    {getStatusIcon(bid.status)}
                    <span>{getStatusLabel(bid.status)}</span>
                  </div>
                </div>

                <p className="eb-bid-description">{bid.job_description}</p>

                {/* Location */}
                {(bid.property_address || bid.city) && (
                  <div className="eb-bid-location">
                    <MapPin size={16} />
                    <span>{bid.property_address}{bid.city ? `, ${bid.city}` : ''}</span>
                  </div>
                )}

                {/* Urgency Badge */}
                {bid.urgency && (
                  <div className={`eb-urgency-badge ${bid.urgency.includes('Urgent') ? 'eb-urgent' : 'eb-normal'}`}>
                    {bid.urgency}
                  </div>
                )}

                <div className="eb-bid-details">
                  <div className="eb-detail-item">
                    <DollarSign size={16} />
                    <span className="eb-detail-label">Your Bid:</span>
                    <span className="eb-detail-value">{formatCurrency(bid.amount)}</span>
                  </div>

                  <div className="eb-detail-item">
                    <Calendar size={16} />
                    <span className="eb-detail-label">Submitted:</span>
                    <span className="eb-detail-value">{formatDate(bid.created_at)}</span>
                  </div>

                  {bid.due_date && (
                    <div className="eb-detail-item">
                      <Clock size={16} />
                      <span className="eb-detail-label">Due Date:</span>
                      <span className="eb-detail-value">{formatDate(bid.due_date)}</span>
                    </div>
                  )}
                </div>

                {/* Bid Message Preview */}
                {bid.message && (
                  <div className="eb-bid-message">
                    <p className="eb-message-label">Your Proposal:</p>
                    <p className="eb-message-text">{bid.message}</p>
                  </div>
                )}

                <div className="eb-bid-footer">
                  <span className="eb-response-time">{getTimeAgo(bid.created_at)}</span>
                  <div className="eb-bid-actions">
                    <button className="eb-btn-secondary eb-btn-small">
                      <Eye size={16} />
                      View Details
                    </button>
                    {
                      bid.status == 'accepted' &&
                    <>
                    <button className="eb-btn-icon" onClick={() => handleMessageClicked(bid)}>
                      <MessageSquare size={16} />
                    </button>
                    </>
                    }
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmittedBids;