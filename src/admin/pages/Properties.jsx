import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Flag,
  X,
  Calendar,
  MapPin,
  User,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Home,
  Layers,
  DollarSign,
  Star,
  Hash,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-properties.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Status badge colors for jobs (case-insensitive)
const getJobStatusBadgeClass = (status) => {
  if (!status) return "admin-badge-secondary";
  const statusLower = status.toLowerCase();

  const classes = {
    open: "admin-badge-success",
    pending: "admin-badge-warning",
    ongoing: "admin-badge-primary",
    "in progress": "admin-badge-primary",
    accepted: "admin-badge-info",
    completed: "admin-badge-secondary",
    closed: "admin-badge-secondary",
    done: "admin-badge-secondary",
    cancelled: "admin-badge-danger",
    canceled: "admin-badge-danger",
    declined: "admin-badge-danger",
    expired: "admin-badge-danger",
  };
  return classes[statusLower] || "admin-badge-secondary";
};

// Format status for display (capitalize first letter)
const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

function Properties() {
  const { getToken, isModeratorOrHigher } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    buildingType: "",
    hasActiveJobs: "",
    isFlagged: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Property detail modal
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyJobs, setPropertyJobs] = useState([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action modals
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Manager detail modal
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerDetails, setManagerDetails] = useState(null);
  const [loadingManager, setLoadingManager] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.city) params.append("city", filters.city);
      if (filters.buildingType) params.append("buildingType", filters.buildingType);
      if (filters.hasActiveJobs) params.append("hasActiveJobs", filters.hasActiveJobs);
      if (filters.isFlagged) params.append("isFlagged", filters.isFlagged);

      const res = await fetch(`${API_URL}/api/admin/properties?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch properties");
      }

      const data = await res.json();
      setProperties(data.properties || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Properties fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  const fetchStats = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/properties/stats`, {
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

  const fetchFilterOptions = async () => {
    const token = getToken();
    try {
      const [citiesRes, typesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/properties/cities`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/properties/building-types`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (citiesRes.ok) {
        const data = await citiesRes.json();
        setCities(data.cities || []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setBuildingTypes(data.buildingTypes || []);
      }
    } catch (err) {
      console.error("Filter options fetch error:", err);
    }
  };

  const fetchPropertyDetails = async (propertyId) => {
    setLoadingDetails(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedProperty(data.property);
        setPropertyJobs(data.jobs || []);
        setAdminNotes(data.property.admin_notes || "");
      }
    } catch (err) {
      console.error("Property details fetch error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewProperty = async (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
    setActiveTab("details");
    await fetchPropertyDetails(property.id);
  };

  const handleFlagProperty = async () => {
    if (!actionReason.trim()) return;

    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/properties/${selectedProperty.id}/flag`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: actionReason }),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === selectedProperty.id ? { ...p, is_flagged: true, flag_reason: actionReason } : p
          )
        );
        setSelectedProperty((prev) => ({ ...prev, is_flagged: true, flag_reason: actionReason }));
        setShowFlagModal(false);
        setActionReason("");
        fetchStats();
      }
    } catch (err) {
      console.error("Flag property error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnflagProperty = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/properties/${selectedProperty.id}/unflag`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === selectedProperty.id ? { ...p, is_flagged: false, flag_reason: null } : p
          )
        );
        setSelectedProperty((prev) => ({ ...prev, is_flagged: false, flag_reason: null }));
        fetchStats();
      }
    } catch (err) {
      console.error("Unflag property error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/admin/properties/${selectedProperty.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: adminNotes }),
      });

      if (res.ok) {
        setSelectedProperty((prev) => ({ ...prev, admin_notes: adminNotes }));
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
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProperties();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", city: "", buildingType: "", hasActiveJobs: "", isFlagged: "" });
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

  const hasActiveFilters = filters.city || filters.buildingType || filters.hasActiveJobs || filters.isFlagged;

  if (!isModeratorOrHigher()) {
    return (
      <div className="admin-properties-error">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage properties.</p>
      </div>
    );
  }

  return (
    <div className="admin-properties">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Properties Management</h1>
          <p className="admin-page-subtitle">
            View and manage all properties on the platform
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={() => { fetchProperties(); fetchStats(); }}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-properties-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-primary">
              <Building2 size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseInt(stats.total_properties).toLocaleString()}</div>
              <div className="admin-stat-label">Total Properties</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-success">
              <Briefcase size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseInt(stats.properties_with_active_jobs).toLocaleString()}</div>
              <div className="admin-stat-label">With Active Jobs</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-info">
              <Layers size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{parseInt(stats.total_units || 0).toLocaleString()}</div>
              <div className="admin-stat-label">Total Units</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-warning">
              <MapPin size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.top_city}</div>
              <div className="admin-stat-label">Top City ({stats.top_city_count})</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-properties-toolbar">
        <form onSubmit={handleSearch} className="admin-properties-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by address, building name, or city..."
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
            `(${[filters.city, filters.buildingType, filters.hasActiveJobs, filters.isFlagged].filter(Boolean).length})`}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="admin-properties-filters">
          <div className="admin-filter-group">
            <label className="admin-filter-label">City</label>
            <select
              className="admin-input"
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Building Type</label>
            <select
              className="admin-input"
              value={filters.buildingType}
              onChange={(e) => handleFilterChange("buildingType", e.target.value)}
            >
              <option value="">All Types</option>
              {buildingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Active Jobs</label>
            <select
              className="admin-input"
              value={filters.hasActiveJobs}
              onChange={(e) => handleFilterChange("hasActiveJobs", e.target.value)}
            >
              <option value="">All</option>
              <option value="true">With Active Jobs</option>
              <option value="false">No Active Jobs</option>
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
        <div className="admin-properties-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchProperties}>Retry</button>
        </div>
      )}

      {/* Properties Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Building Type</th>
                <th>Property Manager</th>
                <th>Units</th>
                <th>Jobs</th>
                <th>Active</th>
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
                      <span>Loading properties...</span>
                    </div>
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-empty">
                      <Building2 size={48} />
                      <p>No properties found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className={property.is_flagged ? "flagged-row" : ""}>
                    <td>
                      <div className="admin-property-cell">
                        {property.is_flagged && (
                          <Flag size={14} className="admin-flag-icon" />
                        )}
                        <div className="admin-property-info">
                          <div className="admin-property-name">
                            {property.building_name || property.address}
                          </div>
                          <div className="admin-property-location">
                            {property.city}{property.province && `, ${property.province}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-secondary">
                        {property.building_type}
                      </span>
                    </td>
                    <td>
                      <div className="admin-manager-cell">
                        <div className="admin-manager-name">
                          {property.manager_first_name} {property.manager_last_name}
                        </div>
                        <div className="admin-manager-company">
                          {property.manager_company || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-unit-count">{property.num_units || 0}</span>
                    </td>
                    <td>
                      <span className="admin-job-count">{property.total_jobs || 0}</span>
                    </td>
                    <td>
                      {parseInt(property.active_jobs) > 0 ? (
                        <span className="admin-badge admin-badge-success">{property.active_jobs}</span>
                      ) : (
                        <span className="admin-badge admin-badge-secondary">0</span>
                      )}
                    </td>
                    <td>{formatDate(property.created_at)}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => handleViewProperty(property)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!property.is_flagged && (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm admin-btn-warning-text"
                            onClick={() => {
                              setSelectedProperty(property);
                              setShowFlagModal(true);
                            }}
                            title="Flag Property"
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
              {pagination.total} properties
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

      {/* Property Detail Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="admin-modal-overlay" onClick={() => setShowPropertyModal(false)}>
          <div className="admin-property-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Property Details</h2>
              <button className="admin-modal-close" onClick={() => setShowPropertyModal(false)}>
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
                className={`admin-modal-tab ${activeTab === "manager" ? "active" : ""}`}
                onClick={() => setActiveTab("manager")}
              >
                <User size={16} />
                Manager
              </button>
              <button
                className={`admin-modal-tab ${activeTab === "jobs" ? "active" : ""}`}
                onClick={() => setActiveTab("jobs")}
              >
                <Briefcase size={16} />
                Jobs ({propertyJobs.length})
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
                    <div className="admin-property-details">
                      {/* Property Header */}
                      <div className="admin-property-detail-header">
                        <div className="admin-property-header-icon">
                          <Building2 size={32} />
                        </div>
                        <div className="admin-property-header-info">
                          <h3>{selectedProperty.building_name || selectedProperty.address}</h3>
                          <div className="admin-property-badges">
                            <span className="admin-badge admin-badge-secondary">
                              {selectedProperty.building_type}
                            </span>
                            {selectedProperty.is_flagged && (
                              <span className="admin-badge admin-badge-warning">
                                <Flag size={12} /> Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Property ID */}
                      <div className="admin-property-section">
                        <div className="admin-property-info-grid">
                          <div className="admin-property-info-item">
                            <Hash size={16} />
                            <div>
                              <label>Property ID</label>
                              <span className="admin-item-id">{selectedProperty.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="admin-property-section">
                        <h4>Location</h4>
                        <div className="admin-property-info-grid">
                          <div className="admin-property-info-item">
                            <MapPin size={16} />
                            <div>
                              <label>Address</label>
                              <span>{selectedProperty.address}</span>
                            </div>
                          </div>
                          <div className="admin-property-info-item">
                            <Home size={16} />
                            <div>
                              <label>City</label>
                              <span>{selectedProperty.city}</span>
                            </div>
                          </div>
                          {selectedProperty.province && (
                            <div className="admin-property-info-item">
                              <MapPin size={16} />
                              <div>
                                <label>Province</label>
                                <span>{selectedProperty.province}</span>
                              </div>
                            </div>
                          )}
                          {selectedProperty.postal_code && (
                            <div className="admin-property-info-item">
                              <FileText size={16} />
                              <div>
                                <label>Postal Code</label>
                                <span>{selectedProperty.postal_code}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Building Info */}
                      <div className="admin-property-section">
                        <h4>Building Information</h4>
                        <div className="admin-property-info-grid">
                          <div className="admin-property-info-item">
                            <Building2 size={16} />
                            <div>
                              <label>Building Type</label>
                              <span>{selectedProperty.building_type}</span>
                            </div>
                          </div>
                          <div className="admin-property-info-item">
                            <Layers size={16} />
                            <div>
                              <label>Units</label>
                              <span>{selectedProperty.num_units || 0}</span>
                            </div>
                          </div>
                          <div className="admin-property-info-item">
                            <Briefcase size={16} />
                            <div>
                              <label>Total Jobs</label>
                              <span>{selectedProperty.total_jobs || 0}</span>
                            </div>
                          </div>
                          <div className="admin-property-info-item">
                            <CheckCircle size={16} />
                            <div>
                              <label>Completed Jobs</label>
                              <span>{selectedProperty.completed_jobs || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="admin-property-section">
                        <h4>Timeline</h4>
                        <div className="admin-property-info-grid">
                          <div className="admin-property-info-item">
                            <Calendar size={16} />
                            <div>
                              <label>Created</label>
                              <span>{formatDateTime(selectedProperty.created_at)}</span>
                            </div>
                          </div>
                          {selectedProperty.updated_at && (
                            <div className="admin-property-info-item">
                              <Clock size={16} />
                              <div>
                                <label>Last Updated</label>
                                <span>{formatDateTime(selectedProperty.updated_at)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "manager" && (
                    <div className="admin-property-manager">
                      <div
                        className="admin-manager-card clickable"
                        onClick={() => handleViewManager(selectedProperty.manager_user_id)}
                      >
                        <div className="admin-manager-card-avatar">
                          {selectedProperty.manager_first_name?.[0]}
                          {selectedProperty.manager_last_name?.[0]}
                        </div>
                        <div className="admin-manager-card-info">
                          <div className="admin-manager-card-name">
                            {selectedProperty.manager_first_name} {selectedProperty.manager_last_name}
                          </div>
                          <div className="admin-manager-card-company">
                            {selectedProperty.manager_company || "N/A"}
                          </div>
                          {selectedProperty.manager_email && (
                            <div className="admin-manager-card-email">
                              {selectedProperty.manager_email}
                            </div>
                          )}
                        </div>
                        <div className="admin-manager-card-action">
                          <ExternalLink size={16} />
                          <span>View Profile</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "jobs" && (
                    <div className="admin-property-jobs">
                      {propertyJobs.length === 0 ? (
                        <div className="admin-jobs-empty">
                          <Briefcase size={48} />
                          <p>No jobs for this property</p>
                        </div>
                      ) : (
                        <div className="admin-jobs-list">
                          {propertyJobs.map((job) => (
                            <div key={job.id} className="admin-job-item">
                              <div className="admin-job-item-header">
                                <div className="admin-job-item-title">{job.title}</div>
                                <span className={`admin-badge ${getJobStatusBadgeClass(job.status)}`}>
                                  {formatStatus(job.status)}
                                </span>
                              </div>
                              <div className="admin-job-item-meta">
                                <span className="admin-job-item-category">{job.category}</span>
                                <span className="admin-job-item-budget">
                                  {job.is_budget_hidden
                                    ? "Budget Hidden"
                                    : `${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`}
                                </span>
                                <span className="admin-job-item-bids">{job.bid_count} bids</span>
                              </div>
                              <div className="admin-job-item-dates">
                                <span>Created: {formatDate(job.created_at)}</span>
                                {job.due_date && <span>Due: {formatDate(job.due_date)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "moderation" && (
                    <div className="admin-property-moderation">
                      {/* Flag Status */}
                      <div className="admin-moderation-section">
                        <h4>Flag Status</h4>
                        {selectedProperty.is_flagged ? (
                          <div className="admin-flag-status flagged">
                            <div className="admin-flag-info">
                              <Flag size={20} />
                              <div>
                                <strong>This property is flagged</strong>
                                <p>{selectedProperty.flag_reason}</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-secondary"
                              onClick={handleUnflagProperty}
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
                                <strong>This property is not flagged</strong>
                                <p>No issues reported</p>
                              </div>
                            </div>
                            <button
                              className="admin-btn admin-btn-warning"
                              onClick={() => setShowFlagModal(true)}
                            >
                              <Flag size={16} />
                              Flag Property
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      <div className="admin-moderation-section">
                        <h4>Admin Notes</h4>
                        <div className="admin-notes-container">
                          <p className="admin-notes-content">
                            {selectedProperty.admin_notes || "No admin notes added."}
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
              <h2 className="admin-modal-title">Flag Property</h2>
              <button className="admin-modal-close" onClick={() => setShowFlagModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Flagging this property will mark it for review. Please provide a reason:</p>
              <textarea
                className="admin-textarea"
                placeholder="Enter reason for flagging (e.g., suspicious listing, incorrect information)..."
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
                onClick={handleFlagProperty}
                disabled={!actionReason.trim() || actionLoading}
              >
                {actionLoading ? "Flagging..." : "Flag Property"}
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

export default Properties;
