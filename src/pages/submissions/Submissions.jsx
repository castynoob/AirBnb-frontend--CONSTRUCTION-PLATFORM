import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin, DollarSign, Calendar, FileText, ChevronDown, Clock, CheckCircle, PlayCircle, MessageCircle, Star, Building2, User } from 'lucide-react';
import Nav from '../../components/Nav'
import '../../styles/manager/submissions.css'

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Mock data generator
  useEffect(() => {
    const mockSubmissions = [
      {
        bid: {
          id: "bid-1",
          job_id: "job-1",
          entrepreneur_id: "ent-1",
          amount: 6500.00,
          message: "I have 10 years of roofing experience and can start immediately.",
          status: "pending",
          created_at: "2025-01-16T10:30:00.000Z",
        },
        job: {
          id: "job-1",
          title: "Roof Repair Needed",
          description: "Replace damaged shingles on building roof",
          category: "Roofing",
          urgency: "Urgent (Current Year)",
          budget_min: 5000.00,
          budget_max: 8000.00,
        },
        property: {
          id: "prop-1",
          address: "123 Maple Street",
          city: "Montreal",
          province: "Quebec",
          building_type: "Apartment",
        },
        entrepreneur: {
          name: "Skyline Roofing Co.",
          rating: 4.7,
          yearsExperience: 10,
        }
      },
      {
        bid: {
          id: "bid-2",
          job_id: "job-2",
          entrepreneur_id: "ent-2",
          amount: 3200.00,
          message: "Experienced plumber ready to start immediately with all necessary equipment.",
          status: "accepted",
          created_at: "2025-01-15T14:20:00.000Z",
        },
        job: {
          id: "job-2",
          title: "Plumbing System Upgrade",
          description: "Update old pipes in basement",
          category: "Plumbing",
          urgency: "Next Year",
          budget_min: 3000.00,
          budget_max: 5000.00,
        },
        property: {
          id: "prop-2",
          address: "456 Oak Avenue",
          city: "Toronto",
          province: "Ontario",
          building_type: "Condo",
        },
        entrepreneur: {
          name: "UrbanBuild Contractors",
          rating: 4.5,
          yearsExperience: 8,
        }
      },
      {
        bid: {
          id: "bid-3",
          job_id: "job-3",
          entrepreneur_id: "ent-3",
          amount: 8900.00,
          message: "Full electrical rewiring with 5-year warranty included.",
          status: "ongoing",
          created_at: "2025-01-14T09:15:00.000Z",
        },
        job: {
          id: "job-3",
          title: "Electrical Rewiring",
          description: "Complete electrical system overhaul",
          category: "Electrical",
          urgency: "Urgent (Current Year)",
          budget_min: 7000.00,
          budget_max: 10000.00,
        },
        property: {
          id: "prop-3",
          address: "789 Pine Road",
          city: "Vancouver",
          province: "British Columbia",
          building_type: "Apartment",
        },
        entrepreneur: {
          name: "Apex Electrical Services",
          rating: 4.9,
          yearsExperience: 15,
        }
      },
      {
        bid: {
          id: "bid-4",
          job_id: "job-4",
          entrepreneur_id: "ent-4",
          amount: 4500.00,
          message: "Professional painting with eco-friendly materials and cleanup.",
          status: "completed",
          created_at: "2025-01-12T11:45:00.000Z",
        },
        job: {
          id: "job-4",
          title: "Interior Painting",
          description: "Paint all common areas and hallways",
          category: "Painting",
          urgency: "Next Year",
          budget_min: 4000.00,
          budget_max: 6000.00,
        },
        property: {
          id: "prop-4",
          address: "321 Birch Lane",
          city: "Montreal",
          province: "Quebec",
          building_type: "Apartment",
        },
        entrepreneur: {
          name: "ColorCraft Painters",
          rating: 4.6,
          yearsExperience: 12,
        }
      },
      {
        bid: {
          id: "bid-5",
          job_id: "job-5",
          entrepreneur_id: "ent-5",
          amount: 12500.00,
          message: "Complete HVAC installation with modern energy-efficient systems.",
          status: "completed",
          created_at: "2025-01-10T08:30:00.000Z",
        },
        job: {
          id: "job-5",
          title: "HVAC System Installation",
          description: "Install new heating and cooling system",
          category: "HVAC",
          urgency: "Urgent (Current Year)",
          budget_min: 10000.00,
          budget_max: 15000.00,
        },
        property: {
          id: "prop-5",
          address: "555 Cedar Drive",
          city: "Calgary",
          province: "Alberta",
          building_type: "Commercial",
        },
        entrepreneur: {
          name: "ClimateControl Solutions",
          rating: 4.8,
          yearsExperience: 18,
        }
      },
      {
        bid: {
          id: "bid-6",
          job_id: "job-6",
          entrepreneur_id: "ent-6",
          amount: 2800.00,
          message: "Window replacement with energy-efficient double-pane glass.",
          status: "pending",
          created_at: "2025-01-11T13:20:00.000Z",
        },
        job: {
          id: "job-6",
          title: "Window Replacement",
          description: "Replace 6 windows in common area",
          category: "Windows",
          urgency: "Next Year",
          budget_min: 2500.00,
          budget_max: 4000.00,
        },
        property: {
          id: "prop-6",
          address: "888 Elm Street",
          city: "Ottawa",
          province: "Ontario",
          building_type: "Condo",
        },
        entrepreneur: {
          name: "ClearView Windows",
          rating: 4.4,
          yearsExperience: 9,
        }
      },
      {
        bid: {
          id: "bid-7",
          job_id: "job-7",
          entrepreneur_id: "ent-7",
          amount: 5600.00,
          message: "Flooring installation with premium materials and quick turnaround.",
          status: "accepted",
          created_at: "2025-01-09T16:45:00.000Z",
        },
        job: {
          id: "job-7",
          title: "Flooring Replacement",
          description: "Replace damaged flooring in lobby",
          category: "Flooring",
          urgency: "Urgent (Current Year)",
          budget_min: 5000.00,
          budget_max: 7000.00,
        },
        property: {
          id: "prop-7",
          address: "222 Willow Way",
          city: "Edmonton",
          province: "Alberta",
          building_type: "Apartment",
        },
        entrepreneur: {
          name: "FloorMasters Inc.",
          rating: 4.7,
          yearsExperience: 11,
        }
      },
    ];

    setTimeout(() => {
      setSubmissions(mockSubmissions);
      setFilteredSubmissions(mockSubmissions);
      setLoading(false);
    }, 500);
  }, []);

  // Apply filters and tabs
  useEffect(() => {
    let filtered = [...submissions];

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(sub => sub.bid.status === activeTab);
    }

    // Search term filter (job title or entrepreneur name)
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.entrepreneur.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(sub =>
        sub.property.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
        sub.property.province.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(sub => sub.job.category === categoryFilter);
    }

    // Amount range filter
    if (amountRange.min) {
      filtered = filtered.filter(sub => sub.bid.amount >= parseFloat(amountRange.min));
    }
    if (amountRange.max) {
      filtered = filtered.filter(sub => sub.bid.amount <= parseFloat(amountRange.max));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(sub => new Date(sub.bid.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(sub => new Date(sub.bid.created_at) <= new Date(dateRange.end));
    }

    setFilteredSubmissions(filtered);
  }, [searchTerm, locationFilter, categoryFilter, amountRange, dateRange, submissions, activeTab]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setCategoryFilter('');
    setAmountRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
  };

  const handleAccept = (bidId) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.bid.id === bidId
          ? { ...sub, bid: { ...sub.bid, status: 'accepted' } }
          : sub
      )
    );
  };

  const handleDecline = (bidId) => {
    // Remove from list or mark as declined
    setSubmissions(prev => prev.filter(sub => sub.bid.id !== bidId));
  };

  const handleChat = (submission) => {
    console.log(`Opening chat with ${submission.entrepreneur.name}`);
    alert(`Chat with ${submission.entrepreneur.name} would open here`);
  };

  const handleReview = (submission) => {
    console.log(`Opening review form for ${submission.entrepreneur.name}`);
    alert(`Review form for ${submission.entrepreneur.name} would open here`);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', icon: Clock, label: 'Pending' },
      accepted: { class: 'status-accepted', icon: CheckCircle, label: 'Accepted' },
      ongoing: { class: 'status-ongoing', icon: PlayCircle, label: 'Ongoing' },
      completed: { class: 'status-completed', icon: CheckCircle, label: 'Completed' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return submissions.length;
    return submissions.filter(sub => sub.bid.status === status).length;
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

  // Get unique categories for filter
  const categories = [...new Set(submissions.map(sub => sub.job.category))];

  const tabs = [
    { id: 'all', label: 'All Submissions' },
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
            <p className="page-subtitle">Review and manage contractor bids</p>
          </div>
          <div className="header-stats">
            <div className="stat-chip">
              <span className="stat-label">Total</span>
              <span className="stat-value">{submissions.length}</span>
            </div>
            <div className="stat-chip stat-pending">
              <span className="stat-label">Pending</span>
              <span className="stat-value">
                {submissions.filter(s => s.bid.status === 'pending').length}
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
              placeholder="Search by job or contractor..."
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
                <label>Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
            </div>
            <button className="clear-all-btn" onClick={clearFilters}>
              <X size={16} />
              Clear All Filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No submissions found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bids-grid">
            {filteredSubmissions.map((submission) => {
              const statusInfo = getStatusInfo(submission.bid.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={submission.bid.id} className="bid-card">
                  <div className="card-header">
                    <div className={`status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </div>
                    <span className="bid-amount">{formatCurrency(submission.bid.amount)}</span>
                  </div>

                  <h3 className="job-title">{submission.job.title}</h3>
                  
                  <div className="contractor-info">
                    <User size={14} />
                    <span className="contractor-name">{submission.entrepreneur.name}</span>
                    <span className="contractor-rating">★ {submission.entrepreneur.rating}</span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <Building2 size={14} />
                      <span>{submission.property.address}</span>
                    </div>
                    <div className="detail-row">
                      <MapPin size={14} />
                      <span>{submission.property.city}, {submission.property.province}</span>
                    </div>
                    <div className="detail-row">
                      <FileText size={14} />
                      <span>{submission.job.category}</span>
                    </div>
                    <div className="detail-row">
                      <Calendar size={14} />
                      <span>{formatDate(submission.bid.created_at)}</span>
                    </div>
                    <div className="detail-row">
                      <DollarSign size={14} />
                      <span>Budget: {formatCurrency(submission.job.budget_min)} - {formatCurrency(submission.job.budget_max)}</span>
                    </div>
                  </div>

                  <div className="bid-message">
                    <strong>Bid Message:</strong>
                    <p>{submission.bid.message}</p>
                  </div>

                  <div className="card-footer">
                    <span className={`urgency ${submission.job.urgency.includes('Urgent') ? 'urgent' : 'normal'}`}>
                      {submission.job.urgency.includes('Urgent') ? 'Urgent' : 'Standard'}
                    </span>
                    <div className="action-buttons">
                      {submission.bid.status === 'pending' && (
                        <>
                          <button 
                            className="accept-btn"
                            onClick={() => handleAccept(submission.bid.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="decline-btn"
                            onClick={() => handleDecline(submission.bid.id)}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {(submission.bid.status === 'accepted' || submission.bid.status === 'ongoing') && (
                        <button 
                          className="chat-btn"
                          onClick={() => handleChat(submission)}
                        >
                          <MessageCircle size={14} />
                          Chat
                        </button>
                      )}
                      {submission.bid.status === 'completed' && (
                        <button 
                          className="review-btn"
                          onClick={() => handleReview(submission)}
                        >
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

export default SubmissionsPage;