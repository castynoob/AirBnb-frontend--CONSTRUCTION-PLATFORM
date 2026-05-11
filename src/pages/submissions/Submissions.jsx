"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Filter,
  X,
  DollarSign,
  Calendar,
  FileText,
  ChevronDown,
  Clock,
  CheckCircle,
  PlayCircle,
  MessageCircle,
  Star,
  Building2,
  User,
  FolderOpen,
  Heart,
  MapPin,
  ChevronRight,
  BadgeCheck,
  Briefcase,
  Trash2,
  XCircle,
  AlertCircle,
  Columns3,
  Check,
  BarChart3,
  Receipt,
  Download,
} from "lucide-react"
import Nav from "../../components/Nav"
// JobProgressTracker removed — progress now shown in job detail pages
import SlideToConfirm from "../../components/SlideToConfirm"
import "../../styles/manager/submissions.css"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../contexts/LanguageContext"
import toast from "react-hot-toast"
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal"
import { createContract, getContractByJob, approveWork, confirmCompletion, cancelBidApproval, deleteJob, archiveJob, getArchivedJobs } from "../../utils/contractApi"
import { useSubmissions, useFavorites, useInvalidateSubmissions } from "../../hooks/useSubmissionsData"

function SubmissionsPage() {
  const { t } = useLanguage()

  // TanStack Query: submissions + favorites (optimized single-endpoint fetch)
  const {
    data: cachedSubmissions = [],
    counts: submissionCounts = {},
    isLoading: submissionsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: queryError,
  } = useSubmissions()
  const { data: cachedFavorites = [] } = useFavorites()
  const { invalidateList: invalidateSubmissions, invalidateFavorites } = useInvalidateSubmissions()

  const [submissions, setSubmissions] = useState([])
  const [filteredSubmissions, setFilteredSubmissions] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const loading = submissionsLoading && submissions.length === 0
  const error = queryError?.message || null

  // Get user profile for mutations
  const uProfile = JSON.parse(localStorage.getItem("userProfile") || "{}")

  const navigate = useNavigate()

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [amountRange, setAmountRange] = useState({ min: "", max: "" })
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [openSubsDropdown, setOpenSubsDropdown] = useState(null) // 'property' | 'job' | null

  // review
  const [isAddingReview, setIsAddingReview] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [reviewImageTypes, setReviewImageTypes] = useState([]) // 'before' | 'after' | 'general'
  const [categoryRatings, setCategoryRatings] = useState({
    quality: 0, timeliness: 0, communication: 0, value: 0
  })

  // view reviews
  const [showViewReviews, setShowViewReviews] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [pmReceivedReview, setPmReceivedReview] = useState(null)

  // Favorites state
  const [favorites, setFavorites] = useState([])

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Property filter state
  const [selectedProperty, setSelectedProperty] = useState("all")

  // Job filter state
  const [selectedJob, setSelectedJob] = useState("all")


  // Track which bid/job is currently being processed (for slider state persistence)
  const [processingBidId, setProcessingBidId] = useState(null)
  const [processingJobId, setProcessingJobId] = useState(null)

  // Release funds confirmation modal
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [releaseJobId, setReleaseJobId] = useState(null)

  // Confirm completion + review invitation
  const [showConfirmCompletionModal, setShowConfirmCompletionModal] = useState(false)
  const [confirmCompletionJobId, setConfirmCompletionJobId] = useState(null)
  const [completionNote, setCompletionNote] = useState('')

  // Delete job + cancel bid approval
  const [showDeleteJobConfirm, setShowDeleteJobConfirm] = useState(false)
  const [deleteJobId, setDeleteJobId] = useState(null)
  const [showCancelApprovalConfirm, setShowCancelApprovalConfirm] = useState(false)
  const [cancelApprovalBidId, setCancelApprovalBidId] = useState(null)
  const [isDeletingJob, setIsDeletingJob] = useState(false)
  const [isCancellingApproval, setIsCancellingApproval] = useState(false)
  // Archive job
  const [showArchiveJobConfirm, setShowArchiveJobConfirm] = useState(false)
  const [archiveJobId, setArchiveJobId] = useState(null)
  const [isArchivingJob, setIsArchivingJob] = useState(false)
  // Bid comparison
  const [compareBids, setCompareBids] = useState(new Set())
  const [showCompareModal, setShowCompareModal] = useState(false)

  // Archived jobs tab
  const [archivedJobs, setArchivedJobs] = useState([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)
  const [archivedLoaded, setArchivedLoaded] = useState(false)

  // Track which jobs have had funds released (for hiding the slider after release)
  // Initialize from localStorage to persist across page refreshes
  const [releasedJobIds, setReleasedJobIds] = useState(() => {
    try {
      const stored = localStorage.getItem('releasedJobIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Persist releasedJobIds to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('releasedJobIds', JSON.stringify([...releasedJobIds]))
    } catch (err) {
      console.log("Could not persist releasedJobIds:", err)
    }
  }, [releasedJobIds])

  // Refs to prevent double API calls (more reliable than state for race conditions)
  const releasingFundsRef = useRef(new Set())
  const approvingBidsRef = useRef(new Set())

  // Sync cached submissions → local state
  useEffect(() => {
    if (!submissionsLoading) {
      setSubmissions(cachedSubmissions)
    }
  }, [cachedSubmissions, submissionsLoading])

  // Sync cached favorites → local state
  useEffect(() => {
    if (cachedFavorites.length > 0) {
      setFavorites(cachedFavorites)
    }
  }, [cachedFavorites])

  const showNotification = (message, type = "success") => {
    if (type === "success") {
      toast.success(message)
    } else if (type === "error") {
      toast.error(message)
    } else {
      toast(message)
    }
  }


  // Toggle favorite
  const toggleFavorite = async (submission, e) => {
    e.stopPropagation()

    try {
      const userProfile = localStorage.getItem("userProfile")
      if (!userProfile) {
        showNotification("Please log in to add favorites", "error")
        return
      }

      const user = JSON.parse(userProfile)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const isFavorited = favorites.includes(submission.bid.id)

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(
          `${API_BASE_URL}/api/favorites/bid/${submission.bid.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to remove favorite: ${response.status}`)
        }

        setFavorites((prev) => prev.filter((id) => id !== submission.bid.id))
        showNotification("Removed from favorites", "info")
      } else {
        // Add to favorites
        const response = await fetch(`${API_BASE_URL}/api/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entrepreneurId: submission.entrepreneur_profile.id,
            jobId: submission.job.id,
            bidId: submission.bid.id,
            category: submission.job.category || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to add favorite: ${response.status}`)
        }

        setFavorites((prev) => [...prev, submission.bid.id])
        showNotification("Added to favorites", "success")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      showNotification(error.message || "Failed to update favorites", "error")
    }
  }


  const handleViewDetails = async (submission) => {
    // Navigate to the full-page bid details view
    navigate(`/bid/${submission.bid.id}`)

    // Legacy modal code kept below for reference:
    // if (submission.bid.status === "approved" && normalizeStatus(submission.job.status) === "completed") {
    //   if (!releasedJobIds.has(submission.job.id)) {
    //     try {
    //       const contractData = await getContractByJob(submission.job.id)
    //       if (contractData.has_contract && contractData.contract?.payout_status === 'completed') {
    //         setReleasedJobIds(prev => new Set([...prev, submission.job.id]))
    //       }
    //     } catch (err) {
    //       console.log("Could not check contract status:", err)
    //     }
    //   }
    // }
    // setSelectedSubmission(submission)
    // setShowDetailsModal(true)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setLocationFilter("")
    setCategoryFilter("")
    setAmountRange({ min: "", max: "" })
    setDateRange({ start: "", end: "" })
  }

  const handleAccept = async (bidId, jobId, entrepreneurId) => {
    // Prevent double execution using ref (immediate, synchronous check)
    if (approvingBidsRef.current.has(bidId)) {
      console.log("Approval already in progress for bid (ref check):", bidId)
      return
    }

    if (isProcessing) {
      console.log("Already processing, skipping bid approval:", bidId)
      return
    }

    // Mark as in progress immediately using ref
    approvingBidsRef.current.add(bidId)

    setIsProcessing(true)
    setProcessingBidId(bidId)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

    try {
      // Get submission data
      const submission = submissions.find(s => s.bid.id === bidId)
      if (!submission) {
        throw new Error("Submission not found")
      }

      // Step 1: Check if contract already exists, otherwise create one
      let contract = null
      console.log("Checking for existing contract for job:", jobId)

      try {
        const existingContract = await getContractByJob(jobId)
        if (existingContract.has_contract && existingContract.contract) {
          console.log("Found existing contract:", existingContract.contract.id)
          contract = existingContract.contract
        }
      } catch (err) {
        console.log("No existing contract found, will create new one")
      }

      // Create new contract if none exists
      if (!contract) {
        console.log("Creating contract for bid:", bidId)
        const contractResult = await createContract(bidId)
        console.log("Contract created:", contractResult)
        contract = contractResult.contract
      }

      // Step 2: Approve the bid
      console.log("Approving bid:", bidId)
      const approveResponse = await fetch(
        `${API_BASE_URL}/api/bids/${bidId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${uProfile.token}`,
          },
        }
      )

      if (!approveResponse.ok) {
        const data = await approveResponse.json()
        throw new Error(data.message || "Failed to approve bid")
      }

      console.log("Bid approved successfully")

      // Step 3: Update job status to 'accepted'
      const entrepreneurUserId = submission.entrepreneur_profile.user_id
      await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${uProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted', entrepreneur_id: `${entrepreneurUserId}` })
      })

      // Step 4: Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.bid.id === bidId
            ? {
                ...sub,
                bid: { ...sub.bid, status: "approved" },
                job: { ...sub.job, status: "accepted" }
              }
            : sub
        )
      )

      setFilteredSubmissions((prev) =>
        prev.map((sub) =>
          sub.bid.id === bidId
            ? {
                ...sub,
                bid: { ...sub.bid, status: "approved" },
                job: { ...sub.job, status: "accepted" }
              }
            : sub
        )
      )

      setShowDetailsModal(false)
      showNotification(
        "Bid approved! Please arrange payment with the contractor directly.",
        "success"
      )

    } catch (error) {
      console.error("Error processing bid approval:", error)
      showNotification(
        error.message || "Failed to process bid approval. Please try again.",
        "error"
      )
    } finally {
      approvingBidsRef.current.delete(bidId)
      setIsProcessing(false)
      setProcessingBidId(null)
    }
  }

  // Handle releasing funds for completed jobs
  // Handle approving completed work (payment is handled externally)
  const handleApproveWork = async (jobId) => {
    // Prevent double execution using ref (immediate, synchronous check)
    if (releasingFundsRef.current.has(jobId)) {
      console.log("Approval already in progress for job (ref check):", jobId)
      return
    }

    // Also check state
    if (isProcessing || releasedJobIds.has(jobId)) {
      console.log("Approval already in progress or completed for job:", jobId)
      return
    }

    // Mark as in progress immediately using ref
    releasingFundsRef.current.add(jobId)

    setIsProcessing(true)
    setProcessingJobId(jobId)

    try {
      // Get contract for this job
      const contractData = await getContractByJob(jobId)

      if (!contractData.has_contract || !contractData.contract) {
        showNotification("No contract found for this job.", "error")
        releasingFundsRef.current.delete(jobId)
        setIsProcessing(false)
        setProcessingJobId(null)
        return
      }

      const contract = contractData.contract

      // Check if work is already approved
      if (contract.status === 'completed') {
        showNotification("Work has already been approved for this job.", "info")
        setReleasedJobIds(prev => new Set([...prev, jobId]))
        releasingFundsRef.current.delete(jobId)
        setIsProcessing(false)
        setProcessingJobId(null)
        return
      }

      // Approve work (payment handled externally)
      await approveWork(contract.id)

      // Mark as completed locally
      setReleasedJobIds(prev => new Set([...prev, jobId]))

      showNotification(
        t('submissions.workApprovedSuccess') || "Work approved! Please confirm completion with the contractor.",
        "success"
      )

      // Refresh submissions to update UI
      invalidateSubmissions()
      setShowDetailsModal(false)

      // Automatically show the confirm completion modal
      setConfirmCompletionJobId(jobId)
      setShowConfirmCompletionModal(true)

    } catch (error) {
      console.error("Error approving work:", error)
      showNotification(
        error.message || "Failed to approve work. Please try again.",
        "error"
      )
      // Remove from ref so user can try again
      releasingFundsRef.current.delete(jobId)
    } finally {
      setIsProcessing(false)
      setProcessingJobId(null)
    }
  }

  // Handle confirm job completion (mutual confirmation). The note is mandatory.
  const handleConfirmCompletion = async (jobId, note) => {
    if (!note || !note.trim()) {
      showNotification(
        t('submissions.completionNoteRequired') || 'Please add a note before confirming.',
        'error'
      )
      return
    }
    setIsProcessing(true)
    try {
      const contractData = await getContractByJob(jobId)
      if (!contractData.has_contract || !contractData.contract) {
        showNotification(t('submissions.noContractFound') || 'No contract found for this job.', 'error')
        return
      }

      await confirmCompletion(contractData.contract.id, note.trim())

      showNotification(
        t('submissions.completionConfirmedSuccess') || 'Work completion confirmed successfully',
        'success'
      )

      // Close details modal first
      setShowDetailsModal(false)

      // Update the submission with confirmed contract data so UI reflects it
      const sub = submissions.find(s => s.job.id === jobId)
      if (sub) {
        const updatedSub = {
          ...sub,
          contract: {
            ...sub.contract,
            manager_completion_confirmed: true,
            contractor_completion_confirmed: true,
            mutual_confirmation_completed_at: new Date().toISOString()
          }
        }
        setSelectedSubmission(updatedSub)
        setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
        setComment('')
        setReviewImages([])
        setReviewImagePreviews([])
        setReviewImageTypes([])
        setIsAddingReview(true)
      }

      invalidateSubmissions()
    } catch (error) {
      showNotification(error.message || (t('submissions.completionFailed') || 'Failed to confirm completion.'), 'error')
    } finally {
      setIsProcessing(false)
      setShowConfirmCompletionModal(false)
      setConfirmCompletionJobId(null)
      setCompletionNote('')
    }
  }

  // Handle delete job
  const handleDeleteJob = async (jobId) => {
    setIsDeletingJob(true)
    try {
      await deleteJob(jobId)
      showNotification(t('submissions.jobDeletedSuccess') || "Job deleted successfully.", "success")
      setShowDetailsModal(false)
      setSelectedSubmission(null)
      // Remove from local state immediately
      setSubmissions(prev => prev.filter(s => s.job.id !== jobId))
      setFilteredSubmissions(prev => prev.filter(s => s.job.id !== jobId))
      invalidateSubmissions()
    } catch (error) {
      showNotification(error.message || "Failed to delete job.", "error")
    } finally {
      setIsDeletingJob(false)
      setShowDeleteJobConfirm(false)
      setDeleteJobId(null)
    }
  }

  // Fetch archived jobs when the archived tab is selected
  const fetchArchivedJobs = async () => {
    setIsLoadingArchived(true)
    try {
      const data = await getArchivedJobs()
      setArchivedJobs(data.jobs || [])
      setArchivedLoaded(true)
    } catch (error) {
      console.error("Error fetching archived jobs:", error)
      showNotification(error.message || "Failed to load archived jobs.", "error")
    } finally {
      setIsLoadingArchived(false)
    }
  }

  // Handle tab change — fetch archived jobs on first visit
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === "archived" && !archivedLoaded) {
      fetchArchivedJobs()
    }
  }

  // Handle restore (unarchive) job
  const handleRestoreJob = async (jobId) => {
    try {
      await archiveJob(jobId, false)
      showNotification(t('submissions.jobRestoredSuccess') || "Job restored successfully.", "success")
      setArchivedJobs(prev => prev.filter(j => j.id !== jobId))
      invalidateSubmissions()
    } catch (error) {
      showNotification(error.message || "Failed to restore job.", "error")
    }
  }

  // Handle archive job
  const handleArchiveJob = async (jobId) => {
    setIsArchivingJob(true)
    try {
      await archiveJob(jobId)
      showNotification(t('submissions.jobArchivedSuccess') || "Job archived successfully.", "success")
      setShowDetailsModal(false)
      setSelectedSubmission(null)
      // Remove from local state immediately
      setSubmissions(prev => prev.filter(s => s.job.id !== jobId))
      setFilteredSubmissions(prev => prev.filter(s => s.job.id !== jobId))
      invalidateSubmissions()
      // Refresh archived list if already loaded
      if (archivedLoaded) fetchArchivedJobs()
    } catch (error) {
      showNotification(error.message || "Failed to archive job.", "error")
    } finally {
      setIsArchivingJob(false)
      setShowArchiveJobConfirm(false)
      setArchiveJobId(null)
    }
  }

  // Handle cancel bid approval
  const handleCancelBidApproval = async (bidId) => {
    setIsCancellingApproval(true)
    try {
      await cancelBidApproval(bidId)
      showNotification(t('submissions.bidApprovalCancelledSuccess') || "Bid approval cancelled. Job is now open for bidding.", "success")
      setShowDetailsModal(false)
      setSelectedSubmission(null)
      // Update local state immediately — revert bid to pending, job to open
      const updateSubmission = (s) => {
        if (s.bid.id === bidId) {
          return { ...s, bid: { ...s.bid, status: 'pending' }, job: { ...s.job, status: 'Open' } }
        }
        // Restore other declined bids for the same job
        if (s.job.id === submissions.find(sub => sub.bid.id === bidId)?.job.id && s.bid.status === 'declined') {
          return { ...s, bid: { ...s.bid, status: 'pending' }, job: { ...s.job, status: 'Open' } }
        }
        return s
      }
      setSubmissions(prev => prev.map(updateSubmission))
      setFilteredSubmissions(prev => prev.map(updateSubmission))
      invalidateSubmissions()
    } catch (error) {
      showNotification(error.message || "Failed to cancel bid approval.", "error")
    } finally {
      setIsCancellingApproval(false)
      setShowCancelApprovalConfirm(false)
      setCancelApprovalBidId(null)
    }
  }

  const handleDecline = async (bidId) => {
    setIsProcessing(true)

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(
        `${API_BASE_URL}/api/bids/${bidId}/decline`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${uProfile.token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Failed to decline bid: ${response.status}`)
      }

      // Remove from UI (since we filter out declined bids)
      setSubmissions((prev) => prev.filter((sub) => sub.bid.id !== bidId))
      setFilteredSubmissions((prev) => prev.filter((sub) => sub.bid.id !== bidId))

      showNotification(data.message || "Bid declined successfully", "info")
      setShowDetailsModal(false)

    } catch (error) {
      console.error("Error declining bid:", error)
      showNotification(
        error.message || "Failed to decline bid. Please try again.",
        "error"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChat = (submission) => {
    // ✅ FIX: Use user_id instead of profile id
    let entrepUserId = submission.entrepreneur_profile.user_id
    let jobId = submission.job.id
    // Use company_name as primary display, personal name as fallback
    let companyName = submission.entrepreneur_profile.company_name
    let name = companyName
      || (submission.user?.first_name && submission.user?.last_name
        ? `${submission.user.first_name} ${submission.user.last_name}`
        : 'Entrepreneur')

    localStorage.setItem("targetReceiverId", entrepUserId);
    localStorage.setItem("targetReceiverName", name);
    localStorage.setItem("targetCompanyName", companyName);
    if (jobId) localStorage.setItem("targetJobId", jobId);
    navigate(`/messages/${uProfile.role}`)
  }

  const handleReview = async (submission) => {
    setSelectedSubmission(submission)
    setPmReceivedReview(null)

    // Fetch received review (what the entrepreneur wrote about PM)
    try {
      const token = JSON.parse(localStorage.getItem('userProfile'))?.token
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/reviews/job/${submission.job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPmReceivedReview(data.receivedReview || [])
      }
    } catch (err) {
      console.error('Failed to fetch received review:', err)
    }

    // If review exists, show view modal, otherwise show add review modal
    if (submission.review) {
      setShowViewReviews(true)
    } else {
      setIsAddingReview(true)
      setComment('')
      setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
      setReviewImages([])
      setReviewImagePreviews([])
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)

    if (files.length + reviewImages.length > 5) {
      showNotification("You can only upload up to 5 images", "error")
      return
    }

    setReviewImages(prev => [...prev, ...files])
    setReviewImageTypes(prev => [...prev, ...files.map(() => 'general')])

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file))
    setReviewImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index))
    setReviewImageTypes(prev => prev.filter((_, i) => i !== index))
    setReviewImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateImageType = (index, type) => {
    setReviewImageTypes(prev => prev.map((t, i) => i === index ? type : t))
  }

  const handleSubmitReview = async () => {
    // Validate all 4 category ratings
    const cats = categoryRatings
    if (!cats.quality || !cats.timeliness || !cats.communication || !cats.value) {
      showNotification(t('submissions.allCategoriesRequired') || "Please rate all categories", "error")
      return
    }

    // Calculate overall rating as average of categories
    const overallRating = Math.round((cats.quality + cats.timeliness + cats.communication + cats.value) / 4)

    try {
      setIsProcessing(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const formData = new FormData()
      const entrepreneurUserId = selectedSubmission.entrepreneur_profile.user_id ||
                                  selectedSubmission.entrepreneur_profile.entrepreneur_user_id ||
                                  selectedSubmission.user?.id

      if (!entrepreneurUserId) {
        throw new Error('Cannot find entrepreneur user ID')
      }

      formData.append('reviewed_user_id', entrepreneurUserId)
      formData.append('job_id', selectedSubmission.job.id)
      formData.append('rating', overallRating)
      formData.append('comment', (comment || '').trim())
      formData.append('rating_quality', cats.quality)
      formData.append('rating_timeliness', cats.timeliness)
      formData.append('rating_communication', cats.communication)
      formData.append('rating_value', cats.value)

      // Append images with types
      reviewImages.forEach((image) => {
        formData.append('images', image)
      })
      formData.append('image_types', JSON.stringify(reviewImageTypes))

      const addReviewResponse = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uProfile.token}`,
        },
        body: formData
      })

      if(!addReviewResponse.ok) {
        const errorData = await addReviewResponse.json()
        throw new Error(errorData.message || 'Failed to submit review')
      }

      const responseData = await addReviewResponse.json()
      showNotification(responseData.message || t('submissions.reviewSubmitted') || "Review submitted successfully!", "success")

      // Reset form
      setIsAddingReview(false)
      setComment('')
      setReviewImages([])
      setReviewImageTypes([])
      setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })

      // Clean up previews
      reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
      setReviewImagePreviews([])

      // Refresh submissions to update UI
      invalidateSubmissions()
    } catch (error) {
      console.error("Error submitting review:", error)
      showNotification(error.message || "Failed to submit review", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchUserReviews = async () => {
    try {
      setLoadingReviews(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(`${API_BASE_URL}/api/reviews/reviewer/${uProfile.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${uProfile.token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setUserReviews(data.reviews || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      showNotification("Failed to load reviews", "error")
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleViewReviews = () => {
    setShowViewReviews(true)
    fetchUserReviews()
  }

  // Fetch and show entrepreneur profile modal
  const handleViewProfile = async (e, submission) => {
    e.stopPropagation()

    const userId = submission.entrepreneur_profile.user_id || submission.entrepreneur_profile.entrepreneur_user_id
    if (!userId || isLoadingProfile) return

    setIsLoadingProfile(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${uProfile.token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      setSelectedProfile(data.profile)
      setShowProfileModal(true)
    } catch (error) {
      console.error("Error fetching entrepreneur profile:", error)
      showNotification("Failed to load profile", "error")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Normalize job status to handle various backend status values
  const normalizeStatus = (status) => {
    const knownStatuses = ["open", "accepted", "ongoing", "completed"]
    // Treat "pending" or any unknown status as "open"
    return knownStatuses.includes(status) ? status : "open"
  }

  // Updated to use job status instead of bid status
  const getStatusInfo = (status) => {
    const normalizedStatus = normalizeStatus(status)
    const statusMap = {
      open: { class: "status-open", icon: FolderOpen, label: t('submissions.open') },
      accepted: { class: "status-accepted", icon: CheckCircle, label: t('submissions.approved') },
      ongoing: { class: "status-ongoing", icon: PlayCircle, label: t('submissions.ongoing') },
      completed: { class: "status-completed", icon: CheckCircle, label: t('submissions.completed') },
    }
    return statusMap[normalizedStatus]
  }

  // Updated to count by job status (respects property filter)
  const getStatusCount = (status) => {
    // Use backend counts when no property/job filter is active (instant, no re-filtering)
    if (selectedProperty === "all" && selectedJob === "all" && submissionCounts) {
      const countMap = {
        all: Number(submissionCounts.total) || 0,
        open: Number(submissionCounts.open) || 0,
        accepted: Number(submissionCounts.approved) || 0,
        ongoing: Number(submissionCounts.ongoing) || 0,
        completed: Number(submissionCounts.completed) || 0,
        archived: Number(submissionCounts.archived) || 0,
      }
      if (countMap[status] !== undefined) return countMap[status]
    }

    // Fallback: client-side count when property/job filter is active
    let filtered = submissions
    if (selectedProperty !== "all") {
      filtered = filtered.filter((sub) => String(sub.job.property_id) === selectedProperty)
    }
    if (status === "all") return filtered.length
    return filtered.filter((sub) => normalizeStatus(sub.job.status) === status).length
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // === Bid Comparison (same-job only) ===
  const [compareJobId, setCompareJobId] = useState(null)

  const toggleCompare = (bidId, jobId, e) => {
    e.stopPropagation()
    setCompareBids(prev => {
      const next = new Set(prev)
      if (next.has(bidId)) {
        next.delete(bidId)
        if (next.size === 0) setCompareJobId(null)
      } else {
        // Lock to same job
        if (compareJobId && compareJobId !== jobId) {
          toast.error(t('submissions.compareSameJob') || 'You can only compare bids for the same job')
          return prev
        }
        if (next.size >= 5) {
          toast.error(t('submissions.compareMax') || 'You can compare up to 5 bids')
          return prev
        }
        if (!compareJobId) setCompareJobId(jobId)
        next.add(bidId)
      }
      return next
    })
  }

  const comparedSubmissions = submissions.filter(s => compareBids.has(s.bid.id))
  const compareJobTitle = comparedSubmissions[0]?.job?.title || ''

  // Clear selection when switching tabs
  useEffect(() => { setCompareBids(new Set()); setCompareJobId(null) }, [activeTab])

  // Find best values among compared bids
  const compareBest = (() => {
    if (comparedSubmissions.length < 2) return {}
    const amounts = comparedSubmissions.map(s => Number(s.bid.amount))
    const ratings = comparedSubmissions.map(s => Number(s.entrepreneur_profile.average_rating) || 0)
    const years = comparedSubmissions.map(s => Number(s.entrepreneur_profile.years_in_business) || 0)
    return {
      lowestAmount: Math.min(...amounts),
      highestRating: Math.max(...ratings),
      mostYears: Math.max(...years),
    }
  })()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const DetailField = ({ label, value, icon: Icon }) => (
    <div className="subs-detail-field">
      <div className="subs-detail-label">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>
      <div className="subs-detail-value">{value}</div>
    </div>
  )

  const categories = [...new Set(submissions.map((sub) => sub.job.category))]

  // Get unique properties for dropdown filter (using property_id as key for reliable filtering)
  const uniqueProperties = submissions.reduce((acc, sub) => {
    const propId = sub.job.property_id
    if (propId && !acc.find(p => p.id === propId)) {
      acc.push({ id: propId, name: sub.property_name })
    }
    return acc
  }, [])

  // Get unique jobs for selected property
  const uniqueJobs = submissions
    .filter(sub => selectedProperty === "all" || String(sub.job.property_id) === selectedProperty)
    .reduce((acc, sub) => {
      const jobId = sub.job.id
      if (jobId && !acc.find(j => j.id === jobId)) {
        acc.push({ id: jobId, title: sub.job.title })
      }
      return acc
    }, [])

  // Updated tabs to match job status values
  const tabs = [
    { id: "all", label: t('submissions.allSubmissions') },
    { id: "open", label: t('submissions.open') },
    { id: "accepted", label: t('submissions.approved') },
    { id: "ongoing", label: t('submissions.ongoing') },
    { id: "completed", label: t('submissions.completed') },
    { id: "archived", label: t('submissions.archived') || 'Archived' },
  ]

  useEffect(() => {
    let filtered = [...submissions]

    // Filter by selected property (using property_id)
    if (selectedProperty !== "all") {
      filtered = filtered.filter((sub) => String(sub.job.property_id) === selectedProperty)
    }

    // Filter by selected job
    if (selectedJob !== "all") {
      filtered = filtered.filter((sub) => String(sub.job.id) === selectedJob)
    }

    // Updated to filter by job status (using normalized status)
    if (activeTab !== "all") {
      filtered = filtered.filter((sub) => normalizeStatus(sub.job.status) === activeTab)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.entrepreneur_profile.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (locationFilter) {
      filtered = filtered.filter((sub) => sub.property_address.toLowerCase().includes(locationFilter.toLowerCase()))
    }

    if (categoryFilter) {
      filtered = filtered.filter((sub) => sub.job.category === categoryFilter)
    }

    if (amountRange.min) {
      filtered = filtered.filter((sub) => sub.bid.amount >= Number.parseFloat(amountRange.min))
    }
    if (amountRange.max) {
      filtered = filtered.filter((sub) => sub.bid.amount <= Number.parseFloat(amountRange.max))
    }

    if (dateRange.start) {
      filtered = filtered.filter((sub) => new Date(sub.bid.created_at) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filtered = filtered.filter((sub) => new Date(sub.bid.created_at) <= new Date(dateRange.end))
    }

    setFilteredSubmissions(filtered)
  }, [searchTerm, locationFilter, categoryFilter, amountRange, dateRange, submissions, activeTab, selectedProperty, selectedJob])

  return (
    <div className="subs-submissions-container">
      <Nav />

      <div className="subs-submissions-content">
        {/* Compact Header */}
        <header className="subs-page-header">
          <div className="subs-header-left">
            <h1>{t('submissions.title')}</h1>
            <span className="subs-submission-count">{getStatusCount("all")} {t('submissions.bids')}</span>
          </div>
          <div className="subs-header-right">
            <button className="subs-btn subs-btn-secondary" onClick={handleViewReviews}>
              <Star size={16} />
              <span>{t('submissions.myReviews')}</span>
            </button>
          </div>
        </header>

        {/* Row 1: Search + Status Tabs */}
        <div className="subs-filter-bar">
          <div className="subs-filter-bar-left">
            <div className="subs-search-compact">
              <Search size={15} />
              <input
                type="text"
                placeholder={t('submissions.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="subs-clear-btn" onClick={() => setSearchTerm("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="subs-status-pills">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`subs-pill ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                  {tab.id !== "archived" && <span>{getStatusCount(tab.id)}</span>}
                  {tab.id === "archived" && archivedLoaded && <span>{archivedJobs.length}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Property + Job dropdowns + Filters toggle */}
        <div className="subs-filter-bar-row2">
          {/* Property dropdown */}
          <div className={`subs-custom-dd ${openSubsDropdown === 'property' ? 'open' : ''}`}>
            <button className="subs-custom-dd-trigger" onClick={() => setOpenSubsDropdown(openSubsDropdown === 'property' ? null : 'property')}>
              <Building2 size={13} />
              <span>{selectedProperty === 'all' ? `${t('submissions.allProperties')} (${uniqueProperties.length})` : uniqueProperties.find(p => String(p.id) === selectedProperty)?.name || selectedProperty}</span>
              <ChevronDown size={13} className="subs-dd-chevron" />
            </button>
            {openSubsDropdown === 'property' && (
              <>
                <div className="subs-dd-backdrop" onClick={() => setOpenSubsDropdown(null)} />
                <div className="subs-dd-menu">
                  <div className={`subs-dd-option ${selectedProperty === 'all' ? 'active' : ''}`} onClick={() => { setSelectedProperty('all'); setSelectedJob('all'); setOpenSubsDropdown(null); }}>
                    {t('submissions.allProperties')} ({uniqueProperties.length})
                    {selectedProperty === 'all' && <Check size={14} />}
                  </div>
                  {uniqueProperties.map((property) => (
                    <div key={property.id} className={`subs-dd-option ${selectedProperty === String(property.id) ? 'active' : ''}`} onClick={() => { setSelectedProperty(String(property.id)); setSelectedJob('all'); setOpenSubsDropdown(null); }}>
                      {property.name}
                      {selectedProperty === String(property.id) && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Job dropdown */}
          <div className={`subs-custom-dd ${openSubsDropdown === 'job' ? 'open' : ''}`}>
            <button className="subs-custom-dd-trigger" onClick={() => setOpenSubsDropdown(openSubsDropdown === 'job' ? null : 'job')}>
              <FileText size={13} />
              <span>{selectedJob === 'all' ? `${t('submissions.allJobs')} (${uniqueJobs.length})` : uniqueJobs.find(j => String(j.id) === selectedJob)?.title || selectedJob}</span>
              <ChevronDown size={13} className="subs-dd-chevron" />
            </button>
            {openSubsDropdown === 'job' && (
              <>
                <div className="subs-dd-backdrop" onClick={() => setOpenSubsDropdown(null)} />
                <div className="subs-dd-menu">
                  <div className={`subs-dd-option ${selectedJob === 'all' ? 'active' : ''}`} onClick={() => { setSelectedJob('all'); setOpenSubsDropdown(null); }}>
                    {t('submissions.allJobs')} ({uniqueJobs.length})
                    {selectedJob === 'all' && <Check size={14} />}
                  </div>
                  {uniqueJobs.map((job) => (
                    <div key={job.id} className={`subs-dd-option ${selectedJob === String(job.id) ? 'active' : ''}`} onClick={() => { setSelectedJob(String(job.id)); setOpenSubsDropdown(null); }}>
                      {job.title}
                      {selectedJob === String(job.id) && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            className={`subs-filter-toggle ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            {t('submissions.filters')}
            <ChevronDown size={13} className={showFilters ? "rotated" : ""} />
          </button>
        </div>

        {showFilters && (
          <div className="subs-filters-panel">
            <div className="subs-filters-grid">
              <div className="subs-filter-item">
                <label>{t('submissions.location')}</label>
                <input
                  type="text"
                  placeholder={t('submissions.cityOrAddress')}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="subs-filter-item">
                <label>{t('submissions.category')}</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">{t('submissions.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="subs-filter-item">
                <label>{t('submissions.minAmount')}</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>{t('submissions.maxAmount')}</label>
                <input
                  type="number"
                  placeholder="$999,999"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>{t('submissions.fromDate')}</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>{t('submissions.toDate')}</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
            <button className="subs-clear-all-btn" onClick={clearFilters}>
              <X size={16} />
              {t('submissions.clearAllFilters')}
            </button>
          </div>
        )}

        {isAddingReview && selectedSubmission && (() => {
          const closeReviewModal = () => {
            setIsAddingReview(false)
            reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
            setReviewImagePreviews([])
            setReviewImages([])
            setReviewImageTypes([])
            setCategoryRatings({ quality: 0, timeliness: 0, communication: 0, value: 0 })
            setComment('')
          }
          const cats = categoryRatings
          const avgRating = (cats.quality && cats.timeliness && cats.communication && cats.value)
            ? ((cats.quality + cats.timeliness + cats.communication + cats.value) / 4).toFixed(1)
            : '—'
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

          const S = {
            overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' },
            modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' },
            header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' },
            title: { margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' },
            subtitle: { margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' },
            closeBtn: { background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: '#9ca3af', borderRadius: 6 },
            body: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
            section: { background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid #e5e7eb' },
            sectionLabel: { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.625rem' },
            catRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' },
            catLabel: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
            catStars: { display: 'flex', gap: '0.25rem' },
            star: (active) => ({ fontSize: '1.75rem', background: 'none', border: 'none', color: active ? '#f59e0b' : '#d1d5db', cursor: 'pointer', padding: '0.125rem', lineHeight: 1, transition: 'all 0.15s' }),
            overall: { display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '1rem', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', borderRadius: 10 },
            overallVal: { fontSize: '1.5rem', fontWeight: 800, color: '#92400e', letterSpacing: '-0.02em' },
            overallLabel: { fontSize: '0.8125rem', color: '#92400e', fontWeight: 500 },
            textarea: { width: '100%', padding: '0.875rem', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', color: '#111827', resize: 'vertical', minHeight: 110, background: '#f9fafb', boxSizing: 'border-box' },
            charCount: { fontSize: '0.6875rem', color: '#9ca3af', marginTop: '0.375rem', textAlign: 'right' },
            hint: { fontSize: '0.75rem', color: '#9ca3af', margin: '-0.25rem 0 0.625rem 0' },
            uploadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#fff', border: '2px dashed #d1d5db', borderRadius: 10, color: '#6b7280', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', width: '100%' },
            imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' },
            imageItem: { position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1px solid #e5e7eb' },
            imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
            imageTypeSelect: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.25rem', fontSize: '0.625rem', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', textAlign: 'center', fontWeight: 500 },
            removeBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
            footer: { display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' },
            cancelBtn: { flex: 1, padding: '0.625rem 1.25rem', background: '#fff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
            submitBtn: (disabled) => ({ flex: 1, padding: '0.625rem 1.25rem', background: '#00A5A9', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }),
          }

          const InlineCatStars = ({ label, value, onChange }) => (
            <div style={{ ...S.catRow, ...(label === (t('submissions.categoryQuality') || 'Quality of Work') ? { paddingTop: '0.5rem' } : {}) }}>
              <span style={S.catLabel}>{label}</span>
              <div style={S.catStars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" style={S.star(value >= n)} onClick={() => onChange(n)} onMouseEnter={(e) => { e.target.style.transform = 'scale(1.2)' }} onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}>★</button>
                ))}
              </div>
            </div>
          )

          return (
            <div style={S.overlay} onClick={closeReviewModal}>
              <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={S.header}>
                  <div>
                    <h2 style={S.title}>{t('submissions.leaveReview') || 'Leave a Review'}</h2>
                    <p style={S.subtitle}>{selectedSubmission.entrepreneur_profile?.company_name} — {selectedSubmission.job?.title}</p>
                  </div>
                  <button style={S.closeBtn} onClick={closeReviewModal}><X size={20} /></button>
                </div>

                {/* Body */}
                <div style={S.body}>
                  {/* Category Ratings */}
                  <div style={S.section}>
                    <label style={S.sectionLabel}>{t('submissions.rateCategories') || 'Rate by Category'}</label>
                    <InlineCatStars label={t('submissions.categoryQuality') || 'Quality of Work'} value={cats.quality} onChange={v => setCategoryRatings(p => ({ ...p, quality: v }))} />
                    <InlineCatStars label={t('submissions.categoryTimeliness') || 'Timeliness'} value={cats.timeliness} onChange={v => setCategoryRatings(p => ({ ...p, timeliness: v }))} />
                    <InlineCatStars label={t('submissions.categoryCommunication') || 'Communication'} value={cats.communication} onChange={v => setCategoryRatings(p => ({ ...p, communication: v }))} />
                    <div style={{ ...S.catRow, borderBottom: 'none' }}>
                      <span style={S.catLabel}>{t('submissions.categoryValue') || 'Value for Money'}</span>
                      <div style={S.catStars}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" style={S.star(cats.value >= n)} onClick={() => setCategoryRatings(p => ({ ...p, value: n }))} onMouseEnter={(e) => { e.target.style.transform = 'scale(1.2)' }} onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}>★</button>
                        ))}
                      </div>
                    </div>

                    {allRated && (
                      <div style={S.overall}>
                        <Star size={20} fill="#f59e0b" stroke="#f59e0b" />
                        <span style={S.overallVal}>{avgRating}</span>
                        <span style={S.overallLabel}>{t('submissions.overallRating') || 'Overall Rating'}</span>
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label style={S.sectionLabel}>{t('submissions.shareExperience') || 'Share your experience'}</label>
                    <textarea
                      style={S.textarea}
                      placeholder={t('submissions.reviewPlaceholder') || 'Tell us about your experience...'}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      onFocus={(e) => { e.target.style.borderColor = '#00A5A9'; e.target.style.boxShadow = '0 0 0 3px rgba(0,165,169,0.1)'; e.target.style.background = '#fff' }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f9fafb' }}
                    />
                    <div style={S.charCount}>
                      {comment.length} {t('submissions.characters') || 'characters'}
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <label style={S.sectionLabel}>{t('submissions.addPhotos') || 'Add Photos'}</label>
                    <p style={S.hint}>{t('submissions.beforeAfterHint') || 'Upload before and after photos to showcase the work (max 5)'}</p>

                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} id="rv-review-images" />
                    <label htmlFor="rv-review-images" style={S.uploadBtn} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00A5A9'; e.currentTarget.style.color = '#00A5A9'; e.currentTarget.style.background = '#f0fdfa' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#fff' }}>
                      <FileText size={18} />
                      <span>{t('submissions.chooseImages') || 'Choose Images'}</span>
                    </label>

                    {reviewImagePreviews.length > 0 && (
                      <div style={S.imageGrid}>
                        {reviewImagePreviews.map((preview, index) => (
                          <div key={index} style={S.imageItem}>
                            <img src={preview} alt={`Preview ${index + 1}`} style={S.imagePreview} />
                            <select style={S.imageTypeSelect} value={reviewImageTypes[index] || 'general'} onChange={(e) => updateImageType(index, e.target.value)}>
                              <option value="before">{t('submissions.photoBefore') || 'Before'}</option>
                              <option value="after">{t('submissions.photoAfter') || 'After'}</option>
                              <option value="general">{t('submissions.photoGeneral') || 'General'}</option>
                            </select>
                            <button type="button" style={S.removeBtn} onClick={() => removeImage(index)}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={S.footer}>
                  <button style={S.cancelBtn} onClick={closeReviewModal} disabled={isProcessing}>
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    style={S.submitBtn(isProcessing || !allRated)}
                    onClick={handleSubmitReview}
                    disabled={isProcessing || !allRated}
                  >
                    {isProcessing ? (
                      <span>{t('submissions.submitting') || 'Submitting...'}</span>
                    ) : (
                      <><Star size={16} /><span>{t('submissions.submitReview') || 'Submit Review'}</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* View Reviews Modal */}
        {showViewReviews && selectedSubmission && (
          <div className="bid-modal-overlay" onClick={() => setShowViewReviews(false)}>
            <div className="bid-modal-content view-reviews-modal" onClick={(e) => e.stopPropagation()}>
              <div className="bid-modal-header">
                <h2>{selectedSubmission?.review ? t('submissions.reviewDetails') : t('submissions.myReviews')}</h2>
                <button
                  className="bid-modal-close"
                  onClick={() => setShowViewReviews(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bid-modal-body">
                {/* Show single submission review if available */}
                {selectedSubmission?.review ? (
                  <div className="reviews-list">
                    <div className="review-card">
                      <div className="review-card-header">
                        <div className="review-job-info">
                          <h4>{selectedSubmission.job.title}</h4>
                          <p className="review-contractor">
                            <User size={14} />
                            <strong>{t('submissions.reviewed')}</strong> {selectedSubmission.entrepreneur_profile?.company_name || `${selectedSubmission.user.first_name} ${selectedSubmission.user.last_name}`}
                          </p>
                          {selectedSubmission.entrepreneur_profile.company_name && (
                            <p className="review-company">
                              <Building2 size={14} />
                              {selectedSubmission.entrepreneur_profile.company_name}
                            </p>
                          )}
                        </div>
                        <div className="review-rating-display">
                          <div className="review-stars-small">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < selectedSubmission.review.rating ? "#facc15" : "none"}
                                stroke="#facc15"
                              />
                            ))}
                          </div>
                          <span className="review-rating-number">
                            {selectedSubmission.review.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="review-metadata">
                        <div className="review-meta-item">
                          <Calendar size={14} />
                          <span>{t('submissions.reviewedOn')} {formatDate(selectedSubmission.review.created_at)}</span>
                        </div>
                        <div className="review-meta-item">
                          <User size={14} />
                          <span>{t('submissions.byYou')}</span>
                        </div>
                      </div>

                      <div className="review-card-body">
                        <div className="review-comment-section">
                          <label>{t('submissions.yourReview')}</label>
                          <p className="review-comment">{selectedSubmission.review.comment}</p>
                        </div>

                        {selectedSubmission.review.images && selectedSubmission.review.images.length > 0 && (
                          <div className="review-images-section">
                            <label>{t('submissions.attachedPhotos')} ({selectedSubmission.review.images.length}):</label>
                            <div className="review-images-grid">
                              {selectedSubmission.review.images.map((image, index) => (
                                <div key={index} className="review-image-item">
                                  <img
                                    src={image.image_url}
                                    alt={`Review ${index + 1}`}
                                    onClick={() => window.open(image.image_url, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review received FROM the entrepreneur */}
                    {pmReceivedReview && pmReceivedReview.length > 0 && (
                      <div className="review-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: '1rem' }}>
                        <div className="review-card-header">
                          <div className="review-job-info">
                            <h4 style={{ color: '#15803d' }}>{t('submissions.reviewFromContractor') || 'Review from Contractor'}</h4>
                            <p className="review-contractor">
                              <User size={14} />
                              {pmReceivedReview[0].reviewer_first_name} {pmReceivedReview[0].reviewer_last_name}
                            </p>
                          </div>
                          <div className="review-rating-display">
                            <div className="review-stars-small">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} fill={i < pmReceivedReview[0].rating ? "#facc15" : "none"} stroke="#facc15" />
                              ))}
                            </div>
                            <span className="review-rating-number">{pmReceivedReview[0].rating}/5</span>
                          </div>
                        </div>

                        {(pmReceivedReview[0].quality_rating || pmReceivedReview[0].timeliness_rating || pmReceivedReview[0].communication_rating || pmReceivedReview[0].value_rating) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', padding: '0.5rem 0' }}>
                            {pmReceivedReview[0].quality_rating > 0 && (
                              <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{t('submissions.categoryQuality') || 'Quality'}: {'★'.repeat(pmReceivedReview[0].quality_rating)}{'☆'.repeat(5 - pmReceivedReview[0].quality_rating)}</span>
                            )}
                            {pmReceivedReview[0].timeliness_rating > 0 && (
                              <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{t('submissions.categoryTimeliness') || 'Timeliness'}: {'★'.repeat(pmReceivedReview[0].timeliness_rating)}{'☆'.repeat(5 - pmReceivedReview[0].timeliness_rating)}</span>
                            )}
                            {pmReceivedReview[0].communication_rating > 0 && (
                              <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{t('submissions.categoryCommunication') || 'Communication'}: {'★'.repeat(pmReceivedReview[0].communication_rating)}{'☆'.repeat(5 - pmReceivedReview[0].communication_rating)}</span>
                            )}
                            {pmReceivedReview[0].value_rating > 0 && (
                              <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{t('submissions.categoryValue') || 'Value'}: {'★'.repeat(pmReceivedReview[0].value_rating)}{'☆'.repeat(5 - pmReceivedReview[0].value_rating)}</span>
                            )}
                          </div>
                        )}

                        <div className="review-card-body">
                          <div className="review-comment-section">
                            <label>{t('submissions.theirComment') || 'Their Comment'}</label>
                            <p className="review-comment">{pmReceivedReview[0].comment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : loadingReviews ? (
                  <div className="reviews-loading">
                    <div className="subs-spinner"></div>
                    <p>{t('submissions.loadingReviews')}</p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="reviews-empty">
                    <Star size={48} strokeWidth={1.5} />
                    <h3>{t('submissions.noReviewsYet')}</h3>
                    <p>{t('submissions.noReviewsDescription')}</p>
                  </div>
                ) : (
                  <div className="reviews-list">
                    {userReviews.map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-card-header">
                          <div className="review-job-info">
                            <h4>{review.job_title || "Untitled Job"}</h4>
                            <p className="review-contractor">
                              <User size={14} />
                              <strong>{t('submissions.reviewed')}</strong> {review.reviewed_display_name || `${review.reviewed_first_name} ${review.reviewed_last_name}`}
                            </p>
                            {review.reviewed_company_name && (
                              <p className="review-company">
                                <Building2 size={14} />
                                {review.reviewed_company_name}
                              </p>
                            )}
                          </div>
                          <div className="review-rating-display">
                            <div className="review-stars-small">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  fill={i < review.rating ? "#facc15" : "none"}
                                  stroke="#facc15"
                                />
                              ))}
                            </div>
                            <span className="review-rating-number">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>

                        <div className="review-metadata">
                          <div className="review-meta-item">
                            <Calendar size={14} />
                            <span>{t('submissions.reviewedOn')} {formatDate(review.created_at)}</span>
                          </div>
                          <div className="review-meta-item">
                            <User size={14} />
                            <span>{t('submissions.byYou')}</span>
                          </div>
                        </div>

                        <div className="review-card-body">
                          <div className="review-comment-section">
                            <label>{t('submissions.yourReview')}</label>
                            <p className="review-comment">{review.comment}</p>
                          </div>

                          {review.images && review.images.length > 0 && (
                            <div className="review-images-section">
                              <label>{t('submissions.attachedPhotos')} ({review.images.length}):</label>
                              <div className="review-images-grid">
                                {review.images.map((image, index) => (
                                  <div key={index} className="review-image-item">
                                    <img
                                      src={image.image_url}
                                      alt={`Review ${index + 1}`}
                                      onClick={() => window.open(image.image_url, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submission Details Modal - Redesigned */}
        {showDetailsModal && selectedSubmission?.job && (
          <div className="details-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="details-content" onClick={(e) => e.stopPropagation()}>
              {/* Navy Header */}
              <div className="details-header">
                <div className="details-title-wrapper">
                  <FileText size={20} className="details-icon" />
                  <div>
                    <h2>{t('submissions.submissionDetails')}</h2>
                    <p className="details-subtitle">{selectedSubmission.job.title}</p>
                  </div>
                </div>
                <button className="details-close-btn" onClick={() => setShowDetailsModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="details-body">
                {/* Top Card - Status & Amount */}
                <div className="details-top-card">
                  <div className="details-top-left">
                    <span className={`details-status-badge status-${normalizeStatus(selectedSubmission.job.status)}`}>
                      {getStatusInfo(selectedSubmission.job.status)?.label || selectedSubmission.job.status}
                    </span>
                    <span className="details-bid-status">
                      {t('submissions.bidStatus')} {selectedSubmission.bid.status || "pending"}
                    </span>
                  </div>
                  <div className="details-amount">
                    {formatCurrency(selectedSubmission.bid.amount)}
                  </div>
                </div>

                {/* Job Information Card */}
                <div className="details-card">
                  <div className="details-card-header">
                    <FileText size={16} />
                    <span>{t('submissions.jobInformation')}</span>
                  </div>
                  <div className="details-card-body">
                    <div className="details-info-row">
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.category')}</span>
                        <span className="details-value">{selectedSubmission.job.category}</span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.urgency')}</span>
                        <span className="details-value">{selectedSubmission.job.urgency}</span>
                      </div>
                    </div>
                    <div className="details-info-row">
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.dueDate')}</span>
                        <span className="details-value">{formatDate(selectedSubmission.job.due_date)}</span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.duration')}</span>
                        <span className="details-value">{selectedSubmission.job.estimated_duration_days} {t('submissions.days')}</span>
                      </div>
                    </div>
                    <div className="details-info-row">
                      <div className="details-info-item full-width">
                        <span className="details-label">{t('submissions.budgetRange')}</span>
                        <span className="details-value">{formatCurrency(selectedSubmission.job.budget_min)} - {formatCurrency(selectedSubmission.job.budget_max)}</span>
                      </div>
                    </div>
                    <div className="details-info-row">
                      <div className="details-info-item full-width">
                        <span className="details-label">{t('submissions.property')}</span>
                        <span className="details-value">{selectedSubmission.property_address}</span>
                      </div>
                    </div>
                    {selectedSubmission.job.description && (
                      <div className="details-description">
                        <span className="details-label">{t('submissions.description')}</span>
                        <p>{selectedSubmission.job.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contractor Information Card */}
                <div className="details-card">
                  <div className="details-card-header">
                    <Building2 size={16} />
                    <span>{t('submissions.contractorInformation')}</span>
                  </div>
                  <div className="details-card-body">
                    <div className="details-contractor-main">
                      <div
                        className="details-contractor-name details-contractor-link"
                        onClick={(e) => handleViewProfile(e, selectedSubmission)}
                        title={t('submissions.viewProfile')}
                      >
                        {selectedSubmission.entrepreneur_profile.company_name}
                      </div>
                      <div className="details-contractor-rating">
                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                        <span>{selectedSubmission.entrepreneur_profile.average_rating}</span>
                        <span className="details-review-count">({selectedSubmission.entrepreneur_profile.total_reviews} {t('submissions.reviews')})</span>
                      </div>
                    </div>
                    <div className="details-info-row">
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.contact')}</span>
                        <span className="details-value">
                          {selectedSubmission.entrepreneur_profile?.company_name || `${selectedSubmission.user.first_name} ${selectedSubmission.user.last_name}`}
                          {selectedSubmission.entrepreneur_profile?.company_name && (
                            <span style={{ display: 'block', fontSize: '0.8em', color: '#9ca3af', fontWeight: 400 }}>
                              {selectedSubmission.user.first_name} {selectedSubmission.user.last_name}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-label">{t('submissions.license')}</span>
                        <span className="details-value">{selectedSubmission.entrepreneur_profile.license_number || "N/A"}</span>
                      </div>
                    </div>
                    <div className="details-info-row">
                      <div className="details-info-item full-width">
                        <span className="details-label">{t('submissions.yearsInBusiness')}</span>
                        <span className="details-value">{selectedSubmission.entrepreneur_profile.years_in_business || "N/A"} {t('submissions.years')}</span>
                      </div>
                    </div>
                    {selectedSubmission.entrepreneur_profile.specializations?.length > 0 && (
                      <div className="details-specializations">
                        <span className="details-label">{t('submissions.specializations')}</span>
                        <div className="details-tags">
                          {selectedSubmission.entrepreneur_profile.specializations.map((spec, index) => (
                            <span key={index} className="details-tag">{spec}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bid Message Card (if exists) */}
                {selectedSubmission.bid.message && (
                  <div className="details-card">
                    <div className="details-card-header">
                      <MessageCircle size={16} />
                      <span>{t('submissions.messageFromContractor')}</span>
                    </div>
                    <div className="details-card-body">
                      <p className="details-message">{selectedSubmission.bid.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Actions */}
              <div className="details-footer">
                {/* Delete Job button - pinned to the left */}
                {(normalizeStatus(selectedSubmission.job.status) === "open" || normalizeStatus(selectedSubmission.job.status) === "accepted") && (
                  <button
                    className="details-btn details-btn-danger"
                    style={{ marginRight: 'auto' }}
                    onClick={() => {
                      setDeleteJobId(selectedSubmission.job.id)
                      setShowDeleteJobConfirm(true)
                    }}
                    disabled={isProcessing}
                  >
                    <Trash2 size={16} />
                    {t('submissions.deleteJobBtn') || 'Delete Job'}
                  </button>
                )}
                {normalizeStatus(selectedSubmission.job.status) === "completed" && (
                  <button
                    className="details-btn details-btn-archive"
                    style={{ marginRight: 'auto' }}
                    onClick={() => {
                      setArchiveJobId(selectedSubmission.job.id)
                      setShowArchiveJobConfirm(true)
                    }}
                    disabled={isProcessing}
                  >
                    <FolderOpen size={16} />
                    {t('submissions.archiveJobBtn') || 'Archive Job'}
                  </button>
                )}
                {normalizeStatus(selectedSubmission.job.status) === "open" && selectedSubmission.bid.status === "pending" && (
                  <>
                    <button
                      className="details-btn details-btn-secondary"
                      onClick={() => handleDecline(selectedSubmission.bid.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? t('submissions.processing') : t('submissions.decline')}
                    </button>
                    <div className="details-slider-wrapper">
                      <SlideToConfirm
                        key={selectedSubmission.bid.id}
                        onConfirm={() => handleAccept(
                          selectedSubmission.bid.id,
                          selectedSubmission.job.id,
                          selectedSubmission.entrepreneur_profile.id
                        )}
                        label={t('submissions.slideToApprove')}
                        confirmLabel={t('submissions.approvedLabel')}
                        disabled={isProcessing}
                        isProcessing={isProcessing && processingBidId === selectedSubmission.bid.id}
                        isCompleted={processingBidId === selectedSubmission.bid.id && isProcessing}
                        variant="primary"
                      />
                    </div>
                  </>
                )}
                {/* Completed job: single Confirm button or confirmed status */}
                {selectedSubmission.bid.status === "approved" && normalizeStatus(selectedSubmission.job.status) === "completed" && (
                  <>
                    {!selectedSubmission.contract?.manager_completion_confirmed ? (
                      <div className="details-slider-wrapper details-slider-full">
                        <button
                          className="release-funds-btn"
                          onClick={() => {
                            setConfirmCompletionJobId(selectedSubmission.job.id)
                            setShowConfirmCompletionModal(true)
                          }}
                          disabled={isProcessing}
                        >
                          <CheckCircle size={18} />
                          {t('submissions.confirmCompletion') || 'Confirm Job Completion'}
                        </button>
                      </div>
                    ) : selectedSubmission.contract?.mutual_confirmation_completed_at ? (
                      <div className="details-status-message details-status-success">
                        <Star size={16} fill="#f59e0b" stroke="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
                        {t('submissions.bothConfirmed') || 'Job completion confirmed!'}
                      </div>
                    ) : null}
                  </>
                )}
                {selectedSubmission.bid.status === "approved" && normalizeStatus(selectedSubmission.job.status) !== "completed" && (
                  <>
                    <div className="details-status-message">
                      {t('submissions.bidApprovedWaiting')}
                    </div>
                    {(normalizeStatus(selectedSubmission.job.status) === "accepted" || normalizeStatus(selectedSubmission.job.status) === "open") && (
                      <button
                        className="details-btn details-btn-danger"
                        onClick={() => {
                          setCancelApprovalBidId(selectedSubmission.bid.id)
                          setShowCancelApprovalConfirm(true)
                        }}
                        disabled={isProcessing}
                      >
                        <XCircle size={16} />
                        {t('submissions.cancelApprovalBtn') || 'Cancel Acceptance'}
                      </button>
                    )}
                  </>
                )}
                {selectedSubmission.bid.status === "declined" && (
                  <div className="details-status-message">
                    {t('submissions.bidDeclined')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {activeTab === "archived" ? (
          /* Archived Jobs View */
          isLoadingArchived ? (
            <div className="subs-loading-state">
              <div className="subs-spinner"></div>
              <p>{t('submissions.loadingArchived') || 'Loading archived jobs...'}</p>
            </div>
          ) : archivedJobs.length === 0 ? (
            <div className="subs-empty-state">
              <FolderOpen size={48} />
              <h3>{t('submissions.noArchivedJobs') || 'No Archived Jobs'}</h3>
              <p>{t('submissions.noArchivedJobsDesc') || 'Jobs you archive will appear here.'}</p>
            </div>
          ) : (
            <div className="subs-bids-grid">
              {archivedJobs.map((job) => (
                <div key={job.id} className="subs-bid-card subs-archived-card">
                  <div className="subs-card-top">
                    <div className="subs-status-badge-subs archived">
                      <FolderOpen size={12} />
                      {t('submissions.archived') || 'Archived'}
                    </div>
                    <div className="subs-card-top-right">
                      {job.budget_min != null && job.budget_max != null && (
                        <span className="subs-bid-amount">${Number(job.budget_min).toLocaleString()} - ${Number(job.budget_max).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <h3 className="subs-job-title">{job.title}</h3>
                  <div className="subs-card-info">
                    <div className="subs-info-item">
                      <Calendar size={12} />
                      <span>{t('submissions.completedOn') || 'Completed'}: {new Date(job.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {job.category && (
                      <div className="subs-info-item">
                        <FileText size={12} />
                        <span>{job.category}</span>
                      </div>
                    )}
                  </div>
                  <div className="subs-card-actions">
                    <button
                      className="subs-restore-btn"
                      onClick={() => handleRestoreJob(job.id)}
                    >
                      <CheckCircle size={14} />
                      {t('submissions.restoreJob') || 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="subs-loading-state">
            <div className="subs-spinner"></div>
            <p>{t('submissions.loadingSubmissions')}</p>
          </div>
        ) : error ? (
          <div className="subs-empty-state">
            <FileText size={48} />
            <h3>{t('submissions.errorLoading')}</h3>
            <p>{error}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="subs-empty-state">
            <FileText size={48} />
            <h3>{t('submissions.noSubmissions')}</h3>
            <p>{t('submissions.adjustFilters')}</p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredSubmissions.map((submission) => {
              // Updated to use job status
              const statusInfo = getStatusInfo(submission.job.status)
              const StatusIcon = statusInfo.icon

              return (
                <div key={submission.bid.id} className={`subs-bid-card ${compareBids.has(submission.bid.id) ? 'subs-bid-selected' : ''}`} onClick={() => handleViewDetails(submission)}>
                  {/* Compare checkbox */}
                  <label className="subs-compare-check" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={compareBids.has(submission.bid.id)} onChange={(e) => toggleCompare(submission.bid.id, submission.job.id, e)} />
                    <span className="subs-compare-tick" />
                  </label>
                  {/* Top Row: Status + Amount + Favorite */}
                  <div className="subs-card-top">
                    <div className={`subs-status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </div>
                    <div className="subs-card-top-right">
                      <span className="subs-bid-amount">{formatCurrency(submission.bid.amount)}</span>
                      <button
                        className="subs-favorite-btn"
                        onClick={(e) => toggleFavorite(submission, e)}
                        aria-label={favorites.includes(submission.bid.id) ? t('submissions.removeFromFavorites') : t('submissions.addToFavorites')}
                      >
                        <Heart
                          size={16}
                          fill={favorites.includes(submission.bid.id) ? "#E74C3C" : "none"}
                          stroke={favorites.includes(submission.bid.id) ? "#E74C3C" : "#9ca3af"}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="subs-job-title">{submission.job.title}</h3>

                  {/* Contractor Row */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 1rem', marginBottom: '8px', background: 'none' }}
                  >
                    <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 7, background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                      {(submission.entrepreneur_profile.company_name || submission.user?.first_name || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                      {submission.entrepreneur_profile.company_name || `${submission.user?.first_name || ''} ${submission.user?.last_name || ''}`.trim() || 'Entrepreneur'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', flexShrink: 0, whiteSpace: 'nowrap' }}>★ {Number(submission.entrepreneur_profile.average_rating || 0).toFixed(1)}</span>
                    {submission.entrepreneur_profile.license_number && (
                      <BadgeCheck size={13} style={{ color: '#059669', flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 1rem 0.75rem 1rem' }}>
                    {submission.job.category && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: '0.6875rem', color: '#6b7280', fontWeight: 500 }}>
                        {submission.job.category}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: '0.6875rem', color: '#6b7280', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <MapPin size={10} />
                      {submission.property_address?.split(',')[0] || submission.property_address}
                    </span>
                  </div>

                  {/* Invoice strip — visible on the card once contractor submits an invoice */}
                  {submission.contract?.invoice_submitted_at && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 1rem',
                        margin: '0 1rem 0.75rem 1rem',
                        background: '#f0fbfb',
                        border: '1px solid #cffafe',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                      }}
                    >
                      <Receipt size={12} style={{ color: '#00A5A9', flexShrink: 0 }} />
                      <span style={{ color: '#0F223D', fontWeight: 600 }}>
                        {t('invoice.cardTitle') || "Contractor's Invoice"}
                      </span>
                      <span style={{ color: '#00A5A9', fontWeight: 700, marginLeft: 'auto' }}>
                        ${Number(submission.contract.invoice_total || 0).toFixed(2)}
                      </span>
                      {submission.contract.invoice_file_url && (
                        <a
                          href={submission.contract.invoice_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={submission.contract.invoice_file_name || (t('invoice.download') || 'Download invoice')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '3px 8px',
                            background: '#fff',
                            border: '1px solid #00A5A9',
                            borderRadius: 4,
                            color: '#00A5A9',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={11} />
                          <span>{t('invoice.download') || 'Download'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Row — only Chat/Review, card click handles details */}
                  {((submission.job.status === "accepted" || submission.job.status === "ongoing") || submission.job.status === "completed") && (
                    <div className="subs-card-actions">
                      {(submission.job.status === "accepted" || submission.job.status === "ongoing") && (
                        <button className="subs-chat-btn" onClick={(e) => { e.stopPropagation(); handleChat(submission); }}>
                          <MessageCircle size={16} />
                          <span>{t('submissions.chat') || 'Chat'}</span>
                        </button>
                      )}
                      {submission.job.status === "completed" && submission.contract?.mutual_confirmation_completed_at && (
                        <button className="subs-review-btn" onClick={(e) => { e.stopPropagation(); handleReview(submission); }}>
                          <Star size={14} />
                          <span>{submission.review ? (t('submissions.viewReview') || 'View Review') : (t('submissions.leaveReview') || 'Leave Review')}</span>
                        </button>
                      )}
                      {submission.job.status === "completed" && !submission.contract?.mutual_confirmation_completed_at && (
                        <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem' }}>
                          <Clock size={13} />
                          {t('submissions.awaitingConfirmation') || 'Pending confirmation'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Load More (cursor pagination) */}
        {hasNextPage && activeTab !== "archived" && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
            <button
              className="subs-details-btn"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{ padding: '0.75rem 2rem', fontSize: '0.9rem' }}
            >
              {isFetchingNextPage ? (
                <>
                  <span className="btn-spinner" style={{ width: 16, height: 16, marginRight: 8 }}></span>
                  {t('submissions.loadingMore') || 'Loading...'}
                </>
              ) : (
                t('submissions.loadMore') || 'Load More'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Compare Bar */}
      {compareBids.size >= 2 && (
        <div className="cmp-bar">
          <div className="cmp-bar-info">
            <Columns3 size={18} />
            <span><strong>{compareBids.size}</strong> {t('submissions.bidsSelected') || 'bids selected'}</span>
            <span className="cmp-bar-job">{compareJobTitle}</span>
          </div>
          <div className="cmp-bar-actions">
            <button className="cmp-bar-clear" onClick={() => { setCompareBids(new Set()); setCompareJobId(null) }}>
              <X size={14} /> {t('submissions.clearSelection') || 'Clear'}
            </button>
            <button className="cmp-bar-btn" onClick={() => setShowCompareModal(true)}>
              {t('submissions.compareBids') || 'Compare Bids'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal — Card Columns Layout */}
      {showCompareModal && comparedSubmissions.length >= 2 && (
        <div className="cmp-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="cmp-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cmp-modal-header">
              <div className="cmp-modal-title">
                <Columns3 size={20} />
                <div>
                  <h2>{t('submissions.compareTitle') || 'Compare Bids'}</h2>
                  <p className="cmp-modal-subtitle">{compareJobTitle} — {comparedSubmissions.length} {t('submissions.bidsSelected') || 'bids'}</p>
                </div>
              </div>
              <button className="details-close-btn" onClick={() => setShowCompareModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable columns */}
            <div className="cmp-modal-body">
              <div className="cmp-columns">
                {comparedSubmissions.map(sub => {
                  const amt = Number(sub.bid.amount)
                  const rating = Number(sub.entrepreneur_profile.average_rating) || 0
                  const yrs = Number(sub.entrepreneur_profile.years_in_business) || 0
                  const isBestPrice = comparedSubmissions.length >= 2 && amt === compareBest.lowestAmount
                  const isBestRating = comparedSubmissions.length >= 2 && rating === compareBest.highestRating && rating > 0
                  const isMostExp = comparedSubmissions.length >= 2 && yrs === compareBest.mostYears && yrs > 0

                  return (
                    <div key={sub.bid.id} className="cmp-col">
                      {/* Contractor header */}
                      <div className="cmp-col-head">
                        <div className="cmp-col-avatar">
                          {(sub.entrepreneur_profile.company_name || sub.user?.first_name || '?')[0].toUpperCase()}
                        </div>
                        <div className="cmp-col-name">
                          <strong>{sub.entrepreneur_profile.company_name || `${sub.user?.first_name} ${sub.user?.last_name}`}</strong>
                          {rating > 0 && (
                            <span className={`cmp-col-rating ${isBestRating ? 'cmp-highlight' : ''}`}>
                              <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                              {rating.toFixed(1)} ({sub.entrepreneur_profile.total_reviews})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bid amount — prominent */}
                      <div className={`cmp-col-amount ${isBestPrice ? 'cmp-highlight' : ''}`}>
                        <span className="cmp-col-amount-label">{t('submissions.compareBidAmount') || 'Bid Amount'}</span>
                        <span className="cmp-col-amount-value">{formatCurrency(sub.bid.amount)}</span>
                        {isBestPrice && <span className="cmp-tag-best">{t('submissions.bestPrice') || 'Best Price'}</span>}
                      </div>

                      {/* Details grid */}
                      <div className="cmp-col-details">
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareYears') || 'Experience'}</span>
                          <span className={`cmp-col-val ${isMostExp ? 'cmp-highlight' : ''}`}>
                            {yrs ? `${yrs} yrs` : '—'}
                            {isMostExp && <CheckCircle size={12} />}
                          </span>
                        </div>
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareLicense') || 'License'}</span>
                          <span className="cmp-col-val">{sub.entrepreneur_profile.license_number || '—'}</span>
                        </div>
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareSpecializations') || 'Specializations'}</span>
                          <span className="cmp-col-val">{sub.entrepreneur_profile.specializations?.length ? sub.entrepreneur_profile.specializations.join(', ') : '—'}</span>
                        </div>
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareBudget') || 'Budget'}</span>
                          <span className="cmp-col-val">{sub.job.is_budget_hidden ? '—' : `${formatCurrency(sub.job.budget_min)} – ${formatCurrency(sub.job.budget_max)}`}</span>
                        </div>
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareDuration') || 'Duration'}</span>
                          <span className="cmp-col-val">{sub.job.estimated_duration_days ? `${sub.job.estimated_duration_days} days` : '—'}</span>
                        </div>
                        <div className="cmp-col-row">
                          <span className="cmp-col-label">{t('submissions.compareSubmitted') || 'Submitted'}</span>
                          <span className="cmp-col-val">{formatDate(sub.bid.created_at)}</span>
                        </div>
                      </div>

                      {/* Message */}
                      {sub.bid.message && (
                        <div className="cmp-col-message">
                          <span className="cmp-col-label">{t('submissions.compareMessage') || 'Message'}</span>
                          <p>{sub.bid.message.length > 120 ? sub.bid.message.slice(0, 120) + '…' : sub.bid.message}</p>
                        </div>
                      )}

                      {/* Action: Accept this bid */}
                      {sub.bid.status === 'pending' && (
                        <div className="cmp-col-action">
                          <button
                            className="cmp-accept-btn"
                            onClick={() => {
                              setShowCompareModal(false)
                              handleAccept(sub.bid.id, sub.job.id, sub.entrepreneur_profile.id)
                            }}
                            disabled={isProcessing}
                          >
                            <CheckCircle size={15} />
                            {t('submissions.acceptThisBid') || 'Accept This Bid'}
                          </button>
                        </div>
                      )}
                      {sub.bid.status === 'approved' && (
                        <div className="cmp-col-action">
                          <span className="cmp-accepted-badge">
                            <CheckCircle size={14} />
                            {t('submissions.approved') || 'Accepted'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Funds Confirmation Modal */}
      {showReleaseConfirm && (
        <div className="release-confirm-overlay" onClick={() => setShowReleaseConfirm(false)}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon">
              <CheckCircle size={32} />
            </div>
            <h3>{t('submissions.confirmRelease') || 'Confirm Work & Payment Completion'}</h3>
            <p>{t('submissions.confirmReleaseMessage') || 'Are you sure you want to mark this job as complete? This confirms that the contractor has finished the work satisfactorily and that the payment has been made.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => {
                  setShowReleaseConfirm(false)
                  setReleaseJobId(null)
                }}
                disabled={isProcessing}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                onClick={async () => {
                  if (releaseJobId) {
                    await handleApproveWork(releaseJobId)
                    setShowReleaseConfirm(false)
                    setReleaseJobId(null)
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="btn-spinner"></span>
                    {t('submissions.releasing') || 'Confirming...'}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    {t('submissions.confirmReleaseBtn') || 'Yes, Confirm Completion'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Job Completion Modal */}
      {showConfirmCompletionModal && (
        <div
          className="release-confirm-overlay"
          onClick={() => { setShowConfirmCompletionModal(false); setCompletionNote(''); }}
        >
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon">
              <CheckCircle size={32} />
            </div>
            <h3>{t('submissions.confirmCompletionTitle') || 'Confirm Job Completion'}</h3>
            <p>{t('submissions.confirmCompletionMessage') || 'By confirming, you acknowledge that this job has been completed satisfactorily. Both you and the contractor must confirm before reviews can be exchanged.'}</p>

            <div style={{ textAlign: 'left', marginTop: '0.75rem' }}>
              <label
                htmlFor="completion-note"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0F223D',
                  marginBottom: 6,
                }}
              >
                {t('submissions.completionNoteLabel') || 'Completion note'}
                <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
              </label>
              <textarea
                id="completion-note"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder={t('submissions.completionNotePlaceholder') || 'Briefly describe how the work was completed (required).'}
                rows={4}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: '#0F223D',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: 80,
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => {
                  setShowConfirmCompletionModal(false)
                  setConfirmCompletionJobId(null)
                  setCompletionNote('')
                }}
                disabled={isProcessing}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                onClick={() => {
                  if (confirmCompletionJobId) {
                    handleConfirmCompletion(confirmCompletionJobId, completionNote)
                  }
                }}
                disabled={isProcessing || !completionNote.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="btn-spinner"></span>
                    {t('submissions.confirming') || 'Confirming...'}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    {t('submissions.confirmCompletionBtn') || 'Yes, Confirm Completion'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {showDeleteJobConfirm && (
        <div className="release-confirm-overlay" onClick={() => { setShowDeleteJobConfirm(false); setDeleteJobId(null); }}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon" style={{ color: '#dc2626' }}>
              <Trash2 size={32} />
            </div>
            <h3>{t('submissions.deleteJobTitle') || 'Delete Job?'}</h3>
            <p>{t('submissions.deleteJobMessage') || 'This will permanently delete this job and notify all bidders. This action cannot be undone.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => { setShowDeleteJobConfirm(false); setDeleteJobId(null); }}
                disabled={isDeletingJob}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                style={{ background: '#dc2626' }}
                onClick={() => { if (deleteJobId) handleDeleteJob(deleteJobId); }}
                disabled={isDeletingJob}
              >
                {isDeletingJob ? (
                  <>
                    <span className="btn-spinner"></span>
                    {t('submissions.deleting') || 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {t('submissions.deleteJobBtn') || 'Delete Job'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Bid Approval Confirmation Modal */}
      {showCancelApprovalConfirm && (
        <div className="release-confirm-overlay" onClick={() => { setShowCancelApprovalConfirm(false); setCancelApprovalBidId(null); }}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon" style={{ color: '#d97706' }}>
              <AlertCircle size={32} />
            </div>
            <h3>{t('submissions.cancelApprovalTitle') || 'Cancel Bid Acceptance?'}</h3>
            <p>{t('submissions.cancelApprovalMessage') || 'This will cancel the contractor\'s approved bid, cancel any active contract, and reopen the job for bidding. The contractor will be notified.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => { setShowCancelApprovalConfirm(false); setCancelApprovalBidId(null); }}
                disabled={isCancellingApproval}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                style={{ background: '#d97706' }}
                onClick={() => { if (cancelApprovalBidId) handleCancelBidApproval(cancelApprovalBidId); }}
                disabled={isCancellingApproval}
              >
                {isCancellingApproval ? (
                  <>
                    <span className="btn-spinner"></span>
                    {t('submissions.cancellingApproval') || 'Cancelling...'}
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    {t('submissions.cancelApprovalBtn') || 'Cancel Acceptance'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Job Confirmation Modal */}
      {showArchiveJobConfirm && (
        <div className="release-confirm-overlay" onClick={() => { setShowArchiveJobConfirm(false); setArchiveJobId(null); }}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon" style={{ color: '#6366f1' }}>
              <FolderOpen size={32} />
            </div>
            <h3>{t('submissions.archiveJobTitle') || 'Archive Job?'}</h3>
            <p>{t('submissions.archiveJobMessage') || 'This will archive the completed job and remove it from your active dashboard. You can restore it later if needed.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => { setShowArchiveJobConfirm(false); setArchiveJobId(null); }}
                disabled={isArchivingJob}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                style={{ background: '#6366f1' }}
                onClick={() => { if (archiveJobId) handleArchiveJob(archiveJobId); }}
                disabled={isArchivingJob}
              >
                {isArchivingJob ? (
                  <>
                    <span className="btn-spinner"></span>
                    {t('submissions.archiving') || 'Archiving...'}
                  </>
                ) : (
                  <>
                    <FolderOpen size={18} />
                    {t('submissions.archiveJobBtn') || 'Archive Job'}
                  </>
                )}
              </button>
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

    </div>
  )
}

export default SubmissionsPage