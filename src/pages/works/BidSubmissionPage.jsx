import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UnlockBudgetForm from "../../components/UnlockBudgetForm";
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
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import Nav from "../../components/Nav";
import { useLanguage } from "../../contexts/LanguageContext";
import { translateCategory } from "../../utils/translateEnums";

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

  const [budgetUnlocked, setBudgetUnlocked] = useState(false);
  const [budgetUnlockLoading, setBudgetUnlockLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(null);

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

  /* ─── submit bid ─── */
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

    setSubmitting(true);
    try {
      const body = {
        job_id: jobId,
        amount: parseFloat(bidAmount),
        message: bidMessage.trim(),
      };
      if (timelineDays) body.timeline_days = parseInt(timelineDays, 10);

      const res = await fetch(`${API_BASE}/api/bids`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit bid");
      }

      toast.success(tx(t, "bid.submitSuccess", "Bid submitted successfully!"));
      navigate(-1);
    } catch (err) {
      toast.error(err.message || tx(t, "bid.submitFailed", "Failed to submit bid."));
    } finally {
      setSubmitting(false);
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
          <div style={s.grid} className="bsp-grid">
            {/* ═══ LEFT COLUMN ═══ */}
            <div style={s.left}>
              {/* Header */}
              <div style={s.headerRow}>
                <button style={s.backBtn} onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={s.jobTitle} className="bsp-job-title" title={job.title || "Untitled Job"}>{job.title || "Untitled Job"}</h1>
                  <Badge label={status.replace(/_/g, " ")} color={sc.color} bg={sc.bg} />
                </div>
              </div>

              {/* Job Information */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <Briefcase size={16} style={s.cardIcon} />
                  {tx(t, "bid.jobInfo", "Job Information")}
                </h3>
                <div style={s.infoGrid}>
                  {job.category && (
                    <InfoRow icon={<Tag size={14} />} label={tx(t, "bid.category", "Category")} value={translateCategory(t, job.category)} />
                  )}
                  <InfoRow
                    icon={<AlertCircle size={14} />}
                    label={tx(t, "bid.urgency", "Urgency")}
                    value={<Badge label={urgency} color={uc.color} bg={uc.bg} />}
                  />
                  {job.due_date && (
                    <InfoRow icon={<Calendar size={14} />} label={tx(t, "bid.dueDate", "Due Date")} value={new Date(job.due_date).toLocaleDateString()} />
                  )}
                  {job.duration && (
                    <InfoRow icon={<Clock size={14} />} label={tx(t, "bid.duration", "Duration")} value={job.duration} />
                  )}
                </div>
                {job.description && (
                  <div style={s.descBox}>
                    <FileText size={14} style={{ marginRight: 6, flexShrink: 0, color: "#868e96" }} />
                    <p style={s.descText}>{job.description}</p>
                  </div>
                )}
              </div>

              {/* Budget Range */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <DollarSign size={16} style={s.cardIcon} />
                  {tx(t, "bid.budgetRange", "Budget Range")}
                </h3>
                {budgetHidden && !budgetUnlocked ? (
                  <div style={s.budgetLocked}>
                    <Lock size={18} color="#868e96" />
                    <span style={s.budgetLockedText}>
                      {tx(t, "bid.budgetHidden", "Budget is hidden by the property manager.")}
                    </span>
                    <button
                      style={s.unlockBtn}
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
                  </div>
                ) : (
                  <div style={s.budgetDisplay}>
                    {budgetMin != null && (
                      <div style={s.budgetItem}>
                        <span style={s.budgetLabel}>{tx(t, "bid.min", "Min")}</span>
                        <span style={s.budgetValue}>${Number(budgetMin).toLocaleString()}</span>
                      </div>
                    )}
                    {budgetMax != null && (
                      <div style={s.budgetItem}>
                        <span style={s.budgetLabel}>{tx(t, "bid.max", "Max")}</span>
                        <span style={s.budgetValue}>${Number(budgetMax).toLocaleString()}</span>
                      </div>
                    )}
                    {budgetMin == null && budgetMax == null && (
                      <span style={{ color: "#868e96" }}>{tx(t, "bid.noBudget", "No budget specified")}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Job Images */}
              {jobImages.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <FileText size={16} style={s.cardIcon} />
                    {tx(t, "bid.photos", "Photos")}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {jobImages.map((img, i) => (
                      <img key={i} src={img.image_url || img.url || img} alt="" onClick={() => setViewingImage(img.image_url || img.url || img)} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.03)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    ))}
                  </div>
                </div>
              )}

              {/* Property Information (from job JOIN) */}
              {(job.property_name || job.property_address || job.location) && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <Building2 size={16} style={s.cardIcon} />
                    {tx(t, "bid.propertyInfo", "Property Information")}
                  </h3>
                  <div style={s.infoGrid}>
                    {job.property_name && (
                      <InfoRow icon={<Building2 size={14} />} label={tx(t, "bid.propertyName", "Property")} value={job.property_name} />
                    )}
                    {(job.property_address || job.location) && (
                      <InfoRow icon={<MapPin size={14} />} label={tx(t, "bid.address", "Address")} value={job.property_address || job.location} />
                    )}
                    {job.property_type && (
                      <InfoRow icon={<Tag size={14} />} label={tx(t, "bid.type", "Type")} value={job.property_type} />
                    )}
                    {(job.property_city || job.property_province) && (
                      <InfoRow icon={<MapPin size={14} />} label={tx(t, "bid.cityProvince", "City")} value={[job.property_city, job.property_province].filter(Boolean).join(", ")} />
                    )}
                    {job.property_units > 0 && (
                      <InfoRow icon={<Building2 size={14} />} label={tx(t, "bid.units", "Units")} value={job.property_units} />
                    )}
                  </div>
                </div>
              )}

              {/* Property Manager (from job JOIN data) */}
              {(job.manager_name || job.manager_company) && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <User size={16} style={s.cardIcon} />
                    {tx(t, "bid.propertyManager", "Property Manager")}
                  </h3>
                  {/* Manager header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {(job.manager_company || job.manager_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0F223D', fontSize: 15 }}>{job.manager_company || job.manager_name}</div>
                      {job.manager_company && job.manager_name && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{job.manager_name}</div>
                      )}
                      {/* Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={13} fill={i <= Math.round(Number(job.manager_avg_rating) || 0) ? '#facc15' : 'none'} stroke={i <= Math.round(Number(job.manager_avg_rating) || 0) ? '#facc15' : '#d1d5db'} />
                        ))}
                        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
                          {Number(job.manager_avg_rating || 0).toFixed(1)} ({job.manager_review_count || 0} {tx(t, "bid.reviews", "reviews")})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0F223D' }}>{job.manager_total_jobs || 0}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{tx(t, "bid.totalJobs", "Total Jobs")}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{job.manager_completed_jobs || 0}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{tx(t, "bid.completed", "Completed")}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0F223D' }}>{job.manager_total_properties || 0}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{tx(t, "bid.properties", "Properties")}</div>
                    </div>
                  </div>

                  {/* Detail rows */}
                  <div style={s.infoGrid}>
                    {job.manager_address && (
                      <InfoRow icon={<MapPin size={14} />} label={tx(t, "bid.location", "Location")} value={job.manager_address} />
                    )}
                    {job.manager_experience > 0 && (
                      <InfoRow icon={<Clock size={14} />} label={tx(t, "bid.experience", "Experience")} value={`${job.manager_experience} years`} />
                    )}
                    {job.manager_expertise && (
                      <InfoRow icon={<Tag size={14} />} label={tx(t, "bid.expertise", "Expertise")} value={job.manager_expertise} />
                    )}
                    {job.manager_joined && (
                      <InfoRow icon={<Calendar size={14} />} label={tx(t, "bid.memberSince", "Member Since")} value={new Date(job.manager_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} />
                    )}
                  </div>
                </div>
              )}

              {/* Map */}
              {hasCoords && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <MapPin size={16} style={s.cardIcon} />
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

            {/* ═══ RIGHT COLUMN ═══ */}
            <div style={s.right}>
              {/* Job summary mini card */}
              <div style={s.miniCard}>
                <h4 style={s.miniTitle}>{job.title || "Untitled Job"}</h4>
                <div style={s.miniRow}>
                  {job.category && (
                    <span style={s.miniChip}>
                      <Tag size={12} /> {translateCategory(t, job.category)}
                    </span>
                  )}
                  <Badge label={urgency} color={uc.color} bg={uc.bg} />
                </div>
              </div>

              {/* Bid Form */}
              <form id="bsp-bid-form" style={s.formCard} onSubmit={handleSubmit}>
                <h3 style={s.formTitle}>
                  <Send size={16} style={s.cardIcon} />
                  {tx(t, "bid.submitBid", "Submit Your Bid")}
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

                {/* Submit */}
                <button type="submit" style={s.submitBtn} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={s.spinner} />
                      {tx(t, "bid.submitting", "Submitting...")}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {tx(t, "bid.submit", "Submit Bid")}
                    </>
                  )}
                </button>

                {/* Budget hint */}
                {budgetHidden && !budgetUnlocked && unlockPrice != null && (
                  <p style={s.budgetHint}>
                    <Lock size={13} style={{ marginRight: 4 }} />
                    {tx(t, "bid.unlockHint", `Budget unlocking costs $${unlockPrice}`)}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {viewingImage && (
        <div onClick={() => setViewingImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, cursor: 'zoom-out', padding: '2rem' }}>
          <img src={viewingImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setViewingImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

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

  /* Header */
  headerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#f1f3f5",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 14,
    color: "#0F223D",
    fontWeight: 500,
  },
  jobTitle: { fontSize: "clamp(1.0625rem, 4.5vw, 1.375rem)", fontWeight: 700, color: "#0F223D", margin: "0 0 6px", lineHeight: 1.25, wordBreak: "break-word" },

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
