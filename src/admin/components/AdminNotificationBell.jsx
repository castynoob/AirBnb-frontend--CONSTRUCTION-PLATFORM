// =============================================================================
// AdminNotificationBell — bell icon + dropdown feed for admin notifications.
//
// Lives in AdminLayout's topbar. Polls /api/admin/notifications/unread-count
// every 30s so admins don't need a hard refresh to see new bids on jobs they own.
//
// When user opens the dropdown we lazy-fetch the full list (cheaper than keeping
// the whole feed in memory across polls).
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const POLL_MS = 30_000;

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function notificationLine(n) {
  // Compose a one-line summary depending on the notification type.
  // For now only 'bid' is emitted to admins, but the renderer is forward-compatible.
  if (n.type === "bid") {
    const bidder = n.bidder_name || "Someone";
    const job = n.job_title ? ` on "${n.job_title}"` : "";
    const amount = n.bid_amount != null ? ` — $${Number(n.bid_amount).toLocaleString()}` : "";
    return `${bidder} placed a bid${job}${amount}`;
  }
  if (n.content) return n.content;
  return `New ${n.type} notification`;
}

function AdminNotificationBell() {
  const { getToken } = useAdminAuth();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${getToken()}` }),
    [getToken]
  );

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/notifications/unread-count`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch {
      // silent — polling shouldn't toast errors on a flaky network
    }
  }, [authHeaders]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/notifications`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notifications");
      setItems(data.notifications || []);
    } catch {
      // ignore — keep prior list visible
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // Poll unread count on mount + every POLL_MS.
  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_MS);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Refetch full list whenever the dropdown opens.
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const markOne = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const markAll = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/notifications/read-all`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const hasUnread = unreadCount > 0;
  const badgeText = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount]
  );

  return (
    <div ref={rootRef} style={styles.root}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        style={styles.bellBtn}
      >
        <Bell size={20} />
        {hasUnread && <span style={styles.badge}>{badgeText}</span>}
      </button>

      {open && (
        <div style={styles.panel} role="dialog" aria-label="Notifications">
          <div style={styles.header}>
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {hasUnread && (
                <button type="button" onClick={markAll} style={styles.linkBtn} title="Mark all as read">
                  <CheckCheck size={14} style={{ marginRight: 4 }} />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={styles.iconBtn}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={styles.list}>
            {loading && items.length === 0 ? (
              <div style={styles.empty}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={styles.empty}>No notifications yet</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.is_read && markOne(n.id)}
                  style={{
                    ...styles.item,
                    background: n.is_read ? "#fff" : "#eff6ff",
                  }}
                >
                  <div style={styles.itemText}>{notificationLine(n)}</div>
                  <div style={styles.itemMeta}>
                    {n.property_name ? `${n.property_name} · ` : ""}
                    {timeAgo(n.created_at)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { position: "relative", display: "inline-block" },
  bellBtn: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36, height: 36,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: -4, right: -4,
    minWidth: 18, height: 18,
    padding: "0 5px",
    borderRadius: 9,
    background: "#dc2626",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  panel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 360,
    maxWidth: "calc(100vw - 24px)",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
    zIndex: 1100,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    background: "#f8fafc",
  },
  list: { maxHeight: 420, overflowY: "auto" },
  empty: {
    padding: 24,
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
  item: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
  },
  itemText: {
    fontSize: 13,
    color: "#0f172a",
    lineHeight: 1.35,
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 11,
    color: "#64748b",
  },
  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    fontSize: 12,
    color: "#1d4ed8",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24, height: 24,
    padding: 0,
    color: "#64748b",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
};

export default AdminNotificationBell;
