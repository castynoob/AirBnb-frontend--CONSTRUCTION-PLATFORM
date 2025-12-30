import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Briefcase,
  CreditCard,
  TrendingUp,
  UserPlus,
  FileText,
  DollarSign,
  Building2,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
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
  LabelList,
} from "recharts";
import { useAdminAuth } from "../context/AdminAuthContext";
import StatsCard from "../components/StatsCard";
import DateFilterModal from "../components/DateFilterModal";
import "../styles/admin-dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function Dashboard() {
  const { getToken, logout } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(null);

  // Filter states for each chart
  const [revenueFilter, setRevenueFilter] = useState({ period: "month", dateRange: { start: "", end: "" } });
  const [jobsFilter, setJobsFilter] = useState({ period: "day", dateRange: { start: "", end: "" } });
  const [usersFilter, setUsersFilter] = useState({ period: "day", dateRange: { start: "", end: "" } });

  // Chart data states
  const [revenueData, setRevenueData] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [usersData, setUsersData] = useState([]);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'revenue', 'jobs', 'users', 'activity', or null

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState({
    types: [], // empty = all types
    roles: [], // empty = all roles
  });
  const [showActivityFilter, setShowActivityFilter] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/dashboard/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !activityRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, activityData] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
      ]);

      setStats(statsData);
      setActivity(activityData.activities || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = useCallback(async (period, dateRange) => {
    const token = getToken();
    try {
      let url = `${API_URL}/api/admin/dashboard/revenue?period=${period}`;
      if (dateRange?.start && dateRange?.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRevenueData(data.revenueData || []);
      }
    } catch (err) {
      console.error("Revenue fetch error:", err);
    }
  }, [getToken]);

  const fetchJobsData = useCallback(async (period, dateRange) => {
    const token = getToken();
    try {
      let url = `${API_URL}/api/admin/dashboard/jobs?period=${period}`;
      if (dateRange?.start && dateRange?.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobsData(data.jobsData || []);
      }
    } catch (err) {
      console.error("Jobs fetch error:", err);
    }
  }, [getToken]);

  const fetchUsersData = useCallback(async (period, dateRange) => {
    const token = getToken();
    try {
      let url = `${API_URL}/api/admin/dashboard/users?period=${period}`;
      if (dateRange?.start && dateRange?.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersData(data.usersData || []);
      }
    } catch (err) {
      console.error("Users fetch error:", err);
    }
  }, [getToken]);

  const fetchActivityData = useCallback(async (filters) => {
    const token = getToken();
    try {
      let url = `${API_URL}/api/admin/dashboard/activity?limit=20`;
      if (filters.types.length > 0) {
        url += `&types=${filters.types.join(",")}`;
      }
      if (filters.roles.length > 0) {
        url += `&roles=${filters.roles.join(",")}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivity(data.activities || []);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    }
  }, [getToken]);

  // Handle filter apply from modal
  const handleFilterApply = (chartType, period, dateRange) => {
    switch (chartType) {
      case 'revenue':
        setRevenueFilter({ period, dateRange });
        fetchRevenueData(period, dateRange);
        break;
      case 'jobs':
        setJobsFilter({ period, dateRange });
        fetchJobsData(period, dateRange);
        break;
      case 'users':
        setUsersFilter({ period, dateRange });
        fetchUsersData(period, dateRange);
        break;
    }
    setActiveModal(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchRevenueData(revenueFilter.period, revenueFilter.dateRange);
      fetchJobsData(jobsFilter.period, jobsFilter.dateRange);
      fetchUsersData(usersFilter.period, usersFilter.dateRange);
    }
  }, [loading, fetchRevenueData, fetchJobsData, fetchUsersData, revenueFilter.period, revenueFilter.dateRange, jobsFilter.period, jobsFilter.dateRange, usersFilter.period, usersFilter.dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num?.toString() || "0";
  };

  // Format date based on period
  const formatPeriodDate = (value, period) => {
    const date = new Date(value);
    switch (period) {
      case "day":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "week":
        return `Wk ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      case "month":
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Format full date for tooltips
  const formatFullDate = (value, period) => {
    const date = new Date(value);
    switch (period) {
      case "week":
        return `Week of ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
      case "month":
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  };

  // Check if filter has custom date range
  const hasCustomFilter = (filter) => {
    return filter.dateRange?.start && filter.dateRange?.end;
  };

  // Get filter display text
  const getFilterText = (filter) => {
    if (hasCustomFilter(filter)) {
      return "Custom";
    }
    return filter.period.charAt(0).toUpperCase() + filter.period.slice(1);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "user_registered":
        return <UserPlus size={16} />;
      case "job_posted":
        return <Briefcase size={16} />;
      case "bid_submitted":
        return <FileText size={16} />;
      case "payment_completed":
        return <DollarSign size={16} />;
      case "property_listed":
        return <Building2 size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "user_registered":
        return "success";
      case "payment_completed":
        return "success";
      case "job_posted":
        return "";
      case "bid_submitted":
        return "warning";
      default:
        return "";
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Transform user stats into pie chart data
  const getUserDistributionData = () => {
    if (!stats?.users) return [];
    return [
      { role: "Property Managers", count: parseInt(stats.users.property_managers) || 0 },
      { role: "Entrepreneurs", count: parseInt(stats.users.entrepreneurs) || 0 },
      { role: "Suppliers", count: parseInt(stats.users.suppliers) || 0 },
      { role: "Residents", count: parseInt(stats.users.residents) || 0 },
    ].filter(item => item.count > 0);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-spinner" />
        <div className="admin-dashboard-loading-text">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-loading">
        <AlertCircle size={48} color="var(--admin-danger)" />
        <div className="admin-dashboard-loading-text">{error}</div>
        <button className="admin-btn admin-btn-primary" onClick={fetchDashboardData}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back! Here's what's happening on your platform.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchDashboardData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="admin-btn admin-btn-danger" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <StatsCard
          title="Total Users"
          value={formatNumber(stats?.users?.total_users)}
          change={`${stats?.users?.verified_users || 0} verified users`}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Active Jobs"
          value={formatNumber(stats?.jobs?.open_jobs)}
          change={`${stats?.jobs?.total_jobs || 0} total jobs posted`}
          icon={Briefcase}
          color="success"
        />
        <StatsCard
          title="Platform Revenue"
          value={formatCurrency(stats?.revenue?.total_platform_fees)}
          change={`from ${stats?.revenue?.total_contracts || 0} contracts`}
          icon={CreditCard}
          color="warning"
        />
        <StatsCard
          title="Active Subscriptions"
          value={formatNumber(stats?.subscriptions?.active_subscriptions)}
          change={`${stats?.subscriptions?.total_subscriptions || 0} total subscriptions`}
          icon={TrendingUp}
          color="info"
        />
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        {/* Revenue Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Revenue Overview</h3>
            <button
              className={`chart-filter-trigger ${hasCustomFilter(revenueFilter) ? "has-filter" : ""}`}
              onClick={() => setActiveModal('revenue')}
            >
              <Filter size={14} />
              {getFilterText(revenueFilter)}
            </button>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(value) => formatPeriodDate(value, revenueFilter.period)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                              {formatFullDate(data.period, revenueFilter.period)}
                            </div>
                            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "4px" }}>
                              <span style={{ color: "#3b82f6", fontWeight: 600 }}>
                                Total: {formatCurrency(data.revenue)}
                              </span>
                            </div>
                            {(data.unlockRevenue > 0 || data.subscriptionRevenue > 0) && (
                              <div style={{ fontSize: "12px", color: "#64748b", paddingTop: "4px", borderTop: "1px solid #e2e8f0", marginTop: "4px" }}>
                                <div>Budget Unlocks: {formatCurrency(data.unlockRevenue || 0)} ({data.unlockCount || 0})</div>
                                <div>Subscriptions: {formatCurrency(data.subscriptionRevenue || 0)} ({data.subscriptionCount || 0})</div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">User Distribution</h3>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getUserDistributionData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="role"
                    label={({ count }) => count}
                    labelLine={false}
                  >
                    {getUserDistributionData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs and Users Over Time */}
      <div className="admin-charts-grid">
        {/* Jobs Over Time */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Jobs Posted Over Time</h3>
            <button
              className={`chart-filter-trigger ${hasCustomFilter(jobsFilter) ? "has-filter" : ""}`}
              onClick={() => setActiveModal('jobs')}
            >
              <Filter size={14} />
              {getFilterText(jobsFilter)}
            </button>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(value) => formatPeriodDate(value, jobsFilter.period)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatFullDate(value, jobsFilter.period)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Jobs"
                  >
                    <LabelList dataKey="count" position="top" fill="#374151" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Registrations Over Time */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">New Users</h3>
            <button
              className={`chart-filter-trigger ${hasCustomFilter(usersFilter) ? "has-filter" : ""}`}
              onClick={() => setActiveModal('users')}
            >
              <Filter size={14} />
              {getFilterText(usersFilter)}
            </button>
          </div>
          <div className="admin-chart-body">
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(value) => formatPeriodDate(value, usersFilter.period)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatFullDate(value, usersFilter.period)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    name="Users"
                  >
                    <LabelList dataKey="count" position="top" fill="#374151" fontSize={11} offset={8} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="admin-activity-card">
        <div className="admin-activity-header">
          <h3 className="admin-activity-title">Recent Activity</h3>
          <button
            className={`chart-filter-trigger ${activityFilter.types.length > 0 || activityFilter.roles.length > 0 ? "has-filter" : ""}`}
            onClick={() => setShowActivityFilter(!showActivityFilter)}
          >
            <Filter size={14} />
            {activityFilter.types.length > 0 || activityFilter.roles.length > 0
              ? `${activityFilter.types.length + activityFilter.roles.length} filters`
              : "Filter"}
          </button>
        </div>

        {/* Activity Filter Dropdown */}
        {showActivityFilter && (
          <div className="activity-filter-dropdown">
            <div className="activity-filter-section">
              <div className="activity-filter-label">Activity Type</div>
              <div className="activity-filter-options">
                {[
                  { value: "user_registered", label: "User Registrations" },
                  { value: "job_posted", label: "Jobs Posted" },
                  { value: "bid_submitted", label: "Bids Submitted" },
                  { value: "subscription_created", label: "Subscriptions" },
                ].map((type) => (
                  <label key={type.value} className="activity-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={activityFilter.types.includes(type.value)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...activityFilter.types, type.value]
                          : activityFilter.types.filter((t) => t !== type.value);
                        setActivityFilter({ ...activityFilter, types: newTypes });
                      }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="activity-filter-section">
              <div className="activity-filter-label">User Role (for registrations)</div>
              <div className="activity-filter-options">
                {[
                  { value: "property_manager", label: "Property Managers" },
                  { value: "entrepreneur", label: "Entrepreneurs" },
                  { value: "supplier", label: "Suppliers" },
                  { value: "resident", label: "Residents" },
                ].map((role) => (
                  <label key={role.value} className="activity-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={activityFilter.roles.includes(role.value)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...activityFilter.roles, role.value]
                          : activityFilter.roles.filter((r) => r !== role.value);
                        setActivityFilter({ ...activityFilter, roles: newRoles });
                      }}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="activity-filter-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setActivityFilter({ types: [], roles: [] });
                  fetchActivityData({ types: [], roles: [] });
                }}
              >
                Clear
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  fetchActivityData(activityFilter);
                  setShowActivityFilter(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="admin-activity-list">
          {activity.length > 0 ? (
            activity.map((item, index) => (
              <div key={index} className="admin-activity-item">
                <div className={`admin-activity-icon ${getActivityColor(item.type)}`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="admin-activity-content">
                  <div className="admin-activity-text">
                    <strong>{item.user_name || "A user"}</strong> {item.description}
                  </div>
                  <div className="admin-activity-time">
                    {formatTimeAgo(item.created_at)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-activity-item">
              <div className="admin-activity-content">
                <div className="admin-activity-text">No recent activity</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Filter Modals */}
      <DateFilterModal
        isOpen={activeModal === 'revenue'}
        onClose={() => setActiveModal(null)}
        onApply={(period, dateRange) => handleFilterApply('revenue', period, dateRange)}
        currentPeriod={revenueFilter.period}
        currentDateRange={revenueFilter.dateRange}
        title="Filter Revenue Data"
      />

      <DateFilterModal
        isOpen={activeModal === 'jobs'}
        onClose={() => setActiveModal(null)}
        onApply={(period, dateRange) => handleFilterApply('jobs', period, dateRange)}
        currentPeriod={jobsFilter.period}
        currentDateRange={jobsFilter.dateRange}
        title="Filter Jobs Data"
      />

      <DateFilterModal
        isOpen={activeModal === 'users'}
        onClose={() => setActiveModal(null)}
        onApply={(period, dateRange) => handleFilterApply('users', period, dateRange)}
        currentPeriod={usersFilter.period}
        currentDateRange={usersFilter.dateRange}
        title="Filter Users Data"
      />
    </div>
  );
}

export default Dashboard;
