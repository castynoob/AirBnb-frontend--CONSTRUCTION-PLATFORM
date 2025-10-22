"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  Search,
  Building2,
  AlertCircle,
  Clock,
  DollarSign,
  Hammer,
  X,
  Send,
  Bell,
  SlidersHorizontal,
  MapPin,
  Wrench,
  Zap,
  Filter,
} from "lucide-react"
import Nav from "../../components/Nav"
import "../../styles/entrepreneur/homepageentrepreneur.css"
import SubscriptionModal from "../../components/SubcriptionModal"


// Map Controller Component for programmatic map control
function MapController({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true, duration: 1 })
    }
  }, [center, zoom, map])

  return null
}

// Create custom building icon
const createBuildingIcon = (jobCount) => {
  const color = jobCount > 0 ? "#E74C3C" : "#7F8C8D"

  return L.divIcon({
    className: "custom-building-icon",
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color};
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          border: 3px solid white;
          transition: transform 0.2s;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <path d="M9 22v-4h6v4"></path>
            <path d="M8 6h.01"></path>
            <path d="M16 6h.01"></path>
            <path d="M12 6h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 10h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 10h.01"></path>
            <path d="M8 14h.01"></path>
          </svg>
        </div>
        ${
          jobCount > 0
            ? `
          <div style="
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #E74C3C;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          ">${jobCount}</div>
        `
            : ""
        }
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  })
}

function HomePageEntrepreneur() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidMessage, setBidMessage] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)
  const [mapZoom, setMapZoom] = useState(null)
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const [userProfile, setUserProfile] = useState()
  const [isLoading, setIsLoading] = useState(true)

  // data variables
  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [submittedBids, setSubmittedBids] = useState([])

  // Filter states
  const [filters, setFilters] = useState({
    regions: [],
    cities: [],
    neighborhoods: [],
    workTypes: [],
    urgency: [],
    daysUntilNeeded: "",
    duration: "",
    budgetMin: "",
    budgetMax: "",
    bidCount: "",
    propertyTypes: [],
    propertySizes: [],
  })

  // Get open jobs count for each property
  const getPropertyOpenJobsCount = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status === "Open").length
  }

  // Get open jobs for a property
  const getPropertyOpenJobs = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status === "Open")
  }

  // Filter properties and jobs based on all filters
  const filteredProperties = useMemo(() => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(property.region)
      const matchesCity = filters.cities.length === 0 || filters.cities.includes(property.city)

      const matchesPropertyType =
        filters.propertyTypes.length === 0 || filters.propertyTypes.includes(property.propertyType)

      const propertyJobs = jobs.filter((job) => job.property_id === property.id && job.status === "Open")

      const matchesWorkType =
        filters.workTypes.length === 0 || propertyJobs.some((job) => filters.workTypes.includes(job.category))

      const matchesUrgency =
        filters.urgency.length === 0 || propertyJobs.some((job) => filters.urgency.includes(job.urgency))

      const matchesDays =
        !filters.daysUntilNeeded ||
        propertyJobs.some((job) => job.daysUntilNeeded <= Number.parseInt(filters.daysUntilNeeded))

      const matchesDuration =
        !filters.duration ||
        propertyJobs.some((job) => job.estimated_duration_days <= Number.parseInt(filters.duration))

      const matchesBudget =
        (!filters.budgetMin && !filters.budgetMax) ||
        propertyJobs.some((job) => {
          const min = filters.budgetMin
            ? Number.parseFloat(job.budget_min) >= Number.parseFloat(filters.budgetMin)
            : true
          const max = filters.budgetMax
            ? Number.parseFloat(job.budget_max) <= Number.parseFloat(filters.budgetMax)
            : true
          return min && max
        })

      const matchesBidCount =
        !filters.bidCount || propertyJobs.some((job) => job.bidCount <= Number.parseInt(filters.bidCount))

      return (
        matchesSearch &&
        matchesRegion &&
        matchesCity &&
        matchesPropertyType &&
        matchesWorkType &&
        matchesUrgency &&
        matchesDays &&
        matchesDuration &&
        matchesBudget &&
        matchesBidCount
      )
    })

    return filtered
  }, [searchTerm, filters, jobs])

  // Get search results for dropdown (only based on search term, not other filters)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return []

    return properties
      .filter((property) => {
        const matchesSearch =
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch && getPropertyOpenJobsCount(property.id) > 0
      })
      .slice(0, 5) // Limit to 5 results
  }, [searchTerm, jobs])

  const getUrgencyColor = (urgency) => {
    if (urgency === "Immediate") return "var(--color-status-urgent)"
    if (urgency === "This Month") return "var(--color-status-warning)"
    if (urgency === "This Year") return "var(--color-status-warning)"
    return "var(--color-status-info)"
  }

  const handleBidClick = (job) => {
    setSelectedJob(job)
    setBidAmount("")
    setBidMessage("")
    setBidModalOpen(true)
  }

  const handleSubmitBid = async () => {
    if (!bidAmount || !bidMessage) {
      alert("Please fill in all required fields")
      return
    }
    const userProfile = localStorage.getItem('userProfile')

    if(userProfile) {
      const user = JSON.parse(userProfile)
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/api/bids`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: selectedJob.id,
            amount: Number(bidAmount),
            message: bidMessage
          })
        });

        if(!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json()
        fetchBids()
      } catch(err) {
        console.log(err)
      }
    }

    console.log("Submitting bid:", {
      jobId: selectedJob.id,
      amount: bidAmount,
      message: bidMessage,
    })

    alert("Bid submitted successfully!")
    setBidModalOpen(false)
  }

  const handleSearchFocus = () => {
    setSearchExpanded(true)
    setShowSearchResults(true)
  }

  const handleSearchBlur = () => {
    // Delay to allow click on results
    setTimeout(() => {
      if (!searchTerm) {
        setSearchExpanded(false)
      }
      setShowSearchResults(false)
    }, 200)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setShowSearchResults(true)
  }

  const handleResultClick = (property) => {
    setSelectedProperty(property)
    setMapCenter([property.latitude, property.longitude])
    setMapZoom(17)
    setSearchTerm("")
    setShowSearchResults(false)
    setSearchExpanded(false)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      if (Array.isArray(prev[filterType])) {
        const newArray = prev[filterType].includes(value)
          ? prev[filterType].filter((item) => item !== value)
          : [...prev[filterType], value]
        return { ...prev, [filterType]: newArray }
      } else {
        return { ...prev, [filterType]: value }
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      regions: [],
      cities: [],
      neighborhoods: [],
      workTypes: [],
      urgency: [],
      daysUntilNeeded: "",
      duration: "",
      budgetMin: "",
      budgetMax: "",
      bidCount: "",
      propertyTypes: [],
      propertySizes: [],
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    Object.keys(filters).forEach((key) => {
      if (Array.isArray(filters[key])) {
        count += filters[key].length
      } else if (filters[key]) {
        count += 1
      }
    })
    return count
  }, [filters])

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchExpanded])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      localStorage.setItem("selectedPropertyId", selectedProperty.id)
    }
  }, [selectedProperty])

  // fetch properties and userProfile
  useEffect(() => {
    const fetchProperties = async () => {
      const profileString = localStorage.getItem("userProfile")
      try {
        if (profileString) {
          const user = JSON.parse(profileString)
          setUserProfile(user)

          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

          const response = await fetch(`${API_BASE_URL}/api/properties/all`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          })

          if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`)
          } else {
            const data = await response.json()
            const newProperties = []
            data.properties.forEach((d) => {
              const propertyName = d.building_name && d.building_name.trim() ? d.building_name : d.address
              newProperties.push({
                id: d.id,
                name: propertyName,
                latitude: Number(d.latitude),
                longitude: Number(d.longitude),
                address: d.address,
                region: d.province,
                city: d.city,
                totalUnits: d.num_units,
                propertyType: d.building_type,
              })
            })
            setProperties(newProperties)

            const savedPropertyId = localStorage.getItem("selectedPropertyId")
            if (savedPropertyId) {
              const restoredProperty = newProperties.find((p) => p.id === savedPropertyId)
              if (restoredProperty) {
                setSelectedProperty(restoredProperty)
                setMapCenter([restoredProperty.latitude, restoredProperty.longitude])
                setMapZoom(17)
              }
            }
          }
        } else {
          console.log("User profile not found.")
        }
      } catch (error) {
        console.error("Error fetching properties or parsing profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    const fetchJobs = async () => {
      const profileString = localStorage.getItem("userProfile")

      try {
        if (profileString) {
          const user = JSON.parse(profileString)
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

          const response = await fetch(`${API_BASE_URL}/api/jobs`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          })

          if (!response.ok) {
            console.error(`HTTP error fetching jobs! Status: ${response.status}`)
          } else {
            const jobsData = await response.json()

            const transformedJobs = jobsData.map((job) => ({
              id: job.id,
              property_id: job.property_id,
              title: job.title,
              description: job.description,
              category: job.category,
              urgency: job.urgency,
              due_date: job.due_date,
              estimated_duration_days: job.estimated_duration_days,
              budget_min: job.budget_min.toString(),
              budget_max: job.budget_max.toString(),
              status: job.status,
              bidCount: 0,
              daysUntilNeeded: Math.ceil(
                (new Date(job.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
              ),
            }))

            setJobs(transformedJobs)
            fetchBids()
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
      }
    }

    fetchJobs()
  }, [])
  
  const fetchBids = async () => {
    const userProfile = localStorage.getItem('userProfile')
    if (userProfile) {
      try {
        const user = JSON.parse(userProfile)
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/mine`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        })

        if (!bidsResponse.ok) {
          throw new Error(`HTTP error! Status: ${bidsResponse.status}`)
        }

        const bids = await bidsResponse.json()

        // Extract only bid IDs
        const bidIds = bids.bids.all.map(bid => bid.job_id)
        setSubmittedBids(bidIds)
      } catch (error) {
        console.error("Failed to fetch bids:", error)
      }
    }
  }


  if (isLoading) {
    return <h1>LOADING</h1>
  }

  return (
    <div className="homepage-container">
      <Nav />

      <main className="main-content">
        {isLoading ? (
          <div className="loading">
            <h1>LOADING</h1>
          </div>
        ) : (
          userProfile.subscription && userProfile.subscription.plan_type == "none" && <SubscriptionModal />
        )}
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Available Construction Jobs</h1>
            <p className="page-subtitle">Find and bid on construction projects in your area</p>
          </div>

          <div className="header-actions">
            <div className={`search-box-entrep ${searchExpanded ? "expanded" : ""}`} ref={searchContainerRef}>
              <button className="search-trigger-btn entrep" onClick={handleSearchFocus} aria-label="Search">
                <Search size={20} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="search-input entrep"
              />

              {showSearchResults && searchTerm && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map((property) => (
                    <div key={property.id} className="search-result-item" onClick={() => handleResultClick(property)}>
                      <div className="search-result-icon">
                        <Building2 size={20} />
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-name">{property.name}</div>
                        <div className="search-result-address">{property.address}</div>
                      </div>
                      <div className="search-result-badge">{getPropertyOpenJobsCount(property.id)} jobs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`filters-btn ${activeFiltersCount > 0 ? "active" : ""}`}
              onClick={() => setFiltersPanelOpen(!filtersPanelOpen)}
              aria-label="Filters"
            >
              <Filter size={20} />
              <span className="filter-btn-text">Filters</span>
              {activeFiltersCount > 0 && <span className="filter-count">{activeFiltersCount}</span>}
            </button>

            <button className="notification-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Filters Modal */}
        {filtersPanelOpen && (
          <div className="modal-overlay" onClick={() => setFiltersPanelOpen(false)}>
            <div className="filters-modal" onClick={(e) => e.stopPropagation()}>
              <div className="filters-modal-header">
                <div className="filters-modal-title">
                  <SlidersHorizontal size={24} />
                  <h2>Advanced Filters</h2>
                </div>
                <button className="modal-close" onClick={() => setFiltersPanelOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="filters-modal-body">
                <div className="filters-actions-top">
                  <p className="filters-description">Refine your search to find the perfect construction jobs</p>
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <X size={16} />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="filters-grid">
                  {/* Geographic Filters */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <MapPin size={18} />
                      <h4>Location</h4>
                    </div>
                    <div className="filter-options">
                      {["Ilocos Region"].map((item) => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.regions.includes(item)}
                            onChange={() => handleFilterChange("regions", item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                      {["Dagupan City"].map((item) => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.cities.includes(item)}
                            onChange={() => handleFilterChange("cities", item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                      {["Downtown", "Beachfront", "Business District", "Suburban", "Riverside"].map((item) => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.neighborhoods.includes(item)}
                            onChange={() => handleFilterChange("neighborhoods", item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Work Type Filters */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <Wrench size={18} />
                      <h4>Work Type</h4>
                    </div>
                    <div className="filter-options">
                      {[
                        "Electrical",
                        "Plumbing",
                        "Carpentry",
                        "Masonry",
                        "Roofing",
                        "HVAC",
                        "Painting",
                        "Flooring",
                        "General Maintenance",
                      ].map((type) => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.workTypes.includes(type)}
                            onChange={() => handleFilterChange("workTypes", type)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Urgency Filters */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <Zap size={18} />
                      <h4>Urgency Level</h4>
                    </div>
                    <div className="filter-options">
                      {["Immediate", "This Month", "This Year", "Next Year", "Flexible"].map((urgency) => (
                        <label key={urgency} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.urgency.includes(urgency)}
                            onChange={() => handleFilterChange("urgency", urgency)}
                          />
                          <span>{urgency}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Filters */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <Clock size={18} />
                      <h4>Timeline</h4>
                    </div>
                    <div className="filter-inputs">
                      <div className="input-group">
                        <label>Days Until Needed (max)</label>
                        <input
                          type="number"
                          placeholder="e.g., 30"
                          value={filters.daysUntilNeeded}
                          onChange={(e) => handleFilterChange("daysUntilNeeded", e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Work Duration (max days)</label>
                        <input
                          type="number"
                          placeholder="e.g., 7"
                          value={filters.duration}
                          onChange={(e) => handleFilterChange("duration", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget Filters */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <DollarSign size={18} />
                      <h4>Budget Range</h4>
                    </div>
                    <div className="filter-inputs">
                      <div className="input-group">
                        <label>Minimum Budget ($)</label>
                        <input
                          type="number"
                          placeholder="e.g., 1000"
                          value={filters.budgetMin}
                          onChange={(e) => handleFilterChange("budgetMin", e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Maximum Budget ($)</label>
                        <input
                          type="number"
                          placeholder="e.g., 10000"
                          value={filters.budgetMax}
                          onChange={(e) => handleFilterChange("budgetMax", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="filter-group">
                    <div className="filter-group-header">
                      <Building2 size={18} />
                      <h4>Property Details</h4>
                    </div>
                    <div className="filter-section">
                      <p className="filter-subsection-title">Property Type</p>
                      <div className="filter-options">
                        {["Residential", "Commercial", "Mixed-Use"].map((item) => (
                          <label key={item} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filters.propertyTypes.includes(item)}
                              onChange={() => handleFilterChange("propertyTypes", item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="filter-section">
                      <p className="filter-subsection-title">Property Size</p>
                      <div className="filter-options">
                        {["Small", "Medium", "Large"].map((item) => (
                          <label key={item} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filters.propertySizes.includes(item)}
                              onChange={() => handleFilterChange("propertySizes", item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="filter-inputs">
                      <div className="input-group">
                        <label>Maximum Existing Bids</label>
                        <input
                          type="number"
                          placeholder="e.g., 5"
                          value={filters.bidCount}
                          onChange={(e) => handleFilterChange("bidCount", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="filters-modal-footer">
                <button className="cancel-btn" onClick={() => setFiltersPanelOpen(false)}>
                  Cancel
                </button>
                <button className="apply-filters-btn" onClick={() => setFiltersPanelOpen(false)}>
                  <SlidersHorizontal size={18} />
                  <span>Apply Filters</span>
                  {activeFiltersCount > 0 && <span className="footer-badge">({activeFiltersCount})</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="content-grid">
          <div className="map-section">
            <MapContainer
              center={[16.0418, 120.3335]}
              zoom={14}
              style={{ height: "100%", width: "100%", borderRadius: "12px" }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController center={mapCenter} zoom={mapZoom} />

              {filteredProperties.map((property) => {
                const jobCount = getPropertyOpenJobsCount(property.id)
                return (
                  <Marker
                    key={property.id}
                    position={[property.latitude, property.longitude]}
                    icon={createBuildingIcon(jobCount)}
                    eventHandlers={{
                      click: () => setSelectedProperty(property),
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h3>{property.name}</h3>
                        <p>{property.address}</p>
                        <div className="popup-stats">
                          <span className="popup-stat highlight">{jobCount} Open Jobs</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          <div className="details-section">
            {selectedProperty ? (
              <div className="property-details">
                <div className="details-header">
                  <div className="details-header-content">
                    <div className="header-icon">
                      <Building2 size={28} />
                    </div>
                    <div className="header-text">
                      <h2 className="property-name">{selectedProperty.name}</h2>
                      <p className="property-address">{selectedProperty.address}</p>
                      <div className="property-meta">
                        <span className="meta-badge">{selectedProperty.propertyType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card highlight">
                    <span className="stat-label">Open Jobs</span>
                    <span className="stat-value">{getPropertyOpenJobsCount(selectedProperty.id)}</span>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="section-tabs">
                  <div className="section-header">
                    <h3>Available Jobs for Bidding</h3>
                    <span className="job-count-badge">{getPropertyOpenJobs(selectedProperty.id).length} Jobs</span>
                  </div>
                  <div className="jobs-list">
                    {getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                      getPropertyOpenJobs(selectedProperty.id).map((job) => {
                        return (
                          <div key={job.id} className="job-card">
                            <div className="job-card-header">
                              <div className="job-title-section">
                                <h4 className="job-title">{job.title}</h4>
                                <div className="job-meta-row">
                                  <span className="job-category">{job.category}</span>
                                  <span className="bid-count-badge">{job.bidCount} bids</span>
                                </div>
                              </div>
                              <span className="urgency-badge" style={{ backgroundColor: getUrgencyColor(job.urgency) }}>
                                {job.urgency}
                              </span>
                            </div>

                            <p className="job-description">{job.description}</p>

                            <div className="job-details-grid">
                              <div className="detail-item">
                                <DollarSign size={16} />
                                <div>
                                  <span className="detail-label">Budget Range</span>
                                  <span className="detail-value">
                                    ${Number.parseFloat(job.budget_min).toLocaleString()} - $
                                    {Number.parseFloat(job.budget_max).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="detail-item">
                                <Clock size={16} />
                                <div>
                                  <span className="detail-label">Duration</span>
                                  <span className="detail-value">{job.estimated_duration_days} days</span>
                                </div>
                              </div>
                              <div className="detail-item">
                                <AlertCircle size={16} />
                                <div>
                                  <span className="detail-label">Needed In</span>
                                  <span className="detail-value">{job.daysUntilNeeded} days</span>
                                </div>
                              </div>
                            </div>

                            <button className={(submittedBids.includes(job.id)? 'bid-button submitted-bid': 'bid-button')} onClick={() => handleBidClick(job)}>
                              <Hammer size={18} />
                              {submittedBids.includes(job.id)? 'Bid Submitted' : 'Submit Your Bid'}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="no-jobs">
                        <Hammer size={48} color="var(--color-border-divider)" />
                        <p className="no-jobs-title">No Open Jobs</p>
                        <p className="no-jobs-text">This property has no available jobs for bidding at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <Building2 size={64} color="var(--color-border-divider)" />
                <h3>Select a Property</h3>
                <p>Click on a building marker on the map to view available construction jobs</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bid Modal */}
      {bidModalOpen && selectedJob && (
        <div className="modal-overlay submit-bid" onClick={() => setBidModalOpen(false)}>
          <div className="modal-content bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header submit-bid">
              <h2>Submit Your Bid</h2>
              <button className="modal-close" onClick={() => setBidModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="job-summary">
                <h3>{selectedJob.title}</h3>
                <p className="job-summary-category">{selectedJob.category}</p>
                <p className="job-summary-budget">
                  Budget Range: ${Number.parseFloat(selectedJob.budget_min).toLocaleString()} - $
                  {Number.parseFloat(selectedJob.budget_max).toLocaleString()}
                </p>
              </div>

              <div className="bid-form">
                <div className="form-group">
                  <label htmlFor="bidAmount">Your Bid Amount ($) *</label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter your bid amount"
                    min={selectedJob.budget_min}
                    max={selectedJob.budget_max}
                  />
                  <span className="form-hint">Must be between budget range</span>
                </div>

                <div className="form-group">
                  <label htmlFor="bidMessage">Proposal Message *</label>
                  <textarea
                    id="bidMessage"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Describe your approach, experience, and why you're the best fit for this job..."
                    rows="5"
                  />
                </div>

                <button onClick={handleSubmitBid} className="submit-bid-button">
                  <Send size={18} />
                  Submit Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePageEntrepreneur
