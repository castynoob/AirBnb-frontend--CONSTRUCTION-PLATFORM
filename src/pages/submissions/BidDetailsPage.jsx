import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Star, MapPin, Calendar, Clock, DollarSign, Briefcase,
  Building2, Mail, Heart, User, FileText, Trash2, Archive, CheckCircle,
  XCircle, ExternalLink, Shield, Award, Tag, AlertCircle
} from "lucide-react"
import Nav from "../../components/Nav"
import { useLanguage } from "../../contexts/LanguageContext"
import toast from "react-hot-toast"
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal"
import { confirmCompletion as confirmCompletionApi } from "../../utils/contractApi"
import { translateStatus as translateStatusEnum, translateUrgency as translateUrgencyEnum, translateCategory as translateCategoryEnum } from "../../utils/translateEnums"

// Helper: returns fallback if t() returns the key itself
const tx = (t, key, fallback) => {
  const val = t(key);
  return val === key ? fallback : val;
}
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("userProfile"))?.token
  } catch { return null }
}

function authHeaders() {
  const token = getToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

// ─── helpers ──────────────────────────────────────────────────
function normalizeStatus(status) {
  if (!status) return "open"
  const s = status.toLowerCase().trim()
  if (s === "open" || s === "pending") return "open"
  if (s === "accepted" || s === "approved" || s === "ongoing" || s === "in_progress") return "accepted"
  if (s === "completed" || s === "done") return "completed"
  if (s === "declined" || s === "rejected") return "declined"
  return s
}

function statusColor(status) {
  const map = { open: "#2563eb", accepted: "#059669", completed: "#7c3aed", declined: "#dc2626" }
  return map[normalizeStatus(status)] || "#6b7280"
}

const translateUrgency = (t, value) => translateUrgencyEnum(t, value)
const translateCategory = (t, value) => translateCategoryEnum(t, value)

function formatCurrency(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return "$0.00"
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d, language = "en") {
  if (!d) return "N/A"
  const locale = language === "fr" ? "fr-FR" : "en-US"
  return new Date(d).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })
}

function getInitial(name) {
  if (!name) return "?"
  return name.charAt(0).toUpperCase()
}

// ─── component ────────────────────────────────────────────────
export default function BidDetailsPage() {
  const { bidId } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const fd = (d) => formatDate(d, language)
  const locale = language === "fr" ? "fr-FR" : "en-US"

  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [coords, setCoords] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [jobProgress, setJobProgress] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)
  const [confirmAction, setConfirmAction] = useState(null) // { title, message, onConfirm, color }
  const [showCompletionNoteModal, setShowCompletionNoteModal] = useState(false)
  const [completionNote, setCompletionNote] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRatings, setReviewRatings] = useState({ quality: 0, timeliness: 0, communication: 0, value: 0 })
  const [reviewComment, setReviewComment] = useState("")
  const [reviewImages, setReviewImages] = useState([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const reviewFileRef = { current: null }
  const overallRating = Math.round(Object.values(reviewRatings).reduce((a, b) => a + b, 0) / 4)

  // ─── responsive listener ─────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // ─── fetch submission ────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/bids/manager/submissions`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Failed to load submissions")
      const data = await res.json()
      const found = (data.submissions || []).find(
        (s) => String(s.bid.id) === String(bidId)
      )
      if (!found) throw new Error("Bid not found")
      setSubmission(found)

      // check favorite
      try {
        const favRes = await fetch(`${API_BASE}/api/favorites`, { headers: authHeaders() })
        if (favRes.ok) {
          const favData = await favRes.json()
          const favIds = (favData.favorites || favData || []).map((f) =>
            String(f.entrepreneur_id || f.id)
          )
          setIsFavorite(favIds.includes(String(found.entrepreneur_profile.id)))
        }
      } catch { /* ignore */ }

      // geocode address for map
      if (found.property_address) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(found.property_address)}&limit=1`
          )
          const geoData = await geoRes.json()
          if (geoData[0]) setCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)])
        } catch { /* ignore */ }
      }

      // Fetch job progress
      if (found.job?.id) {
        try {
          const progRes = await fetch(`${API_BASE}/api/progress/${found.job.id}`, { headers: authHeaders() })
          if (progRes.ok) {
            const progData = await progRes.json()
            setJobProgress(progData.stages || [])
          }
        } catch { /* no progress yet */ }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [bidId])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── actions ─────────────────────────────────────────────
  const handleAccept = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const { bid, job, entrepreneur_profile } = submission

      // 1. Create contract (skip if already exists)
      const contractRes = await fetch(`${API_BASE}/api/contracts/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ bid_id: bid.id }),
      })
      if (!contractRes.ok) {
        const d = await contractRes.json()
        // If contract already exists, continue with bid approval
        if (d.error !== 'Contract already exists for this job') {
          throw new Error(d.error || d.message || "Failed to create contract")
        }
      }

      // 2. Approve bid
      const approveRes = await fetch(`${API_BASE}/api/bids/${bid.id}/approve`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!approveRes.ok) {
        const d = await approveRes.json()
        throw new Error(d.message || "Failed to approve bid")
      }

      // 3. Update job status
      await fetch(`${API_BASE}/api/jobs/${job.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          status: "accepted",
          entrepreneur_id: String(entrepreneur_profile.user_id),
        }),
      })

      toast.success(tx(t, "submissions.bidAccepted", "Bid accepted successfully!"))
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to accept bid")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/bids/${submission.bid.id}/decline`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || "Failed to decline bid")
      }
      toast.success(tx(t, "submissions.bidDeclined", "Bid declined"))
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to decline bid")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteJob = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${submission.job.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || "Failed to delete job")
      }
      toast.success(tx(t, "submissions.jobDeletedSuccess", "Job deleted"))
      navigate(-1)
    } catch (err) {
      toast.error(err.message || "Failed to delete job")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleArchive = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${submission.job.id}/archive`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ archive: true }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || "Failed to archive job")
      }
      toast.success(tx(t, "submissions.jobArchivedSuccess", "Job archived"))
      navigate(-1)
    } catch (err) {
      toast.error(err.message || "Failed to archive job")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdrawAcceptance = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      // Use the cancel-approval endpoint which handles everything server-side
      const res = await fetch(`${API_BASE}/api/bids/${submission.bid.id}/cancel-approval`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || "Failed to withdraw acceptance")
      }

      toast.success(tx(t, "submissions.bidWithdrawn", "Bid acceptance withdrawn. Job reopened."))
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to withdraw acceptance")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (isProcessing) return
    if (!completionNote.trim()) {
      toast.error(tx(t, "submissions.completionNoteRequired", "Please add a note before confirming."))
      return
    }
    setIsProcessing(true)
    try {
      const cRes = await fetch(`${API_BASE}/api/contracts/job/${submission.job.id}`, {
        headers: authHeaders(),
      })
      const cData = await cRes.json()
      if (!cData.has_contract || !cData.contract) {
        throw new Error(tx(t, "submissions.noContractFound", "No contract found for this job."))
      }

      await confirmCompletionApi(cData.contract.id, completionNote.trim())
      toast.success(tx(t, "submissions.completionConfirmedSuccess", "Work completion confirmed successfully"))
      setShowCompletionNoteModal(false)
      setCompletionNote("")
      fetchData()
    } catch (err) {
      toast.error(err.message || tx(t, "submissions.completionFailed", "Failed to confirm completion."))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bids/${submission.bid.id}/favorite`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Failed to toggle favorite")
      setIsFavorite((p) => !p)
      toast.success(isFavorite ? tx(t, "submissions.removedFromFavorites", "Removed from favorites") : tx(t, "submissions.addedToFavorites", "Added to favorites"))
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ─── derived ─────────────────────────────────────────────
  const jobStatus = submission ? normalizeStatus(submission.job.status) : "open"
  const bidStatus = submission?.bid?.status || "pending"
  const hasContract = !!submission?.contract
  const contractorConfirmed = submission?.contract?.contractor_completion_confirmed
  const managerConfirmed = submission?.contract?.manager_completion_confirmed

  // ─── loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Nav />
        <div className="main-container" style={s.page}>
          <div style={s.container}>
            <div style={s.backRow}>
              <div style={{ ...s.skeleton, width: 100, height: 36, borderRadius: 8 }} />
            </div>
            <div style={isMobile ? s.gridMobile : s.grid}>
              <div style={s.leftCol}>
                {[280, 320, 260].map((h, i) => (
                  <div key={i} style={{ ...s.skeleton, height: h, borderRadius: 16 }} />
                ))}
              </div>
              <div style={s.rightCol}>
                {[220, 200, 60].map((h, i) => (
                  <div key={i} style={{ ...s.skeleton, height: h, borderRadius: 16 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── error state ─────────────────────────────────────────
  if (error || !submission) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Nav />
        <div className="main-container" style={s.page}>
          <div style={s.container}>
            <div style={s.errorBox}>
              <AlertCircle size={48} color="#dc2626" />
              <h2 style={s.errorTitle}>{error || "Bid not found"}</h2>
              <button style={s.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> {tx(t, "submissions.goBack", "Go Back")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { bid, job, entrepreneur_profile: ep, user, property_address, contract } = submission
  const displayName = ep.company_name || `${user.first_name} ${user.last_name}`

  // ─── render ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Nav />
      <div className="main-container" style={s.page}>
        <div style={s.container}>
          {/* Back button */}
          <div style={s.backRow}>
            <button style={s.backBtn} onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>{tx(t, "submissions.back", "Back")}</span>
            </button>
          </div>

          <div style={isMobile ? s.gridMobile : s.grid}>
            {/* ═══════════ LEFT COLUMN ═══════════ */}
            <div style={s.leftCol}>
              {/* Header */}
              <div style={s.card}>
                <div style={s.headerTop}>
                  <div style={{ flex: 1 }}>
                    <h1 style={s.jobTitle}>{job.title}</h1>
                    <div style={s.headerMeta}>
                      <span
                        style={{
                          ...s.statusBadge,
                          background: statusColor(job.status) + "18",
                          color: statusColor(job.status),
                          border: `1px solid ${statusColor(job.status)}30`,
                        }}
                      >
                        {translateStatusEnum(t, job.status, { uppercase: true })}
                      </span>
                      <span style={s.bidStatusText}>
                        {tx(t, "submissions.bidStatus", "Bid:")} {tx(t, `submissions.${bidStatus}`, bidStatus)}
                      </span>
                    </div>
                  </div>
                  <div style={s.bidAmountBox}>
                    <span style={s.bidAmountLabel}>{tx(t, "submissions.bidAmount", "Bid Amount")}</span>
                    <span style={s.bidAmountValue}>{formatCurrency(bid.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Job Progress Stepper — at top when exists */}
              {jobProgress.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <CheckCircle size={18} color="#00A5A9" />
                    {tx(t, "progress.title", "Job Progress")}
                  </h3>
                  <div style={{ position: 'relative', paddingLeft: 28 }}>
                    <div style={{ position: 'absolute', left: 11, top: 4, bottom: 4, width: 2, background: '#e5e7eb', zIndex: 0 }} />
                    {jobProgress.map((stage, i) => {
                      const isDone = stage.completed || stage.status === 'completed';
                      const isActive = stage.status === 'in_progress';
                      const stageKeyMap = { not_started: 'notStarted', mobilization: 'mobilization', in_progress: 'inProgress', inspection: 'inspection', completed: 'completed' };
                      const stageKey = stageKeyMap[stage.stage];
                      const name = stageKey ? tx(t, `progress.${stageKey}`, (stage.stage || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : ((stage.stage || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || `Stage ${i + 1}`);
                      return (
                        <div key={i} style={{ position: 'relative', paddingBottom: i < jobProgress.length - 1 ? 20 : 0 }}>
                          <div style={{
                            position: 'absolute', left: -28, top: 0, width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDone ? '#059669' : isActive ? '#00A5A9' : '#fff',
                            border: isDone ? 'none' : isActive ? '2px solid #00A5A9' : '2px solid #d1d5db',
                            boxShadow: isActive ? '0 0 0 4px rgba(0,165,169,0.15)' : 'none',
                          }}>
                            {isDone ? <CheckCircle size={14} color="#fff" /> : isActive ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{i + 1}</span>}
                          </div>
                          <div style={{
                            background: isActive ? '#f0fdfa' : isDone ? '#f9fafb' : '#fff',
                            border: isActive ? '1px solid #99f6e4' : '1px solid #f3f4f6',
                            borderRadius: 10, padding: '10px 12px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: isDone ? '#059669' : isActive ? '#00A5A9' : '#374151' }}>{name}</span>
                              <span style={{
                                fontSize: '0.625rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                background: isDone ? '#d1fae5' : isActive ? '#ccfbf1' : '#f3f4f6',
                                color: isDone ? '#047857' : isActive ? '#0d9488' : '#9ca3af',
                                textTransform: 'uppercase',
                              }}>{isDone ? tx(t, 'progress.statusCompleted', 'Done') : isActive ? tx(t, 'progress.statusInProgress', 'Active') : tx(t, 'progress.statusPending', 'Pending')}</span>
                            </div>
                            {stage.notes && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0' }}>{stage.notes}</p>}
                            {(stage.actual_start || stage.actual_end) && (
                              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.7rem', color: '#9ca3af' }}>
                                {stage.actual_start && <span>{tx(t, 'submissions.started', 'Started')}: {new Date(stage.actual_start).toLocaleDateString(locale)}</span>}
                                {stage.actual_end && <span>{tx(t, 'submissions.ended', 'Ended')}: {new Date(stage.actual_end).toLocaleDateString(locale)}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Job Information */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <Briefcase size={18} color="#00A5A9" />
                  {tx(t, "submissions.jobInformation", "Job Information")}
                </h3>
                <div style={s.infoGrid}>
                  <InfoRow icon={<Tag size={15} />} label={tx(t, "submissions.category", "Category")} value={translateCategory(t, job.category)} />
                  <InfoRow icon={<AlertCircle size={15} />} label={tx(t, "submissions.urgency", "Urgency")} value={translateUrgency(t, job.urgency)} />
                  <InfoRow icon={<Calendar size={15} />} label={tx(t, "submissions.dueDate", "Due Date")} value={fd(job.due_date)} />
                  <InfoRow icon={<Clock size={15} />} label={tx(t, "submissions.duration", "Duration")} value={`${job.estimated_duration_days || "N/A"} ${tx(t, "submissions.days", "days")}`} />
                  <InfoRow
                    icon={<DollarSign size={15} />}
                    label={tx(t, "submissions.budgetRange", "Budget Range")}
                    value={`${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`}
                  />
                  <InfoRow icon={<MapPin size={15} />} label={tx(t, "submissions.property", "Property")} value={property_address} />
                </div>
                {job.description && (
                  <div style={s.descriptionBlock}>
                    <span style={s.descLabel}>{tx(t, "submissions.description", "Description")}</span>
                    <p style={s.descText}>{job.description}</p>
                  </div>
                )}
              </div>

              {/* Map */}
              {coords && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>
                    <MapPin size={18} color="#00A5A9" />
                    {tx(t, "submissions.location", "Location")}
                  </h3>
                  <div style={s.mapWrapper}>
                    <MapContainer
                      center={coords}
                      zoom={15}
                      style={{ height: "100%", width: "100%", borderRadius: 12 }}
                      attributionControl={false}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={coords} />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <FileText size={18} color="#00A5A9" />
                  {tx(t, "submissions.actions", "Actions")}
                </h3>
                <div style={s.actionsRow}>
                  {/* Accept — only if open and pending */}
                  {jobStatus === "open" && bidStatus === "pending" && (
                    <button
                      style={{ ...s.actionBtn, ...s.acceptBtn }}
                      onClick={handleAccept}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={16} />
                      {isProcessing ? (tx(t, "submissions.processing", "Processing...")) : (tx(t, "submissions.acceptBid", "Accept Bid"))}
                    </button>
                  )}

                  {/* Decline — only if open and pending */}
                  {jobStatus === "open" && bidStatus === "pending" && (
                    <button
                      style={{ ...s.actionBtn, ...s.declineBtn }}
                      onClick={handleDecline}
                      disabled={isProcessing}
                    >
                      <XCircle size={16} />
                      {tx(t, "submissions.decline", "Decline")}
                    </button>
                  )}

                  {/* Delete Job — only if no contract */}
                  {!hasContract && (
                    <button
                      style={{ ...s.actionBtn, ...s.deleteBtn }}
                      onClick={() => setConfirmAction({
                        title: tx(t, "submissions.deleteJobTitle", "Delete Job?"),
                        message: tx(t, "submissions.confirmDeleteJob", "Are you sure you want to delete this job? This action cannot be undone."),
                        onConfirm: handleDeleteJob,
                        color: "#dc2626"
                      })}
                      disabled={isProcessing}
                    >
                      <Trash2 size={16} />
                      {tx(t, "submissions.deleteJob", "Delete Job")}
                    </button>
                  )}

                  {/* Status info for accepted jobs */}
                  {jobStatus === "accepted" && bidStatus === "approved" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', flex: '1 1 100%' }}>
                      <CheckCircle size={18} color="#059669" />
                      <span style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>
                        {tx(t, "submissions.bidAcceptedInfo", "Bid accepted — contract active")}
                      </span>
                    </div>
                  )}

                  {/* Withdraw — for accepted bids */}
                  {jobStatus === "accepted" && bidStatus === "approved" && (
                    <button
                      style={{ ...s.actionBtn, ...s.deleteBtn }}
                      onClick={() => setConfirmAction({
                        title: tx(t, "submissions.withdrawTitle", "Withdraw Acceptance?"),
                        message: tx(t, "submissions.confirmWithdraw", "Are you sure you want to withdraw this accepted bid? The job will reopen for other contractors."),
                        onConfirm: handleWithdrawAcceptance,
                        color: "#dc2626"
                      })}
                      disabled={isProcessing}
                    >
                      <XCircle size={16} />
                      {tx(t, "submissions.withdrawAcceptance", "Withdraw Acceptance")}
                    </button>
                  )}

                  {/* Chat — for accepted */}
                  {jobStatus === "accepted" && (
                    <button
                      style={{ ...s.actionBtn, background: '#0F223D', color: '#fff' }}
                      onClick={() => navigate(`/messages/property_manager`)}
                    >
                      <FileText size={16} />
                      {tx(t, "submissions.goToChat", "Go to Chat")}
                    </button>
                  )}

                  {/* Archive — only if completed */}
                  {jobStatus === "completed" && (
                    <button
                      style={{ ...s.actionBtn, ...s.archiveBtn }}
                      onClick={handleArchive}
                      disabled={isProcessing}
                    >
                      <Archive size={16} />
                      {tx(t, "submissions.archive", "Archive")}
                    </button>
                  )}

                  {/* Confirm Completion — completed + manager NOT yet confirmed */}
                  {jobStatus === "completed" && !managerConfirmed && hasContract && (
                    <button
                      style={{ ...s.actionBtn, ...s.confirmBtn }}
                      onClick={() => { setCompletionNote(""); setShowCompletionNoteModal(true); }}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={16} />
                      {tx(t, "submissions.confirmCompletion", "Confirm Job Completion")}
                    </button>
                  )}
                  {/* Already confirmed */}
                  {jobStatus === "completed" && managerConfirmed && (
                    <>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <CheckCircle size={16} color="#059669" />
                        <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                          {tx(t, "submissions.completionConfirmed", "Job completion confirmed")}
                        </span>
                      </div>
                      {/* Review button */}
                      <button
                        style={{ ...s.actionBtn, background: '#7c3aed', color: '#fff' }}
                        onClick={() => setShowReviewModal(true)}
                      >
                        <Star size={16} />
                        {submission.review
                          ? tx(t, "submissions.viewReview", "View Review")
                          : tx(t, "submissions.leaveReview", "Leave a Review")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════════ RIGHT COLUMN ═══════════ */}
            <div style={s.rightCol}>
              {/* Completion Notes — visible after either party records a note */}
              {submission.contract && (submission.contract.manager_completion_note || submission.contract.contractor_completion_note) && (
                <div style={{ ...s.card, border: '1px solid #fde68a', background: '#fffbeb' }}>
                  <h3 style={s.cardTitle}>
                    <FileText size={18} color="#d97706" />
                    {tx(t, "completionNotes.title", "Completion Notes")}
                  </h3>
                  {submission.contract.manager_completion_note && (
                    <div style={{ paddingBottom: submission.contract.contractor_completion_note ? 10 : 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: 4, letterSpacing: 0.2 }}>
                        {tx(t, "completionNotes.fromYouPM", "From you (property manager)")}
                        {submission.contract.manager_confirmed_at && (
                          <span style={{ fontWeight: 400, color: '#b45309' }}>
                            {' · '}
                            {new Date(submission.contract.manager_confirmed_at).toLocaleDateString(locale)}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#0F223D', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {submission.contract.manager_completion_note}
                      </p>
                    </div>
                  )}
                  {submission.contract.contractor_completion_note && (
                    <div style={{ paddingTop: submission.contract.manager_completion_note ? 10 : 0, borderTop: submission.contract.manager_completion_note ? '1px dashed #fde68a' : 'none' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: 4, letterSpacing: 0.2 }}>
                        {tx(t, "completionNotes.fromContractor", "From the contractor")}
                        {submission.contract.contractor_confirmed_at && (
                          <span style={{ fontWeight: 400, color: '#b45309' }}>
                            {' · '}
                            {new Date(submission.contract.contractor_confirmed_at).toLocaleDateString(locale)}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#0F223D', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {submission.contract.contractor_completion_note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Review from Contractor (received review) */}
              {submission.received_review && (
                <div style={{ ...s.card, border: '1px solid #fde68a', background: '#fffbeb' }}>
                  <h3 style={s.cardTitle}>
                    <Star size={18} fill="#facc15" stroke="#facc15" />
                    {tx(t, "submissions.reviewFromContractor", "Review from Contractor")}
                  </h3>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={20} fill={i <= submission.received_review.rating ? '#facc15' : 'none'} stroke={i <= submission.received_review.rating ? '#facc15' : '#d1d5db'} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#92400e', fontWeight: 600, margin: 0 }}>{submission.received_review.rating} / 5</p>
                  </div>
                  {(submission.received_review.rating_quality || submission.received_review.rating_timeliness) && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, border: '1px solid #fde68a' }}>
                      {[
                        { label: 'Quality', val: submission.received_review.rating_quality },
                        { label: 'Timeliness', val: submission.received_review.rating_timeliness },
                        { label: 'Communication', val: submission.received_review.rating_communication },
                        { label: 'Value', val: submission.received_review.rating_value },
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
                  {submission.received_review.comment && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #fde68a' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{submission.received_review.comment}"</p>
                    </div>
                  )}
                  <p style={{ fontSize: '0.7rem', color: '#b45309', marginTop: 8, textAlign: 'center' }}>
                    {new Date(submission.received_review.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
              )}

              {/* Contractor Information */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <Building2 size={18} color="#00A5A9" />
                  {tx(t, "submissions.contractorInfo", "Contractor Information")}
                </h3>
                <div style={s.contractorHeader}>
                  <div style={s.avatar}>
                    {getInitial(displayName)}
                  </div>
                  <div>
                    <div style={s.contractorName}>{displayName}</div>
                    {ep.company_name && (
                      <div style={s.contractorSub}>
                        <User size={13} /> {user.first_name} {user.last_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div style={s.ratingRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i <= Math.round(ep.average_rating || 0) ? "#facc15" : "none"}
                      color="#facc15"
                    />
                  ))}
                  <span style={s.ratingText}>
                    {ep.average_rating || "0"} ({ep.total_reviews || 0} {tx(t, "submissions.reviews", "reviews")})
                  </span>
                </div>

                <div style={s.infoGrid}>
                  <InfoRow icon={<Shield size={15} />} label={tx(t, "submissions.licenseNumber", "License")} value={ep.license_number || "N/A"} />
                  <InfoRow icon={<Award size={15} />} label={tx(t, "submissions.yearsInBusiness", "Years in business")} value={`${ep.years_in_business || "N/A"} ${tx(t, "submissions.years", "years")}`} />
                  <InfoRow icon={<Mail size={15} />} label={tx(t, "submissions.email", "Email")} value={user.email} />
                  <InfoRow icon={<MapPin size={15} />} label={tx(t, "submissions.location", "Location")} value={property_address} />
                </div>

                {ep.specializations?.length > 0 && (
                  <div style={s.specBlock}>
                    <span style={s.descLabel}>{tx(t, "submissions.specializations", "Specializations")}</span>
                    <div style={s.tagRow}>
                      {ep.specializations.map((spec, i) => (
                        <span key={i} style={s.tag}>{spec}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bid Details */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                  <FileText size={18} color="#00A5A9" />
                  {tx(t, "submissions.bidDetails", "Bid Details")}
                </h3>
                <div style={s.infoGrid}>
                  <InfoRow icon={<DollarSign size={15} />} label={tx(t, "submissions.amount", "Amount")} value={formatCurrency(bid.amount)} />
                  <InfoRow icon={<Calendar size={15} />} label={tx(t, "submissions.submitted", "Submitted")} value={fd(bid.created_at)} />
                  <InfoRow icon={<Clock size={15} />} label={tx(t, "submissions.timeline", "Timeline")} value={`${job.estimated_duration_days || "N/A"} ${tx(t, "submissions.days", "days")}`} />
                </div>
                {bid.message && (
                  <div style={s.descriptionBlock}>
                    <span style={s.descLabel}>{tx(t, "submissions.proposal", "Proposal")}</span>
                    <p style={s.descText}>{bid.message}</p>
                  </div>
                )}
              </div>

              {/* Favorite + View Profile */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{
                    ...s.actionBtn,
                    flex: 1,
                    background: isFavorite ? "#fee2e2" : "#f8fafc",
                    color: isFavorite ? "#dc2626" : "#64748b",
                    border: `1px solid ${isFavorite ? "#fca5a5" : "#e2e8f0"}`,
                  }}
                  onClick={handleToggleFavorite}
                >
                  <Heart size={16} fill={isFavorite ? "#dc2626" : "none"} />
                  {isFavorite
                    ? (tx(t, "submissions.unfavorite", "Unfavorite"))
                    : (tx(t, "submissions.favorite", "Favorite"))}
                </button>
                <button
                  style={{ ...s.actionBtn, flex: 1, background: "#0F223D", color: "#fff" }}
                  onClick={() => setShowProfileModal(true)}
                >
                  <ExternalLink size={16} />
                  {tx(t, "submissions.viewProfile", "View Profile")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Job Completion Modal — note required */}
        {showCompletionNoteModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }}
            onClick={() => { if (!isProcessing) { setShowCompletionNoteModal(false); setCompletionNote(""); } }}
          >
            <div
              style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#00A5A915', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle size={24} color="#00A5A9" />
                </div>
                <h3 style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 700, color: '#0F223D', margin: '0 0 0.5rem' }}>
                  {tx(t, "submissions.confirmCompletionTitle", "Confirm Job Completion")}
                </h3>
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  {tx(t, "submissions.confirmCompletionMessage", "By confirming, you acknowledge that this job has been completed satisfactorily.")}
                </p>

                <label htmlFor="bdp-completion-note" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0F223D', marginBottom: 6 }}>
                  {tx(t, "submissions.completionNoteLabel", "Completion note")}
                  <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
                </label>
                <textarea
                  id="bdp-completion-note"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder={tx(t, "submissions.completionNotePlaceholder", "Briefly describe how the work was completed (required).")}
                  rows={4}
                  disabled={isProcessing}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', color: '#0F223D', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', padding: '0 1.5rem 1.5rem', justifyContent: 'center' }}>
                <button
                  onClick={() => { setShowCompletionNoteModal(false); setCompletionNote(""); }}
                  disabled={isProcessing}
                  style={{ flex: 1, padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {tx(t, "common.cancel", "Cancel")}
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  disabled={isProcessing || !completionNote.trim()}
                  style={{
                    flex: 1, padding: '0.625rem', border: 'none', borderRadius: 8, background: '#00A5A9', color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                    cursor: (isProcessing || !completionNote.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isProcessing || !completionNote.trim()) ? 0.6 : 1,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <CheckCircle size={16} />
                  {isProcessing
                    ? tx(t, "submissions.confirming", "Confirming...")
                    : tx(t, "submissions.confirmCompletionBtn", "Yes, Confirm Completion")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }}
            onClick={() => setConfirmAction(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '1.5rem 1.5rem 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: (confirmAction.color || '#dc2626') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <AlertCircle size={24} color={confirmAction.color || '#dc2626'} />
                </div>
                <h3 style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 700, color: '#0F223D', margin: '0 0 0.5rem' }}>{confirmAction.title}</h3>
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{confirmAction.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', padding: '1.5rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={{ flex: 1, padding: '0.625rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {tx(t, "common.cancel", "Cancel")}
                </button>
                <button
                  onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
                  style={{ flex: 1, padding: '0.625rem', border: 'none', borderRadius: 8, background: confirmAction.color || '#dc2626', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {tx(t, "common.confirm", "Confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (() => {
          const categories = [
            { key: 'quality', label: 'Quality of Work' },
            { key: 'timeliness', label: 'Timeliness' },
            { key: 'communication', label: 'Communication' },
            { key: 'value', label: 'Value for Money' },
          ];
          const allRated = Object.values(reviewRatings).every(v => v > 0);
          const canSubmit = allRated && !isSubmittingReview;
          const rev = submission.review;

          return (
            <div onClick={() => setShowReviewModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1 }}>
                  <div>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>
                      {rev ? 'Your Review' : 'Leave a Review'}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: '0.8125rem' }}>
                      {ep.company_name || `${user?.first_name} ${user?.last_name}`} — {submission.job.title}
                    </p>
                  </div>
                  <button onClick={() => setShowReviewModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {rev ? (
                    /* View existing review */
                    <div>
                      {/* Overall */}
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={28} fill={i <= rev.rating ? '#facc15' : 'none'} stroke={i <= rev.rating ? '#facc15' : '#d1d5db'} />
                          ))}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 700 }}>{rev.rating} out of 5 stars</p>
                      </div>
                      {/* Category ratings */}
                      {(rev.rating_quality || rev.rating_timeliness || rev.rating_communication || rev.rating_value) && (
                        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                          {[
                            { label: 'Quality', val: rev.rating_quality },
                            { label: 'Timeliness', val: rev.rating_timeliness },
                            { label: 'Communication', val: rev.rating_communication },
                            { label: 'Value', val: rev.rating_value },
                          ].filter(c => c.val).map(c => (
                            <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{c.label}</span>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} size={14} fill={i <= c.val ? '#facc15' : 'none'} stroke={i <= c.val ? '#facc15' : '#d1d5db'} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Comment */}
                      {rev.comment && (
                        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
                          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 4px', fontWeight: 600 }}>{tx(t, 'submissions.comment', 'Comment')}</p>
                          <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{rev.comment}"</p>
                        </div>
                      )}
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
                        {tx(t, 'submissions.reviewedOn', 'Reviewed on')} {new Date(rev.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                  ) : (
                    /* Leave new review */
                    <div>
                      {/* Overall rating display */}
                      {overallRating > 0 && (
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} size={24} fill={i <= overallRating ? '#facc15' : 'none'} stroke={i <= overallRating ? '#facc15' : '#d1d5db'} />
                            ))}
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>{overallRating} / 5 overall</p>
                        </div>
                      )}

                      {/* Category ratings */}
                      <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Rate by Category</p>
                        {categories.map(cat => (
                          <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 500 }}>{cat.label}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={20}
                                  fill={i <= reviewRatings[cat.key] ? '#facc15' : 'none'}
                                  stroke={i <= reviewRatings[cat.key] ? '#facc15' : '#d1d5db'}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setReviewRatings(prev => ({ ...prev, [cat.key]: i }))}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment */}
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Share your experience</p>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Tell us about your experience working with this contractor..."
                        rows={4}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0' }}>
                        {reviewComment.length} characters
                      </p>

                      {/* Photo upload */}
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', margin: '20px 0 8px' }}>Add Photos <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional, max 5)</span></p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {reviewImages.map((img, i) => (
                          <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                            <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                            <button onClick={() => setReviewImages(prev => prev.filter((_, j) => j !== i))}
                              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          </div>
                        ))}
                        {reviewImages.length < 5 && (
                          <button onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.onchange = (e) => { const files = Array.from(e.target.files).slice(0, 5 - reviewImages.length); setReviewImages(prev => [...prev, ...files]); }; inp.click(); }}
                            style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed #d1d5db', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: 11 }}>
                            <span style={{ fontSize: 20 }}>+</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0 1.5rem 1.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowReviewModal(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    {rev ? 'Close' : 'Cancel'}
                  </button>
                  {!rev && (
                    <button
                      disabled={!canSubmit}
                      onClick={async () => {
                        setIsSubmittingReview(true);
                        try {
                          const token = JSON.parse(localStorage.getItem("userProfile"))?.token;
                          const fd = new FormData();
                          fd.append("reviewed_user_id", ep.user_id);
                          fd.append("reviewee_id", ep.user_id);
                          fd.append("job_id", submission.job.id);
                          fd.append("rating", overallRating);
                          fd.append("comment", (reviewComment || "").trim());
                          fd.append("rating_quality", reviewRatings.quality);
                          fd.append("rating_timeliness", reviewRatings.timeliness);
                          fd.append("rating_communication", reviewRatings.communication);
                          fd.append("rating_value", reviewRatings.value);
                          reviewImages.forEach(img => fd.append("images", img));
                          const res = await fetch(`${API_BASE}/api/reviews`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          });
                          if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
                          toast.success(t("toasts.reviewSubmitted"));
                          setShowReviewModal(false);
                          setReviewImages([]);
                          fetchData();
                        } catch (err) {
                          toast.error(err.message || t("toasts.failedSubmitReview"));
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      style={{ padding: '0.625rem 1.5rem', border: 'none', borderRadius: 8, background: canSubmit ? '#00A5A9' : '#d1d5db', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Star size={15} />
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Entrepreneur Profile Modal */}
        <EntrepreneurProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={{ ...ep, user_id: ep.user_id, first_name: user?.first_name, last_name: user?.last_name, email: user?.email }}
        />
      </div>
    </div>
  )
}

// ─── reusable info row ──────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{icon} {label}</span>
      <span style={s.infoValue}>{value || "N/A"}</span>
    </div>
  )
}

// ─── styles ─────────────────────────────────────────────────
const s = {
  page: {
    flex: 1,
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "1.5rem 2rem 2rem",
    overflowY: "auto",
  },
  container: {},
  backRow: {
    marginBottom: 20,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0F223D",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all .2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 480px",
    gap: 24,
    alignItems: "start",
  },
  gridMobile: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  // Card
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    border: "1px solid #e8ecf1",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 700,
    color: "#0F223D",
    margin: 0,
    marginBottom: 18,
  },

  // Header
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  jobTitle: {
    fontSize: "clamp(1rem, 3vw, 1.375rem)",
    fontWeight: 800,
    color: "#0F223D",
    margin: 0,
    marginBottom: 10,
    wordBreak: "break-word",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  bidStatusText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
  },
  bidAmountBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  bidAmountLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500,
  },
  bidAmountValue: {
    fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
    fontWeight: 800,
    color: "#00A5A9",
    whiteSpace: "nowrap",
  },

  // Info grid
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0F223D",
    textAlign: "right",
    maxWidth: "60%",
    wordBreak: "break-word",
  },

  // Description
  descriptionBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #f1f5f9",
  },
  descLabel: {
    display: "block",
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.6,
    margin: 0,
  },

  // Map
  mapWrapper: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  // Contractor
  contractorHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00A5A9, #0F223D)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0F223D",
  },
  contractorSub: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
  },

  // Specializations
  specBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #f1f5f9",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    background: "#00A5A918",
    color: "#00A5A9",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #00A5A930",
  },

  // Actions
  actionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .2s",
  },
  acceptBtn: {
    background: "#059669",
    color: "#fff",
  },
  declineBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
  },
  deleteBtn: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  archiveBtn: {
    background: "#f5f3ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
  },
  confirmBtn: {
    background: "#00A5A9",
    color: "#fff",
  },

  // Skeleton
  skeleton: {
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 16,
    width: "100%",
  },

  // Error
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 60,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#334155",
    margin: 0,
  },
}
