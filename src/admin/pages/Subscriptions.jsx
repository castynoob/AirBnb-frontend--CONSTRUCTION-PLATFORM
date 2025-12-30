import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  ExternalLink,
  Hash,
  Filter,
  AlertCircle,
  Users,
  Crown,
  Star,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Play,
  Pause,
  RotateCcw,
  Ban,
  UserX,
  RefreshCcw,
  ArrowRightLeft,
  MoreVertical,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-subscriptions.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  if (!status) return "admin-badge-secondary";
  const statusLower = status.toLowerCase();
  const classes = {
    active: "admin-badge-success",
    trialing: "admin-badge-info",
    past_due: "admin-badge-warning",
    canceled: "admin-badge-danger",
    incomplete: "admin-badge-secondary",
  };
  return classes[statusLower] || "admin-badge-secondary";
};

// Plan badge colors
const getPlanBadgeClass = (plan) => {
  if (!plan) return "admin-badge-secondary";
  const planLower = plan.toLowerCase();
  if (planLower === "premium") return "admin-badge-premium";
  if (planLower === "basic") return "admin-badge-basic";
  return "admin-badge-secondary";
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format currency for charts (shorter)
const formatCurrencyShort = (amount) => {
  if (!amount && amount !== 0) return "$0";
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// Format date
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format date and time
const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format chart date based on period
const formatChartDate = (value, period) => {
  const date = new Date(value);
  switch (period) {
    case "day":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "week":
      return `Wk ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "month":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    default:
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};

// Pie chart colors
const PIE_COLORS = ["#00a5a9", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

function Subscriptions() {
  const { getToken } = useAdminAuth();
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("day");

  // Modal state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [extendDays, setExtendDays] = useState(7);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (planFilter) params.append("plan_type", planFilter);

      const res = await fetch(`${API_URL}/api/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch subscriptions");

      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, searchTerm, statusFilter, planFilter]);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, [getToken]);

  const fetchGrowthChart = useCallback(async (period) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/growth?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrowthData(data.growthData || []);
      }
    } catch (err) {
      console.error("Fetch growth chart error:", err);
    }
  }, [getToken]);

  const fetchDistribution = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/distribution`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Transform for pie chart
        const transformed = (data.distribution || []).reduce((acc, item) => {
          const existing = acc.find(a => a.name === item.planType);
          if (existing) {
            existing.value += item.count;
          } else {
            acc.push({ name: item.planType || 'Unknown', value: item.count });
          }
          return acc;
        }, []);
        setDistributionData(transformed);
      }
    } catch (err) {
      console.error("Fetch distribution error:", err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    fetchStats();
    fetchDistribution();
  }, [fetchStats, fetchDistribution]);

  useEffect(() => {
    fetchGrowthChart(chartPeriod);
  }, [fetchGrowthChart, chartPeriod]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSubscriptions();
  };

  const handleRefresh = () => {
    fetchSubscriptions();
    fetchStats();
    fetchGrowthChart(chartPeriod);
    fetchDistribution();
  };

  const handleViewSubscription = async (subscription) => {
    setSelectedSubscription(subscription);
    setShowModal(true);
    setLoadingDetails(true);

    // Fetch full subscription details
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscription.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Fetch subscription details error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubscription(null);
    setShowConfirmModal(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Get plan price
  const getPlanPrice = (planType) => {
    if (planType === "basic") return 250;
    if (planType === "premium") return 429;
    return 0;
  };

  // Navigate to user profile
  const handleViewUser = (userId) => {
    navigate(`/admin/users?id=${userId}`);
  };

  // Suspend user
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
        body: JSON.stringify({ reason: "Suspended from subscription management" }),
      });

      if (res.ok) {
        toast.success("User suspended successfully");
        setShowConfirmModal(null);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to suspend user");
      }
    } catch (err) {
      console.error("Suspend user error:", err);
      toast.error("Failed to suspend user");
    } finally {
      setActionLoading(false);
    }
  };

  // Activate user
  const handleActivateUser = async (userId) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("User activated successfully");
        setShowConfirmModal(null);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to activate user");
      }
    } catch (err) {
      console.error("Activate user error:", err);
      toast.error("Failed to activate user");
    } finally {
      setActionLoading(false);
    }
  };

  // Extend trial
  const handleExtendTrial = async (subscriptionId) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/extend-trial`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days: extendDays }),
      });

      if (res.ok) {
        toast.success(`Trial extended by ${extendDays} days`);
        setShowConfirmModal(null);
        setExtendDays(7);
        fetchSubscriptions();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to extend trial");
      }
    } catch (err) {
      console.error("Extend trial error:", err);
      toast.error("Failed to extend trial");
    } finally {
      setActionLoading(false);
    }
  };

  // End trial
  const handleEndTrial = async (subscriptionId, convertToActive) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/end-trial`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ convertToActive }),
      });

      if (res.ok) {
        toast.success(convertToActive ? "Trial ended, subscription activated" : "Trial ended, subscription canceled");
        setShowConfirmModal(null);
        fetchSubscriptions();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to end trial");
      }
    } catch (err) {
      console.error("End trial error:", err);
      toast.error("Failed to end trial");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (subscriptionId, immediate = false) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ immediate }),
      });

      if (res.ok) {
        toast.success(immediate ? "Subscription canceled immediately" : "Subscription will cancel at period end");
        setShowConfirmModal(null);
        fetchSubscriptions();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to cancel subscription");
      }
    } catch (err) {
      console.error("Cancel subscription error:", err);
      toast.error("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Reactivate subscription
  const handleReactivateSubscription = async (subscriptionId) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Subscription reactivated");
        setShowConfirmModal(null);
        fetchSubscriptions();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to reactivate subscription");
      }
    } catch (err) {
      console.error("Reactivate subscription error:", err);
      toast.error("Failed to reactivate subscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Change plan
  const handleChangePlan = async (subscriptionId, newPlanType) => {
    setActionLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/change-plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType: newPlanType }),
      });

      if (res.ok) {
        toast.success(`Plan changed to ${newPlanType}`);
        setShowConfirmModal(null);
        fetchSubscriptions();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to change plan");
      }
    } catch (err) {
      console.error("Change plan error:", err);
      toast.error("Failed to change plan");
    } finally {
      setActionLoading(false);
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="admin-subscriptions">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-content">
          <h1>Subscriptions</h1>
          <p>Monitor and manage entrepreneur subscription plans</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="admin-subscriptions-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-primary">
            <Users size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats?.total || 0}</div>
            <div className="admin-kpi-label">Total Subscriptions</div>
            <div className="admin-kpi-change neutral">
              All time
            </div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-success">
            <CheckCircle size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats?.active || 0}</div>
            <div className="admin-kpi-label">Active</div>
            <div className="admin-kpi-change positive">
              <ArrowUpRight size={14} />
              {stats?.newThisMonth || 0} new this month
            </div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-basic">
            <Star size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats?.basicPlans || 0}</div>
            <div className="admin-kpi-label">Basic Plans</div>
            <div className="admin-kpi-change neutral">
              $250/month
            </div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-premium">
            <Crown size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats?.premiumPlans || 0}</div>
            <div className="admin-kpi-label">Premium Plans</div>
            <div className="admin-kpi-change neutral">
              $429/month
            </div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-kpi-icon-danger">
            <XCircle size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats?.canceled || 0}</div>
            <div className="admin-kpi-label">Canceled</div>
            <div className="admin-kpi-change negative">
              <ArrowDownRight size={14} />
              {stats?.canceledThisMonth || 0} this month
            </div>
          </div>
        </div>

        <div className="admin-kpi-card admin-kpi-card-highlight">
          <div className="admin-kpi-icon admin-kpi-icon-success">
            <DollarSign size={24} />
          </div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{formatCurrency(stats?.mrr || 0)}</div>
            <div className="admin-kpi-label">Monthly Recurring Revenue</div>
            <div className="admin-kpi-change positive">
              ARR: {formatCurrency(stats?.arr || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="admin-subscriptions-charts">
        {/* Subscription Growth Chart */}
        <div className="admin-chart-card admin-subscriptions-growth-chart">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Subscription Growth</h3>
            <div className="admin-chart-period-selector">
              <button
                className={`admin-period-btn ${chartPeriod === "day" ? "active" : ""}`}
                onClick={() => setChartPeriod("day")}
              >
                Daily
              </button>
              <button
                className={`admin-period-btn ${chartPeriod === "week" ? "active" : ""}`}
                onClick={() => setChartPeriod("week")}
              >
                Weekly
              </button>
              <button
                className={`admin-period-btn ${chartPeriod === "month" ? "active" : ""}`}
                onClick={() => setChartPeriod("month")}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a5a9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00a5a9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(value) => formatChartDate(value, chartPeriod)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="admin-chart-tooltip">
                            <div className="admin-chart-tooltip-title">
                              {formatDate(data.period)}
                            </div>
                            <div className="admin-chart-tooltip-row">
                              <span>Active:</span>
                              <span className="admin-chart-tooltip-value">
                                {data.active || 0}
                              </span>
                            </div>
                            <div className="admin-chart-tooltip-row">
                              <span>New:</span>
                              <span>{data.newSubscriptions || 0}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stroke="#00a5a9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActive)"
                    name="Active Subscriptions"
                  />
                  <Area
                    type="monotone"
                    dataKey="newSubscriptions"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    name="New Subscriptions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Plan Distribution Pie Chart */}
        <div className="admin-chart-card admin-subscriptions-pie-chart">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Plan Distribution</h3>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container admin-pie-container">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={true}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="admin-chart-tooltip">
                              <div className="admin-chart-tooltip-title">
                                {data.name}
                              </div>
                              <div className="admin-chart-tooltip-row">
                                <span>Count:</span>
                                <span className="admin-chart-tooltip-value">
                                  {data.value}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="admin-chart-empty">
                  <Users size={48} strokeWidth={1} />
                  <p>No subscription data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-subscriptions-toolbar">
        <form className="admin-subscriptions-search" onSubmit={handleSearch}>
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by name, email, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="admin-subscriptions-filters">
          <div className="admin-filter-group">
            <label>Status</label>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="admin-filter-group">
            <label>Plan</label>
            <select
              className="admin-select"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Plans</option>
              <option value="basic">Basic ($250/mo)</option>
              <option value="premium">Premium ($429/mo)</option>
            </select>
          </div>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => {
              setStatusFilter("");
              setPlanFilter("");
              setSearchTerm("");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="admin-subscriptions-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Started</th>
              <th>Renews</th>
              <th>Stripe ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="admin-table-loading">
                  <div className="admin-spinner" />
                  <span>Loading subscriptions...</span>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-table-empty">
                  <CreditCard size={48} />
                  <p>No subscriptions found</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">
                        {sub.first_name?.[0]}
                        {sub.last_name?.[0]}
                      </div>
                      <div className="admin-user-info">
                        <div className="admin-user-name">
                          {sub.first_name} {sub.last_name}
                        </div>
                        <div className="admin-user-email">{sub.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${getPlanBadgeClass(sub.plan_type)}`}>
                      {sub.plan_type === "premium" && <Crown size={12} />}
                      {sub.plan_type === "basic" && <Star size={12} />}
                      {sub.plan_type || "Unknown"}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(sub.status)}`}>
                      {sub.status === "active" && <CheckCircle size={12} />}
                      {sub.status === "canceled" && <XCircle size={12} />}
                      {sub.status === "past_due" && <AlertTriangle size={12} />}
                      {sub.status || "Unknown"}
                    </span>
                  </td>
                  <td>
                    <span className="admin-amount">
                      ${getPlanPrice(sub.plan_type)}/mo
                    </span>
                  </td>
                  <td>
                    <div className="admin-date-cell">
                      <Calendar size={14} />
                      {formatDate(sub.current_period_start || sub.created_at)}
                    </div>
                  </td>
                  <td>
                    <div className="admin-date-cell">
                      {sub.cancel_at_period_end ? (
                        <span className="admin-text-warning">Cancels</span>
                      ) : (
                        <Clock size={14} />
                      )}
                      {formatDate(sub.current_period_end)}
                    </div>
                  </td>
                  <td>
                    <span className="admin-stripe-id">
                      {sub.stripe_subscription_id
                        ? `${sub.stripe_subscription_id.substring(0, 14)}...`
                        : "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => handleViewSubscription(sub)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {sub.stripe_subscription_id && (
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="View in Stripe"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <div className="admin-action-menu-wrapper">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(showActionMenu === sub.id ? null : sub.id);
                          }}
                          title="More Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showActionMenu === sub.id && (
                          <div className="admin-action-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="admin-action-menu-item"
                              onClick={() => {
                                handleViewUser(sub.user_id);
                                setShowActionMenu(null);
                              }}
                            >
                              <User size={14} />
                              View User Profile
                            </button>
                            {sub.status === "trialing" && (
                              <>
                                <button
                                  className="admin-action-menu-item"
                                  onClick={() => {
                                    setShowConfirmModal({ type: "extend-trial", subscription: sub });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <RotateCcw size={14} />
                                  Extend Trial
                                </button>
                                <button
                                  className="admin-action-menu-item"
                                  onClick={() => {
                                    setShowConfirmModal({ type: "end-trial-active", subscription: sub });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Play size={14} />
                                  End Trial (Activate)
                                </button>
                                <button
                                  className="admin-action-menu-item admin-action-menu-item-danger"
                                  onClick={() => {
                                    setShowConfirmModal({ type: "end-trial-cancel", subscription: sub });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Ban size={14} />
                                  End Trial (Cancel)
                                </button>
                              </>
                            )}
                            {sub.status === "active" && (
                              <>
                                <button
                                  className="admin-action-menu-item"
                                  onClick={() => {
                                    setShowConfirmModal({
                                      type: "change-plan",
                                      subscription: sub,
                                      newPlan: sub.plan_type === "basic" ? "premium" : "basic"
                                    });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <ArrowRightLeft size={14} />
                                  Change to {sub.plan_type === "basic" ? "Premium" : "Basic"}
                                </button>
                                <button
                                  className="admin-action-menu-item admin-action-menu-item-warning"
                                  onClick={() => {
                                    setShowConfirmModal({ type: "cancel-period-end", subscription: sub });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Pause size={14} />
                                  Cancel at Period End
                                </button>
                                <button
                                  className="admin-action-menu-item admin-action-menu-item-danger"
                                  onClick={() => {
                                    setShowConfirmModal({ type: "cancel-immediate", subscription: sub });
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Ban size={14} />
                                  Cancel Immediately
                                </button>
                              </>
                            )}
                            {(sub.status === "canceled" || sub.cancel_at_period_end) && (
                              <button
                                className="admin-action-menu-item admin-action-menu-item-success"
                                onClick={() => {
                                  setShowConfirmModal({ type: "reactivate", subscription: sub });
                                  setShowActionMenu(null);
                                }}
                              >
                                <RefreshCcw size={14} />
                                Reactivate Subscription
                              </button>
                            )}
                            <div className="admin-action-menu-divider" />
                            {sub.user_status === "active" ? (
                              <button
                                className="admin-action-menu-item admin-action-menu-item-danger"
                                onClick={() => {
                                  setShowConfirmModal({ type: "suspend-user", subscription: sub });
                                  setShowActionMenu(null);
                                }}
                              >
                                <UserX size={14} />
                                Suspend User
                              </button>
                            ) : (
                              <button
                                className="admin-action-menu-item admin-action-menu-item-success"
                                onClick={() => {
                                  setShowConfirmModal({ type: "activate-user", subscription: sub });
                                  setShowActionMenu(null);
                                }}
                              >
                                <CheckCircle size={14} />
                                Activate User
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
        <div className="admin-pagination">
          <div className="admin-pagination-info">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} subscriptions
          </div>
          <div className="admin-pagination-controls">
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => handlePageChange(pagination.page - 1)}
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
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Subscription Detail Modal */}
      {showModal && selectedSubscription && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Subscription Details</h2>
              <button className="admin-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-subscription-details">
                {/* Subscription Header */}
                <div className="admin-subscription-header">
                  <div className="admin-subscription-plan-display">
                    {selectedSubscription.plan_type === "premium" ? (
                      <Crown size={32} className="admin-plan-icon-premium" />
                    ) : (
                      <Star size={32} className="admin-plan-icon-basic" />
                    )}
                    <div className="admin-subscription-plan-info">
                      <span className="admin-subscription-plan-name">
                        {selectedSubscription.plan_type?.toUpperCase()} Plan
                      </span>
                      <span className="admin-subscription-plan-price">
                        ${getPlanPrice(selectedSubscription.plan_type)}/month
                      </span>
                    </div>
                  </div>
                  <span className={`admin-badge admin-badge-lg ${getStatusBadgeClass(selectedSubscription.status)}`}>
                    {selectedSubscription.status === "active" && <CheckCircle size={14} />}
                    {selectedSubscription.status === "canceled" && <XCircle size={14} />}
                    {selectedSubscription.status}
                  </span>
                </div>

                {/* User Info */}
                <div className="admin-subscription-section">
                  <h4>Entrepreneur</h4>
                  <div className="admin-user-card">
                    <div className="admin-user-card-avatar">
                      {selectedSubscription.first_name?.[0]}
                      {selectedSubscription.last_name?.[0]}
                    </div>
                    <div className="admin-user-card-info">
                      <div className="admin-user-card-name">
                        {selectedSubscription.first_name} {selectedSubscription.last_name}
                      </div>
                      <div className="admin-user-card-company">
                        {selectedSubscription.entrepreneur_company || "No company"}
                      </div>
                      <div className="admin-user-card-meta">
                        {selectedSubscription.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Info Grid */}
                <div className="admin-subscription-section">
                  <h4>Subscription Info</h4>
                  <div className="admin-subscription-info-grid">
                    <div className="admin-subscription-info-item">
                      <Hash size={16} />
                      <div>
                        <label>Subscription ID</label>
                        <span className="admin-item-id">{selectedSubscription.id}</span>
                      </div>
                    </div>
                    {selectedSubscription.stripe_subscription_id && (
                      <div className="admin-subscription-info-item">
                        <CreditCard size={16} />
                        <div>
                          <label>Stripe Subscription ID</label>
                          <span className="admin-item-id">
                            {selectedSubscription.stripe_subscription_id}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedSubscription.stripe_customer_id && (
                      <div className="admin-subscription-info-item">
                        <User size={16} />
                        <div>
                          <label>Stripe Customer ID</label>
                          <span className="admin-item-id">
                            {selectedSubscription.stripe_customer_id}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="admin-subscription-info-item">
                      <Calendar size={16} />
                      <div>
                        <label>Started</label>
                        <span>{formatDateTime(selectedSubscription.current_period_start || selectedSubscription.created_at)}</span>
                      </div>
                    </div>
                    <div className="admin-subscription-info-item">
                      <Clock size={16} />
                      <div>
                        <label>Current Period Ends</label>
                        <span>{formatDateTime(selectedSubscription.current_period_end)}</span>
                      </div>
                    </div>
                    {selectedSubscription.trial_end && (
                      <div className="admin-subscription-info-item">
                        <Activity size={16} />
                        <div>
                          <label>Trial End</label>
                          <span>{formatDateTime(selectedSubscription.trial_end)}</span>
                        </div>
                      </div>
                    )}
                    {selectedSubscription.canceled_at && (
                      <div className="admin-subscription-info-item">
                        <XCircle size={16} />
                        <div>
                          <label>Canceled At</label>
                          <span className="admin-text-danger">
                            {formatDateTime(selectedSubscription.canceled_at)}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedSubscription.cancel_at_period_end && (
                      <div className="admin-subscription-info-item">
                        <AlertTriangle size={16} />
                        <div>
                          <label>Cancellation</label>
                          <span className="admin-text-warning">
                            Will cancel at period end
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions in Modal */}
                <div className="admin-subscription-quick-actions">
                  <h4>Quick Actions</h4>
                  <div className="admin-quick-actions-grid">
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={() => handleViewUser(selectedSubscription.user_id)}
                    >
                      <User size={16} />
                      View User Profile
                    </button>
                    {selectedSubscription.status === "trialing" && (
                      <>
                        <button
                          className="admin-btn admin-btn-primary"
                          onClick={() => setShowConfirmModal({ type: "extend-trial", subscription: selectedSubscription })}
                        >
                          <RotateCcw size={16} />
                          Extend Trial
                        </button>
                        <button
                          className="admin-btn admin-btn-success"
                          onClick={() => setShowConfirmModal({ type: "end-trial-active", subscription: selectedSubscription })}
                        >
                          <Play size={16} />
                          Activate Now
                        </button>
                      </>
                    )}
                    {selectedSubscription.status === "active" && (
                      <>
                        <button
                          className="admin-btn admin-btn-secondary"
                          onClick={() => setShowConfirmModal({
                            type: "change-plan",
                            subscription: selectedSubscription,
                            newPlan: selectedSubscription.plan_type === "basic" ? "premium" : "basic"
                          })}
                        >
                          <ArrowRightLeft size={16} />
                          Change Plan
                        </button>
                        <button
                          className="admin-btn admin-btn-warning"
                          onClick={() => setShowConfirmModal({ type: "cancel-period-end", subscription: selectedSubscription })}
                        >
                          <Pause size={16} />
                          Schedule Cancel
                        </button>
                      </>
                    )}
                    {(selectedSubscription.status === "canceled" || selectedSubscription.cancel_at_period_end) && (
                      <button
                        className="admin-btn admin-btn-success"
                        onClick={() => setShowConfirmModal({ type: "reactivate", subscription: selectedSubscription })}
                      >
                        <RefreshCcw size={16} />
                        Reactivate
                      </button>
                    )}
                    {selectedSubscription.user_status === "active" ? (
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => setShowConfirmModal({ type: "suspend-user", subscription: selectedSubscription })}
                      >
                        <UserX size={16} />
                        Suspend User
                      </button>
                    ) : (
                      <button
                        className="admin-btn admin-btn-success"
                        onClick={() => setShowConfirmModal({ type: "activate-user", subscription: selectedSubscription })}
                      >
                        <CheckCircle size={16} />
                        Activate User
                      </button>
                    )}
                  </div>
                </div>

                {/* External Links */}
                <div className="admin-subscription-actions">
                  {selectedSubscription.stripe_subscription_id && (
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${selectedSubscription.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary"
                    >
                      <ExternalLink size={16} />
                      View in Stripe Dashboard
                    </a>
                  )}
                  {selectedSubscription.stripe_customer_id && (
                    <a
                      href={`https://dashboard.stripe.com/customers/${selectedSubscription.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-ghost"
                    >
                      <User size={16} />
                      View Customer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="admin-modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-modal-header">
              {showConfirmModal.type === "extend-trial" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-primary">
                    <RotateCcw size={24} />
                  </div>
                  <h3>Extend Trial Period</h3>
                </>
              )}
              {showConfirmModal.type === "end-trial-active" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-success">
                    <Play size={24} />
                  </div>
                  <h3>End Trial & Activate</h3>
                </>
              )}
              {showConfirmModal.type === "end-trial-cancel" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-danger">
                    <Ban size={24} />
                  </div>
                  <h3>End Trial & Cancel</h3>
                </>
              )}
              {showConfirmModal.type === "cancel-period-end" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-warning">
                    <Pause size={24} />
                  </div>
                  <h3>Schedule Cancellation</h3>
                </>
              )}
              {showConfirmModal.type === "cancel-immediate" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-danger">
                    <Ban size={24} />
                  </div>
                  <h3>Cancel Immediately</h3>
                </>
              )}
              {showConfirmModal.type === "reactivate" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-success">
                    <RefreshCcw size={24} />
                  </div>
                  <h3>Reactivate Subscription</h3>
                </>
              )}
              {showConfirmModal.type === "change-plan" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-primary">
                    <ArrowRightLeft size={24} />
                  </div>
                  <h3>Change Subscription Plan</h3>
                </>
              )}
              {showConfirmModal.type === "suspend-user" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-danger">
                    <UserX size={24} />
                  </div>
                  <h3>Suspend User</h3>
                </>
              )}
              {showConfirmModal.type === "activate-user" && (
                <>
                  <div className="admin-confirm-icon admin-confirm-icon-success">
                    <CheckCircle size={24} />
                  </div>
                  <h3>Activate User</h3>
                </>
              )}
            </div>

            <div className="admin-confirm-modal-body">
              {showConfirmModal.type === "extend-trial" && (
                <>
                  <p>Extend the trial period for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>.</p>
                  <div className="admin-form-group">
                    <label>Days to extend:</label>
                    <select
                      className="admin-select"
                      value={extendDays}
                      onChange={(e) => setExtendDays(parseInt(e.target.value))}
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                </>
              )}
              {showConfirmModal.type === "end-trial-active" && (
                <p>This will end the trial immediately and <strong>activate</strong> the subscription for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>. The user will be billed.</p>
              )}
              {showConfirmModal.type === "end-trial-cancel" && (
                <p>This will end the trial immediately and <strong>cancel</strong> the subscription for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>. The user will not be billed.</p>
              )}
              {showConfirmModal.type === "cancel-period-end" && (
                <p>The subscription for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong> will be canceled at the end of the current billing period ({formatDate(showConfirmModal.subscription.current_period_end)}).</p>
              )}
              {showConfirmModal.type === "cancel-immediate" && (
                <p className="admin-text-danger">This will <strong>immediately cancel</strong> the subscription for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>. This action cannot be undone.</p>
              )}
              {showConfirmModal.type === "reactivate" && (
                <p>This will <strong>reactivate</strong> the subscription for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong> and start a new billing period.</p>
              )}
              {showConfirmModal.type === "change-plan" && (
                <p>Change the subscription plan for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong> from <strong>{showConfirmModal.subscription.plan_type}</strong> to <strong>{showConfirmModal.newPlan}</strong>.</p>
              )}
              {showConfirmModal.type === "suspend-user" && (
                <p className="admin-text-danger">This will <strong>suspend</strong> the user account for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>. They will not be able to access the platform.</p>
              )}
              {showConfirmModal.type === "activate-user" && (
                <p>This will <strong>activate</strong> the user account for <strong>{showConfirmModal.subscription.first_name} {showConfirmModal.subscription.last_name}</strong>. They will regain access to the platform.</p>
              )}
            </div>

            <div className="admin-confirm-modal-actions">
              <button
                className="admin-btn admin-btn-ghost"
                onClick={() => setShowConfirmModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              {showConfirmModal.type === "extend-trial" && (
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleExtendTrial(showConfirmModal.subscription.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Extending..." : "Extend Trial"}
                </button>
              )}
              {showConfirmModal.type === "end-trial-active" && (
                <button
                  className="admin-btn admin-btn-success"
                  onClick={() => handleEndTrial(showConfirmModal.subscription.id, true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Activate Subscription"}
                </button>
              )}
              {showConfirmModal.type === "end-trial-cancel" && (
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleEndTrial(showConfirmModal.subscription.id, false)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Cancel Subscription"}
                </button>
              )}
              {showConfirmModal.type === "cancel-period-end" && (
                <button
                  className="admin-btn admin-btn-warning"
                  onClick={() => handleCancelSubscription(showConfirmModal.subscription.id, false)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Schedule Cancellation"}
                </button>
              )}
              {showConfirmModal.type === "cancel-immediate" && (
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleCancelSubscription(showConfirmModal.subscription.id, true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Canceling..." : "Cancel Immediately"}
                </button>
              )}
              {showConfirmModal.type === "reactivate" && (
                <button
                  className="admin-btn admin-btn-success"
                  onClick={() => handleReactivateSubscription(showConfirmModal.subscription.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Reactivating..." : "Reactivate"}
                </button>
              )}
              {showConfirmModal.type === "change-plan" && (
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleChangePlan(showConfirmModal.subscription.id, showConfirmModal.newPlan)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Changing..." : `Change to ${showConfirmModal.newPlan}`}
                </button>
              )}
              {showConfirmModal.type === "suspend-user" && (
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleSuspendUser(showConfirmModal.subscription.user_id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Suspending..." : "Suspend User"}
                </button>
              )}
              {showConfirmModal.type === "activate-user" && (
                <button
                  className="admin-btn admin-btn-success"
                  onClick={() => handleActivateUser(showConfirmModal.subscription.user_id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Activating..." : "Activate User"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;
