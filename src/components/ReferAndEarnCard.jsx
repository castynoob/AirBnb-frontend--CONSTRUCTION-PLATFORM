// =============================================================================
// ReferAndEarnCard — the user-facing surface for the referral programme.
//
// Renders:
//   • The user's own referral code + one-click copy + share URL
//   • Their stats (pending / converted)
//   • Programme terms (the two percentages, pulled from settings)
//
// Fetches from GET /api/referrals/my-info on mount. Renders nothing if the
// programme is inactive or the endpoint 401s — the profile page keeps
// working either way.
// =============================================================================

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ReferAndEarnCard() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem("userProfile");
        const token = stored ? JSON.parse(stored)?.token : null;
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/referrals/my-info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const body = await res.json();
        setInfo(body);
      } catch { /* leave info null */ }
      setLoading(false);
    })();
  }, []);

  if (loading || !info || info.settings?.active === false) return null;

  const shareUrl = `${window.location.origin}/?ref=${info.code}`;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast.success("Copied to clipboard.");
        setTimeout(() => setCopied(false), 1600);
      },
      () => toast.error("Couldn't copy — copy manually."),
    );
  };

  const nativeShare = async () => {
    if (!navigator.share) { copy(shareUrl); return; }
    try {
      await navigator.share({
        title: "Join me on INTERVOS",
        text: `Sign up with my code ${info.code} and save ${info.settings.referee_discount_percent}% on your first subscription.`,
        url: shareUrl,
      });
    } catch { /* user cancelled — no-op */ }
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.iconBadge}>
          <Gift size={18} />
        </div>
        <div>
          <div style={s.title}>Refer &amp; earn</div>
          <div style={s.subtitle}>
            Refer another contractor: they save <b>{info.settings.referee_discount_percent}%</b> on their first INTERVOS subscription,
            and you get <b>{info.settings.referrer_discount_percent}%</b> off your next renewal the moment their first payment clears.
          </div>
        </div>
      </div>

      {/* Code + copy row */}
      <div style={s.codeRow}>
        <div style={s.codeChunk}>
          <div style={s.codeLabel}>Your code</div>
          <div style={s.code}>{info.code}</div>
        </div>
        <button type="button" onClick={() => copy(info.code)} style={s.copyBtn}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* Share link */}
      <div style={s.linkRow}>
        <div style={s.linkText} title={shareUrl}>{shareUrl}</div>
        <div style={s.linkActions}>
          <button type="button" onClick={() => copy(shareUrl)} style={s.linkBtn} title="Copy share link">
            <Copy size={13} />
          </button>
          <button type="button" onClick={nativeShare} style={s.linkBtnPrimary} title="Share">
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statRow}>
        <div style={s.stat}>
          <div style={s.statNum}>{info.stats.total}</div>
          <div style={s.statLbl}>Total invites</div>
        </div>
        <div style={s.statSep} />
        <div style={s.stat}>
          <div style={s.statNum}>{info.stats.converted}</div>
          <div style={s.statLbl}>Converted</div>
        </div>
        <div style={s.statSep} />
        <div style={s.stat}>
          <div style={s.statNum}>{info.stats.pending}</div>
          <div style={s.statLbl}>Pending</div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    background: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
    border: "1px solid #a5f3fc",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 20,
  },
  header: { display: "flex", gap: 14, alignItems: "flex-start" },
  iconBadge: {
    width: 40, height: 40, borderRadius: 10,
    background: "#14919B", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 700, color: "#0F223D", letterSpacing: "-0.01em" },
  subtitle: { fontSize: 13, color: "#334155", marginTop: 4, lineHeight: 1.55 },

  codeRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: 14,
    background: "#fff", border: "1px solid #cffafe", borderRadius: 10,
  },
  codeChunk: { minWidth: 0 },
  codeLabel: {
    fontSize: 11, fontWeight: 700, color: "#0e7490",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
  },
  code: {
    fontSize: 22, fontWeight: 800, color: "#0F223D",
    letterSpacing: "0.12em", fontFamily: "ui-monospace, SFMono-Regular, monospace",
  },
  copyBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", border: "1px solid #14919B", borderRadius: 8,
    background: "#fff", color: "#14919B",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", flexShrink: 0,
  },

  linkRow: {
    display: "flex", gap: 8, alignItems: "center",
    padding: "8px 12px",
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
  },
  linkText: {
    flex: 1, minWidth: 0,
    fontSize: 12, color: "#475569",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  linkActions: { display: "flex", gap: 6, flexShrink: 0 },
  linkBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: "#f8fafc", border: "1px solid #e5e7eb",
    color: "#475569", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  linkBtnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "0 10px", height: 28, borderRadius: 6,
    background: "#14919B", border: "none", color: "#fff",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit",
  },

  statRow: {
    display: "flex", alignItems: "stretch",
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
    padding: "10px 0",
  },
  stat: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  statNum: { fontSize: 20, fontWeight: 800, color: "#0F223D", letterSpacing: "-0.02em" },
  statLbl: {
    fontSize: 10, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.06em",
  },
  statSep: { width: 1, background: "#e5e7eb", margin: "6px 0" },
};
