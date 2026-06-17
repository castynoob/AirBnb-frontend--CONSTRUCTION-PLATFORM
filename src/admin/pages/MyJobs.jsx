// =============================================================================
// MyJobs — admin's own (admin_owner_id) job listings.
// Distinct from /admin/jobs (all-platform moderation list).
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, RefreshCw, Search, Briefcase, DollarSign, Calendar, MapPin, FileSpreadsheet, Layers,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminJobFormModal from "../components/AdminJobFormModal";
import AdminInspectionUploadModal from "../components/AdminInspectionUploadModal";
import AdminJobLifecycleModal from "../components/AdminJobLifecycleModal";
import { DeleteConfirm } from "./MyProperties";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const fmtMoney = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
};

// Job status tabs. Each `match` is a set of canonical status strings (case-insensitive).
const TABS = [
  { key: "all",       label: "All" },
  { key: "open",      label: "Open",      match: new Set(["open", "pending"]) },
  { key: "accepted",  label: "Accepted",  match: new Set(["accepted", "approved"]) },
  { key: "ongoing",   label: "Ongoing",   match: new Set(["ongoing", "in_progress", "in progress", "active"]) },
  { key: "completed", label: "Completed", match: new Set(["completed", "done", "closed"]) },
];

const matchesTab = (status, tabKey) => {
  if (tabKey === "all") return true;
  const tab = TABS.find((t) => t.key === tabKey);
  if (!tab?.match) return false;
  return tab.match.has(String(status || "").toLowerCase().trim());
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
};

export default function MyJobs() {
  const { getToken, isAdminOrHigher } = useAdminAuth();
  const canManage = typeof isAdminOrHigher === "function" ? isAdminOrHigher() : false;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | open | accepted | ongoing | completed
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [managingJob, setManagingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/admin/my-jobs`);
      if (search.trim()) url.searchParams.set("search", search.trim());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load jobs");
      setJobs(data.jobs || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Derive per-tab counts from the full jobs list (server already applies the
  // search filter, so counts here reflect the same scope).
  const jobCounts = useMemo(() => {
    const counts = { all: jobs.length };
    for (const tab of TABS) {
      if (tab.key === "all") continue;
      counts[tab.key] = jobs.filter((j) => matchesTab(j.status, tab.key)).length;
    }
    return counts;
  }, [jobs]);

  // Filter the visible list by the active tab. "All" passes through.
  const visibleJobs = useMemo(
    () => (activeTab === "all" ? jobs : jobs.filter((j) => matchesTab(j.status, activeTab))),
    [jobs, activeTab]
  );

  // Open Manage modal AND clear the red dot for this job.
  // Mark-as-read fires-and-forgets — the modal opens immediately; the bell
  // count + per-card dot refresh after the modal closes via fetchJobs().
  const openManage = (job) => {
    setManagingJob(job);
    if (job?.unread_count > 0) {
      fetch(`${API_URL}/api/admin/notifications/job/${job.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      }).catch(() => {});
      // Optimistic local update so the dot disappears without waiting on refetch.
      setJobs((prev) => prev.map((x) => x.id === job.id ? { ...x, unread_count: 0 } : x));
    }
  };

  const handleDelete = async () => {
    if (!deletingJob) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/jobs/${deletingJob.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("Job deleted");
      setDeletingJob(null);
      fetchJobs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-jobs">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">My Jobs</h1>
          <p className="admin-page-subtitle">
            Jobs owned directly by you as an admin. These appear in the contractor feed like any other job.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchJobs}>
            <RefreshCw size={16} /> Refresh
          </button>
          {canManage && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowImport(true)}
              title="Bulk create jobs from an Excel inspection report"
            >
              <FileSpreadsheet size={16} /> Import from Excel
            </button>
          )}
          {canManage && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => { setEditingJob(null); setShowForm(true); }}
            >
              <Plus size={16} /> New job
            </button>
          )}
        </div>
      </div>

      {/* Search + status tabs */}
      <div style={S.filterBar}>
        <div style={{ position: "relative", maxWidth: 380, flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, padding: "9px 12px 9px 36px",
              border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* Status tabs */}
      {!loading && jobs.length > 0 && (
        <div style={S.tabs}>
          {TABS.map((t) => {
            const count = jobCounts[t.key] || 0;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  ...S.tab,
                  ...(active ? S.tabActive : {}),
                }}
              >
                <span>{t.label}</span>
                <span style={{ ...S.tabCount, ...(active ? S.tabCountActive : {}) }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : jobs.length === 0 ? (
        <div style={S.empty}>
          <Briefcase size={36} color="#cbd5e1" />
          <p style={{ margin: "12px 0 4px", color: "#0F223D", fontWeight: 600 }}>
            You don't own any jobs yet
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            Create a property first (in <strong>My Properties</strong>), then post jobs against it from here.
          </p>
        </div>
      ) : visibleJobs.length === 0 ? (
        <div style={S.empty}>
          <Briefcase size={36} color="#cbd5e1" />
          <p style={{ margin: "12px 0 4px", color: "#0F223D", fontWeight: 600 }}>
            No jobs in this tab
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            Try a different status or clear the search.
          </p>
        </div>
      ) : (
        <div style={S.list}>
          {visibleJobs.map((j) => (
            <div key={j.id} style={S.card}>
              <div style={S.cardLeft}>
                <h3 style={S.title}>
                  {/* Red dot when there are unread notifications for this job
                      (new bid, start, completion, etc.). Cleared on Manage open. */}
                  {j.unread_count > 0 && (
                    <span
                      title={`${j.unread_count} new update${j.unread_count > 1 ? "s" : ""}`}
                      style={{
                        display: "inline-block",
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#dc2626",
                        boxShadow: "0 0 0 3px rgba(220,38,38,0.15)",
                        marginRight: 8,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                  {j.title}
                </h3>
                <div style={S.metaRow}>
                  <span style={S.chip}>{j.category}</span>
                  {j.urgency && <span style={S.chip}>{j.urgency}</span>}
                  {j.status && <span style={statusChipStyle(j.status)}>{j.status}</span>}
                </div>
                <div style={S.detailRow}>
                  <span style={S.detail}>
                    <MapPin size={11} /> {j.property_name || j.property_address || "—"}
                    {j.property_city ? `, ${j.property_city}` : ""}
                  </span>
                  <span style={S.detail}>
                    <DollarSign size={11} /> {fmtMoney(j.budget_min)} – {fmtMoney(j.budget_max)}
                  </span>
                  <span style={S.detail}>
                    <Calendar size={11} /> Due {fmtDate(j.due_date)}
                  </span>
                </div>
              </div>
              {canManage && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "flex-start" }}>
                  <button
                    style={S.manageBtn}
                    onClick={() => openManage(j)}
                    title="View bids and manage lifecycle"
                  >
                    <Layers size={13} />
                    Manage
                  </button>
                  <button
                    style={S.iconBtn}
                    onClick={() => { setEditingJob(j); setShowForm(true); }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    style={{ ...S.iconBtn, color: "#dc2626" }}
                    onClick={() => setDeletingJob(j)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminJobFormModal
        isOpen={showForm}
        job={editingJob}
        onClose={() => { setShowForm(false); setEditingJob(null); }}
        onSuccess={fetchJobs}
      />

      <AdminInspectionUploadModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={fetchJobs}
      />

      <AdminJobLifecycleModal
        isOpen={!!managingJob}
        job={managingJob}
        onClose={() => { setManagingJob(null); fetchJobs(); }}
        onChange={fetchJobs}
      />

      {deletingJob && (
        <DeleteConfirm
          title="Delete this job?"
          desc="This will permanently remove the job and cascade-delete any bids and contracts attached to it."
          subject={deletingJob.title}
          isDeleting={isDeleting}
          onCancel={() => setDeletingJob(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

const statusChipStyle = (status) => {
  const palettes = {
    open: { bg: "#dbeafe", color: "#1d4ed8", bd: "#bfdbfe" },
    accepted: { bg: "#dcfce7", color: "#166534", bd: "#bbf7d0" },
    ongoing: { bg: "#fef3c7", color: "#a16207", bd: "#fde68a" },
    completed: { bg: "#ede9fe", color: "#6d28d9", bd: "#ddd6fe" },
    closed: { bg: "#f3f4f6", color: "#4b5563", bd: "#e5e7eb" },
    declined: { bg: "#fee2e2", color: "#b91c1c", bd: "#fecaca" },
  };
  const p = palettes[String(status).toLowerCase()] || palettes.closed;
  return {
    display: "inline-flex", alignItems: "center", padding: "3px 8px",
    borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: p.bg, color: p.color, border: `1px solid ${p.bd}`,
  };
};

const S = {
  empty: {
    padding: 60, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb",
    borderRadius: 12, marginTop: 16,
  },
  filterBar: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap",
  },
  tabs: {
    display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap",
    padding: 4, background: "#f1f5f9", borderRadius: 10, width: "fit-content",
  },
  tab: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", background: "transparent", border: "none", borderRadius: 7,
    fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s, color 0.15s",
  },
  tabActive: {
    background: "#fff", color: "#0F223D",
    boxShadow: "0 1px 3px rgba(15,34,61,0.06)",
  },
  tabCount: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 22, padding: "0 6px", height: 18,
    background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 10, fontSize: 10, fontWeight: 700, color: "#6b7280",
  },
  tabCountActive: {
    background: "#00A5A9", color: "#fff", border: "1px solid #00A5A9",
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  card: {
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
    padding: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: 700, color: "#0F223D", margin: 0, lineHeight: 1.3 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: {
    display: "inline-flex", alignItems: "center", padding: "3px 8px",
    background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6,
    fontSize: 11, fontWeight: 600, color: "#475569",
  },
  detailRow: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8, color: "#6b7280", fontSize: 12 },
  detail: { display: "inline-flex", alignItems: "center", gap: 4 },
  iconBtn: {
    width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, color: "#374151",
    cursor: "pointer",
  },
  manageBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    height: 28, padding: "0 10px",
    background: "#00A5A9", color: "#fff",
    border: "none", borderRadius: 6,
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
};
