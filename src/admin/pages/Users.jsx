import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  User,
  Briefcase,
  FileText,
  DollarSign,
  LogIn,
  LogOut,
  Lock,
  Edit3,
  Send,
  Wrench,
  CreditCard,
  LayoutList,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-users.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Activity type icons and colors mapping
const getActivityIcon = (action) => {
  const icons = {
    login: LogIn,
    logout: LogOut,
    password_changed: Lock,
    profile_updated: Edit3,
    job_created: Briefcase,
    job_updated: Briefcase,
    job_closed: Briefcase,
    bid_accepted: CheckCircle,
    bid_submitted: FileText,
    budget_unlocked: DollarSign,
    contract_created: FileText,
    contract_completed: CheckCircle,
    subscription_changed: CreditCard,
    quote_submitted: FileText,
    invoice_created: DollarSign,
    maintenance_request: Wrench,
    message_sent: Send,
  };
  return icons[action] || Activity;
};

const getActivityColor = (action) => {
  const colors = {
    login: "success",
    logout: "secondary",
    password_changed: "warning",
    profile_updated: "primary",
    job_created: "primary",
    job_updated: "primary",
    job_closed: "secondary",
    bid_accepted: "success",
    bid_submitted: "primary",
    budget_unlocked: "success",
    contract_created: "primary",
    contract_completed: "success",
    subscription_changed: "warning",
    quote_submitted: "primary",
    invoice_created: "success",
    maintenance_request: "warning",
    message_sent: "info",
  };
  return colors[action] || "secondary";
};

// Activity categories by role
const ACTIVITY_CATEGORIES = {
  common: {
    title: "Account Activity",
    description: "Login, logout, and profile management",
    actions: ["login", "logout", "password_changed", "profile_updated"],
  },
  property_manager: {
    title: "Property Manager Activity",
    description: "Jobs, bids, and contracts management",
    actions: ["job_created", "job_updated", "job_closed", "bid_accepted", "contract_created"],
  },
  entrepreneur: {
    title: "Entrepreneur Activity",
    description: "Bids, budgets, and contracts",
    actions: ["bid_submitted", "budget_unlocked", "contract_completed", "subscription_changed"],
  },
  supplier: {
    title: "Supplier Activity",
    description: "Quotes and invoices",
    actions: ["quote_submitted", "invoice_created"],
  },
  resident: {
    title: "Resident Activity",
    description: "Maintenance and communication",
    actions: ["maintenance_request", "message_sent"],
  },
};

// Get activity categories for a specific role
const getActivityCategoriesForRole = (role) => {
  const categories = [ACTIVITY_CATEGORIES.common];
  if (role && ACTIVITY_CATEGORIES[role]) {
    categories.push(ACTIVITY_CATEGORIES[role]);
  }
  return categories;
};

function Users() {
  const { getToken, canManageUsers, isAdminOrHigher } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    emailVerified: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: null, // 'suspend' or 'activate'
    user: null,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.role) params.append("role", filters.role);
      if (filters.emailVerified) params.append("emailVerified", filters.emailVerified);

      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Users fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  const fetchUserActivity = async (userId) => {
    setLoadingActivity(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/activity?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserActivity(data.activities || []);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setActiveTab("details");
    await fetchUserActivity(user.id);
  };

  // Open confirmation modal for suspend
  const openSuspendModal = (user) => {
    setConfirmModal({ show: true, type: "suspend", user });
  };

  // Open confirmation modal for activate
  const openActivateModal = (user) => {
    setConfirmModal({ show: true, type: "activate", user });
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({ show: false, type: null, user: null });
  };

  const handleSuspendUser = async (userId) => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Suspended by admin" }),
      });

      if (res.ok) {
        // Update user in list
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u))
        );
        if (selectedUser?.id === userId) {
          setSelectedUser((prev) => ({ ...prev, status: "suspended" }));
        }
        closeConfirmModal();
      }
    } catch (err) {
      console.error("Suspend error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateUser = async (userId) => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Update user in list
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
        );
        if (selectedUser?.id === userId) {
          setSelectedUser((prev) => ({ ...prev, status: "active" }));
        }
        closeConfirmModal();
      }
    } catch (err) {
      console.error("Activate error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle confirm action from modal
  const handleConfirmAction = () => {
    if (!confirmModal.user) return;
    if (confirmModal.type === "suspend") {
      handleSuspendUser(confirmModal.user.id);
    } else if (confirmModal.type === "activate") {
      handleActivateUser(confirmModal.user.id);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", role: "", emailVerified: "" });
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      property_manager: "admin-badge-primary",
      entrepreneur: "admin-badge-success",
      supplier: "admin-badge-warning",
      resident: "admin-badge-info",
    };
    return classes[role] || "admin-badge-secondary";
  };

  const formatRole = (role) => {
    return role?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A";
  };

  const getStatusBadge = (user) => {
    if (user.status === "suspended") {
      return <span className="admin-badge admin-badge-danger">Suspended</span>;
    }
    if (!user.email_verified) {
      return <span className="admin-badge admin-badge-warning">Unverified</span>;
    }
    return <span className="admin-badge admin-badge-success">Active</span>;
  };

  const hasActiveFilters = filters.role || filters.emailVerified;

  if (!canManageUsers()) {
    return (
      <div className="admin-users-error">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">
            View and manage platform users across all roles
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchUsers}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-users-toolbar">
        <form onSubmit={handleSearch} className="admin-users-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by name, email, or company..."
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
          Filters {hasActiveFilters && `(${[filters.role, filters.emailVerified].filter(Boolean).length})`}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="admin-users-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Role</label>
            <select
              className="admin-input"
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="property_manager">Property Manager</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="supplier">Supplier</option>
              <option value="resident">Resident</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Email Status</label>
            <select
              className="admin-input"
              value={filters.emailVerified}
              onChange={(e) => handleFilterChange("emailVerified", e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
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
        <div className="admin-users-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-loading">
                      <div className="admin-spinner" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-empty">
                      <User size={48} />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </div>
                        <div className="admin-user-info">
                          <div className="admin-user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="admin-user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${getRoleBadgeClass(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td>{getStatusBadge(user)}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{user.last_login ? formatTimeAgo(user.last_login) : "Never"}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => handleViewUser(user)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdminOrHigher() && user.status !== "suspended" && (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-danger-text"
                            onClick={() => openSuspendModal(user)}
                            disabled={actionLoading}
                            title="Suspend User"
                          >
                            <UserX size={16} />
                          </button>
                        )}
                        {isAdminOrHigher() && user.status === "suspended" && (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-success-text"
                            onClick={() => openActivateModal(user)}
                            disabled={actionLoading}
                            title="Activate User"
                          >
                            <UserCheck size={16} />
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
              {pagination.total} users
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">User Details</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="admin-modal-tabs">
              <button
                className={`admin-modal-tab ${activeTab === "details" ? "active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                <User size={16} />
                Details
              </button>
              <button
                className={`admin-modal-tab ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                <Activity size={16} />
                Activity Log
              </button>
              <button
                className={`admin-modal-tab ${activeTab === "role-activity" ? "active" : ""}`}
                onClick={() => setActiveTab("role-activity")}
              >
                <LayoutList size={16} />
                By Category
              </button>
            </div>

            <div className="admin-modal-body">
              {activeTab === "details" && (
                <div className="admin-user-details">
                  {/* User Header */}
                  <div className="admin-user-detail-header">
                    <div className="admin-user-avatar-lg">
                      {selectedUser.first_name?.[0]}
                      {selectedUser.last_name?.[0]}
                    </div>
                    <div className="admin-user-header-info">
                      <h3>
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h3>
                      <div className="admin-user-header-badges">
                        <span className={`admin-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                          {formatRole(selectedUser.role)}
                        </span>
                        {getStatusBadge(selectedUser)}
                      </div>
                    </div>
                  </div>

                  {/* User Info Grid */}
                  <div className="admin-user-info-grid">
                    <div className="admin-user-info-item">
                      <Hash size={16} />
                      <div>
                        <label>User ID</label>
                        <span className="admin-user-id">{selectedUser.id}</span>
                      </div>
                    </div>
                    <div className="admin-user-info-item">
                      <Mail size={16} />
                      <div>
                        <label>Email</label>
                        <span>{selectedUser.email}</span>
                      </div>
                    </div>
                    {selectedUser.phone && (
                      <div className="admin-user-info-item">
                        <Phone size={16} />
                        <div>
                          <label>Phone</label>
                          <span>{selectedUser.phone}</span>
                        </div>
                      </div>
                    )}
                    {selectedUser.address && (
                      <div className="admin-user-info-item">
                        <MapPin size={16} />
                        <div>
                          <label>Address</label>
                          <span>{selectedUser.address}</span>
                        </div>
                      </div>
                    )}
                    <div className="admin-user-info-item">
                      <Calendar size={16} />
                      <div>
                        <label>Joined</label>
                        <span>{formatDateTime(selectedUser.created_at)}</span>
                      </div>
                    </div>
                    <div className="admin-user-info-item">
                      <Clock size={16} />
                      <div>
                        <label>Last Login</label>
                        <span>
                          {selectedUser.last_login
                            ? formatDateTime(selectedUser.last_login)
                            : "Never"}
                        </span>
                      </div>
                    </div>
                    <div className="admin-user-info-item">
                      {selectedUser.email_verified ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <AlertCircle size={16} className="text-warning" />
                      )}
                      <div>
                        <label>Email Verification</label>
                        <span>
                          {selectedUser.email_verified ? "Verified" : "Not Verified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Company Info (for entrepreneurs/suppliers) */}
                  {selectedUser.company_name && (
                    <div className="admin-user-section">
                      <h4>Company Information</h4>
                      <div className="admin-user-info-grid">
                        <div className="admin-user-info-item">
                          <Briefcase size={16} />
                          <div>
                            <label>Company Name</label>
                            <span>{selectedUser.company_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {isAdminOrHigher() && (
                    <div className="admin-user-actions">
                      {selectedUser.status !== "suspended" ? (
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => openSuspendModal(selectedUser)}
                          disabled={actionLoading}
                        >
                          <UserX size={16} />
                          Suspend User
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-success"
                          onClick={() => openActivateModal(selectedUser)}
                          disabled={actionLoading}
                        >
                          <UserCheck size={16} />
                          Activate User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="admin-user-activity">
                  {loadingActivity ? (
                    <div className="admin-activity-loading">
                      <div className="admin-spinner" />
                      <span>Loading activity...</span>
                    </div>
                  ) : userActivity.length === 0 ? (
                    <div className="admin-activity-empty">
                      <Activity size={48} />
                      <p>No activity recorded</p>
                    </div>
                  ) : (
                    <div className="admin-activity-timeline">
                      {userActivity.map((activity, index) => {
                        const IconComponent = getActivityIcon(activity.action);
                        const colorClass = getActivityColor(activity.action);
                        return (
                          <div key={index} className="admin-activity-timeline-item">
                            <div className={`admin-activity-timeline-icon ${colorClass}`}>
                              <IconComponent size={14} />
                            </div>
                            <div className="admin-activity-timeline-content">
                              <div className="admin-activity-timeline-header">
                                <span className="admin-activity-action">
                                  {activity.action?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                                <span className="admin-activity-time">
                                  {formatTimeAgo(activity.created_at)}
                                </span>
                              </div>
                              {activity.entity_type && (
                                <div className="admin-activity-entity">
                                  {activity.entity_type}: {activity.entity_id}
                                </div>
                              )}
                              {activity.ip_address && (
                                <div className="admin-activity-meta">
                                  IP: {activity.ip_address}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "role-activity" && (
                <div className="admin-user-activity">
                  {loadingActivity ? (
                    <div className="admin-activity-loading">
                      <div className="admin-spinner" />
                      <span>Loading activity...</span>
                    </div>
                  ) : (
                    <div className="admin-activity-categories">
                      {getActivityCategoriesForRole(selectedUser.role).map((category, catIndex) => {
                        const categoryActivities = userActivity.filter((a) =>
                          category.actions.includes(a.action)
                        );
                        return (
                          <div key={catIndex} className="admin-activity-category">
                            <div className="admin-activity-category-header">
                              <h4>{category.title}</h4>
                              <span className="admin-activity-category-desc">
                                {category.description}
                              </span>
                              <span className="admin-activity-category-count">
                                {categoryActivities.length} activities
                              </span>
                            </div>
                            {categoryActivities.length === 0 ? (
                              <div className="admin-activity-category-empty">
                                No activities in this category
                              </div>
                            ) : (
                              <div className="admin-activity-category-list">
                                {categoryActivities.slice(0, 10).map((activity, index) => {
                                  const IconComponent = getActivityIcon(activity.action);
                                  const colorClass = getActivityColor(activity.action);
                                  return (
                                    <div key={index} className="admin-activity-category-item">
                                      <div className={`admin-activity-category-icon ${colorClass}`}>
                                        <IconComponent size={12} />
                                      </div>
                                      <span className="admin-activity-category-action">
                                        {activity.action?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                      </span>
                                      <span className="admin-activity-category-time">
                                        {formatTimeAgo(activity.created_at)}
                                      </span>
                                    </div>
                                  );
                                })}
                                {categoryActivities.length > 10 && (
                                  <div className="admin-activity-category-more">
                                    +{categoryActivities.length - 10} more activities
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspend/Activate */}
      {confirmModal.show && confirmModal.user && (
        <div className="admin-modal-overlay" onClick={closeConfirmModal}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-modal-header">
              <div className={`admin-confirm-modal-icon ${confirmModal.type === "suspend" ? "danger" : "success"}`}>
                {confirmModal.type === "suspend" ? (
                  <AlertTriangle size={24} />
                ) : (
                  <UserCheck size={24} />
                )}
              </div>
              <h3>
                {confirmModal.type === "suspend" ? "Suspend User" : "Activate User"}
              </h3>
            </div>

            <div className="admin-confirm-modal-body">
              <p className="admin-confirm-modal-message">
                {confirmModal.type === "suspend"
                  ? "Are you sure you want to suspend this user? They will no longer be able to access the platform."
                  : "Are you sure you want to activate this user? They will regain access to the platform."}
              </p>

              {/* User Info Card */}
              <div className="admin-confirm-user-card">
                <div className="admin-confirm-user-avatar">
                  {confirmModal.user.first_name?.[0]}
                  {confirmModal.user.last_name?.[0]}
                </div>
                <div className="admin-confirm-user-info">
                  <div className="admin-confirm-user-name">
                    {confirmModal.user.first_name} {confirmModal.user.last_name}
                  </div>
                  <div className="admin-confirm-user-email">
                    {confirmModal.user.email}
                  </div>
                  <div className="admin-confirm-user-meta">
                    <span className={`admin-badge admin-badge-sm ${getRoleBadgeClass(confirmModal.user.role)}`}>
                      {formatRole(confirmModal.user.role)}
                    </span>
                    <span className="admin-confirm-user-id">
                      <Hash size={12} /> ID: {confirmModal.user.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-confirm-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={closeConfirmModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`admin-btn ${confirmModal.type === "suspend" ? "admin-btn-danger" : "admin-btn-success"}`}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="admin-spinner-sm" />
                    Processing...
                  </>
                ) : confirmModal.type === "suspend" ? (
                  <>
                    <UserX size={16} />
                    Suspend User
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Activate User
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

export default Users;
