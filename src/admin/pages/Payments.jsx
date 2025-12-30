import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  ExternalLink,
  Hash,
  Building2,
  Filter,
  AlertCircle,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-payments.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Status badge colors
const getStatusBadgeClass = (status) => {
  if (!status) return "admin-badge-secondary";
  const statusLower = status.toLowerCase();
  const classes = {
    succeeded: "admin-badge-success",
    pending: "admin-badge-warning",
    failed: "admin-badge-danger",
    refunded: "admin-badge-info",
  };
  return classes[statusLower] || "admin-badge-secondary";
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
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

function Payments() {
  const { getToken } = useAdminAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState("budget-unlocking");

  // Data states
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
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
  const [showFilters, setShowFilters] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("day");

  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchTransactions = useCallback(async () => {
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

      const res = await fetch(`${API_URL}/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch transactions");

      const data = await res.json();
      setTransactions(data.transactions || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/transactions/stats`, {
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

  const fetchRevenueChart = useCallback(async (period) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/transactions/revenue-chart?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRevenueData(data.revenueData || []);
      }
    } catch (err) {
      console.error("Fetch revenue chart error:", err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRevenueChart(chartPeriod);
  }, [fetchRevenueChart, chartPeriod]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleRefresh = () => {
    fetchTransactions();
    fetchStats();
    fetchRevenueChart(chartPeriod);
  };

  const handleViewTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
    setLoadingDetails(true);

    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/admin/transactions/${transaction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTransaction(data.transaction);
      }
    } catch (err) {
      console.error("Fetch transaction details error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    if (!stats?.budgetUnlocks) {
      return {
        successRate: 0,
        avgTransaction: 0,
        monthlyGrowth: 0,
        pendingCount: 0,
      };
    }

    const { total_count, succeeded_count, total_revenue, monthly_revenue } = stats.budgetUnlocks;
    const successRate = total_count > 0 ? ((succeeded_count / total_count) * 100).toFixed(1) : 0;
    const avgTransaction = succeeded_count > 0 ? total_revenue / succeeded_count : 0;
    const failedCount = total_count - succeeded_count;

    return {
      successRate,
      avgTransaction,
      failedCount,
      totalRevenue: total_revenue || 0,
      monthlyRevenue: monthly_revenue || 0,
      totalCount: total_count || 0,
      succeededCount: succeeded_count || 0,
    };
  };

  const kpis = calculateKPIs();

  return (
    <div className="admin-payments">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-content">
          <h1>Payments</h1>
          <p>Monitor budget unlock transactions and payment activity</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-payments-tabs">
        <button
          className={`admin-payments-tab ${activeTab === "budget-unlocking" ? "active" : ""}`}
          onClick={() => setActiveTab("budget-unlocking")}
        >
          <Wallet size={18} />
          Budget Unlocking
        </button>
        <button
          className={`admin-payments-tab ${activeTab === "payment" ? "active" : ""}`}
          onClick={() => setActiveTab("payment")}
        >
          <CreditCard size={18} />
          Payment
        </button>
      </div>

      {/* Budget Unlocking Tab */}
      {activeTab === "budget-unlocking" && (
        <>
          {/* KPI Cards */}
          <div className="admin-payments-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-icon admin-kpi-icon-primary">
                <DollarSign size={24} />
              </div>
              <div className="admin-kpi-content">
                <div className="admin-kpi-value">{formatCurrency(kpis.totalRevenue)}</div>
                <div className="admin-kpi-label">Total Revenue</div>
                <div className="admin-kpi-change positive">
                  <ArrowUpRight size={14} />
                  All time
                </div>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-icon admin-kpi-icon-success">
                <TrendingUp size={24} />
              </div>
              <div className="admin-kpi-content">
                <div className="admin-kpi-value">{formatCurrency(kpis.monthlyRevenue)}</div>
                <div className="admin-kpi-label">This Month</div>
                <div className="admin-kpi-change positive">
                  <Activity size={14} />
                  Current period
                </div>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-icon admin-kpi-icon-info">
                <Percent size={24} />
              </div>
              <div className="admin-kpi-content">
                <div className="admin-kpi-value">{kpis.successRate}%</div>
                <div className="admin-kpi-label">Success Rate</div>
                <div className="admin-kpi-change neutral">
                  {kpis.succeededCount} of {kpis.totalCount}
                </div>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-icon admin-kpi-icon-warning">
                <CreditCard size={24} />
              </div>
              <div className="admin-kpi-content">
                <div className="admin-kpi-value">{formatCurrency(kpis.avgTransaction)}</div>
                <div className="admin-kpi-label">Avg Transaction</div>
                <div className="admin-kpi-change neutral">
                  Per unlock
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="admin-payments-charts">
            {/* Revenue Over Time Chart */}
            <div className="admin-chart-card admin-payments-revenue-chart">
              <div className="admin-chart-header">
                <h3 className="admin-chart-title">Budget Unlock Revenue</h3>
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
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorBudgetRevenue" x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(value) => formatCurrencyShort(value)}
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
                                  <span>Revenue:</span>
                                  <span className="admin-chart-tooltip-value">
                                    {formatCurrency(data.revenue)}
                                  </span>
                                </div>
                                <div className="admin-chart-tooltip-row">
                                  <span>Transactions:</span>
                                  <span>{data.count || 0}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBudgetRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transaction Count Bar Chart */}
            <div className="admin-chart-card admin-payments-count-chart">
              <div className="admin-chart-header">
                <h3 className="admin-chart-title">Transaction Volume</h3>
              </div>
              <div className="admin-chart-body">
                <div className="admin-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
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
                                  <span>Transactions:</span>
                                  <span className="admin-chart-tooltip-value">{data.count || 0}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Transactions">
                        <LabelList dataKey="count" position="top" fill="#374151" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="admin-payments-toolbar">
            <form className="admin-payments-search" onSubmit={handleSearch}>
              <div className="admin-input-group">
                <Search size={18} className="admin-input-icon" />
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Search by entrepreneur, job, email..."
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
            <div className="admin-payments-filters">
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
                  <option value="succeeded">Succeeded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <button
                className="admin-btn admin-btn-ghost"
                onClick={() => {
                  setStatusFilter("");
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
            <div className="admin-payments-error-banner">
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
                  <th>Transaction</th>
                  <th>Entrepreneur</th>
                  <th>Job</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="admin-table-loading">
                      <div className="admin-spinner" />
                      <span>Loading transactions...</span>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      <CreditCard size={48} />
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className="admin-tx-id-cell">
                          <span className="admin-tx-id">
                            <Hash size={12} />
                            {tx.id.substring(0, 8)}...
                          </span>
                          <span className="admin-tx-type">Budget Unlock</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-entrepreneur-cell">
                          <div className="admin-entrepreneur-name">
                            {tx.entrepreneur_first_name} {tx.entrepreneur_last_name}
                          </div>
                          <div className="admin-entrepreneur-company">
                            {tx.entrepreneur_company || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-job-cell">
                          <div className="admin-job-title">{tx.job_title || "N/A"}</div>
                          <div className="admin-job-category">{tx.job_category || ""}</div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-amount">{formatCurrency(tx.amount)}</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(tx.status)}`}>
                          {tx.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-date-cell">
                          <Calendar size={14} />
                          {formatDate(tx.unlocked_at)}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => handleViewTransaction(tx)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {tx.stripe_payment_intent_id && (
                            <a
                              href={`https://dashboard.stripe.com/payments/${tx.stripe_payment_intent_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              title="View in Stripe"
                            >
                              <ExternalLink size={16} />
                            </a>
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
            <div className="admin-pagination">
              <div className="admin-pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} transactions
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
        </>
      )}

      {/* Payment Tab (Placeholder) */}
      {activeTab === "payment" && (
        <div className="admin-payments-placeholder">
          <div className="admin-placeholder-content">
            <CreditCard size={64} strokeWidth={1} />
            <h2>Payment Management</h2>
            <p>Payment processing and subscription management features coming soon.</p>
            <span className="admin-placeholder-badge">Coming Soon</span>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Transaction Details</h2>
              <button className="admin-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {loadingDetails ? (
                <div className="admin-modal-loading">
                  <div className="admin-spinner" />
                  <span>Loading details...</span>
                </div>
              ) : (
                <div className="admin-payment-details">
                  {/* Transaction Header */}
                  <div className="admin-payment-header">
                    <div className="admin-payment-amount-display">
                      <DollarSign size={24} />
                      <span className="admin-payment-amount-value">
                        {formatCurrency(selectedTransaction.amount)}
                      </span>
                    </div>
                    <div className="admin-payment-badges">
                      <span className={`admin-badge ${getStatusBadgeClass(selectedTransaction.status)}`}>
                        {selectedTransaction.status === "succeeded" && <CheckCircle size={12} />}
                        {selectedTransaction.status === "failed" && <XCircle size={12} />}
                        {selectedTransaction.status}
                      </span>
                      <span className="admin-badge admin-badge-info">Budget Unlock</span>
                    </div>
                  </div>

                  {/* Transaction Info Grid */}
                  <div className="admin-payment-section">
                    <h4>Transaction Info</h4>
                    <div className="admin-payment-info-grid">
                      <div className="admin-payment-info-item">
                        <Hash size={16} />
                        <div>
                          <label>Transaction ID</label>
                          <span className="admin-item-id">{selectedTransaction.id}</span>
                        </div>
                      </div>
                      {selectedTransaction.stripe_payment_intent_id && (
                        <div className="admin-payment-info-item">
                          <CreditCard size={16} />
                          <div>
                            <label>Stripe Payment ID</label>
                            <span className="admin-item-id">
                              {selectedTransaction.stripe_payment_intent_id}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="admin-payment-info-item">
                        <Calendar size={16} />
                        <div>
                          <label>Date</label>
                          <span>{formatDateTime(selectedTransaction.unlocked_at)}</span>
                        </div>
                      </div>
                      <div className="admin-payment-info-item">
                        <Clock size={16} />
                        <div>
                          <label>Created</label>
                          <span>{formatDateTime(selectedTransaction.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entrepreneur Info */}
                  <div className="admin-payment-section">
                    <h4>Entrepreneur</h4>
                    <div className="admin-user-card">
                      <div className="admin-user-card-avatar">
                        {selectedTransaction.entrepreneur_first_name?.[0]}
                        {selectedTransaction.entrepreneur_last_name?.[0]}
                      </div>
                      <div className="admin-user-card-info">
                        <div className="admin-user-card-name">
                          {selectedTransaction.entrepreneur_first_name}{" "}
                          {selectedTransaction.entrepreneur_last_name}
                        </div>
                        <div className="admin-user-card-company">
                          {selectedTransaction.entrepreneur_company || "No company"}
                        </div>
                        <div className="admin-user-card-meta">
                          {selectedTransaction.entrepreneur_email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  {selectedTransaction.job_title && (
                    <div className="admin-payment-section">
                      <h4>Job Details</h4>
                      <div className="admin-payment-info-grid">
                        <div className="admin-payment-info-item">
                          <Briefcase size={16} />
                          <div>
                            <label>Job Title</label>
                            <span>{selectedTransaction.job_title}</span>
                          </div>
                        </div>
                        <div className="admin-payment-info-item">
                          <Building2 size={16} />
                          <div>
                            <label>Category</label>
                            <span>{selectedTransaction.job_category || "N/A"}</span>
                          </div>
                        </div>
                        <div className="admin-payment-info-item">
                          <DollarSign size={16} />
                          <div>
                            <label>Job Budget</label>
                            <span>
                              {formatCurrency(selectedTransaction.budget_min)} -{" "}
                              {formatCurrency(selectedTransaction.budget_max)}
                            </span>
                          </div>
                        </div>
                        <div className="admin-payment-info-item">
                          <CheckCircle size={16} />
                          <div>
                            <label>Job Status</label>
                            <span>{selectedTransaction.job_status || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Property Manager Info */}
                  {selectedTransaction.manager_first_name && (
                    <div className="admin-payment-section">
                      <h4>Property Manager</h4>
                      <div className="admin-user-card">
                        <div className="admin-user-card-avatar">
                          {selectedTransaction.manager_first_name?.[0]}
                          {selectedTransaction.manager_last_name?.[0]}
                        </div>
                        <div className="admin-user-card-info">
                          <div className="admin-user-card-name">
                            {selectedTransaction.manager_first_name}{" "}
                            {selectedTransaction.manager_last_name}
                          </div>
                          <div className="admin-user-card-company">
                            {selectedTransaction.manager_company || "No company"}
                          </div>
                          {selectedTransaction.manager_email && (
                            <div className="admin-user-card-meta">
                              {selectedTransaction.manager_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedTransaction.stripe_payment_intent_id && (
                    <div className="admin-payment-actions">
                      <a
                        href={`https://dashboard.stripe.com/payments/${selectedTransaction.stripe_payment_intent_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-secondary"
                      >
                        <ExternalLink size={16} />
                        View in Stripe Dashboard
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
