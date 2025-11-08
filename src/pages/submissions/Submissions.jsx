"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import Nav from "../../components/Nav"
import "../../styles/manager/submissions.css"
import { useNavigate } from "react-router-dom"

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([])
  const [filteredSubmissions, setFilteredSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState(null)
  const [uProfile, setUProfile] = useState({})

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
  const [selectedSubmission, setSelectedSubmission] = useState({})
  const [rating, setRating] = useState(1)
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])

  // view reviews
  const [showViewReviews, setShowViewReviews] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const fetchSubmissions = async () => {
      try {
        setLoading(true)
        const userProfile = localStorage.getItem("userProfile")

        if (!userProfile) {
          setError("User profile not found")
          setLoading(false)
          return
        }

        const user = JSON.parse(userProfile)
        setUProfile(user)
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

        // Fetch jobs for the manager
        const jobsResponse = await fetch(`${API_BASE_URL}/api/jobs/manager/${user.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!jobsResponse.ok) {
          throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`)
        }

        const jobsData = await jobsResponse.json()
        const jobs = jobsData.jobs || []

        // Fetch bids and property details for each job
        const submissionsData = []

        for (const job of jobs) {
          try {
            console.log(job)
            // Fetch bids for this job (includes entrepreneur info)
            const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/job/${job.id}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            })

            const jobReview = await fetch(`${API_BASE_URL}/api/reviews/job/${job.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${user.token}`
              }
            })

            if (!bidsResponse.ok) {
              console.warn(`Failed to fetch bids for job ${job.id}`)
              continue
            }

            const bidsData = await bidsResponse.json()
            const bids = bidsData.bids || []

            // Fetch property details
            let propertyAddress = "Unknown Location"
            if (job.property_id) {
              try {
                const propertyResponse = await fetch(`${API_BASE_URL}/api/properties/${job.property_id}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                })

                if (propertyResponse.ok) {
                  const propertyData = await propertyResponse.json()
                  const property = propertyData.property
                  propertyAddress = `${property.address}, ${property.city}, ${property.province}`
                }
              } catch (err) {
                console.warn(`Failed to fetch property ${job.property_id}:`, err)
              }
            }

            // Transform bids into submissions format (filter out declined bids)
            for (const bid of bids) {
              // Skip declined bids
              if (bid.status === "declined") {
                continue
              }

              // Fetch review if job is completed
              let reviewData = null
              if (job.status === 'completed') {
                try {
                  const reviewResponse = await fetch(`${API_BASE_URL}/api/reviews/job/${job.id}`, {
                    headers: {
                      'Authorization': `Bearer ${uProfile.token}`,
                    },
                  })
                  if (reviewResponse.ok) {
                    const reviewJson = await reviewResponse.json()
                    reviewData = reviewJson.review && reviewJson.review.length > 0 ? reviewJson.review[0] : null
                  }
                } catch (err) {
                  console.warn(`Failed to fetch review for job ${job.id}:`, err)
                }
              }

              submissionsData.push({
                bid: {
                  id: bid.id,
                  job_id: bid.job_id,
                  entrepreneur_id: bid.entrepreneur_id,
                  amount: bid.amount,
                  message: bid.message,
                  status: bid.status,
                  created_at: bid.created_at,
                  updated_at: bid.updated_at,
                },
                job: {
                  id: job.id,
                  title: job.title,
                  description: job.description,
                  category: job.category,
                  urgency: job.urgency,
                  budget_min: job.budget_min,
                  budget_max: job.budget_max,
                  is_budget_hidden: job.is_budget_hidden,
                  is_emergency: job.is_emergency,
                  status: job.status,
                  due_date: job.due_date,
                  estimated_duration_days: job.estimated_duration_days,
                  property_id: job.property_id,
                  manager_id: job.manager_id,
                  unit_id: job.unit_id,
                  created_at: job.created_at,
                  updated_at: job.updated_at,
                },
                entrepreneur_profile: {
                  id: bid.entrepreneur_id,
                  user_id: bid.user_id || bid.entrepreneur_user_id, // ✅ User ID for reviews/messaging
                  entrepreneur_user_id: bid.entrepreneur_user_id, // Keep for backward compatibility
                  company_name: bid.company_name,
                  license_number: bid.license_number,
                  years_in_business: bid.years_in_business,
                  specializations: bid.specializations || [],
                  average_rating: bid.average_rating,
                  total_reviews: bid.total_reviews,
                },
                user: {
                  first_name: bid.first_name,
                  last_name: bid.last_name,
                  email: bid.email,
                },
                property_address: propertyAddress,
                review: reviewData, // ✅ Add review data
              })
            }
          } catch (err) {
            console.warn(`Error processing job ${job.id}:`, err)
          }
        }

        setSubmissions(submissionsData)
        console.log(submissionsData)
        setFilteredSubmissions(submissionsData)
        setError(null)
      } catch (err) {
        console.error("Error fetching submissions:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
  }

  const handleViewDetails = (submission) => {
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
    setIsProcessing(true)

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      // 1. Approve the bid
      const response = await fetch(
        `${API_BASE_URL}/api/bids/${bidId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${uProfile.token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `Failed to approve bid: ${response.status}`)
      }

      const data = await response.json()

      // 2. Update job status to 'accepted'
      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${uProfile.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted', entrepreneur_id: `${entrepreneurId}` })
      })

      if (!jobResponse.ok) {
        const jobData = await jobResponse.json()
        throw new Error(jobData.message || `Failed to update job status: ${jobResponse.status}`)
      }

      // Update local state
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

      showNotification(
        data.message || "Bid accepted successfully! Messaging is now unlocked.",
        "success"
      )

      setShowDetailsModal(false)

    } catch (error) {
      console.error("Error accepting bid:", error)
      showNotification(
        error.message || "Failed to approve bid. Please try again.",
        "error"
      )
    } finally {
      setIsProcessing(false)
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
    let name = submission.entrepreneur_profile.company_name

    localStorage.setItem("targetReceiverId", entrepUserId);
    localStorage.setItem("targetReceiverName", name);
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
      await fetchSubmissions()
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
      open: { class: "status-open", icon: FolderOpen, label: "Open" },
      accepted: { class: "status-accepted", icon: CheckCircle, label: "Accepted" },
      ongoing: { class: "status-ongoing", icon: PlayCircle, label: "Ongoing" },
      completed: { class: "status-completed", icon: CheckCircle, label: "Completed" },
    }
    return statusMap[normalizedStatus]
  }

  // Updated to count by job status
  const getStatusCount = (status) => {
    if (status === "all") return submissions.length
    return submissions.filter((sub) => normalizeStatus(sub.job.status) === status).length
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

  // Updated tabs to match job status values
  const tabs = [
    { id: "all", label: "All Submissions" },
    { id: "open", label: "Open" },
    { id: "accepted", label: "Accepted" },
    { id: "ongoing", label: "Ongoing" },
    { id: "completed", label: "Completed" },
  ]

  useEffect(() => {
    let filtered = [...submissions]

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
  }, [searchTerm, locationFilter, categoryFilter, amountRange, dateRange, submissions, activeTab])

  return (
    <div className="subs-submissions-container">
      <Nav />

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === "success" && <CheckCircle size={24} />}
              {notification.type === "error" && <X size={24} />}
              {notification.type === "info" && <FileText size={24} />}
            </div>
            <div className="notification-message">{notification.message}</div>
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="subs-submissions-content">
        <div className="subs-page-header">
          <div>
            <h1 className="subs-page-title">Bid Submissions</h1>
            <p className="subs-page-subtitle">Review and manage contractor bids</p>
          </div>
          <div className="subs-header-stats">
            <button className="view-reviews-btn" onClick={handleViewReviews}>
              <Star size={18} />
              My Reviews
            </button>
            <div className="subs-stat-chip">
              <span className="subs-stat-label">Total</span>
              <span className="subs-stat-value">{submissions.length}</span>
            </div>
            <div className="subs-stat-chip subs-stat-pending">
              <span className="subs-stat-label">Open</span>
              <span className="subs-stat-value">{submissions.filter((s) => s.job.status === "open").length}</span>
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
              placeholder="Search by job or contractor..."
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
            Filters
            <ChevronDown size={16} className={showFilters ? "rotated" : ""} />
          </button>
        </div>

        {showFilters && (
          <div className="subs-filters-panel">
            <div className="subs-filters-grid">
              <div className="subs-filter-item">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="City or Address"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="subs-filter-item">
                <label>Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="subs-filter-item">
                <label>Min Amount</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>Max Amount</label>
                <input
                  type="number"
                  placeholder="$999,999"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="subs-filter-item">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
            <button className="subs-clear-all-btn" onClick={clearFilters}>
              <X size={16} />
              Clear All Filters
            </button>
          </div>
        )}

        {isAddingReview && (
          <div className="rm-modal-overlay" onClick={() => {
            setIsAddingReview(false)
            reviewImagePreviews.forEach(url => URL.revokeObjectURL(url))
            setReviewImagePreviews([])
            setReviewImages([])
          }}>
            <div className="rm-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="rm-modal-header">
                <div className="rm-header-content">
                  <h2 className="rm-modal-title">Leave a Review</h2>
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
                  <label className="rm-section-label">How would you rate your experience?</label>
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
                  <label className="rm-section-label">Share your experience</label>
                  <textarea
                    className="rm-textarea"
                    placeholder="Tell us about your experience working with this contractor..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                  />
                  <div className="rm-char-count">
                    {comment.length} characters {comment.trim().length < 10 && '(minimum 10)'}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="rm-image-section">
                  <label className="rm-section-label">Add photos (optional)</label>
                  <p className="rm-section-hint">Upload up to 5 photos to showcase the work</p>

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
                    <span>Choose Images</span>
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
                  Cancel
                </button>
                <button
                  className="rm-btn rm-btn-submit"
                  onClick={handleSubmitReview}
                  disabled={isProcessing || !rating || !comment.trim() || comment.trim().length < 10}
                >
                  {isProcessing ? (
                    <>
                      <div className="rm-spinner"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Reviews Modal */}
        {showViewReviews && (
          <div className="bid-modal-overlay" onClick={() => setShowViewReviews(false)}>
            <div className="bid-modal-content view-reviews-modal" onClick={(e) => e.stopPropagation()}>
              <div className="bid-modal-header">
                <h2>{selectedSubmission?.review ? 'Review Details' : 'My Reviews'}</h2>
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
                            <strong>Reviewed:</strong> {selectedSubmission.user.first_name} {selectedSubmission.user.last_name}
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
                          <span>Reviewed on {formatDate(selectedSubmission.review.created_at)}</span>
                        </div>
                        <div className="review-meta-item">
                          <User size={14} />
                          <span>By you</span>
                        </div>
                      </div>

                      <div className="review-card-body">
                        <div className="review-comment-section">
                          <label>Your Review:</label>
                          <p className="review-comment">{selectedSubmission.review.comment}</p>
                        </div>

                        {selectedSubmission.review.images && selectedSubmission.review.images.length > 0 && (
                          <div className="review-images-section">
                            <label>Attached Photos ({selectedSubmission.review.images.length}):</label>
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
                    <p>Loading your reviews...</p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="reviews-empty">
                    <Star size={48} strokeWidth={1.5} />
                    <h3>No Reviews Yet</h3>
                    <p>You haven't submitted any reviews yet.</p>
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
                              <strong>Reviewed:</strong> {review.reviewed_first_name} {review.reviewed_last_name}
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
                            <span>Reviewed on {formatDate(review.created_at)}</span>
                          </div>
                          <div className="review-meta-item">
                            <User size={14} />
                            <span>By you</span>
                          </div>
                        </div>

                        <div className="review-card-body">
                          <div className="review-comment-section">
                            <label>Your Review:</label>
                            <p className="review-comment">{review.comment}</p>
                          </div>

                          {review.images && review.images.length > 0 && (
                            <div className="review-images-section">
                              <label>Attached Photos ({review.images.length}):</label>
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

        {/* Submission Details Modal */}
        {showDetailsModal && selectedSubmission && (
          <div className="bid-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="bid-modal-header">
                <h2>Submission Details</h2>
                <button
                  className="bid-modal-close"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bid-modal-body">
                {/* Job Information */}
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <FileText size={20} />
                    Job Information
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label>Job Title</label>
                      <p>{selectedSubmission.job.title}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>Category</label>
                      <p>{selectedSubmission.job.category}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Clock size={14} /> Urgency
                      </label>
                      <p>{selectedSubmission.job.urgency}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Calendar size={14} /> Due Date
                      </label>
                      <p>{formatDate(selectedSubmission.job.due_date)}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Clock size={14} /> Duration
                      </label>
                      <p>{selectedSubmission.job.estimated_duration_days} days</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <DollarSign size={14} /> Budget Range
                      </label>
                      <p>{formatCurrency(selectedSubmission.job.budget_min)} - {formatCurrency(selectedSubmission.job.budget_max)}</p>
                    </div>
                  </div>
                  <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                    <label>Description</label>
                    <p>{selectedSubmission.job.description}</p>
                  </div>
                  <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                    <label>Property Location</label>
                    <p>{selectedSubmission.property_address}</p>
                  </div>
                </section>

                {/* Company Information */}
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <Building2 size={20} />
                    Contractor Information
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label>Company Name</label>
                      <p>{selectedSubmission.entrepreneur_profile.company_name}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>Contact Person</label>
                      <p>{selectedSubmission.user.first_name} {selectedSubmission.user.last_name}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>License Number</label>
                      <p>{selectedSubmission.entrepreneur_profile.license_number || "N/A"}</p>
                    </div>
                    <div className="bid-info-item">
                      <label>
                        <Calendar size={14} /> Years in Business
                      </label>
                      <p>{selectedSubmission.entrepreneur_profile.years_in_business || "N/A"}</p>
                    </div>
                  </div>
                </section>

                {/* Rating & Specializations */}
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <Star size={20} />
                    Rating & Specializations
                  </h3>
                  <div className="bid-rating-display">
                    <div className="bid-rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={24}
                          fill={
                            i < Math.round(selectedSubmission.entrepreneur_profile.average_rating)
                              ? "#facc15"
                              : "none"
                          }
                          stroke="#facc15"
                        />
                      ))}
                    </div>
                    <p className="bid-rating-text">
                      {selectedSubmission.entrepreneur_profile.average_rating} out of 5 stars
                    </p>
                    <p className="bid-review-count">
                      Based on {selectedSubmission.entrepreneur_profile.total_reviews} reviews
                    </p>
                  </div>
                  {selectedSubmission.entrepreneur_profile.specializations &&
                    selectedSubmission.entrepreneur_profile.specializations.length > 0 && (
                      <div className="bid-specializations-list" style={{ marginTop: '1rem' }}>
                        {selectedSubmission.entrepreneur_profile.specializations.map(
                          (spec, index) => (
                            <span key={index} className="bid-specialization-tag">
                              {spec}
                            </span>
                          )
                        )}
                      </div>
                    )}
                </section>

                {/* Bid Information */}
                <section className="bid-modal-section bid-modal-highlight">
                  <h3 className="bid-section-title">
                    <DollarSign size={20} />
                    Bid Information
                  </h3>
                  <div className="bid-info-display">
                    <div className="bid-amount-display">
                      <label>Bid Amount</label>
                      <p className="amount">
                        {formatCurrency(selectedSubmission.bid.amount)}
                      </p>
                    </div>
                    {selectedSubmission.bid.message && (
                      <div className="bid-message">
                        <label>
                          <MessageCircle size={14} /> Message from Contractor
                        </label>
                        <p>{selectedSubmission.bid.message}</p>
                      </div>
                    )}
                    <div className="bid-status-display">
                      <label>Bid Status</label>
                      <span
                        className={`bid-status-badge-modal status-${selectedSubmission.bid.status}`}
                      >
                        {selectedSubmission.bid.status || "pending"}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer with Actions */}
              <div className="bid-modal-footer">
                {normalizeStatus(selectedSubmission.job.status) === "open" && selectedSubmission.bid.status === "pending" && (
                  <>
                    <button
                      className="bid-btn-decline"
                      onClick={() => handleDecline(selectedSubmission.bid.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Decline Bid"}
                    </button>
                    <button
                      className="bid-btn-accept"
                      onClick={() => handleAccept(
                        selectedSubmission.bid.id,
                        selectedSubmission.job.id,
                        selectedSubmission.entrepreneur_profile.id
                      )}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Accept Bid"}
                    </button>
                  </>
                )}
                {(selectedSubmission.bid.status === "approved" || selectedSubmission.bid.status === "declined") && (
                  <p className="bid-status-message">
                    This bid has been {selectedSubmission.bid.status}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}


        {loading ? (
          <div className="subs-loading-state">
            <div className="subs-spinner"></div>
            <p>Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="subs-empty-state">
            <FileText size={48} />
            <h3>Error loading submissions</h3>
            <p>{error}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="subs-empty-state">
            <FileText size={48} />
            <h3>No submissions found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredSubmissions.map((submission) => {
              // Updated to use job status
              const statusInfo = getStatusInfo(submission.job.status)
              const StatusIcon = statusInfo.icon

              return (
                <div key={submission.bid.id} className="subs-bid-card">
                  <div className="subs-card-header">
                    <div className={`subs-status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </div>
                    <span className="subs-bid-amount">{formatCurrency(submission.bid.amount)}</span>
                  </div>

                  <h3 className="subs-job-title">{submission.job.title}</h3>

                  <div className="subs-contractor-info">
                    <User size={14} />
                    <span className="subs-contractor-name">{submission.entrepreneur_profile.company_name}</span>
                    <span className="subs-contractor-rating">★ {submission.entrepreneur_profile.average_rating}</span>
                  </div>

                  <div className="subs-property-location">
                    <FileText size={14} />
                    <span>{submission.property_address}</span>
                  </div>

                  {submission.bid.status === "pending" && submission.bid.message && (
                    <div className="subs-bid-message">
                      <strong>Bid Message:</strong>
                      <p>{submission.bid.message}</p>
                    </div>
                  )}

                  <div className="subs-card-footer">
                    <span className={`subs-urgency ${submission.job.is_emergency ? "urgent" : "normal"}`}>
                      {submission.job.is_emergency ? "Urgent" : "Standard"}
                    </span>
                    <div className="subs-action-buttons">
                      <button className="subs-details-btn" onClick={() => handleViewDetails(submission)}>
                        View Details
                      </button>

                      {/* Chat button: Show when job is accepted or ongoing */}
                      {(submission.job.status === "accepted" || submission.job.status === "ongoing") && (
                        <button className="subs-chat-btn" onClick={() => handleChat(submission)}>
                          <MessageCircle size={14} />
                          Chat
                        </button>
                      )}

                      {/* Review button: Show for all completed jobs */}
                      {submission.job.status === "completed" && (
                        <button className="subs-review-btn" onClick={() => handleReview(submission)}>
                          <Star size={14} />
                          {submission.review ? "View Review" : "Add Review"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubmissionsPage