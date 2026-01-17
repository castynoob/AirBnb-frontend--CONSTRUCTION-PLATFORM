import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Flag,
  X,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  MessageSquare,
  Star,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  TrendingUp,
  Award,
  Hash,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-bids.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  const classes = {
    pending: "admin-badge-warning",
    approved: "admin-badge-success",
    declined: "admin-badge-danger",
    accepted: "admin-badge-success",
  };
  return classes[status] || "admin-badge-secondary";
};

function Bids() {
  const { getToken, isModeratorOrHigher } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    isFlagged: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Bid detail modal
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action modals
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // User detail modal (for entrepreneur or manager)
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userType, setUserType] = useState("");

  const fetchBids = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.minAmount) params.append("minAmount", filters.minAmount);
      if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
      if (filters.isFlagged) params.append("isFlagged", filters.isFlagged);

      const res = await fetch(`${API_URL}/api/admin/bids?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch bids");
      }

      const data = await res.json();
      setBids(data.bids || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Bids fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  const fetchStats = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/bids/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const fetchBidDetails = async (bidId) => {
    setLoadingDetails(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/bids/${bidId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedBid(data.bid);
        setAdminNotes(data.bid.admin_notes || "");
      }
    } catch (err) {
      console.error("Bid details fetch error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewBid = async (bid) => {
    setSelectedBid(bid);
    setShowBidModal(true);
    setActiveTab("details");
    await fetchBidDetails(bid.id);
  };

  const handleFlagBid = async () => {
    if (!actionReason.trim()) return;

    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/bids/${selectedBid.id}/flag`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: actionReason }),
      });

      if (res.ok) {
        setBids((prev) =>
          prev.map((b) =>
            b.id === selectedBid.id ? { ...b, is_flagged: true, flag_reason: actionReason } : b
          )
        );
        setSelectedBid((prev) => ({ ...prev, is_flagged: true, flag_reason: actionReason }));
        setShowFlagModal(false);
        setActionReason("");
        fetchStats();
      }
    } catch (err) {
      console.error("Flag bid error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnflagBid = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/bids/${selectedBid.id}/unflag`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBids((prev) =>
          prev.map((b) =>
            b.id === selectedBid.id ? { ...b, is_flagged: false, flag_reason: null } : b
          )
        );
        setSelectedBid((prev) => ({ ...prev, is_flagged: false, flag_reason: null }));
        fetchStats();
      }
    } catch (err) {
      console.error("Unflag bid error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/bids/${selectedBid.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: adminNotes }),
      });

      if (res.ok) {
        setSelectedBid((prev) => ({ ...prev, admin_notes: adminNotes }));
        setShowNotesModal(false);
      }
    } catch (err) {
      console.error("Save notes error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = async (userId, type) => {
    if (!userId) return;

    setLoadingUser(true);
    setShowUserModal(true);
    setUserType(type);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserDetails(data.user);
      }
    } catch (err) {
      console.error("User details fetch error:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBids();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", minAmount: "", maxAmount: "", isFlagged: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasActiveFilters = filters.status || filters.minAmount || filters.maxAmount || filters.isFlagged;

  if (!isModeratorOrHigher()) {
    return (
      <div className="admin-bids-error">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage bids.</p>
      </div>
    );
  }

  return (
    <div className="admin-bids">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bids Management</h1>
          <p className="admin-page-subtitle">
            View and manage all bids submitted on the platform
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={() => { fetchBids(); fetchStats(); }}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-bids-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-primary">
              <DollarSign size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseInt(stats.total_bids).toLocaleString()}</div>
              <div className="admin-stat-label">Total Bids</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-warning">
              <Clock size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseInt(stats.pending_bids).toLocaleString()}</div>
              <div className="admin-stat-label">Pending Bids</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-success">
              <TrendingUp size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{formatCurrency(stats.average_bid_amount)}</div>
              <div className="admin-stat-label">Avg Bid Amount</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-info">
              <Award size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseFloat(stats.acceptance_rate).toFixed(1)}%</div>
              <div className="admin-stat-label">Acceptance Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-bids-toolbar">
        <form onSubmit={handleSearch} className="admin-bids-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by job title, entrepreneur, or company..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>
        </form>

        <button
          className={`admin-btn ${hasActiveFilters ? "admin-btn-primary" : "admin-btn-secondary"}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters{" "}
          {hasActiveFilters &&
            `(${[filters.status, filters.minAmount, filters.maxAmount, filters.isFlagged].filter(Boolean).length})`}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="admin-bids-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Status</label>
            <select
              className="admin-input"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Min Amount</label>
            <input
              type="number"
              className="admin-input"
              placeholder="Min $"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Max Amount</label>
            <input
              type="number"
              className="admin-input"
              placeholder="Max $"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Flagged</label>
            <select
              className="admin-input"
              value={filters.isFlagged}
              onChange={(e) => handleFilterChange("isFlagged", e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Flagged Only</option>
              <option value="false">Not Flagged</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="admin-btn admin-btn-ghost" onClick={clearFilters}>
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="admin-bids-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchBids}>Retry</button>
        </div>
      )}

      {/* Bids Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Entrepreneur</th>
                <th>Property Manager</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-loading">
                      <div className="admin-spinner" />
                      <span>Loading bids...</span>
                    </div>
                  </td>
                </tr>
              ) : bids.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-empty">
                      <DollarSign size={48} />
                      <p>No bids found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bids.map((bid) => (
                  <tr key={bid.id} className={bid.is_flagged ? "flagged-row" : ""}>
                    <td>
                      <div className="admin-bid-job-cell">
                        {bid.is_flagged && (
                          <Flag size={14} className="admin-flag-icon" />
                        )}
                        <div className="admin-bid-job-info">
                          <div className="admin-bid-job-title">{bid.job_title}</div>
                          <div className="admin-bid-job-category">{bid.job_category}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-entrepreneur-cell">
                        <div className="admin-entrepreneur-name">
                          {bid.entrepreneur_first_name} {bid.entrepreneur_last_name}
                        </div>
                        <div className="admin-entrepreneur-company">
                          {bid.entrepreneur_company || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-manager-cell">
                        <div className="admin-manager-name">
                          {bid.manager_first_name} {bid.manager_last_name}
                        </div>
                        <div className="admin-manager-company">
                          {bid.manager_company || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-bid-amount-cell">
                        {formatCurrency(bid.amount)}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusBadgeClass(bid.status)}`}>
                        {bid.status}
                      </span>
                    </td>
                    <td>{formatDate(bid.created_at)}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => handleViewBid(bid)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!bid.is_flagged && (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-warning-text"
                            onClick={() => {
                              setSelectedBid(bid);
                              setShowFlagModal(true);
                            }}
                            title="Flag Bid"
                          >
                            <Flag size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="admin-table-pagination">
            <div className="admin-pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} bids
            </div>
            <div className="admin-pagination-controls">
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="admin-pagination-pages">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bid Detail Modal */}
      {showBidModal && selectedBid && (
        <div className="admin-modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="admin-bid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Bid Details</h2>
              <button className="admin-modal-close" onClick={() => setShowBidModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="admin-modal-tabs">
              <button
                className={`admin-modal-tab ${activeTab === "details" ? "active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                <FileText size={16} />
                Details
              </button>
              <button
                className={`admin-modal-tab ${activeTab === "job" ? "active" : ""}`}
                onClick={() => setActiveTab("job")}
              >
                <Briefcase size={16} />
                Job Info
              </button>
              <button
                className={`admin-modal-tab ${activeTab === "moderation" ? "active" : ""}`}
                onClick={() => setActiveTab("moderation")}
              >
                <AlertTriangle size={16} />
                Moderation
              </button>
            </div>

            <div className="admin-modal-body">
              {loadingDetails ? (
                <div className="admin-modal-loading">
                  <div className="admin-spinner" />
                  <span>Loading details...</span>
                </div>
              ) : (
                <>
                  {activeTab === "details" && (
                    <div className="admin-bid-details">
                      {/* Bid Header */}
                      <div className="admin-bid-detail-header">
                        <div className="admin-bid-amount-display">
                          <DollarSign size={32} />
                          <span className="admin-bid-amount-value">
                            {formatCurrency(selectedBid.amount)}
                          </span>
                        </div>
                        <div className="admin-bid-badges">
                          <span className={`admin-badge ${getStatusBadgeClass(selectedBid.status)}`}>
                            {selectedBid.status}
                          </span>
                          {selectedBid.is_flagged && (
                            <span className="admin-badge admin-badge-warning">
                              <Flag size={12} /> Flagged
                            </span>
                          )}
                          {selectedBid.budget_unlocked_at && (
                            <span className="admin-badge admin-badge-success">
                              <CheckCircle size={12} /> Budget Unlocked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bid Message */}
                      {selectedBid.message && (
                        <div className="admin-bid-section">
                          <h4>Proposal Message</h4>
                          <div className="admin-bid-message-box">
                            <MessageSquare size={16} />
                            <p>{selectedBid.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Bid Info Grid */}
                      <div className="admin-bid-info-grid">
                        <div className="admin-bid-info-item">
                          <Hash size={16} />
                          <div>
                            <label>Bid ID</label>
                            <span className="admin-item-id">{selectedBid.id}</span>
                          </div>
                        </div>
                        <div className="admin-bid-info-item">
                          <Calendar size={16} />
                          <div>
                            <label>Submitted</label>
                            <span>{formatDateTime(selectedBid.created_at)}</span>
                          </div>
                        </div>
                        <div className="admin-bid-info-item">
                          <Clock size={16} />
                          <div>
                            <label>Last Updated</label>
                            <span>{formatDateTime(selectedBid.updated_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Entrepreneur Info */}
                      <div className="admin-bid-section">
                        <h4>Entrepreneur</h4>
                        <div
                          className="admin-user-card clickable"
                          onClick={() => handleViewUser(selectedBid.entrepreneur_user_id, "Entrepreneur")}
                        >
                          <div className="admin-user-card-avatar">
                            {selectedBid.entrepreneur_first_name?.[0]}
                            {selectedBid.entrepreneur_last_name?.[0]}
                          </div>
                          <div className="admin-user-card-info">
                            <div className="admin-user-card-name">
                              {selectedBid.entrepreneur_first_name} {selectedBid.entrepreneur_last_name}
                            </div>
                            <div className="admin-user-card-company">
                              {selectedBid.entrepreneur_company || "N/A"}
                            </div>
                            <div className="admin-user-card-meta">
                              {selectedBid.average_rating && (
                                <span className="admin-user-rating">
                                  <Star size={12} /> {selectedBid.average_rating}
                                </span>
                              )}
                              {selectedBid.license_number && (
                                <span className="admin-user-license">
                                  License: {selectedBid.license_number}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="admin-user-card-action">
                            <ExternalLink size={16} />
                            <span>View Profile</span>
                          </div>
                        </div>
                      </div>

                      {/* Property Manager Info */}
                      <div className="admin-bid-section">
                        <h4>Property Manager</h4>
                        <div
                          className="admin-user-card clickable"
                          onClick={() => handleViewUser(selectedBid.manager_user_id, "Property Manager")}
                        >
                          <div className="admin-user-card-avatar">
                            {selectedBid.manager_first_name?.[0]}
                            {selectedBid.manager_last_name?.[0]}
                          </div>
                          <div className="admin-user-card-info">
                            <div className="admin-user-card-name">
                              {selectedBid.manager_first_name} {selectedBid.manager_last_name}
                            </div>
                            <div className="admin-user-card-company">
                              {selectedBid.manager_company || "N/A"}
                            </div>
                          </div>
                          <div className="admin-user-card-action">
                            <ExternalLink size={16} />
                            <span>View Profile</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "job" && (
                    <div className="admin-bid-job-details">
                      {/* Job Header */}
                      <div className="admin-job-detail-header">
                        <h3>{selectedBid.job_title}</h3>
                        <div className="admin-job-badges">
                          <span className={`admin-badge ${getStatusBadgeClass(selectedBid.job_status)}`}>
                            {selectedBid.job_status}
                          </span>
                          <span className="admin-badge admin-badge-secondary">
                            {selectedBid.job_category}
                          </span>
                        </div>
                      </div>

                      {/* Job Description */}
                      {selectedBid.job_description && (
                        <div className="admin-bid-section">
                          <h4>Description</h4>
                          <p className="admin-job-description">{selectedBid.job_description}</p>
                        </div>
                      )}

                      {/* Job Info Grid */}
                      <div className="admin-bid-info-grid">
                        <div className="admin-bid-info-item">
                          <DollarSign size={16} />
                          <div>
                            <label>Budget Range</label>
                            <span>
                              {formatCurrency(selectedBid.budget_min)} - {formatCurrency(selectedBid.budget_max)}
                            </span>
                          </div>
                        </div>
                        <div className="admin-bid-info-item">
                          <Briefcase size={16} />
                          <div>
                            <label>Category</label>
                            <span>{selectedBid.job_category}</span>
                          </div>
                        </div>
                        <div className="admin-bid-info-item">
                          <Calendar size={16} />
                          <div>
                            <label>Due Date</label>
                            <span>{formatDate(selectedBid.job_due_date)}</span>
                          </div>
                        </div>
                        <div className="admin-bid-info-item">
                          <Calendar size={16} />
                          <div>
                            <label>Job Posted</label>
                            <span>{formatDateTime(selectedBid.job_created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Property Info */}
                      {(selectedBid.property_address || selectedBid.property_city) && (
                        <div className="admin-bid-section">
                          <h4>Property Location</h4>
                          <div className="admin-bid-info-item">
                            <Building2 size={16} />
                            <div>
                              <span>
                                {selectedBid.property_address}
                                {selectedBid.property_city && `, ${selectedBid.property_city}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "moderation" && (
                    <div className="admin-bid-moderation">
                      {/* Flag Status */}
                      <div className="admin-moderation-section">
                        <h4>Flag Status</h4>
                        {selectedBid.is_flagged ? (
                          <div className="admin-flag-status flagged">
                            <div className="admin-flag-info">
                              <Flag size={20} />
                              <div>
                                <strong>This bid is flagged</strong>
                                <p>{selectedBid.flag_reason}</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-secondary"
                              onClick={handleUnflagBid}
                              disabled={actionLoading}
                            >
                              Remove Flag
                            </button>
                          </div>
                        ) : (
                          <div className="admin-flag-status">
                            <div className="admin-flag-info">
                              <CheckCircle size={20} />
                              <div>
                                <strong>This bid is not flagged</strong>
                                <p>No issues reported</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-warning"
                              onClick={() => setShowFlagModal(true)}
                            >
                              <Flag size={16} />
                              Flag Bid
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      <div className="admin-moderation-section">
                        <h4>Admin Notes</h4>
                        <div className="admin-notes-container">
                          <p className="admin-notes-content">
                            {selectedBid.admin_notes || "No admin notes added."}
                          </p>
                          <button
                            className="admin-btn admin-btn-secondary"
                            onClick={() => setShowNotesModal(true)}
                          >
                            Edit Notes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="admin-modal-overlay" onClick={() => setShowFlagModal(false)}>
          <div className="admin-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Flag Bid</h2>
              <button className="admin-modal-close" onClick={() => setShowFlagModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Flagging this bid will mark it for review. Please provide a reason:</p>
              <textarea
                className="admin-textarea"
                placeholder="Enter reason for flagging (e.g., suspicious bidding pattern, unrealistic amount)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowFlagModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-warning"
                onClick={handleFlagBid}
                disabled={!actionReason.trim() || actionLoading}
              >
                {actionLoading ? "Flagging..." : "Flag Bid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="admin-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit Admin Notes</h2>
              <button className="admin-modal-close" onClick={() => setShowNotesModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <textarea
                className="admin-textarea"
                placeholder="Enter admin notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={6}
              />
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowNotesModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSaveNotes}
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && (
        <div className="admin-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{userType} Details</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {loadingUser ? (
                <div className="admin-modal-loading">
                  <div className="admin-spinner" />
                  <span>Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="admin-user-details">
                  {/* User Header */}
                  <div className="admin-user-detail-header">
                    <div className="admin-user-avatar-lg">
                      {userDetails.first_name?.[0]}
                      {userDetails.last_name?.[0]}
                    </div>
                    <div className="admin-user-header-info">
                      <h3>
                        {userDetails.first_name} {userDetails.last_name}
                      </h3>
                      <span className="admin-badge admin-badge-primary">{userType}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="admin-user-section">
                    <h4>Contact Information</h4>
                    <div className="admin-user-info-grid">
                      <div className="admin-user-info-item">
                        <Mail size={16} />
                        <div>
                          <label>Email</label>
                          <span>{userDetails.email}</span>
                        </div>
                      </div>
                      {userDetails.phone && (
                        <div className="admin-user-info-item">
                          <Phone size={16} />
                          <div>
                            <label>Phone</label>
                            <span>{userDetails.phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="admin-user-section">
                    <h4>Company Information</h4>
                    <div className="admin-user-info-grid">
                      <div className="admin-user-info-item">
                        <Building2 size={16} />
                        <div>
                          <label>Company Name</label>
                          <span>
                            {userDetails.entrepreneur_company ||
                              userDetails.manager_company ||
                              userDetails.supplier_company ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                      {userDetails.license_number && (
                        <div className="admin-user-info-item">
                          <Award size={16} />
                          <div>
                            <label>License Number</label>
                            <span>{userDetails.license_number}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="admin-user-section">
                    <h4>Account Information</h4>
                    <div className="admin-user-info-grid">
                      <div className="admin-user-info-item">
                        <Calendar size={16} />
                        <div>
                          <label>Joined</label>
                          <span>{formatDateTime(userDetails.created_at)}</span>
                        </div>
                      </div>
                      <div className="admin-user-info-item">
                        <Clock size={16} />
                        <div>
                          <label>Last Login</label>
                          <span>
                            {userDetails.last_login
                              ? formatDateTime(userDetails.last_login)
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="admin-user-info-item">
                        {userDetails.email_verified ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <AlertCircle size={16} className="text-warning" />
                        )}
                        <div>
                          <label>Email Status</label>
                          <span>
                            {userDetails.email_verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-modal-error">
                  <AlertCircle size={48} />
                  <p>Failed to load user details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bids;
