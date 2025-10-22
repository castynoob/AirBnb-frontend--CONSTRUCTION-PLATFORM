"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { Bell, Wrench, Search, Plus, X, FileText, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "../../styles/manager/homepage.css"
import Nav from "../../components/Nav"
import RepairList from "../../components/RepairList"
import SummarySection from "../../components/SummarySection"
import RepairDetails from "../works/RepairDetails"

function HomePage() {
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [notifications] = useState([])

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

        // Fetch properties for each job
        const propertiesData = await Promise.all(
          (jobsData.jobs || []).map(async (job) => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/properties/${job.property_id}`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${user.token}`,
                },
              })

              if (!response.ok) {
                throw new Error(`Failed to fetch property: ${response.status}`)
              }

              const data = await response.json()
              const property = data.property

              return {
                id: job.id,
                property: property.building_name || property.address || "Unknown Property",
                address: `${property.city} ${property.province}`,
                apartment: job.title,
                category: job.urgency,
                description: job.description,
                bids: 0,
                budget: `$${job.budget_min} - $${job.budget_max}`,
                images: ["https://constrofacilitator.com/wp-content/uploads/2022/02/roof-repairing.jpg.webp"],
                data: {
                  mangerId: property.manager_id,
                  propertyId: property.id,
                  jobId: job.id,
                }
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

  const handleUrgentRequest = () => {
    alert("Urgent Request Triggered — This would notify all entrepreneurs.")
  }

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
          <p>Loading repairs...</p>
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
          <header className="page-header">
            <div>
              <h1>Repair Work Overview</h1>
            </div>
            <div className="header-actions">
              <div className={`search-box-header ${searchExpanded ? "expanded" : ""}`}>
                <button className="search-trigger-btn" onClick={handleSearchFocus} aria-label="Search">
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
                  className="search-input-header"
                />
              </div>
              <button onClick={handleUrgentRequest} className="urgent-button-icon" aria-label="Urgent Request">
                <Wrench size={20} />
              </button>
              <button onClick={handleAddWork} className="add-work-btn-icon" aria-label="Add New Work">
                <Plus size={20} />
              </button>
              <div className="notification-wrapper" ref={notificationRef}>
                <button className="notification-btn" aria-label="Notifications" onClick={toggleNotifications}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="notification-modal">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button
                        className="close-notification-btn"
                        onClick={toggleNotifications}
                        aria-label="Close notifications"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifications">
                          <Bell size={32} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? "unread" : ""}`}
                          >
                            {notification.type === "bid" ? (
                              <>
                                <div className="notification-icon bid-icon">
                                  <FileText size={20} />
                                </div>
                                <div className="notification-content">
                                  <div className="notification-title">
                                    New Bid Submission
                                    {!notification.read && <span className="unread-dot"></span>}
                                  </div>
                                  <div className="notification-body">
                                    <strong>{notification.bidder}</strong> submitted a bid for{" "}
                                    <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="notification-meta">
                                    <span>Budget: ${notification.budget.toLocaleString()}</span>
                                    <span className="notification-dot">•</span>
                                    <span>License: {notification.licenseNumber}</span>
                                  </div>
                                  <div className="notification-time">
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
                                <div className="notification-icon completed-icon">
                                  <CheckCircle size={20} />
                                </div>
                                <div className="notification-content">
                                  <div className="notification-title">
                                    Work Completed
                                    {!notification.read && <span className="unread-dot"></span>}
                                  </div>
                                  <div className="notification-body">
                                    <strong>{notification.workTitle}</strong> at{" "}
                                    <strong>{notification.property}</strong> - {notification.apartment}
                                  </div>
                                  <div className="notification-meta">
                                    <span>Contractor: {notification.contractor}</span>
                                  </div>
                                  <div className="notification-time">
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
            <div className="no-results-home">
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
