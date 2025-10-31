
import { useEffect, useState } from "react"
import "../../styles/entrepreneur/entrepreneurjobs.css"
import Nav from "../../components/Nav"
import { FaChevronDown, FaSearch, FaTimes } from "react-icons/fa"

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
  const [expandedCards, setExpandedCards] = useState({})

  const [reviewForm, setReviewForm] = useState({
    reviewer_id: "",
    reviewed_user_id: "",
    job_id: "",
    rating: 1,
    comment: "",
  })

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

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      alert("Please write a comment.")
      return
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem("userProfile"))

    const payload = {
      reviewer_id: user.entrepProfile.entrepProfile.user_id,
      reviewed_user_id: selectedJob.manager_id,
      job_id: selectedJob.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      alert("Review added successfully!")
      setOpenReviewModal(false)
      setReviewForm({ rating: 1, comment: "" })
      fetchJobs()
    } else {
      alert("Failed to submit review.")
    }
  }

  const RatingStars = ({ rating, onChange }) => (
    <div className="ej-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`ej-star-btn ${star <= rating ? "active" : ""}`}
          onClick={() => onChange(star)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  )

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

  const toggleCardExpanded = (jobId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }))
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
              const isExpanded = expandedCards[job.id]
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

                  {/* Expand Button */}
                  <button className="ej-expand-btn" onClick={() => toggleCardExpanded(job.id)}>
                    <FaChevronDown size={14} className={isExpanded ? "rotated" : ""} />
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="ej-card-details">
                      <div className="ej-details-section">
                        <h4 className="ej-section-title">Project Details</h4>
                        <div className="ej-detail-field">
                          <span className="ej-detail-label">Category</span>
                          <span className="ej-detail-value">{job.category}</span>
                        </div>
                        <div className="ej-detail-field">
                          <span className="ej-detail-label">Due Date</span>
                          <span className="ej-detail-value">{formatDate(job.due_date)}</span>
                        </div>
                        {job.budget_min && job.budget_max && (
                          <div className="ej-detail-field">
                            <span className="ej-detail-label">Budget Range</span>
                            <span className="ej-detail-value">
                              {formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Footer with Actions */}
                  <div className="ej-card-footer">
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
                          {job.review.length !== 0 ? "View Details" : "Add Review"}
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

      {/* Review Modal */}
      {openReviewModal && (
        <div className="ej-modal-overlay" onClick={() => setOpenReviewModal(false)}>
          <div className="ej-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ej-modal-header">
              <h3 className="ej-modal-title">Add Your Review</h3>
              <button className="ej-modal-close" onClick={() => setOpenReviewModal(false)}>
                ✕
              </button>
            </div>

            <div className="ej-modal-body">
              <p className="ej-rating-label">Rate your experience:</p>
              <RatingStars
                rating={reviewForm.rating}
                onChange={(star) => setReviewForm({ ...reviewForm, rating: star })}
              />

              <textarea
                className="ej-textarea"
                placeholder="Write your feedback..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
            </div>

            <div className="ej-modal-footer">
              <button className="ej-btn ej-btn-outline" onClick={() => setOpenReviewModal(false)}>
                Cancel
              </button>
              <button className="ej-btn ej-btn-primary" onClick={handleSubmitReview}>
                Submit Review
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EntrepreneurJobs