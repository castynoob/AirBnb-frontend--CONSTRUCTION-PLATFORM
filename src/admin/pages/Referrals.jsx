// =============================================================================
// AdminReferrals — dedicated referral programme page.
//
// Sections (top → bottom):
//   1. Settings strip — active toggle + two discount %. Same UX as the
//      previous Dashboard card; saves on blur / toggle change.
//   2. Stats row — total, converted, pending, unique referrers.
//   3. Filter chips — All / Pending / Converted.
//   4. Referrals table — one row per referral with referrer + referee names,
//      emails, code used, timestamps, and reward-issuance status.
//
// Rewards note: the referrer's reward auto-issue on conversion is deferred
// (needs Stripe webhook wiring). Until then, the `converted_at` column
// stays NULL until a webhook — or a manual admin action — flips it. The
// table highlights the pending state so it's easy to eyeball.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Gift, RefreshCw, Search } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

const fullName = (first, last) =>
  `${first || ""} ${last || ""}`.trim() || "—";

export default function Referrals() {
  const { getToken } = useAdminAuth();

  // Settings state
  const [settings, setSettings] = useState({
    active: true,
    referrer_discount_percent: 20,
    referee_discount_percent: 20,
  });
  const [saving, setSaving] = useState(false);

  // List state
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, converted: 0, pending: 0, unique_referrers: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(""); // "" | "pending" | "converted"
  const [search, setSearch] = useState("");

  const loadSettings = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/referral-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.settings) setSettings({
        active: !!body.settings.active,
        referrer_discount_percent: Number(body.settings.referrer_discount_percent) || 0,
        referee_discount_percent:  Number(body.settings.referee_discount_percent)  || 0,
      });
    } catch { /* ignore */ }
  }, [getToken]);

  const loadReferrals = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`${API_URL}/api/admin/referral-settings/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setRows(body.referrals || []);
      setStats(body.stats || { total: 0, converted: 0, pending: 0, unique_referrers: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken, filter]);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  const saveSettings = async (next) => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/referral-settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Failed to save.");
      const body = await res.json();
      if (body?.settings) setSettings({
        active: !!body.settings.active,
        referrer_discount_percent: Number(body.settings.referrer_discount_percent) || 0,
        referee_discount_percent:  Number(body.settings.referee_discount_percent)  || 0,
      });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // Client-side search across names/emails/codes for the currently loaded
  // page. Widening beyond the loaded page would need a server-side search
  // param — cheap follow-up when volume grows.
  const q = search.trim().toLowerCase();
  const filteredRows = q
    ? rows.filter((r) => {
        const haystack = [
          r.code_used, r.referrer_email, r.referee_email,
          fullName(r.referrer_first_name, r.referrer_last_name),
          fullName(r.referee_first_name,  r.referee_last_name),
        ].join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : rows;

  return (
    <div className="admin-dashboard">
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Referrals</h1>
          <p className="admin-page-subtitle">
            <b>Contractor-to-contractor only</b> — since the reward is a subscription discount, non-contractor signups are rejected at attribution. Referee's discount auto-applies at first-sub checkout; referrer's promo is issued when that first payment clears. Same-email / same-phone / same-IP signups are also blocked.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={loadReferrals}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Settings strip */}
      <div
        style={{
          padding: "14px 18px", marginBottom: 20,
          background: settings.active
            ? "linear-gradient(90deg, #ecfeff 0%, #dbeafe 100%)"
            : "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
          border: `1px solid ${settings.active ? "#a5f3fc" : "#e5e7eb"}`,
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: settings.active ? "#14919B" : "#94a3b8",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Gift size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#0F223D", fontSize: 14 }}>
              Programme status {settings.active && <span style={{ color: "#059669", marginLeft: 6 }}>· ACTIVE</span>}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>
              Changes apply to new signups immediately. In-flight referrals keep the % they were issued at.
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={settings.active}
              onChange={(e) => {
                const next = { ...settings, active: e.target.checked };
                setSettings(next); saveSettings(next);
              }}
              disabled={saving}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: "absolute", inset: 0,
              background: settings.active ? "#14919B" : "#cbd5e1",
              borderRadius: 24, transition: "background 0.2s",
            }} />
            <span style={{
              position: "absolute", top: 2, left: settings.active ? 22 : 2,
              width: 20, height: 20, background: "#fff",
              borderRadius: "50%", transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0F223D", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Referee discount (%)
            </span>
            <input
              type="number" min={0} max={100}
              value={settings.referee_discount_percent}
              onChange={(e) => setSettings({ ...settings, referee_discount_percent: Number(e.target.value) })}
              onBlur={() => saveSettings(settings)}
              disabled={!settings.active || saving}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0F223D" }}
            />
            <span style={{ fontSize: 11, color: "#64748b" }}>
              What the new signup saves on their first subscription.
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0F223D", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Referrer discount (%)
            </span>
            <input
              type="number" min={0} max={100}
              value={settings.referrer_discount_percent}
              onChange={(e) => setSettings({ ...settings, referrer_discount_percent: Number(e.target.value) })}
              onBlur={() => saveSettings(settings)}
              disabled={!settings.active || saving}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0F223D" }}
            />
            <span style={{ fontSize: 11, color: "#64748b" }}>
              What the advocate gets when their referral converts.
            </span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20,
      }}>
        {[
          { label: "Total referrals", value: stats.total,           color: "#0F223D" },
          { label: "Converted",       value: stats.converted,       color: "#059669" },
          { label: "Pending",         value: stats.pending,         color: "#d97706" },
          { label: "Unique referrers", value: stats.unique_referrers, color: "#0e7490" },
        ].map((s2) => (
          <div key={s2.label} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s2.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s2.color, marginTop: 4, letterSpacing: "-0.02em" }}>
              {s2.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14,
      }}>
        {[
          { label: "All", value: "" },
          { label: `Pending (${stats.pending})`, value: "pending" },
          { label: `Converted (${stats.converted})`, value: "converted" },
        ].map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value || "all"}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "7px 14px", borderRadius: 999,
                background: active ? "#0F223D" : "#fff",
                color: active ? "#fff" : "#0F223D",
                border: `1px solid ${active ? "#0F223D" : "#e5e7eb"}`,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: "6px 12px",
        }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, email, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0F223D", background: "transparent" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                <Th>Referrer</Th>
                <Th>Referee</Th>
                <Th>Code</Th>
                <Th>Signed up</Th>
                <Th>Converted</Th>
                <Th>Referee reward</Th>
                <Th>Referrer reward</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</td></tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  {q ? "No referrals match your search." : "No referrals yet."}
                </td></tr>
              )}
              {!loading && filteredRows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <Td>
                    <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 13 }}>
                      {fullName(r.referrer_first_name, r.referrer_last_name)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.referrer_email}</div>
                    <RolePill role={r.referrer_role} />
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 13 }}>
                      {fullName(r.referee_first_name, r.referee_last_name)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.referee_email}</div>
                    <RolePill role={r.referee_role} />
                  </Td>
                  <Td>
                    <code style={{
                      fontSize: 12, background: "#f1f5f9", color: "#0F223D",
                      padding: "2px 8px", borderRadius: 6, fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}>{r.code_used}</code>
                  </Td>
                  <Td muted>{fmtDate(r.created_at)}</Td>
                  <Td>
                    {r.converted_at ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 999,
                        background: "#dcfce7", color: "#166534",
                        fontSize: 11, fontWeight: 700,
                      }}>✓ {fmtDate(r.converted_at)}</span>
                    ) : (
                      <span style={{
                        padding: "2px 8px", borderRadius: 999,
                        background: "#fef3c7", color: "#92400e",
                        fontSize: 11, fontWeight: 700,
                      }}>Pending</span>
                    )}
                  </Td>
                  <Td muted>{r.referee_promo_id ? "Issued" : "—"}</Td>
                  <Td muted>{r.referrer_promo_id ? "Issued" : "Pending"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const Th = ({ children }) => (
  <th style={{
    textAlign: "left", padding: "10px 14px",
    fontSize: 11, fontWeight: 700, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  }}>{children}</th>
);

const Td = ({ children, muted }) => (
  <td style={{
    padding: "12px 14px",
    fontSize: 13, color: muted ? "#64748b" : "#0F223D",
    verticalAlign: "top",
  }}>{children}</td>
);

const RolePill = ({ role }) => {
  if (!role) return null;
  const map = {
    entrepreneur:     { bg: "#eef4ff", color: "#1e40af", label: "Contractor" },
    property_manager: { bg: "#fef3c7", color: "#92400e", label: "PM" },
    resident:         { bg: "#dcfce7", color: "#166534", label: "Resident" },
  };
  const t = map[role] || { bg: "#f1f5f9", color: "#475569", label: role };
  return (
    <span style={{
      display: "inline-block", marginTop: 4,
      padding: "1px 8px", borderRadius: 999,
      background: t.bg, color: t.color,
      fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>{t.label}</span>
  );
};
