// =============================================================================
// ResidentPropertyInvites — banner-list of pending "join this property" invites
// addressed to the logged-in resident. Rendered on their homepage; hidden
// entirely when there are no pending invites.
//
// Real-time: listens for the `resident_invite` socket event so a live invite
// pops in without a refresh.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Building2, Check, X, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../contexts/SocketContext";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

// t() returns the key when unresolved, so `t(key) || fb` never falls back.
// This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

export default function ResidentPropertyInvites({ onAccepted }) {
  const { t } = useLanguage();
  const [invites, setInvites] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const { socket } = useSocket();

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/residents/invites/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const body = await res.json();
      setInvites(body.invites || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live push — PM sends invite while this page is open.
  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on("resident_invite", handler);
    return () => socket.off("resident_invite", handler);
  }, [socket, load]);

  const respond = async (inviteId, action) => {
    setBusyId(inviteId);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/residents/invites/${inviteId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message || tf(t, 'residents.networkError', 'Something went wrong.'));
        return;
      }
      toast.success(action === "accept"
        ? tf(t, 'residents.onRoster', "You're on the property roster.")
        : tf(t, 'residents.declined', 'Invite declined.'));
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (action === "accept") onAccepted?.();
    } catch {
      toast.error(tf(t, 'residents.networkError', 'Network error.'));
    } finally {
      setBusyId(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <Building2 size={16} />
        <span>
          {tf(t,
            invites.length === 1 ? 'residents.inviteInboxTitle' : 'residents.inviteInboxTitlePlural',
            invites.length === 1 ? 'You have {{count}} property invite' : 'You have {{count}} property invites'
          ).replace('{{count}}', invites.length)}
        </span>
      </div>
      <ul style={s.list}>
        {invites.map((inv) => {
          const pm = `${inv.pm_first_name || ""} ${inv.pm_last_name || ""}`.trim() || "A property manager";
          return (
            <li key={inv.id} style={s.card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.title}>
                  {inv.building_name || "Property"}
                  {inv.invited_unit_number && (
                    <span style={s.unitPill}>{tf(t, 'residents.unit', 'Unit')} {inv.invited_unit_number}</span>
                  )}
                </div>
                <div style={s.meta}>
                  <MapPin size={12} /> {[inv.address, inv.city].filter(Boolean).join(", ") || tf(t, 'residents.noAddress', 'No address')}
                </div>
                <div style={s.sender}>
                  {tf(t, 'residents.invitedBy', 'Invited by {{name}}').replace('{{name}}', pm)}
                </div>
                {inv.message && (
                  <div style={s.messageBox}>"{inv.message}"</div>
                )}
              </div>
              <div style={s.actions}>
                <button
                  type="button"
                  onClick={() => respond(inv.id, "accept")}
                  disabled={busyId === inv.id}
                  style={{ ...s.acceptBtn, ...(busyId === inv.id ? { opacity: 0.6 } : {}) }}
                >
                  <Check size={14} />
                  {tf(t, 'residents.accept', 'Accept')}
                </button>
                <button
                  type="button"
                  onClick={() => respond(inv.id, "decline")}
                  disabled={busyId === inv.id}
                  style={{ ...s.declineBtn, ...(busyId === inv.id ? { opacity: 0.6 } : {}) }}
                >
                  <X size={14} />
                  {tf(t, 'residents.decline', 'Decline')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const s = {
  wrap: {
    background: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
    border: "1px solid #a5f3fc",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 700, color: "#0e7490",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12,
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: 14,
    background: "#fff", border: "1px solid #cffafe", borderRadius: 12,
    flexWrap: "wrap",
  },
  title: {
    fontWeight: 700, color: "#0F223D", fontSize: 15,
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
  },
  unitPill: {
    padding: "2px 8px", borderRadius: 999,
    background: "#eef4ff", color: "#1e40af",
    fontSize: 11, fontWeight: 700,
  },
  meta: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 12, color: "#6b7280", marginTop: 4,
  },
  sender: { fontSize: 12, color: "#334155", marginTop: 6 },
  messageBox: {
    marginTop: 8, padding: "8px 12px",
    background: "#f8fafc", borderLeft: "3px solid #14919B",
    borderRadius: 4,
    fontSize: 12, color: "#334155", fontStyle: "italic", lineHeight: 1.5,
  },
  actions: { display: "flex", gap: 8, flexShrink: 0 },
  acceptBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "8px 14px", background: "#059669", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  declineBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "8px 14px", background: "#fff", color: "#0F223D",
    border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
};
