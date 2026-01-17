import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  AlertCircle,
  MessageSquare,
  User,
  Briefcase,
  AlertTriangle,
  Scale,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  Loader2,
  DollarSign,
  FileText,
  Star,
  Gavel,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-disputes.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Dispute type icons
const getTypeIcon = (type) => {
  const icons = {
    job_quality: Briefcase,
    payment: DollarSign,
    non_delivery: FileText,
    review_dispute: Star,
    contract_violation: AlertTriangle,
    other: MessageSquare,
  };
  return icons[type] || Scale;
};

// Priority colors
const getPriorityColor = (priority) => {
  const colors = {
    low: "secondary",
    medium: "warning",
    high: "danger",
    urgent: "danger",
  };
  return colors[priority] || "secondary";
};

// Status colors
const getStatusColor = (status) => {
  const colors = {
    open: "warning",
    under_review: "info",
    resolved: "success",
    closed: "secondary",
    escalated: "danger",
  };
  return colors[status] || "secondary";
};

// Format type name
const formatType = (type) => {
  return type
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()) || "General";
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Time ago
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
};

// Resolution type labels
const resolutionTypeLabels = {
  side_with_reporter: "Sided with Reporter",
  side_with_reported: "Sided with Reported User",
  mutual_resolution: "Mutual Resolution",
  escalated: "Escalated",
  refund_issued: "Refund Issued",
  user_suspended: "User Suspended",
};

function Disputes() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
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
    type: "",
    priority: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Dispute detail modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Resolve modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolutionType, setResolutionType] = useState("");
  const [resolving, setResolving] = useState(false);

  // Fetch disputes
  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority }),
      });

      const response = await fetch(
        `${API_URL}/api/admin/disputes?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch disputes");
      }

      const data = await response.json();
      setDisputes(data.disputes || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/disputes/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDisputes();
    fetchStats();
  }, [fetchDisputes, fetchStats]);

  // Open dispute detail
  const handleViewDispute = (dispute) => {
    setSelectedDispute(dispute);
    setShowDisputeModal(true);
  };

  // Update dispute status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedDispute) return;

    try {
      setUpdatingStatus(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/disputes/${selectedDispute.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setSelectedDispute((prev) => ({ ...prev, status: newStatus }));
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id ? { ...d, status: newStatus } : d
        )
      );
      fetchStats();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Escalate dispute
  const handleEscalate = async () => {
    if (!selectedDispute) return;

    try {
      setUpdatingStatus(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/disputes/${selectedDispute.id}/escalate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to escalate dispute");
      }

      // Update local state
      setSelectedDispute((prev) => ({ ...prev, status: "escalated", priority: "urgent" }));
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id ? { ...d, status: "escalated", priority: "urgent" } : d
        )
      );
      fetchStats();
    } catch (err) {
      console.error("Error escalating dispute:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open resolve modal
  const openResolveModal = () => {
    setResolution("");
    setResolutionType("");
    setShowResolveModal(true);
  };

  // Resolve dispute
  const handleResolve = async () => {
    if (!selectedDispute || !resolution.trim() || !resolutionType) return;

    try {
      setResolving(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/disputes/${selectedDispute.id}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resolution, resolutionType }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve dispute");
      }

      const data = await response.json();

      // Update local state
      setSelectedDispute((prev) => ({
        ...prev,
        status: "resolved",
        resolution,
        resolution_type: resolutionType,
      }));
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? { ...d, status: "resolved", resolution, resolution_type: resolutionType }
            : d
        )
      );
      setShowResolveModal(false);
      fetchStats();
    } catch (err) {
      console.error("Error resolving dispute:", err);
    } finally {
      setResolving(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowDisputeModal(false);
    setSelectedDispute(null);
    setShowResolveModal(false);
  };

  // Handle search
  const handleSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ search: "", status: "", type: "", priority: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="admin-disputes">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Disputes</h1>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => { fetchDisputes(); fetchStats(); }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-disputes-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon dsp-open">
              <Clock size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.open_disputes || 0}</span>
              <span className="admin-stat-label">Open</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon dsp-review">
              <Scale size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.under_review_disputes || 0}</span>
              <span className="admin-stat-label">Under Review</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon dsp-escalated">
              <AlertTriangle size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.escalated_disputes || 0}</span>
              <span className="admin-stat-label">Escalated</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon dsp-resolved">
              <CheckCircle size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.resolved_disputes || 0}</span>
              <span className="admin-stat-label">Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-disputes-toolbar">
        <div className="admin-disputes-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by reason, job, or user..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <button
            className={`admin-btn admin-btn-secondary ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="admin-disputes-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Status</label>
            <select
              className="admin-input"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="admin-filter-group">
            <label className="admin-filter-label">Type</label>
            <select
              className="admin-input"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="">All Types</option>
              <option value="job_quality">Job Quality</option>
              <option value="payment">Payment</option>
              <option value="non_delivery">Non-Delivery</option>
              <option value="review_dispute">Review Dispute</option>
              <option value="contract_violation">Contract Violation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="admin-filter-group">
            <label className="admin-filter-label">Priority</label>
            <select
              className="admin-input"
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="admin-disputes-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchDisputes}>Retry</button>
        </div>
      )}

      {/* Disputes Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dispute</th>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="admin-table-loading">
                      <Loader2 size={24} className="spin" />
                      <span>Loading disputes...</span>
                    </div>
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="admin-table-empty">
                      <Scale size={48} />
                      <p>No disputes found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => {
                  const TypeIcon = getTypeIcon(dispute.type);
                  return (
                    <tr key={dispute.id}>
                      <td>
                        <div className="admin-dispute-cell">
                          <span className="admin-dispute-number">
                            #{dispute.dispute_number}
                          </span>
                          <span className="admin-dispute-reason">
                            {dispute.reason?.substring(0, 50)}
                            {dispute.reason?.length > 50 ? "..." : ""}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {dispute.reporter_first_name?.[0]}
                            {dispute.reporter_last_name?.[0]}
                          </div>
                          <div className="admin-user-info">
                            <span className="admin-user-name">
                              {dispute.reporter_first_name} {dispute.reporter_last_name}
                            </span>
                            <span className="admin-user-role">
                              {dispute.reporter_role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {dispute.reported_first_name?.[0]}
                            {dispute.reported_last_name?.[0]}
                          </div>
                          <div className="admin-user-info">
                            <span className="admin-user-name">
                              {dispute.reported_first_name} {dispute.reported_last_name}
                            </span>
                            <span className="admin-user-role">
                              {dispute.reported_role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-type-badge">
                          <TypeIcon size={14} />
                          {formatType(dispute.type)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge-${getPriorityColor(dispute.priority)}`}
                        >
                          {dispute.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge-${getStatusColor(dispute.status)}`}
                        >
                          {dispute.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className="admin-text-muted">
                          {timeAgo(dispute.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="admin-btn admin-btn-icon"
                            onClick={() => handleViewDispute(dispute)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && disputes.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} disputes
            </div>
            <div className="admin-pagination-controls">
              <button
                className="admin-btn admin-btn-icon"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="admin-pagination-pages">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="admin-btn admin-btn-icon"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dispute Detail Modal */}
      {showDisputeModal && selectedDispute && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal admin-modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <Scale size={20} />
                <span>Dispute #{selectedDispute.dispute_number}</span>
              </div>
              <button className="admin-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Dispute Info */}
              <div className="admin-dispute-detail">
                <div className="admin-dispute-header">
                  <h3>{formatType(selectedDispute.type)}</h3>
                  <div className="admin-dispute-meta">
                    <span
                      className={`admin-badge admin-badge-${getPriorityColor(selectedDispute.priority)}`}
                    >
                      {selectedDispute.priority}
                    </span>
                    <span
                      className={`admin-badge admin-badge-${getStatusColor(selectedDispute.status)}`}
                    >
                      {selectedDispute.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="admin-dispute-parties">
                  <div className="admin-dispute-party reporter">
                    <div className="party-header">
                      <User size={16} />
                      <span>Reporter</span>
                    </div>
                    <div className="party-info">
                      <div className="party-avatar">
                        {selectedDispute.reporter_first_name?.[0]}
                        {selectedDispute.reporter_last_name?.[0]}
                      </div>
                      <div className="party-details">
                        <span className="party-name">
                          {selectedDispute.reporter_first_name} {selectedDispute.reporter_last_name}
                        </span>
                        <span className="party-email">{selectedDispute.reporter_email}</span>
                        <span className="party-role">{selectedDispute.reporter_role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-dispute-vs">
                    <Gavel size={24} />
                    <span>VS</span>
                  </div>

                  <div className="admin-dispute-party reported">
                    <div className="party-header">
                      <User size={16} />
                      <span>Reported User</span>
                    </div>
                    <div className="party-info">
                      <div className="party-avatar">
                        {selectedDispute.reported_first_name?.[0]}
                        {selectedDispute.reported_last_name?.[0]}
                      </div>
                      <div className="party-details">
                        <span className="party-name">
                          {selectedDispute.reported_first_name} {selectedDispute.reported_last_name}
                        </span>
                        <span className="party-email">{selectedDispute.reported_email}</span>
                        <span className="party-role">{selectedDispute.reported_role}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                {selectedDispute.job_title && (
                  <div className="admin-dispute-job">
                    <div className="job-header">
                      <Briefcase size={16} />
                      <span>Related Job</span>
                    </div>
                    <div className="job-content">
                      <span className="job-title">{selectedDispute.job_title}</span>
                      <span className="job-status">Status: {selectedDispute.job_status}</span>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="admin-dispute-reason">
                  <h4>Dispute Reason</h4>
                  <p>{selectedDispute.reason}</p>
                </div>

                {/* Evidence */}
                {selectedDispute.evidence && (
                  <div className="admin-dispute-evidence">
                    <h4>Evidence Provided</h4>
                    <p>{selectedDispute.evidence}</p>
                  </div>
                )}

                {/* Resolution (if resolved) */}
                {selectedDispute.status === "resolved" && selectedDispute.resolution && (
                  <div className="admin-dispute-resolution">
                    <h4>
                      <CheckCircle size={16} />
                      Resolution
                    </h4>
                    <div className="resolution-type">
                      <strong>Decision:</strong>{" "}
                      {resolutionTypeLabels[selectedDispute.resolution_type] || selectedDispute.resolution_type}
                    </div>
                    <p>{selectedDispute.resolution}</p>
                    {selectedDispute.resolved_by_name && (
                      <div className="resolution-by">
                        Resolved by {selectedDispute.resolved_by_name} on{" "}
                        {formatDate(selectedDispute.resolved_at)}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedDispute.status !== "resolved" && selectedDispute.status !== "closed" && (
                  <div className="admin-dispute-actions">
                    <h4>Actions</h4>
                    <div className="admin-action-buttons">
                      {selectedDispute.status === "open" && (
                        <button
                          className="admin-btn admin-btn-info"
                          onClick={() => handleUpdateStatus("under_review")}
                          disabled={updatingStatus}
                        >
                          <Scale size={16} />
                          Start Review
                        </button>
                      )}
                      <button
                        className="admin-btn admin-btn-success"
                        onClick={openResolveModal}
                        disabled={updatingStatus}
                      >
                        <CheckCircle size={16} />
                        Resolve Dispute
                      </button>
                      {selectedDispute.status !== "escalated" && (
                        <button
                          className="admin-btn admin-btn-warning"
                          onClick={handleEscalate}
                          disabled={updatingStatus}
                        >
                          <ArrowUp size={16} />
                          Escalate
                        </button>
                      )}
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => handleUpdateStatus("closed")}
                        disabled={updatingStatus}
                      >
                        <XCircle size={16} />
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="admin-dispute-timestamps">
                  <div className="timestamp-item">
                    <Calendar size={14} />
                    <span>Created: {formatDate(selectedDispute.created_at)}</span>
                  </div>
                  <div className="timestamp-item">
                    <Clock size={14} />
                    <span>Updated: {formatDate(selectedDispute.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="admin-modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div
            className="admin-modal admin-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <Gavel size={20} />
                <span>Resolve Dispute</span>
              </div>
              <button className="admin-modal-close" onClick={() => setShowResolveModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Resolution Type</label>
                <select
                  className="admin-input"
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                >
                  <option value="">Select decision...</option>
                  <option value="side_with_reporter">Side with Reporter</option>
                  <option value="side_with_reported">Side with Reported User</option>
                  <option value="mutual_resolution">Mutual Resolution</option>
                  <option value="refund_issued">Issue Refund</option>
                  <option value="user_suspended">Suspend User</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Resolution Details</label>
                <textarea
                  className="admin-input admin-textarea"
                  placeholder="Describe the resolution and any actions taken..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-success"
                onClick={handleResolve}
                disabled={!resolution.trim() || !resolutionType || resolving}
              >
                {resolving ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Resolve Dispute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Disputes;
