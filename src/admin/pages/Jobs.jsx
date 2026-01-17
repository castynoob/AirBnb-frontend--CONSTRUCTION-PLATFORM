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
  MapPin,
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
  Hash,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-jobs.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  const classes = {
    Open: "admin-badge-success",
    ongoing: "admin-badge-primary",
    "In Progress": "admin-badge-primary",
    accepted: "admin-badge-info",
    Completed: "admin-badge-secondary",
    Closed: "admin-badge-secondary",
    Cancelled: "admin-badge-danger",
  };
  return classes[status] || "admin-badge-secondary";
};

// Urgency badge colors
const getUrgencyBadgeClass = (urgency) => {
  const classes = {
    "Urgent (Current Year)": "admin-badge-danger",
    "Next Year": "admin-badge-warning",
    "Year After": "admin-badge-info",
  };
  return classes[urgency] || "admin-badge-secondary";
};

function Jobs() {
  const { getToken, isModeratorOrHigher, isAdminOrHigher } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    urgency: "",
    isFlagged: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Job detail modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobBids, setJobBids] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action modals
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Manager detail modal
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerDetails, setManagerDetails] = useState(null);
  const [loadingManager, setLoadingManager] = useState(false);

  const fetchJobs = useCallback(async () => {
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
      if (filters.category) params.append("category", filters.category);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.isFlagged) params.append("isFlagged", filters.isFlagged);

      const res = await fetch(`${API_URL}/api/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Jobs fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  const fetchCategories = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  const fetchJobDetails = async (jobId) => {
    setLoadingDetails(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data.job);
        setJobBids(data.bids || []);
        setAdminNotes(data.job.admin_notes || "");
      }
    } catch (err) {
      console.error("Job details fetch error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewJob = async (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
    setActiveTab("details");
    await fetchJobDetails(job.id);
  };

  const handleFlagJob = async () => {
    if (!actionReason.trim()) return;

    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${selectedJob.id}/flag`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: actionReason }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === selectedJob.id ? { ...j, is_flagged: true, flag_reason: actionReason } : j
          )
        );
        setSelectedJob((prev) => ({ ...prev, is_flagged: true, flag_reason: actionReason }));
        setShowFlagModal(false);
        setActionReason("");
      }
    } catch (err) {
      console.error("Flag job error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnflagJob = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${selectedJob.id}/unflag`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === selectedJob.id ? { ...j, is_flagged: false, flag_reason: null } : j
          )
        );
        setSelectedJob((prev) => ({ ...prev, is_flagged: false, flag_reason: null }));
      }
    } catch (err) {
      console.error("Unflag job error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceClose = async () => {
    if (!actionReason.trim()) return;

    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${selectedJob.id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: actionReason }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === selectedJob.id ? { ...j, status: "Closed" } : j))
        );
        setSelectedJob((prev) => ({ ...prev, status: "Closed" }));
        setShowCloseModal(false);
        setActionReason("");
      }
    } catch (err) {
      console.error("Force close error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${selectedJob.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: adminNotes }),
      });

      if (res.ok) {
        setSelectedJob((prev) => ({ ...prev, admin_notes: adminNotes }));
        setShowNotesModal(false);
      }
    } catch (err) {
      console.error("Save notes error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewManager = async (managerId) => {
    if (!managerId) return;

    setLoadingManager(true);
    setShowManagerModal(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setManagerDetails(data.user);
      }
    } catch (err) {
      console.error("Manager details fetch error:", err);
    } finally {
      setLoadingManager(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchJobs();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", category: "", urgency: "", isFlagged: "" });
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

  const hasActiveFilters = filters.status || filters.category || filters.urgency || filters.isFlagged;

  if (!isModeratorOrHigher()) {
    return (
      <div className="admin-jobs-error">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage jobs.</p>
      </div>
    );
  }

  return (
    <div className="admin-jobs">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Jobs Management</h1>
          <p className="admin-page-subtitle">
            View and manage all jobs posted on the platform
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchJobs}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-jobs-toolbar">
        <form onSubmit={handleSearch} className="admin-jobs-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by title or description..."
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
            `(${
              [filters.status, filters.category, filters.urgency, filters.isFlagged].filter(Boolean)
                .length
            })`}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="admin-jobs-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Status</label>
            <select
              className="admin-input"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="accepted">Accepted</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Category</label>
            <select
              className="admin-input"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Urgency</label>
            <select
              className="admin-input"
              value={filters.urgency}
              onChange={(e) => handleFilterChange("urgency", e.target.value)}
            >
              <option value="">All Urgencies</option>
              <option value="Urgent (Current Year)">Urgent (Current Year)</option>
              <option value="Next Year">Next Year</option>
              <option value="Year After">Year After</option>
            </select>
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
        <div className="admin-jobs-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchJobs}>Retry</button>
        </div>
      )}

      {/* Jobs Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Property Manager</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Bids</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-loading">
                      <div className="admin-spinner" />
                      <span>Loading jobs...</span>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-empty">
                      <Briefcase size={48} />
                      <p>No jobs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className={job.is_flagged ? "flagged-row" : ""}>
                    <td>
                      <div className="admin-job-cell">
                        {job.is_flagged && (
                          <Flag size={14} className="admin-flag-icon" />
                        )}
                        <div className="admin-job-info">
                          <div className="admin-job-title">{job.title}</div>
                          <div className="admin-job-location">
                            {job.property_city || "No location"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-manager-cell">
                        <div className="admin-manager-name">
                          {job.manager_first_name} {job.manager_last_name}
                        </div>
                        <div className="admin-manager-company">
                          {job.manager_company || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-secondary">{job.category}</span>
                    </td>
                    <td>
                      <div className="admin-budget-cell">
                        {job.is_budget_hidden ? (
                          <span className="admin-budget-hidden">Hidden</span>
                        ) : (
                          <span>
                            {formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-bid-count">{job.bid_count || 0}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusBadgeClass(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{formatDate(job.created_at)}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => handleViewJob(job)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!job.is_flagged && (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-warning-text"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowFlagModal(true);
                            }}
                            title="Flag Job"
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
              {pagination.total} jobs
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

      {/* Job Detail Modal */}
      {showJobModal && selectedJob && (
        <div className="admin-modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="admin-job-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Job Details</h2>
              <button className="admin-modal-close" onClick={() => setShowJobModal(false)}>
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
                className={`admin-modal-tab ${activeTab === "bids" ? "active" : ""}`}
                onClick={() => setActiveTab("bids")}
              >
                <DollarSign size={16} />
                Bids ({jobBids.length})
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
                    <div className="admin-job-details">
                      {/* Job Header */}
                      <div className="admin-job-detail-header">
                        <div className="admin-job-header-info">
                          <h3>{selectedJob.title}</h3>
                          <div className="admin-job-badges">
                            <span className={`admin-badge ${getStatusBadgeClass(selectedJob.status)}`}>
                              {selectedJob.status}
                            </span>
                            <span className={`admin-badge ${getUrgencyBadgeClass(selectedJob.urgency)}`}>
                              {selectedJob.urgency}
                            </span>
                            {selectedJob.is_emergency && (
                              <span className="admin-badge admin-badge-danger">Emergency</span>
                            )}
                            {selectedJob.is_flagged && (
                              <span className="admin-badge admin-badge-warning">
                                <Flag size={12} /> Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="admin-job-section">
                        <h4>Description</h4>
                        <p className="admin-job-description">{selectedJob.description}</p>
                      </div>

                      {/* Job Info Grid */}
                      <div className="admin-job-info-grid">
                        <div className="admin-job-info-item">
                          <Hash size={16} />
                          <div>
                            <label>Job ID</label>
                            <span className="admin-item-id">{selectedJob.id}</span>
                          </div>
                        </div>
                        <div className="admin-job-info-item">
                          <DollarSign size={16} />
                          <div>
                            <label>Budget</label>
                            <span>
                              {selectedJob.is_budget_hidden
                                ? "Hidden"
                                : `${formatCurrency(selectedJob.budget_min)} - ${formatCurrency(selectedJob.budget_max)}`}
                            </span>
                          </div>
                        </div>
                        <div className="admin-job-info-item">
                          <Briefcase size={16} />
                          <div>
                            <label>Category</label>
                            <span>{selectedJob.category}</span>
                          </div>
                        </div>
                        <div className="admin-job-info-item">
                          <Calendar size={16} />
                          <div>
                            <label>Due Date</label>
                            <span>{formatDate(selectedJob.due_date)}</span>
                          </div>
                        </div>
                        <div className="admin-job-info-item">
                          <Clock size={16} />
                          <div>
                            <label>Est. Duration</label>
                            <span>{selectedJob.estimated_duration_days} days</span>
                          </div>
                        </div>
                        <div className="admin-job-info-item">
                          <Calendar size={16} />
                          <div>
                            <label>Created</label>
                            <span>{formatDateTime(selectedJob.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Property Info */}
                      <div className="admin-job-section">
                        <h4>Property</h4>
                        <div className="admin-job-info-grid">
                          <div className="admin-job-info-item">
                            <Building2 size={16} />
                            <div>
                              <label>Building</label>
                              <span>{selectedJob.building_name || selectedJob.building_type || "N/A"}</span>
                            </div>
                          </div>
                          <div className="admin-job-info-item">
                            <MapPin size={16} />
                            <div>
                              <label>Location</label>
                              <span>
                                {selectedJob.property_address}, {selectedJob.property_city}
                                {selectedJob.property_province && `, ${selectedJob.property_province}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property Manager Info */}
                      <div className="admin-job-section">
                        <h4>Property Manager</h4>
                        <div
                          className="admin-manager-card clickable"
                          onClick={() => handleViewManager(selectedJob.manager_user_id)}
                        >
                          <div className="admin-manager-card-avatar">
                            {selectedJob.manager_first_name?.[0]}
                            {selectedJob.manager_last_name?.[0]}
                          </div>
                          <div className="admin-manager-card-info">
                            <div className="admin-manager-card-name">
                              {selectedJob.manager_first_name} {selectedJob.manager_last_name}
                            </div>
                            <div className="admin-manager-card-company">
                              {selectedJob.manager_company || "N/A"}
                            </div>
                            {selectedJob.manager_email && (
                              <div className="admin-manager-card-email">
                                {selectedJob.manager_email}
                              </div>
                            )}
                          </div>
                          <div className="admin-manager-card-action">
                            <ExternalLink size={16} />
                            <span>View Details</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "bids" && (
                    <div className="admin-job-bids">
                      {jobBids.length === 0 ? (
                        <div className="admin-bids-empty">
                          <DollarSign size={48} />
                          <p>No bids submitted yet</p>
                        </div>
                      ) : (
                        <div className="admin-bids-list">
                          {jobBids.map((bid) => (
                            <div key={bid.id} className="admin-bid-item">
                              <div className="admin-bid-header">
                                <div className="admin-bid-entrepreneur">
                                  <div className="admin-entrepreneur-avatar">
                                    {bid.entrepreneur_first_name?.[0]}
                                    {bid.entrepreneur_last_name?.[0]}
                                  </div>
                                  <div className="admin-entrepreneur-info">
                                    <div className="admin-entrepreneur-name">
                                      {bid.entrepreneur_first_name} {bid.entrepreneur_last_name}
                                    </div>
                                    <div className="admin-entrepreneur-company">
                                      {bid.entrepreneur_company}
                                    </div>
                                  </div>
                                </div>
                                <div className="admin-bid-amount">
                                  {formatCurrency(bid.amount)}
                                </div>
                              </div>
                              <div className="admin-bid-details">
                                <div className="admin-bid-status">
                                  <span className={`admin-badge ${getStatusBadgeClass(bid.status)}`}>
                                    {bid.status}
                                  </span>
                                  {bid.budget_unlocked_at && (
                                    <span className="admin-badge admin-badge-success">
                                      <CheckCircle size={12} /> Budget Unlocked
                                    </span>
                                  )}
                                </div>
                                <div className="admin-bid-meta">
                                  {bid.average_rating && (
                                    <span className="admin-bid-rating">
                                      <Star size={12} /> {bid.average_rating}
                                    </span>
                                  )}
                                  <span className="admin-bid-date">
                                    {formatDateTime(bid.created_at)}
                                  </span>
                                </div>
                              </div>
                              {bid.message && (
                                <div className="admin-bid-message">
                                  <MessageSquare size={14} />
                                  <p>{bid.message}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "moderation" && (
                    <div className="admin-job-moderation">
                      {/* Flag Status */}
                      <div className="admin-moderation-section">
                        <h4>Flag Status</h4>
                        {selectedJob.is_flagged ? (
                          <div className="admin-flag-status flagged">
                            <div className="admin-flag-info">
                              <Flag size={20} />
                              <div>
                                <strong>This job is flagged</strong>
                                <p>{selectedJob.flag_reason}</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-secondary"
                              onClick={handleUnflagJob}
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
                                <strong>This job is not flagged</strong>
                                <p>No issues reported</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-warning"
                              onClick={() => setShowFlagModal(true)}
                            >
                              <Flag size={16} />
                              Flag Job
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      <div className="admin-moderation-section">
                        <h4>Admin Notes</h4>
                        <div className="admin-notes-container">
                          <p className="admin-notes-content">
                            {selectedJob.admin_notes || "No admin notes added."}
                          </p>
                          <button
                            className="admin-btn admin-btn-secondary"
                            onClick={() => setShowNotesModal(true)}
                          >
                            Edit Notes
                          </button>
                        </div>
                      </div>

                      {/* Force Close */}
                      {selectedJob.status !== "Closed" && selectedJob.status !== "Completed" && (
                        <div className="admin-moderation-section">
                          <h4>Force Close Job</h4>
                          <div className="admin-close-container">
                            <p className="admin-close-warning">
                              <AlertTriangle size={16} />
                              Force closing will notify the property manager and all entrepreneurs who bid on this job.
                              This action cannot be undone.
                            </p>
                            {isAdminOrHigher() && (
                              <button
                                className="admin-btn admin-btn-danger"
                                onClick={() => setShowCloseModal(true)}
                              >
                                <XCircle size={16} />
                                Force Close Job
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
              <h2 className="admin-modal-title">Flag Job</h2>
              <button className="admin-modal-close" onClick={() => setShowFlagModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Flagging this job will mark it for review. Please provide a reason:</p>
              <textarea
                className="admin-textarea"
                placeholder="Enter reason for flagging..."
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
                onClick={handleFlagJob}
                disabled={!actionReason.trim() || actionLoading}
              >
                {actionLoading ? "Flagging..." : "Flag Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="admin-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Force Close Job</h2>
              <button className="admin-modal-close" onClick={() => setShowCloseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-warning-message">
                <AlertTriangle size={24} />
                <p>This action cannot be undone. The job will be closed and all parties will be notified.</p>
              </div>
              <textarea
                className="admin-textarea"
                placeholder="Enter reason for closing..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowCloseModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleForceClose}
                disabled={!actionReason.trim() || actionLoading}
              >
                {actionLoading ? "Closing..." : "Force Close"}
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

      {/* Manager Details Modal */}
      {showManagerModal && (
        <div className="admin-modal-overlay" onClick={() => setShowManagerModal(false)}>
          <div className="admin-manager-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Property Manager Details</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowManagerModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {loadingManager ? (
                <div className="admin-modal-loading">
                  <div className="admin-spinner" />
                  <span>Loading manager details...</span>
                </div>
              ) : managerDetails ? (
                <div className="admin-manager-details">
                  {/* Manager Header */}
                  <div className="admin-manager-detail-header">
                    <div className="admin-manager-avatar-lg">
                      {managerDetails.first_name?.[0]}
                      {managerDetails.last_name?.[0]}
                    </div>
                    <div className="admin-manager-header-info">
                      <h3>
                        {managerDetails.first_name} {managerDetails.last_name}
                      </h3>
                      <span className="admin-badge admin-badge-primary">Property Manager</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="admin-manager-section">
                    <h4>Contact Information</h4>
                    <div className="admin-manager-info-grid">
                      <div className="admin-manager-info-item">
                        <Mail size={16} />
                        <div>
                          <label>Email</label>
                          <span>{managerDetails.email}</span>
                        </div>
                      </div>
                      {managerDetails.phone && (
                        <div className="admin-manager-info-item">
                          <Phone size={16} />
                          <div>
                            <label>Phone</label>
                            <span>{managerDetails.phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="admin-manager-section">
                    <h4>Company Information</h4>
                    <div className="admin-manager-info-grid">
                      <div className="admin-manager-info-item">
                        <Building2 size={16} />
                        <div>
                          <label>Company Name</label>
                          <span>{managerDetails.manager_company || "N/A"}</span>
                        </div>
                      </div>
                      {managerDetails.total_properties !== undefined && (
                        <div className="admin-manager-info-item">
                          <Briefcase size={16} />
                          <div>
                            <label>Total Properties</label>
                            <span>{managerDetails.total_properties || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="admin-manager-section">
                    <h4>Account Information</h4>
                    <div className="admin-manager-info-grid">
                      <div className="admin-manager-info-item">
                        <Calendar size={16} />
                        <div>
                          <label>Joined</label>
                          <span>{formatDateTime(managerDetails.created_at)}</span>
                        </div>
                      </div>
                      <div className="admin-manager-info-item">
                        <Clock size={16} />
                        <div>
                          <label>Last Login</label>
                          <span>
                            {managerDetails.last_login
                              ? formatDateTime(managerDetails.last_login)
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="admin-manager-info-item">
                        {managerDetails.email_verified ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <AlertCircle size={16} className="text-warning" />
                        )}
                        <div>
                          <label>Email Status</label>
                          <span>
                            {managerDetails.email_verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-modal-error">
                  <AlertCircle size={48} />
                  <p>Failed to load manager details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
