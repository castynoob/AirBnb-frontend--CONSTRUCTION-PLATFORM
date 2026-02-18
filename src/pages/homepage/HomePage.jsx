"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { Wrench, Search, Plus, Megaphone, Building2, Bell, AlertTriangle, X, Check, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "../../styles/manager/homepage.css"
import Nav from "../../components/Nav"
import { useLanguage } from "../../contexts/LanguageContext"
import RepairList from "../../components/RepairList"
import SummarySection from "../../components/SummarySection"
import RepairDetails from "../works/RepairDetails"
import AddAnnouncementModal from "../../components/modal/AddAnnouncementModal"
import AddPropertyModal from "../../components/modal/AddPropertyModal"
import AddWorkModalCompact from "../../components/modal/AddWorkModalCompact"
import InspectionReportUploadModal from "../../components/InspectionReportUploadModal"
import NotificationBell from "../../components/NotificationBell"

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
          <div className="pm-card-left-content">
            <div className="pm-skeleton-line pm-skeleton-label">
              <div className="pm-shimmer"></div>
            </div>
            <div className="pm-skeleton-line pm-skeleton-value">
              <div className="pm-shimmer"></div>
            </div>
            <div className="pm-skeleton-line pm-skeleton-sublabel">
              <div className="pm-shimmer"></div>
            </div>
          </div>
          <div className="pm-card-right-column">
            <div className="pm-skeleton-icon-circle">
              <div className="pm-shimmer"></div>
            </div>
            <div className="pm-skeleton-trend">
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
  const { t } = useLanguage()

  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagesLoaded, setImagesLoaded] = useState({})

  const [uProfile, setUProfile] = useState({})
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [showAddWorkModal, setShowAddWorkModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [selectedPropertyForInspection, setSelectedPropertyForInspection] = useState('')

  // Summary statistics
  const [totalProperties, setTotalProperties] = useState(0)
  const [totalBidsApproved, setTotalBidsApproved] = useState(0)
  const [totalJobs, setTotalJobs] = useState(0)

  // Refetch function that can be called to update data
  const fetchData = useCallback(async () => {
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
              // Skip if property_id is null or invalid
              if (!job.property_id || job.property_id === 'null' || job.property_id === 'undefined') {
                console.warn(`Job ${job.id} has invalid property_id:`, job.property_id);
                return null;
              }

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
              let hasApprovedBid = false
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
                  // Check if there's any approved bid
                  const bids = bidsData.bids || []
                  hasApprovedBid = bids.some(bid =>
                    bid.status?.toLowerCase() === 'approved' ||
                    bid.status?.toLowerCase() === 'accepted'
                  )
                }
              } catch (bidError) {
                console.error("Error fetching bids:", bidError)
                // Continue with 0 bids if fetch fails
              }

              // Fetch images for this job
              let jobImages = []
              const placeholderImage = "/defaultjobs.png"

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
                hasApprovedBid: hasApprovedBid,
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
        const validProperties = propertiesData.filter((p) => p !== null)
        setProperties(validProperties)

        // Calculate summary statistics
        // 1. Total properties - Fetch all properties owned by the manager
        try {
          const propertiesResponse = await fetch(`${API_BASE_URL}/api/properties/`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          })

          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json()
            // Count unique properties by ID
            const uniquePropertyIds = new Set(
              (propertiesData.properties || []).map(p => p.id)
            )
            setTotalProperties(uniquePropertyIds.size)
          } else {
            // Fallback: count from jobs if properties fetch fails
            const uniquePropertyIds = new Set(
              (jobsData.jobs || [])
                .filter(job => job.property_id && job.property_id !== 'null' && job.property_id !== 'undefined')
                .map(job => job.property_id)
            )
            setTotalProperties(uniquePropertyIds.size)
          }
        } catch (error) {
          console.error('Error fetching properties count:', error)
          // Fallback: count from jobs
          const uniquePropertyIds = new Set(
            (jobsData.jobs || [])
              .filter(job => job.property_id && job.property_id !== 'null' && job.property_id !== 'undefined')
              .map(job => job.property_id)
          )
          setTotalProperties(uniquePropertyIds.size)
        }

        // 2. Total jobs
        setTotalJobs(jobsData.jobs?.length || 0)

        // 3. Total approved bids - fetch all bids for all jobs
        let approvedBidsCount = 0
        try {
          const bidsPromises = (jobsData.jobs || []).map(async (job) => {
            try {
              const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/job/${job.id}`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${user.token}`,
                },
              })

              if (bidsResponse.ok) {
                const bidsData = await bidsResponse.json()
                const bids = bidsData.bids || []
                return bids.filter(bid =>
                  bid.status?.toLowerCase() === 'approved' ||
                  bid.status?.toLowerCase() === 'accepted'
                ).length
              }
              return 0
            } catch (error) {
              console.error(`Error fetching bids for job ${job.id}:`, error)
              return 0
            }
          })

          const approvedBidsCounts = await Promise.all(bidsPromises)
          approvedBidsCount = approvedBidsCounts.reduce((sum, count) => sum + count, 0)
        } catch (error) {
          console.error('Error calculating approved bids:', error)
        }

        setTotalBidsApproved(approvedBidsCount)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
        setIsLoading(false)
      }
    }, [])

  // Call fetchData on component mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const [selectedRepair, setSelectedRepair] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const searchInputRef = useRef(null)

  // urgent modal
  const [showUrgentModal, setShowUrgentModal] = useState(false)
  const [selectedUrgentJobs, setSelectedUrgentJobs] = useState([])
  const [urgentMessage, setUrgentMessage] = useState('')


  // Generate default urgent message template
  const getDefaultUrgentMessage = () => {
    return `${t('urgentEmail.greeting')}

${t('urgentEmail.intro')}

${t('urgentEmail.action')}

${t('urgentEmail.thanks')}

${t('urgentEmail.regards')}
${uProfile?.name || t('urgentEmail.propertyManager')}`
  }

  // Open urgent modal
  const handleOpenUrgentModal = () => {
    setSelectedUrgentJobs([])
    setUrgentMessage(getDefaultUrgentMessage())
    setShowUrgentModal(true)
  }

  // Toggle job selection
  const toggleJobSelection = (jobId) => {
    setSelectedUrgentJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  // Select all jobs
  const selectAllJobs = () => {
    if (selectedUrgentJobs.length === jobs.length) {
      setSelectedUrgentJobs([])
    } else {
      setSelectedUrgentJobs(jobs.map(job => job.id))
    }
  }

  const handleUrgentRequest = async () => {
    if (selectedUrgentJobs.length === 0) {
      return;
    }

    // Close modal immediately
    const jobsToSend = [...selectedUrgentJobs]; // Copy the selected jobs
    setShowUrgentModal(false);
    setSelectedUrgentJobs([]);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Get selected jobs
    const urgentJobs = jobs.filter(job => jobsToSend.includes(job.id));

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

    // Send email with toast.promise for persistent loading state
    const sendEmail = async () => {
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
      return data;
    };

    toast.promise(
      sendEmail(),
      {
        loading: `${t('urgentModal.sendingRequest')} (${urgentJobs.length} ${urgentJobs.length !== 1 ? t('urgentModal.jobsSelected') : t('urgentModal.jobSelected')})...`,
        success: `${t('urgentModal.requestSent')} (${urgentJobs.length} ${urgentJobs.length !== 1 ? t('urgentModal.jobsSelected') : t('urgentModal.jobSelected')})!`,
        error: t('urgentModal.requestFailed'),
      }
    );
  };

  const handleAddWork = () => {
    setShowAddWorkModal(true)
  }

  const handleRepairClicked = useCallback((repair) => {
    setSelectedRepair(repair)
  }, [])

  const handleSearchFocus = () => {
    setSearchExpanded(true)
  }

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setSearchExpanded(false)
    }
  }

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchExpanded])

  const filteredRepairs = properties.filter((repair) => {
    // Search filter
    const matchesSearch =
      repair?.property?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair?.apartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair?.category?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      repair?.status?.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })


  if (isLoading) {
    return (
      <div className="homepage">
        <Nav />
        <div className="main-container">
          <header className="pm-page-header">
            <div className="pm-header-left">
              <div className="pm-header-title-group">
                <h1>{t('homePage.title')}</h1>
                <span className="pm-project-count">0 {t('homePage.activeJobs')}</span>
              </div>
            </div>
            <div className="pm-header-actions">
              <div className="pm-search-wrapper">
                <Search size={18} className="pm-search-icon" />
                <input
                  type="text"
                  placeholder={t('homePage.searchPlaceholder')}
                  value=""
                  className="pm-search-input"
                  disabled
                  readOnly
                />
              </div>

              <div className="pm-action-buttons">
                <button className="pm-btn pm-btn-secondary" disabled>
                  <Wrench size={18} />
                  <span>{t('homePage.urgent')}</span>
                </button>
                <button className="pm-btn pm-btn-secondary" disabled>
                  <Megaphone size={18} />
                  <span>{t('homePage.announcement')}</span>
                </button>
                <button className="pm-btn pm-btn-primary" disabled>
                  <Plus size={18} />
                  <span>{t('homePage.newJobs')}</span>
                </button>
                <button className="pm-btn pm-btn-primary pm-btn-property" disabled>
                  <Building2 size={18} />
                  <span>{t('homePage.addProperty')}</span>
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
              <div className="hp-section-header-left">
                <h2>{t('homePage.allRepairWork')}</h2>
                <p className="hp-section-subtitle">{t('homePage.loadingRepairs')}</p>
              </div>
              <div className="hp-section-header-right">
                <div className="pm-skeleton-filter">
                  <div className="pm-shimmer"></div>
                </div>
              </div>
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
      <div className="main-container">
        <header className="pm-page-header">
          <div className="pm-header-left">
            <div className="pm-header-title-group">
              <h1>{t('homePage.title')}</h1>
              <span className="pm-project-count">{properties.length} {t('homePage.activeJobs')}</span>
            </div>
          </div>
          <div className="pm-header-actions">
            <div className="pm-search-wrapper">
              <Search size={18} className="pm-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('homePage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pm-search-input"
              />
            </div>

            <div className="pm-action-buttons">
              <button
                onClick={handleOpenUrgentModal}
                className="pm-btn pm-btn-secondary"
                title={t('homePage.urgent')}
              >
                <Wrench size={18} />
                <span>{t('homePage.urgent')}</span>
              </button>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="pm-btn pm-btn-secondary"
                title={t('homePage.announcement')}
              >
                <Megaphone size={18} />
                <span>{t('homePage.announcement')}</span>
              </button>
              <button
                onClick={handleAddWork}
                className="pm-btn pm-btn-primary"
                title={t('homePage.newJobs')}
              >
                <Plus size={18} />
                <span>{t('homePage.newJobs')}</span>
              </button>
              <button
                onClick={() => setShowAddPropertyModal(true)}
                className="pm-btn pm-btn-primary pm-btn-property"
                title={t('homePage.addProperty')}
              >
                <Building2 size={18} />
                <span>{t('homePage.addProperty')}</span>
              </button>
            </div>

            <NotificationBell />
          </div>
        </header>

        <SummarySection
          totalProperties={totalProperties}
          totalBidsApproved={totalBidsApproved}
          totalJobs={totalJobs}
        />

        {/* Status Filter */}
        <div className="pm-status-filter-section">
          <div className="pm-status-filter-label">{t('homePage.filterByStatus') || 'Filter by Status'}:</div>
          <div className="pm-status-filter-buttons">
            <button
              className={`pm-status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              {t('homePage.filterAll') || 'All'}
              <span className="pm-filter-count">{properties.length}</span>
            </button>
            <button
              className={`pm-status-filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
              onClick={() => setStatusFilter('open')}
            >
              {t('homePage.filterOpen') || 'Open'}
              <span className="pm-filter-count">
                {properties.filter(p => p?.status?.toLowerCase() === 'open').length}
              </span>
            </button>
            <button
              className={`pm-status-filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              {t('homePage.filterInProgress') || 'In Progress'}
              <span className="pm-filter-count">
                {properties.filter(p => p?.status?.toLowerCase() === 'in_progress').length}
              </span>
            </button>
            <button
              className={`pm-status-filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              {t('homePage.filterCompleted') || 'Completed'}
              <span className="pm-filter-count">
                {properties.filter(p => p?.status?.toLowerCase() === 'completed').length}
              </span>
            </button>
          </div>
        </div>

        <RepairList repairs={filteredRepairs} handleRepairClicked={handleRepairClicked} />

        {filteredRepairs.length === 0 && (
          <div className="pm-no-results-home">
            <p>{t('homePage.noRepairsFound')}</p>
          </div>
        )}
      </div>

      {/* Repair Details Modal */}
      <RepairDetails
        isOpen={selectedRepair !== null}
        onClose={() => setSelectedRepair(null)}
        repair={selectedRepair}
      />

      {/* Add Announcement Modal */}
      <AddAnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSuccess={() => {
          // Optionally refresh data or show success message
          console.log('Announcement created successfully');
        }}
      />

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSuccess={(property) => {
          console.log('Property added successfully:', property);
          setShowAddPropertyModal(false);
          // Refetch data to update property count
          fetchData();
        }}
      />

      {/* Add Work Modal - Compact Version */}
      <AddWorkModalCompact
        isOpen={showAddWorkModal}
        onClose={() => setShowAddWorkModal(false)}
        onSuccess={(result) => {
          setShowAddWorkModal(false);
          // Refetch data to show new job(s)
          fetchData();
        }}
      />

      {/* Inspection Report Upload Modal */}
      <InspectionReportUploadModal
        isOpen={showInspectionModal}
        onClose={() => {
          setShowInspectionModal(false);
          setShowAddWorkModal(true);
        }}
        onSubmit={(createdJobs) => {
          console.log('Jobs created from inspection:', createdJobs);
          setShowInspectionModal(false);
          // Refetch data to show new jobs
          fetchData();
        }}
        propertyId={selectedPropertyForInspection}
      />

      {/* Urgent Request Modal */}
      {showUrgentModal && (
        <div className="pm-urgent-modal-overlay" onClick={() => setShowUrgentModal(false)}>
          <div className="pm-urgent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-urgent-modal-header">
              <div className="pm-urgent-modal-title">
                <AlertTriangle size={20} />
                <h2>{t('urgentModal.sendUrgentRequest')}</h2>
              </div>
              <button
                className="pm-urgent-modal-close"
                onClick={() => setShowUrgentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pm-urgent-modal-body">
              {/* Info Note */}
              <div className="pm-urgent-info-note">
                <Info size={16} />
                <p>{t('urgentModal.infoNote')}</p>
              </div>

              {/* Job Selection Section */}
              <div className="pm-urgent-section">
                <div className="pm-urgent-section-header">
                  <h3>{t('urgentModal.selectJobsToSend')}</h3>
                  <button
                    type="button"
                    className="pm-urgent-select-all"
                    onClick={selectAllJobs}
                  >
                    {selectedUrgentJobs.length === jobs.length ? t('urgentModal.deselectAll') : t('urgentModal.selectAll')}
                  </button>
                </div>
                <div className="pm-urgent-jobs-list">
                  {jobs.length === 0 ? (
                    <p className="pm-urgent-no-jobs">{t('urgentModal.noJobsAvailable')}</p>
                  ) : (
                    jobs.map(job => (
                      <label
                        key={job.id}
                        className={`pm-urgent-job-item ${selectedUrgentJobs.includes(job.id) ? 'selected' : ''}`}
                      >
                        <div className="pm-urgent-job-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUrgentJobs.includes(job.id)}
                            onChange={() => toggleJobSelection(job.id)}
                          />
                          <span className="pm-urgent-checkmark">
                            {selectedUrgentJobs.includes(job.id) && <Check size={14} />}
                          </span>
                        </div>
                        <div className="pm-urgent-job-info">
                          <span className="pm-urgent-job-title">{job.title}</span>
                          <span className="pm-urgent-job-meta">
                            <span className="pm-urgent-job-category">{job.category || t('common.general')}</span>
                            {job.is_emergency && <span className="pm-urgent-job-emergency">{t('common.emergency')}</span>}
                            <span className="pm-urgent-job-budget">${job.budget_min} - ${job.budget_max}</span>
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="pm-urgent-selected-count">
                  {selectedUrgentJobs.length} {selectedUrgentJobs.length !== 1 ? t('urgentModal.jobsSelected') : t('urgentModal.jobSelected')}
                </p>
              </div>

              {/* Message Section */}
              <div className="pm-urgent-section">
                <h3>{t('urgentModal.messageToContractors')}</h3>
                <textarea
                  className="pm-urgent-message-editor"
                  value={urgentMessage}
                  onChange={(e) => setUrgentMessage(e.target.value)}
                  rows={8}
                  placeholder={t('urgentModal.messagePlaceholder')}
                />
                <button
                  type="button"
                  className="pm-urgent-reset-message"
                  onClick={() => setUrgentMessage(getDefaultUrgentMessage())}
                >
                  {t('urgentModal.resetToDefault')}
                </button>
              </div>
            </div>

            <div className="pm-urgent-modal-footer">
              <button
                className="pm-btn pm-btn-secondary"
                onClick={() => setShowUrgentModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="pm-btn pm-btn-primary pm-urgent-send-btn"
                onClick={handleUrgentRequest}
                disabled={selectedUrgentJobs.length === 0}
              >
                <Wrench size={16} />
                <span>{t('urgentModal.sendUrgentRequest')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage