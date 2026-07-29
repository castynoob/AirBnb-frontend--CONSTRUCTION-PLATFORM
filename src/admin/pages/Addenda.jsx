import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-dashboard.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const statusBadgeClass = (status) => {
  const map = {
    pending: "admin-badge-warning",
    accepted: "admin-badge-success",
    rejected: "admin-badge-danger",
    withdrawn: "admin-badge-secondary",
  };
  return map[status] || "admin-badge-secondary";
};

const money = (n) => {
  const val = Number(n || 0);
  const sign = val > 0 ? "+" : val < 0 ? "" : "";
  return `${sign}${val.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  })}`;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function Addenda() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [selected, setSelected] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const qs = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
      });
      const res = await fetch(`${API_URL}/api/admin/bid-addenda?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch addenda");
      const data = await res.json();
      setRows(data.addenda || []);
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/bid-addenda/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRows();
    fetchStats();
  }, [fetchRows, fetchStats]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const setStatusFilter = (status) => {
    setFilters((f) => ({ ...f, status }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="admin-addenda">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bid Addenda</h1>
          <p className="admin-page-subtitle">
            Post-submission Q&amp;A and price adjustments between contractors and property managers.
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => { fetchRows(); fetchStats(); }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="admin-bids-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-warning">
              <Clock size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.pending || 0}</div>
              <div className="admin-stat-label">Pending</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-success">
              <CheckCircle size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.accepted || 0}</div>
              <div className="admin-stat-label">Accepted</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-danger">
              <XCircle size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{(stats.rejected || 0) + (stats.withdrawn || 0)}</div>
              <div className="admin-stat-label">Rejected / Withdrawn</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-primary">
              <DollarSign size={24} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{money(stats.accepted_delta_total)}</div>
              <div className="admin-stat-label">Accepted price delta (all time)</div>
            </div>
          </div>
        </div>
      )}

      {stats?.stale_pending > 0 && (
        <div className="admin-alert admin-alert-warning" style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 8, background: "#fef3c7", color: "#78350f", margin: "12px 0" }}>
          <AlertTriangle size={18} />
          <span>
            <b>{stats.stale_pending}</b> addend{stats.stale_pending === 1 ? "um" : "a"} pending for more than 48 hours — likely blocking bid approvals.
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              style={{ marginLeft: 8, background: "transparent", border: "none", color: "#78350f", textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}
            >
              Show pending
            </button>
          </span>
        </div>
      )}

      <div className="admin-bids-toolbar">
        <form onSubmit={handleSearchSubmit} className="admin-bids-search">
          <div className="admin-input-group">
            <Search size={18} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input"
              placeholder="Search job title, company, manager, contractor, or reason…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Search</button>
        </form>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {["", "pending", "accepted", "rejected", "withdrawn"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`admin-btn ${filters.status === s ? "admin-btn-primary" : "admin-btn-secondary"}`}
              style={{ padding: "6px 14px", fontSize: 13, textTransform: "capitalize" }}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger" style={{ margin: "12px 0", padding: 12, borderRadius: 8, background: "#fee2e2", color: "#7f1d1d" }}>
          {error}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Contractor</th>
                <th>Manager</th>
                <th>Reason</th>
                <th>Delta</th>
                <th>Status</th>
                <th>Proposed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-loading">Loading…</div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-table-empty">
                      <FileText size={28} />
                      <p>No addenda match these filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.job_title || "—"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Bid {money(a.bid_amount)} · {a.bid_status}</div>
                    </td>
                    <td>
                      <div>{a.contractor_name || "—"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{a.contractor_company || a.contractor_email}</div>
                    </td>
                    <td>
                      <div>{a.manager_name || "—"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{a.manager_email}</div>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {a.reason}
                      </div>
                    </td>
                    <td>
                      <b style={{ color: Number(a.amount_delta) > 0 ? "#065f46" : Number(a.amount_delta) < 0 ? "#7f1d1d" : "#6b7280" }}>
                        {money(a.amount_delta)}
                      </b>
                    </td>
                    <td>
                      <span className={`admin-badge ${statusBadgeClass(a.status)}`} style={{ textTransform: "capitalize" }}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{fmtDate(a.created_at)}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>by {a.proposed_by_name || "—"}</div>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-icon"
                          title="Details"
                          onClick={() => setSelected(a)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="admin-table-pagination">
            <div>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AddendumDetailModal a={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function AddendumDetailModal({ a, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, maxWidth: 640, width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Addendum</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{a.job_title}</div>
          </div>
          <button onClick={onClose} className="admin-btn admin-btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Contractor</div>
              <div style={{ fontWeight: 600 }}>{a.contractor_name || "—"}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{a.contractor_company || a.contractor_email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Manager</div>
              <div style={{ fontWeight: 600 }}>{a.manager_name || "—"}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{a.manager_email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Original bid</div>
              <div style={{ fontWeight: 600 }}>{money(a.bid_amount)}</div>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>Status: {a.bid_status}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Addendum delta</div>
              <div style={{ fontWeight: 600, color: Number(a.amount_delta) > 0 ? "#065f46" : Number(a.amount_delta) < 0 ? "#7f1d1d" : "#374151" }}>
                {money(a.amount_delta)}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>Status: {a.status}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Reason / Question</div>
            <div style={{ background: "#f8f9fb", borderLeft: "3px solid #14919B", padding: "12px 14px", borderRadius: 6, whiteSpace: "pre-wrap" }}>
              {a.reason}
            </div>
          </div>

          {a.response_note && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Response note</div>
              <div style={{ background: "#f8f9fb", borderLeft: "3px solid #6b7280", padding: "12px 14px", borderRadius: 6, whiteSpace: "pre-wrap" }}>
                {a.response_note}
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "#374151" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Proposed</div>
              <div>{fmtDate(a.created_at)}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>by {a.proposed_by_name || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Resolved</div>
              <div>{fmtDate(a.responded_at)}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>by {a.responded_by_name || "—"}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            <a
              href={`/admin/jobs?highlight=${a.job_id}`}
              className="admin-btn admin-btn-secondary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Briefcase size={14} /> Open job
            </a>
            <a
              href={`/admin/bids?bidId=${a.bid_id}`}
              className="admin-btn admin-btn-secondary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowUpRight size={14} /> Open bid
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Addenda;
