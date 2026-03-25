import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/entrepreneur/entrepreneurjobs.css"
import "../../styles/manager/submissions.css"
import Nav from "../../components/Nav"
import { useLanguage } from "../../contexts/LanguageContext"
import { useSocket } from "../../contexts/SocketContext"
import {
  Search,
  X,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Building2,
  PlayCircle,
  CheckCircle,
  FolderOpen,
  MessageSquare,
  MapPin,
  Hammer,
  Maximize2,
  Minimize2,
  ChevronRight,
  User,
  AlertCircle,
  BarChart3,
} from "lucide-react"
import toast from "react-hot-toast"
import JobProgressTracker from "../../components/JobProgressTracker"
import PropertyManagerProfileModal from "../../components/modal/PropertyManagerProfileModal"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

function EntrepreneurJobs() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState("accepted")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedJob, setSelectedJob] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [userProfile, setUserProfile] = useState({})
  const [openReviewModal, setOpenReviewModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [manager, setManager] = useState({})
  const [reviewed, setReviewed] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsJob, setDetailsJob] = useState(null)
  const [progressJob, setProgressJob] = useState(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Property Manager Profile Modal states
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [selectedManagerProfile, setSelectedManagerProfile] = useState(null)
  const [isLoadingManagerProfile, setIsLoadingManagerProfile] = useState(false)

  const [reviewForm, setReviewForm] = useState({ comment: "" })
  const [categoryRatings, setCategoryRatings] = useState({ quality: 0, timeliness: 0, communication: 0, value: 0 })
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [reviewImageTypes, setReviewImageTypes] = useState([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Confirm completion + review invitation
  const [showReviewInvitation, setShowReviewInvitation] = useState(false)
  const [reviewInvitationJob, setReviewInvitationJob] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  // Listen for review invitation from PM confirming completion
  useEffect(() => {
    if (!socket) return
    const handleReviewInvitation = (data) => {
      setReviewInvitationJob({
        id: data.jobId,
        title: data.jobTitle,
        contract: { id: data.contractId }
      })
      setShowReviewInvitation(true)
      fetchJobs() // refresh job list
    }
    socket.on('review_invitation', handleReviewInvitation)
    return () => socket.off('review_invitation', handleReviewInvitation)
  }, [socket])

  const fetchJobs = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const storedProfile = localStorage.getItem("userProfile")

    if (storedProfile) {
      const user = JSON.parse(storedProfile)
      setUserProfile(user)

      const jobsResponse = await fetch(`${API_BASE_URL}/api/jobs/entrepreneur/${user.entrepProfile.entrepProfile.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!jobsResponse.ok) {
        throw new Error(`Error ${jobsResponse.status}`)
      }

      const data = await jobsResponse.json()

      const newJobsData = await Promise.all(
        data.jobs.map(async (job) => {
          try {
            const review = await getReview(job.id, user)
            const contract = await getContractForJob(job.id, user)
            return { ...job, review, contract }
          } catch (err) {
            console.error(`Failed to fetch data for job ${job.id}`, err)
            return { ...job, review: null, contract: null }
          }
        }),
      )

      setJobs(newJobsData)
      console.log("✅ Jobs, reviews, and contracts loaded:", newJobsData)
      setIsLoading(false)
    }
  }

  const getReview = async (jobId, user) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(`${API_BASE_URL}/api/reviews/job/${jobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch review. Status: ${response.status}`)
      }

      const { review } = await response.json()
      return review
    } catch (error) {
      console.error("Error fetching review:", error)
      throw error
    }
  }

  const getContractForJob = async (jobId, user) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(`${API_BASE_URL}/api/contracts/job/${jobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        return null
      }

      const data = await response.json()
      return data.contract || null
    } catch (error) {
      console.error("Error fetching contract:", error)
      return null
    }
  }

  const filteredJobs = jobs
    .filter((job) => job.status === activeStatus)
    .filter((job) => job.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const openModal = (job, type) => {
    setSelectedJob(job)
    setModalType(type)
  }

  const closeModal = () => {
    setSelectedJob(null)
    setModalType(null)
  }

  const handleConfirmAction = () => {
    if (modalType === "start") startJob()
    else if (modalType === "done") completeJob()
    closeModal()
  }

  const startJob = async () => {
    setIsConfirming(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem("userProfile"))

    const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "ongoing" }),
    })

    if (!res.ok) throw new Error("Failed to start job")
    await fetchJobs()
    setIsConfirming(false)
  }

  const completeJob = async () => {
    setIsConfirming(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem("userProfile"))

    try {
      // Step 1: Update job status to completed
      const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (!res.ok) throw new Error("Failed to complete job")

      // Step 2: Try to mark contract work as complete (if contract exists)
      // This will notify the manager to review and approve the work
      try {
        // First get the contract for this job
        const contractRes = await fetch(`${API_BASE_URL}/api/contracts/job/${selectedJob.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (contractRes.ok) {
          const contractData = await contractRes.json()

          if (contractData.contract && contractData.contract.id) {
            // Mark work as complete on the contract
            const completeRes = await fetch(`${API_BASE_URL}/api/contracts/${contractData.contract.id}/complete`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
            })

            if (completeRes.ok) {
              console.log("Contract work marked complete, manager notified")
            } else {
              console.warn("Could not mark contract complete, but job status updated")
            }
          }
        }
      } catch (contractErr) {
        // Contract notification is optional - job completion still succeeded
        console.warn("Could not notify contract system:", contractErr)
      }

      await fetchJobs()
    } catch (error) {
      console.error("Error completing job:", error)
      toast.error(t('toasts.failedCompleteJob'))
    } finally {
      setIsConfirming(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)

    if (files.length + reviewImages.length > 5) {
      toast.error(t('toasts.maxImages'))
      return
    }

    setReviewImages((prev) => [...prev, ...files])
    setReviewImageTypes((prev) => [...prev, ...files.map(() => 'general')])

    const previews = files.map((file) => URL.createObjectURL(file))
    setReviewImagePreviews((prev) => [...prev, ...previews])
  }

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index))
    setReviewImageTypes((prev) => prev.filter((_, i) => i !== index))
    setReviewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateImageType = (index, type) => {
    setReviewImageTypes(prev => prev.map((t, i) => i === index ? type : t))
  }

  const handleSubmitReview = async () => {
    const cats = categoryRatings
    if (!cats.quality || !cats.timeliness || !cats.communication || !cats.value) {
      toast.error(t('entrepreneurJobs.allCategoriesRequired') || "Please rate all categories")
      return
    }

    if (!reviewForm.comment || !reviewForm.comment.trim()) {
      toast.error(t('toasts.commentRequired'))
      return
    }

    if (reviewForm.comment.trim().length < 10) {
      toast.error(t('toasts.commentTooShort'))
      return
    }

    const overallRating = Math.round((cats.quality + cats.timeliness + cats.communication + cats.value) / 4)

    try {
      setIsSubmittingReview(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const user = JSON.parse(localStorage.getItem("userProfile"))

      const managerUserId = selectedJob.manager_user_id || selectedJob.manager_id
      if (!managerUserId) throw new Error('Cannot find manager user ID')

      const formData = new FormData()
      formData.append("reviewed_user_id", managerUserId)
      formData.append("job_id", selectedJob.id)
      formData.append("rating", overallRating)
      formData.append("comment", reviewForm.comment.trim())
      formData.append("rating_quality", cats.quality)
      formData.append("rating_timeliness", cats.timeliness)
      formData.append("rating_communication", cats.communication)
      formData.append("rating_value", cats.value)

      reviewImages.forEach((image) => {
        formData.append("images", image)
      })
      formData.append("image_types", JSON.stringify(reviewImageTypes))

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to submit review")
      }

      const responseData = await res.json()
      toast.success(responseData.message || t('entrepreneurJobs.reviewSuccess') || "Review submitted!")

      setOpenReviewModal(false)
      setReviewForm({ comment: "" })
      setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
      setReviewImages([])
      setReviewImageTypes([])
      reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
      setReviewImagePreviews([])

      await fetchJobs()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error(t('common.failedSubmitReview') || "Failed to submit review.")
    } finally {
      setIsSubmittingReview(false)
    }
  }


  const getJobInformation = async (job) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const managerResponse = await fetch(`${API_BASE_URL}/api/users/manager/profile/id/${job.manager_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userProfile.token}`,
      },
    })

    const reviewResponse = await fetch(`${API_BASE_URL}/api/reviews/job/${job.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userProfile.token}`,
      },
    })

    if (!managerResponse.ok || !reviewResponse.ok) {
      throw new Error(`Error ${managerResponse.status}`)
    }

    const managerData = await managerResponse.json()
    const rev = await reviewResponse.json()
    setManager(managerData.profile)
    setReviewed(rev.review)
    setShowReviewModal(true)
  }

  const handleChatManager = (job) => {
    try {
      // Debug: Log job data to check if manager info is available
      console.log("🔍 handleChatManager - Job data:", {
        id: job.id,
        title: job.title,
        manager_id: job.manager_id,
        manager_user_id: job.manager_user_id,
        manager_name: job.manager_name
      })

      // Use manager_user_id from the job data (already fetched from getJobsByEntrepreneurId)
      const managerId = job.manager_user_id

      if (!managerId) {
        console.error("❌ No manager_user_id found in job data. Full job:", job)
        toast.error(t('entrepreneurJobs.cannotFindManager') || "Cannot find property manager for this job")
        return
      }

      if (managerId === userProfile.id) {
        toast.error(t('entrepreneurJobs.cannotMessageSelf') || "Cannot message yourself")
        return
      }

      localStorage.setItem("targetReceiverId", managerId)
      localStorage.setItem("targetReceiverName", job.manager_name || t('entrepreneurJobs.propertyManager') || "Property Manager")
      if (job.id) localStorage.setItem("targetJobId", job.id)
      navigate('/messages/entrepreneur')
    } catch (err) {
      console.error('Error navigating to messages:', err)
      toast.error(t('entrepreneurJobs.failedOpenMessages') || 'Failed to open messages. Please try again.')
    }
  }

  const handleViewDetails = (job) => {
    setDetailsJob(job);
    setShowDetailsModal(true);
  }

  // Handle viewing property manager profile
  const handleViewManagerProfile = async (job) => {
    const managerId = job.manager_id
    if (!managerId || isLoadingManagerProfile) return

    setIsLoadingManagerProfile(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(
        `${API_BASE_URL}/api/users/manager/profile/id/${managerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userProfile.token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch manager profile")
      }

      const data = await response.json()
      // Use the profile data directly - it now includes all user fields from the backend
      setSelectedManagerProfile(data.profile)
      setShowManagerModal(true)
    } catch (error) {
      console.error("Error fetching manager profile:", error)
      toast.error(t('toasts.failedLoadManagerProfile'))
    } finally {
      setIsLoadingManagerProfile(false)
    }
  }

  const getStatusCount = (status) => {
    return jobs.filter((job) => job.status === status).length
  }

  const formatDate = (dateString) => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US'
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper function to translate job categories
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'Roofing': t('entrepreneurJobs.categoryRoofing'),
      'Carpentry': t('entrepreneurJobs.categoryCarpentry'),
      'Masonry': t('entrepreneurJobs.categoryMasonry'),
      'Plumbing': t('entrepreneurJobs.categoryPlumbing'),
      'Electrical': t('entrepreneurJobs.categoryElectrical'),
      'Painting': t('entrepreneurJobs.categoryPainting'),
      'Flooring': t('entrepreneurJobs.categoryFlooring'),
      'Landscaping': t('entrepreneurJobs.categoryLandscaping'),
      'HVAC': t('entrepreneurJobs.categoryHVAC'),
      'Windows/Doors': t('entrepreneurJobs.categoryWindowsDoors'),
      'General Repair': t('entrepreneurJobs.categoryGeneralRepair'),
      'Other': t('entrepreneurJobs.categoryOther'),
    }
    return categoryMap[category] || category
  }

  // Get contract status info for display (payments handled externally)
  const getContractStatusInfo = (contract) => {
    if (!contract) {
      return { class: "status-pending", icon: Clock, label: t('entrepreneurJobs.contractPending') || 'Contract Pending', description: t('entrepreneurJobs.awaitingContract') || 'Awaiting contract creation' }
    }

    const status = contract.status
    switch (status) {
      case "active":
        return { class: "status-active", icon: CheckCircle, label: t('entrepreneurJobs.contractActive') || 'Contract Active', description: t('entrepreneurJobs.readyToStart') || 'Ready to start work' }
      case "work_completed":
        return { class: "status-review", icon: AlertCircle, label: t('entrepreneurJobs.awaitingApproval') || 'Awaiting Approval', description: t('entrepreneurJobs.workMarkedComplete') || 'Work marked complete, awaiting manager approval' }
      case "completed":
        return { class: "status-completed", icon: CheckCircle, label: t('entrepreneurJobs.contractCompleted') || 'Completed', description: t('entrepreneurJobs.workApproved') || 'Work approved by manager' }
      default:
        return { class: "status-unknown", icon: Clock, label: t('entrepreneurJobs.unknown') || 'Unknown', description: t('entrepreneurJobs.contractStatusUnknown') || 'Contract status unknown' }
    }
  }

  // Skeleton Loading Component
  const ProjectsSkeleton = () => (
    <div className="ej-container">
      <Nav />
      <div className="ej-content">
        {/* Header Skeleton */}
        <header className="ej-page-header">
          <div className="ej-header-left">
            <div className="ej-header-title-group">
              <div className="skeleton" style={{ width: '180px', height: '32px' }}></div>
              <div className="skeleton" style={{ width: '100px', height: '24px', marginLeft: '12px' }}></div>
            </div>
          </div>
          <div className="ej-header-actions">
            <div className="skeleton" style={{ width: '100px', height: '40px', borderRadius: '8px' }}></div>
          </div>
        </header>

        {/* Tabs Skeleton */}
        <div className="ej-tabs-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: '110px', height: '40px', borderRadius: '8px', marginRight: '8px' }}></div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="ej-controls-bar">
          <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '44px', borderRadius: '8px' }}></div>
        </div>

        {/* Jobs Grid Skeleton - Matching new card design */}
        <div className="ej-projects-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ej-project-card skeleton-card" style={{ pointerEvents: 'none' }}>
              {/* Card Header */}
              <div className="ej-card-header">
                <div className="skeleton" style={{ width: '90px', height: '28px', borderRadius: '6px' }}></div>
              </div>

              {/* Card Body */}
              <div className="ej-card-body">
                {/* Title & Category */}
                <div className="ej-title-section">
                  <div className="skeleton" style={{ width: '85%', height: '22px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '4px' }}></div>
                </div>

                {/* Contract Status Skeleton */}
                <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '8px' }}></div>

                {/* Meta Row */}
                <div className="ej-meta-row">
                  <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px' }}></div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="ej-card-footer">
                <div className="ej-secondary-actions">
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }}></div>
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return <ProjectsSkeleton />
  }

  return (
    <div className="ej-container">
      <Nav />
      <div className="ej-content">
        {/* Page Header */}
        <header className="ej-page-header">
          <div className="ej-header-left">
            <div className="ej-header-title-group">
              <h1>{t('entrepreneurJobs.title')}</h1>
              <span className="ej-project-count">{jobs.length} {t('entrepreneurJobs.projects')}</span>
            </div>
          </div>
          <div className="ej-header-actions">
            <div className="ej-btn-header">
              <PlayCircle size={18} />
              <span>{jobs.filter((j) => j.status === "ongoing").length} {t('entrepreneurJobs.active')}</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="ej-tabs-container">
          {["accepted", "ongoing", "completed"].map((status) => (
            <button
              key={status}
              className={`ej-tab-btn ${activeStatus === status ? "active" : ""}`}
              onClick={() => setActiveStatus(status)}
            >
              {t(`entrepreneurJobs.${status}`)}
              <span className="ej-tab-count">{getStatusCount(status)}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="ej-controls-bar">
          <div className="ej-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('entrepreneurJobs.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ej-clear-btn" onClick={() => setSearchTerm("")}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="ej-empty-state">
            <FileText size={48} />
            <h3>{t('entrepreneurJobs.noProjectsFound', { status: t(`entrepreneurJobs.${activeStatus}`) })}</h3>
            <p>{t('entrepreneurJobs.adjustSearchOrTabs')}</p>
          </div>
        ) : (
          <div className="ej-projects-grid">
            {filteredJobs.map((job) => {
              const getStatusInfo = (status) => {
                const statusMap = {
                  accepted: { class: "status-accepted", icon: CheckCircle, label: t('entrepreneurJobs.accepted') },
                  ongoing: { class: "status-ongoing", icon: PlayCircle, label: t('entrepreneurJobs.ongoing') },
                  completed: { class: "status-completed", icon: CheckCircle, label: t('entrepreneurJobs.completed') },
                }
                return statusMap[status] || { class: "status-open", icon: FolderOpen, label: status }
              }
              const statusInfo = getStatusInfo(job.status)
              const StatusIcon = statusInfo.icon
              const contractInfo = getContractStatusInfo(job.contract)
              const ContractIcon = contractInfo.icon

              return (
                <div className="ej-project-card" key={job.id} onClick={() => handleViewDetails(job)}>
                  {/* Card Header */}
                  <div className="ej-card-header">
                    <div className={`ej-status-badge ${statusInfo.class}`}>
                      <StatusIcon size={14} />
                      <span>{statusInfo.label}</span>
                    </div>
                    {(job.urgency === 'Urgent' || job.is_emergency) ? (
                      <span className="ej-urgent-badge">
                        <AlertCircle size={12} />
                        {t('entrepreneurJobs.urgent')}
                      </span>
                    ) : job.urgency === 'Planned' ? (
                      <span className="ej-planned-badge">
                        <Clock size={12} />
                        {t('entrepreneurJobs.planned') || 'Planned'}
                      </span>
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="ej-card-body">
                    {/* Title & Category */}
                    <div className="ej-title-section">
                      <h3 className="ej-project-title">{job.title}</h3>
                      <span className="ej-category-tag">{getCategoryLabel(job.category)}</span>
                    </div>

                    {/* Contract Status */}
                    <div className={`ej-contract-card ${contractInfo.class}`}>
                      <div className="ej-contract-icon">
                        <ContractIcon size={18} />
                      </div>
                      <div className="ej-contract-info">
                        <span className="ej-contract-label">{contractInfo.label}</span>
                        {job.contract && (
                          <span className="ej-contract-value">{formatCurrency(job.contract.contract_amount || job.bid_amount || 0)}</span>
                        )}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="ej-meta-row">
                      <div className="ej-meta-item">
                        <Calendar size={14} />
                        <span>{t('entrepreneurJobs.due')} {formatDate(job.due_date)}</span>
                      </div>
                      {job.budget_min && job.budget_max && (
                        <div className="ej-meta-item">
                          <DollarSign size={14} />
                          <span>{formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="ej-card-footer">
                    <div className="ej-secondary-actions">
                      <button
                        className="ej-icon-action"
                        onClick={(e) => { e.stopPropagation(); handleChatManager(job); }}
                        title={t('entrepreneurJobs.messageManager')}
                      >
                        <MessageSquare size={15} />
                        <span>{t('entrepreneurJobs.chat') || 'Chat'}</span>
                      </button>
                      {(job.status === "ongoing" || job.status === "completed") && (
                        <button
                          className="ej-icon-action"
                          onClick={(e) => { e.stopPropagation(); setProgressJob(job); }}
                          title={t('progress.trackProgress') || 'Track Progress'}
                        >
                          <BarChart3 size={15} />
                          <span>{t('progress.trackProgress') || 'Progress'}</span>
                        </button>
                      )}
                    </div>

                    <div className="ej-primary-action">
                      {job.status === "accepted" && (
                        <button
                          className={`ej-btn ej-btn-start ${(!job.contract || job.contract.status !== 'active') ? 'ej-btn-disabled' : ''}`}
                          onClick={(e) => { e.stopPropagation(); if (job.contract?.status === 'active') openModal(job, "start"); }}
                          disabled={!job.contract || job.contract.status !== 'active'}
                          title={(!job.contract || job.contract.status !== 'active') ? t('entrepreneurJobs.awaitingContract') : t('entrepreneurJobs.startProject')}
                        >
                          <PlayCircle size={16} />
                          {t('entrepreneurJobs.startProject')}
                        </button>
                      )}

                      {job.status === "ongoing" && (
                        <button
                          className="ej-btn ej-btn-complete"
                          onClick={(e) => { e.stopPropagation(); openModal(job, "done"); }}
                        >
                          <CheckCircle size={16} />
                          {t('entrepreneurJobs.markComplete')}
                        </button>
                      )}

                      {job.status === "completed" && (
                        <>
                          {/* Awaiting manager confirmation */}
                          {job.contract && !job.contract?.mutual_confirmation_completed_at && (
                            <span className="ej-confirmation-status">
                              <Clock size={14} />
                              {t('entrepreneurJobs.awaitingManagerConfirmation') || 'Awaiting manager confirmation'}
                            </span>
                          )}

                          {/* Review button (only after PM confirms completion) */}
                          {job.contract?.mutual_confirmation_completed_at && (
                            <button
                              className="ej-btn ej-btn-review"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedJob(job)
                                if (job.review.length === 0) {
                                  setReviewForm({ comment: "" }); setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
                                  setOpenReviewModal(true)
                                } else {
                                  getJobInformation(job)
                                }
                              }}
                            >
                              <Star size={16} />
                              {job.review.length === 0 ? t('entrepreneurJobs.leaveReview') : t('entrepreneurJobs.viewReview')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Modal - Improved UI */}
      {openReviewModal && (
        <div className="rm-modal-overlay" onClick={() => {
          setOpenReviewModal(false)
          reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
          setReviewImagePreviews([])
          setReviewImages([])
        }}>
          <div className="rm-modal-container" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const closeModal = () => {
                setOpenReviewModal(false)
                reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
                setReviewImagePreviews([])
                setReviewImages([])
                setReviewImageTypes([])
                setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
                setReviewForm({ comment: "" })
              }
              const cats = categoryRatings
              const avgRating = (cats.quality && cats.timeliness && cats.communication && cats.value)
                ? ((cats.quality + cats.timeliness + cats.communication + cats.value) / 4).toFixed(1) : '—'
              const allRated = cats.quality && cats.timeliness && cats.communication && cats.value

              const CategoryStars = ({ label, value, onChange }) => (
                <div className="rm-cat-row">
                  <span className="rm-cat-label">{label}</span>
                  <div className="rm-cat-stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" className={`rm-cat-star ${value >= n ? 'rm-active' : ''}`} onClick={() => onChange(n)}>★</button>
                    ))}
                  </div>
                </div>
              )

              return (
                <>
                  <div className="rm-modal-header">
                    <div className="rm-header-content">
                      <h2 className="rm-modal-title">{t('entrepreneurJobs.leaveAReview') || 'Leave a Review'}</h2>
                      <p className="rm-modal-subtitle">{selectedJob?.title}</p>
                    </div>
                    <button className="rm-close-btn" onClick={closeModal}><X size={20} /></button>
                  </div>

                  <div className="rm-modal-body">
                    {/* Category Ratings */}
                    <div className="rm-rating-section">
                      <label className="rm-section-label">{t('entrepreneurJobs.rateCategories') || 'Rate by Category'}</label>
                      <CategoryStars label={t('entrepreneurJobs.categoryQuality') || 'Quality of Work'} value={cats.quality} onChange={v => setCategoryRatings(p => ({ ...p, quality: v }))} />
                      <CategoryStars label={t('entrepreneurJobs.categoryTimeliness') || 'Timeliness'} value={cats.timeliness} onChange={v => setCategoryRatings(p => ({ ...p, timeliness: v }))} />
                      <CategoryStars label={t('entrepreneurJobs.categoryCommunication') || 'Communication'} value={cats.communication} onChange={v => setCategoryRatings(p => ({ ...p, communication: v }))} />
                      <CategoryStars label={t('entrepreneurJobs.categoryValue') || 'Value for Money'} value={cats.value} onChange={v => setCategoryRatings(p => ({ ...p, value: v }))} />

                      {allRated && (
                        <div className="rm-overall-rating">
                          <Star size={18} fill="#f59e0b" stroke="#f59e0b" />
                          <span className="rm-overall-value">{avgRating}</span>
                          <span className="rm-overall-label">{t('entrepreneurJobs.overallRating') || 'Overall Rating'}</span>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    <div className="rm-comment-section">
                      <label className="rm-section-label">{t('entrepreneurJobs.shareExperience') || 'Share your experience'}</label>
                      <textarea
                        className="rm-textarea"
                        placeholder={t('entrepreneurJobs.reviewPlaceholder') || 'Tell us about your experience...'}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                      />
                      <div className="rm-char-count">
                        {reviewForm.comment.length} {t('entrepreneurJobs.characters') || 'characters'} {reviewForm.comment.trim().length < 10 && (t('entrepreneurJobs.minimumTen') || '(min 10)')}
                      </div>
                    </div>

                    {/* Before/After Photos */}
                    <div className="rm-image-section">
                      <label className="rm-section-label">{t('entrepreneurJobs.addPhotos') || 'Add Photos'}</label>
                      <p className="rm-section-hint">{t('entrepreneurJobs.beforeAfterHint') || 'Upload before and after photos to showcase the work (max 5)'}</p>

                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="rm-file-input" id="rm-review-images-ej" />
                      <label htmlFor="rm-review-images-ej" className="rm-upload-btn">
                        <FileText size={18} />
                        <span>{t('entrepreneurJobs.chooseImages') || 'Choose Images'}</span>
                      </label>

                      {reviewImagePreviews.length > 0 && (
                        <div className="rm-image-grid">
                          {reviewImagePreviews.map((preview, index) => (
                            <div key={index} className="rm-image-item">
                              <img src={preview} alt={`Preview ${index + 1}`} className="rm-image-preview" />
                              <select
                                className="rm-image-type-select"
                                value={reviewImageTypes[index] || 'general'}
                                onChange={(e) => updateImageType(index, e.target.value)}
                              >
                                <option value="before">{t('entrepreneurJobs.photoBefore') || 'Before'}</option>
                                <option value="after">{t('entrepreneurJobs.photoAfter') || 'After'}</option>
                                <option value="general">{t('entrepreneurJobs.photoGeneral') || 'General'}</option>
                              </select>
                              <button type="button" className="rm-remove-btn" onClick={() => removeReviewImage(index)}>
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rm-modal-footer">
                    <button className="rm-btn rm-btn-cancel" onClick={closeModal} disabled={isSubmittingReview}>
                      {t('entrepreneurJobs.cancel') || 'Cancel'}
                    </button>
                    <button
                      className="rm-btn rm-btn-submit"
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || !allRated || !reviewForm.comment.trim() || reviewForm.comment.trim().length < 10}
                    >
                      {isSubmittingReview ? (
                        <><div className="rm-spinner"></div><span>{t('entrepreneurJobs.submitting') || 'Submitting...'}</span></>
                      ) : (
                        <><Star size={16} /><span>{t('entrepreneurJobs.submitReview') || 'Submit Review'}</span></>
                      )}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalType && selectedJob && (
        <div className="bid-modal-overlay" onClick={closeModal}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="bid-modal-header">
              <h2>
                {modalType === "start" && t('entrepreneurJobs.startProjectQuestion')}
                {modalType === "done" && t('entrepreneurJobs.markCompleteQuestion')}
              </h2>
              <button className="bid-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            <div className="bid-modal-body">
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  {selectedJob.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  {modalType === "start" ? t('entrepreneurJobs.statusChangeOngoing') : t('entrepreneurJobs.statusChangeCompleted')}
                </p>
              </section>
            </div>
            <div className="bid-modal-footer">
              <button className="bid-btn-decline" onClick={closeModal}>
                {t('entrepreneurJobs.cancel')}
              </button>
              <button className="bid-btn-accept" onClick={handleConfirmAction} disabled={isConfirming}>
                {isConfirming ? t('entrepreneurJobs.loading') : t('entrepreneurJobs.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Job Details Modal */}
      {showReviewModal && selectedJob && reviewed != null && (
        <div className="bid-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h2>{selectedJob.title}</h2>
              <button className="bid-modal-close" onClick={() => setShowReviewModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  {t('entrepreneurJobs.projectDetails')}
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.category')}</label>
                    <p>{getCategoryLabel(selectedJob.category)}</p>
                  </div>
                  <div className="bid-info-item">
                    <label><Calendar size={14} /> {t('entrepreneurJobs.dueDate')}</label>
                    <p>{formatDate(selectedJob.due_date)}</p>
                  </div>
                  {selectedJob.budget_min && selectedJob.budget_max && (
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> {t('entrepreneurJobs.budgetRange')}</label>
                      <p>{formatCurrency(selectedJob.budget_min)} - {formatCurrency(selectedJob.budget_max)}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Building2 size={20} />
                  {t('entrepreneurJobs.propertyManager')}
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.company')}</label>
                    <p>{manager.company_name}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.address')}</label>
                    <p>{manager.address}</p>
                  </div>
                </div>
              </section>

              {reviewed && reviewed.length > 0 && (
                <section className="bid-modal-section bid-modal-highlight">
                  <h3 className="bid-section-title">
                    <Star size={20} />
                    {t('entrepreneurJobs.yourReview')}
                  </h3>
                  <div className="bid-rating-display">
                    <div className="bid-rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={24}
                          fill={i < reviewed[0].rating ? "#facc15" : "none"}
                          stroke="#facc15"
                        />
                      ))}
                    </div>
                    <p className="bid-rating-text">{reviewed[0].rating} {t('entrepreneurJobs.outOfFiveStars')}</p>
                  </div>
                  <div className="bid-message">
                    <label>{t('entrepreneurJobs.comment')}</label>
                    <p>"{reviewed[0].comment}"</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    — {reviewed[0].reviewer_first_name} {reviewed[0].reviewer_last_name}
                  </p>

                  {/* Display attached images */}
                  {reviewed[0].images && reviewed[0].images.length > 0 && (
                    <div className="review-images-section" style={{ marginTop: '1rem' }}>
                      <label>{t('entrepreneurJobs.attachedPhotos')} ({reviewed[0].images.length}):</label>
                      <div className="review-images-grid">
                        {reviewed[0].images.map((image, index) => (
                          <div key={index} className="review-image-item">
                            <img
                              src={image.image_url}
                              alt={`Review ${index + 1}`}
                              onClick={() => window.open(image.image_url, "_blank")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showDetailsModal && detailsJob && (
        <div className="bid-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h2>{t('entrepreneurJobs.projectDetails')}</h2>
              <button className="bid-modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              {/* Project Information */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  {t('entrepreneurJobs.projectInformation')}
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.titleLabel')}</label>
                    <p>{detailsJob.title}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.category')}</label>
                    <p>{getCategoryLabel(detailsJob.category)}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>{t('entrepreneurJobs.status')}</label>
                    <span className={`bid-status-badge-modal status-${detailsJob.status === 'approved' ? 'approved' : detailsJob.status}`}>
                      {t(`entrepreneurJobs.${detailsJob.status}`)}
                    </span>
                  </div>
                </div>
                <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                  <label>{t('entrepreneurJobs.description')}</label>
                  <p>{detailsJob.description}</p>
                </div>
              </section>

              {/* Timeline & Budget */}
              <section className="bid-modal-section bid-modal-highlight">
                <h3 className="bid-section-title">
                  <DollarSign size={20} />
                  {t('entrepreneurJobs.timelineBudget')}
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label><Calendar size={14} /> {t('entrepreneurJobs.dueDate')}</label>
                    <p>{formatDate(detailsJob.due_date)}</p>
                  </div>
                  {detailsJob.estimated_duration_days && (
                    <div className="bid-info-item">
                      <label><Clock size={14} /> {t('entrepreneurJobs.estimatedDuration')}</label>
                      <p>{detailsJob.estimated_duration_days} {t('entrepreneurJobs.days')}</p>
                    </div>
                  )}
                  {detailsJob.budget_min && detailsJob.budget_max && (
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> {t('entrepreneurJobs.budgetRange')}</label>
                      <p>{formatCurrency(detailsJob.budget_min)} - {formatCurrency(detailsJob.budget_max)}</p>
                    </div>
                  )}
                  {detailsJob.urgency && (
                    <div className="bid-info-item">
                      <label>{t('entrepreneurJobs.urgencyLabel')}</label>
                      <p>{detailsJob.urgency}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Your Bid Information */}
              {detailsJob.bid_amount && (
                <section className="bid-modal-section bid-modal-highlight">
                  <h3 className="bid-section-title">
                    <Hammer size={20} />
                    {t('entrepreneurJobs.yourBid')}
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> {t('entrepreneurJobs.bidAmount')}</label>
                      <p style={{ fontWeight: '600', color: 'var(--color-secondary)', fontSize: '1.125rem' }}>
                        {formatCurrency(detailsJob.bid_amount)}
                      </p>
                    </div>
                    {detailsJob.bid_submitted_at && (
                      <div className="bid-info-item">
                        <label><Clock size={14} /> {t('entrepreneurJobs.submittedOn')}</label>
                        <p>{formatDate(detailsJob.bid_submitted_at)}</p>
                      </div>
                    )}
                  </div>
                  {detailsJob.bid_message && (
                    <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                      <label><MessageSquare size={14} /> {t('entrepreneurJobs.yourProposalMessage')}</label>
                      <p style={{
                        marginTop: '0.5rem',
                        padding: '0.875rem',
                        backgroundColor: 'rgba(0, 165, 169, 0.05)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--color-secondary)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {detailsJob.bid_message}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Contract Status Section */}
              <section className="bid-modal-section ej-contract-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  {t('entrepreneurJobs.contractStatus') || 'Contract Status'}
                </h3>
                {(() => {
                  const contractInfo = getContractStatusInfo(detailsJob.contract)
                  const ContractIcon = contractInfo.icon
                  return (
                    <>
                      <div className={`ej-contract-status-card ${contractInfo.class}`}>
                        <div className="ej-contract-status-header">
                          <ContractIcon size={24} />
                          <div className="ej-contract-status-text">
                            <span className="ej-contract-status-label">{contractInfo.label}</span>
                            <span className="ej-contract-status-desc">{contractInfo.description}</span>
                          </div>
                        </div>
                        {detailsJob.contract && (
                          <div className="ej-contract-details">
                            <div className="ej-contract-detail-row">
                              <span>{t('entrepreneurJobs.contractAmount')}</span>
                              <span className="ej-contract-detail-value">{formatCurrency(detailsJob.contract.contract_amount || detailsJob.bid_amount || 0)}</span>
                            </div>
                            {detailsJob.contract.approved_at && (
                              <div className="ej-contract-detail-row">
                                <span>{t('entrepreneurJobs.approvedOn') || 'Approved On'}</span>
                                <span className="ej-contract-detail-value">{formatDate(detailsJob.contract.approved_at)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {!detailsJob.contract && (
                        <p className="ej-contract-note">
                          <AlertCircle size={14} />
                          {t('entrepreneurJobs.awaitingContract') || 'Awaiting contract creation from manager'}
                        </p>
                      )}
                      {detailsJob.contract?.status === 'active' && (
                        <p className="ej-contract-note ej-contract-note-active">
                          <CheckCircle size={14} />
                          {t('entrepreneurJobs.contractActiveNote') || 'Contract is active. You can start working on this project.'}
                        </p>
                      )}
                      {detailsJob.contract?.status === 'work_completed' && (
                        <p className="ej-contract-note ej-contract-note-pending">
                          <Clock size={14} />
                          {t('entrepreneurJobs.awaitingApprovalNote') || 'Work marked complete. Awaiting manager approval.'}
                        </p>
                      )}
                      {detailsJob.contract?.status === 'completed' && (
                        <p className="ej-contract-note ej-contract-note-success">
                          <CheckCircle size={14} />
                          {t('entrepreneurJobs.contractCompletedNote') || 'Work approved! Please arrange payment with the manager directly.'}
                        </p>
                      )}
                    </>
                  )
                })()}
              </section>

              {/* Property Manager Information */}
              {detailsJob.manager_id && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <User size={20} />
                    {t('entrepreneurJobs.propertyManager')}
                  </h3>
                  <div
                    className="bid-manager-card"
                    onClick={() => handleViewManagerProfile(detailsJob)}
                    title={t('entrepreneurJobs.viewManagerProfile')}
                  >
                    <div className="bid-manager-avatar">
                      {detailsJob.manager_company_name?.charAt(0) || detailsJob.manager_first_name?.charAt(0) || 'P'}
                    </div>
                    <div className="bid-manager-info">
                      <span className="bid-manager-name">
                        {detailsJob.manager_company_name || `${detailsJob.manager_first_name || ''} ${detailsJob.manager_last_name || ''}`.trim() || 'Property Manager'}
                      </span>
                      {detailsJob.manager_first_name && detailsJob.manager_company_name && (
                        <span className="bid-manager-contact">
                          {`${detailsJob.manager_first_name} ${detailsJob.manager_last_name || ''}`.trim()}
                        </span>
                      )}
                      {detailsJob.manager_email && (
                        <span className="bid-manager-email">{detailsJob.manager_email}</span>
                      )}
                    </div>
                    <ChevronRight size={18} className="bid-manager-chevron" />
                  </div>
                </section>
              )}

              {/* Property Location Map */}
              {detailsJob.property_latitude && detailsJob.property_longitude && (
                <section className="bid-modal-section">
                  <div className="bid-section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="bid-section-title" style={{ margin: 0 }}>
                      <MapPin size={20} />
                      {t('entrepreneurJobs.propertyLocation')}
                    </h3>
                    <button
                      className="ej-map-fullscreen-btn"
                      onClick={() => setIsMapFullscreen(true)}
                      title={t('entrepreneurJobs.viewFullscreenMap')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-secondary, #00a5a9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}
                    >
                      <Maximize2 size={14} />
                      {t('entrepreneurJobs.fullView')}
                    </button>
                  </div>
                  <div className="bid-info-item" style={{ marginBottom: '0.75rem', marginTop: '0.75rem' }}>
                    <label>
                      <Building2 size={14} /> {detailsJob.property_name || 'Property'}
                    </label>
                    <p>
                      {detailsJob.property_address}
                      {detailsJob.property_city && `, ${detailsJob.property_city}`}
                    </p>
                  </div>
                  <div className="ej-details-map-container">
                    <MapContainer
                      center={[
                        Number(detailsJob.property_latitude),
                        Number(detailsJob.property_longitude)
                      ]}
                      zoom={16}
                      scrollWheelZoom={false}
                      attributionControl={false}
                      style={{ height: "200px", width: "100%", borderRadius: "12px" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[
                          Number(detailsJob.property_latitude),
                          Number(detailsJob.property_longitude)
                        ]}
                      >
                        <Popup>
                          <strong>{detailsJob.property_name || 'Property Location'}</strong>
                          <br />
                          {detailsJob.property_address}
                          {detailsJob.property_city && <><br />{detailsJob.property_city}</>}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </section>
              )}
            </div>

            <div className="bid-modal-footer ej-modal-footer-redesign">
              {/* Left: Close button */}
              <button className="ej-modal-close-btn" onClick={() => setShowDetailsModal(false)}>
                {t('entrepreneurJobs.close')}
              </button>

              {/* Right: Action buttons */}
              <div className="ej-modal-action-buttons">
                {/* Chat with Manager button - always visible */}
                <button
                  className="ej-modal-chat-btn"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleChatManager(detailsJob)
                  }}
                >
                  <MessageSquare size={16} />
                  {t('entrepreneurJobs.chatWithManager')}
                </button>

                {/* Primary action based on status */}
                {detailsJob.status === "accepted" && (
                  <button
                    className={`ej-modal-action-btn ej-modal-start ${(!detailsJob.contract || detailsJob.contract.status !== 'active') ? 'ej-btn-disabled' : ''}`}
                    onClick={() => {
                      if (detailsJob.contract?.status === 'active') {
                        setShowDetailsModal(false)
                        openModal(detailsJob, "start")
                      }
                    }}
                    disabled={!detailsJob.contract || detailsJob.contract.status !== 'active'}
                    title={(!detailsJob.contract || detailsJob.contract.status !== 'active') ? t('entrepreneurJobs.awaitingContract') : t('entrepreneurJobs.startProject')}
                  >
                    <PlayCircle size={16} />
                    {t('entrepreneurJobs.startProject')}
                  </button>
                )}

                {detailsJob.status === "ongoing" && (
                  <button
                    className="ej-modal-action-btn ej-modal-complete"
                    onClick={() => {
                      setShowDetailsModal(false)
                      openModal(detailsJob, "done")
                    }}
                  >
                    <CheckCircle size={16} />
                    {t('entrepreneurJobs.markComplete')}
                  </button>
                )}

                {detailsJob.status === "completed" && (
                  <>
                    {/* Awaiting manager confirmation */}
                    {detailsJob.contract && !detailsJob.contract?.mutual_confirmation_completed_at && (
                      <span className="ej-confirmation-status">
                        <Clock size={14} />
                        {t('entrepreneurJobs.awaitingManagerConfirmation') || 'Awaiting manager confirmation'}
                      </span>
                    )}

                    {/* Review button (only after PM confirms completion) */}
                    {detailsJob.contract?.mutual_confirmation_completed_at && (
                      <button
                        className="ej-modal-action-btn ej-modal-review"
                        onClick={() => {
                          setShowDetailsModal(false)
                          setSelectedJob(detailsJob)
                          if (detailsJob.review && detailsJob.review.length === 0) {
                            setReviewForm({ comment: "" }); setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
                            setOpenReviewModal(true)
                          } else {
                            getJobInformation(detailsJob)
                          }
                        }}
                      >
                        <Star size={16} />
                        {detailsJob.review && detailsJob.review.length === 0 ? t('entrepreneurJobs.leaveReview') : t('entrepreneurJobs.viewReview')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && detailsJob && detailsJob.property_latitude && detailsJob.property_longitude && (
        <div
          className="ej-fullscreen-map-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                {detailsJob.property_name || 'Property Location'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', opacity: 0.8 }}>
                {detailsJob.property_address}
                {detailsJob.property_city && `, ${detailsJob.property_city}`}
              </p>
            </div>
            <button
              onClick={() => setIsMapFullscreen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <Minimize2 size={18} />
              {t('entrepreneurJobs.close')}
            </button>
          </div>

          {/* Map Container */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer
              key={`fullscreen-map-${detailsJob.id}`}
              center={[
                Number(detailsJob.property_latitude),
                Number(detailsJob.property_longitude)
              ]}
              zoom={17}
              scrollWheelZoom={true}
              attributionControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[
                  Number(detailsJob.property_latitude),
                  Number(detailsJob.property_longitude)
                ]}
              >
                <Popup>
                  <strong>{detailsJob.property_name || 'Property Location'}</strong>
                  <br />
                  {detailsJob.property_address}
                  {detailsJob.property_city && <><br />{detailsJob.property_city}</>}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Review Invitation Modal */}
      {showReviewInvitation && reviewInvitationJob && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' }}
          onClick={() => setShowReviewInvitation(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#111827' }}>{t('entrepreneurJobs.reviewInvitationTitle') || 'Leave a Review'}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>{reviewInvitationJob.title}</p>
              </div>
              <button
                style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: '#9ca3af', borderRadius: 6 }}
                onClick={() => setShowReviewInvitation(false)}
              >
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fffbeb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Star size={28} fill="#f59e0b" stroke="#f59e0b" />
              </div>
              <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
                {t('entrepreneurJobs.reviewInvitationMessage') || 'Both parties have confirmed the job is complete! Take a moment to rate your experience.'}
              </p>
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <button
                style={{ flex: 1, padding: '0.625rem', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowReviewInvitation(false)}
              >
                {t('entrepreneurJobs.skipReview') || 'Maybe Later'}
              </button>
              <button
                style={{ flex: 1, padding: '0.625rem', background: '#0F223D', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                onClick={() => {
                  setShowReviewInvitation(false)
                  setSelectedJob(reviewInvitationJob)
                  setReviewForm({ comment: "" }); setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
                  setReviewImages([])
                  setReviewImagePreviews([])
                  setOpenReviewModal(true)
                }}
              >
                <Star size={15} />
                <span>{t('entrepreneurJobs.leaveReviewNow') || 'Leave Review Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Manager Profile Modal */}
      <PropertyManagerProfileModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        profile={selectedManagerProfile}
      />

      {progressJob && (
        <JobProgressTracker
          jobId={progressJob.id}
          contractId={progressJob.contract?.id}
          userRole="entrepreneur"
          isModal={true}
          onClose={() => setProgressJob(null)}
        />
      )}
    </div>
  )
}

export default EntrepreneurJobs