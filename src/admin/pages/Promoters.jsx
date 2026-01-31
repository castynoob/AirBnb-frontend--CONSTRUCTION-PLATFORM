import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  Eye,
  Plus,
  Users,
  UserCheck,
  UserX,
  Clock,
  Megaphone,
  Copy,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hash,
  Percent,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import CreatePromoterModal from "../components/CreatePromoterModal";
import "../styles/admin-promoters.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  if (!status) return "admin-badge-secondary";
  const statusLower = status.toLowerCase();
  const classes = {
    active: "admin-badge-success",
    pending: "admin-badge-warning",
    inactive: "admin-badge-danger",
  };
  return classes[statusLower] || "admin-badge-secondary";
};

function Promoters() {
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  // State
  const [promoters, setPromoters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch promoters
  const fetchPromoters = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(
        `${API_URL}/api/admin/promoters?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch promoters");

      const data = await response.json();
      setPromoters(data.promoters || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching promoters:", error);
      toast.error("Failed to load promoters");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/promoters/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPromoters();
      fetchStats();
    }
  }, [fetchPromoters, fetchStats, token]);

  // Toggle promoter status
  const togglePromoterStatus = async (promoter) => {
    try {
      const endpoint = promoter.is_active
        ? `${API_URL}/api/admin/promoters/${promoter.id}`
        : `${API_URL}/api/admin/promoters/${promoter.id}/reactivate`;

      const method = promoter.is_active ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to update promoter");

      toast.success(
        promoter.is_active ? "Promoter deactivated" : "Promoter reactivated"
      );
      fetchPromoters();
      fetchStats();
    } catch (error) {
      console.error("Error updating promoter:", error);
      toast.error("Failed to update promoter");
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPromoters();
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-content">
          <h1 className="admin-page-title">
            <Megaphone size={28} />
            Promoters
          </h1>
          <p className="admin-page-subtitle">
            Manage promoter accounts and referral codes
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              fetchPromoters();
              fetchStats();
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Promoter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#3b82f6" }}>
              <Users size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.total}</div>
              <div className="admin-stat-label">Total Promoters</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#10b981" }}>
              <UserCheck size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.active}</div>
              <div className="admin-stat-label">Active</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#f59e0b" }}>
              <Clock size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.pending}</div>
              <div className="admin-stat-label">Pending Activation</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#8b5cf6" }}>
              <Hash size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.total_referrals}</div>
              <div className="admin-stat-label">Total Referrals</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="admin-search-form">
            <div className="admin-search-input-wrapper">
              <Search size={18} className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Search
            </button>
          </form>

          <div className="admin-filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promoters Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Loading promoters...</p>
            </div>
          ) : promoters.length === 0 ? (
            <div className="admin-empty">
              <Megaphone size={48} />
              <p>No promoters found</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Promoter</th>
                  <th>Activation Code</th>
                  <th>Referral Code</th>
                  <th>Status</th>
                  <th>Referrals</th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoters.map((promoter) => (
                  <tr key={promoter.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-info">
                          <div className="admin-user-name">
                            {promoter.promoter_name}
                          </div>
                          <div className="admin-user-email">
                            {promoter.promoter_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-code-cell">
                        <code className="admin-code">
                          {promoter.activation_code}
                        </code>
                        <button
                          className="admin-btn-icon"
                          onClick={() =>
                            copyToClipboard(promoter.activation_code)
                          }
                          title="Copy code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="admin-code-cell">
                        <code className="admin-code">
                          {promoter.referral_code}
                        </code>
                        <button
                          className="admin-btn-icon"
                          onClick={() =>
                            copyToClipboard(promoter.referral_code)
                          }
                          title="Copy code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${getStatusBadgeClass(
                          promoter.status
                        )}`}
                      >
                        {promoter.status}
                      </span>
                    </td>
                    <td>
                      <span className="admin-referral-count">
                        {promoter.referral_count || 0}
                      </span>
                    </td>
                    <td>
                      <span className="admin-discount">
                        {promoter.discount_percent}% / {promoter.discount_duration} mo
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn-icon"
                          onClick={() =>
                            navigate(`/admin/promoters/${promoter.id}`)
                          }
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="admin-btn-icon"
                          onClick={() => togglePromoterStatus(promoter)}
                          title={
                            promoter.is_active ? "Deactivate" : "Reactivate"
                          }
                        >
                          {promoter.is_active ? (
                            <ToggleRight size={16} className="text-success" />
                          ) : (
                            <ToggleLeft size={16} className="text-danger" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="admin-pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Create Promoter Modal */}
      <CreatePromoterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchPromoters();
          fetchStats();
        }}
      />
    </div>
  );
}

export default Promoters;
