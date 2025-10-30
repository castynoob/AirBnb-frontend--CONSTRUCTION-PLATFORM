import React, { useEffect, useState } from 'react'
import '../../styles/entrepreneur/entrepreneurjobs.css'
import Nav from '../../components/Nav'
import { FaStar } from 'react-icons/fa'

function EntrepreneurJobs() {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('accepted')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [userProfile, setUserProfile] = useState({})
  const [openReviewModal, setOpenReviewModal] = useState(false)
  const [showReviewModal, setShowReviewModal]= useState(false)
  const [manager, setManager] = useState({})
  const [reviewed, setReviewed] = useState(null)

  const [reviewForm, setReviewForm] = useState({
    reviewer_id: '',
    reviewed_user_id: '',
    job_id: '',
    rating: 1,
    comment: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const storedProfile = localStorage.getItem('userProfile')

    if (storedProfile) {
        const user = JSON.parse(storedProfile)
        setUserProfile(user)

        const jobsResponse = await fetch(
        `${API_BASE_URL}/api/jobs/entrepreneur/${user.entrepProfile.entrepProfile.id}`,
            {
                method: 'GET',
                headers: {
                Authorization: `Bearer ${user.token}`,
                },
            }
        )

        if (!jobsResponse.ok) {
        throw new Error(`Error ${jobsResponse.status}`)
        }

        const data = await jobsResponse.json()

        const newJobsData = await Promise.all(
        data.jobs.map(async (job) => {
            try {
            const review = await getReview(job.id, user)
            return { ...job, review }  // merge job and review
            } catch (err) {
            console.error(`Failed to fetch review for job ${job.id}`, err)
            return { ...job, review: null } // fallback
            }
        })
        )

        setJobs(newJobsData)
        console.log("✅ Jobs and reviews loaded:", newJobsData)
        setIsLoading(false)
    }
  }


  const getReview = async (jobId, user) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${API_BASE_URL}/api/reviews/job/${jobId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
        },
        });

        if (!response.ok) {
        // Return null instead of throwing if 404 (no review)
        if (response.status === 404) {
            return null;
        }
        throw new Error(`Failed to fetch review. Status: ${response.status}`);
        }

        const { review } = await response.json(); // match backend response shape
        return review;
    } catch (error) {
        console.error('Error fetching review:', error);
        throw error;
    }
    };


  const filteredJobs = jobs
    .filter((job) => job.status === activeStatus)
    .filter((job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const openModal = (job, type) => {
    setSelectedJob(job)
    setModalType(type)
  }

  const closeModal = () => {
    setSelectedJob(null)
    setModalType(null)
  }

  const handleConfirmAction = () => {
    if (modalType === 'start') startJob()
    else if (modalType === 'done') completeJob()
    closeModal()
  }

  const startJob = async () => {
    setIsConfirming(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem('userProfile'))

    const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'ongoing' })
    })

    if (!res.ok) throw new Error('Failed to start job')
    await fetchJobs()
    setIsConfirming(false)
  }

  const completeJob = async () => {
    setIsConfirming(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem('userProfile'))

    const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'completed' })
    })

    if (!res.ok) throw new Error('Failed to complete job')
    await fetchJobs()
    setIsConfirming(false)
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      alert('Please write a comment.')
      return
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const user = JSON.parse(localStorage.getItem('userProfile'))

    const payload = {
        reviewer_id: user.entrepProfile.entrepProfile.user_id,
        reviewed_user_id: selectedJob.manager_id,
        job_id: selectedJob.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      alert('Review added successfully!')
      setOpenReviewModal(false)
      setReviewForm({ rating: 1, comment: '' })
      fetchJobs()
    } else {
      alert('Failed to submit review.')
    }
  }

  const RatingStars = ({ rating, onChange }) => (
    <div className="ej-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={28}
          color={star <= rating ? '#FFD700' : '#ccc'}
          onClick={() => onChange(star)}
          style={{ cursor: 'pointer', marginRight: 4 }}
        />
      ))}
    </div>
  )

  const getJobInformation = async (job) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const managerResponse = await fetch(`${API_BASE_URL}/api/users/manager/profile/id/${job.manager_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userProfile.token}`
      }
    })

    const reviewResponse = await fetch(`${API_BASE_URL}/api/reviews/job/${job.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userProfile.token}`
      }
    })

    if(!managerResponse.ok || !reviewResponse.ok) {
      throw new Error(`Error ${managerResponse.status}`)
    }

    const managerData = await managerResponse.json()
    const rev = await reviewResponse.json()
    setManager(managerData.profile)
    console.log(managerData)
    setReviewed(rev.review)
    console.log(rev.review)

    setShowReviewModal(true)
  }

  if (isLoading) {
    return (
      <div className="ej-loading-screen">
        <Nav />
        <h1 className="ej-loading-text">Loading jobs...</h1>
      </div>
    )
  }

  return (
    <div className="ej-home-container">
      <Nav />
      <div className="ej-main-container">
        <div className="ej-header-section">
          <h2 className="ej-page-title">My Projects</h2>

          <div className="ej-search-filter">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ej-search-input"
            />
          </div>
        </div>

        <div className="ej-status-tabs">
          {['accepted', 'ongoing', 'completed'].map((status) => (
            <button
              key={status}
              className={`ej-tab-btn ${activeStatus === status ? 'active' : ''}`}
              onClick={() => setActiveStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="ej-job-cards">
          {filteredJobs.length === 0 ? (
            <p className="ej-no-jobs">No {activeStatus} jobs found.</p>
          ) : (
            filteredJobs.map((job) => (
              <div className="ej-job-card" key={job.id}>
                <div className="ej-job-header">
                  <h3 className="ej-job-title">{job.title}</h3>
                  <span className={`ej-job-status ej-status-${job.status}`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>

                <p className="ej-job-desc">{job.description}</p>

                <div className="ej-job-details">
                  <p><strong>Category:</strong> {job.category}</p>
                  <p><strong>Due:</strong> {new Date(job.due_date).toLocaleDateString()}</p>
                </div>

                <div className="ej-job-actions">
                  {job.status === 'accepted' && (
                    <button className="ej-btn ej-btn-start" onClick={() => openModal(job, 'start')}>
                      Start Project
                    </button>
                  )}

                  {job.status === 'ongoing' && (
                    <button className="ej-btn ej-btn-done" onClick={() => openModal(job, 'done')}>
                      Mark as Done
                    </button>
                  )}

                  {job.status === 'completed' && (
                    <button
                      className="ej-btn ej-btn-review"
                      onClick={() => {
                        setSelectedJob(job)
                        if(job.review.length == 0) {
                          setOpenReviewModal(true)
                        } else {
                          console.log(job)
                          getJobInformation(job)
                        }
                      }}
                    >
                      {
                        job.review.length != 0? 'View details' : 'Add Review'
                      }
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ Review Modal */}
      {openReviewModal && (
        <div className="ej-modal-overlay" onClick={() => setOpenReviewModal(false)}>
          <div className="ej-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ej-modal-title">Add Review</h3>

            <RatingStars
              rating={reviewForm.rating}
              onChange={(star) => setReviewForm({ ...reviewForm, rating: star })}
            />

            <textarea
              className="ej-textarea"
              placeholder="Write your review..."
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, comment: e.target.value })
              }
            />

            <div className="ej-modal-actions">
              <button
                className="ej-btn ej-btn-cancel"
                onClick={() => setOpenReviewModal(false)}
              >
                Cancel
              </button>
              <button
                className="ej-btn ej-btn-confirm"
                onClick={handleSubmitReview}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalType && selectedJob && (
        <div className="ej-modal-overlay" onClick={closeModal}>
          <div className="ej-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ej-modal-title">
              {modalType === 'start' && 'Start this project?'}
              {modalType === 'done' && 'Mark this project as completed?'}
            </h3>
            <p className="ej-modal-body">{selectedJob.title}</p>
            <div className="ej-modal-actions">
              <button className="ej-btn ej-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="ej-btn ej-btn-confirm" onClick={handleConfirmAction}>
                {isConfirming ? 'Loading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View job modal */}
      {
        showReviewModal && selectedJob && reviewed != null &&
        <div className="ej-view-job-modal">
          <div className="ej-modal-header">
            <h2 className="ej-job-title">{selectedJob.title}</h2>
            <button className="ej-close-button" onClick={() => setShowReviewModal(false)}>
              ✕
            </button>
          </div>

          <div className="ej-job-meta">
            <span className="ej-job-category">{selectedJob.category}</span>
            <span className="ej-job-urgency">{selectedJob.urgency}</span>
          </div>

          <p className="ej-job-description">{selectedJob.description}</p>

          <div className="ej-job-budget">
            <h4>Budget Range</h4>
            <div className="ej-budget-values">
              <span>${selectedJob.budget_min}</span>
              <span>–</span>
              <span>${selectedJob.budget_max}</span>
            </div>
          </div>

          <div className="ej-manager-section">
            <h4>Property Manager</h4>
            <div className="ej-manager-details">
              <div className="ej-manager-company">{manager.company_name}</div>
              <div className="ej-manager-address">{manager.address}</div>
            </div>
          </div>

          {reviewed && reviewed.length > 0 && (
            <div className="ej-review-section">
              <h4>Your Review</h4>
              <div className="ej-review-details">
                <div className="ej-review-rating">
                  {[...Array(reviewed[0].rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                  {[...Array(5 - reviewed[0].rating)].map((_, i) => (
                    <span key={i} className="star inactive">★</span>
                  ))}
                </div>
                <p className="ej-review-comment">“{reviewed[0].comment}”</p>
                <div className="ej-review-by">
                  — {reviewed[0].reviewer_first_name} {reviewed[0].reviewer_last_name}
                </div>
              </div>
            </div>
          )}
        </div>

      }


    </div>
  )
}

export default EntrepreneurJobs
