import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UnlockBudgetForm from "../../components/UnlockBudgetForm";
import PropertyManagerProfileModal from "../../components/modal/PropertyManagerProfileModal";
import BidAddendaSection from "../../components/BidAddendaSection";
import {
  ArrowLeft,
  DollarSign,
  Send,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Star,
  Tag,
  AlertCircle,
  Briefcase,
  User,
  Lock,
  Loader2,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import Nav from "../../components/Nav";
import { useLanguage } from "../../contexts/LanguageContext";
import { translateCategory } from "../../utils/translateEnums";
import DeadlineIndicator, { OverdueBanner } from "../../components/DeadlineIndicator";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("userProfile"))?.token;
  } catch {
    return null;
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const tx = (t, key, fb) => {
  const v = t(key);
  return v === key ? fb : v;
};

const createPropertyIcon = () =>
  L.divIcon({
    className: "bid-map-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#0F223D"/><circle cx="12" cy="12" r="5" fill="white"/></svg>
    </div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });

/* ─── Skeleton block ─── */
const Skeleton = ({ w, h, r, mb }) => (
  <div
    style={{
      width: w || "100%",
      height: h || 18,
      borderRadius: r || 6,
      marginBottom: mb || 10,
      background: "linear-gradient(90deg,#e9ecef 25%,#f1f3f5 50%,#e9ecef 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

/* ─── Badge helper ─── */
const Badge = ({ label, color, bg }) => (
  <span style={{ ...s.badge, color, background: bg }}>{label}</span>
);

const urgencyColors = {
  low: { color: "#2d6a4f", bg: "#d8f3dc" },
  medium: { color: "#e67700", bg: "#fff3bf" },
  high: { color: "#c92a2a", bg: "#ffe3e3" },
  urgent: { color: "#fff", bg: "#c92a2a" },
};

const statusColors = {
  open: { color: "#087f5b", bg: "#d3f9d8" },
  in_progress: { color: "#1864ab", bg: "#d0ebff" },
  completed: { color: "#5c5f66", bg: "#e9ecef" },
  cancelled: { color: "#c92a2a", bg: "#ffe3e3" },
};

/* ═══════════════════════════════════ COMPONENT ═══════════════════════════════════ */

export default function BidSubmissionPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  /* ─── state ─── */
  const [job, setJob] = useState(null);
  const [property, setProperty] = useState(null);
  const [manager, setManager] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [timelineDays, setTimelineDays] = useState("");

  // Personal-invite context — if this job is one the contractor was invited to
  // (via /find-contractors → Invite to Bid), we render a banner above the
  // header explaining WHY they're here and who invited them.
  const [inviteContext, setInviteContext] = useState(null);

  // Existing bid (when the contractor has already submitted for this job).
  // Presence flips the right column into a "Your Submitted Bid" view instead
  // of the empty submit form. Edit mode reuses the same form.
  const [existingBid, setExistingBid] = useState(null);
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [deletingBid, setDeletingBid] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [budgetUnlocked, setBudgetUnlocked] = useState(false);
  const [budgetUnlockLoading, setBudgetUnlockLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(null);

  // Property manager profile modal — same component the entrepreneur homepage uses.
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerProfile, setManagerProfile] = useState(null);
  const [managerProfileLoading, setManagerProfileLoading] = useState(false);

  // Fetch full PM profile and pop the modal. `managerProfileId` is
  // manager_profiles.id (not user_id) — that's what the endpoint expects.
  const handleViewManagerProfile = async () => {
    const managerProfileId = job?.manager_id;
    if (!managerProfileId || managerProfileLoading) return;
    setManagerProfileLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/users/manager/profile/id/${managerProfileId}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load manager profile");
      const data = await res.json();
      setManagerProfile(data.profile);
      setShowManagerModal(true);
    } catch (err) {
      toast.error(err.message || tx(t, "bid.managerProfileFailed", "Couldn't load manager profile."));
    } finally {
      setManagerProfileLoading(false);
    }
  };

  /* ─── fetch job + property + budget check ─── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const jobRes = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
          headers: authHeaders(),
        });
        if (!jobRes.ok) throw new Error("Failed to load job details");
        const jobData = await jobRes.json();
        const jobObj = jobData.job || jobData;
        setJob(jobObj);

        // Fetch property
        const propId = jobObj.property_id || jobObj.property?.id;
        if (propId) {
          try {
            const propRes = await fetch(`${API_BASE}/api/properties/${propId}`, {
              headers: authHeaders(),
            });
            if (propRes.ok) {
              const propData = await propRes.json();
              setProperty(propData.property || propData);
            }
          } catch {
            /* property fetch is non-critical */
          }
        }

        // Fetch manager profile
        if (jobObj.manager_id) {
          try {
            const mgrRes = await fetch(`${API_BASE}/api/users/manager/${jobObj.manager_id}`, { headers: authHeaders() });
            if (mgrRes.ok) {
              const mgrData = await mgrRes.json();
              setManager(mgrData.profile || mgrData);
            }
          } catch {}
        }

        // Fetch job images
        try {
          const imgRes = await fetch(`${API_BASE}/api/jobs/${jobId}/images`, { headers: authHeaders() });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            setJobImages(imgData.images || imgData || []);
          }
        } catch {}

        // Check if this contractor was personally invited to bid on THIS job.
        // Silent on error — no invite context is better than a broken page.
        try {
          const inviteRes = await fetch(`${API_BASE}/api/invites/mine`, { headers: authHeaders() });
          if (inviteRes.ok) {
            const inviteJson = await inviteRes.json();
            const match = (inviteJson.invites || []).find((i) => i.job_id === jobId);
            if (match) setInviteContext(match);
          }
        } catch {}

        // Look for an existing bid by the current user on this job. If found
        // we pre-fill the form fields (so edit mode is instant) and flip the
        // right column into the "Your Submitted Bid" view instead of the
        // empty submit form.
        try {
          const myBidsRes = await fetch(`${API_BASE}/api/bids/mine`, { headers: authHeaders() });
          if (myBidsRes.ok) {
            const myBidsData = await myBidsRes.json();
            // /api/bids/mine returns `{ bids: { all, pending, approved, declined }, ... }`
            const allMine = myBidsData?.bids?.all
              || myBidsData?.bids
              || myBidsData?.all
              || [];
            const mine = Array.isArray(allMine)
              ? allMine.find((b) => String(b.job_id) === String(jobId))
              : null;
            if (mine) {
              setExistingBid(mine);
              setBidAmount(mine.amount != null ? String(mine.amount) : "");
              setBidMessage(mine.message || "");
              setTimelineDays(mine.timeline_days != null ? String(mine.timeline_days) : "");
            }
          }
        } catch (bidLookupErr) {
          console.warn("Existing bid lookup skipped:", bidLookupErr.message);
        }

        // Budget unlock check
        try {
          const budgetRes = await fetch(`${API_BASE}/api/payments/budget-status/${jobId}`, {
            headers: authHeaders(),
          });
          if (budgetRes.ok) {
            const budgetData = await budgetRes.json();
            setBudgetUnlocked(!!budgetData.unlocked);
            setUnlockPrice(budgetData.amount_paid ? parseFloat(budgetData.amount_paid.replace('$','')) : 19.99);
          }
        } catch {
          /* non-critical */
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  /* ─── budget unlock handler ─── */
  const handleUnlockBudget = () => {
    setShowUnlockModal(true);
  };

  const handleBudgetUnlockComplete = async (success) => {
    setShowUnlockModal(false);
    if (success) {
      setBudgetUnlocked(true);
      toast.success(tx(t, "bid.budgetUnlocked", "Budget unlocked!"));
      // Refetch job to get budget values
      try {
        const jobRes = await fetch(`${API_BASE}/api/jobs/${jobId}`, { headers: authHeaders() });
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          setJob(jobData.job || jobData);
        }
      } catch {}
    }
  };

  /* ─── submit bid — new OR edit (branches on existingBid + isEditingBid) ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount) {
      toast.error(tx(t, "bid.amountRequired", "Please enter a bid amount."));
      return;
    }
    if (!bidMessage || bidMessage.trim().length < 10) {
      toast.error(tx(t, "bid.messageMin", "Proposal must be at least 10 characters."));
      return;
    }

    const isEditingExisting = !!existingBid && isEditingBid;
    setSubmitting(true);
    try {
      const body = {
        amount: parseFloat(bidAmount),
        message: bidMessage.trim(),
      };
      if (timelineDays) body.timeline_days = parseInt(timelineDays, 10);
      if (!isEditingExisting) body.job_id = jobId;

      const url = isEditingExisting
        ? `${API_BASE}/api/bids/${existingBid.id}`
        : `${API_BASE}/api/bids`;
      const method = isEditingExisting ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isEditingExisting ? "Failed to update bid" : "Failed to submit bid"));
      }

      const data = await res.json().catch(() => ({}));
      toast.success(
        isEditingExisting
          ? tx(t, "bid.updateSuccess", "Bid updated.")
          : tx(t, "bid.submitSuccess", "Bid submitted successfully!")
      );

      if (isEditingExisting) {
        // Stay on page, refresh the local existing-bid snapshot with what the
        // server returned (falls back to local values if the endpoint doesn't
        // echo the row).
        const updated = data.bid || data;
        setExistingBid((prev) => ({
          ...(prev || {}),
          ...updated,
          amount: Number(body.amount),
          message: body.message,
          timeline_days: body.timeline_days ?? prev?.timeline_days ?? null,
        }));
        setIsEditingBid(false);
      } else {
        navigate(-1);
      }
    } catch (err) {
      toast.error(err.message || tx(t, "bid.submitFailed", "Failed to submit bid."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── delete existing bid ─── */
  const handleDeleteBid = async () => {
    if (!existingBid) return;
    setDeletingBid(true);
    try {
      const res = await fetch(`${API_BASE}/api/bids/${existingBid.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete bid");
      }
      toast.success(tx(t, "bid.deleteSuccess", "Bid withdrawn."));
      // Navigate back so the contractor lands on their previous view.
      navigate(-1);
    } catch (err) {
      toast.error(err.message || tx(t, "bid.deleteFailed", "Failed to withdraw bid."));
    } finally {
      setDeletingBid(false);
      setShowDeleteConfirm(false);
    }
  };

  /* ─── helpers ─── */
  // Budget is ALWAYS hidden from entrepreneurs until they pay to unlock
  const budgetHidden = true;
  const budgetMin = job?.budget_min ?? job?.min_budget;
  const budgetMax = job?.budget_max ?? job?.max_budget ?? job?.budget;
  const lat = job?.property_lat || property?.latitude || property?.lat;
  const lng = job?.property_lng || property?.longitude || property?.lng;
  const hasCoords = lat && lng;

  const urgency = (job?.urgency || "medium").toLowerCase();
  const uc = urgencyColors[urgency] || urgencyColors.medium;
  const status = (job?.status || "open").toLowerCase().replace(/ /g, "_");
  const sc = statusColors[status] || statusColors.open;

  /* ═══════════════════════════ RENDER ═══════════════════════════ */

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <Nav />
      <div className="main-container" style={s.page}>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onBack={() => navigate(-1)} />
        ) : (
          <>
            {/* Personal-invite banner — only renders if THIS contractor was
                explicitly invited to bid on THIS job. Explains why they're
                here and names the PM. */}
            {inviteContext && (
              <div style={s.inviteBanner}>
                <div style={s.inviteBannerIcon}>
                  <Send size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.inviteBannerTitle}>
                    You were personally invited to bid
                  </div>
                  <div style={s.inviteBannerBody}>
                    <b>
                      {[inviteContext.pm_first_name, inviteContext.pm_last_name]
                        .filter(Boolean).join(" ") || "The property manager"}
                    </b>
                    {" invited you to bid on this job"}
                    {inviteContext.property_name ? ` at ${inviteContext.property_name}` : ""}.
                  </div>
                  {inviteContext.message && (
                    <div style={s.inviteBannerNote}>
                      <span style={{ opacity: 0.75, fontStyle: "italic" }}>
                        "{inviteContext.message}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overdue banner — sits above the header when the job has passed
                its due_date. Visual only (bidding stays allowed backend-side). */}
            <OverdueBanner dueDate={job.due_date} />

            {/* ═══ TOP HEADER PILL — back + title + status on the left,
                Unlock/Budget action on the right. ═══ */}
            <div style={s.headerPill}>
              <div style={s.headerLeft}>
                <button style={s.backBtn} onClick={() => navigate(-1)} aria-label="Back">
                  <ArrowLeft size={18} />
                </button>
                <div style={{ minWidth: 0 }}>
                  <h1 style={s.jobTitle} className="bsp-job-title" title={job.title || "Untitled Job"}>
                    {job.title || "Untitled Job"}
                  </h1>
                  <Badge label={status.replace(/_/g, " ")} color={sc.color} bg={sc.bg} />
                </div>
              </div>
              <div style={s.headerRight}>
                {budgetHidden && !budgetUnlocked ? (
                  <button
                    style={s.headerUnlockBtn}
                    onClick={handleUnlockBudget}
                    disabled={budgetUnlockLoading}
                  >
                    {budgetUnlockLoading ? (
                      <Loader2 size={14} style={s.spinner} />
                    ) : (
                      <Lock size={14} />
                    )}
                    {budgetUnlockLoading
                      ? tx(t, "bid.unlocking", "Unlocking...")
                      : tx(t, "bid.unlockBudget", "Unlock Budget")}
                    {unlockPrice != null && !budgetUnlockLoading && ` — $${unlockPrice}`}
                  </button>
                ) : (budgetMin != null || budgetMax != null) ? (
                  <div style={s.headerBudgetPill}>
                    {tx(t, "bid.budget", "Budget")}
                    {": $"}
                    {budgetMin != null ? Number(budgetMin).toLocaleString() : "0"}
                    {"-"}
                    {budgetMax != null ? Number(budgetMax).toLocaleString() : "?"}
                  </div>
                ) : null}
              </div>
            </div>

          <div style={s.grid} className="bsp-grid">
            {/* ═══ LEFT COLUMN ═══ */}
            <div style={s.left}>
              {/* Photos — hero-style gallery when present. */}
              {jobImages.length > 0 && (
                <div style={s.imagesBlock}>
                  <div style={{ display: 'grid', gridTemplateColumns: jobImages.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {jobImages.map((img, i) => (
                      <img
                        key={i}
                        src={img.image_url || img.url || img}
                        alt=""
                        onClick={() => setViewingImage(img.image_url || img.url || img)}
                        style={{
                          width: '100%',
                          height: jobImages.length === 1 ? 260 : 160,
                          objectFit: 'cover',
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'transform 0.15s'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Job Information — title + Urgent chip inline (top-right of card),
                  then category + due date, then description block. */}
              <div style={s.card}>
                <div style={s.cardHeadRow}>
                  <h3 style={s.cardTitle}>{tx(t, "bid.jobInfo", "Job Information")}</h3>
                  {job.urgency && (
                    <span style={s.urgencyChip}>{String(job.urgency).toLowerCase() === "medium" ? "MED" : String(job.urgency).toUpperCase()}</span>
                  )}
                </div>
                <div style={s.infoGrid}>
                  {job.category && (
                    <InfoRow icon={<Tag size={14} />} label={tx(t, "bid.category", "Category")} value={
                      <span style={s.categoryChip}>
                        <Tag size={12} />{translateCategory(t, job.category)}
                      </span>
                    } />
                  )}
                  {job.due_date && (
                    <InfoRow
                      icon={<Calendar size={14} />}
                      label={tx(t, "bid.dueDate", "Due Date")}
                      value={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          {new Date(job.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          <DeadlineIndicator dueDate={job.due_date} />
                        </span>
                      }
                    />
                  )}
                </div>
                {job.description && (
                  <div style={s.descBox}>
                    <p style={s.descText}>{job.description}</p>
                  </div>
                )}
              </div>

              {/* Property Information — details on the left, embedded
                  "Managed By" card on the right (clickable → PM profile). */}
              {(job.property_name || job.property_address || job.location || property) && (
                <div style={s.card}>
                  <h3 style={s.cardTitleTeal}>
                    <Building2 size={16} style={s.cardIconTeal} />
                    {tx(t, "bid.propertyInfo", "Property Information")}
                  </h3>
                  <div style={s.propertyLayout}>
                    <div style={s.infoGrid}>
                      {(job.property_name || property?.building_name) && (
                        <InfoRow icon={<Building2 size={14} />} label={tx(t, "bid.propertyName", "Property")} value={job.property_name || property?.building_name} />
                      )}
                      {(job.property_type || property?.building_type) && (
                        <InfoRow icon={<Tag size={14} />} label={tx(t, "bid.type", "Type")} value={job.property_type || property?.building_type} />
                      )}
                      {(job.property_units || property?.num_units) && (
                        <InfoRow icon={<Building2 size={14} />} label={tx(t, "bid.units", "Units")} value={job.property_units || property?.num_units} />
                      )}
                      {(job.property_address || job.location || property?.address) && (
                        <InfoRow icon={<MapPin size={14} />} label={tx(t, "bid.address", "Address")} value={job.property_address || job.location || property?.address} />
                      )}
                      {(job.property_city || property?.city) && (
                        <InfoRow icon={<MapPin size={14} />} label={tx(t, "bid.city", "City")} value={job.property_city || property?.city} />
                      )}
                    </div>

                    {/* Property manager card — identity of the PM who owns this
                        property. Backend's getJobById JOINs manager_profiles +
                        users, so we prefer the joined fields on `job` and fall
                        back to the separately-fetched `manager` object if the
                        JOIN missed anything. */}
                    {(() => {
                      const managerUserId = job.manager_user_id || manager?.user_id;
                      const companyName = job.manager_company || manager?.company_name;
                      const personName = job.manager_name || [manager?.first_name, manager?.last_name].filter(Boolean).join(" ").trim();
                      const image = job.manager_image || manager?.image;
                      const primary = companyName || personName;
                      if (!primary) return null;
                      return (
                        <button
                          type="button"
                          style={s.managedByCard}
                          onClick={handleViewManagerProfile}
                          disabled={!job.manager_id || managerProfileLoading}
                          title={job.manager_id ? tx(t, "bid.viewManagerProfile", "View property manager profile") : undefined}
                        >
                          <div style={s.managedByAvatar}>
                            {image ? (
                              <img src={image} alt={primary} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (primary[0] || "M").toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                            <div style={s.managedByLabel}>{tx(t, "bid.managedBy", "Managed By")}</div>
                            <div style={s.managedByName}>{primary}</div>
                            {companyName && personName && companyName !== personName && (
                              <div style={s.managedBySub}>{personName}</div>
                            )}
                          </div>
                          {job.manager_id && (
                            managerProfileLoading
                              ? <Loader2 size={16} style={s.spinner} color="#00A5A9" />
                              : <ChevronRight size={16} color="#00A5A9" />
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Location — map only. */}
              {hasCoords && (
                <div style={s.card}>
                  <h3 style={s.cardTitleTeal}>
                    <MapPin size={16} style={s.cardIconTeal} />
                    {tx(t, "bid.location", "Location")}
                  </h3>
                  <div style={s.mapWrap}>
                    <MapContainer
                      center={[lat, lng]}
                      zoom={14}
                      style={{ height: "100%", width: "100%", borderRadius: 10 }}
                      scrollWheelZoom={false}
                      attributionControl={false}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      <Marker position={[lat, lng]} icon={createPropertyIcon()}>
                        <Popup>{property?.name || "Property location"}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ RIGHT COLUMN — sticky. Three renders:
                  1. Existing bid + not editing → "Your Submitted Bid" summary
                  2. Existing bid + editing     → same form, pre-filled
                  3. No existing bid             → submit-new-bid form
                ═══ */}
            <div style={s.right}>
              {existingBid && !isEditingBid ? (
                <div style={s.formCard}>
                  <h3 style={s.formTitle}>
                    <FileText size={16} style={s.cardIcon} />
                    {tx(t, "bid.yourSubmittedBid", "Your Submitted Bid")}
                  </h3>

                  {/* Status pill — colour by status. */}
                  <div style={{
                    display: "inline-flex",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    marginBottom: 16,
                    ...(existingBid.status === "approved" || existingBid.status === "accepted"
                        ? { background: "#dcfce7", color: "#166534" }
                        : existingBid.status === "declined"
                          ? { background: "#fee2e2", color: "#991b1b" }
                          : { background: "#fef3c7", color: "#92400e" }),
                  }}>
                    {tx(t, "bid.status", "Status")}: {existingBid.status || "pending"}
                  </div>

                  <div style={s.existingRow}>
                    <div style={s.existingRowIcon}><DollarSign size={14} /></div>
                    <div>
                      <div style={s.existingRowLabel}>{tx(t, "bid.bidAmount", "Bid Amount")}</div>
                      <div style={s.existingRowValue}>
                        ${Number(existingBid.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div style={s.existingRow}>
                    <div style={s.existingRowIcon}><Calendar size={14} /></div>
                    <div>
                      <div style={s.existingRowLabel}>{tx(t, "bid.submittedOn", "Submitted On")}</div>
                      <div style={s.existingRowValue}>
                        {existingBid.created_at
                          ? new Date(existingBid.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {existingBid.timeline_days != null && (
                    <div style={s.existingRow}>
                      <div style={s.existingRowIcon}><Clock size={14} /></div>
                      <div>
                        <div style={s.existingRowLabel}>{tx(t, "bid.timeline", "Timeline")}</div>
                        <div style={s.existingRowValue}>
                          {existingBid.timeline_days} {tx(t, "bid.days", "days")}
                        </div>
                      </div>
                    </div>
                  )}

                  {existingBid.message && (
                    <div style={{ marginTop: 10, marginBottom: 6 }}>
                      <div style={s.existingRowLabel}>{tx(t, "bid.yourProposal", "Your Proposal")}</div>
                      <p style={{
                        margin: "6px 0 0",
                        padding: "10px 12px",
                        background: "#f8fafc",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#334155",
                        lineHeight: 1.5,
                      }}>
                        {existingBid.message}
                      </p>
                    </div>
                  )}

                  {/* Actions — editable/deletable only while pending. */}
                  {(existingBid.status === "pending" || !existingBid.status) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                      <button
                        type="button"
                        style={{ ...s.submitBtn, marginTop: 0, flex: 1 }}
                        onClick={() => setIsEditingBid(true)}
                      >
                        <Edit3 size={16} />
                        {tx(t, "bid.editBid", "Edit Bid")}
                      </button>
                      <button
                        type="button"
                        style={{
                          marginTop: 0,
                          padding: "12px 16px",
                          background: "#fff",
                          color: "#dc2626",
                          border: "1.5px solid #dc2626",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 size={16} />
                        {tx(t, "bid.deleteBid", "Delete Bid")}
                      </button>
                    </div>
                  )}
                  {(existingBid.status === "approved" || existingBid.status === "accepted") && (
                    <p style={{ marginTop: 14, fontSize: 12, color: "#166534" }}>
                      ✓ {tx(t, "bid.approvedNote", "Your bid was accepted. The manager will contact you to move forward.")}
                    </p>
                  )}
                  {existingBid.status === "declined" && (
                    <p style={{ marginTop: 14, fontSize: 12, color: "#991b1b" }}>
                      {tx(t, "bid.declinedNote", "This bid was declined. You cannot re-submit for this job.")}
                    </p>
                  )}

                  {/* Addenda thread — post-submission Q&A + price adjustments
                      between contractor and PM. Only actionable while the bid
                      is still negotiable; history stays visible after. */}
                  <div style={{ marginTop: 18 }}>
                    <BidAddendaSection
                      bidId={existingBid.id}
                      currentUserId={(() => {
                        try {
                          return JSON.parse(localStorage.getItem("userProfile"))?.id;
                        } catch {
                          return null;
                        }
                      })()}
                      canAct={
                        existingBid.status === "pending" ||
                        existingBid.status === "under_review" ||
                        !existingBid.status
                      }
                    />
                  </div>
                </div>
              ) : (
                <form id="bsp-bid-form" style={s.formCard} onSubmit={handleSubmit}>
                  <h3 style={s.formTitle}>
                    <Send size={16} style={s.cardIcon} />
                    {isEditingBid
                      ? tx(t, "bid.editingBid", "Edit Your Bid")
                      : tx(t, "bid.submitBid", "Submit Your Bid")}
                  </h3>

                  {/* Amount */}
                  <label style={s.label}>{tx(t, "bid.bidAmount", "Bid Amount ($)")} *</label>
                  <div style={s.inputWrap}>
                    <DollarSign size={16} style={s.inputIcon} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>

                  {/* Proposal */}
                  <label style={s.label}>{tx(t, "bid.proposal", "Proposal Message")} *</label>
                  <textarea
                    placeholder={tx(t, "bid.proposalPlaceholder", "Describe your approach, experience, and why you're the best fit...")}
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    style={s.textarea}
                    minLength={10}
                    required
                  />
                  <span style={s.charCount}>{bidMessage.length} / 10 min</span>

                  {/* Timeline */}
                  <label style={s.label}>{tx(t, "bid.timeline", "Timeline (days)")} <span style={{ color: "#adb5bd", fontWeight: 400 }}>— optional</span></label>
                  <div style={s.inputWrap}>
                    <Clock size={16} style={s.inputIcon} />
                    <input
                      type="number"
                      min="1"
                      placeholder={tx(t, "bid.timelinePlaceholder", "Estimated days to complete")}
                      value={timelineDays}
                      onChange={(e) => setTimelineDays(e.target.value)}
                      style={s.input}
                    />
                  </div>

                  {/* Submit + optional Cancel-edit */}
                  <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                    <button type="submit" style={{ ...s.submitBtn, marginTop: 0, flex: 1 }} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 size={16} style={s.spinner} />
                          {isEditingBid
                            ? tx(t, "bid.saving", "Saving...")
                            : tx(t, "bid.submitting", "Submitting...")}
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {isEditingBid
                            ? tx(t, "bid.saveChanges", "Save Changes")
                            : tx(t, "bid.submit", "Submit Bid")}
                        </>
                      )}
                    </button>
                    {isEditingBid && (
                      <button
                        type="button"
                        onClick={() => {
                          // Restore previous values so a cancelled edit doesn't leak into the form.
                          if (existingBid) {
                            setBidAmount(existingBid.amount != null ? String(existingBid.amount) : "");
                            setBidMessage(existingBid.message || "");
                            setTimelineDays(existingBid.timeline_days != null ? String(existingBid.timeline_days) : "");
                          }
                          setIsEditingBid(false);
                        }}
                        style={{
                          marginTop: 0,
                          padding: "12px 16px",
                          background: "#fff",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {tx(t, "common.cancel", "Cancel")}
                      </button>
                    )}
                  </div>

                  {/* Budget hint (only for the new-bid flow — editing means budget was already unlocked) */}
                  {!isEditingBid && budgetHidden && !budgetUnlocked && unlockPrice != null && (
                    <p style={s.budgetHint}>
                      <Lock size={13} style={{ marginRight: 4 }} />
                      {tx(t, "bid.unlockHint", `Budget unlocking costs $${unlockPrice}`)}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Image Viewer */}
      {viewingImage && (
        <div onClick={() => setViewingImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, cursor: 'zoom-out', padding: '2rem' }}>
          <img src={viewingImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setViewingImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Delete Bid confirmation. Lightweight inline modal — no shared confirm
          component in this page's dependencies. */}
      {showDeleteConfirm && existingBid && (
        <div
          onClick={() => !deletingBid && setShowDeleteConfirm(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10002, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#0F223D" }}>
              {tx(t, "bid.deleteConfirmTitle", "Withdraw this bid?")}
            </h3>
            <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              {tx(t, "bid.deleteConfirmBody", "This removes your bid from the job. You can submit a new one later while the job is still open.")}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingBid}
                style={{
                  padding: "10px 18px",
                  background: "#fff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tx(t, "common.cancel", "Cancel")}
              </button>
              <button
                onClick={handleDeleteBid}
                disabled={deletingBid}
                style={{
                  padding: "10px 18px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {deletingBid ? (
                  <>
                    <Loader2 size={14} style={s.spinner} />
                    {tx(t, "bid.deleting", "Withdrawing...")}
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    {tx(t, "bid.deleteConfirmBtn", "Yes, withdraw")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Manager profile — reuses the modal from the entrepreneur homepage. */}
      <PropertyManagerProfileModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        profile={managerProfile}
      />

      {/* Unlock Budget Modal */}
      {showUnlockModal && (
        <UnlockBudgetForm
          jobId={jobId}
          token={JSON.parse(localStorage.getItem('userProfile'))?.token}
          handleBudgetModal={(success) => handleBudgetUnlockComplete(success)}
        />
      )}

      {/* Floating Quick Bid button — mobile only */}
      {job && !error && (
        <button
          type="button"
          className="bsp-fab"
          onClick={() => {
            const el = document.getElementById('bsp-bid-form');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          aria-label={tx(t, "bid.submit", "Submit Bid")}
        >
          <ChevronDown size={22} />
        </button>
      )}
    </div>
  );
}

/* ═══ Sub-components ═══ */

function InfoRow({ icon, label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoIcon}>{icon}</span>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ ...s.grid, opacity: 0.7 }}>
      <div style={s.left}>
        <Skeleton h={32} w="60%" mb={16} />
        <div style={s.card}><Skeleton h={20} w="40%" mb={12} /><Skeleton h={14} /><Skeleton h={14} /><Skeleton h={14} w="80%" /></div>
        <div style={s.card}><Skeleton h={20} w="35%" mb={12} /><Skeleton h={40} /></div>
        <div style={s.card}><Skeleton h={20} w="45%" mb={12} /><Skeleton h={14} /><Skeleton h={14} w="70%" /></div>
      </div>
      <div style={s.right}>
        <div style={s.miniCard}><Skeleton h={20} w="70%" mb={8} /><Skeleton h={14} w="40%" /></div>
        <div style={s.formCard}><Skeleton h={20} w="50%" mb={14} /><Skeleton h={38} mb={14} /><Skeleton h={80} mb={14} /><Skeleton h={38} mb={14} /><Skeleton h={44} r={10} /></div>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div style={s.errorWrap}>
      <AlertCircle size={40} color="#c92a2a" />
      <h2 style={{ margin: "12px 0 4px", color: "#0F223D" }}>Something went wrong</h2>
      <p style={{ color: "#868e96", marginBottom: 16 }}>{message}</p>
      <button style={s.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );
}

/* ═══════════════════════════════════ STYLES ═══════════════════════════════════ */

const s = {
  page: {
    flex: 1,
    padding: "1.5rem 2rem 2rem",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  },

  // Personal-invite banner (top of page when contractor arrived via invite)
  inviteBanner: {
    display: "flex", alignItems: "flex-start", gap: 14,
    padding: "14px 18px",
    background: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
    border: "1px solid #67e8f9",
    borderRadius: 12,
    marginBottom: 16,
  },
  inviteBannerIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "#14919B", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  inviteBannerTitle: {
    fontSize: 14, fontWeight: 700, color: "#0F223D", letterSpacing: "-0.01em",
  },
  inviteBannerBody: {
    fontSize: 13, color: "#0F223D", opacity: 0.85, marginTop: 4, lineHeight: 1.5,
  },
  inviteBannerNote: {
    marginTop: 8, padding: "8px 12px",
    background: "rgba(255,255,255,0.6)", borderRadius: 8,
    fontSize: 12, color: "#334155",
  },

  /* Grid */
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 440px",
    gap: 28,
    alignItems: "start",
  },
  left: { display: "flex", flexDirection: "column", gap: 18 },
  right: {
    position: "sticky",
    top: "6rem",
    alignSelf: "start",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  /* Top header pill — full-width bar with back+title on the left and the
     Unlock/Budget action on the right. Matches the mockup exactly. */
  headerPill: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 20px",
    background: "#f1f5f9",
    borderRadius: 14,
    marginBottom: 20,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flex: 1,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  headerUnlockBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    background: "#0F223D",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  headerBudgetPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 18px",
    background: "#0F223D",
    color: "#fff",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: "pointer",
    color: "#0F223D",
    flexShrink: 0,
  },
  jobTitle: { fontSize: "clamp(1.0625rem, 4.5vw, 1.375rem)", fontWeight: 700, color: "#0F223D", margin: "0 0 6px", lineHeight: 1.25, wordBreak: "break-word" },

  /* Card head row — used by cards where a chip sits on the right of the title
     (e.g. Job Information's URG chip). */
  cardHeadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },

  /* Small block wrapping the photo gallery (no card chrome — photos are the
     hero of the page and don't need a card frame). */
  imagesBlock: {},

  /* Urgency chip inline with the card title (top-right). Solid red pill. */
  urgencyChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    background: "#b91c1c",
    color: "#fff",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    flexShrink: 0,
  },

  /* Category chip inside an InfoRow value (light teal outline). */
  categoryChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: 12,
    color: "#334155",
    fontWeight: 500,
  },

  /* Property Information layout — details on the left, embedded "Managed By"
     card on the right. Grid drops to one column below 720px. */
  propertyLayout: {
    display: "grid",
    gridTemplateColumns: "1fr minmax(220px, 300px)",
    gap: 24,
    alignItems: "start",
  },
  managedByCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
    border: "1.5px solid #99f6e4",
    borderRadius: 12,
    cursor: "pointer",
    width: "100%",
    minWidth: 0,
    transition: "border-color .15s, box-shadow .15s",
  },
  managedByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #00A5A9, #008C8F)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
    overflow: "hidden", // so an <img> child gets clipped by the rounded corners
  },
  managedByLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  managedByName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0F223D",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  managedBySub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 1,
  },

  /* Teal-flavoured card title (used by Property Info + Location to match the mockup). */
  cardTitleTeal: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0F223D",
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cardIconTeal: { color: "#00A5A9" },

  /* Card */
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 22px",
    border: "1px solid #e9ecef",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0F223D",
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: { color: "#00A5A9" },

  /* Info rows */
  infoGrid: { display: "flex", flexDirection: "column", gap: 10 },
  infoRow: { display: "flex", alignItems: "center", gap: 8 },
  infoIcon: { color: "#868e96", display: "flex", flexShrink: 0 },
  infoLabel: { fontSize: 13, color: "#868e96", minWidth: 80 },
  infoValue: { fontSize: 14, color: "#212529", fontWeight: 500 },

  /* Description */
  descBox: {
    display: "flex",
    alignItems: "flex-start",
    marginTop: 14,
    padding: "12px 14px",
    background: "#f8f9fa",
    borderRadius: 10,
  },
  descText: { margin: 0, fontSize: 14, lineHeight: 1.6, color: "#495057" },

  /* Badge */
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },

  /* Budget */
  budgetLocked: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "16px 0",
    textAlign: "center",
  },
  budgetLockedText: { fontSize: 13, color: "#868e96" },
  unlockBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 20px",
    background: "#0F223D",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  budgetDisplay: { display: "flex", gap: 24 },
  budgetItem: { display: "flex", flexDirection: "column", gap: 2 },
  budgetLabel: { fontSize: 12, color: "#868e96", textTransform: "uppercase", letterSpacing: 0.5 },
  budgetValue: { fontSize: 20, fontWeight: 700, color: "#00A5A9" },

  /* Map */
  mapWrap: { height: 240, borderRadius: 10, overflow: "hidden" },

  /* Mini card */
  miniCard: {
    background: "#f0fafa",
    borderRadius: 12,
    padding: "14px 18px",
    border: "1px solid #b2f2e6",
  },
  miniTitle: { margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#0F223D" },
  miniRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  miniChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#495057",
    background: "#fff",
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid #dee2e6",
  },

  /* Form */
  formCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "22px 22px 24px",
    border: "1px solid #e9ecef",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0F223D",
    margin: "0 0 18px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#495057",
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#adb5bd",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "1px solid #dee2e6",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .2s",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    padding: "10px 14px",
    border: "1px solid #dee2e6",
    borderRadius: 8,
    fontSize: 14,
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  charCount: { fontSize: 11, color: "#adb5bd", marginTop: 4, display: "block" },

  submitBtn: {
    marginTop: 20,
    width: "100%",
    padding: "12px 0",
    background: "#00A5A9",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity .2s",
  },
  spinner: { animation: "spin .8s linear infinite" },

  /* "Your Submitted Bid" info rows — light background, icon+label+value. */
  existingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
  },
  existingRowIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "rgba(0, 165, 169, 0.1)",
    color: "#00A5A9",
    flexShrink: 0,
  },
  existingRowLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  existingRowValue: { fontSize: 14, fontWeight: 700, color: "#0F223D" },

  budgetHint: {
    marginTop: 12,
    fontSize: 12,
    color: "#868e96",
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
  },

  /* Error */
  errorWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    textAlign: "center",
  },
};

/* ═══ Responsive media query via style tag injected once ═══ */
const responsiveId = "bid-submission-responsive";
if (typeof document !== "undefined" && !document.getElementById(responsiveId)) {
  const style = document.createElement("style");
  style.id = responsiveId;
  style.textContent = `
    @media (max-width: 900px) {
      /* Override only the top-level page grid to single column.
         Inner grids (stats, photos) keep their own column counts. */
      .bsp-grid {
        grid-template-columns: 1fr !important;
      }
      .bsp-grid > div[style*="position: sticky"],
      .bsp-grid > div[style*="position:sticky"] {
        position: static !important;
      }
      /* Property Info layout collapses so the "Managed By" card stacks under
         the details instead of wrapping into a too-narrow column. */
      .bsp-grid [style*="grid-template-columns: 1fr minmax(220px, 300px)"] {
        grid-template-columns: 1fr !important;
      }
    }
    @media (max-width: 480px) {
      /* Tighten the header & job title on small screens */
      .bsp-job-title {
        font-size: 1rem !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    /* Floating Quick Bid button — only on small viewports */
    .bsp-fab {
      display: none;
    }
    @media (max-width: 900px) {
      .bsp-fab {
        position: fixed;
        right: 16px;
        bottom: 80px;
        width: 48px;
        height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        background: linear-gradient(135deg, #00A5A9, #008C8F);
        color: #fff;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0, 165, 169, 0.35), 0 2px 6px rgba(15, 34, 61, 0.15);
        z-index: 1000;
        transition: box-shadow 0.15s ease, filter 0.15s ease;
      }
      .bsp-fab:hover {
        filter: brightness(1.05);
        box-shadow: 0 10px 24px rgba(0, 165, 169, 0.45), 0 2px 6px rgba(15, 34, 61, 0.18);
      }
      .bsp-fab:active {
        filter: brightness(0.95);
      }
    }
  `;
  document.head.appendChild(style);
}

/* Responsive override — inject into style object at render time won't work for media queries,
   so we use a useEffect-based approach. The grid already has the style object applied;
   the CSS above forces single column below 900px. On mobile the right column
   naturally becomes non-sticky via the CSS override. */
