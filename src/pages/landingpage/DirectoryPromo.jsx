// =============================================================================
// Landing-page promo strip for the public specialist directory
// =============================================================================
//
// Fetches the top 4 opt-in entrepreneurs from /api/directory/entrepreneurs and
// shows them as compact "portfolio card" previews. If the directory is empty
// (early stage, nobody's opted in yet), falls back to a static promotional
// panel so the section still communicates the feature.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Star, MapPin, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function DirectoryPromo() {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/directory/entrepreneurs?limit=4&sort=photos`
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setSpecialists(json.entrepreneurs || []);
      } catch {
        if (!cancelled) setSpecialists([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="lp-directory-promo" id="directory-promo">
      <div className="lp-directory-promo-inner">
        {/* Editorial header */}
        <div className="lp-directory-promo-header">
          <div>
            <div className="lp-directory-promo-eyebrow">The Directory</div>
            <h2>Browse verified specialists.</h2>
            <p>
              Every listed contractor is opt-in, RBQ-checked, and shows real portfolio work —
              not stock photos. Find the trade you need, see who's done it before, decide with confidence.
            </p>
            <button
              className="lp-directory-promo-cta"
              onClick={() => navigate("/find-contractors")}
            >
              Open the directory <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Live preview OR promotional fallback */}
        {loading ? (
          <div className="lp-directory-promo-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="lp-directory-promo-skel" />
            ))}
          </div>
        ) : specialists.length > 0 ? (
          <div className="lp-directory-promo-grid">
            {specialists.map((s) => (
              <button
                key={s.id}
                className="lp-directory-promo-card"
                onClick={() => navigate("/find-contractors")}
                type="button"
              >
                <div className="lp-directory-promo-thumb">
                  {s.portfolio_preview?.[0]?.url ? (
                    <div
                      style={{
                        backgroundImage: `url(${s.portfolio_preview[0].url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <div className="lp-directory-promo-thumb-empty">No photos yet</div>
                  )}
                  {s.rbq_status === "valid" && (
                    <span className="lp-directory-promo-rbq" title="RBQ verified">
                      <ShieldCheck size={11} /> RBQ
                    </span>
                  )}
                </div>
                <div className="lp-directory-promo-body">
                  <div className="lp-directory-promo-name">{s.display_name}</div>
                  <div className="lp-directory-promo-meta">
                    {s.city && (
                      <span>
                        <MapPin size={11} /> {s.city}
                      </span>
                    )}
                    {s.avg_rating != null && (
                      <span>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />{" "}
                        {s.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {s.specializations?.length > 0 && (
                    <div className="lp-directory-promo-tags">
                      {s.specializations.slice(0, 2).map((sp, i) => (
                        <span key={i}>{capitalize(sp)}</span>
                      ))}
                      {s.specializations.length > 2 && (
                        <span>+{s.specializations.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="lp-directory-promo-empty">
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0F223D" }}>
              We're inviting the first wave of specialists now.
            </p>
            <p style={{ margin: "6px 0 14px", fontSize: 14, color: "#57616f", lineHeight: 1.55 }}>
              Directory launches with hand-vetted, RBQ-verified trades — carpenters, painters,
              plumbers, stretch-ceiling installers, bed makers, and more. Check back soon, or
              register as a contractor to be one of the first listings.
            </p>
            <button
              className="lp-directory-promo-cta"
              onClick={() => navigate("/find-contractors")}
            >
              Visit the directory <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
