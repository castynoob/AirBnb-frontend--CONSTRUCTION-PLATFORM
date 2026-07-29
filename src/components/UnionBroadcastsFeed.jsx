// =============================================================================
// UnionBroadcastsFeed — resident-facing panel that lists broadcasts from the
// union their property belongs to. Renders nothing if the resident's property
// isn't linked to a union, so it's safe to drop into the homepage
// unconditionally.
// =============================================================================

import { useEffect, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

// Fallback helper — `t(key) || 'fallback'` doesn't work because our i18n
// returns the key itself when unresolved (truthy). This returns the fallback
// only when the key came back unresolved.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

const CATEGORY_COLORS = {
  notice:      { bg: "#eef4ff", color: "#1e40af" },
  event:       { bg: "#dcfce7", color: "#166534" },
  maintenance: { bg: "#fef3c7", color: "#92400e" },
  emergency:   { bg: "#fee2e2", color: "#7f1d1d" },
};

export default function UnionBroadcastsFeed({ propertyId }) {
  const { t, language } = useLanguage();
  const [union, setUnion] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Category labels resolve via i18n on each render so a language switch
  // updates them without needing to re-fetch.
  const catLabel = (cat) => tf(t, `union.cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`, cat);

  useEffect(() => {
    if (!propertyId) return;
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/unions/property/${propertyId}/broadcasts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const body = await res.json();
        setUnion(body.union || null);
        setBroadcasts(body.broadcasts || []);
      } catch { /* silent */ }
      finally { setLoaded(true); }
    })();
  }, [propertyId]);

  if (!loaded || !union) return null;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <Users size={16} />
        <span style={s.headerText}>{union.name}</span>
        <span style={s.badge}>{tf(t, 'union.unionBadge', 'Union')}</span>
      </div>
      {broadcasts.length === 0 ? (
        <div style={s.empty}>
          <Megaphone size={20} style={{ opacity: 0.4 }} />
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
            {tf(t, 'union.noBroadcastsResident', 'No broadcasts from your union yet.')}
          </p>
        </div>
      ) : (
        <ul style={s.list}>
          {broadcasts.map((b) => {
            const colors = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.notice;
            const author = `${b.author_first_name || ""} ${b.author_last_name || ""}`.trim() || tf(t, 'union.unionBadge', 'Union');
            return (
              <li key={b.id} style={s.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 999,
                    background: colors.bg, color: colors.color,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{catLabel(b.category)}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {new Date(b.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div style={s.title}>{b.title}</div>
                <div style={s.body}>{b.body}</div>
                <div style={s.author}>— {author}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const s = {
  wrap: {
    background: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
    border: "1px solid #a5f3fc", borderRadius: 14,
    padding: 16, marginBottom: 20,
  },
  header: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14, fontWeight: 700, color: "#0F223D",
    flex: 1, minWidth: 0,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  badge: {
    padding: "2px 8px", borderRadius: 999,
    background: "#14919B", color: "#fff",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
  },
  empty: {
    padding: 20, textAlign: "center",
    background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 10,
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  card: {
    padding: 14, background: "#fff",
    border: "1px solid #cffafe", borderRadius: 10,
  },
  title: { fontWeight: 700, color: "#0F223D", fontSize: 14 },
  body: {
    fontSize: 13, color: "#334155", marginTop: 4,
    lineHeight: 1.55, whiteSpace: "pre-wrap",
  },
  author: { fontSize: 11, color: "#94a3b8", marginTop: 8 },
};
