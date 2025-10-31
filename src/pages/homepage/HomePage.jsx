"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { Bell, Wrench, Search, Plus, X, FileText, CheckCircle, LoaderIcon  } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "../../styles/manager/homepage.css"
import Nav from "../../components/Nav"
import RepairList from "../../components/RepairList"
import SummarySection from "../../components/SummarySection"
import RepairDetails from "../works/RepairDetails"

// Skeleton Loader Component
function SkeletonCard() {
  return (
    <div className="pm-repair-card-modern pm-skeleton">
      <div className="pm-repair-image-container pm-skeleton-image">
        <div className="pm-shimmer"></div>
      </div>
      <div className="pm-repair-content">
        <div className="pm-repair-header">
          <div className="pm-skeleton-line pm-skeleton-title">
            <div className="pm-shimmer"></div>
          </div>
          <div className="pm-skeleton-line pm-skeleton-subtitle">
            <div className="pm-shimmer"></div>
          </div>
        </div>
        <div className="pm-skeleton-line pm-skeleton-apartment">
          <div className="pm-shimmer"></div>
        </div>
        <div className="pm-skeleton-line pm-skeleton-description">
          <div className="pm-shimmer"></div>
        </div>
        <div className="pm-skeleton-line pm-skeleton-description">
          <div className="pm-shimmer"></div>
        </div>
        <div className="pm-repair-footer">
          <div className="pm-skeleton-line pm-skeleton-footer-item">
            <div className="pm-shimmer"></div>
          </div>
          <div className="pm-skeleton-line pm-skeleton-footer-item">
            <div className="pm-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="pm-summary-section">
      {[1, 2, 3].map((i) => (
        <div key={i} className="pm-summary-card pm-skeleton">
          <div className="pm-skeleton-icon">
            <div className="pm-shimmer"></div>
          </div>
          <div className="pm-card-content">
            <div className="pm-skeleton-line pm-skeleton-label">
              <div className="pm-shimmer"></div>
            </div>
            <div className="pm-skeleton-line pm-skeleton-value">
              <div className="pm-shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [notifications] = useState([])
  const [uProfile, setUProfile] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const userProfile = localStorage.getItem("userProfile")
        if (!userProfile) {
          throw new Error("User profile not found")
        }

        const user = JSON.parse(userProfile)
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        setUProfile(user)
        // Fetch jobs
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
        setJobs(jobsData.jobs || [])

        // Fetch properties and bids for each job
        const propertiesData = await Promise.all(
          (jobsData.jobs || []).map(async (job) => {
            try {
              // Fetch property details
              const propertyResponse = await fetch(`${API_BASE_URL}/api/properties/${job.property_id}`, {
                method: "GET",
                headers: {
                  'Authorization': `Bearer ${user.token}`,
                },
              })

              if (!propertyResponse.ok) {
                throw new Error(`Failed to fetch property: ${propertyResponse.status}`)
              }

              const propertyData = await propertyResponse.json()
              const property = propertyData.property

              // Fetch bids for this job
              let bidCount = 0
              try {
                const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/job/${job.id}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                })

                if (bidsResponse.ok) {
                  const bidsData = await bidsResponse.json()
                  bidCount = bidsData.total_bids || 0
                }
              } catch (bidError) {
                console.error("Error fetching bids:", bidError)
                // Continue with 0 bids if fetch fails
              }
              return {
                id: job.id,
                property: property.building_name || property.address || "Unknown Property",
                address: `${property.city} ${property.province}`,
                apartment: job.title,
                category: job.urgency,
                description: job.description,
                bids: bidCount,
                budget: `$${job.budget_min} - $${job.budget_max}`,
                images: ["https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="],
                data: {
                  mangerId: property.manager_id,
                  propertyId: property.id,
                  jobId: job.id,
                },
                created_at: job.created_at,
                building_type: property.building_type
              }
            } catch (err) {
              console.error("Error fetching property:", err)
              return null
            }
          }),
        )

        // Filter out null values from failed requests
        setProperties(propertiesData.filter((p) => p !== null))
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const [isHome, setIsHome] = useState(true)
  const [repair, setRepair] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchInputRef = useRef(null)
  const notificationRef = useRef(null)

  // urgent
  const [isSending, setIsSending] = useState(false)

  const handleUrgentRequest = async () => {
    setIsSending(true)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      const emailResponse = await fetch(`${API_BASE_URL}/api/email/send-to-entrepreneurs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${uProfile.token}`,
        },
        body: JSON.stringify({
          subject: `🚨 Urgent Request from ${uProfile.name}`,
          message: "Please check your dashboard for an important update.",
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(`Error ${emailResponse.status}`);
      }

      const data = await emailResponse.json();
      console.log("✅ EMAIL RES:", data);
      setIsSending(false)
      alert(data.message); // optional feedback for the UI
    } catch (error) {
      setIsSending(false)
      console.error("❌ Email send error:", error);
      alert("Failed to send urgent request emails.");
    }
  };


  const handleAddWork = () => {
    navigate("/add-work/property_manager")
  }

  const handleRepairClicked = useCallback((value, repair) => {
    setIsHome(value)
    setRepair(repair)
  }, [])

  const handleSearchFocus = () => {
    setSearchExpanded(true)
  }

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setSearchExpanded(false)
    }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchExpanded])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNotifications])

  const filteredRepairs = properties.filter(
    (repair) =>
      repair.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div className="homepage">
        <Nav />
        <div className="main-container">
          <header className="pm-page-header">
            <div>
              <h1>Repair Work Overview</h1>
            </div>
            <div className="pm-header-actions">
              <div className="pm-search-box-header">
                <button className="pm-search-trigger-btn" aria-label="Search">
                  <Search size={20} />
                </button>
              </div>
              <button className="pm-urgent-button-icon" aria-label="Urgent Request">
                <Wrench size={20} />
              </button>
              <button className="pm-add-work-btn-icon" aria-label="Add New Work">
                <Plus size={20} />
              </button>
              <button className="pm-notification-btn" aria-label="Notifications">
                <Bell size={20} />
              </button>
            </div>
          </header>

          <SummarySkeleton />

          <section className="pm-repairs-section">
            <div className="pm-section-header">
              <h2>Active Repairs</h2>
              <p className="pm-section-subtitle">Manage and monitor all ongoing repair work</p>
            </div>
            <div className="pm-repair-cards-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="homepage">
        <Nav />
        <div className="main-container">
          <p style={{ color: "red" }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="homepage">
      <Nav />
      {isHome ? (
        <div className="main-container">
          <header className="pm-page-header">
            <div>
              <h1>Repair Work Overview</h1>
            </div>
            <div className="pm-header-actions">
              <div className={`pm-search-box-header ${searchExpanded ? "expanded" : ""}`}>
                <button className="pm-search-trigger-btn" onClick={handleSearchFocus} aria-label="Search">
                  <Search size={20} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search repairs, apartments, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pm-search-input-header"
                />
              </div>
              <button onClick={handleUrgentRequest} className="pm-urgent-button-icon" aria-label="Urgent Request">
                {
                  isSending ? 
                  <LoaderIcon size={20} /> :
                  <Wrench size={20} />
                }
              </button>
              <button onClick={handleAddWork} className="pm-add-work-btn-icon" aria-label="Add New Work">
                <Plus size={20} />
              </button>
              <div className="pm-notification-wrapper" ref={notificationRef}>
                <button className="pm-notification-btn" aria-label="Notifications" onClick={toggleNotifications}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="pm-notification-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="pm-notification-modal">
                    <div className="pm-notification-header">
                      <h3>Notifications</h3>
                      <button
                        className="pm-close-notification-btn"
                        onClick={toggleNotifications}
                        aria-label="Close notifications"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="pm-notification-list">
                      {notifications.length === 0 ? (
                        <div className="pm-no-notifications">
                          <Bell size={32} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`pm-notification-item ${!notification.read ? "unread" : ""}`}
                          >
                            {notification.type === "bid" ? (
                              <>
                                <div className="pm-notification-icon pm-bid-icon">
                                  <FileText size={20} />
                                </div>
                                <div className="pm-notification-content">
                                  <div className="pm-notification-title">
                                    New Bid Submission
                                    {!notification.read && <span className="pm-unread-dot"></span>}
                                  </div>
                                  <div className="pm-notification-body">
                                    <strong>{notification.bidder}</strong> submitted a bid for{" "}
                                    <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="pm-notification-meta">
                                    <span>Budget: ${notification.budget.toLocaleString()}</span>
                                    <span className="pm-notification-dot">•</span>
                                    <span>License: {notification.licenseNumber}</span>
                                  </div>
                                  <div className="pm-notification-time">
                                    {new Date(notification.submissionDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="pm-notification-icon pm-completed-icon">
                                  <CheckCircle size={20} />
                                </div>
                                <div className="pm-notification-content">
                                  <div className="pm-notification-title">
                                    Work Completed
                                    {!notification.read && <span className="pm-unread-dot"></span>}
                                  </div>
                                  <div className="pm-notification-body">
                                    <strong>{notification.workTitle}</strong> at{" "}
                                    <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="pm-notification-meta">
                                    <span>Contractor: {notification.contractor}</span>
                                  </div>
                                  <div className="pm-notification-time">
                                    {new Date(notification.completionDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <SummarySection repairs={properties} />

          <RepairList repairs={filteredRepairs} handleRepairClicked={handleRepairClicked} />

          {filteredRepairs.length === 0 && (
            <div className="pm-no-results-home">
              <p>No repairs found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        <RepairDetails handleRepairClicked={handleRepairClicked} repair={repair} />
      )}
    </div>
  )
}

export default HomePage