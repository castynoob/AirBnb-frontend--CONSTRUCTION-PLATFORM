import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles/manager/submissions.css"
import Nav from "../../components/Nav"
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
} from "lucide-react"
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
  const navigate = useNavigate()
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

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  })
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

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
            return { ...job, review }
          } catch (err) {
            console.error(`Failed to fetch review for job ${job.id}`, err)
            return { ...job, review: null }
          }
        }),
      )

      setJobs(newJobsData)
      console.log("✅ Jobs and reviews loaded:", newJobsData)
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

    const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    })

    if (!res.ok) throw new Error("Failed to complete job")
    await fetchJobs()
    setIsConfirming(false)
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)

    if (files.length + reviewImages.length > 5) {
      alert("You can only upload up to 5 images")
      return
    }

    setReviewImages((prev) => [...prev, ...files])

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file))
    setReviewImagePreviews((prev) => [...prev, ...previews])
  }

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index))
    setReviewImagePreviews((prev) => {
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmitReview = async () => {
    // Validation
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert("Please provide a rating between 1 and 5 stars")
      return
    }

    if (!reviewForm.comment || !reviewForm.comment.trim()) {
      alert("Please write a comment for your review")
      return
    }

    if (reviewForm.comment.trim().length < 10) {
      alert("Please write a more detailed review (at least 10 characters)")
      return
    }

    try {
      setIsSubmittingReview(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const user = JSON.parse(localStorage.getItem("userProfile"))

      // Debug logging
      console.log('🔍 Entrepreneur Review Submission Debug:')
      console.log('- Selected Job:', selectedJob)
      console.log('- Manager Profile ID:', selectedJob.manager_id)
      console.log('- Manager User ID:', selectedJob.manager_user_id)

      // ✅ FIXED: Use manager_user_id (user ID) instead of manager_id (profile ID)
      const managerUserId = selectedJob.manager_user_id || selectedJob.manager_id

      if (!managerUserId) {
        throw new Error('Cannot find manager user ID')
      }

      console.log('💡 Using manager user ID:', managerUserId)

      // ✅ Use FormData to support image uploads
      const formData = new FormData()
      formData.append("reviewed_user_id", managerUserId)
      formData.append("job_id", selectedJob.id)
      formData.append("rating", reviewForm.rating)
      formData.append("comment", reviewForm.comment.trim())

      // Append images
      reviewImages.forEach((image) => {
        formData.append("images", image)
      })

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to submit review")
      }

      const responseData = await res.json()
      alert(responseData.message || "Review added successfully!")

      // Reset form
      setOpenReviewModal(false)
      setReviewForm({ rating: 5, comment: "" })
      setReviewImages([])

      // Clean up preview URLs
      reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
      setReviewImagePreviews([])

      // Refresh jobs
      await fetchJobs()
    } catch (error) {
      console.error("Error submitting review:", error)
      alert(error.message || "Failed to submit review. Please try again.")
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

  const handleChatManager = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

      // Fetch job details to get manager info
      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/${job.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        }
      })

      if (!jobResponse.ok) {
        throw new Error('Error fetching job details')
      }

      const data = await jobResponse.json()
      const managerId = data.manager_user_id || data.manager_id

      if (!managerId || managerId === userProfile.id) {
        alert("Error: Cannot find property manager for this job")
        return
      }

      localStorage.setItem("targetReceiverId", managerId)
      localStorage.setItem("targetReceiverName", data.manager_name || "Property Manager")
      if (data.id) localStorage.setItem("targetJobId", data.id)
      navigate('/messages/entrepreneur')
    } catch (err) {
      console.error('Error navigating to messages:', err)
      alert('Failed to open messages. Please try again.')
    }
  }

  const handleViewDetails = (job) => {
    setDetailsJob(job);
    setShowDetailsModal(true);
  }

  const getStatusCount = (status) => {
    return jobs.filter((job) => job.status === status).length
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

  if (isLoading) {
    return (
      <div className="subs-submissions-container">
        <Nav />
        <div className="subs-submissions-content">
          <div className="subs-loading-state">
            <div className="subs-spinner"></div>
            <p>Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="subs-submissions-container">
      <Nav />
      <div className="subs-submissions-content">
        {/* Page Header */}
        <header className="subs-page-header">
          <div className="subs-header-left">
            <div className="subs-header-title-group">
              <h1>MY PROJECTS</h1>
              <span className="subs-submission-count">{jobs.length} projects</span>
            </div>
          </div>
          <div className="subs-header-actions">
            <div className="subs-btn subs-btn-secondary">
              <PlayCircle size={18} />
              <span>{jobs.filter((j) => j.status === "ongoing").length} Active</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="subs-tabs-container">
          {["accepted", "ongoing", "completed"].map((status) => (
            <button
              key={status}
              className={`subs-tab-btn ${activeStatus === status ? "active" : ""}`}
              onClick={() => setActiveStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="subs-tab-count">{getStatusCount(status)}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="subs-controls-bar">
          <div className="subs-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="subs-clear-btn" onClick={() => setSearchTerm("")}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="subs-empty-state">
            <FileText size={48} />
            <h3>No {activeStatus} projects found</h3>
            <p>Try adjusting your search or check other tabs</p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredJobs.map((job) => {
              const getStatusInfo = (status) => {
                const statusMap = {
                  accepted: { class: "status-accepted", icon: CheckCircle, label: "Accepted" },
                  ongoing: { class: "status-ongoing", icon: PlayCircle, label: "Ongoing" },
                  completed: { class: "status-completed", icon: CheckCircle, label: "Completed" },
                }
                return statusMap[status] || { class: "status-open", icon: FolderOpen, label: status }
              }
              const statusInfo = getStatusInfo(job.status)
              const StatusIcon = statusInfo.icon

              return (
                <div className="subs-bid-card" key={job.id} onClick={() => handleViewDetails(job)}>
                  {/* Top Row: Status + Category */}
                  <div className="subs-card-top">
                    <div className={`subs-status-badge-subs ${statusInfo.class}`}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </div>
                    <div className="subs-card-top-right">
                      {job.is_emergency && (
                        <span className="subs-urgency urgent">Urgent</span>
                      )}
                      <span className="subs-bid-amount">{job.category}</span>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="subs-job-title">{job.title}</h3>

                  {/* Info Row */}
                  <div className="subs-card-info">
                    <div className="subs-info-item">
                      <Calendar size={12} />
                      <span>Due: {formatDate(job.due_date)}</span>
                    </div>
                    {job.budget_min && job.budget_max && (
                      <div className="subs-info-item">
                        <DollarSign size={12} />
                        <span>{formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Row - Redesigned */}
                  <div className="ej-card-actions-redesign">
                    {/* Left: Icon buttons */}
                    <div className="ej-card-icon-buttons">
                      <button
                        className="ej-icon-btn ej-icon-details"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(job); }}
                        title="View Details"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className="ej-icon-btn ej-icon-chat"
                        onClick={(e) => { e.stopPropagation(); handleChatManager(job); }}
                        title="Chat with Manager"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>

                    {/* Right: Primary action button */}
                    <div className="ej-card-primary-action">
                      {job.status === "accepted" && (
                        <button
                          className="ej-action-btn ej-action-start"
                          onClick={(e) => { e.stopPropagation(); openModal(job, "start"); }}
                        >
                          <PlayCircle size={16} />
                          Start Project
                        </button>
                      )}

                      {job.status === "ongoing" && (
                        <button
                          className="ej-action-btn ej-action-complete"
                          onClick={(e) => { e.stopPropagation(); openModal(job, "done"); }}
                        >
                          <CheckCircle size={16} />
                          Mark Complete
                        </button>
                      )}

                      {job.status === "completed" && (
                        <button
                          className="ej-action-btn ej-action-review"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedJob(job)
                            if (job.review.length === 0) {
                              setOpenReviewModal(true)
                            } else {
                              getJobInformation(job)
                            }
                          }}
                        >
                          <Star size={16} />
                          {job.review.length === 0 ? 'Leave Review' : 'View Review'}
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

      {/* Review Modal - Improved UI */}
      {openReviewModal && (
        <div className="rm-modal-overlay" onClick={() => {
          setOpenReviewModal(false)
          reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
          setReviewImagePreviews([])
          setReviewImages([])
        }}>
          <div className="rm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <div className="rm-header-content">
                <h2 className="rm-modal-title">Leave a Review</h2>
                <p className="rm-modal-subtitle">{selectedJob?.title}</p>
              </div>
              <button
                className="rm-close-btn"
                onClick={() => {
                  setOpenReviewModal(false)
                  reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rm-star-btn ${reviewForm.rating >= star ? 'rm-active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rm-rating-text">{reviewForm.rating}/5</span>
                </div>
              </div>

              {/* Comment Section */}
              <div className="rm-comment-section">
                <label className="rm-section-label">Share your experience</label>
                <textarea
                  className="rm-textarea"
                  placeholder="Tell us about your experience with this property manager..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={5}
                />
                <div className="rm-char-count">
                  {reviewForm.comment.length} characters {reviewForm.comment.trim().length < 10 && '(minimum 10)'}
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
                          onClick={() => removeReviewImage(index)}
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
                  setOpenReviewModal(false)
                  reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
                  setReviewImagePreviews([])
                  setReviewImages([])
                }}
                disabled={isSubmittingReview}
              >
                Cancel
              </button>
              <button
                className="rm-btn rm-btn-submit"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewForm.rating || !reviewForm.comment.trim() || reviewForm.comment.trim().length < 10}
              >
                {isSubmittingReview ? (
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

      {/* Confirmation Modal */}
      {modalType && selectedJob && (
        <div className="bid-modal-overlay" onClick={closeModal}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="bid-modal-header">
              <h2>
                {modalType === "start" && "Start this project?"}
                {modalType === "done" && "Mark this project as completed?"}
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
                  {modalType === "start" ? "This will change the project status to ongoing." : "This will mark the project as completed."}
                </p>
              </section>
            </div>
            <div className="bid-modal-footer">
              <button className="bid-btn-decline" onClick={closeModal}>
                Cancel
              </button>
              <button className="bid-btn-accept" onClick={handleConfirmAction} disabled={isConfirming}>
                {isConfirming ? "Loading..." : "Confirm"}
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
                  Project Details
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>Category</label>
                    <p>{selectedJob.category}</p>
                  </div>
                  <div className="bid-info-item">
                    <label><Calendar size={14} /> Due Date</label>
                    <p>{formatDate(selectedJob.due_date)}</p>
                  </div>
                  {selectedJob.budget_min && selectedJob.budget_max && (
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> Budget Range</label>
                      <p>{formatCurrency(selectedJob.budget_min)} - {formatCurrency(selectedJob.budget_max)}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Building2 size={20} />
                  Property Manager
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>Company</label>
                    <p>{manager.company_name}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>Address</label>
                    <p>{manager.address}</p>
                  </div>
                </div>
              </section>

              {reviewed && reviewed.length > 0 && (
                <section className="bid-modal-section bid-modal-highlight">
                  <h3 className="bid-section-title">
                    <Star size={20} />
                    Your Review
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
                    <p className="bid-rating-text">{reviewed[0].rating} out of 5 stars</p>
                  </div>
                  <div className="bid-message">
                    <label>Comment</label>
                    <p>"{reviewed[0].comment}"</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    — {reviewed[0].reviewer_first_name} {reviewed[0].reviewer_last_name}
                  </p>

                  {/* Display attached images */}
                  {reviewed[0].images && reviewed[0].images.length > 0 && (
                    <div className="review-images-section" style={{ marginTop: '1rem' }}>
                      <label>Attached Photos ({reviewed[0].images.length}):</label>
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
              <h2>Project Details</h2>
              <button className="bid-modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              {/* Project Information */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  Project Information
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>Title</label>
                    <p>{detailsJob.title}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>Category</label>
                    <p>{detailsJob.category}</p>
                  </div>
                  <div className="bid-info-item">
                    <label>Status</label>
                    <span className={`bid-status-badge-modal status-${detailsJob.status === 'approved' ? 'approved' : detailsJob.status}`}>
                      {detailsJob.status.charAt(0).toUpperCase() + detailsJob.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                  <label>Description</label>
                  <p>{detailsJob.description}</p>
                </div>
              </section>

              {/* Timeline & Budget */}
              <section className="bid-modal-section bid-modal-highlight">
                <h3 className="bid-section-title">
                  <DollarSign size={20} />
                  Timeline & Budget
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label><Calendar size={14} /> Due Date</label>
                    <p>{formatDate(detailsJob.due_date)}</p>
                  </div>
                  {detailsJob.estimated_duration_days && (
                    <div className="bid-info-item">
                      <label><Clock size={14} /> Estimated Duration</label>
                      <p>{detailsJob.estimated_duration_days} days</p>
                    </div>
                  )}
                  {detailsJob.budget_min && detailsJob.budget_max && (
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> Budget Range</label>
                      <p>{formatCurrency(detailsJob.budget_min)} - {formatCurrency(detailsJob.budget_max)}</p>
                    </div>
                  )}
                  {detailsJob.urgency && (
                    <div className="bid-info-item">
                      <label>Urgency</label>
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
                    Your Bid
                  </h3>
                  <div className="bid-info-grid">
                    <div className="bid-info-item">
                      <label><DollarSign size={14} /> Bid Amount</label>
                      <p style={{ fontWeight: '600', color: 'var(--color-secondary)', fontSize: '1.125rem' }}>
                        {formatCurrency(detailsJob.bid_amount)}
                      </p>
                    </div>
                    {detailsJob.bid_submitted_at && (
                      <div className="bid-info-item">
                        <label><Clock size={14} /> Submitted On</label>
                        <p>{formatDate(detailsJob.bid_submitted_at)}</p>
                      </div>
                    )}
                  </div>
                  {detailsJob.bid_message && (
                    <div className="bid-info-item" style={{ marginTop: '1rem' }}>
                      <label><MessageSquare size={14} /> Your Proposal Message</label>
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

              {/* Property Location Map */}
              {detailsJob.property_latitude && detailsJob.property_longitude && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <MapPin size={20} />
                    Property Location
                  </h3>
                  <div className="bid-info-item" style={{ marginBottom: '0.75rem' }}>
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
                      style={{ height: "200px", width: "100%", borderRadius: "12px" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                Close
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
                  Chat with Manager
                </button>

                {/* Primary action based on status */}
                {detailsJob.status === "accepted" && (
                  <button
                    className="ej-modal-action-btn ej-modal-start"
                    onClick={() => {
                      setShowDetailsModal(false)
                      openModal(detailsJob, "start")
                    }}
                  >
                    <PlayCircle size={16} />
                    Start Project
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
                    Mark Complete
                  </button>
                )}

                {detailsJob.status === "completed" && (
                  <button
                    className="ej-modal-action-btn ej-modal-review"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedJob(detailsJob)
                      if (detailsJob.review && detailsJob.review.length === 0) {
                        setOpenReviewModal(true)
                      } else {
                        getJobInformation(detailsJob)
                      }
                    }}
                  >
                    <Star size={16} />
                    {detailsJob.review && detailsJob.review.length === 0 ? 'Leave Review' : 'View Review'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EntrepreneurJobs