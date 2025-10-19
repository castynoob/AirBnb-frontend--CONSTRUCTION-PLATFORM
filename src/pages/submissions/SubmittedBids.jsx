import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin, DollarSign, Calendar, FileText, ChevronDown, Clock, CheckCircle, PlayCircle, AlertCircle, MessageCircle, Star } from 'lucide-react';
import Nav from '../../components/Nav'
import '../../styles/entrepreneur/submittedbids.css'

function SubmittedBids() {
  const [bids, setBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Mock data generator
  useEffect(() => {
    const mockBids = [
      {
        id: "1",
        job_id: "job-1",
        amount: 6500.00,
        message: "I have 10 years of roofing experience...",
        status: "pending",
        created_at: "2025-01-16T10:30:00.000Z",
        job: {
          title: "Roof Repair Needed",
          category: "Roofing",
          urgency: "Urgent (Current Year)",
          budget_min: 5000.00,
          budget_max: 8000.00,
        },
        property: {
          address: "123 Maple Street",
          city: "Montreal",
          province: "Quebec",
        }
      },
      {
        id: "2",
        job_id: "job-2",
        amount: 3200.00,
        message: "Experienced plumber ready to start immediately",
        status: "accepted",
        created_at: "2025-01-15T14:20:00.000Z",
        job: {
          title: "Plumbing System Upgrade",
          category: "Plumbing",
          urgency: "Next Year",
          budget_min: 3000.00,
          budget_max: 5000.00,
        },
        property: {
          address: "456 Oak Avenue",
          city: "Toronto",
          province: "Ontario",
        }
      },
      {
        id: "3",
        job_id: "job-3",
        amount: 8900.00,
        message: "Full electrical rewiring with 5-year warranty",
        status: "declined",
        created_at: "2025-01-14T09:15:00.000Z",
        job: {
          title: "Electrical Rewiring",
          category: "Electrical",
          urgency: "Urgent (Current Year)",
          budget_min: 7000.00,
          budget_max: 10000.00,
        },
        property: {
          address: "789 Pine Road",
          city: "Vancouver",
          province: "British Columbia",
        }
      },
      {
        id: "4",
        job_id: "job-4",
        amount: 4500.00,
        message: "Professional painting with eco-friendly materials",
        status: "ongoing",
        created_at: "2025-01-12T11:45:00.000Z",
        job: {
          title: "Interior Painting",
          category: "Painting",
          urgency: "Next Year",
          budget_min: 4000.00,
          budget_max: 6000.00,
        },
        property: {
          address: "321 Birch Lane",
          city: "Montreal",
          province: "Quebec",
        }
      },
      {
        id: "5",
        job_id: "job-5",
        amount: 12500.00,
        message: "HVAC installation completed successfully",
        status: "completed",
        created_at: "2025-01-10T08:30:00.000Z",
        job: {
          title: "HVAC System Installation",
          category: "HVAC",
          urgency: "Urgent (Current Year)",
          budget_min: 10000.00,
          budget_max: 15000.00,
        },
        property: {
          address: "555 Cedar Drive",
          city: "Calgary",
          province: "Alberta",
        }
      },
      {
        id: "6",
        job_id: "job-6",
        amount: 2800.00,
        message: "Window replacement with energy-efficient glass",
        status: "pending",
        created_at: "2025-01-11T13:20:00.000Z",
        job: {
          title: "Window Replacement",
          category: "Windows",
          urgency: "Next Year",
          budget_min: 2500.00,
          budget_max: 4000.00,
        },
        property: {
          address: "888 Elm Street",
          city: "Ottawa",
          province: "Ontario",
        }
      },
    ];

    setTimeout(() => {
      setBids(mockBids);
      setFilteredBids(mockBids);
      setLoading(false);
    }, 500);
  }, []);

  // Apply filters and tabs
  useEffect(() => {
    let filtered = [...bids];

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(bid => bid.status === activeTab);
    }

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(bid =>
        bid.job.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(bid =>
        bid.property.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
        bid.property.province.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Amount range filter
    if (amountRange.min) {
      filtered = filtered.filter(bid => bid.amount >= parseFloat(amountRange.min));
    }
    if (amountRange.max) {
      filtered = filtered.filter(bid => bid.amount <= parseFloat(amountRange.max));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(bid => new Date(bid.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(bid => new Date(bid.created_at) <= new Date(dateRange.end));
    }

    setFilteredBids(filtered);
  }, [searchTerm, locationFilter, amountRange, dateRange, bids, activeTab]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setAmountRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', icon: Clock, label: 'Pending' },
      accepted: { class: 'status-accepted', icon: CheckCircle, label: 'Accepted' },
      ongoing: { class: 'status-ongoing', icon: PlayCircle, label: 'Ongoing' },
      completed: { class: 'status-completed', icon: CheckCircle, label: 'Completed' },
      declined: { class: 'status-declined', icon: AlertCircle, label: 'Declined' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return bids.length;
    return bids.filter(bid => bid.status === status).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const tabs = [
    { id: 'all', label: 'All Bids' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="submissions-container">
      <Nav />
      <div className="submissions-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Bid Submissions</h1>
            <p className="page-subtitle">Track and manage your bids</p>
          </div>
          <div className="header-stats">
            <div className="stat-chip">
              <span className="stat-label">Total</span>
              <span className="stat-value">{bids.length}</span>
            </div>
            <div className="stat-chip stat-active">
              <span className="stat-label">Active</span>
              <span className="stat-value">
                {bids.filter(b => ['pending', 'accepted', 'ongoing'].includes(b.status)).length}
              </span>
            </div>
          </div>
        </div>

        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="tab-count">{getStatusCount(tab.id)}</span>
            </button>
          ))}
        </div>

        <div className="controls-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="City or Province"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Min Amount</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <label>Max Amount</label>
                <input
                  type="number"
                  placeholder="$999,999"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <button className="clear-all-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading submissions...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No bids found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bids-grid">
            {filteredBids.map((bid) => {
              const statusInfo = getStatusInfo(bid.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={bid.id} className="bid-card">
                  <div className="card-header">
                    <div className={`status-badge-bids ${statusInfo.class}`}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </div>
                    <span className="bid-amount">{formatCurrency(bid.amount)}</span>
                  </div>

                  <h3 className="job-title">{bid.job.title}</h3>
                  
                  <div className="card-details">
                    <div className="detail-row">
                      <MapPin size={14} />
                      <span>{bid.property.city}, {bid.property.province}</span>
                    </div>
                    <div className="detail-row">
                      <FileText size={14} />
                      <span>{bid.job.category}</span>
                    </div>
                    <div className="detail-row">
                      <Calendar size={14} />
                      <span>{formatDate(bid.created_at)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <span className={`urgency ${bid.job.urgency.includes('Urgent') ? 'urgent' : 'normal'}`}>
                      {bid.job.urgency.includes('Urgent') ? 'Urgent' : 'Standard'}
                    </span>
                    <div className="action-buttons">
                      {(bid.status === 'accepted' || bid.status === 'ongoing') && (
                        <button className="chat-btn">
                          <MessageCircle size={14} />
                          Chat
                        </button>
                      )}
                      {bid.status === 'completed' && (
                        <button className="review-btn">
                          <Star size={14} />
                          Review
                        </button>
                      )}
                      <button className="details-btn">View</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmittedBids;