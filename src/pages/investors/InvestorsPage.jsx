// =============================================================================
// Investors — public thank-you page for backers.
// =============================================================================
// Content comes from `src/data/investors.js` (a static array). No API, no
// admin panel — the list changes infrequently, so a code edit is a totally
// fine update path for now.
//
// Layout:
//   • Hero header (title + subtitle + gratitude line)
//   • Investors grouped by tier (Founding → Growth → Angel → other)
//   • Each card: logo (or monogram), name, tier pill, blurb, optional quote,
//     "Visit site" pill, "Backing us since YYYY" footer note
//   • Empty state when the roster is still empty
//
// Public — no auth. Nav is shown when the visitor is logged in.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Heart, ArrowLeft } from "lucide-react";
import Nav from "../../components/Nav";
import investors from "../../data/investors";

// Preferred display order for known tiers. Anything else (custom tier
// strings) is sorted alphabetically and appended after these.
const TIER_ORDER = ["Founding", "Growth", "Angel"];

const groupByTier = (list) => {
  const buckets = new Map();
  list.forEach((inv) => {
    const key = inv.tier || "Supporters";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(inv);
  });
  // Sort the tier keys: known tiers first (in TIER_ORDER), then everything
  // else alphabetically. Keeps the page predictable as new tiers appear.
  const keys = [...buckets.keys()].sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a);
    const bi = TIER_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  return keys.map((k) => [k, buckets.get(k)]);
};

const normaliseUrl = (u) => (u && /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : "");

export default function InvestorsPage() {
  const navigate = useNavigate();
  const grouped = useMemo(() => groupByTier(investors), []);

  // Hide the sidebar for logged-out visitors so the page reads as a
  // marketing/thank-you surface, not an app screen.
  const [viewerRole, setViewerRole] = useState(null);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setViewerRole(p?.role || null);
    } catch { /* not logged in */ }
  }, []);
  const showNav = !!viewerRole;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {showNav && <Nav />}
      <div className={showNav ? "main-container" : ""} style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={s.backBtn} aria-label="Back">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={s.eyebrow}>
                <Heart size={12} fill="#dc2626" color="#dc2626" />
                Our investors
              </div>
              <h1 style={s.title}>Thank you for believing in us</h1>
              <p style={s.subtitle}>
                INTERVOS wouldn't exist without the backers who bet on our vision to modernise Quebec's construction procurement. This page is our public thanks — and a place to show them off.
              </p>
            </div>
          </div>
          {!showNav && (
            <button onClick={() => navigate("/")} style={s.linkBtn}>Home</button>
          )}
        </div>

        {/* Body */}
        {investors.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🫶</div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#0F223D" }}>Coming soon</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14, maxWidth: 460, lineHeight: 1.6 }}>
              We're preparing to introduce the partners backing INTERVOS. Check back shortly — their logos will live here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {grouped.map(([tier, items]) => (
              <section key={tier}>
                <div style={s.tierHeader}>
                  <span style={s.tierPill}>{tier}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                    {items.length} {items.length === 1 ? "backer" : "backers"}
                  </span>
                </div>
                <div style={s.grid}>
                  {items.map((inv, i) => (
                    <article key={`${tier}-${i}`} style={s.card}>
                      <header style={s.cardHeader}>
                        <div style={s.logoWrap}>
                          {inv.logo ? (
                            <img src={inv.logo} alt={`${inv.name} logo`} style={s.logo} />
                          ) : (
                            <span style={s.monogram}>{(inv.name || "?")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={s.cardName}>{inv.name}</h3>
                          {inv.since && (
                            <div style={s.cardSince}>Backing us since {inv.since}</div>
                          )}
                        </div>
                      </header>
                      {inv.description && (
                        <p style={s.cardBody}>{inv.description}</p>
                      )}
                      {inv.quote && (
                        <blockquote style={s.cardQuote}>
                          "{inv.quote}"
                        </blockquote>
                      )}
                      {inv.website && (
                        <a
                          href={normaliseUrl(inv.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.cardLink}
                        >
                          <ExternalLink size={13} />
                          Visit site
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    background: "#fff", border: "1px solid #e5e7eb",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#0F223D",
    flexShrink: 0, marginTop: 6,
  },
  eyebrow: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 700, color: "#dc2626",
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)",
    fontWeight: 800,
    color: "#0F223D",
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: 14,
    maxWidth: 620,
    lineHeight: 1.6,
  },
  linkBtn: {
    background: "transparent", border: "1px solid #e5e7eb", padding: "8px 14px",
    borderRadius: 8, color: "#0F223D", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },

  empty: {
    padding: 60,
    background: "#fff",
    border: "1px dashed #d1d5db",
    borderRadius: 14,
    marginTop: 12,
    // Flex column + centered items so both the emoji/title AND the max-width
    // paragraph center as a group. `text-align: center` alone doesn't center
    // block-level children with a max-width — they stay left-flush.
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  tierHeader: {
    display: "flex", alignItems: "center", gap: 12,
    marginBottom: 16,
  },
  tierPill: {
    padding: "5px 12px", borderRadius: 999,
    background: "#0F223D", color: "#fff",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  cardHeader: { display: "flex", gap: 14, alignItems: "center" },
  logoWrap: {
    width: 56, height: 56, borderRadius: 12,
    background: "#f8fafc", border: "1px solid #e5e7eb",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
  },
  logo: { maxWidth: "80%", maxHeight: "80%", objectFit: "contain" },
  monogram: {
    fontSize: 22, fontWeight: 800,
    background: "linear-gradient(135deg, #14919B, #0F223D)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  cardName: {
    margin: 0, fontSize: 16, fontWeight: 700, color: "#0F223D",
    lineHeight: 1.25,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  cardSince: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  cardBody: {
    margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.55,
  },
  cardQuote: {
    margin: 0, padding: "10px 12px",
    background: "#f8fafc", borderLeft: "3px solid #14919B",
    borderRadius: 4,
    fontSize: 12, color: "#334155", fontStyle: "italic", lineHeight: 1.5,
  },
  cardLink: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 12px", background: "#fff",
    border: "1px solid #14919B", color: "#14919B", borderRadius: 8,
    fontSize: 12, fontWeight: 700, textDecoration: "none",
    alignSelf: "flex-start",
    transition: "background 0.15s",
  },
};
