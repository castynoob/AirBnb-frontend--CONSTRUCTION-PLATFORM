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
} from "lucide-react"
import Nav from "../../components/Nav"
import SlideToConfirm from "../../components/SlideToConfirm"
import "../../styles/manager/submissions.css"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../contexts/LanguageContext"
import toast from "react-hot-toast"
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal"
import { createContract, getContractByJob, approveWork, confirmCompletion } from "../../utils/contractApi"
import { useSubmissions, useFavorites, useInvalidateSubmissions } from "../../hooks/useSubmissionsData"

function SubmissionsPage() {
  const { t } = useLanguage()

  // TanStack Query: submissions + favorites
  const { data: cachedSubmissions = [], isLoading: submissionsLoading, error: queryError } = useSubmissions()
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

  // review
  const [isAddingReview, setIsAddingReview] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [rating, setRating] = useState(1)
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])

  // view reviews
  const [showViewReviews, setShowViewReviews] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

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
  const [showReviewInvitation, setShowReviewInvitation] = useState(false)
  const [reviewInvitationData, setReviewInvitationData] = useState(null)

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
    if (cachedSubmissions.length > 0 || !submissionsLoading) {
      setSubmissions(cachedSubmissions)
      setFilteredSubmissions(cachedSubmissions)
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
    // Check if funds were already released for this job BEFORE showing the modal
    // This prevents the slider from briefly appearing
    if (submission.bid.status === "approved" && normalizeStatus(submission.job.status) === "completed") {
      // Check if we already know it's released
      if (!releasedJobIds.has(submission.job.id)) {
        try {
          const contractData = await getContractByJob(submission.job.id)
          if (contractData.has_contract && contractData.contract?.payout_status === 'completed') {
            setReleasedJobIds(prev => new Set([...prev, submission.job.id]))
          }
        } catch (err) {
          console.log("Could not check contract status:", err)
        }
      }
    }

    setSelectedSubmission(submission)
    setShowDetailsModal(true)
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
        "Work approved! Please arrange payment with the contractor directly.",
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

  // Handle confirm job completion (mutual confirmation)
  const handleConfirmCompletion = async (jobId) => {
    setIsProcessing(true)
    try {
      const contractData = await getContractByJob(jobId)
      if (!contractData.has_contract || !contractData.contract) {
        showNotification("No contract found for this job.", "error")
        return
      }

      const result = await confirmCompletion(contractData.contract.id)

      if (result.both_confirmed) {
        showNotification("Both parties confirmed! Time to leave reviews.", "success")
        // Find the submission for review invitation
        const sub = submissions.find(s => s.job.id === jobId)
        setReviewInvitationData({ jobId, submission: sub })
        setShowReviewInvitation(true)
      } else {
        showNotification("Your confirmation recorded. Waiting for the contractor to confirm.", "success")
      }

      invalidateSubmissions()
    } catch (error) {
      showNotification(error.message || "Failed to confirm completion", "error")
    } finally {
      setIsProcessing(false)
      setShowConfirmCompletionModal(false)
      setConfirmCompletionJobId(null)
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
    // Use actual name from submission.user (first_name + last_name) to match messages tab
    let name = submission.user?.first_name && submission.user?.last_name
      ? `${submission.user.first_name} ${submission.user.last_name}`
      : submission.entrepreneur_profile.company_name
    let companyName = submission.entrepreneur_profile.company_name

    localStorage.setItem("targetReceiverId", entrepUserId);
    localStorage.setItem("targetReceiverName", name);
    localStorage.setItem("targetCompanyName", companyName);
    if (jobId) localStorage.setItem("targetJobId", jobId);
    navigate(`/messages/${uProfile.role}`)
  }

  const handleReview = (submission) => {
    setSelectedSubmission(submission)

    // If review exists, show view modal, otherwise show add review modal
    if (submission.review) {
      setShowViewReviews(true)
    } else {
      setIsAddingReview(true)
      setRating(5)
      setComment('')
      setReviewImages([])
      setReviewImagePreviews([])
    }

    console.log("📋 SUBMISSION DATA: ", submission)
    console.log("👤 Entrepreneur Profile:", submission.entrepreneur_profile)
    console.log("🆔 User ID to review:", submission.entrepreneur_profile.user_id)
    console.log("📝 Review:", submission.review)
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)

    if (files.length + reviewImages.length > 5) {
      showNotification("You can only upload up to 5 images", "error")
      return
    }

    setReviewImages(prev => [...prev, ...files])

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file))
    setReviewImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index))
    setReviewImagePreviews(prev => {
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmitReview = async () => {
    // Validation
    if (!rating || rating < 1 || rating > 5) {
      showNotification("Please provide a rating between 1 and 5 stars", "error")
      return
    }

    if (!comment || !comment.trim()) {
      showNotification("Please write a comment for your review", "error")
      return
    }

    if (comment.trim().length < 10) {
      showNotification("Please write a more detailed review (at least 10 characters)", "error")
      return
    }

    try {
      setIsProcessing(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      // Debug logging
      console.log('🔍 Property Manager Review Submission Debug:')
      console.log('- Selected Submission:', selectedSubmission)
      console.log('- Entrepreneur Profile:', selectedSubmission.entrepreneur_profile)
      console.log('- Entrepreneur User ID:', selectedSubmission.entrepreneur_profile.user_id)
      console.log('- Job ID:', selectedSubmission.job.id)
      console.log('- Rating:', rating)
      console.log('- Comment:', comment)

      const formData = new FormData()
      // ✅ FIXED: Use entrepreneur_profile.user_id instead of profile id
      const entrepreneurUserId = selectedSubmission.entrepreneur_profile.user_id ||
                                  selectedSubmission.entrepreneur_profile.entrepreneur_user_id ||
                                  selectedSubmission.user?.id

      console.log('💡 Using entrepreneur user ID:', entrepreneurUserId)

      if (!entrepreneurUserId) {
        throw new Error('Cannot find entrepreneur user ID')
      }

      formData.append('reviewed_user_id', entrepreneurUserId)
      formData.append('job_id', selectedSubmission.job.id)
      formData.append('rating', rating)
      formData.append('comment', comment.trim())

      // Append images
      reviewImages.forEach((image) => {
        formData.append('images', image)
      })

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
      showNotification(responseData.message || "Review submitted successfully!", "success")

      // Reset form
      setIsAddingReview(false)
      setRating(5)
      setComment('')
      setReviewImages([])

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
    let filtered = submissions

    // Apply property filter first (using property_id)
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
        <header className="subs-page-header">
          <div className="subs-header-left">
            <div className="subs-header-title-group">
              <h1>{t('submissions.title')}</h1>
              <span className="subs-submission-count">{getStatusCount("all")} {t('submissions.bids')}</span>
            </div>
          </div>
          <div className="subs-header-actions">
            <button className="subs-btn subs-btn-secondary" onClick={handleViewReviews}>
              <Star size={18} />
              <span>{t('submissions.myReviews')}</span>
            </button>
          </div>
        </header>

        {/* Property & Job Filter Dropdowns */}
        <div className="subs-filter-row">
          <div className="subs-property-filter">
            <div className="subs-property-filter-label">
              <Building2 size={16} />
              <span>{t('submissions.property')}</span>
            </div>
            <div className="subs-property-select-wrapper">
              <select
                className="subs-property-select"
                value={selectedProperty}
                onChange={(e) => {
                  setSelectedProperty(e.target.value)
                  setSelectedJob("all") // Reset job filter when property changes
                }}
              >
                <option value="all">{t('submissions.allProperties')} ({uniqueProperties.length})</option>
                {uniqueProperties.map((property) => (
                  <option key={property.id} value={String(property.id)}>
                    {property.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="subs-select-icon" />
            </div>
          </div>

          <div className="subs-property-filter">
            <div className="subs-property-filter-label">
              <FileText size={16} />
              <span>{t('submissions.job')}</span>
            </div>
            <div className="subs-property-select-wrapper">
              <select
                className="subs-property-select"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
              >
                <option value="all">{t('submissions.allJobs')} ({uniqueJobs.length})</option>
                {uniqueJobs.map((job) => (
                  <option key={job.id} value={String(job.id)}>
                    {job.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="subs-select-icon" />
            </div>
          </div>
        </div>

        <div className="subs-tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`subs-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="subs-tab-count">{getStatusCount(tab.id)}</span>
            </button>
          ))}
        </div>

        <div className="subs-controls-bar">
          <div className="subs-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('submissions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="subs-clear-btn" onClick={() => setSearchTerm("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`subs-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {t('submissions.filters')}
            <ChevronDown size={16} className={showFilters ? "rotated" : ""} />
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

        {isAddingReview && selectedSubmission && (
          <div className="rm-modal-overlay" onClick={() => {
            setIsAddingReview(false)
            reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
            setReviewImagePreviews([])
            setReviewImages([])
          }}>
            <div className="rm-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="rm-modal-header">
                <div className="rm-header-content">
                  <h2 className="rm-modal-title">{t('submissions.leaveReview')}</h2>
                  <p className="rm-modal-subtitle">{selectedSubmission.entrepreneur_profile?.company_name}</p>
                </div>
                <button
                  className="rm-close-btn"
                  onClick={() => {
                    setIsAddingReview(false)
                    reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
                    setReviewImagePreviews([])
                    setReviewImages([])
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="rm-modal-body">
                {/* Rating Section */}
                <div className="rm-rating-section">
                  <label className="rm-section-label">{t('submissions.rateExperience')}</label>
                  <div className="rm-stars-container">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`rm-star-btn ${rating >= num ? 'rm-active' : ''}`}
                        onClick={() => setRating(num)}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rm-rating-text">{rating}/5</span>
                  </div>
                </div>

                {/* Comment Section */}
                <div className="rm-comment-section">
                  <label className="rm-section-label">{t('submissions.shareExperience')}</label>
                  <textarea
                    className="rm-textarea"
                    placeholder={t('submissions.reviewPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                  />
                  <div className="rm-char-count">
                    {comment.length} {t('submissions.characters')} {comment.trim().length < 10 && `(${t('submissions.minimum')} 10)`}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="rm-image-section">
                  <label className="rm-section-label">{t('submissions.addPhotos')}</label>
                  <p className="rm-section-hint">{t('submissions.uploadPhotosHint')}</p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="rm-file-input"
                    id="rm-review-images"
                  />
                  <label htmlFor="rm-review-images" className="rm-upload-btn">
                    <FileText size={18} />
                    <span>{t('submissions.chooseImages')}</span>
                  </label>

                  {reviewImagePreviews.length > 0 && (
                    <div className="rm-image-grid">
                      {reviewImagePreviews.map((preview, index) => (
                        <div key={index} className="rm-image-item">
                          <img src={preview} alt={`Preview ${index + 1}`} className="rm-image-preview" />
                          <button
                            type="button"
                            className="rm-remove-btn"
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rm-modal-footer">
                <button
                  className="rm-btn rm-btn-cancel"
                  onClick={() => {
                    setIsAddingReview(false)
                    reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
                    setReviewImagePreviews([])
                    setReviewImages([])
                  }}
                  disabled={isProcessing}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="rm-btn rm-btn-submit"
                  onClick={handleSubmitReview}
                  disabled={isProcessing || !rating || !comment.trim() || comment.trim().length < 10}
                >
                  {isProcessing ? (
                    <>
                      <div className="rm-spinner"></div>
                      <span>{t('submissions.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      <span>{t('submissions.submitReview')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
                            <strong>{t('submissions.reviewed')}</strong> {selectedSubmission.user.first_name} {selectedSubmission.user.last_name}
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
                              <strong>{t('submissions.reviewed')}</strong> {review.reviewed_first_name} {review.reviewed_last_name}
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
                        <span className="details-value">{selectedSubmission.user.first_name} {selectedSubmission.user.last_name}</span>
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
                {selectedSubmission.bid.status === "approved" && normalizeStatus(selectedSubmission.job.status) === "completed" && !releasedJobIds.has(selectedSubmission.job.id) && !releasingFundsRef.current.has(selectedSubmission.job.id) && (
                  <div className="details-slider-wrapper details-slider-full">
                    <button
                      className="release-funds-btn"
                      onClick={() => {
                        setReleaseJobId(selectedSubmission.job.id)
                        setShowReleaseConfirm(true)
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing && processingJobId === selectedSubmission.job.id ? (
                        <>
                          <span className="btn-spinner"></span>
                          {t('submissions.releasing') || 'Completing...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          {t('submissions.releaseFunds') || 'Mark as Complete'}
                        </>
                      )}
                    </button>
                  </div>
                )}
                {selectedSubmission.bid.status === "approved" && normalizeStatus(selectedSubmission.job.status) === "completed" && releasedJobIds.has(selectedSubmission.job.id) && (
                  <>
                    {/* Confirm completion button or status */}
                    {selectedSubmission.contract && !selectedSubmission.contract.manager_completion_confirmed ? (
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
                    ) : selectedSubmission.contract?.manager_completion_confirmed && !selectedSubmission.contract?.mutual_confirmation_completed_at ? (
                      <div className="details-status-message details-status-success">
                        <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
                        {t('submissions.youConfirmedWaiting') || 'You confirmed. Waiting for the contractor to confirm.'}
                      </div>
                    ) : selectedSubmission.contract?.mutual_confirmation_completed_at ? (
                      <div className="details-status-message details-status-success">
                        <Star size={16} fill="#f59e0b" stroke="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
                        {t('submissions.bothConfirmed') || 'Both parties confirmed!'}
                      </div>
                    ) : (
                      <div className="details-status-message details-status-success">
                        {t('submissions.fundsReleasedMessage')}
                      </div>
                    )}
                  </>
                )}
                {selectedSubmission.bid.status === "approved" && normalizeStatus(selectedSubmission.job.status) !== "completed" && (
                  <div className="details-status-message">
                    {t('submissions.bidApprovedWaiting')}
                  </div>
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


        {loading ? (
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
                <div key={submission.bid.id} className="subs-bid-card" onClick={() => handleViewDetails(submission)}>
                  {/* Top Row: Status + Amount + Favorite */}
                  <div className="subs-card-top">
                    <div className={`subs-status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </div>
                    <div className="subs-card-top-right">
                      {submission.job.is_emergency && (
                        <span className="subs-urgency urgent">{t('submissions.urgent')}</span>
                      )}
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

                  {/* Info Row: Contractor + Location */}
                  <div className="subs-card-info">
                    <div className="subs-info-item">
                      <User size={12} />
                      <span
                        className="subs-company-link"
                        onClick={(e) => handleViewProfile(e, submission)}
                        title={t('submissions.viewProfile')}
                      >
                        {submission.entrepreneur_profile.company_name}
                      </span>
                      <span className="subs-rating">★ {submission.entrepreneur_profile.average_rating}</span>
                    </div>
                    {submission.user?.first_name && (
                      <div className="subs-info-item">
                        <User size={12} />
                        <span className="subs-contact-name">{submission.user.first_name} {submission.user.last_name}</span>
                      </div>
                    )}
                    {submission.entrepreneur_profile.license_number && (
                      <div className="subs-info-item">
                        <BadgeCheck size={12} />
                        <span className="subs-license">{t('submissions.licenseLabel')} {submission.entrepreneur_profile.license_number}</span>
                      </div>
                    )}
                    {submission.entrepreneur_profile.specializations?.length > 0 && (
                      <div className="subs-info-item">
                        <Briefcase size={12} />
                        <span className="subs-specializations">
                          {submission.entrepreneur_profile.specializations.slice(0, 2).join(", ")}
                          {submission.entrepreneur_profile.specializations.length > 2 && ` +${submission.entrepreneur_profile.specializations.length - 2}`}
                        </span>
                      </div>
                    )}
                    <div className="subs-info-item">
                      <MapPin size={12} />
                      <span>{submission.property_address}</span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="subs-card-actions">
                    <button className="subs-details-btn" onClick={(e) => { e.stopPropagation(); handleViewDetails(submission); }}>
                      {t('submissions.details')}
                      <ChevronRight size={14} />
                    </button>

                    {(submission.job.status === "accepted" || submission.job.status === "ongoing") && (
                      <button className="subs-chat-btn" onClick={(e) => { e.stopPropagation(); handleChat(submission); }}>
                        <MessageCircle size={14} />
                      </button>
                    )}

                    {submission.job.status === "completed" && (
                      <button className="subs-review-btn" onClick={(e) => { e.stopPropagation(); handleReview(submission); }}>
                        <Star size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
        <div className="release-confirm-overlay" onClick={() => setShowConfirmCompletionModal(false)}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon">
              <CheckCircle size={32} />
            </div>
            <h3>{t('submissions.confirmCompletionTitle') || 'Confirm Job Completion'}</h3>
            <p>{t('submissions.confirmCompletionMessage') || 'By confirming, you acknowledge that this job has been completed satisfactorily. Both you and the contractor must confirm before reviews can be exchanged.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => {
                  setShowConfirmCompletionModal(false)
                  setConfirmCompletionJobId(null)
                }}
                disabled={isProcessing}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="release-confirm-submit"
                onClick={() => {
                  if (confirmCompletionJobId) {
                    handleConfirmCompletion(confirmCompletionJobId)
                  }
                }}
                disabled={isProcessing}
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

      {/* Review Invitation Modal */}
      {showReviewInvitation && reviewInvitationData && (
        <div className="release-confirm-overlay" onClick={() => setShowReviewInvitation(false)}>
          <div className="release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="release-confirm-icon" style={{ color: '#f59e0b' }}>
              <Star size={32} fill="#f59e0b" stroke="#f59e0b" />
            </div>
            <h3>{t('submissions.reviewInvitationTitle') || 'Leave a Review'}</h3>
            <p>{t('submissions.reviewInvitationMessage') || 'Both parties have confirmed the job is complete! Take a moment to rate your experience.'}</p>
            <div className="release-confirm-actions">
              <button
                className="release-confirm-cancel"
                onClick={() => setShowReviewInvitation(false)}
              >
                {t('submissions.skipReview') || 'Maybe Later'}
              </button>
              <button
                className="release-confirm-submit"
                onClick={() => {
                  setShowReviewInvitation(false)
                  if (reviewInvitationData.submission) {
                    setSelectedSubmission(reviewInvitationData.submission)
                    setRating(5)
                    setComment('')
                    setReviewImages([])
                    setReviewImagePreviews([])
                    setIsAddingReview(true)
                  }
                }}
              >
                <Star size={18} />
                {t('submissions.leaveReviewNow') || 'Leave Review Now'}
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