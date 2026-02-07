import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  Eye,
  Plus,
  Ticket,
  Copy,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Trash2,
  X,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-promoters.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Status helpers
const getStatusInfo = (promoCode) => {
  const timesUsed = parseInt(promoCode.times_used) || 0;
  const maxUses = promoCode.max_uses;

  if (!promoCode.is_active) {
    return { label: "Inactive", class: "admin-badge-danger" };
  }
  if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
    return { label: "Expired", class: "admin-badge-warning" };
  }
  if (maxUses && timesUsed >= maxUses) {
    return { label: "Used", class: "admin-badge-success" };
  }
  if (timesUsed > 0) {
    return { label: "Partially Used", class: "admin-badge-info" };
  }
  return { label: "Unused", class: "admin-badge-secondary" };
};

function PromoCodes() {
  const { token } = useAdminAuth();

  // State
  const [promoCodes, setPromoCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUsesModal, setShowUsesModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);
  const [uses, setUses] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);

  // Create modal state
  const [createForm, setCreateForm] = useState({
    code: "",
    description: "",
    code_type: "free_access", // 'free_access' or 'discount'
    discount_percent: 20,
    discount_duration: 1,
    max_uses: 1,
    expires_at: "",
  });
  const [creating, setCreating] = useState(false);

  // Fetch promo codes
  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(
        `${API_URL}/api/admin/promo-codes?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch promo codes");

      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/promo-codes/stats`, {
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
      fetchPromoCodes();
      fetchStats();
    }
  }, [fetchPromoCodes, fetchStats, token]);

  // Generate promo code
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/promo-codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          code: createForm.code || undefined, // Let backend generate if empty
          expires_at: createForm.expires_at || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate promo code");
      }

      const data = await response.json();
      toast.success(`Promo code ${data.promoCode.code} generated!`);
      setShowCreateModal(false);
      setCreateForm({
        code: "",
        description: "",
        code_type: "free_access",
        discount_percent: 20,
        discount_duration: 1,
        max_uses: 1,
        expires_at: "",
      });
      fetchPromoCodes();
      fetchStats();
    } catch (error) {
      console.error("Error creating promo code:", error);
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle promo code status
  const toggleStatus = async (promoCode) => {
    try {
      const endpoint = promoCode.is_active
        ? `${API_URL}/api/admin/promo-codes/${promoCode.id}`
        : `${API_URL}/api/admin/promo-codes/${promoCode.id}/reactivate`;

      const method = promoCode.is_active ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to update promo code");

      toast.success(
        promoCode.is_active ? "Promo code deactivated" : "Promo code reactivated"
      );
      fetchPromoCodes();
      fetchStats();
    } catch (error) {
      console.error("Error updating promo code:", error);
      toast.error("Failed to update promo code");
    }
  };

  // View uses
  const viewUses = async (promoCode) => {
    setSelectedPromoCode(promoCode);
    setShowUsesModal(true);
    setUsesLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/promo-codes/${promoCode.id}/uses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch uses");

      const data = await response.json();
      setUses(data.uses || []);
    } catch (error) {
      console.error("Error fetching uses:", error);
      toast.error("Failed to load usage details");
    } finally {
      setUsesLoading(false);
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
    fetchPromoCodes();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-content">
          <h1 className="admin-page-title">
            <Ticket size={28} />
            Promo Codes
          </h1>
          <p className="admin-page-subtitle">
            Generate and manage promotional discount codes
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              fetchPromoCodes();
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
            Generate Code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#3b82f6" }}>
              <Ticket size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.total}</div>
              <div className="admin-stat-label">Total Codes</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#10b981" }}>
              <CheckCircle size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.used}</div>
              <div className="admin-stat-label">Used</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#6b7280" }}>
              <Clock size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.unused}</div>
              <div className="admin-stat-label">Unused</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#8b5cf6" }}>
              <Hash size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.total_redemptions}</div>
              <div className="admin-stat-label">Total Redemptions</div>
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
                placeholder="Search by code..."
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
              <option value="used">Used</option>
              <option value="unused">Unused</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Loading promo codes...</p>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="admin-empty">
              <Ticket size={48} />
              <p>No promo codes found</p>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Generate First Code
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((promoCode) => {
                  const statusInfo = getStatusInfo(promoCode);
                  const timesUsed = parseInt(promoCode.times_used) || 0;

                  return (
                    <tr key={promoCode.id}>
                      <td>
                        <div className="admin-code-cell">
                          <code className="admin-code promo-code-large">
                            {promoCode.code}
                          </code>
                          <button
                            className="admin-btn-icon"
                            onClick={() => copyToClipboard(promoCode.code)}
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {promoCode.code_type === 'free_access' ? (
                          <span className="admin-badge admin-badge-success">
                            Free Access
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-info">
                            {promoCode.discount_percent}% off
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="admin-description">
                          {promoCode.description || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="admin-usage-cell">
                          <span className="admin-usage-count">
                            {timesUsed} / {promoCode.max_uses || "∞"}
                          </span>
                          {timesUsed > 0 && (
                            <button
                              className="admin-btn-link"
                              onClick={() => viewUses(promoCode)}
                            >
                              View Users
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="admin-date">
                          {formatDate(promoCode.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {timesUsed > 0 && (
                            <button
                              className="admin-btn-icon"
                              onClick={() => viewUses(promoCode)}
                              title="View who used this code"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            className="admin-btn-icon"
                            onClick={() => toggleStatus(promoCode)}
                            title={
                              promoCode.is_active ? "Deactivate" : "Reactivate"
                            }
                          >
                            {promoCode.is_active ? (
                              <ToggleRight size={16} className="text-success" />
                            ) : (
                              <ToggleLeft size={16} className="text-danger" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create Promo Code Modal */}
      {showCreateModal && (
        <div className="promo-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h2>
                <Ticket size={24} />
                Generate Promo Code
              </h2>
              <button
                className="promo-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="promo-modal-body">
              {/* Code Type Selection */}
              <div className="promo-form-group">
                <label>Code Type</label>
                <div className="promo-type-selector">
                  <button
                    type="button"
                    className={`promo-type-btn ${createForm.code_type === 'free_access' ? 'active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, code_type: 'free_access' })}
                  >
                    <CheckCircle size={18} />
                    Free Access
                  </button>
                  <button
                    type="button"
                    className={`promo-type-btn ${createForm.code_type === 'discount' ? 'active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, code_type: 'discount' })}
                  >
                    <Hash size={18} />
                    Discount
                  </button>
                </div>
                <span className="promo-form-hint">
                  {createForm.code_type === 'free_access'
                    ? 'User gets free premium access - no payment required'
                    : 'User gets a discount on their subscription'}
                </span>
              </div>

              <div className="promo-form-group">
                <label>Promo Code (optional)</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    })
                  }
                  placeholder="Leave empty to auto-generate"
                  className="promo-form-input"
                  maxLength={10}
                />
                <span className="promo-form-hint">
                  Letters and numbers only, max 10 characters
                </span>
              </div>

              <div className="promo-form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder={createForm.code_type === 'free_access' ? "e.g., Promoter - John Smith" : "e.g., Summer Sale 2024"}
                  className="promo-form-input"
                />
              </div>

              {/* Only show discount fields for discount type */}
              {createForm.code_type === 'discount' && (
                <div className="promo-form-row">
                  <div className="promo-form-group">
                    <label>Discount %</label>
                    <input
                      type="number"
                      value={createForm.discount_percent}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          discount_percent: parseInt(e.target.value) || 20,
                        })
                      }
                      min={1}
                      max={100}
                      className="promo-form-input"
                    />
                  </div>

                  <div className="promo-form-group">
                    <label>Duration (months)</label>
                    <input
                      type="number"
                      value={createForm.discount_duration}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          discount_duration: parseInt(e.target.value) || 1,
                        })
                      }
                      min={1}
                      max={12}
                      className="promo-form-input"
                    />
                  </div>
                </div>
              )}

              <div className="promo-form-row">
                <div className="promo-form-group">
                  <label>Max Uses</label>
                  <input
                    type="number"
                    value={createForm.max_uses}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        max_uses: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    className="promo-form-input"
                  />
                  <span className="promo-form-hint">
                    {createForm.code_type === 'free_access' ? 'Usually 1 for promoters' : ''}
                  </span>
                </div>

                <div className="promo-form-group">
                  <label>Expires On (optional)</label>
                  <input
                    type="date"
                    value={createForm.expires_at}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, expires_at: e.target.value })
                    }
                    className="promo-form-input"
                  />
                </div>
              </div>

              <div className="promo-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="admin-spinner-small" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Generate Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Uses Modal */}
      {showUsesModal && selectedPromoCode && (
        <div className="promo-modal-overlay" onClick={() => setShowUsesModal(false)}>
          <div className="promo-modal promo-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h2>
                <Users size={24} />
                Code Usage: <code>{selectedPromoCode.code}</code>
              </h2>
              <button
                className="promo-modal-close"
                onClick={() => setShowUsesModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="promo-modal-body">
              {usesLoading ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                  <p>Loading usage details...</p>
                </div>
              ) : uses.length === 0 ? (
                <div className="admin-empty">
                  <Users size={48} />
                  <p>No one has used this code yet</p>
                </div>
              ) : (
                <div className="promo-uses-list">
                  {uses.map((use) => (
                    <div key={use.id} className="promo-use-item">
                      <div className="promo-use-avatar">
                        <User size={20} />
                      </div>
                      <div className="promo-use-info">
                        <div className="promo-use-name">
                          {use.first_name} {use.last_name}
                        </div>
                        <div className="promo-use-email">
                          <Mail size={12} />
                          {use.email}
                        </div>
                      </div>
                      <div className="promo-use-meta">
                        <div className="promo-use-date">
                          <Calendar size={12} />
                          {formatDate(use.used_at)}
                        </div>
                        {use.plan_type && (
                          <span className={`admin-badge admin-badge-${use.subscription_status === 'active' ? 'success' : 'secondary'}`}>
                            {use.plan_type} - {use.subscription_status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="promo-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowUsesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoCodes;
