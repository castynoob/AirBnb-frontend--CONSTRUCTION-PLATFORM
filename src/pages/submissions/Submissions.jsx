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

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([])
  const [filteredSubmissions, setFilteredSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [expandedCards, setExpandedCards] = useState({})

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [amountRange, setAmountRange] = useState({ min: "", max: "" })
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
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
            // Fetch bids for this job (includes entrepreneur info)
            const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/job/${job.id}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
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
            bids.forEach((bid) => {
              // Skip declined bids
              if (bid.status === "declined") {
                return
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
              })
            })
          } catch (err) {
            console.warn(`Error processing job ${job.id}:`, err)
          }
        }

        setSubmissions(submissionsData)
        setFilteredSubmissions(submissionsData)
        setError(null)
      } catch (err) {
        console.error("Error fetching submissions:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  const toggleCardExpanded = (bidId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [bidId]: !prev[bidId],
    }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setLocationFilter("")
    setCategoryFilter("")
    setAmountRange({ min: "", max: "" })
    setDateRange({ start: "", end: "" })
  }

  const handleAccept = async (bidId) => {
    // TODO: Make API call to accept the bid
    // This should:
    // 1. Update the bid status to "accepted"
    // 2. Update the job status to "accepted" (if not already)
    // 3. Optionally decline other pending bids for this job
    
    // For now, update state locally
    setSubmissions((prev) =>
      prev.map((sub) => 
        sub.bid.id === bidId 
          ? { 
              ...sub, 
              bid: { ...sub.bid, status: "accepted" },
              job: { ...sub.job, status: "accepted" }
            } 
          : sub
      ),
    )
    
    // Display success message
    alert("Bid accepted! The contractor will be notified.")
  }

  const handleDecline = async (bidId) => {
    // TODO: Make API call to decline the bid
    // This should update the bid status to "declined"
    
    // Remove from UI (since we filter out declined bids)
    setSubmissions((prev) => prev.filter((sub) => sub.bid.id !== bidId))
    
    // Display confirmation message
    alert("Bid declined. The contractor will be notified.")
  }

  const handleChat = (submission) => {
    console.log(`Opening chat with ${submission.entrepreneur_profile.company_name}`)
    alert(`Chat with ${submission.entrepreneur_profile.company_name} would open here`)
  }

  const handleReview = (submission) => {
    console.log(`Opening review form for ${submission.entrepreneur_profile.company_name}`)
    alert(`Review form for ${submission.entrepreneur_profile.company_name} would open here`)
  }

  // Updated to use job status instead of bid status
  const getStatusInfo = (status) => {
    const statusMap = {
      open: { class: "status-open", icon: FolderOpen, label: "Open" },
      accepted: { class: "status-accepted", icon: CheckCircle, label: "Accepted" },
      ongoing: { class: "status-ongoing", icon: PlayCircle, label: "Ongoing" },
      completed: { class: "status-completed", icon: CheckCircle, label: "Completed" },
    }
    return statusMap[status] || statusMap.open
  }

  // Updated to count by job status
  const getStatusCount = (status) => {
    if (status === "all") return submissions.length
    return submissions.filter((sub) => sub.job.status === status).length
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

  const renderCardDetails = (submission) => {
    const { bid, job, entrepreneur_profile } = submission

    const DetailField = ({ label, value, icon: Icon }) => (
      <div className="subs-detail-field">
        <div className="subs-detail-label">
          {Icon && <Icon size={14} />}
          <span>{label}</span>
        </div>
        <div className="subs-detail-value">{value}</div>
      </div>
    )

    // Render details based on job status
    switch (job.status) {
      case "open":
        return (
          <div className="subs-card-details-wrapper">
            {/* Job Details Section */}
            <div className="subs-details-section">
              <h4 className="subs-section-title">Job Details</h4>
              <DetailField label="Category" value={job.category} icon={FileText} />
              <DetailField label="Urgency" value={job.urgency} icon={Clock} />
              <DetailField label="Due Date" value={formatDate(job.due_date)} icon={Calendar} />
              <DetailField label="Duration" value={`${job.estimated_duration_days} days`} icon={Clock} />
              <DetailField
                label="Budget Range"
                value={`${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`}
                icon={DollarSign}
              />
            </div>

            {/* Entrepreneur Profile Section */}
            <div className="subs-details-section">
              <h4 className="subs-section-title">Contractor Profile</h4>
              <DetailField label="License Number" value={entrepreneur_profile.license_number} icon={Building2} />
              <DetailField
                label="Years in Business"
                value={`${entrepreneur_profile.years_in_business} years`}
                icon={Clock}
              />
              <DetailField
                label="Specializations"
                value={entrepreneur_profile.specializations.join(", ") || "N/A"}
                icon={FileText}
              />
              <DetailField
                label="Rating"
                value={`${entrepreneur_profile.average_rating} ★ (${entrepreneur_profile.total_reviews} reviews)`}
                icon={Star}
              />
            </div>
          </div>
        )

      case "accepted":
      case "ongoing":
        return (
          <div className="subs-card-details-wrapper">
            <div className="subs-details-section">
              <h4 className="subs-section-title">Job Details</h4>
              <DetailField label="Category" value={job.category} icon={FileText} />
              <DetailField label="Urgency" value={job.urgency} icon={Clock} />
              <DetailField label="Due Date" value={formatDate(job.due_date)} icon={Calendar} />
              <DetailField
                label="Budget Range"
                value={`${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`}
                icon={DollarSign}
              />
              <DetailField label="Status" value={job.status.charAt(0).toUpperCase() + job.status.slice(1)} icon={CheckCircle} />
            </div>
          </div>
        )

      case "completed":
        return (
          <div className="subs-card-details-wrapper">
            {/* Job Details Section */}
            <div className="subs-details-section">
              <h4 className="subs-section-title">Job Details</h4>
              <DetailField label="Category" value={job.category} icon={FileText} />
              <DetailField label="Due Date" value={formatDate(job.due_date)} icon={Calendar} />
              <DetailField
                label="Budget Range"
                value={`${formatCurrency(job.budget_min)} - ${formatCurrency(job.budget_max)}`}
                icon={DollarSign}
              />
              <DetailField label="Completed Date" value={formatDate(job.updated_at)} icon={Calendar} />
            </div>

            {/* Entrepreneur Profile Section */}
            <div className="subs-details-section">
              <h4 className="subs-section-title">Contractor Profile</h4>
              <DetailField label="Company Name" value={entrepreneur_profile.company_name} icon={Building2} />
              <DetailField label="License Number" value={entrepreneur_profile.license_number} icon={Building2} />
              <DetailField
                label="Specializations"
                value={entrepreneur_profile.specializations.join(", ") || "N/A"}
                icon={FileText}
              />
              <DetailField
                label="Rating"
                value={`${entrepreneur_profile.average_rating} ★ (${entrepreneur_profile.total_reviews} reviews)`}
                icon={Star}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

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

    // Updated to filter by job status
    if (activeTab !== "all") {
      filtered = filtered.filter((sub) => sub.job.status === activeTab)
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
      <div className="subs-submissions-content">
        <div className="subs-page-header">
          <div>
            <h1 className="subs-page-title">Bid Submissions</h1>
            <p className="subs-page-subtitle">Review and manage contractor bids</p>
          </div>
          <div className="subs-header-stats">
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
              const isExpanded = expandedCards[submission.bid.id]

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

                  <button className="subs-expand-btn" onClick={() => toggleCardExpanded(submission.bid.id)}>
                    <ChevronDown size={16} className={isExpanded ? "subs-expanded" : ""} />
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </button>

                  {isExpanded && <div className="subs-card-details">{renderCardDetails(submission)}</div>}

                  {submission.bid.status === "pending" && (
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
                      {/* Accept/Decline buttons: Show only when job is open AND bid is pending */}
                      {submission.job.status === "open" && submission.bid.status === "pending" && (
                        <>
                          <button className="subs-accept-btn" onClick={() => handleAccept(submission.bid.id)}>
                            Accept
                          </button>
                          <button className="subs-decline-btn" onClick={() => handleDecline(submission.bid.id)}>
                            Decline
                          </button>
                        </>
                      )}
                      
                      {/* Chat button: Show when job is accepted or ongoing AND bid is accepted */}
                      {(submission.job.status === "accepted" || submission.job.status === "ongoing") && 
                       submission.bid.status === "accepted" && (
                        <button className="subs-chat-btn" onClick={() => handleChat(submission)}>
                          <MessageCircle size={14} />
                          Chat
                        </button>
                      )}
                      
                      {/* Review button: Show when job is completed AND bid is accepted */}
                      {submission.job.status === "completed" && submission.bid.status === "accepted" && (
                        <button className="subs-review-btn" onClick={() => handleReview(submission)}>
                          <Star size={14} />
                          Review
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