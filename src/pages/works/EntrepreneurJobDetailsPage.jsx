import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Calendar, DollarSign, Clock, Star, Building2,
  PlayCircle, CheckCircle, MessageSquare, MapPin, User, AlertCircle,
  ChevronRight, ChevronDown, X, Image as ImageIcon, Briefcase, Award, Shield,
  Receipt, Edit3, Zap,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Nav from "../../components/Nav";
import SubmitInvoiceModal from "../../components/modal/SubmitInvoiceModal";
import BidAddendaSection from "../../components/BidAddendaSection";
import PropertyManagerProfileModal from "../../components/modal/PropertyManagerProfileModal";
import DeadlineIndicator, { OverdueBanner } from "../../components/DeadlineIndicator";
import { useLanguage } from "../../contexts/LanguageContext";
import { translateStatus, translateCategory, translateUrgency, translatePropertyType } from "../../utils/translateEnums";
import toast from "react-hot-toast";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const getToken = () => JSON.parse(localStorage.getItem("userProfile"))?.token;
const tx = (t, key, fb) => { const v = t(key); return v === key ? fb : v; };
const stageKeyMap = { not_started: 'notStarted', mobilization: 'mobilization', in_progress: 'inProgress', inspection: 'inspection', completed: 'completed' };
const statusKeyMap = { completed: 'statusCompleted', in_progress: 'statusInProgress', pending: 'statusPending', validated: 'statusValidated' };
const formatStageName = (name, t) => {
  if (!name) return '';
  const key = stageKeyMap[name];
  if (key && t) return tx(t, `progress.${key}`, name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
const formatStageStatus = (status, t) => {
  const key = statusKeyMap[status] || statusKeyMap['pending'];
  return t ? tx(t, `progress.${key}`, status || 'Pending') : (status || 'Pending');
};

const statusColors = { accepted: "#059669", ongoing: "#2563eb", completed: "#7c3aed" };

const fetcher = async (url) => {
  const res = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });
  if (!res.ok) { if (res.status === 404) return null; throw new Error(res.status); }
  return res.json();
};

function EntrepreneurJobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [job, setJob] = useState(null);
  const [contract, setContract] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [progress, setProgress] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Review modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Property manager profile modal — same component the bid page uses.
  // Fetched lazily on click so we don't spend a request per job view.
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerProfile, setManagerProfile] = useState(null);
  const [managerProfileLoading, setManagerProfileLoading] = useState(false);

  const handleViewManagerProfile = async () => {
    const managerProfileId = job?.manager_id;
    if (!managerProfileId || managerProfileLoading) return;
    setManagerProfileLoading(true);
    try {
      const res = await fetch(
        `${API}/api/users/manager/profile/id/${managerProfileId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) throw new Error("Failed to load manager profile");
      const data = await res.json();
      setManagerProfile(data.profile);
      setShowManagerModal(true);
    } catch (err) {
      toast.error(err.message || tx(t, "entrepreneurJobs.managerProfileFailed", "Couldn't load manager profile."));
    } finally {
      setManagerProfileLoading(false);
    }
  };
  const [categoryRatings, setCategoryRatings] = useState({ quality: 0, timeliness: 0, communication: 0, value: 0 });
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviews, setReviewPreviews] = useState([]);
  const [reviewImageTypes, setReviewImageTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");

  useEffect(() => { loadData(); }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobData, contractData, imagesData, progressData, reviewData] = await Promise.all([
        fetcher(`/api/jobs/${jobId}`),
        fetcher(`/api/contracts/job/${jobId}`),
        fetcher(`/api/jobs/${jobId}/images`),
        fetcher(`/api/progress/${jobId}`).catch(() => null),
        fetcher(`/api/reviews/job/${jobId}`).catch(() => null),
      ]);
      setJob(jobData?.job || jobData);
      setContract(contractData?.contract || null);
      setJobImages(imagesData?.images || imagesData || []);
      setProgress(progressData?.stages || progressData?.progress || []);
      // Combine own reviews and received reviews into one array
      const ownReviews = reviewData?.review || [];
      const receivedReviews = reviewData?.receivedReview || [];
      setReviews([...ownReviews, ...receivedReviews]);
    } catch (err) {
      console.error("Load error:", err);
      toast.error(tx(t, "toasts.failedLoadJobDetails", "Failed to load job details"));
    }
    setLoading(false);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatCurrency = (a) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(a || 0);

  const handleStartProject = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}`, { method: "PUT", headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: "ongoing" }) });
      if (!res.ok) throw new Error("Failed");
      // Initialize progress stages
      try {
        await fetch(`${API}/api/progress/${jobId}/init`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });
      } catch {}
      toast.success(tx(t, "entrepreneurJobs.projectStarted", "Project started!"));
      await loadData();
    } catch { toast.error(tx(t, "toasts.failedStartProject", "Failed to start project")); }
    setIsConfirming(false);
    setConfirmAction(null);
  };

  const handleCompleteProject = async () => {
    // Frontend gate — should be unreachable since the button is hidden until invoice is submitted,
    // but defends against stale UI state.
    if (contract?.id && !contract.invoice_submitted_at) {
      toast.error(tx(t, "submitInvoice.requiredBeforeComplete", "Submit your invoice before marking the work complete."));
      setConfirmAction(null);
      return;
    }
    setIsConfirming(true);
    try {
      // Hit the contract endpoint FIRST so the backend gate (invoice required) can refuse cleanly
      // without leaving jobs.status flipped to 'completed' on a contract that wouldn't accept it.
      if (contract?.id) {
        const cRes = await fetch(`${API}/api/contracts/${contract.id}/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        });
        if (!cRes.ok) {
          const body = await cRes.json().catch(() => ({}));
          throw new Error(body.message || body.error || "Failed to mark contract complete");
        }
      }
      const res = await fetch(`${API}/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(tx(t, "entrepreneurJobs.projectCompleted", "Project marked complete!"));
      await loadData();
    } catch (err) {
      toast.error(err.message || tx(t, "toasts.failedCompleteProject", "Failed to complete project"));
    }
    setIsConfirming(false);
    setConfirmAction(null);
  };

  const handleChatManager = () => {
    const managerId = job.manager_user_id;
    if (!managerId) { toast.error(tx(t, "toasts.cannotFindManager", "Cannot find manager")); return; }
    localStorage.setItem("targetReceiverId", managerId);
    localStorage.setItem("targetReceiverName", job.manager_name || job.manager_company || "Property Manager");
    if (job.id) localStorage.setItem("targetJobId", job.id);
    navigate("/messages/entrepreneur");
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 5) { toast.error(tx(t, "toasts.maxImages", "You can only upload up to 5 images")); return; }
    setReviewImages((p) => [...p, ...files]);
    setReviewImageTypes((p) => [...p, ...files.map(() => "general")]);
    setReviewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeReviewImage = (i) => {
    URL.revokeObjectURL(reviewPreviews[i]);
    setReviewImages((p) => p.filter((_, idx) => idx !== i));
    setReviewImageTypes((p) => p.filter((_, idx) => idx !== i));
    setReviewPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmitReview = async () => {
    const c = categoryRatings;
    if (!c.quality || !c.timeliness || !c.communication || !c.value) { toast.error(tx(t, "toasts.rateAllCategories", "Please rate all categories")); return; }
    setIsSubmitting(true);
    try {
      const managerUserId = job.manager_user_id || job.manager_id;
      const formData = new FormData();
      formData.append("reviewed_user_id", managerUserId);
      formData.append("job_id", job.id);
      formData.append("rating", Math.round((c.quality + c.timeliness + c.communication + c.value) / 4));
      formData.append("comment", (reviewComment || "").trim());
      formData.append("rating_quality", c.quality);
      formData.append("rating_timeliness", c.timeliness);
      formData.append("rating_communication", c.communication);
      formData.append("rating_value", c.value);
      reviewImages.forEach((img) => formData.append("images", img));
      formData.append("image_types", JSON.stringify(reviewImageTypes));
      const res = await fetch(`${API}/api/reviews`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      toast.success(tx(t, "toasts.reviewSubmitted", "Review submitted!"));
      setShowReviewModal(false);
      setReviewComment(""); setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 });
      reviewPreviews.forEach((u) => URL.revokeObjectURL(u));
      setReviewImages([]); setReviewPreviews([]); setReviewImageTypes([]);
      await loadData();
    } catch (err) { toast.error(err.message || "Failed to submit review"); }
    setIsSubmitting(false);
  };

  const myReview = Array.isArray(reviews) ? reviews.find((r) => r.reviewer_id === userProfile.id) : null;
  const managerReview = Array.isArray(reviews) ? reviews.find((r) => r.reviewer_id !== userProfile.id) : null;
  const hasLat = job?.property_lat || job?.property_latitude;
  const hasLng = job?.property_lng || job?.property_longitude;
  const lat = Number(job?.property_lat || job?.property_latitude);
  const lng = Number(job?.property_lng || job?.property_longitude);

  if (loading) {
    // Skeleton mirrors the real page shape (banner slot, title row, main +
    // side cards) so the layout doesn't jump when data lands. Keyframe is
    // inlined because sk-pulse isn't defined in any global stylesheet.
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <style>{`
          @keyframes ejd-shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .ejd-sk {
            background: linear-gradient(90deg, #eef2f7 25%, #e2e8f0 37%, #eef2f7 63%);
            background-size: 800px 100%;
            animation: ejd-shimmer 1.4s ease-in-out infinite;
            border-radius: 8px;
          }
        `}</style>
        <Nav />
        <div className="main-container" style={s.page}>
          {/* Invite banner slot — thin, only visible while loading in case an
              invite banner is about to render. Prevents layout jump. */}
          <div className="ejd-sk" style={{ height: 78, marginBottom: 20, borderRadius: 12 }} />

          {/* Header — back link + title + status/amount row */}
          <div style={{ marginBottom: 24 }}>
            <div className="ejd-sk" style={{ height: 14, width: 72, marginBottom: 14 }} />
            <div className="ejd-sk" style={{ height: 28, width: "60%", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div className="ejd-sk" style={{ height: 24, width: 96, borderRadius: 999 }} />
              <div className="ejd-sk" style={{ height: 24, width: 120 }} />
            </div>
          </div>

          {/* Content grid — one wide card + one side column */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                <div className="ejd-sk" style={{ height: 14, width: 140, marginBottom: 16 }} />
                <div className="ejd-sk" style={{ height: 12, width: "100%", marginBottom: 10 }} />
                <div className="ejd-sk" style={{ height: 12, width: "94%", marginBottom: 10 }} />
                <div className="ejd-sk" style={{ height: 12, width: "78%", marginBottom: 10 }} />
                <div className="ejd-sk" style={{ height: 12, width: "88%" }} />
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                <div className="ejd-sk" style={{ height: 14, width: 100, marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div className="ejd-sk" style={{ height: 96 }} />
                  <div className="ejd-sk" style={{ height: 96 }} />
                  <div className="ejd-sk" style={{ height: 96 }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                <div className="ejd-sk" style={{ height: 14, width: 120, marginBottom: 16 }} />
                <div className="ejd-sk" style={{ height: 12, width: "100%", marginBottom: 10 }} />
                <div className="ejd-sk" style={{ height: 12, width: "84%", marginBottom: 10 }} />
                <div className="ejd-sk" style={{ height: 12, width: "72%" }} />
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                <div className="ejd-sk" style={{ height: 14, width: 100, marginBottom: 16 }} />
                <div className="ejd-sk" style={{ height: 160, borderRadius: 10 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Nav />
        <div className="main-container" style={s.page}>
          <div style={s.loadingWrap}><p style={{ color: "#6b7280" }}>Job not found.</p>
            <button onClick={() => navigate("/jobs/entrepreneur")} style={s.backBtnLink}>Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const CategoryStars = ({ label, value, onChange }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: "0.85rem", color: "#374151" }}>{label}</span>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: value >= n ? "#f59e0b" : "#d1d5db", padding: "2px" }}>★</button>
        ))}
      </div>
    </div>
  );

  const contractAmount = contract?.contract_amount || job.bid_amount || 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Nav />
      <div className="main-container" style={s.page}>
        {/* Overdue banner — visual-only signal that the job passed its
            deadline. Nothing else changes; the page still functions normally. */}
        <OverdueBanner dueDate={job.due_date} />

        {/* Header — mockup layout: teal "← Back" link, bold title, then a
            single row with the status pill + amount inline. */}
        <div style={s.header}>
          <button onClick={() => navigate("/jobs/entrepreneur")} style={s.backBtn}>
            <ArrowLeft size={16} /> {tx(t, "common.back", "Back")}
          </button>
          <h1 style={s.title}>{job.title}</h1>
          <div style={s.headerRow}>
            <span
              style={{
                ...s.statusPill,
                background: (statusColors[job.status] || "#6b7280") + "18",
                color: statusColors[job.status] || "#6b7280",
                border: `1px solid ${(statusColors[job.status] || "#6b7280")}30`,
              }}
            >
              {translateStatus(t, job.status, { uppercase: true })}
            </span>
            <span style={s.contractAmt}>{formatCurrency(contractAmount)}</span>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="ejdp-grid" style={s.grid}>
          {/* LEFT COLUMN */}
          <div style={s.leftCol}>
            {/* Project Information */}
            <div style={s.card}>
              <h2 style={s.cardTitle}><FileText size={18} /> {tx(t, "entrepreneurJobs.projectInformation", "Project Information")}</h2>
              <div style={s.infoGrid}>
                <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "entrepreneurJobs.titleLabel", "Title")}</span><span style={s.infoValue}>{job.title}</span></div>
                <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "entrepreneurJobs.category", "Category")}</span><span style={s.infoValue}>{translateCategory(t, job.category)}</span></div>
              </div>
              {job.description && <div style={{ marginTop: 12 }}><span style={s.infoLabel}>{tx(t, "entrepreneurJobs.description", "Description")}</span><p style={s.desc}>{job.description}</p></div>}
            </div>

            {/* Timeline & Budget — reference detail; collapse on completed jobs. */}
            <CollapsibleCard
              icon={<Calendar size={18} />}
              title={tx(t, "entrepreneurJobs.timelineBudget", "Timeline & Budget")}
              defaultOpen={job.status !== "completed"}
            >
              <div style={s.infoGrid}>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}><Calendar size={13} /> {tx(t, "entrepreneurJobs.dueDate", "Due Date")}</span>
                  <span style={{ ...s.infoValue, display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {formatDate(job.due_date)}
                    <DeadlineIndicator dueDate={job.due_date} compact />
                  </span>
                </div>
                {job.estimated_duration_days && <div style={s.infoItem}><span style={s.infoLabel}><Clock size={13} /> {tx(t, "entrepreneurJobs.estimatedDuration", "Est. Duration")}</span><span style={s.infoValue}>{job.estimated_duration_days} {tx(t, "maintenanceLog.days", "days")}</span></div>}
                {job.budget_min && job.budget_max && <div style={s.infoItem}><span style={s.infoLabel}><DollarSign size={13} /> {tx(t, "entrepreneurJobs.budgetRange", "Budget Range")}</span><span style={s.infoValue}>{formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}</span></div>}
                {job.urgency && <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "entrepreneurJobs.urgencyLabel", "Urgency")}</span><span style={{ ...s.urgencyBadge, background: job.urgency === "Urgent" ? "#fef2f2" : "#f0fdf4", color: job.urgency === "Urgent" ? "#dc2626" : "#16a34a" }}>{translateUrgency(t, job.urgency)}</span></div>}
              </div>
            </CollapsibleCard>

            {/* Job Images — reference; collapse on completed jobs. */}
            {Array.isArray(jobImages) && jobImages.length > 0 && (
              <CollapsibleCard
                icon={<ImageIcon size={18} />}
                title={`${tx(t, "entrepreneurJobs.jobImages", "Job Images")} (${jobImages.length})`}
                defaultOpen={job.status !== "completed"}
              >
                <div style={s.imgGrid}>
                  {jobImages.map((img, i) => (
                    <img key={i} src={img.image_url || img.url || img} alt={`Job ${i + 1}`} style={s.imgThumb}
                      onClick={() => setViewingImage(img.image_url || img.url || img)} />
                  ))}
                </div>
              </CollapsibleCard>
            )}

            {/* Property Information — includes a clickable Property Manager
                pill at the bottom (opens the manager profile modal). Same
                pattern used elsewhere in the app. Collapse on completed. */}
            {(job.property_name || job.property_address || job.manager_name || job.manager_company) && (
              <CollapsibleCard
                icon={<Building2 size={18} />}
                title={tx(t, "entrepreneurJobs.propertyInformation", "Property Information")}
                defaultOpen={job.status !== "completed"}
              >
                <div style={s.infoGrid}>
                  {job.property_name && <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "properties.name", "Name")}</span><span style={s.infoValue}>{job.property_name}</span></div>}
                  {job.property_address && <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "properties.address", "Address")}</span><span style={s.infoValue}>{job.property_address}</span></div>}
                  {(job.property_city || job.property_province) && <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "properties.city", "City")}</span><span style={s.infoValue}>{[job.property_city, job.property_province].filter(Boolean).join(", ")}</span></div>}
                  {job.property_type && <div style={s.infoItem}><span style={s.infoLabel}>{tx(t, "properties.type", "Type")}</span><span style={s.infoValue}>{translatePropertyType(t, job.property_type)}</span></div>}
                </div>

                {(job.manager_name || job.manager_company) && (
                  <div style={{ marginTop: 16 }}>
                    <span style={s.infoLabel}>
                      <User size={13} /> {tx(t, "entrepreneurJobs.propertyManager", "Property Manager")}
                    </span>
                    <button
                      type="button"
                      onClick={handleViewManagerProfile}
                      disabled={!job.manager_id || managerProfileLoading}
                      style={s.managerPill}
                      aria-label={tx(t, "entrepreneurJobs.viewManagerProfile", "View manager profile")}
                    >
                      <div style={s.managerAvatar}>
                        {(job.manager_company || job.manager_name || "P").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                        <div style={s.managerName}>{job.manager_company || job.manager_name}</div>
                        {job.manager_name && job.manager_company && (
                          <div style={s.managerSub}>{job.manager_name}</div>
                        )}
                        <div style={s.managerStats}>
                          {job.manager_avg_rating && (
                            <span style={s.managerStat}>
                              <Star size={13} fill="#f59e0b" stroke="#f59e0b" /> {Number(job.manager_avg_rating).toFixed(1)} ({job.manager_review_count || 0})
                            </span>
                          )}
                          {job.manager_total_jobs && (
                            <span style={s.managerStat}>
                              <Briefcase size={13} /> {job.manager_completed_jobs || 0}/{job.manager_total_jobs} {tx(t, "entrepreneurJobs.jobs", "jobs")}
                            </span>
                          )}
                          {job.manager_experience && (
                            <span style={s.managerStat}>
                              <Award size={13} /> {job.manager_experience}
                            </span>
                          )}
                          {job.manager_joined && (
                            <span style={s.managerStat}>
                              <Shield size={13} /> {tx(t, "entrepreneurJobs.since", "Since")} {new Date(job.manager_joined).getFullYear()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#00A5A9" />
                    </button>
                  </div>
                )}
              </CollapsibleCard>
            )}

            {/* Property Location map — reference only after completion. */}
            {hasLat && hasLng && (
              <CollapsibleCard
                icon={<MapPin size={18} />}
                title={tx(t, "entrepreneurJobs.propertyLocation", "Property Location")}
                defaultOpen={job.status !== "completed"}
              >
                <div style={{ borderRadius: 12, overflow: "hidden", height: 260 }}>
                  <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} attributionControl={false} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[lat, lng]}>
                      <Popup><strong>{job.property_name || "Property"}</strong><br />{job.property_address}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </CollapsibleCard>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={s.rightCol}>
            {/* Contract Status — mockup: label left, value/pill right. */}
            <div style={s.card}>
              <h2 style={s.cardTitle}><FileText size={18} /> {tx(t, "entrepreneurJobs.contractStatus", "Contract Status")}</h2>
              {contract ? (
                <>
                  <div style={s.contractRow}>
                    <span style={s.contractLabel}>{tx(t, "entrepreneurJobs.amount", "Amount")}</span>
                    <span style={s.contractValue}>{formatCurrency(contractAmount)}</span>
                  </div>
                  <div style={s.contractRow}>
                    <span style={s.contractLabel}>{tx(t, "entrepreneurJobs.status", "Status")}</span>
                    {(() => {
                      const st = contract.status;
                      const tint =
                        st === "completed"
                          ? { bg: "#f3e8ff", fg: "#7c3aed", bd: "#e9d5ff" }
                          : st === "active"
                            ? { bg: "#dcfce7", fg: "#059669", bd: "#bbf7d0" }
                            : { bg: "#dbeafe", fg: "#2563eb", bd: "#bfdbfe" };
                      return (
                        <span
                          style={{
                            ...s.statusPillSm,
                            background: tint.bg,
                            color: tint.fg,
                            border: `1px solid ${tint.bd}`,
                          }}
                        >
                          {translateStatus(t, st)}
                        </span>
                      );
                    })()}
                  </div>
                  {contract.approved_at && <div style={s.contractRow}><span style={s.contractLabel}>{tx(t, "entrepreneurJobs.workStarted", "Work Started")}</span><span style={s.contractVal2}>{formatDate(contract.approved_at)}</span></div>}
                  {contract.completed_at && <div style={s.contractRow}><span style={s.contractLabel}>{tx(t, "entrepreneurJobs.workCompleted", "Work Completed")}</span><span style={s.contractVal2}>{formatDate(contract.completed_at)}</span></div>}
                </>
              ) : (
                <div style={s.emptyNote}><AlertCircle size={16} color="#f59e0b" /> Awaiting contract creation</div>
              )}
            </div>

            {/* Bid addenda — post-submission Q&A / price adjustments. On this
                accepted-or-later screen the thread is usually read-only (bid
                is already approved) but the historical record + final effective
                total stay visible for the audit trail. Collapse on completed. */}
            {contract?.bid_id && (
              <CollapsibleCard
                icon={<DollarSign size={18} />}
                title={tx(t, "entrepreneurJobs.priceAdjustments", "Price adjustments (addenda)")}
                defaultOpen={job.status !== "completed"}
              >
                <BidAddendaSection
                  bidId={contract.bid_id}
                  currentUserId={userProfile?.id || null}
                  canAct={false}
                />
              </CollapsibleCard>
            )}

            {/* Job Progress — Stepper UI. Collapse on completed jobs (all
                stages are done — historical audit trail). */}
            {Array.isArray(progress) && progress.length > 0 && (
              <CollapsibleCard
                icon={<CheckCircle size={18} />}
                title={tx(t, "progress.trackProgress", "Job Progress")}
                defaultOpen={job.status !== "completed"}
              >
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  {/* Vertical line */}
                  <div style={{ position: 'absolute', left: 11, top: 4, bottom: 4, width: 2, background: '#e5e7eb', zIndex: 0 }} />
                  {progress.map((stage, i) => {
                    const isDone = stage.completed || stage.status === 'completed';
                    const isActive = stage.status === 'in_progress';
                    const isPending = !isDone && !isActive;
                    return (
                      <div key={i} style={{ position: 'relative', paddingBottom: i < progress.length - 1 ? 24 : 0 }}>
                        {/* Step circle */}
                        <div style={{
                          position: 'absolute', left: -28, top: 0, width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? '#059669' : isActive ? '#00A5A9' : '#fff',
                          border: isDone ? 'none' : isActive ? '2px solid #00A5A9' : '2px solid #d1d5db',
                          boxShadow: isActive ? '0 0 0 4px rgba(0,165,169,0.15)' : 'none',
                        }}>
                          {isDone ? (
                            <CheckCircle size={14} color="#fff" />
                          ) : isActive ? (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{i + 1}</span>
                          )}
                        </div>
                        {/* Content */}
                        <div style={{
                          background: isActive ? '#f0fdfa' : isDone ? '#f9fafb' : '#fff',
                          border: isActive ? '1px solid #99f6e4' : '1px solid #f3f4f6',
                          borderRadius: 10, padding: '12px 14px',
                          transition: 'all 0.2s',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isDone ? '#059669' : isActive ? '#00A5A9' : '#374151' }}>
                              {formatStageName(stage.stage || stage.title || stage.name, t) || `Stage ${i + 1}`}
                            </span>
                            <span style={{
                              fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                              background: isDone ? '#d1fae5' : isActive ? '#ccfbf1' : '#f3f4f6',
                              color: isDone ? '#047857' : isActive ? '#0d9488' : '#9ca3af',
                              textTransform: 'uppercase', letterSpacing: '0.03em',
                            }}>
                              {formatStageStatus(isDone ? 'completed' : isActive ? 'in_progress' : 'pending', t)}
                            </span>
                          </div>
                          {stage.notes && (
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 }}>{stage.notes}</p>
                          )}
                          {(stage.actual_start || stage.actual_end) && (
                            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
                              {stage.actual_start && <span>Started: {new Date(stage.actual_start).toLocaleDateString()}</span>}
                              {stage.actual_end && <span>Ended: {new Date(stage.actual_end).toLocaleDateString()}</span>}
                            </div>
                          )}
                          {stage.photos && stage.photos.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              {stage.photos.map((p, pi) => (
                                <img key={pi} src={p.image_url || p.url || p} alt="" onClick={() => setViewImg(p.image_url || p.url || p)}
                                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                              ))}
                            </div>
                          )}
                          {/* Stage action buttons — entrepreneur only */}
                          {job.status === 'ongoing' && !isDone && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              {isPending && i === progress.findIndex(s => s.status !== 'completed') && (
                                <button
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: '#00A5A9', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                  onClick={async () => {
                                    try {
                                      await fetch(`${API}/api/progress/stage/${stage.id}`, {
                                        method: 'PUT',
                                        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'in_progress' })
                                      });
                                      toast.success(tx(t, 'toasts.stageStarted', '{{stage}} started').replace('{{stage}}', formatStageName(stage.stage, t)));
                                      await loadData();
                                    } catch { toast.error(tx(t, 'toasts.failedUpdateStage', 'Failed to update stage')); }
                                  }}
                                >
                                  <PlayCircle size={13} /> {tx(t, 'progress.start', 'Start')}
                                </button>
                              )}
                              {isActive && (
                                <button
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                  onClick={async () => {
                                    try {
                                      await fetch(`${API}/api/progress/stage/${stage.id}`, {
                                        method: 'PUT',
                                        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'completed' })
                                      });
                                      toast.success(tx(t, 'toasts.stageCompleted', '{{stage}} completed').replace('{{stage}}', formatStageName(stage.stage, t)));
                                      await loadData();
                                    } catch { toast.error(tx(t, 'toasts.failedUpdateStage', 'Failed to update stage')); }
                                  }}
                                >
                                  <CheckCircle size={13} /> {tx(t, 'progress.markComplete', 'Complete')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleCard>
            )}

            {/* Initialize Progress — for ongoing jobs without progress */}
            {(job.status === "ongoing" || job.status === "completed") && (!progress || progress.length === 0) && (
              <div style={s.card}>
                <h2 style={s.cardTitle}><CheckCircle size={18} /> {tx(t, 'progress.title', 'Job Progress')}</h2>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 12px' }}>No progress stages initialized yet. Initialize to track your project milestones.</p>
                <button
                  style={{ ...s.actionBtn, background: '#00A5A9' }}
                  onClick={async () => {
                    try {
                      await fetch(`${API}/api/progress/${jobId}/init`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });
                      toast.success(tx(t, "toasts.progressInitialized", "Progress initialized!"));
                      await loadData();
                    } catch { toast.error(tx(t, "toasts.failedInitProgress", "Failed to initialize progress")); }
                  }}
                >
                  <CheckCircle size={17} /> {tx(t, 'progress.initProgress', 'Initialize Progress')}
                </button>
              </div>
            )}

            {/* Actions */}
            <div id="ejdp-actions" style={s.card}>
              <h2 style={s.cardTitle}>{tx(t, "entrepreneurJobs.actions", "Actions")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {job.status === "accepted" && (
                  <button style={{ ...s.actionBtn, background: "#059669", opacity: contract?.status === "active" ? 1 : 0.5 }}
                    disabled={!contract || contract.status !== "active" || isConfirming}
                    onClick={() => setConfirmAction("start")}>
                    <PlayCircle size={17} /> {tx(t, "entrepreneurJobs.startProject", "Start Project")}
                  </button>
                )}
                {job.status === "ongoing" && contract && !contract.invoice_submitted_at && (
                  <button
                    style={{ ...s.actionBtn, background: "#0F223D" }}
                    disabled={isConfirming}
                    onClick={() => setShowInvoiceModal(true)}
                  >
                    <Receipt size={17} /> {tx(t, "submitInvoice.submit", "Submit Invoice")}
                  </button>
                )}
                {job.status === "ongoing" && contract && contract.invoice_submitted_at && (
                  <>
                    <button
                      style={{ ...s.actionBtn, background: "#2563eb" }}
                      disabled={isConfirming}
                      onClick={() => setConfirmAction("done")}
                    >
                      <CheckCircle size={17} /> {tx(t, "entrepreneurJobs.markComplete", "Mark as Completed")}
                    </button>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, background: "transparent", color: "#0F223D", border: "1px solid #d1d5db" }}
                      disabled={isConfirming}
                      onClick={() => setShowInvoiceModal(true)}
                    >
                      <Edit3 size={15} /> {tx(t, "submitInvoice.edit", "Edit Invoice")}
                    </button>
                  </>
                )}
                {job.status === "ongoing" && !contract && (
                  <div style={s.emptyNote}>
                    <AlertCircle size={14} /> {tx(t, "entrepreneurJobs.noContractYet", "Waiting for contract")}
                  </div>
                )}
                <button style={{ ...s.actionBtn, background: "#0F223D" }} onClick={handleChatManager}>
                  <MessageSquare size={17} /> {tx(t, "entrepreneurJobs.chatWithManager", "Chat with Manager")}
                </button>

                {job.status === "completed" && contract?.mutual_confirmation_completed_at && !myReview && (
                  <button style={{ ...s.actionBtn, background: "#f59e0b" }} onClick={() => { setShowReviewModal(true); setReviewComment(""); setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 }); }}>
                    <Star size={17} /> {tx(t, "entrepreneurJobs.leaveReview", "Leave Review")}
                  </button>
                )}
                {job.status === "completed" && contract && !contract.mutual_confirmation_completed_at && (
                  <div style={s.emptyNote}><Clock size={14} /> {tx(t, "entrepreneurJobs.awaitingManagerConfirmation", "Awaiting manager confirmation")}</div>
                )}
              </div>
            </div>

            {/* Completion Notes — what each party recorded when confirming */}
            {contract && (contract.manager_completion_note || contract.contractor_completion_note) && (
              <div style={{ ...s.card, border: '1px solid #fde68a', background: '#fffbeb' }}>
                <h2 style={s.cardTitle}>
                  <FileText size={18} style={{ color: '#d97706' }} />
                  {tx(t, "completionNotes.title", "Completion Notes")}
                </h2>
                {contract.manager_completion_note && (
                  <div style={{ paddingBottom: contract.contractor_completion_note ? 10 : 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: 4, letterSpacing: 0.2 }}>
                      {tx(t, "completionNotes.fromManagerLabel", "From the property manager")}
                      {contract.manager_confirmed_at && (
                        <span style={{ fontWeight: 400, color: '#b45309' }}>
                          {' · '}
                          {new Date(contract.manager_confirmed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#0F223D', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {contract.manager_completion_note}
                    </p>
                  </div>
                )}
                {contract.contractor_completion_note && (
                  <div style={{ paddingTop: contract.manager_completion_note ? 10 : 0, borderTop: contract.manager_completion_note ? '1px dashed #fde68a' : 'none' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: 4, letterSpacing: 0.2 }}>
                      {tx(t, "completionNotes.fromYou", "From you")}
                      {contract.contractor_confirmed_at && (
                        <span style={{ fontWeight: 400, color: '#b45309' }}>
                          {' · '}
                          {new Date(contract.contractor_confirmed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#0F223D', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {contract.contractor_completion_note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Your Review */}
            {myReview && (
              <div style={s.card}>
                <h2 style={s.cardTitle}><Star size={18} /> {tx(t, "entrepreneurJobs.yourReview", "Your Review")}</h2>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={20} fill={n <= myReview.rating ? "#f59e0b" : "none"} stroke="#f59e0b" />)}
                  <span style={{ marginLeft: 8, fontWeight: 600, color: "#1f2937" }}>{myReview.rating}/5</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>"{myReview.comment}"</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 8 }}>{formatDate(myReview.created_at)}</p>
                {myReview.images?.length > 0 && (
                  <div style={s.imgGrid}>
                    {myReview.images.map((img, i) => <img key={i} src={img.image_url} alt="" style={{ ...s.imgThumb, height: 60, width: 60 }} onClick={() => window.open(img.image_url, "_blank")} />)}
                  </div>
                )}
              </div>
            )}

            {/* Review from Manager */}
            {managerReview && (
              <div style={{ ...s.card, border: '1px solid #fde68a', background: '#fffbeb' }}>
                <h2 style={s.cardTitle}><Star size={18} fill="#facc15" stroke="#facc15" /> {tx(t, "entrepreneurJobs.reviewFromManager", "Review from Manager")}</h2>
                <div style={{ display: "flex", gap: 4, marginBottom: 8, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={22} fill={n <= managerReview.rating ? "#facc15" : "none"} stroke={n <= managerReview.rating ? "#facc15" : "#d1d5db"} />)}
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#92400e', fontWeight: 600, margin: '0 0 12px' }}>{managerReview.rating} / 5</p>
                {(managerReview.rating_quality || managerReview.rating_timeliness) && (
                  <div style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, border: '1px solid #fde68a' }}>
                    {[
                      { label: 'Quality', val: managerReview.rating_quality },
                      { label: 'Timeliness', val: managerReview.rating_timeliness },
                      { label: 'Communication', val: managerReview.rating_communication },
                      { label: 'Value', val: managerReview.rating_value },
                    ].filter(c => c.val).map(c => (
                      <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#92400e' }}>{c.label}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={12} fill={i <= c.val ? '#facc15' : 'none'} stroke={i <= c.val ? '#facc15' : '#d1d5db'} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {managerReview.comment && (
                  <div style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #fde68a' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{managerReview.comment}"</p>
                  </div>
                )}
                <p style={{ fontSize: '0.7rem', color: '#b45309', marginTop: 8, textAlign: 'center' }}>{formatDate(managerReview.created_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div style={s.overlay} onClick={() => setConfirmAction(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0 }}>{confirmAction === "start" ? tx(t, "entrepreneurJobs.startProjectQuestion", "Start this project?") : tx(t, "entrepreneurJobs.markCompleteQuestion", "Mark as completed?")}</h3>
              <button style={s.closeBtn} onClick={() => setConfirmAction(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                <strong>{job.title}</strong><br />
                {confirmAction === "start" ? tx(t, "entrepreneurJobs.statusChangeOngoing", "Status will change to ongoing.") : tx(t, "entrepreneurJobs.statusChangeCompleted", "Status will change to completed.")}
              </p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setConfirmAction(null)}>{tx(t, "entrepreneurJobs.cancel", "Cancel")}</button>
              <button style={s.confirmBtn} disabled={isConfirming} onClick={confirmAction === "start" ? handleStartProject : handleCompleteProject}>
                {isConfirming ? "..." : tx(t, "entrepreneurJobs.confirm", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Manager Profile Modal */}
      <PropertyManagerProfileModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        profile={managerProfile}
      />

      {/* Submit / Edit Invoice Modal */}
      <SubmitInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        contract={contract}
        jobTitle={job?.title}
        onSubmitted={loadData}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <div style={s.overlay} onClick={() => setShowReviewModal(false)}>
          <div style={{ ...s.modal, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div><h3 style={{ margin: 0 }}>{tx(t, "entrepreneurJobs.leaveAReview", "Leave a Review")}</h3><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>{job.title}</p></div>
              <button style={s.closeBtn} onClick={() => setShowReviewModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: "16px 24px", maxHeight: "60vh", overflowY: "auto" }}>
              <label style={s.sectionLabel}>{tx(t, "entrepreneurJobs.rateCategories", "Rate by Category")}</label>
              <CategoryStars label="Quality of Work" value={categoryRatings.quality} onChange={(v) => setCategoryRatings((p) => ({ ...p, quality: v }))} />
              <CategoryStars label="Timeliness" value={categoryRatings.timeliness} onChange={(v) => setCategoryRatings((p) => ({ ...p, timeliness: v }))} />
              <CategoryStars label="Communication" value={categoryRatings.communication} onChange={(v) => setCategoryRatings((p) => ({ ...p, communication: v }))} />
              <CategoryStars label="Value for Money" value={categoryRatings.value} onChange={(v) => setCategoryRatings((p) => ({ ...p, value: v }))} />
              {categoryRatings.quality && categoryRatings.timeliness && categoryRatings.communication && categoryRatings.value ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 12px", background: "#fffbeb", borderRadius: 8 }}>
                  <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                  <span style={{ fontWeight: 600 }}>{((categoryRatings.quality + categoryRatings.timeliness + categoryRatings.communication + categoryRatings.value) / 4).toFixed(1)}</span>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Overall</span>
                </div>
              ) : null}
              <div style={{ marginTop: 16 }}>
                <label style={s.sectionLabel}>{tx(t, "entrepreneurJobs.shareExperience", "Share your experience")}</label>
                <textarea style={s.textarea} rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Tell us about your experience..." />
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>{reviewComment.length} chars</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={s.sectionLabel}>{tx(t, "entrepreneurJobs.addPhotos", "Add Photos (optional)")}</label>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} id="review-imgs" style={{ display: "none" }} />
                <label htmlFor="review-imgs" style={s.uploadBtn}><ImageIcon size={16} /> Choose Images</label>
                {reviewPreviews.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {reviewPreviews.map((p, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                        <button onClick={() => removeReviewImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setShowReviewModal(false)} disabled={isSubmitting}>Cancel</button>
              <button style={{ ...s.confirmBtn, background: "#f59e0b", opacity: (!categoryRatings.quality || !categoryRatings.timeliness || !categoryRatings.communication || !categoryRatings.value) ? 0.5 : 1 }}
                onClick={handleSubmitReview} disabled={isSubmitting || !categoryRatings.quality || !categoryRatings.timeliness || !categoryRatings.communication || !categoryRatings.value}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {viewingImage && (
        <div style={s.overlay} onClick={() => setViewingImage(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={viewingImage} alt="Full" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} />
            <button onClick={() => setViewingImage(null)} style={{ position: "absolute", top: -12, right: -12, width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Floating Quick Actions button — mobile only */}
      {job && (
        <button
          type="button"
          className="ejdp-fab"
          onClick={() => {
            const el = document.getElementById('ejdp-actions');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          aria-label={tx(t, "entrepreneurJobs.actions", "Actions")}
        >
          <Zap size={22} fill="currentColor" />
        </button>
      )}
    </div>
  );
}

/* Responsive media query — inject once */
const ejdpResponsiveId = "ejdp-responsive";
if (typeof document !== "undefined" && !document.getElementById(ejdpResponsiveId)) {
  const style = document.createElement("style");
  style.id = ejdpResponsiveId;
  style.textContent = `
    .ejdp-fab { display: none; }
    @media (max-width: 900px) {
      .ejdp-fab {
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
      .ejdp-fab:hover { filter: brightness(1.05); }
      .ejdp-fab:active { filter: brightness(0.95); }
    }
  `;
  document.head.appendChild(style);
}

// Card wrapper with a full-width, click-anywhere header that toggles the
// body. Chevron space-between on the right. Same pattern used on the PM's
// bid detail page — reference cards on a completed job can be collapsed by
// default so the eye lands on the completion artifacts first.
function CollapsibleCard({ icon, title, defaultOpen = true, headerAction, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={s.card}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0F223D", fontWeight: 600, fontSize: "0.95rem", minWidth: 0 }}>
          {icon}
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
          onClick={(e) => headerAction && e.stopPropagation()}
        >
          {headerAction}
          <ChevronDown
            size={18}
            color="#9ca3af"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          />
        </div>
      </div>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

const s = {
  page: { flex: 1, padding: "24px 32px", overflowY: "auto", background: "#f8fafc" },

  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#00A5A9", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: { marginBottom: 24 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#00A5A9", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, padding: 0, marginBottom: 12 },
  backBtnLink: { color: "#00A5A9", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 },
  headerInfo: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, minWidth: 0 },
  title: { margin: "0 0 10px", fontSize: "clamp(1.25rem, 3.6vw, 1.75rem)", fontWeight: 800, color: "#0F223D", lineHeight: 1.2, wordBreak: "break-word" },
  // Row under the title: status pill + bid amount inline. Matches redesign.
  headerRow: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  headerMeta: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  // Legacy solid-color pill (kept for compatibility if used elsewhere).
  statusBadge: { color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.5px" },
  statusBadgeSm: { color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600, display: "inline-block" },
  // Redesign pills — tinted background + matching foreground colour.
  statusPill: { padding: "5px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", display: "inline-flex", alignItems: "center" },
  statusPillSm: { padding: "3px 12px", borderRadius: 14, fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", textTransform: "capitalize" },
  contractAmt: { fontSize: "1.375rem", fontWeight: 800, color: "#0F223D" },
  grid: { display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: 20 },
  rightCol: { display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24 },
  card: { background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" },
  cardTitle: { margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 600, color: "#0F223D", display: "flex", alignItems: "center", gap: 8 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  infoItem: { display: "flex", flexDirection: "column", gap: 3 },
  infoLabel: { fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 },
  infoValue: { fontSize: "0.875rem", color: "#1f2937", fontWeight: 500 },
  desc: { fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.65, margin: "6px 0 0" },
  urgencyBadge: { padding: "3px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, display: "inline-block", width: "fit-content" },
  imgGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 },
  imgThumb: { width: "100%", height: 90, objectFit: "cover", borderRadius: 10, cursor: "pointer", border: "1px solid #e5e7eb" },
  managerCard: { display: "flex", gap: 14, alignItems: "flex-start", padding: 14, background: "#f9fafb", borderRadius: 12 },
  // Clickable version — same shape as managerCard, but styled as a button
  // that opens the PropertyManagerProfileModal.
  managerPill: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    padding: "14px 16px",
    background: "#fff",
    border: "1px solid #d1e9ea",
    borderRadius: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    width: "100%",
    marginTop: 8,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color .15s, box-shadow .15s",
  },
  managerAvatar: { width: 48, height: 48, borderRadius: "50%", background: "#0F223D", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, flexShrink: 0 },
  managerName: { fontWeight: 600, fontSize: "0.95rem", color: "#1f2937" },
  managerSub: { fontSize: "0.8rem", color: "#6b7280", marginTop: 2 },
  managerStats: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 },
  managerStat: { display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#4b5563" },
  contractRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
  contractLabel: { fontSize: "0.8rem", color: "#6b7280" },
  contractValue: { fontSize: "1.1rem", fontWeight: 700, color: "#0F223D" },
  contractVal2: { fontSize: "0.85rem", color: "#1f2937", fontWeight: 500 },
  emptyNote: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#6b7280", padding: "10px 14px", background: "#fefce8", borderRadius: 10 },
  progressItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0" },
  progressDot: { width: 10, height: 10, borderRadius: "50%", marginTop: 4, flexShrink: 0 },
  actionBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "100%" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, padding: 16 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 24px", borderBottom: "1px solid #e5e7eb" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 },
  cancelBtn: { padding: "9px 18px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" },
  confirmBtn: { padding: "9px 18px", background: "#00A5A9", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" },
  sectionLabel: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 8 },
  textarea: { width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  uploadBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px dashed #d1d5db", borderRadius: 8, fontSize: "0.82rem", color: "#6b7280", cursor: "pointer", background: "#f9fafb" },
};

// Inject keyframes for spinner
if (typeof document !== "undefined" && !document.getElementById("ejdp-spin")) {
  const style = document.createElement("style");
  style.id = "ejdp-spin";
  style.textContent = `@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:900px){.ejdp-grid{grid-template-columns:1fr!important;}}`;
  document.head.appendChild(style);
}

export default EntrepreneurJobDetailsPage;
