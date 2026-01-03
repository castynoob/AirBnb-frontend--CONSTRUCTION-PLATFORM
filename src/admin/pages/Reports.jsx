import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  MessageSquare,
  Flag,
  User,
  Bug,
  CreditCard,
  FileWarning,
  AlertTriangle,
  HelpCircle,
  Send,
  Loader2,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-reports.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Category icons mapping
const getCategoryIcon = (category) => {
  const icons = {
    technical: Bug,
    account: User,
    payment: CreditCard,
    job_issue: FileWarning,
    contractor_issue: FileWarning,
    order_issue: FileWarning,
    property_issue: FileWarning,
    report_user: AlertTriangle,
    other: HelpCircle,
  };
  return icons[category] || Flag;
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
    in_progress: "info",
    waiting_on_user: "secondary",
    resolved: "success",
    closed: "secondary",
  };
  return colors[status] || "secondary";
};

// Format category name
const formatCategory = (category) => {
  return category
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

function Reports() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    category: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category }),
      });

      const response = await fetch(
        `${API_URL}/api/admin/support/tickets?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      setTickets(data.tickets || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch ticket messages
  const fetchTicketMessages = async (ticketId) => {
    try {
      setLoadingMessages(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/support/tickets/${ticketId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setTicketMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Open ticket detail
  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    fetchTicketMessages(ticket.id);
  };

  // Send admin reply
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      fetchTicketMessages(selectedTicket.id);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;

    try {
      setUpdatingStatus(true);
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/support/tickets/${selectedTicket.id}/status`,
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
      setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
    setTicketMessages([]);
    setNewMessage("");
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
    setFilters({ search: "", status: "", priority: "", category: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="admin-reports">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Support Reports</h1>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={fetchTickets}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-reports-toolbar">
        <div className="admin-reports-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by subject, user, or ticket #..."
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
        <div className="admin-reports-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Status</label>
            <select
              className="admin-input"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_on_user">Waiting on User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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
          <div className="admin-filter-group">
            <label className="admin-filter-label">Category</label>
            <select
              className="admin-input"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="technical">Technical Issue</option>
              <option value="account">Account Problem</option>
              <option value="payment">Payment & Billing</option>
              <option value="job_issue">Job Issue</option>
              <option value="report_user">Report User</option>
              <option value="other">Other</option>
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
        <div className="admin-reports-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchTickets}>Retry</button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>User</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-table-loading">
                      <Loader2 size={24} className="spin" />
                      <span>Loading tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-table-empty">
                      <Flag size={48} />
                      <p>No tickets found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const CategoryIcon = getCategoryIcon(ticket.category);
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className="admin-ticket-cell">
                          <span className="admin-ticket-number">
                            #{ticket.ticket_number}
                          </span>
                          <span className="admin-ticket-subject">
                            {ticket.subject}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {ticket.user_first_name?.[0]}
                            {ticket.user_last_name?.[0]}
                          </div>
                          <div className="admin-user-info">
                            <span className="admin-user-name">
                              {ticket.user_first_name} {ticket.user_last_name}
                            </span>
                            <span className="admin-user-email">
                              {ticket.user_email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-category-badge">
                          <CategoryIcon size={14} />
                          {formatCategory(ticket.category)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge-${getPriorityColor(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge-${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className="admin-text-muted">
                          {timeAgo(ticket.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="admin-btn admin-btn-icon"
                            onClick={() => handleViewTicket(ticket)}
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
        {!loading && tickets.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} tickets
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

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal admin-modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <Flag size={20} />
                <span>Ticket #{selectedTicket.ticket_number}</span>
              </div>
              <button className="admin-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Ticket Info */}
              <div className="admin-ticket-detail">
                <div className="admin-ticket-header">
                  <h3>{selectedTicket.subject}</h3>
                  <div className="admin-ticket-meta">
                    <span
                      className={`admin-badge admin-badge-${getPriorityColor(selectedTicket.priority)}`}
                    >
                      {selectedTicket.priority}
                    </span>
                    <span
                      className={`admin-badge admin-badge-${getStatusColor(selectedTicket.status)}`}
                    >
                      {selectedTicket.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="admin-ticket-info-grid">
                  <div className="admin-ticket-info-item">
                    <User size={16} />
                    <div>
                      <span className="label">Reported by</span>
                      <span className="value">
                        {selectedTicket.user_first_name}{" "}
                        {selectedTicket.user_last_name}
                      </span>
                    </div>
                  </div>
                  <div className="admin-ticket-info-item">
                    <Mail size={16} />
                    <div>
                      <span className="label">Email</span>
                      <span className="value">{selectedTicket.user_email}</span>
                    </div>
                  </div>
                  <div className="admin-ticket-info-item">
                    <Calendar size={16} />
                    <div>
                      <span className="label">Created</span>
                      <span className="value">
                        {formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-ticket-info-item">
                    {(() => {
                      const CategoryIcon = getCategoryIcon(selectedTicket.category);
                      return <CategoryIcon size={16} />;
                    })()}
                    <div>
                      <span className="label">Category</span>
                      <span className="value">
                        {formatCategory(selectedTicket.category)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-ticket-description">
                  <h4>Description</h4>
                  <p>{selectedTicket.description}</p>
                </div>

                {/* Status Actions */}
                <div className="admin-ticket-actions">
                  <h4>Update Status</h4>
                  <div className="admin-status-buttons">
                    {["open", "in_progress", "waiting_on_user", "resolved", "closed"].map(
                      (status) => (
                        <button
                          key={status}
                          className={`admin-btn admin-btn-sm ${
                            selectedTicket.status === status
                              ? "admin-btn-primary"
                              : "admin-btn-secondary"
                          }`}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={
                            updatingStatus || selectedTicket.status === status
                          }
                        >
                          {status.replace(/_/g, " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="admin-ticket-messages">
                <h4>
                  <MessageSquare size={18} />
                  Conversation
                </h4>

                <div className="admin-messages-list">
                  {loadingMessages ? (
                    <div className="admin-messages-loading">
                      <Loader2 size={20} className="spin" />
                      Loading messages...
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="admin-messages-empty">
                      No messages yet
                    </div>
                  ) : (
                    ticketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`admin-message ${
                          msg.sender_type === "admin" ? "admin-sent" : "user-sent"
                        }`}
                      >
                        <div className="admin-message-header">
                          <span className="admin-message-sender">
                            {msg.sender_type === "admin" ? "Admin" : "User"}
                          </span>
                          <span className="admin-message-time">
                            {timeAgo(msg.created_at)}
                          </span>
                        </div>
                        <div className="admin-message-content">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <div className="admin-message-input">
                  <textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
