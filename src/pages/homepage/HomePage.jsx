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
    <div className="hp-repair-card-modern hp-skeleton">
      <div className="hp-repair-image-container hp-skeleton-image">
        <div className="hp-shimmer"></div>
      </div>
      <div className="hp-repair-content">
        <div className="hp-repair-header">
          <div className="hp-property-info">
            <div className="hp-skeleton-icon">
              <div className="hp-shimmer"></div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="hp-skeleton-line hp-skeleton-title">
                <div className="hp-shimmer"></div>
              </div>
              <div className="hp-skeleton-line hp-skeleton-subtitle">
                <div className="hp-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="hp-apartment-info">
          <div className="hp-skeleton-line hp-skeleton-apartment">
            <div className="hp-shimmer"></div>
          </div>
        </div>
        <div className="hp-skeleton-line hp-skeleton-description">
          <div className="hp-shimmer"></div>
        </div>
        <div className="hp-skeleton-line hp-skeleton-description hp-short">
          <div className="hp-shimmer"></div>
        </div>
        <div className="hp-repair-footer">
          <div className="hp-skeleton-line hp-skeleton-footer-item">
            <div className="hp-shimmer"></div>
          </div>
          <div className="hp-skeleton-line hp-skeleton-footer-item">
            <div className="hp-shimmer"></div>
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
          <div className="pm-card-icon pm-skeleton-icon-small">
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
  const [imagesLoaded, setImagesLoaded] = useState({})

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

        // Fetch properties, bids, and images for each job
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

              // Fetch images for this job
              let jobImages = []
              const placeholderImage = "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="
              
              try {
                const imagesResponse = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/images`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                })

                if (imagesResponse.ok) {
                  const imagesData = await imagesResponse.json()
                  if (imagesData.images && imagesData.images.length > 0) {
                    jobImages = imagesData.images.map(img => img.image_url)
                  }
                }
              } catch (imageError) {
                console.error("Error fetching job images:", imageError)
              }

              // Use fetched images or fallback to placeholder
              const finalImages = jobImages.length > 0 ? jobImages : [placeholderImage]

              return {
                id: job.id,
                property: property.building_name || property.address || "Unknown Property",
                address: `${property.city} ${property.province}`,
                apartment: job.title,
                category: job.urgency,
                description: job.description,
                bids: bidCount,
                budget: `$${job.budget_min} - $${job.budget_max}`,
                images: finalImages,
                data: {
                  mangerId: property.manager_id,
                  propertyId: property.id,
                  jobId: job.id,
                },
                created_at: job.created_at,
                building_type: property.building_type,
                status: job.status
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
      // Filter urgent/emergency jobs
      const urgentJobs = jobs.filter(job =>
        job.is_emergency === true || job.urgency?.toLowerCase().includes('urgent')
      );

      if (urgentJobs.length === 0) {
        alert("No urgent or emergency jobs to send.");
        setIsSending(false);
        return;
      }

      // Group jobs by category
      const jobsByCategory = urgentJobs.reduce((acc, job) => {
        const category = job.category || 'General';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(job);
        return acc;
      }, {});

      // Create professional HTML email
      const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Urgent Jobs Alert</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

                  <!-- Header with Branding -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                        🏗️ INTERVOS
                      </h1>
                      <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 14px; letter-spacing: 1px;">
                        Construction Platform
                      </p>
                    </td>
                  </tr>

                  <!-- Alert Banner -->
                  <tr>
                    <td style="background-color: #ff4444; padding: 15px 30px; text-align: center;">
                      <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                        ⚠️ URGENT JOBS ALERT
                      </p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 22px; font-weight: 600;">
                        Dear Contractor,
                      </h2>

                      <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                        Property Manager <strong>${uProfile.name}</strong> has posted <strong>${urgentJobs.length}</strong> urgent job${urgentJobs.length > 1 ? 's' : ''} that require immediate attention.
                        These projects are time-sensitive and need experienced contractors.
                      </p>

                      <!-- Property Manager Info -->
                      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                        <h3 style="margin: 0 0 12px; color: #333333; font-size: 16px; font-weight: 600;">
                          📋 Property Manager Details
                        </h3>
                        <table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">
                          <tr>
                            <td style="color: #666666; font-size: 14px; padding: 5px 0;"><strong>Name:</strong></td>
                            <td style="color: #333333; font-size: 14px; padding: 5px 0;">${uProfile.name}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px; padding: 5px 0;"><strong>Email:</strong></td>
                            <td style="color: #333333; font-size: 14px; padding: 5px 0;">${uProfile.email}</td>
                          </tr>
                          ${uProfile.phone ? `
                          <tr>
                            <td style="color: #666666; font-size: 14px; padding: 5px 0;"><strong>Phone:</strong></td>
                            <td style="color: #333333; font-size: 14px; padding: 5px 0;">${uProfile.phone}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      <!-- Jobs by Category -->
                      <h3 style="margin: 0 0 20px; color: #333333; font-size: 18px; font-weight: 600;">
                        🔨 Urgent Jobs by Category
                      </h3>

                      ${Object.entries(jobsByCategory).map(([category, categoryJobs]) => `
                        <div style="margin-bottom: 25px;">
                          <div style="background-color: #667eea; color: #ffffff; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 15px;">
                            ${category} (${categoryJobs.length} job${categoryJobs.length > 1 ? 's' : ''})
                          </div>
                          <div style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 6px 6px; padding: 15px;">
                            ${categoryJobs.map((job, index) => `
                              <div style="padding: ${index > 0 ? '15px 0 0 0' : '0'}; ${index > 0 ? 'border-top: 1px solid #f0f0f0; margin-top: 15px;' : ''}">
                                <h4 style="margin: 0 0 8px; color: #333333; font-size: 15px; font-weight: 600;">
                                  ${job.title}
                                </h4>
                                <p style="margin: 0 0 8px; color: #666666; font-size: 14px; line-height: 1.5;">
                                  ${job.description}
                                </p>
                                <div style="display: flex; gap: 15px; margin-top: 10px;">
                                  <span style="color: #22c55e; font-size: 13px; font-weight: 600;">
                                    💰 $${job.budget_min} - $${job.budget_max}
                                  </span>
                                  ${job.is_emergency ? `
                                  <span style="background-color: #ff4444; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                    EMERGENCY
                                  </span>
                                  ` : ''}
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      `).join('')}

                      <!-- Call to Action -->
                      <div style="text-align: center; margin-top: 35px;">
                        <a href="https://air-bnb-frontend-construction-platf.vercel.app/"
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">
                          View All Jobs on Dashboard →
                        </a>
                      </div>

                      <p style="margin: 30px 0 0; color: #888888; font-size: 13px; line-height: 1.6; text-align: center;">
                        These jobs require immediate attention. Please log in to your dashboard to review full details and submit your bid.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0 0 8px; color: #666666; font-size: 13px;">
                        © ${new Date().getFullYear()} Intervos Construction Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        This is an automated notification. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Plain text version
      const textMessage = `
INTERVOS - Construction Platform
URGENT JOBS ALERT

Dear Contractor,

Property Manager ${uProfile.name} has posted ${urgentJobs.length} urgent job${urgentJobs.length > 1 ? 's' : ''} that require immediate attention.

Property Manager Details:
- Name: ${uProfile.name}
- Email: ${uProfile.email}
${uProfile.phone ? `- Phone: ${uProfile.phone}` : ''}

Urgent Jobs by Category:
${Object.entries(jobsByCategory).map(([category, categoryJobs]) => `
${category} (${categoryJobs.length} job${categoryJobs.length > 1 ? 's' : ''}):
${categoryJobs.map(job => `
  • ${job.title}
    ${job.description}
    Budget: $${job.budget_min} - $${job.budget_max}
    ${job.is_emergency ? '[EMERGENCY]' : ''}
`).join('\n')}
`).join('\n')}

Please log in to your dashboard to review full details and submit your bid.

Visit: https://air-bnb-frontend-construction-platf.vercel.app/

© ${new Date().getFullYear()} Intervos Construction Platform
      `.trim();

      const emailResponse = await fetch(`${API_BASE_URL}/api/email/send-to-entrepreneurs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${uProfile.token}`,
        },
        body: JSON.stringify({
          subject: `🚨 Urgent: ${urgentJobs.length} New Job${urgentJobs.length > 1 ? 's' : ''} from ${uProfile.name} - Intervos`,
          message: textMessage,
          html: htmlEmail,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(`Error ${emailResponse.status}`);
      }

      const data = await emailResponse.json();
      console.log("✅ EMAIL RES:", data);
      setIsSending(false)
      alert(`✅ ${data.message}\n\nSent ${urgentJobs.length} urgent job${urgentJobs.length > 1 ? 's' : ''} notification to all entrepreneurs.`);
    } catch (error) {
      setIsSending(false)
      console.error("❌ Email send error:", error);
      alert("Failed to send urgent request emails. Please try again.");
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
            <div className="pm-header-left">
              <div className="pm-header-title-group">
                <h1>TRAVAUX</h1>
                <span className="pm-project-count">0 active</span>
              </div>
            </div>
            <div className="pm-header-actions">
              <div className="pm-search-wrapper">
                <Search size={18} className="pm-search-icon" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="pm-search-input"
                  disabled
                />
              </div>

              <div className="pm-action-buttons">
                <button className="pm-btn pm-btn-secondary" disabled>
                  <Wrench size={18} />
                  <span>Urgent</span>
                </button>
                <button className="pm-btn pm-btn-primary" disabled>
                  <Plus size={18} />
                  <span>New Project</span>
                </button>
              </div>

              <div className="pm-notification-wrapper">
                <button className="pm-notification-btn" aria-label="Notifications" disabled>
                  <Bell size={18} />
                </button>
              </div>
            </div>
          </header>

          <SummarySkeleton />

          <section className="hp-repairs-section">
            <div className="hp-section-header">
              <h2>All Repair Work</h2>
              <p className="hp-section-subtitle">Loading repairs...</p>
            </div>
            <div className="hp-repair-cards-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            <div className="pm-header-left">
              <div className="pm-header-title-group">
                <h1>TRAVAUX</h1>
                <span className="pm-project-count">{properties.length} active</span>
              </div>
            </div>
            <div className="pm-header-actions">
              <div className="pm-search-wrapper">
                <Search size={18} className="pm-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pm-search-input"
                />
              </div>

              <div className="pm-action-buttons">
                <button
                  onClick={handleUrgentRequest}
                  className="pm-btn pm-btn-secondary"
                  disabled={isSending}
                  title="Send urgent requests"
                >
                  {isSending ? <LoaderIcon size={18} /> : <Wrench size={18} />}
                  <span>Urgent</span>
                </button>
                <button
                  onClick={handleAddWork}
                  className="pm-btn pm-btn-primary"
                  title="Create new project"
                >
                  <Plus size={18} />
                  <span>New Jobs</span>
                </button>
              </div>

              <div className="pm-notification-wrapper" ref={notificationRef}>
                <button className="pm-notification-btn" aria-label="Notifications" onClick={toggleNotifications}>
                  <Bell size={18} />
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