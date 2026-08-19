// =============================================================================
// Specialist Directory — public browse page for opt-in entrepreneurs
// =============================================================================
// Anyone (logged in or not) can hit this page. Only lists entrepreneurs whose
// showcase_enabled = true AND who have at least one portfolio photo.
//
// Click a card → opens the existing EntrepreneurProfileModal with the profile
// data already loaded (the list endpoint returns the full portfolio too, so
// no round-trip needed).
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Star, Briefcase, ShieldCheck, ChevronLeft, ChevronRight, Send, Check, Inbox, Heart, ArrowUpDown } from "lucide-react";
import toast from "react-hot-toast";
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal";
import InviteToBidModal from "../../components/modal/InviteToBidModal";
import CustomSelect from "../../components/CustomSelect";
import Nav from "../../components/Nav";
import { useSocket } from "../../contexts/SocketContext";
import { useLanguage } from "../../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// t() returns the key when unresolved, so `t(key) || fb` never falls back.
// This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

// Sort options with i18n keys. Value stays canonical (hits the backend `sort`
// query param); label is resolved at render.
const SORT_OPTIONS = [
  { value: "photos", key: 'specialistDirectory.sortMostPortfolio', fb: 'Most portfolio work' },
  { value: "rating", key: 'specialistDirectory.sortHighestRated',  fb: 'Highest rated' },
  { value: "recent", key: 'specialistDirectory.sortRecentlyJoined', fb: 'Recently joined' },
];

// Quebec cities we already list on the registration form. Names stay in
// their native spelling (Montréal, Québec, Lévis) — those are city names,
// not translated strings.
const CITY_OPTIONS = [
  "Montréal",
  "Laval",
  "Longueuil",
  "Brossard",
  "Québec",
  "Gatineau",
  "Sherbrooke",
  "Trois-Rivières",
  "Terrebonne",
  "Lévis",
];
// Sentinel value used for the "all cities" option — kept as a fixed string
// so backend query building doesn't need to know about the display label.
// The user-visible label is resolved via i18n at render time
// (`specialistDirectory.allCities`).
const ALL_CITIES = "__all_cities__";

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Portfolio preview grid — the shape depends on how many photos exist so a
// 1-photo card doesn't leave 3/4 of the strip dark. Returns just the grid
// template overrides; base styles (height, gap, background) come from
// `s.previewStrip`.
const previewGridForCount = (count) => {
  if (count <= 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
  if (count === 2) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
  if (count === 3) return { gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" };
  // 4+: clean 2×2 grid so every slot is filled — the previous 3-col layout
  // left two dark cells empty when there were exactly 4 photos.
  return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
};

// For the 3-photo layout the first cell should span both rows so the big
// image on the left mirrors the 4-photo layout. Everything else is default.
const previewCellSpanForIndex = (count, index) => {
  if (count === 3 && index === 0) return { gridRow: "1 / span 2" };
  return {};
};

export default function SpecialistDirectory() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [search, setSearch] = useState("");
  const [trades, setTrades] = useState(new Set());
  const [city, setCity] = useState(ALL_CITIES);
  const [sort, setSort] = useState("photos");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ entrepreneurs: [], total: 0, totalPages: 1, trades: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProfile, setSelectedProfile] = useState(null);

  // Check if the visitor is authenticated — the "Invite to bid" CTA on each
  // card only makes sense for a logged-in property manager.
  const [viewerRole, setViewerRole] = useState(null);
  const [viewer, setViewer] = useState(null);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setViewerRole(p?.role || null);
      setViewer(p || null);
    } catch { /* not logged in */ }
  }, []);

  // Invite-to-bid state. The modal + fetch logic live in InviteToBidModal;
  // here we just hold the target and the session set of invited user_ids so
  // the per-card button can flip to "Invited ✓ · Invite to another job".
  const [inviteTarget, setInviteTarget] = useState(null);
  const [invitedIds, setInvitedIds] = useState(() => new Set());

  // ─── Contractor-side inbox ───────────────────────────────────────────────
  // If the viewer is an entrepreneur, load THEIR received invites so we can
  // show a "My Invites (N)" button in the header + open a modal listing all
  // of them. Refetched on the socket 'job_invite' event so a live invite
  // bumps the count immediately.
  const [myInvites, setMyInvites] = useState([]);
  const [showMyInvitesModal, setShowMyInvitesModal] = useState(false);
  const { socket } = useSocket();

  const loadMyInvites = useCallback(async () => {
    if (!viewer?.token || viewerRole !== "entrepreneur") return;
    try {
      const res = await fetch(`${API_BASE}/api/invites/mine`, {
        headers: { Authorization: `Bearer ${viewer.token}` },
      });
      if (!res.ok) return; // silent — badge just doesn't show
      const json = await res.json();
      setMyInvites(Array.isArray(json.invites) ? json.invites : []);
    } catch { /* transient network — leave state as-is */ }
  }, [viewer, viewerRole]);

  useEffect(() => { loadMyInvites(); }, [loadMyInvites]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => loadMyInvites();
    socket.on("job_invite", handler);
    return () => socket.off("job_invite", handler);
  }, [socket, loadMyInvites]);

  const pendingInviteCount = myInvites.filter((i) => i.status === "pending").length;

  const openInviteModal = (row) => {
    setInviteTarget({ user_id: row.user_id, display_name: row.display_name });
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ page: String(page), limit: "24", sort });
      if (search.trim()) qs.set("search", search.trim());
      if (trades.size > 0) qs.set("trades", [...trades].join(","));
      if (city && city !== ALL_CITIES) qs.set("city", city);
      const res = await fetch(`${API_BASE}/api/directory/entrepreneurs?${qs.toString()}`);
      if (!res.ok) {
        // Surface the actual reason so 404 (backend not restarted) is
        // distinguishable from 500 (SQL error) at a glance.
        let detail = "";
        try {
          const body = await res.json();
          detail = body.message || body.error || "";
        } catch { /* not JSON — likely a 404 HTML page */ }
        throw new Error(
          detail ||
            `Couldn't load specialists (HTTP ${res.status}). ${
              res.status === 404
                ? "The backend may not be running the latest code — restart the server and try again."
                : ""
            }`
        );
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, trades, city]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 whenever a filter changes so users don't get stuck on
  // a page number that no longer has content.
  useEffect(() => { setPage(1); }, [search, sort, trades, city]);

  const toggleTrade = (name) => {
    setTrades((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setTrades(new Set());
    setCity(ALL_CITIES);
    setSort("photos");
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    trades.size +
    (city !== ALL_CITIES ? 1 : 0);

  // Build the profile object the modal expects. The list payload already
  // has everything we need — no fetch on click.
  const openProfile = (row) => {
    setSelectedProfile({
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      first_name: row.first_name,
      last_name: row.last_name,
      email: null,               // hidden from public view
      phone: null,
      city: row.city,
      province: row.province,
      avatar_url: row.avatar_url,
      specializations: row.specializations,
      years_in_business: row.years_in_business,
      num_employees: row.num_employees,
      rbq_status: row.rbq_status,
      rbq_holder_name: row.rbq_holder_name,
      service_area: row.service_area,
      bio: row.bio,
      website: row.website,
      portfolio: row.portfolio,
      average_rating: row.avg_rating,
      total_reviews: row.review_count,
    });
  };

  const showNav = !!viewerRole; // hide sidebar for logged-out visitors

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {showNav && <Nav />}
      <div className={showNav ? "main-container" : ""} style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>{tf(t, 'specialistDirectory.pageTitle', 'Find a specialist')}</h1>
            <p style={s.subtitle}>
              {tf(t, 'specialistDirectory.pageSubtitle', 'Verified contractors, one portfolio at a time. Browse by trade, city, or rating.')}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/investors")}
              style={s.investorsBtn}
              title={tf(t, 'specialistDirectory.ourInvestorsTooltip', 'Meet the backers behind INTERVOS')}
            >
              <Heart size={13} fill="#dc2626" color="#dc2626" />
              {tf(t, 'specialistDirectory.ourInvestors', 'Our investors')}
            </button>

            {viewerRole === "entrepreneur" && (
              <button
                onClick={() => setShowMyInvitesModal(true)}
                style={s.inboxBtn}
                title={tf(t, 'specialistDirectory.myInvitesTooltip', 'Jobs you were personally invited to')}
              >
                <Inbox size={15} />
                {tf(t, 'specialistDirectory.myInvites', 'My invites')}
                <span style={{
                  ...s.inboxCountPill,
                  ...(pendingInviteCount > 0 ? s.inboxCountPillActive : {}),
                }}>
                  {myInvites.length}
                </span>
              </button>
            )}
            {!showNav && (
              <>
                <button style={s.linkBtn} onClick={() => navigate("/")}>{tf(t, 'specialistDirectory.home', 'Home')}</button>
                <button style={s.linkBtn} onClick={() => navigate("/")}>{tf(t, 'specialistDirectory.signIn', 'Sign in')}</button>
              </>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={tf(t, 'specialistDirectory.searchPlaceholder', 'Search by name, company, or keyword…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch("")} style={s.searchClear}><X size={14} /></button>
            )}
          </div>
          <CustomSelect
            size="compact"
            value={city}
            onChange={setCity}
            icon={<MapPin size={13} />}
            options={[
              { value: ALL_CITIES, label: tf(t, 'specialistDirectory.allCities', 'All cities') },
              ...CITY_OPTIONS.map((c) => ({ value: c, label: c })),
            ]}
          />
          <CustomSelect
            size="compact"
            value={sort}
            onChange={setSort}
            icon={<ArrowUpDown size={13} />}
            options={SORT_OPTIONS.map((o) => ({
              value: o.value,
              label: tf(t, o.key, o.fb),
            }))}
          />
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={s.clearAll}>
              {tf(t,
                activeFilterCount === 1 ? 'specialistDirectory.clearFiltersOne' : 'specialistDirectory.clearFiltersMany',
                activeFilterCount === 1 ? 'Clear {{count}} filter' : 'Clear {{count}} filters'
              ).replace('{{count}}', activeFilterCount)}
            </button>
          )}
        </div>

        {/* Trade chips from the facet */}
        {data.trades?.length > 0 && (
          <div style={s.chipRow}>
            {data.trades.map((t) => {
              const active = trades.has(t.name);
              return (
                <button
                  key={t.name}
                  onClick={() => toggleTrade(t.name)}
                  style={{ ...s.chip, ...(active ? s.chipActive : {}) }}
                >
                  {capitalize(t.name)}
                  <span style={{ ...s.chipCount, ...(active ? { color: "#fff", opacity: 0.85 } : {}) }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results header — only when there's actual data to describe. */}
        {!error && (
          <div style={s.resultsHeader}>
            {loading
              ? tf(t, 'specialistDirectory.loading', 'Loading…')
              : tf(t,
                  data.total === 1 ? 'specialistDirectory.resultsOne' : 'specialistDirectory.resultsMany',
                  data.total === 1 ? '{{count}} specialist in your directory' : '{{count}} specialists in your directory'
                ).replace('{{count}}', data.total)}
          </div>
        )}

        {error && (
          <div style={s.errorBox}>{error}</div>
        )}

        {/* Grid */}
        {!error && (
          <div style={s.grid}>
            {loading && data.entrepreneurs.length === 0 && (
              [...Array(6)].map((_, i) => <div key={i} style={s.cardSkeleton} />)
            )}
            {!loading && data.entrepreneurs.length === 0 && (
              <div style={s.empty}>
                <p style={{ fontSize: 15, color: "#0F223D", fontWeight: 600, margin: 0 }}>
                  {tf(t, 'specialistDirectory.emptyTitle', 'No specialists match those filters yet.')}
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "6px 0 0" }}>
                  {tf(t, 'specialistDirectory.emptyBody', 'Try a broader search — or invite one to join.')}
                </p>
              </div>
            )}
            {data.entrepreneurs.map((row) => (
              <div
                key={row.id}
                style={s.card}
                onClick={() => openProfile(row)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProfile(row);
                  }
                }}
              >
                {/* Portfolio preview strip — layout adapts to photo count
                    so a card with 1 or 2 photos doesn't have dark empty
                    slots. 4+ photos use the classic collage. */}
                <div style={{ ...s.previewStrip, ...previewGridForCount(row.portfolio_preview.length) }}>
                  {row.portfolio_preview.length === 0 && (
                    <div style={s.previewEmpty}>{tf(t, 'specialistDirectory.noPhotosYet', 'No photos yet')}</div>
                  )}
                  {row.portfolio_preview.slice(0, 4).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        ...s.previewCell,
                        backgroundImage: `url(${p.url})`,
                        ...previewCellSpanForIndex(row.portfolio_preview.length, i),
                      }}
                      title={p.caption || ""}
                    />
                  ))}
                </div>

                {/* Body */}
                <div style={s.cardBody}>
                  <div style={s.cardHeader}>
                    <div style={s.avatar}>
                      {row.avatar_url
                        ? <img src={row.avatar_url} alt="" style={s.avatarImg} />
                        : <span>{(row.display_name || "?")[0]?.toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={s.cardTitle}>{row.display_name}</div>
                      {row.city && (
                        <div style={s.cardMeta}>
                          <MapPin size={12} /> {[row.city, row.province].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                    {row.rbq_status === "valid" && (
                      <div style={s.rbqBadge} title={tf(t, 'specialistDirectory.rbqVerified', 'RBQ verified')}>
                        <ShieldCheck size={12} /> RBQ
                      </div>
                    )}
                  </div>

                  {/* Rating + years */}
                  <div style={s.statRow}>
                    {row.avg_rating != null ? (
                      <div style={s.statPill}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <b>{row.avg_rating.toFixed(1)}</b>
                        <span style={{ color: "#6b7280" }}>({row.review_count})</span>
                      </div>
                    ) : (
                      <div style={{ ...s.statPill, color: "#94a3b8" }}>{tf(t, 'specialistDirectory.newBadge', 'New')}</div>
                    )}
                    {row.years_in_business != null && (
                      <div style={s.statPill}>
                        <Briefcase size={12} /> {row.years_in_business}y
                      </div>
                    )}
                    <div style={{ ...s.statPill, marginLeft: "auto", background: "#eef4ff", color: "#1e40af" }}>
                      {row.portfolio_size} {tf(t,
                        row.portfolio_size === 1 ? 'specialistDirectory.photoOne' : 'specialistDirectory.photoMany',
                        row.portfolio_size === 1 ? 'photo' : 'photos')}
                    </div>
                  </div>

                  {/* Specialization tags (max 3) */}
                  {row.specializations?.length > 0 && (
                    <div style={s.tagRow}>
                      {row.specializations.slice(0, 3).map((s2, i) => (
                        <span key={i} style={s.tag}>{s2}</span>
                      ))}
                      {row.specializations.length > 3 && (
                        <span style={{ ...s.tag, background: "#f1f5f9", color: "#64748b" }}>
                          +{row.specializations.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Invite CTA — PMs only. Stops propagation so clicking it
                      doesn't also open the profile modal underneath. Stays
                      clickable even after an invite so PMs can invite the
                      same contractor to more jobs. */}
                  {viewerRole === "property_manager" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInviteModal(row);
                      }}
                      style={s.inviteBtn}
                    >
                      {invitedIds.has(row.user_id) ? (
                        <>
                          <Check size={14} /> {tf(t, 'specialistDirectory.invited', 'Invited · Invite to another job')}
                        </>
                      ) : (
                        <>
                          <Send size={13} /> {tf(t, 'specialistDirectory.inviteToBid', 'Invite to Bid')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div style={s.pagination}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={s.pagerBtn}
            >
              <ChevronLeft size={14} /> {tf(t, 'specialistDirectory.previous', 'Previous')}
            </button>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {tf(t, 'specialistDirectory.pagePosition', 'Page {{page}} of {{total}}')
                .replace('{{page}}', page).replace('{{total}}', data.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={s.pagerBtn}
            >
              {tf(t, 'specialistDirectory.next', 'Next')} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {selectedProfile && (
        <EntrepreneurProfileModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
        />
      )}

      {/* Contractor's invite inbox — full list of invites addressed to them.
          Clicking a row navigates to the bid submission page for that job. */}
      {showMyInvitesModal && (
        <div style={s.modalBackdrop} onClick={() => setShowMyInvitesModal(false)}>
          <div style={{ ...s.modalPanel, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {tf(t, 'specialistDirectory.invitationsEyebrow', 'Invitations')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0F223D", marginTop: 4 }}>
                  {tf(t, 'specialistDirectory.invitationsTitle', 'Jobs you were invited to bid on')}
                </div>
              </div>
              <button onClick={() => setShowMyInvitesModal(false)} style={s.modalClose}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
              {myInvites.length === 0 ? (
                <div style={s.emptyJobs}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#0F223D" }}>
                    {tf(t, 'specialistDirectory.noInvitationsTitle', 'No invitations yet.')}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                    {tf(t, 'specialistDirectory.noInvitationsBody', "When a property manager invites you to bid on a job, it'll show up here.")}
                  </p>
                </div>
              ) : (
                <div style={s.inviteList}>
                  {myInvites.map((inv) => {
                    const pmName = [inv.pm_first_name, inv.pm_last_name]
                      .filter(Boolean).join(" ") || "Property Manager";
                    const budgetLabel =
                      inv.is_budget_hidden ? tf(t, 'specialistDirectory.budgetHidden', 'Budget hidden')
                      : (inv.budget_min != null && inv.budget_max != null)
                        ? `$${Number(inv.budget_min).toLocaleString()} – $${Number(inv.budget_max).toLocaleString()}`
                        : null;
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => {
                          setShowMyInvitesModal(false);
                          navigate(`/bid-submit/${inv.job_id}`);
                        }}
                        style={s.inviteRow}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: "#0F223D", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {inv.job_title}
                            </span>
                            {inv.status === "pending" && (
                              <span style={s.pendingPill}>{tf(t, 'specialistDirectory.newPill', 'New')}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {tf(t, 'specialistDirectory.invitedBy', 'Invited by {{name}}').replace('{{name}}', '')}<b>{pmName}</b>
                            {inv.property_name ? ` · ${inv.property_name}` : ""}
                            {inv.property_city ? ` · ${inv.property_city}` : ""}
                          </div>
                          {(inv.job_category || budgetLabel) && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                              {inv.job_category && (
                                <span style={s.tag}>{inv.job_category}</span>
                              )}
                              {budgetLabel && (
                                <span style={{ ...s.tag, background: "#f0fdf4", color: "#166534" }}>
                                  {budgetLabel}
                                </span>
                              )}
                              {inv.job_urgency && (
                                <span style={{ ...s.tag, background: "#fef3c7", color: "#92400e" }}>
                                  {inv.job_urgency}
                                </span>
                              )}
                            </div>
                          )}
                          {inv.message && (
                            <div style={{ marginTop: 8, fontSize: 12, color: "#334155", fontStyle: "italic", opacity: 0.85 }}>
                              "{inv.message}"
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 12 }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <InviteToBidModal
        contractor={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onInvited={(userId) => setInvitedIds((prev) => new Set(prev).add(userId))}
      />
    </div>
  );
}

// ============================ styles ============================
const s = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  title: { margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0F223D", letterSpacing: "-0.5px" },
  subtitle: { margin: "4px 0 0", color: "#6b7280", fontSize: 14, maxWidth: 640 },
  linkBtn: {
    background: "transparent", border: "1px solid #e5e7eb", padding: "8px 14px",
    borderRadius: 8, color: "#0F223D", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },

  filterBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    background: "#fff",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    marginBottom: 12,
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    flex: "1 1 260px",
    background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "8px 12px",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none", background: "transparent",
    fontSize: 14, color: "#0F223D", fontFamily: "inherit",
  },
  searchClear: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8" },
  select: {
    padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8,
    background: "#fff", fontSize: 13, color: "#0F223D", cursor: "pointer",
  },
  clearAll: {
    padding: "8px 12px", border: "1px solid #fecaca", borderRadius: 8,
    background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },

  chipRow: {
    display: "flex", gap: 8, flexWrap: "wrap",
    padding: "4px 0 14px",
  },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 999,
    background: "#fff", border: "1px solid #e5e7eb",
    fontSize: 12, fontWeight: 600, color: "#0F223D",
    textTransform: "capitalize", cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  chipActive: { background: "#14919B", color: "#fff", border: "1px solid #14919B" },
  chipCount: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },

  resultsHeader: { fontSize: 12, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 },
  errorBox: { padding: 12, background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, marginBottom: 16 },
  empty: { padding: 40, textAlign: "center", background: "#fff", border: "1px dashed #d1d5db", borderRadius: 12, gridColumn: "1 / -1" },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  card: {
    display: "block",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 0,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cursor: "pointer",
    overflow: "hidden",
    transition: "transform 0.15s, box-shadow 0.15s",
    textAlign: "left",
    fontFamily: "inherit",
  },
  cardSkeleton: {
    height: 280, borderRadius: 14, background: "#e5e7eb",
    animation: "sk-pulse 1.4s ease-in-out infinite",
  },
  previewStrip: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: 2,
    height: 160,
    background: "#0F223D",
  },
  previewCell: {
    backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#e5e7eb",
  },
  previewEmpty: {
    gridColumn: "1 / -1", gridRow: "1 / -1",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#94a3b8", fontSize: 13, background: "#f8fafc",
  },
  cardBody: { padding: 14 },
  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "linear-gradient(135deg, #14919B, #0F223D)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 15, flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#0F223D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardMeta: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280", marginTop: 2 },
  rbqBadge: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 999,
    background: "#dcfce7", color: "#166534",
    fontSize: 10, fontWeight: 700, flexShrink: 0,
  },
  statRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  statPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, color: "#0F223D", fontWeight: 500,
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 5 },
  tag: {
    fontSize: 11, padding: "3px 8px",
    background: "#eef4ff", color: "#1e40af",
    borderRadius: 999, fontWeight: 500,
  },

  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
    marginTop: 24, paddingTop: 20, borderTop: "1px solid #e5e7eb",
  },
  pagerBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 8,
    background: "#fff", fontSize: 13, fontWeight: 600, color: "#0F223D",
    cursor: "pointer",
  },

  // Invite CTA on each card (PM-only)
  inviteBtn: {
    marginTop: 12, width: "100%",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "9px 14px", border: "none", borderRadius: 8,
    background: "#14919B", color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
  inviteBtnDone: {
    background: "#dcfce7", color: "#166534", cursor: "default",
  },

  // Modal — invite job picker
  modalBackdrop: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,34,61,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  modalPanel: {
    background: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 520, maxHeight: "85vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  modalClose: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#0F223D",
  },
  emptyJobs: {
    padding: 20, textAlign: "center",
    background: "#f8fafc", border: "1px dashed #d1d5db", borderRadius: 10,
  },

  // "Our investors" pill in the header — matches inboxBtn styling but neutral
  investorsBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 8,
    background: "#fff", color: "#0F223D",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  },

  // Contractor inbox button in the header
  inboxBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", border: "1px solid #14919B", borderRadius: 8,
    background: "#fff", color: "#0F223D",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  },
  inboxCountPill: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 20, height: 20, padding: "0 6px",
    borderRadius: 999, background: "#e2e8f0", color: "#475569",
    fontSize: 11, fontWeight: 700, marginLeft: 4,
  },
  inboxCountPillActive: { background: "#14919B", color: "#fff" },

  // Rows in the "My invites" modal
  inviteList: {
    display: "flex", flexDirection: "column", gap: 8,
  },
  inviteRow: {
    display: "flex", alignItems: "center",
    padding: "12px 14px",
    border: "1px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    textAlign: "left", fontFamily: "inherit", width: "100%",
  },
  pendingPill: {
    padding: "2px 8px", borderRadius: 999,
    background: "#14919B", color: "#fff",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
    flexShrink: 0,
  },
};
