import { useState, useEffect } from "react";
import {
  X,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  Phone,
  Mail,
  Eye,
  Download,
  ChevronDown,
  Loader2,
  Send,
  MessageSquare,
} from "lucide-react";
import "../../styles/modal/viewmyrequestsmodal.css";

function ViewMyRequestsModal({ isOpen, onClose, requests, onChatWithSupplier, onRefresh }) {
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const filterRequests = () => {
    let filtered = [...(requests || [])];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.supplier_company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.request_details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredRequests(filtered);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          color: "#f59e0b",
          bgColor: "#fef3c7",
        };
      case "in-progress":
        return {
          label: "In Progress",
          icon: Loader2,
          color: "#3b82f6",
          bgColor: "#dbeafe",
        };
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle,
          color: "#10b981",
          bgColor: "#d1fae5",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          icon: XCircle,
          color: "#ef4444",
          bgColor: "#fee2e2",
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: "#6b7280",
          bgColor: "#f3f4f6",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setShowDetails(false);
  };

  const canChatWithSupplier = (status) => {
    return status === "in-progress" || status === "completed";
  };

  const statusOptions = [
    { value: "all", label: "All Requests" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getStatusCounts = () => {
    const counts = {
      all: requests?.length || 0,
      pending: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };
    requests?.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (!isOpen) return null;

  return (
    <div className="vmr-overlay" onClick={onClose}>
      <div className="vmr-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vmr-header">
          <div className="vmr-header-left">
            <div className="vmr-header-icon">
              <Send size={24} />
            </div>
            <div className="vmr-header-text">
              <h2>My Material Requests</h2>
              <span className="vmr-header-subtitle">
                Track all your submitted requests to suppliers
              </span>
            </div>
          </div>
          <button className="vmr-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="vmr-stats-bar">
          <div className="vmr-stat-item">
            <span className="vmr-stat-value">{statusCounts.all}</span>
            <span className="vmr-stat-label">Total</span>
          </div>
          <div className="vmr-stat-item vmr-stat-pending">
            <span className="vmr-stat-value">{statusCounts.pending}</span>
            <span className="vmr-stat-label">Pending</span>
          </div>
          <div className="vmr-stat-item vmr-stat-progress">
            <span className="vmr-stat-value">{statusCounts["in-progress"]}</span>
            <span className="vmr-stat-label">In Progress</span>
          </div>
          <div className="vmr-stat-item vmr-stat-completed">
            <span className="vmr-stat-value">{statusCounts.completed}</span>
            <span className="vmr-stat-label">Completed</span>
          </div>
        </div>

        {/* Controls */}
        <div className="vmr-controls">
          <div className="vmr-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by supplier name or request details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="vmr-clear-search" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="vmr-filter-dropdown">
            <button
              className="vmr-filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
              {statusOptions.find((o) => o.value === statusFilter)?.label}
              <ChevronDown size={14} className={showFilterDropdown ? "rotated" : ""} />
            </button>
            {showFilterDropdown && (
              <div className="vmr-dropdown-menu">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`vmr-dropdown-item ${statusFilter === option.value ? "active" : ""}`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {option.label}
                    <span className="vmr-dropdown-count">{statusCounts[option.value]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request List */}
        <div className="vmr-content">
          {filteredRequests.length === 0 ? (
            <div className="vmr-empty">
              <Package size={48} />
              <h3>No requests found</h3>
              <p>
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "You haven't submitted any material requests yet"}
              </p>
            </div>
          ) : (
            <div className="vmr-request-list">
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={request.id} className="vmr-request-card">
                    <div className="vmr-card-header">
                      <div className="vmr-supplier-info">
                        <div className="vmr-supplier-avatar">
                          <Building2 size={18} />
                        </div>
                        <div className="vmr-supplier-details">
                          <h4>{request.supplier_company_name || "Unknown Supplier"}</h4>
                          <div className="vmr-supplier-contact">
                            {request.supplier_phone && (
                              <span>
                                <Phone size={12} />
                                {request.supplier_phone}
                              </span>
                            )}
                            {request.supplier_email && (
                              <span>
                                <Mail size={12} />
                                {request.supplier_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className="vmr-status-badge"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </div>
                    </div>

                    <div className="vmr-card-body">
                      <div className="vmr-request-preview">
                        {request.request_details ? (
                          <p>{request.request_details.substring(0, 150)}
                            {request.request_details.length > 150 && "..."}
                          </p>
                        ) : request.request_file_url ? (
                          <div className="vmr-file-indicator">
                            <FileText size={16} />
                            <span>PDF Document Attached</span>
                          </div>
                        ) : (
                          <p className="vmr-no-details">No details provided</p>
                        )}
                      </div>

                      <div className="vmr-card-meta">
                        <div className="vmr-date">
                          <Calendar size={12} />
                          <span>Submitted: {formatDate(request.created_at)}</span>
                        </div>
                        {request.updated_at && request.updated_at !== request.created_at && (
                          <div className="vmr-date">
                            <Clock size={12} />
                            <span>Updated: {formatDate(request.updated_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="vmr-card-actions">
                      <button
                        className="vmr-action-btn vmr-btn-view"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye size={14} />
                        View Details
                      </button>

                      {request.request_file_url && (
                        <button
                          className="vmr-action-btn vmr-btn-download"
                          onClick={() => window.open(request.request_file_url, "_blank")}
                        >
                          <Download size={14} />
                          PDF
                        </button>
                      )}

                      {canChatWithSupplier(request.status) && onChatWithSupplier && (
                        <button
                          className="vmr-action-btn vmr-btn-chat"
                          onClick={() => {
                            onChatWithSupplier({
                              user_id: request.supplier_user_id,
                              company_name: request.supplier_company_name,
                            });
                            onClose();
                          }}
                        >
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="vmr-footer">
          <span className="vmr-footer-text">
            Showing {filteredRequests.length} of {requests?.length || 0} requests
          </span>
          <button className="vmr-btn-close" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Details Sub-Modal */}
        {showDetails && selectedRequest && (
          <div className="vmr-details-overlay" onClick={handleCloseDetails}>
            <div className="vmr-details-container" onClick={(e) => e.stopPropagation()}>
              <div className="vmr-details-header">
                <h3>Request Details</h3>
                <button className="vmr-close-btn" onClick={handleCloseDetails}>
                  <X size={18} />
                </button>
              </div>

              <div className="vmr-details-body">
                {/* Supplier Info */}
                <div className="vmr-details-section">
                  <h4>
                    <Building2 size={16} />
                    Supplier Information
                  </h4>
                  <div className="vmr-details-grid">
                    <div className="vmr-detail-item">
                      <label>Company Name</label>
                      <p>{selectedRequest.supplier_company_name || "N/A"}</p>
                    </div>
                    <div className="vmr-detail-item">
                      <label>Phone</label>
                      <p>{selectedRequest.supplier_phone || "N/A"}</p>
                    </div>
                    <div className="vmr-detail-item">
                      <label>Email</label>
                      <p>{selectedRequest.supplier_email || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="vmr-details-section">
                  <h4>
                    <Package size={16} />
                    Request Information
                  </h4>
                  <div className="vmr-details-grid">
                    <div className="vmr-detail-item">
                      <label>Status</label>
                      <div
                        className="vmr-status-badge"
                        style={{
                          backgroundColor: getStatusConfig(selectedRequest.status).bgColor,
                          color: getStatusConfig(selectedRequest.status).color,
                          display: "inline-flex",
                        }}
                      >
                        {getStatusConfig(selectedRequest.status).label}
                      </div>
                    </div>
                    <div className="vmr-detail-item">
                      <label>Submitted On</label>
                      <p>{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    {selectedRequest.updated_at && (
                      <div className="vmr-detail-item">
                        <label>Last Updated</label>
                        <p>{formatDate(selectedRequest.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div className="vmr-details-section">
                  <h4>
                    <FileText size={16} />
                    Request Details
                  </h4>
                  {selectedRequest.request_details ? (
                    <div className="vmr-request-content">
                      <p>{selectedRequest.request_details}</p>
                    </div>
                  ) : selectedRequest.request_file_url ? (
                    <div className="vmr-file-section">
                      <FileText size={24} />
                      <span>PDF Document Attached</span>
                      <button
                        className="vmr-btn-download-file"
                        onClick={() => window.open(selectedRequest.request_file_url, "_blank")}
                      >
                        <Download size={14} />
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    <p className="vmr-no-details">No details provided</p>
                  )}
                </div>
              </div>

              <div className="vmr-details-footer">
                {canChatWithSupplier(selectedRequest.status) && onChatWithSupplier && (
                  <button
                    className="vmr-btn-chat-supplier"
                    onClick={() => {
                      onChatWithSupplier({
                        user_id: selectedRequest.supplier_user_id,
                        company_name: selectedRequest.supplier_company_name,
                      });
                      handleCloseDetails();
                      onClose();
                    }}
                  >
                    <MessageSquare size={16} />
                    Chat with Supplier
                  </button>
                )}
                <button className="vmr-btn-close-details" onClick={handleCloseDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewMyRequestsModal;
