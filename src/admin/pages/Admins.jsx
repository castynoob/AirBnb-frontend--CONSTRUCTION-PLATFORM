// =============================================================================
// Admins — manage admin user accounts.
// List, create new admin (email + password + role), update role/status,
// soft-delete (deactivate).
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Plus, RefreshCw, ShieldCheck, X, Search, Mail, Lock, User as UserIcon, Pencil, UserMinus, AlertCircle, Check,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ROLES = [
  { value: "super_admin", label: "Super Admin",  desc: "Full access — can manage other admins" },
  { value: "admin",       label: "Admin",        desc: "Operations + finance, view audit logs" },
  { value: "moderator",   label: "Moderator",    desc: "Content moderation only (flag, notes)" },
  { value: "support",     label: "Support",      desc: "Reply to support tickets only" },
];

const STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "inactive",  label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function Admins() {
  const { getToken, admin: currentAdmin, canManageSettings, isAdminOrHigher } = useAdminAuth();
  const isSuperAdmin = typeof canManageSettings === "function" ? canManageSettings() : false;
  const canViewList = typeof isAdminOrHigher === "function" ? isAdminOrHigher() : false;

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/admin/admins`);
      if (search.trim()) url.searchParams.set("search", search.trim());
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load admins");
      setAdmins(data.admins || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleDeactivate = async (adminUser) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Deactivate ${adminUser.email}? They will lose access until reactivated.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/admins/${adminUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Admin deactivated");
      fetchAdmins();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!canViewList) {
    return (
      <div style={S.notice}>
        <AlertCircle size={32} color="#dc2626" />
        <p style={{ marginTop: 8 }}>You don't have permission to view admin users.</p>
      </div>
    );
  }

  return (
    <div className="admin-properties">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admins</h1>
          <p className="admin-page-subtitle">
            Manage platform staff accounts — create new admins, change roles, deactivate.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchAdmins}>
            <RefreshCw size={16} /> Refresh
          </button>
          {isSuperAdmin && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={16} /> New admin
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: "relative", maxWidth: 380 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", paddingLeft: 36, padding: "9px 12px 9px 36px",
            border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit",
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : admins.length === 0 ? (
        <div style={S.empty}>
          <ShieldCheck size={36} color="#cbd5e1" />
          <p style={{ marginTop: 12, color: "#0F223D", fontWeight: 600 }}>No admins match.</p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Last login</th>
                <th style={S.th}>Created</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf = a.id === currentAdmin?.id;
                return (
                  <tr key={a.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={S.avatar}>{(a.name || a.email || "?").charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 600 }}>{a.name || "—"}</span>
                        {isSelf && <span style={S.selfTag}>You</span>}
                      </div>
                    </td>
                    <td style={S.td}>{a.email}</td>
                    <td style={S.td}><RoleBadge role={a.role} /></td>
                    <td style={S.td}><StatusBadge status={a.status} /></td>
                    <td style={S.td}>{a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "—"}</td>
                    <td style={S.td}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button
                          style={S.iconBtn}
                          onClick={() => setEditing(a)}
                          title="Edit role or status"
                        >
                          <Pencil size={14} />
                        </button>
                        {isSuperAdmin && !isSelf && a.status === "active" && (
                          <button
                            style={{ ...S.iconBtn, color: "#dc2626" }}
                            onClick={() => handleDeactivate(a)}
                            title="Deactivate admin"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchAdmins(); }}
        />
      )}

      {editing && (
        <EditAdminModal
          admin={editing}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); fetchAdmins(); }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CreateAdminModal — super_admin only
// -----------------------------------------------------------------------------
function CreateAdminModal({ onClose, onSuccess }) {
  const { getToken } = useAdminAuth();
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "admin" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.email) err.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Invalid email";
    if (!form.password || form.password.length < 8) err.password = "Min 8 characters";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/admins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create admin");
      toast.success("Admin created");
      onSuccess?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={(e) => e.stopPropagation()}>
        <div style={M.header}>
          <div style={M.title}><ShieldCheck size={20} /> Create new admin</div>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={M.body}>
          <Field label="Email" required>
            <div style={M.inputWithIcon}>
              <Mail size={14} style={M.icon} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                style={{ ...M.input, paddingLeft: 36 }}
                placeholder="admin@intervos.com"
                autoComplete="off"
              />
            </div>
            {errors.email && <Err msg={errors.email} />}
          </Field>

          <Field label="Password" required>
            <div style={M.inputWithIcon}>
              <Lock size={14} style={M.icon} />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                style={{ ...M.input, paddingLeft: 36 }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            {errors.password && <Err msg={errors.password} />}
          </Field>

          <Field label="Display name">
            <div style={M.inputWithIcon}>
              <UserIcon size={14} style={M.icon} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={{ ...M.input, paddingLeft: 36 }}
                placeholder="Optional — defaults to email prefix"
              />
            </div>
          </Field>

          <Field label="Role">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ROLES.map((r) => (
                <label key={r.value} style={M.roleRow}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={() => setForm((p) => ({ ...p, role: r.value }))}
                  />
                  <span>
                    <strong style={{ color: "#0F223D" }}>{r.label}</strong>
                    <em style={{ display: "block", fontSize: 11, color: "#6b7280", fontStyle: "normal" }}>{r.desc}</em>
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <div style={M.footer}>
            <button type="button" style={M.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" style={M.primaryBtn} disabled={submitting}>
              <Check size={14} /> {submitting ? "Creating…" : "Create admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// EditAdminModal — change role / status / password
// -----------------------------------------------------------------------------
function EditAdminModal({ admin, isSuperAdmin, onClose, onSuccess }) {
  const { getToken } = useAdminAuth();
  const [form, setForm] = useState({
    name: admin.name || "",
    role: admin.role,
    status: admin.status,
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Only send non-empty/changed fields. Empty password = unchanged.
      const body = {};
      if (form.name && form.name !== admin.name) body.name = form.name;
      if (form.role !== admin.role) body.role = form.role;
      if (form.status !== admin.status) body.status = form.status;
      if (form.password) body.password = form.password;
      if (Object.keys(body).length === 0) {
        toast("Nothing changed.");
        onClose();
        return;
      }
      const res = await fetch(`${API_URL}/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Admin updated");
      onSuccess?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={(e) => e.stopPropagation()}>
        <div style={M.header}>
          <div style={M.title}><Pencil size={18} /> Edit admin</div>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={M.body}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Editing <strong>{admin.email}</strong>
          </p>

          <Field label="Display name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              style={M.input}
            />
          </Field>

          {isSuperAdmin && (
            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={M.input}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              style={M.input}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Reset password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              style={M.input}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </Field>

          <div style={M.footer}>
            <button type="button" style={M.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" style={M.primaryBtn} disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Tiny helpers
// -----------------------------------------------------------------------------
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Err({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#dc2626", fontSize: 11, marginTop: 4 }}>
      <AlertCircle size={12} /> {msg}
    </div>
  );
}

function RoleBadge({ role }) {
  const palettes = {
    super_admin: { bg: "#fef3c7", color: "#a16207", bd: "#fde68a", label: "Super Admin" },
    admin:       { bg: "#dbeafe", color: "#1d4ed8", bd: "#bfdbfe", label: "Admin" },
    moderator:   { bg: "#dcfce7", color: "#166534", bd: "#bbf7d0", label: "Moderator" },
    support:     { bg: "#f3f4f6", color: "#4b5563", bd: "#e5e7eb", label: "Support" },
  };
  const p = palettes[role] || palettes.support;
  return (
    <span style={{
      display: "inline-flex", padding: "3px 8px",
      background: p.bg, color: p.color, border: `1px solid ${p.bd}`,
      borderRadius: 6, fontSize: 11, fontWeight: 600,
    }}>
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const palettes = {
    active:    { bg: "#dcfce7", color: "#166534", bd: "#bbf7d0" },
    inactive:  { bg: "#f3f4f6", color: "#4b5563", bd: "#e5e7eb" },
    suspended: { bg: "#fee2e2", color: "#b91c1c", bd: "#fecaca" },
  };
  const p = palettes[status] || palettes.inactive;
  return (
    <span style={{
      display: "inline-flex", padding: "3px 8px",
      background: p.bg, color: p.color, border: `1px solid ${p.bd}`,
      borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "capitalize",
    }}>
      {status || "—"}
    </span>
  );
}

const S = {
  notice: {
    padding: 60, textAlign: "center", background: "#fff", borderRadius: 12,
    border: "1px solid #fecaca", color: "#dc2626",
  },
  empty: {
    padding: 60, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb",
    borderRadius: 12, marginTop: 16,
  },
  tableWrap: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "10px 12px", color: "#0F223D", verticalAlign: "middle" },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #00A5A9, #008C8F)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 12,
  },
  selfTag: {
    padding: "2px 6px", background: "#eef2ff", color: "#4338ca",
    fontSize: 10, fontWeight: 600, borderRadius: 4,
  },
  iconBtn: {
    width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, color: "#374151",
    cursor: "pointer",
  },
};

const M = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,34,61,0.5)",
    backdropFilter: "blur(3px)", zIndex: 1100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", width: "100%", maxWidth: 480,
    height: "min(720px, 90vh)", maxHeight: "90vh",
    borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 50px rgba(15,34,61,0.18)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", background: "#0F223D", color: "#fff",
  },
  title: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600 },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
  },
  body: { padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#0F223D",
    background: "#fff", outline: "none",
  },
  inputWithIcon: { position: "relative" },
  icon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
  roleRow: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8,
    cursor: "pointer",
  },
  footer: {
    display: "flex", gap: 8, justifyContent: "flex-end",
    paddingTop: 6, borderTop: "1px solid #e5e7eb",
  },
  cancelBtn: {
    padding: "9px 18px", background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 8, fontWeight: 500, color: "#374151", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 18px", background: "#00A5A9", border: "none",
    borderRadius: 8, fontWeight: 600, color: "#fff", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14,
  },
};
