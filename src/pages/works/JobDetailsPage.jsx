import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Home,
  DollarSign,
  Star,
  Heart,
  X,
  Calendar,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  FileText,
  Maximize2,
  Trash2,
  Edit3,
  AlertCircle,
  FolderOpen,
  CheckCircle,
  CheckCircle2,
  Tag,
  Timer,
  Receipt,
  Download,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/manager/jobdetailspage.css";
import toast from "react-hot-toast";
import Nav from "../../components/Nav";
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal";
import EditJobModal from "../../components/modal/EditJobModal";
import DeadlineIndicator, { OverdueBanner } from "../../components/DeadlineIndicator";
import {
  createContract,
  getContractByJob,
  deleteJob,
  archiveJob,
  confirmCompletion,
} from "../../utils/contractApi";
import { useLanguage } from "../../contexts/LanguageContext";
import { translateCategory, translateUrgency } from "../../utils/translateEnums";

const stageKeyMap = { not_started: 'notStarted', mobilization: 'mobilization', in_progress: 'inProgress', inspection: 'inspection', completed: 'completed' };
const formatStageName = (name, t) => {
  if (!name) return '';
  const key = stageKeyMap[name];
  if (key && t) { const v = t(`progress.${key}`); return v !== `progress.${key}` ? v : name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Custom marker icon for the map
const createPropertyIcon = () => {
  return L.divIcon({
    className: "jdp-map-marker",
    html: `<div class="jdp-marker-pin">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#0F223D"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });
};

function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Data states
  const [job, setJob] = useState(null);
  const [property, setProperty] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [jobProgress, setJobProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bid states
  const [favorites, setFavorites] = useState([]);
  const [bidders, setBidders] = useState([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBidders, setIsLoadingBidders] = useState(true);

  // Map states
  const [propertyCoords, setPropertyCoords] = useState(null);
  const [isLoadingCoords, setIsLoadingCoords] = useState(true);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete / Archive / Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchivingJob, setIsArchivingJob] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [showConfirmCompletionModal, setShowConfirmCompletionModal] = useState(false);
  const [completionNote, setCompletionNote] = useState("");

  // Contract
  const [contract, setContract] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const getAuthHeaders = () => {
    const userProfile = localStorage.getItem("userProfile");
    if (!userProfile) return null;
    const user = JSON.parse(userProfile);
    return {
      Authorization: `Bearer ${user.token}`,
    };
  };

  // ==================== FETCH JOB DATA ====================
  useEffect(() => {
    const fetchJobData = async () => {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch job details
        const jobRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
          method: "GET",
          headers,
        });

        if (!jobRes.ok) {
          throw new Error(
            jobRes.status === 404
              ? "Job not found"
              : `Failed to fetch job: ${jobRes.status}`
          );
        }

        const jobData = await jobRes.json();
        const jobInfo = jobData.job || jobData;
        setJob(jobInfo);

        // Fetch property details if propertyId exists
        const propId = jobInfo.propertyId || jobInfo.property_id;
        if (propId) {
          try {
            const propRes = await fetch(
              `${API_BASE_URL}/api/properties/${propId}`,
              { method: "GET", headers }
            );
            if (propRes.ok) {
              const propData = await propRes.json();
              const prop = propData.property || propData;
              setProperty(prop);

              if (prop.latitude && prop.longitude) {
                setPropertyCoords({
                  lat: Number(prop.latitude),
                  lng: Number(prop.longitude),
                  name:
                    prop.building_name || prop.name || prop.address,
                });
              }
            }
          } catch (err) {
            console.error("Error fetching property:", err);
          }
        }
        setIsLoadingCoords(false);

        // Fetch contract if exists
        try {
          const contractData = await getContractByJob(jobId);
          if (contractData.has_contract && contractData.contract) {
            setContract(contractData.contract);
          }
        } catch {
          // No contract yet, that's fine
        }

        // Fetch job images
        try {
          const imgRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/images`, { method: 'GET', headers });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            setJobImages(Array.isArray(imgData) ? imgData : (imgData.images || []));
          }
        } catch {}

        // Fetch job progress
        try {
          const progRes = await fetch(`${API_BASE_URL}/api/progress/${jobId}`, { method: 'GET', headers });
          if (progRes.ok) {
            const progData = await progRes.json();
            setJobProgress(progData.stages || []);
          }
        } catch {}
      } catch (err) {
        console.error("Error fetching job data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) fetchJobData();
  }, [jobId]);

  // ==================== FETCH BIDS ====================
  useEffect(() => {
    if (!jobId) {
      setIsLoadingBidders(false);
      return;
    }

    setBidders([]);
    setIsLoadingBidders(true);

    const fetchBids = async () => {
      const headers = getAuthHeaders();
      if (!headers) {
        setIsLoadingBidders(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/bids/job/${jobId}`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bids: ${response.status}`);
        }

        const data = await response.json();

        if (!data.bids || data.bids.length === 0) {
          setIsLoadingBidders(false);
          return;
        }

        const userProfile = JSON.parse(localStorage.getItem("userProfile"));
        data.bids.forEach((bid) => {
          getEntrepreneur(bid, userProfile);
        });

        setIsLoadingBidders(false);
      } catch (error) {
        console.error("Error fetching bids:", error);
        setIsLoadingBidders(false);
      }
    };

    fetchBids();
  }, [jobId]);

  const getEntrepreneur = async (bid, user) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/${bid.entrepreneur_id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!response.ok) throw new Error(`ERROR: ${response.status}`);

      const data = await response.json();

      setBidders((prevBidders) => {
        const exists = prevBidders.some((existing) => existing.id === bid.id);
        if (exists) return prevBidders;

        return [
          ...prevBidders,
          {
            id: bid.id,
            entrepreneur_id: bid.entrepreneur_id,
            user_id: data.profile.user_id,
            company_name: data.profile.company_name,
            address: data.profile.address,
            average_rating: data.profile.average_rating,
            total_reviews: data.profile.total_reviews,
            bid_amount: Number(bid.amount),
            bid_message: bid.message,
            bid_status: bid.status,
            profile: data.profile,
          },
        ];
      });
    } catch (err) {
      console.log(err);
    }
  };

  // ==================== NOTIFICATION ====================
  const showNotification = (message, type = "success") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
  };

  // ==================== FAVORITES ====================
  const toggleFavorite = (company_name) => {
    setFavorites((prev) =>
      prev.includes(company_name)
        ? prev.filter((name) => name !== company_name)
        : [...prev, company_name]
    );
  };

  // ==================== BID HANDLERS ====================
  const handleBidderClick = (bidder) => {
    setSelectedBidder(bidder);
    setShowBidModal(true);
  };

  const handleProfileClick = (e, bidder) => {
    e.stopPropagation();
    setSelectedProfile(bidder.profile);
    setShowProfileModal(true);
  };

  const handleAcceptBid = async () => {
    if (!selectedBidder) return;
    setIsProcessing(true);

    const headers = getAuthHeaders();
    const userProfile = JSON.parse(localStorage.getItem("userProfile"));

    try {
      // Step 1: Check if contract exists or create one
      let currentContract = null;
      try {
        const existingContract = await getContractByJob(jobId);
        if (existingContract.has_contract && existingContract.contract) {
          currentContract = existingContract.contract;
        }
      } catch {
        // No existing contract
      }

      if (!currentContract) {
        const contractResult = await createContract(selectedBidder.id);
        currentContract = contractResult.contract;
        setContract(currentContract);
      }

      // Step 2: Approve the bid
      const approveResponse = await fetch(
        `${API_BASE_URL}/api/bids/${selectedBidder.id}/approve`,
        { method: "PATCH", headers }
      );

      if (!approveResponse.ok) {
        const data = await approveResponse.json();
        throw new Error(data.message || "Failed to approve bid");
      }

      // Step 3: Update job status to 'accepted'
      await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "accepted",
          entrepreneur_id: `${selectedBidder.user_id}`,
        }),
      });

      // Step 4: Update local state
      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "approved" }
            : bidder.bid_status === "pending"
            ? { ...bidder, bid_status: "declined" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "approved" }));
      setJob((prev) => (prev ? { ...prev, status: "accepted" } : prev));
      setShowBidModal(false);

      showNotification(
        t("repairDetails.bidApprovedPaymentExternal") ||
          "Bid approved! A contract has been created with the contractor.",
        "success"
      );
    } catch (error) {
      console.error("Error accepting bid:", error);
      showNotification(
        error.message ||
          t("repairDetails.failedToAcceptBid") ||
          "Failed to accept bid",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineBid = async () => {
    if (!selectedBidder) return;
    setIsProcessing(true);

    try {
      const headers = getAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/api/bids/${selectedBidder.id}/decline`,
        { method: "PATCH", headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to decline bid");
      }

      setBidders((prevBidders) =>
        prevBidders.map((bidder) =>
          bidder.id === selectedBidder.id
            ? { ...bidder, bid_status: "declined" }
            : bidder
        )
      );

      setSelectedBidder((prev) => ({ ...prev, bid_status: "declined" }));
      showNotification(data.message || "Bid declined", "info");
      setShowBidModal(false);
    } catch (error) {
      console.error("Error declining bid:", error);
      showNotification(error.message || "Failed to decline bid.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== DELETE JOB ====================
  const handleDeleteJob = async () => {
    if (!jobId) return;
    setIsDeletingJob(true);
    try {
      await deleteJob(jobId);
      showNotification(
        t("submissions.jobDeletedSuccess") || "Job deleted successfully.",
        "success"
      );
      navigate(-1);
    } catch (error) {
      showNotification(error.message || "Failed to delete job.", "error");
    } finally {
      setIsDeletingJob(false);
      setShowDeleteConfirm(false);
    }
  };

  // ==================== ARCHIVE JOB ====================
  const handleArchiveJob = async () => {
    if (!jobId) return;
    setIsArchivingJob(true);
    try {
      await archiveJob(jobId);
      showNotification(
        t("submissions.jobArchivedSuccess") || "Job archived successfully.",
        "success"
      );
      navigate(-1);
    } catch (error) {
      showNotification(error.message || "Failed to archive job.", "error");
    } finally {
      setIsArchivingJob(false);
      setShowArchiveConfirm(false);
    }
  };

  // ==================== CONFIRM COMPLETION ====================
  // Routes through the contract endpoint (which records the mandatory note,
  // sets manager_completion_confirmed, and triggers mutual confirmation +
  // review invitations). Previously this PUT'd jobs.status directly, which
  // bypassed the contract entirely.
  const handleConfirmCompletion = async () => {
    if (!contract?.id) {
      showNotification(
        t("submissions.noContractFound") || "No contract found for this job.",
        "error"
      );
      return;
    }
    if (!completionNote.trim()) {
      showNotification(
        t("submissions.completionNoteRequired") || "Please add a note before confirming.",
        "error"
      );
      return;
    }
    setIsConfirmingCompletion(true);
    try {
      await confirmCompletion(contract.id, completionNote.trim());
      setJob((prev) => (prev ? { ...prev, status: "completed" } : prev));
      setContract((prev) =>
        prev
          ? {
              ...prev,
              manager_completion_confirmed: true,
              contractor_completion_confirmed: true,
              manager_completion_note: completionNote.trim(),
              mutual_confirmation_completed_at: new Date().toISOString(),
            }
          : prev
      );
      showNotification(
        t("submissions.completionConfirmedSuccess") || "Work completion confirmed successfully",
        "success"
      );
      setShowConfirmCompletionModal(false);
      setCompletionNote("");
    } catch (error) {
      showNotification(
        error.message || (t("submissions.completionFailed") || "Failed to confirm completion."),
        "error"
      );
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  // ==================== HELPERS ====================
  const getDaysSincePosted = () => {
    if (!job?.created_at) return 0;
    const posted = new Date(job.created_at);
    const now = new Date();
    return Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  };

  const getHighestBid = () => {
    if (bidders.length === 0) return null;
    return Math.max(...bidders.map((b) => b.bid_amount));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "open":
      case "pending":
        return "open";
      case "accepted":
      case "ongoing":
        return "ongoing";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      default:
        return "open";
    }
  };

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <>
        <Nav />
        <div className="main-container">
          <div className="jdp-wrapper">
            <div className="jdp-skeleton-page">
              <div className="jdp-skeleton-header">
                <div className="jdp-skeleton-bar" style={{ width: "120px", height: "36px" }} />
                <div className="jdp-skeleton-bar" style={{ width: "300px", height: "32px" }} />
                <div className="jdp-skeleton-bar" style={{ width: "80px", height: "28px" }} />
              </div>
              <div className="jdp-skeleton-grid">
                <div className="jdp-skeleton-card">
                  <div className="jdp-skeleton-bar" style={{ width: "100%", height: "16px" }} />
                  <div className="jdp-skeleton-bar" style={{ width: "80%", height: "16px" }} />
                  <div className="jdp-skeleton-bar" style={{ width: "60%", height: "16px" }} />
                  <div className="jdp-skeleton-bar" style={{ width: "90%", height: "16px" }} />
                  <div className="jdp-skeleton-bar" style={{ width: "70%", height: "16px" }} />
                </div>
                <div className="jdp-skeleton-card" style={{ minHeight: "280px" }} />
              </div>
              <div className="jdp-skeleton-card" style={{ height: "200px" }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ==================== ERROR STATE ====================
  if (error || !job) {
    return (
      <>
        <Nav />
        <div className="main-container">
          <div className="jdp-wrapper">
            <div className="jdp-error">
              <AlertCircle size={48} />
              <h2>{error || "Job not found"}</h2>
              <p>The job you are looking for may have been removed or is not accessible.</p>
              <button className="jdp-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <>
      <Nav />
      <div className="main-container">
        <div className="jdp-wrapper">
          {/* Overdue banner — visual signal that the job passed its due_date.
              Sits above the page header so PMs can't miss it. */}
          <OverdueBanner dueDate={job.due_date || job.dueDate} />

          {/* ===== PAGE HEADER ===== */}
          <div className="jdp-page-header">
            <button className="jdp-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              {t("common.back") || "Back"}
            </button>
            <div className="jdp-header-center">
              <h1 className="jdp-title">
                {job.apartment || job.title || job.description?.substring(0, 50)}
              </h1>
              <div className="jdp-header-meta">
                <span className="jdp-header-property">
                  {(job.property === "Residential" || property?.property_type === "Residential")
                    ? <Home size={14} />
                    : <Building2 size={14} />}
                  {job.property || property?.property_type || "Property"}
                </span>
                <span className="jdp-header-divider">&#8226;</span>
                <span>{job.category || t("repairDetails.general") || "General"}</span>
              </div>
            </div>
            {/* All actions consolidated into the header pill. Each button
                still self-gates on job.status/contract like it did before —
                only relevant ones render. Icon labels stay for clarity. */}
            <div className="jdp-header-actions">
              {contract?.invoice_file_url && (
                <a
                  className="jdp-header-invoice-btn"
                  href={contract.invoice_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={contract.invoice_file_name || (t("invoice.download") || "Download invoice")}
                >
                  <Download size={14} />
                  <span>{t("invoice.download") || "Download invoice"}</span>
                </a>
              )}

              {(job.status === "Open" || job.status === "open") && (
                <button
                  className="jdp-header-action-btn jdp-header-action-edit"
                  onClick={() => setShowEditModal(true)}
                  disabled={isProcessing}
                >
                  <Edit3 size={14} />
                  <span>{t("editJobModal.editJobBtn") || "Edit Job"}</span>
                </button>
              )}

              {(job.status === "Open" || job.status === "open") && (
                <button
                  className="jdp-header-action-btn jdp-header-action-delete"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isProcessing}
                >
                  <Trash2 size={14} />
                  <span>{t("submissions.deleteJobBtn") || "Delete Job"}</span>
                </button>
              )}

              {job.status === "completed" && contract && !contract.manager_completion_confirmed && (
                <button
                  className="jdp-header-action-btn jdp-header-action-confirm"
                  onClick={() => { setCompletionNote(""); setShowConfirmCompletionModal(true); }}
                  disabled={isConfirmingCompletion}
                >
                  <CheckCircle2 size={14} />
                  <span>{isConfirmingCompletion
                    ? (t("submissions.confirming") || "Confirming...")
                    : (t("submissions.confirmCompletion") || "Confirm Completion")}</span>
                </button>
              )}

              {job.status === "completed" && contract?.mutual_confirmation_completed_at && (
                <button
                  className="jdp-header-action-btn jdp-header-action-archive"
                  onClick={() => setShowArchiveConfirm(true)}
                  disabled={isProcessing}
                >
                  <FolderOpen size={14} />
                  <span>{t("submissions.archiveJobBtn") || "Archive Job"}</span>
                </button>
              )}
            </div>

            <span className={`jdp-status-badge ${getStatusClass(job.status)}`}>
              {job.status || t("repairDetails.open") || "Open"}
            </span>
          </div>

          {/* ===== QUICK STATS ===== */}
          <div className="jdp-quick-stats">
            <div className="jdp-stat">
              <Clock size={14} />
              <span>
                {getDaysSincePosted()}{" "}
                {t("repairDetails.daysAgo") || "days ago"}
              </span>
            </div>
            <div className="jdp-stat">
              <Users size={14} />
              <span>
                {bidders.length}{" "}
                {bidders.length === 1
                  ? t("repairDetails.bid") || "bid"
                  : t("repairDetails.bids") || "bids"}
              </span>
            </div>
            {getHighestBid() && (
              <div className="jdp-stat highlight">
                <DollarSign size={14} />
                <span>
                  {t("repairDetails.highestBid") || "Highest"} $
                  {getHighestBid().toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* ===== MAIN LAYOUT: Job Info + Bids Panel ===== */}
          <div className="jdp-main-layout">

          {/* Left Column: Job Info + Map */}
          <div className="jdp-left-panel">
          <div className="jdp-content-grid">
            <div className="jdp-card jdp-info-card">
              <div className="jdp-card-header jdp-card-head-row">
                <div className="jdp-card-head-title">
                  <FileText size={16} />
                  <h3>{t("repairDetails.description") || "Job Details"}</h3>
                </div>
                {/* Urgency now shows as a compact chip inline with the card
                    title (matches the contractor's page). Removed from the
                    info-row list below to avoid duplication. */}
                {job.urgency && (
                  <span className={`jdp-urgency-chip jdp-urgency-${(job.urgency || "").toLowerCase().includes("urgent") || (job.urgency || "").toLowerCase() === "high" ? "urgent" : "planned"}`}>
                    {(job.urgency || "").toLowerCase() === "medium" ? "MED" : String(job.urgency).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="jdp-card-body">
                <p className="jdp-description">
                  {job.description || t("repairDetails.noDescription") || "No description provided."}
                </p>

                <div className="jdp-info-list">
                  {job.category && (
                    <div className="jdp-info-row">
                      <Tag size={14} />
                      <span className="jdp-info-label">
                        {t("repairDetails.category") || "Category"}
                      </span>
                      <span className="jdp-info-value">
                        <span className="jdp-category-chip">
                          <Tag size={12} />
                          {translateCategory(t, job.category)}
                        </span>
                      </span>
                    </div>
                  )}

                  {(job.due_date || job.dueDate) && (
                    <div className="jdp-info-row">
                      <Calendar size={14} />
                      <span className="jdp-info-label">
                        {t("repairDetails.dueDate") || "Due Date"}
                      </span>
                      <span className="jdp-info-value" style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {new Date(job.due_date || job.dueDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                        <DeadlineIndicator dueDate={job.due_date || job.dueDate} compact />
                      </span>
                    </div>
                  )}

                  {job.duration && (
                    <div className="jdp-info-row">
                      <Timer size={14} />
                      <span className="jdp-info-label">
                        {t("repairDetails.duration") || "Duration"}
                      </span>
                      <span className="jdp-info-value">{job.duration}</span>
                    </div>
                  )}

                  <div className="jdp-info-row">
                    <DollarSign size={14} />
                    <span className="jdp-info-label">
                      {t("repairDetails.budget") || "Budget"}
                    </span>
                    <span className="jdp-info-value">
                      {job.budget_min && job.budget_max
                        ? `$${Number(job.budget_min).toLocaleString()} - $${Number(job.budget_max).toLocaleString()}`
                        : job.budget || "N/A"}
                    </span>
                  </div>

                  <div className="jdp-info-row">
                    <Building2 size={14} />
                    <span className="jdp-info-label">
                      {t("repairDetails.type") || "Type"}
                    </span>
                    <span className="jdp-info-value">
                      {job.building_type || property?.building_type || "N/A"}
                    </span>
                  </div>

                  <div className="jdp-info-row">
                    <Calendar size={14} />
                    <span className="jdp-info-label">
                      {t("repairDetails.posted") || "Posted"}
                    </span>
                    <span className="jdp-info-value">
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>

                  <div className="jdp-info-row">
                    <MapPin size={14} />
                    <span className="jdp-info-label">
                      {t("repairDetails.location") || "Location"}
                    </span>
                    <span className="jdp-info-value">
                      {job.address || property?.address || job.property || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Images */}
            {jobImages.length > 0 && (
              <div className="jdp-card" style={{ gridColumn: '1 / -1' }}>
                <div className="jdp-card-header">
                  <FileText size={16} />
                  <h3>Photos</h3>
                </div>
                <div className="jdp-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {jobImages.map((img, i) => (
                      <img key={i} src={img.image_url || img.url || img} alt="" onClick={() => setViewingImage(img.image_url || img.url || img)} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.02)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Right: Map + Property */}
            <div className="jdp-right-column">
              {/* Map Card */}
              <div className="jdp-card jdp-map-card">
                <div className="jdp-map-container">
                  {isLoadingCoords ? (
                    <div className="jdp-map-loading">
                      <div className="jdp-spinner" />
                    </div>
                  ) : propertyCoords ? (
                    <>
                      <MapContainer
                        center={[propertyCoords.lat, propertyCoords.lng]}
                        zoom={16}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={true}
                        scrollWheelZoom={true}
                        dragging={true}
                        doubleClickZoom={true}
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                          subdomains="abcd"
                        />
                        <Marker
                          position={[propertyCoords.lat, propertyCoords.lng]}
                          icon={createPropertyIcon()}
                        >
                          <Popup>
                            <div className="jdp-map-popup">
                              <strong>{propertyCoords.name}</strong>
                              <p>{job.address || property?.address || ""}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                      <button
                        className="jdp-map-fullscreen-btn"
                        onClick={() => setShowFullscreenMap(true)}
                        title={t("repairDetails.viewFullscreen") || "View fullscreen"}
                      >
                        <Maximize2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="jdp-map-fallback">
                      <MapPin size={32} />
                      <p>
                        {t("repairDetails.locationNotAvailable") ||
                          "Location not available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Info Card */}
              {property && (
                <div className="jdp-card jdp-property-card">
                  <div className="jdp-card-header">
                    <Building2 size={16} />
                    <h3>{t("repairDetails.property") || "Property"}</h3>
                  </div>
                  <div className="jdp-card-body">
                    <div className="jdp-property-name">
                      {property.building_name || property.name || "Unnamed Property"}
                    </div>
                    <div className="jdp-property-detail">
                      <MapPin size={12} />
                      <span>{property.address || "N/A"}</span>
                    </div>
                    {(property.building_type || property.property_type) && (
                      <div className="jdp-property-detail">
                        <Home size={12} />
                        <span>
                          {property.building_type || property.property_type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contractor Invoice — visible once submitted, before manager confirms completion */}
          {contract && contract.invoice_submitted_at && (
            <div className="jdp-invoice-card">
              <div className="jdp-invoice-header">
                <Receipt size={16} />
                <h3>{t("invoice.cardTitle") || "Contractor's Invoice"}</h3>
                <span className="jdp-invoice-when">
                  {new Date(contract.invoice_submitted_at).toLocaleDateString()}
                </span>
              </div>
              <div className="jdp-invoice-rows">
                <div className="jdp-invoice-row">
                  <span>{t("invoice.subtotal") || "Subtotal"}</span>
                  <strong>${Number(contract.invoice_subtotal || 0).toFixed(2)}</strong>
                </div>
                <div className="jdp-invoice-row">
                  <span>GST (5%)</span>
                  <strong>${Number(contract.invoice_gst || 0).toFixed(2)}</strong>
                </div>
                <div className="jdp-invoice-row">
                  <span>QST (9.975%)</span>
                  <strong>${Number(contract.invoice_qst || 0).toFixed(2)}</strong>
                </div>
                <div className="jdp-invoice-row jdp-invoice-total">
                  <span>{t("invoice.total") || "Total"}</span>
                  <strong>${Number(contract.invoice_total || 0).toFixed(2)}</strong>
                </div>
              </div>
              {contract.invoice_notes && (
                <p className="jdp-invoice-notes">{contract.invoice_notes}</p>
              )}
              {contract.invoice_file_url && (
                <a
                  className="jdp-invoice-download"
                  href={contract.invoice_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={14} />
                  {contract.invoice_file_name || (t("invoice.download") || "Download invoice")}
                </a>
              )}
            </div>
          )}

          {/* Completion Notes — visible after either party records a note */}
          {contract && (contract.manager_completion_note || contract.contractor_completion_note) && (
            <div className="jdp-notes-card">
              <div className="jdp-notes-header">
                <FileText size={16} />
                <h3>{t("completionNotes.title") || "Completion Notes"}</h3>
              </div>
              {contract.manager_completion_note && (
                <div className="jdp-notes-entry">
                  <div className="jdp-notes-author">
                    {t("completionNotes.fromManager") || "From you (property manager)"}
                    {contract.manager_confirmed_at && (
                      <span className="jdp-notes-when">
                        · {new Date(contract.manager_confirmed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="jdp-notes-body">{contract.manager_completion_note}</p>
                </div>
              )}
              {contract.contractor_completion_note && (
                <div className="jdp-notes-entry">
                  <div className="jdp-notes-author">
                    {t("completionNotes.fromContractor") || "From the contractor"}
                    {contract.contractor_confirmed_at && (
                      <span className="jdp-notes-when">
                        · {new Date(contract.contractor_confirmed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="jdp-notes-body">{contract.contractor_completion_note}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions moved to the header pill. Kept this closing div to
              preserve the left-panel container structure. */}
          </div>

          {/* Right Panel: Progress + Bids */}
          <div className="jdp-bids-panel">

          {/* Job Progress Stepper */}
          {jobProgress.length > 0 && (
            <div className="jdp-card" style={{ marginBottom: 16 }}>
              <div className="jdp-card-header">
                <CheckCircle size={16} />
                <h3>{t('progress.title') !== 'progress.title' ? t('progress.title') : 'Job Progress'}</h3>
              </div>
              <div className="jdp-card-body">
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{ position: 'absolute', left: 11, top: 4, bottom: 4, width: 2, background: '#e5e7eb', zIndex: 0 }} />
                  {jobProgress.map((stage, i) => {
                    const isDone = stage.completed || stage.status === 'completed';
                    const isActive = stage.status === 'in_progress';
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
                            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: isDone ? '#059669' : isActive ? '#00A5A9' : '#374151' }}>
                              {formatStageName(stage.stage || stage.title, t) || `Stage ${i + 1}`}
                            </span>
                            <span style={{
                              fontSize: '0.625rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              background: isDone ? '#d1fae5' : isActive ? '#ccfbf1' : '#f3f4f6',
                              color: isDone ? '#047857' : isActive ? '#0d9488' : '#9ca3af',
                              textTransform: 'uppercase',
                            }}>
                              {isDone ? (t('progress.statusCompleted') !== 'progress.statusCompleted' ? t('progress.statusCompleted') : 'Done') : isActive ? (t('progress.statusInProgress') !== 'progress.statusInProgress' ? t('progress.statusInProgress') : 'Active') : (t('progress.statusPending') !== 'progress.statusPending' ? t('progress.statusPending') : 'Pending')}
                            </span>
                          </div>
                          {stage.notes && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0', lineHeight: 1.4 }}>{stage.notes}</p>}
                          {stage.photos && stage.photos.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                              {stage.photos.map((p, pi) => (
                                <img key={pi} src={p.image_url || p.url || p} alt="" onClick={() => setViewingImage(p.image_url || p.url || p)}
                                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 5, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="jdp-card jdp-bids-section">
            <div className="jdp-bids-header">
              <h3>
                <FileText size={16} />
                {t("repairDetails.reviewBids") || "Review Bids"}
                {bidders.length > 0 && (
                  <span className="jdp-bids-badge">{bidders.length}</span>
                )}
              </h3>
            </div>

            <div className="jdp-bids-list">
              {isLoadingBidders ? (
                <div className="jdp-bids-empty">
                  <div className="jdp-spinner" />
                  <p>{t("repairDetails.loadingBids") || "Loading bids..."}</p>
                </div>
              ) : bidders.length === 0 ? (
                <div className="jdp-bids-empty">
                  <Users size={36} />
                  <p>{t("repairDetails.noBidsYet") || "No bids yet"}</p>
                </div>
              ) : (
                <div className="jdp-bids-grid">
                  {[...bidders]
                    .sort((a, b) => b.bid_amount - a.bid_amount)
                    .map((bidder, index) => (
                      <div
                        key={bidder.id}
                        className={`jdp-bid-card ${index === 0 ? "jdp-bid-top" : ""}`}
                      >
                        {/* Top row: avatar + name + amount */}
                        <div
                          className="jdp-bid-main"
                          onClick={() => handleBidderClick(bidder)}
                        >
                          <div className="jdp-bid-avatar">
                            {bidder.company_name?.charAt(0) || "C"}
                          </div>
                          <div className="jdp-bid-info">
                            <div className="jdp-bid-name">
                              {bidder.company_name}
                            </div>
                            <div className="jdp-bid-rating">
                              <Star size={11} fill="#facc15" stroke="#facc15" />
                              <span>
                                {Number(bidder.average_rating || 0).toFixed(1)}
                              </span>
                              <span className="jdp-bid-reviews">
                                ({bidder.total_reviews || 0})
                              </span>
                            </div>
                          </div>
                          <div className="jdp-bid-right">
                            <div className="jdp-bid-amount">
                              ${bidder.bid_amount.toLocaleString()}
                            </div>
                            <span
                              className={`jdp-bid-status ${bidder.bid_status || "pending"}`}
                            >
                              {bidder.bid_status ||
                                t("repairDetails.pending") ||
                                "pending"}
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: location + actions */}
                        <div className="jdp-bid-bottom">
                          <div className="jdp-bid-location">
                            <MapPin size={11} />
                            <span>
                              {bidder.address?.split(",")[0] || "N/A"}
                            </span>
                          </div>
                          <div className="jdp-bid-actions">
                            <button
                              className="jdp-bid-fav"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(bidder.company_name);
                              }}
                              title={t("repairDetails.favorite") || "Favorite"}
                            >
                              <Heart
                                size={14}
                                fill={
                                  favorites.includes(bidder.company_name)
                                    ? "#ef4444"
                                    : "none"
                                }
                                stroke={
                                  favorites.includes(bidder.company_name)
                                    ? "#ef4444"
                                    : "#94a3b8"
                                }
                              />
                            </button>
                            <button
                              className="jdp-bid-profile-btn"
                              onClick={(e) => handleProfileClick(e, bidder)}
                              title="View Profile"
                            >
                              <Users size={14} />
                            </button>
                            <button
                              className="jdp-bid-view-btn"
                              onClick={() => handleBidderClick(bidder)}
                            >
                              {t("repairDetails.viewBid") || "View"}{" "}
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          </div>
          </div>

        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="jdp-confirm-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="jdp-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jdp-confirm-icon" style={{ color: "#dc2626" }}>
              <AlertCircle size={32} />
            </div>
            <h3>
              {t("submissions.deleteJobTitle") || "Delete Job?"}
            </h3>
            <p>
              {t("submissions.deleteJobMessage") ||
                "This will permanently delete this job and notify all bidders. This action cannot be undone."}
            </p>
            <div className="jdp-confirm-actions">
              <button
                className="jdp-confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingJob}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                className="jdp-confirm-submit"
                onClick={handleDeleteJob}
                disabled={isDeletingJob}
              >
                {isDeletingJob ? (
                  <>{t("submissions.deleting") || "Deleting..."}</>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {t("submissions.deleteJobBtn") || "Delete Job"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div
          className="jdp-confirm-overlay"
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div
            className="jdp-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jdp-confirm-icon" style={{ color: "#6366f1" }}>
              <FolderOpen size={32} />
            </div>
            <h3>
              {t("submissions.archiveJobTitle") || "Archive Job?"}
            </h3>
            <p>
              {t("submissions.archiveJobMessage") ||
                "This will archive the completed job and remove it from your active dashboard. You can restore it later if needed."}
            </p>
            <div className="jdp-confirm-actions">
              <button
                className="jdp-confirm-cancel"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={isArchivingJob}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                className="jdp-confirm-submit"
                style={{ background: "#6366f1" }}
                onClick={handleArchiveJob}
                disabled={isArchivingJob}
              >
                {isArchivingJob ? (
                  <>{t("submissions.archiving") || "Archiving..."}</>
                ) : (
                  <>
                    <FolderOpen size={16} />
                    {t("submissions.archiveJobBtn") || "Archive Job"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bid Details Slide-in Drawer */}
      {showBidModal && selectedBidder && (
        <div
          className="jdp-drawer-overlay"
          onClick={() => setShowBidModal(false)}
        >
          <div
            className="jdp-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jdp-submodal-header">
              <div className="jdp-submodal-title">
                <div className="jdp-submodal-avatar">
                  {selectedBidder.company_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3>{selectedBidder.company_name}</h3>
                  <div className="jdp-submodal-rating">
                    <Star size={12} fill="#facc15" stroke="#facc15" />
                    <span>
                      {Number(selectedBidder.average_rating || 0).toFixed(1)} (
                      {selectedBidder.total_reviews || 0}{" "}
                      {t("repairDetails.reviews") || "reviews"})
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="jdp-submodal-close"
                onClick={() => setShowBidModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="jdp-submodal-body">
              {/* Bid Amount */}
              <div className="jdp-submodal-amount-box">
                <span className="jdp-amount-label">
                  {t("repairDetails.bidAmount") || "Bid Amount"}
                </span>
                <span className="jdp-amount-value">
                  ${selectedBidder.bid_amount.toLocaleString()}
                </span>
                <span
                  className={`jdp-amount-status ${selectedBidder.bid_status || "pending"}`}
                >
                  {selectedBidder.bid_status ||
                    t("repairDetails.pending") ||
                    "pending"}
                </span>
              </div>

              {/* Message */}
              {selectedBidder.bid_message && (
                <div className="jdp-submodal-section">
                  <label>{t("repairDetails.message") || "Message"}</label>
                  <p className="jdp-submodal-message">
                    {selectedBidder.bid_message}
                  </p>
                </div>
              )}

              {/* Company Info */}
              <div className="jdp-submodal-section">
                <label>
                  {t("repairDetails.companyDetails") || "Company Details"}
                </label>
                <div className="jdp-submodal-grid">
                  <div>
                    <span>{t("repairDetails.license") || "License"}</span>
                    <strong>
                      {selectedBidder.profile.license_number || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span>{t("repairDetails.employees") || "Employees"}</span>
                    <strong>
                      {selectedBidder.profile.num_employees || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span>{t("repairDetails.years") || "Years"}</span>
                    <strong>
                      {selectedBidder.profile.years_in_business || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span>{t("repairDetails.email") || "Email"}</span>
                    <strong>{selectedBidder.profile.email}</strong>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {selectedBidder.profile.specializations?.length > 0 && (
                <div className="jdp-submodal-section">
                  <label>
                    {t("repairDetails.specializations") || "Specializations"}
                  </label>
                  <div className="jdp-submodal-tags">
                    {selectedBidder.profile.specializations.map((s, i) => (
                      <span key={i} className="jdp-submodal-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="jdp-submodal-footer">
              {selectedBidder.bid_status !== "approved" &&
              selectedBidder.bid_status !== "declined" ? (
                <>
                  <button
                    className="jdp-submodal-btn secondary"
                    onClick={handleDeclineBid}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? "..."
                      : t("repairDetails.decline") || "Decline"}
                  </button>
                  <button
                    className="jdp-submodal-btn primary"
                    onClick={handleAcceptBid}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? "..."
                      : t("repairDetails.acceptBid") || "Accept Bid"}
                  </button>
                </>
              ) : (
                <div className="jdp-submodal-decided">
                  {t("repairDetails.bidDecided") || "This bid has been"}{" "}
                  <strong>{selectedBidder.bid_status}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entrepreneur Profile Modal */}
      <EntrepreneurProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
      />

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={showEditModal}
        job={job}
        onClose={() => setShowEditModal(false)}
        onSaved={(updated) => setJob((prev) => ({ ...prev, ...updated }))}
      />

      {/* Confirm Completion Modal */}
      {showConfirmCompletionModal && (
        <div
          onClick={() => { if (!isConfirmingCompletion) { setShowConfirmCompletionModal(false); setCompletionNote(""); } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <CheckCircle2 size={28} style={{ color: '#00A5A9' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0F223D' }}>
                {t('submissions.confirmCompletionTitle') || 'Confirm Job Completion'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5, marginBottom: '1rem' }}>
              {t('submissions.confirmCompletionMessage') || 'By confirming, you acknowledge that this job has been completed satisfactorily.'}
            </p>

            <label htmlFor="jdp-completion-note" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0F223D', marginBottom: 6 }}>
              {t('submissions.completionNoteLabel') || 'Completion note'}
              <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
            </label>
            <textarea
              id="jdp-completion-note"
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder={t('submissions.completionNotePlaceholder') || 'Briefly describe how the work was completed (required).'}
              rows={4}
              disabled={isConfirmingCompletion}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', color: '#0F223D', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setShowConfirmCompletionModal(false); setCompletionNote(""); }}
                disabled={isConfirmingCompletion}
                style={{ padding: '0.625rem 1rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={isConfirmingCompletion || !completionNote.trim()}
                style={{
                  padding: '0.625rem 1rem',
                  background: '#00A5A9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isConfirmingCompletion || !completionNote.trim() ? 'not-allowed' : 'pointer',
                  opacity: isConfirmingCompletion || !completionNote.trim() ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} />
                {isConfirmingCompletion
                  ? (t('submissions.confirming') || 'Confirming...')
                  : (t('submissions.confirmCompletionBtn') || 'Yes, Confirm Completion')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {viewingImage && (
        <div onClick={() => setViewingImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, cursor: 'zoom-out', padding: '2rem' }}>
          <img src={viewingImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setViewingImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {showFullscreenMap && propertyCoords && (
        <div
          className="jdp-map-fullscreen-overlay"
          onClick={() => setShowFullscreenMap(false)}
        >
          <div
            className="jdp-map-fullscreen-header"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              <MapPin size={18} />
              {propertyCoords.name ||
                job.address ||
                t("repairDetails.propertyLocation") ||
                "Property Location"}
            </h3>
            <button
              className="jdp-map-fullscreen-close"
              onClick={() => setShowFullscreenMap(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="jdp-map-fullscreen-container"
            onClick={(e) => e.stopPropagation()}
          >
            <MapContainer
              center={[propertyCoords.lat, propertyCoords.lng]}
              zoom={17}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
              dragging={true}
              doubleClickZoom={true}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />
              <Marker
                position={[propertyCoords.lat, propertyCoords.lng]}
                icon={createPropertyIcon()}
              >
                <Popup>
                  <div className="jdp-map-popup">
                    <strong>{propertyCoords.name}</strong>
                    <p>{job.address || property?.address || ""}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </>
  );
}

export default JobDetailsPage;
