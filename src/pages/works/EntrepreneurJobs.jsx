
import { useEffect, useState } from "react"
import "../../styles/entrepreneur/entrepreneurjobs.css"
import Nav from "../../components/Nav"
import { FaSearch, FaTimes } from "react-icons/fa"

function EntrepreneurJobs() {
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
      <div className="ej-loading-screen">
        <Nav />
        <div className="ej-loading-container">
          <div className="ej-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ej-container">
      <Nav />
      <div className="ej-content">
        {/* Page Header */}
        <div className="ej-page-header">
          <div>
            <h1 className="ej-page-title">My Projects</h1>
            <p className="ej-page-subtitle">Track and manage your active projects</p>
          </div>
          <div className="ej-header-stats">
            <div className="ej-stat-chip">
              <span className="ej-stat-label">Total</span>
              <span className="ej-stat-value">{jobs.length}</span>
            </div>
            <div className="ej-stat-chip ej-stat-active">
              <span className="ej-stat-label">Active</span>
              <span className="ej-stat-value">{jobs.filter((j) => j.status === "ongoing").length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ej-tabs-container">
          {["accepted", "ongoing", "completed"].map((status) => (
            <button
              key={status}
              className={`ej-tab-btn ${activeStatus === status ? "active" : ""}`}
              onClick={() => setActiveStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ej-tab-count">{getStatusCount(status)}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="ej-search-box">
          <FaSearch size={16} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="ej-clear-btn" onClick={() => setSearchTerm("")}>
              <FaTimes size={14} />
            </button>
          )}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="ej-empty-state">
            <p>No {activeStatus} projects found.</p>
          </div>
        ) : (
          <div className="ej-jobs-grid">
            {filteredJobs.map((job) => {
              return (
                <div className="ej-job-card" key={job.id}>
                  {/* Card Header */}
                  <div className="ej-card-header">
                    <div className={`ej-status-badge ej-status-${job.status}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </div>
                    <span className="ej-job-category">{job.category}</span>
                  </div>

                  {/* Job Title */}
                  <h3 className="ej-job-title">{job.title}</h3>

                  {/* Job Description */}
                  <p className="ej-job-description">{job.description}</p>

                  {/* Quick Info */}
                  <div className="ej-quick-info">
                    <div className="ej-info-item">
                      <span className="ej-info-label">Due Date</span>
                      <span className="ej-info-value">{formatDate(job.due_date)}</span>
                    </div>
                  </div>

                  {/* Card Footer with Actions */}
                  <div className="ej-card-footer">
                    <button className="ej-btn ej-btn-details" onClick={() => handleViewDetails(job)}>
                      View Details
                    </button>
                    <div className="ej-action-buttons">
                      {job.status === "accepted" && (
                        <button className="ej-btn ej-btn-primary" onClick={() => openModal(job, "start")}>
                          Start Project
                        </button>
                      )}

                      {job.status === "ongoing" && (
                        <button className="ej-btn ej-btn-success" onClick={() => openModal(job, "done")}>
                          Mark as Done
                        </button>
                      )}

                      {job.status === "completed" && (
                        <button
                          className="ej-btn ej-btn-secondary"
                          onClick={() => {
                            setSelectedJob(job)
                            if (job.review.length === 0) {
                              setOpenReviewModal(true)
                            } else {
                              getJobInformation(job)
                            }
                          }}
                        >
                          {job.review.length !== 0 ? "View Review" : "Add Review"}
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
        <div className="ej-rm-modal-overlay" onClick={() => {
          setOpenReviewModal(false)
          reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
          setReviewImagePreviews([])
          setReviewImages([])
        }}>
          <div className="ej-rm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="ej-rm-modal-header">
              <div className="ej-rm-header-content">
                <h2 className="ej-rm-modal-title">Leave a Review</h2>
                <p className="ej-rm-modal-subtitle">{selectedJob?.title}</p>
              </div>
              <button
                className="ej-rm-close-btn"
                onClick={() => {
                  setOpenReviewModal(false)
                  reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url))
                  setReviewImagePreviews([])
                  setReviewImages([])
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="ej-rm-modal-body">
              {/* Rating Section */}
              <div className="ej-rm-rating-section">
                <label className="ej-rm-section-label">How would you rate your experience?</label>
                <div className="ej-rm-stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`ej-rm-star-btn ${reviewForm.rating >= star ? 'ej-rm-active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ej-rm-rating-text">{reviewForm.rating}/5</span>
                </div>
              </div>

              {/* Comment Section */}
              <div className="ej-rm-comment-section">
                <label className="ej-rm-section-label">Share your experience</label>
                <textarea
                  className="ej-rm-textarea"
                  placeholder="Tell us about your experience with this property manager..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={5}
                />
                <div className="ej-rm-char-count">
                  {reviewForm.comment.length} characters {reviewForm.comment.trim().length < 10 && '(minimum 10)'}
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="ej-rm-image-section">
                <label className="ej-rm-section-label">Add photos (optional)</label>
                <p className="ej-rm-section-hint">Upload up to 5 photos to showcase the work</p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="ej-rm-file-input"
                  id="ej-rm-review-images"
                />
                <label htmlFor="ej-rm-review-images" className="ej-rm-upload-btn">
                  <span>📷</span>
                  <span>Choose Images</span>
                </label>

                {reviewImagePreviews.length > 0 && (
                  <div className="ej-rm-image-grid">
                    {reviewImagePreviews.map((preview, index) => (
                      <div key={index} className="ej-rm-image-item">
                        <img src={preview} alt={`Preview ${index + 1}`} className="ej-rm-image-preview" />
                        <button
                          type="button"
                          className="ej-rm-remove-btn"
                          onClick={() => removeReviewImage(index)}
                          title="Remove image"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ej-rm-modal-footer">
              <button
                className="ej-rm-btn ej-rm-btn-cancel"
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
                className="ej-rm-btn ej-rm-btn-submit"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewForm.rating || !reviewForm.comment.trim() || reviewForm.comment.trim().length < 10}
              >
                {isSubmittingReview ? (
                  <>
                    <div className="ej-rm-spinner"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>⭐</span>
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
        <div className="ej-modal-overlay" onClick={closeModal}>
          <div className="ej-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ej-modal-header">
              <h3 className="ej-modal-title">
                {modalType === "start" && "Start this project?"}
                {modalType === "done" && "Mark this project as completed?"}
              </h3>
            </div>
            <p className="ej-modal-body">{selectedJob.title}</p>
            <div className="ej-modal-footer">
              <button className="ej-btn ej-btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button className="ej-btn ej-btn-primary" onClick={handleConfirmAction}>
                {isConfirming ? "Loading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Job Details Modal */}
      {showReviewModal && selectedJob && reviewed != null && (
        <div className="ej-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="ej-modal ej-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="ej-modal-header">
              <h2 className="ej-modal-title">{selectedJob.title}</h2>
              <button className="ej-modal-close" onClick={() => setShowReviewModal(false)}>
                ✕
              </button>
            </div>

            <div className="ej-modal-body">
              <div className="ej-details-section">
                <h4 className="ej-section-title">Project Details</h4>
                <div className="ej-detail-field">
                  <span className="ej-detail-label">Category</span>
                  <span className="ej-detail-value">{selectedJob.category}</span>
                </div>
                <div className="ej-detail-field">
                  <span className="ej-detail-label">Due Date</span>
                  <span className="ej-detail-value">{formatDate(selectedJob.due_date)}</span>
                </div>
                {selectedJob.budget_min && selectedJob.budget_max && (
                  <div className="ej-detail-field">
                    <span className="ej-detail-label">Budget Range</span>
                    <span className="ej-detail-value">
                      {formatCurrency(selectedJob.budget_min)} - {formatCurrency(selectedJob.budget_max)}
                    </span>
                  </div>
                )}
              </div>

              <div className="ej-details-section">
                <h4 className="ej-section-title">Property Manager</h4>
                <div className="ej-detail-field">
                  <span className="ej-detail-label">Company</span>
                  <span className="ej-detail-value">{manager.company_name}</span>
                </div>
                <div className="ej-detail-field">
                  <span className="ej-detail-label">Address</span>
                  <span className="ej-detail-value">{manager.address}</span>
                </div>
              </div>

              {reviewed && reviewed.length > 0 && (
                <div className="ej-details-section">
                  <h4 className="ej-section-title">Your Review</h4>
                  <div className="ej-review-rating">
                    {[...Array(reviewed[0].rating)].map((_, i) => (
                      <span key={i} className="ej-star">
                        ★
                      </span>
                    ))}
                    {[...Array(5 - reviewed[0].rating)].map((_, i) => (
                      <span key={i} className="ej-star inactive">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="ej-review-comment">"{reviewed[0].comment}"</p>
                  <div className="ej-review-by">
                    — {reviewed[0].reviewer_first_name} {reviewed[0].reviewer_last_name}
                  </div>

                  {/* Display attached images */}
                  {reviewed[0].images && reviewed[0].images.length > 0 && (
                    <div className="ej-review-images-section">
                      <label className="ej-image-label">
                        Attached Photos ({reviewed[0].images.length}):
                      </label>
                      <div className="ej-image-previews">
                        {reviewed[0].images.map((image, index) => (
                          <div key={index} className="ej-image-preview">
                            <img
                              src={image.image_url}
                              alt={`Review ${index + 1}`}
                              onClick={() => window.open(image.image_url, "_blank")}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showDetailsModal && detailsJob && (
        <div className="ej-details-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="ej-details-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="ej-details-modal-header">
              <h2 className="ej-details-modal-title">Project Details</h2>
              <button className="ej-details-modal-close" onClick={() => setShowDetailsModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>

            <div className="ej-details-modal-body">
              {/* Project Information */}
              <div className="ej-details-modal-section">
                <h4 className="ej-details-section-title">Project Information</h4>
                <div className="ej-details-field">
                  <span className="ej-details-label">Title</span>
                  <span className="ej-details-value">{detailsJob.title}</span>
                </div>
                <div className="ej-details-field">
                  <span className="ej-details-label">Category</span>
                  <span className="ej-details-value">{detailsJob.category}</span>
                </div>
                <div className="ej-details-field">
                  <span className="ej-details-label">Status</span>
                  <span className={`ej-details-status-badge ej-status-${detailsJob.status}`}>
                    {detailsJob.status.charAt(0).toUpperCase() + detailsJob.status.slice(1)}
                  </span>
                </div>
                <div className="ej-details-field">
                  <span className="ej-details-label">Description</span>
                  <span className="ej-details-value">{detailsJob.description}</span>
                </div>
              </div>

              {/* Timeline & Budget */}
              <div className="ej-details-modal-section">
                <h4 className="ej-details-section-title">Timeline & Budget</h4>
                <div className="ej-details-field">
                  <span className="ej-details-label">Due Date</span>
                  <span className="ej-details-value">{formatDate(detailsJob.due_date)}</span>
                </div>
                {detailsJob.estimated_duration_days && (
                  <div className="ej-details-field">
                    <span className="ej-details-label">Estimated Duration</span>
                    <span className="ej-details-value">{detailsJob.estimated_duration_days} days</span>
                  </div>
                )}
                {detailsJob.budget_min && detailsJob.budget_max && (
                  <div className="ej-details-field">
                    <span className="ej-details-label">Budget Range</span>
                    <span className="ej-details-value">
                      {formatCurrency(detailsJob.budget_min)} - {formatCurrency(detailsJob.budget_max)}
                    </span>
                  </div>
                )}
                {detailsJob.urgency && (
                  <div className="ej-details-field">
                    <span className="ej-details-label">Urgency</span>
                    <span className="ej-details-value">{detailsJob.urgency}</span>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              {(detailsJob.is_emergency || detailsJob.is_budget_hidden !== undefined) && (
                <div className="ej-details-modal-section">
                  <h4 className="ej-details-section-title">Additional Information</h4>
                  {detailsJob.is_emergency && (
                    <div className="ej-details-field">
                      <span className="ej-details-label">Emergency</span>
                      <span className="ej-details-value">Yes</span>
                    </div>
                  )}
                  {detailsJob.is_budget_hidden !== undefined && (
                    <div className="ej-details-field">
                      <span className="ej-details-label">Budget Hidden</span>
                      <span className="ej-details-value">{detailsJob.is_budget_hidden ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ej-details-modal-footer">
              <button className="ej-details-modal-btn-close" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EntrepreneurJobs