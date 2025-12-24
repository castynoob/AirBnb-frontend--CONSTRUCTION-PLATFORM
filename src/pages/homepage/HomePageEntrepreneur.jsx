"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
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
  Map,
  List,
  Plus,
  Minus,
  Maximize2,
  Navigation,
  Target,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  ArrowLeft,
  Lock,
  Crown,
  Check,
  FileText,
  MessageSquare,
} from "lucide-react"
import Nav from "../../components/Nav"
import "../../styles/entrepreneur/homepageentrepreneur.css"
import SubscriptionModal from "../../components/SubcriptionModal"
import UnlockBudgetForm from '../../components/UnlockBudgetForm'


// Map Controller Component for programmatic map control
function MapController({ center, zoom, triggerKey }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      // Use flyTo for smoother animation when navigating to a location
      const targetZoom = zoom || map.getZoom()
      map.flyTo(center, targetZoom, { animate: true, duration: 1 })
    }
  }, [center, zoom, triggerKey, map])

  // Enforce single world view - prevent panning beyond world bounds
  useEffect(() => {
    const worldBounds = L.latLngBounds(
      L.latLng(-85, -180),
      L.latLng(85, 180)
    )

    // Set max bounds with high viscosity
    map.setMaxBounds(worldBounds)
    map.options.maxBoundsViscosity = 1.0

    // Prevent world wrap by adjusting min zoom based on container size
    const updateMinZoom = () => {
      const containerWidth = map.getContainer().offsetWidth
      // Calculate minimum zoom needed to prevent showing more than one world
      // At zoom 0, the world is 256px wide. Each zoom level doubles the size.
      // We need zoom where world width >= container width
      const minZoomForContainer = Math.ceil(Math.log2(containerWidth / 256))
      const safeMinZoom = Math.max(minZoomForContainer, 2)
      map.setMinZoom(safeMinZoom)
    }

    updateMinZoom()
    map.on('resize', updateMinZoom)

    return () => {
      map.off('resize', updateMinZoom)
    }
  }, [map])

  return null
}

// Create custom building icon
const createBuildingIcon = (jobCount) => {
  const color = jobCount > 0 ? "#E74C3C" : "#7F8C8D"

  return L.divIcon({
    className: "eh-custom-building-icon",
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

// Skeleton Loader Components
const SkeletonPropertyCard = () => (
  <div className="eh-skeleton-property-card">
    <div className="eh-skeleton-header">
      <div className="eh-skeleton-icon"></div>
      <div className="eh-skeleton-text-block">
        <div className="eh-skeleton-title"></div>
        <div className="eh-skeleton-subtitle"></div>
      </div>
    </div>
    <div className="eh-skeleton-stats">
      <div className="eh-skeleton-stat"></div>
    </div>
  </div>
)

const SkeletonJobCard = () => (
  <div className="eh-skeleton-job-card">
    <div className="eh-skeleton-job-header">
      <div className="eh-skeleton-job-title"></div>
      <div className="eh-skeleton-badge"></div>
    </div>
    <div className="eh-skeleton-description"></div>
    <div className="eh-skeleton-description eh-short"></div>
    <div className="eh-skeleton-details">
      <div className="eh-skeleton-detail"></div>
      <div className="eh-skeleton-detail"></div>
      <div className="eh-skeleton-detail"></div>
    </div>
    <div className="eh-skeleton-button"></div>
  </div>
)

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
  const [mapTriggerKey, setMapTriggerKey] = useState(0)
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const [userProfile, setUserProfile] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef(null)
  const floatingPanelRef = useRef(null)
  const [savedScrollPosition, setSavedScrollPosition] = useState(0)

  // Mobile view states
  const [mobileView, setMobileView] = useState("map") // "map" or "list"
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Collapsible floating panel state (collapsed by default)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)

  // data variables
  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [submittedBids, setSubmittedBids] = useState([])
  const [showUnlockBudgetModal, setShowUnlockBudgetModal] = useState(false)
  const [budgetJobId, setBudgetJobId] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  // Radius filter states
  const [radiusFilter, setRadiusFilter] = useState({
    enabled: false,
    radius: 10, // km
    center: null // {lat, lng}
  })

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

  const [userLocation, setUserLocation] = useState(null)
  const [error, setError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [])

  // Extracted fetch functions for reusability
  const fetchPropertiesData = useCallback(async (user) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const response = await fetch(`${API_BASE_URL}/api/properties/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

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
    return newProperties
  }, [])

  const fetchJobsData = useCallback(async (user) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const jobsData = await response.json()
    let jobsArray = []

    if (Array.isArray(jobsData)) {
      jobsArray = jobsData
    } else if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
      jobsArray = jobsData.jobs
    } else if (typeof jobsData === 'object' && jobsData !== null) {
      jobsArray = Object.values(jobsData).filter(item => typeof item === 'object' && item !== null && item.id)
    }

    const transformedJobsPromises = jobsArray.map(async job => {
      let budgetData = { unlocked: false, unlock_date: null, amount_paid: 0 }
      try {
        budgetData = await fetchBudgetStatus(job, user, API_BASE_URL)
      } catch (error) {
        console.warn('Error fetching budget status for job:', job.id, error)
      }
      return {
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
        budgetData: {
          unlocked: budgetData.unlocked,
          unlockDate: budgetData.unlock_date,
          amountPaid: budgetData.amount_paid
        }
      }
    })

    const transformedJobsResults = await Promise.allSettled(transformedJobsPromises)
    const successfulJobs = transformedJobsResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)

    return successfulJobs
  }, [])

  const fetchBidsData = useCallback(async (user) => {
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
    return bids.bids.all.map(bid => bid.job_id)
  }, [])

  // Refresh data function (used after subscription/budget unlock)
  const refreshData = useCallback(async () => {
    const profileString = localStorage.getItem("userProfile")
    if (!profileString) return

    try {
      const user = JSON.parse(profileString)

      // Fetch all data in parallel
      const [newProperties, newJobs, bidIds] = await Promise.all([
        fetchPropertiesData(user),
        fetchJobsData(user),
        fetchBidsData(user)
      ])

      setProperties(newProperties)
      setJobs(newJobs)
      setSubmittedBids(bidIds)

      // Restore selected property if it exists
      if (selectedProperty) {
        const restoredProperty = newProperties.find(p => p.id === selectedProperty.id)
        if (restoredProperty) {
          setSelectedProperty(restoredProperty)
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }, [fetchPropertiesData, fetchJobsData, fetchBidsData, selectedProperty])

  // get user location
  useEffect(() => {
    setIsLoadingLocation(true)

    // Default location (Philippines - Baguio City coordinates as fallback)
    const defaultLocation = { lat: 16.4023, lng: 120.5960 }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setUserLocation(defaultLocation)
      setIsLoadingLocation(false)
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setIsLoadingLocation(false)
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError(err.message);
        // Use default location if geolocation fails
        setUserLocation(defaultLocation)
        setIsLoadingLocation(false)
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false
      }
    );
  }, [])

  // Get open jobs count for each property
  const getPropertyOpenJobsCount = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status?.toLowerCase() === "open").length
  }

  // Get open jobs for a property
  const getPropertyOpenJobs = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status?.toLowerCase() === "open")
  }

  // Filter properties and jobs based on all filters including radius
  const filteredProperties = useMemo(() => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(property.region)
      const matchesCity = filters.cities.length === 0 || filters.cities.includes(property.city)

      const matchesPropertyType =
        filters.propertyTypes.length === 0 || filters.propertyTypes.includes(property.propertyType)

      // Radius filter
      const matchesRadius = !radiusFilter.enabled || !radiusFilter.center ||
        calculateDistance(
          radiusFilter.center.lat,
          radiusFilter.center.lng,
          property.latitude,
          property.longitude
        ) <= radiusFilter.radius

      const propertyJobs = jobs.filter((job) => job.property_id === property.id && job.status?.toLowerCase() === "open")

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
        matchesRadius &&
        matchesWorkType &&
        matchesUrgency &&
        matchesDays &&
        matchesDuration &&
        matchesBudget &&
        matchesBidCount
      )
    })

    return filtered
  }, [properties, jobs, searchTerm, filters, radiusFilter, calculateDistance])

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
  }, [searchTerm, properties, jobs])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.regions.length > 0 ||
      filters.cities.length > 0 ||
      filters.neighborhoods.length > 0 ||
      filters.workTypes.length > 0 ||
      filters.urgency.length > 0 ||
      filters.daysUntilNeeded !== "" ||
      filters.duration !== "" ||
      filters.budgetMin !== "" ||
      filters.budgetMax !== "" ||
      filters.bidCount !== "" ||
      filters.propertyTypes.length > 0 ||
      filters.propertySizes.length > 0
    )
  }, [filters])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.regions.length > 0) count++
    if (filters.cities.length > 0) count++
    if (filters.neighborhoods.length > 0) count++
    if (filters.workTypes.length > 0) count++
    if (filters.urgency.length > 0) count++
    if (filters.daysUntilNeeded !== "") count++
    if (filters.duration !== "") count++
    if (filters.budgetMin !== "" || filters.budgetMax !== "") count++
    if (filters.bidCount !== "") count++
    if (filters.propertyTypes.length > 0) count++
    if (filters.propertySizes.length > 0) count++
    return count
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (Array.isArray(filters[filterType])) {
      const currentValues = filters[filterType]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      setFilters({ ...filters, [filterType]: newValues })
    } else {
      setFilters({ ...filters, [filterType]: value })
    }
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

  const handleBidClick = (job) => {
    // Subscription is already checked at property level - users without subscription
    // cannot see job details, so they cannot reach this point

    // Check bid limit for basic plan users
    const subscription = userProfile?.entrepProfile?.subscription?.subscription
    const planType = subscription?.plan_type
    const bidsInfo = subscription?.bids

    // For basic plan, check if bid limit is reached
    if (planType === 'basic' && bidsInfo) {
      const remaining = bidsInfo.remaining ?? (bidsInfo.limit - bidsInfo.used)
      if (remaining <= 0) {
        alert(`You have used all ${bidsInfo.limit} bids for this month. Upgrade to Premium for unlimited bids.`)
        setShowSubscriptionModal(true)
        return
      }
    }

    setSelectedJob(job)
    setBidAmount("")
    setBidMessage("")
    setBidModalOpen(true)
  }

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false)
  }

  const handleSubmitBid = async () => {
    if (!bidAmount || !bidMessage) {
      alert("Please fill in all required fields")
      return
    }

    const storedProfile = localStorage.getItem('userProfile')

    if(storedProfile) {
      const user = JSON.parse(storedProfile)
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

        // Handle bid limit error (403)
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.error === 'Bid limit reached') {
            alert(`${errorData.message}\n\nUpgrade to Premium for unlimited bids.`)
            setBidModalOpen(false)
            setShowSubscriptionModal(true)
            return
          }
          throw new Error(errorData.message || 'Access denied')
        }

        if(!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json()
        fetchBids()

        // Update local subscription data with new bids_remaining for basic plan
        if (result.subscription && result.subscription.plan_type === 'basic') {
          const updatedProfile = {
            ...user,
            entrepProfile: {
              ...user.entrepProfile,
              subscription: {
                ...user.entrepProfile.subscription,
                subscription: {
                  ...user.entrepProfile.subscription.subscription,
                  bids: {
                    ...user.entrepProfile.subscription.subscription.bids,
                    used: (user.entrepProfile.subscription.subscription.bids?.used || 0) + 1,
                    remaining: result.subscription.bids_remaining
                  }
                }
              }
            }
          }
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
          setUserProfile(updatedProfile)
        }

        alert("Bid submitted successfully!")
        setBidModalOpen(false)
        setBidAmount("")
        setBidMessage("")
        setSelectedJob(null)
      } catch(err) {
        console.log(err)
        alert(err.message || "Failed to submit bid. Please try again.")
      }
    }
  }

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

  const getUrgencyColor = (urgency) => {
    if (urgency === "Immediate") return "var(--color-status-urgent)"
    if (urgency === "This Month") return "var(--color-status-warning)"
    if (urgency === "This Year") return "var(--color-status-warning)"
    switch (urgency) {
      case "Critical":
        return "var(--color-status-urgent)"
      case "High":
        return "#FF8C42"
      case "Medium":
        return "#FFB84D"
      case "Low":
        return "#7F8C8D"
      default:
        return "#7F8C8D"
    }
  }

  const handleSearchResultClick = (property) => {
    setSelectedProperty(property)
    setShowSearchResults(false)
    setSearchTerm("")
    setSearchExpanded(false)
    // Center map on selected property with zoom
    setMapCenter([property.latitude, property.longitude])
    setMapZoom(17)
  }

  // Toggle search expansion
  const toggleSearch = () => {
    if (!searchExpanded) {
      setSearchExpanded(true)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  // Close search when clicking outside
  useEffect(() => {
    localStorage.removeItem("selectedPropertyId")
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (searchExpanded && !searchTerm) {
          setSearchExpanded(false)
        }
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchExpanded, searchTerm])

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowSearchResults(value.length > 0)
  }

  // Handle property click for mobile modal (toggle selection)
  const handlePropertyClick = (property) => {
    // If clicking the same property, deselect it (go back to all properties)
    if (selectedProperty && selectedProperty.id === property.id) {
      setSelectedProperty(null)
      return
    }
    // Save current scroll position before navigating to property jobs
    if (floatingPanelRef.current) {
      setSavedScrollPosition(floatingPanelRef.current.scrollTop)
    }
    setSelectedProperty(property)
    // Expand panel if collapsed (for map marker clicks)
    if (isPanelCollapsed) {
      setIsPanelCollapsed(false)
    }
    if (window.innerWidth <= 768) {
      setPropertyModalOpen(true)
    }
  }

  // Clear selected property to show all properties list
  const handleBackToAllProperties = () => {
    setSelectedProperty(null)
    // Restore scroll position after state update
    setTimeout(() => {
      if (floatingPanelRef.current) {
        floatingPanelRef.current.scrollTop = savedScrollPosition
      }
    }, 0)
  }

  // Close mobile property modal - preserves scroll position in property list
  const handleCloseMobileModal = () => {
    setPropertyModalOpen(false)
    setSelectedProperty(null)
    // Restore scroll position after state update
    setTimeout(() => {
      if (floatingPanelRef.current) {
        floatingPanelRef.current.scrollTop = savedScrollPosition
      }
    }, 0)
  }

  // Handle view location button click - navigate to property on map
  const handleViewLocation = (property, e) => {
    e.stopPropagation() // Prevent triggering card click

    // Validate coordinates - must exist and not be 0,0 (invalid default)
    const hasValidCoordinates =
      property.latitude !== undefined &&
      property.latitude !== null &&
      property.longitude !== undefined &&
      property.longitude !== null &&
      !(property.latitude === 0 && property.longitude === 0)

    if (hasValidCoordinates) {
      // Center map on property location with zoom
      setMapCenter([property.latitude, property.longitude])
      setMapZoom(17)
      // Increment trigger key to force map update even if same location
      setMapTriggerKey(prev => prev + 1)
    } else {
      // Property has no valid coordinates - show alert to user
      alert(`Location not available for "${property.name}". This property needs its coordinates to be set.`)
      return
    }

    // On mobile, close modal and switch to map view
    if (window.innerWidth <= 768) {
      setPropertyModalOpen(false)
      setMobileView("map")
    }
  }

  // Save selected property to localStorage and scroll to top when viewing jobs
  useEffect(() => {
    if (selectedProperty) {
      localStorage.setItem("selectedPropertyId", selectedProperty.id)
      // Scroll to top when viewing a property's jobs
      if (floatingPanelRef.current) {
        floatingPanelRef.current.scrollTop = 0
      }
    }
  }, [selectedProperty])

  // Fetch properties from API (using extracted function)
  useEffect(() => {
    const fetchInitialData = async () => {
      const profileString = localStorage.getItem("userProfile")
      try {
        if (profileString) {
          const user = JSON.parse(profileString)
          setUserProfile(user)
          getProfileAfterSubs(user)

          const newProperties = await fetchPropertiesData(user)
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
        } else {
          console.log("User profile not found.")
        }
      } catch (error) {
        console.error("Error fetching properties or parsing profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [fetchPropertiesData])

  // Fetch jobs from API (using extracted function)
  useEffect(() => {
    const fetchInitialJobs = async () => {
      const profileString = localStorage.getItem("userProfile")

      try {
        if (profileString) {
          const user = JSON.parse(profileString)
          const successfulJobs = await fetchJobsData(user)
          console.log(`Successfully transformed ${successfulJobs.length} jobs`)
          setJobs(successfulJobs)

          // Fetch bids
          const bidIds = await fetchBidsData(user)
          setSubmittedBids(bidIds)
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
        alert('Failed to load jobs. Please refresh the page.')
      }
    }

    fetchInitialJobs()
  }, [fetchJobsData, fetchBidsData])

  const getProfileAfterSubs = (user) => {
    const uProf = localStorage.getItem('userProfile')

    const fetchSubscription = async () => {
      if(uProf) {
        const u = JSON.parse(uProf)
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const getSubsscription = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${u.token}`
          }
        })

        if(!getSubsscription.ok) {
          throw new Error(`Error ${getSubsscription.status}`)
        }

        const subscription = await getSubsscription.json()

        const updatedProfile = {
          ...u,
          entrepProfile: {
            ...u.entrepProfile,
            subscription,
          },
        };

        // Update localStorage so subscription persists across navigation
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        setUserProfile(updatedProfile);
      }
    }
    fetchSubscription()
  }


  const fetchBudgetStatus = async (job, user, API_BASE_URL) => {
    const budgetUnlockResponse = await fetch(`${API_BASE_URL}/api/payments/budget-status/${job.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    })

    if(!budgetUnlockResponse.ok) {
      throw new Error(`Error ${budgetUnlockResponse.status}`)
    }

    const data = await budgetUnlockResponse.json()
    return await data
  }

  const handleBudgetModal = async (success) => {
    setShowUnlockBudgetModal(false)

    if(success) {
       // Refresh data instead of reloading page
       await refreshData()
    }
  }

  // Map zoom control handlers
  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.setZoom(currentZoom + 1)
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.setZoom(currentZoom - 1)
    }
  }

  const handleResetView = () => {
    if (mapRef.current && userLocation) {
      // Zoom out to show wider area while centering on user's location
      mapRef.current.setView([userLocation.lat, userLocation.lng], 5, { animate: true })
    }
  }

  if (isLoading && isLoadingLocation) {
    return (
      <div className="eh-homepage-container">
        <Nav user={userProfile} />
        <main className="eh-main-content">
          <div className="eh-loading-container">
            <SkeletonPropertyCard />
            <div className="eh-section-divider"></div>
            <SkeletonJobCard />
            <SkeletonJobCard />
          </div>
        </main>
      </div>
    )
  }

  const refresher = async () => {
    // Refresh data instead of reloading page
    await refreshData()
    await getProfileAfterSubs(userProfile)
    // Close subscription modal after successful subscription
    setShowSubscriptionModal(false)
  }

  return (
    <div className="eh-homepage-container eh-fullscreen-map-layout">
      <Nav user={userProfile} />

      {/* Full Screen Map Background */}
      <div className="eh-fullscreen-map">
        {userLocation ? (
          <MapContainer
            ref={mapRef}
            center={[userLocation.lat, userLocation.lng]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
            worldCopyJump={false}
            maxBoundsViscosity={1.0}
            maxBounds={[[-85, -180], [85, 180]]}
            minZoom={3}
          >
            {/* CartoDB Voyager - Clean map with English labels */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              noWrap={true}
              bounds={[[-85, -180], [85, 180]]}
            />

            <MapController center={mapCenter} zoom={mapZoom} triggerKey={mapTriggerKey} />

            {/* Radius circle */}
            {radiusFilter.enabled && radiusFilter.center && (
              <Circle
                center={[radiusFilter.center.lat, radiusFilter.center.lng]}
                radius={radiusFilter.radius * 1000}
                pathOptions={{
                  color: '#00A5A9',
                  fillColor: '#00A5A9',
                  fillOpacity: 0.1
                }}
              />
            )}

            {filteredProperties.map((property) => {
              const jobCount = getPropertyOpenJobsCount(property.id)
              return (
                <Marker
                  key={property.id}
                  position={[property.latitude, property.longitude]}
                  icon={createBuildingIcon(jobCount)}
                  eventHandlers={{
                    click: () => handlePropertyClick(property),
                  }}
                >
                  <Popup>
                    <div className="eh-popup-content">
                      <h3>{property.name}</h3>
                      <p>{property.address}</p>
                      <div className="eh-popup-stats">
                        <span className="eh-popup-stat eh-highlight">{jobCount} Open Jobs</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #00A5A9', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {isLoadingLocation ? 'Getting your location...' : 'Loading map...'}
            </p>
            {error && <p style={{ color: '#999', fontSize: '12px' }}>Using default location</p>}
          </div>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className={`eh-map-zoom-controls ${isPanelCollapsed ? "eh-panel-collapsed" : ""}`}>
        <button
          className="eh-map-zoom-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button
          className="eh-map-zoom-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <Minus size={20} />
        </button>
        <div className="eh-map-zoom-divider" />
        <button
          className="eh-map-zoom-btn"
          onClick={handleResetView}
          title="Reset View"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {showSubscriptionModal && userProfile && (
        <SubscriptionModal
          token={userProfile.token}
          refresher={refresher}
          onClose={handleCloseSubscriptionModal}
          showCloseButton={true}
        />
      )}

      {/* Floating Header */}
      <div className="eh-floating-header">
        <div className="eh-search-box-fullwidth" ref={searchContainerRef}>
          <Search size={16} className="eh-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="eh-search-input-full"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="eh-search-clear-btn"
              onClick={() => {
                setSearchTerm("")
                setShowSearchResults(false)
              }}
            >
              <X size={14} />
            </button>
          )}

          {showSearchResults && (
            <div className="eh-search-results-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((property) => (
                  <div
                    key={property.id}
                    className="eh-search-result-item"
                    onClick={() => handleSearchResultClick(property)}
                  >
                    <div className="eh-search-result-icon">
                      <Building2 size={20} />
                    </div>
                    <div className="eh-search-result-content">
                      <div className="eh-search-result-name">{property.name}</div>
                      <div className="eh-search-result-address">{property.address}</div>
                    </div>
                    <div className="eh-search-result-badge">
                      {getPropertyOpenJobsCount(property.id)} Jobs
                    </div>
                  </div>
                ))
              ) : (
                <div className="eh-no-results">
                  <p>No properties found</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className={`eh-filters-btn ${hasActiveFilters ? "eh-active" : ""}`}
          onClick={() => setFiltersPanelOpen(true)}
        >
          <Filter size={16} />
          <span className="eh-filter-btn-text">Filters</span>
          {activeFiltersCount > 0 && <span className="eh-filter-count">{activeFiltersCount}</span>}
        </button>

        <button className="eh-notification-btn">
          <Bell size={16} />
        </button>
      </div>

      {/* Mobile View Toggle */}
      <div className="eh-mobile-view-toggle">
        <button
          className={`eh-view-toggle-btn ${mobileView === "map" ? "eh-active" : ""}`}
          onClick={() => setMobileView("map")}
        >
          <Map size={18} />
          <span>Map</span>
        </button>
        <button
          className={`eh-view-toggle-btn ${mobileView === "list" ? "eh-active" : ""}`}
          onClick={() => setMobileView("list")}
        >
          <List size={18} />
          <span>List</span>
        </button>
      </div>

      {/* Floating Panel Toggle Button */}
      <button
        className={`eh-panel-toggle-btn ${isPanelCollapsed ? "eh-collapsed" : ""}`}
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
      >
        {isPanelCollapsed ? (
          <>
            <ChevronLeft size={16} />
            <span>Show Panel</span>
          </>
        ) : (
          <>
            <ChevronRight size={16} />
            <span>Hide Panel</span>
          </>
        )}
      </button>

      {/* Floating Panel for Jobs/Properties on the Right */}
      <div
        ref={floatingPanelRef}
        className={`eh-floating-panel ${mobileView === "map" ? "eh-mobile-hidden" : ""} ${isPanelCollapsed ? "eh-panel-collapsed" : ""}`}
      >
            {selectedProperty ? (
              <div className="eh-property-details">
                {/* Back to All Properties Button */}
                <button
                  className="eh-back-to-properties-btn"
                  onClick={handleBackToAllProperties}
                >
                  <ArrowLeft size={16} />
                  <span>Back to All Properties</span>
                </button>

                <div className="eh-details-header">
                  <div className="eh-details-header-content">
                    <div className="eh-header-icon">
                      <Building2 size={28} />
                    </div>
                    <div className="eh-header-text">
                      <h2 className="eh-property-name">{selectedProperty.name}</h2>
                      <p className="eh-property-address">{selectedProperty.address}</p>
                      <div className="eh-property-meta">
                        <span className="eh-meta-badge">{selectedProperty.propertyType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="eh-stats-grid">
                  <div className="eh-stat-card eh-highlight">
                    <span className="eh-stat-label">Open Jobs</span>
                    <span className="eh-stat-value">{getPropertyOpenJobsCount(selectedProperty.id)}</span>
                  </div>
                </div>

                <div className="eh-section-divider"></div>

                {/* Check subscription before showing jobs */}
                {!userProfile?.entrepProfile?.subscription?.hasSubscription ? (
                  <div className="eh-subscribe-prompt">
                    <div className="eh-subscribe-prompt-content">
                      {/* Animated background elements */}
                      <div className="eh-subscribe-bg-decoration">
                        <div className="eh-subscribe-circle eh-circle-1"></div>
                        <div className="eh-subscribe-circle eh-circle-2"></div>
                        <div className="eh-subscribe-circle eh-circle-3"></div>
                      </div>

                      {/* Lock icon with glow effect */}
                      <div className="eh-subscribe-icon-wrapper">
                        <div className="eh-subscribe-icon-glow"></div>
                        <div className="eh-subscribe-icon">
                          <Lock size={32} />
                        </div>
                      </div>

                      {/* Job count badge */}
                      <div className="eh-subscribe-job-badge">
                        <Hammer size={14} />
                        <span>{getPropertyOpenJobsCount(selectedProperty.id)} Jobs Available</span>
                      </div>

                      <h3 className="eh-subscribe-title">Unlock Premium Access</h3>
                      <p className="eh-subscribe-description">
                        Get instant access to job details, submit bids, and start winning contracts on this property.
                      </p>

                      {/* Features grid */}
                      <div className="eh-subscribe-features-grid">
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <FileText size={18} />
                          </div>
                          <span>Full Job Details</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <Send size={18} />
                          </div>
                          <span>Submit Bids</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <DollarSign size={18} />
                          </div>
                          <span>View Budgets</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <MessageSquare size={18} />
                          </div>
                          <span>Direct Chat</span>
                        </div>
                      </div>

                      {/* CTA Section */}
                      <div className="eh-subscribe-cta-section">
                        <button
                          className="eh-subscribe-cta-btn"
                          onClick={() => setShowSubscriptionModal(true)}
                        >
                          <Crown size={18} />
                          <span>View Plans</span>
                          <ChevronRight size={18} />
                        </button>

                        <div className="eh-subscribe-trial-badge">
                          <span className="eh-trial-text">14-day free trial</span>
                          <span className="eh-trial-dot">•</span>
                          <span className="eh-trial-text">Cancel anytime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="eh-section-tabs">
                    <div className="eh-section-header">
                      <h3>Available Jobs for Bidding</h3>
                      <span className="eh-job-count-badge">{getPropertyOpenJobs(selectedProperty.id).length} Jobs</span>
                    </div>
                    <div className="eh-jobs-list">
                      {getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                        getPropertyOpenJobs(selectedProperty.id).map((job) => {
                          return (
                            <div key={job.id} className="eh-job-card">
                              <div className="eh-job-card-header">
                                <div className="eh-job-title-section">
                                  <h4 className="eh-job-title">{job.title}</h4>
                                  <div className="eh-job-meta-row">
                                    <span className="eh-job-category">{job.category}</span>
                                  </div>
                                </div>
                                <span className="eh-urgency-badge" style={{ backgroundColor: getUrgencyColor(job.urgency) }}>
                                  {job.urgency}
                                </span>
                              </div>

                              <p className="eh-job-description">{job.description}</p>

                              <div className="eh-job-details-grid">
                                <div className="eh-detail-item">
                                  <DollarSign size={16} />
                                  <div>
                                    {/* unlock */}
                                    <span className="eh-detail-label">Budget Range</span>
                                    <span className="eh-detail-value">
                                      {
                                        job.budgetData.unlocked?
                                      `$${Number.parseFloat(job.budget_min).toLocaleString()} -
                                       $${Number.parseFloat(job.budget_max).toLocaleString()}` :
                                       <>
                                        <button className="unlock-budget-button" onClick={() => {
                                          setBudgetJobId(job.id)
                                          setShowUnlockBudgetModal(true)
                                        }}>Show budget</button>
                                       </>
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="eh-detail-item">
                                  <Clock size={16} />
                                  <div>
                                    <span className="eh-detail-label">Duration</span>
                                    <span className="eh-detail-value">{job.estimated_duration_days} days</span>
                                  </div>
                                </div>
                                <div className="eh-detail-item">
                                  <AlertCircle size={16} />
                                  <div>
                                    <span className="eh-detail-label">Needed In</span>
                                    <span className={`eh-detail-value ${job.daysUntilNeeded <= 0 ? 'eh-urgent-value' : ''}`}>
                                      {job.daysUntilNeeded <= 0 ? 'Urgent' : `${job.daysUntilNeeded} days`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button className={(submittedBids.includes(job.id)? 'eh-bid-button eh-submitted-bid': 'eh-bid-button')} onClick={() => {
                                if(!submittedBids.includes(job.id)) {
                                  handleBidClick(job)
                                }
                              }}>
                                <Hammer size={18} />
                                {submittedBids.includes(job.id)? 'Bid Submitted' : 'Submit Your Bid'}
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="eh-no-jobs">
                          <Hammer size={48} color="var(--color-border-divider)" />
                          <p className="eh-no-jobs-title">No Open Jobs</p>
                          <p className="eh-no-jobs-text">This property has no available jobs for bidding at the moment.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="eh-all-properties-list">
                <div className="eh-list-header">
                  <h3>All Properties</h3>
                  <span className="eh-property-count-badge">{filteredProperties.length} Properties</span>
                </div>
                <div className="eh-properties-grid">
                  {filteredProperties.map((property) => {
                    const jobCount = getPropertyOpenJobsCount(property.id)
                    return (
                      <div
                        key={property.id}
                        className="eh-property-list-card"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <div className="eh-property-card-header">
                          <div className="eh-property-icon">
                            <Building2 size={24} />
                          </div>
                          <div className="eh-property-info">
                            <h4 className="eh-property-card-name">{property.name}</h4>
                            <p className="eh-property-card-address">{property.address}</p>
                            <span className="eh-property-type-badge">{property.propertyType}</span>
                          </div>
                        </div>
                        <div className="eh-property-card-footer">
                          <div className="eh-job-count-indicator">
                            <Hammer size={16} />
                            <span>{jobCount} Open Jobs</span>
                          </div>
                          <div className="eh-property-card-actions">
                            <button
                              className="eh-view-location-btn"
                              onClick={(e) => handleViewLocation(property, e)}
                              title="View Location"
                            >
                              <MapPin size={16} />
                            </button>
                            <button className="eh-view-jobs-btn">View Jobs</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
      </div>

      {
        showUnlockBudgetModal &&
        <UnlockBudgetForm jobId={budgetJobId} token={userProfile.token} handleBudgetModal={handleBudgetModal} />
      }

      {/* Filters Modal */}
      {filtersPanelOpen && (
        <div className="eh-modal-overlay eh-filters" onClick={() => setFiltersPanelOpen(false)}>
          <div className="eh-modal-content eh-filters-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header eh-filters">
              <div className="eh-filters-header-content">
                <div className="eh-header-icon-wrapper">
                  <SlidersHorizontal size={24} />
                </div>
                <h2>Filter Jobs</h2>
              </div>
              <button className="eh-modal-close" onClick={() => setFiltersPanelOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="eh-modal-body">
              <div className="eh-filters-grid">
                {/* Location Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <MapPin size={18} />
                    <h3>Location</h3>
                  </div>
                  <div className="eh-filter-section">
                    <div className="eh-filter-subsection-title">Region</div>
                    <div className="eh-checkbox-group">
                      {["NCR", "Ilocos", "Calabarzon"].map((region) => (
                        <label key={region} className="eh-checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.regions.includes(region)}
                            onChange={() => handleFilterChange("regions", region)}
                          />
                          <span className="eh-checkbox-text">{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Work Type Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Wrench size={18} />
                    <h3>Work Type</h3>
                  </div>
                  <div className="eh-checkbox-group">
                    {["Plumbing", "Electrical", "HVAC", "General Maintenance", "Carpentry"].map((type) => (
                      <label key={type} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.workTypes.includes(type)}
                          onChange={() => handleFilterChange("workTypes", type)}
                        />
                        <span className="eh-checkbox-text">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Urgency Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Zap size={18} />
                    <h3>Urgency</h3>
                  </div>
                  <div className="eh-checkbox-group">
                    {["Critical", "High", "Medium", "Low"].map((urgency) => (
                      <label key={urgency} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.urgency.includes(urgency)}
                          onChange={() => handleFilterChange("urgency", urgency)}
                        />
                        <span className="eh-checkbox-text">{urgency}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Budget Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <DollarSign size={18} />
                    <h3>Budget Range</h3>
                  </div>
                  <div className="eh-budget-inputs">
                    <div className="eh-input-group">
                      <label>Min ($)</label>
                      <input
                        type="number"
                        value={filters.budgetMin}
                        onChange={(e) => handleFilterChange("budgetMin", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="eh-input-group">
                      <label>Max ($)</label>
                      <input
                        type="number"
                        value={filters.budgetMax}
                        onChange={(e) => handleFilterChange("budgetMax", e.target.value)}
                        placeholder="Any"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Clock size={18} />
                    <h3>Duration</h3>
                  </div>
                  <div className="eh-input-group">
                    <label>Max Duration (days)</label>
                    <input
                      type="number"
                      value={filters.duration}
                      onChange={(e) => handleFilterChange("duration", e.target.value)}
                      placeholder="Any"
                    />
                  </div>
                </div>

                {/* Property Type Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Building2 size={18} />
                    <h3>Property Type</h3>
                  </div>
                  <div className="eh-checkbox-group">
                    {["Commercial", "Residential", "Industrial"].map((type) => (
                      <label key={type} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.propertyTypes.includes(type)}
                          onChange={() => handleFilterChange("propertyTypes", type)}
                        />
                        <span className="eh-checkbox-text">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <button className="eh-clear-filters-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="eh-filters-modal-footer">
              <button className="eh-cancel-btn" onClick={() => setFiltersPanelOpen(false)}>
                Cancel
              </button>
              <button className="eh-apply-filters-btn" onClick={() => setFiltersPanelOpen(false)}>
                <Filter size={18} />
                Apply Filters
                {activeFiltersCount > 0 && <span className="eh-footer-badge">{activeFiltersCount}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Property Modal */}
      {propertyModalOpen && selectedProperty && (
        <div className="eh-modal-overlay eh-property-modal" onClick={handleCloseMobileModal}>
          <div className="eh-modal-content eh-property-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header eh-property">
              <h2>{selectedProperty.name}</h2>
              <button className="eh-modal-close" onClick={handleCloseMobileModal}>
                <X size={24} />
              </button>
            </div>

            <div className="eh-modal-body eh-property-modal-body">
              <div className="eh-property-modal-info">
                <p className="eh-property-modal-address">{selectedProperty.address}</p>
                <div className="eh-property-modal-meta">
                  <span className="eh-meta-badge">{selectedProperty.propertyType}</span>
                  <span className="eh-jobs-count-meta">{getPropertyOpenJobsCount(selectedProperty.id)} Open Jobs</span>
                </div>
                <button
                  className="eh-view-location-btn eh-modal-location-btn"
                  onClick={(e) => handleViewLocation(selectedProperty, e)}
                >
                  <MapPin size={16} />
                </button>
              </div>

              <div className="eh-section-divider"></div>

              {/* Check subscription before showing jobs in mobile modal */}
              {!userProfile?.entrepProfile?.subscription?.hasSubscription ? (
                <div className="eh-subscribe-prompt eh-mobile">
                  <div className="eh-subscribe-prompt-content">
                    {/* Animated background elements */}
                    <div className="eh-subscribe-bg-decoration">
                      <div className="eh-subscribe-circle eh-circle-1"></div>
                      <div className="eh-subscribe-circle eh-circle-2"></div>
                    </div>

                    {/* Lock icon with glow effect */}
                    <div className="eh-subscribe-icon-wrapper">
                      <div className="eh-subscribe-icon-glow"></div>
                      <div className="eh-subscribe-icon">
                        <Lock size={28} />
                      </div>
                    </div>

                    {/* Job count badge */}
                    <div className="eh-subscribe-job-badge">
                      <Hammer size={12} />
                      <span>{getPropertyOpenJobsCount(selectedProperty.id)} Jobs</span>
                    </div>

                    <h3 className="eh-subscribe-title">Unlock Access</h3>
                    <p className="eh-subscribe-description">
                      View job details and start bidding on this property.
                    </p>

                    {/* Features grid - compact for mobile */}
                    <div className="eh-subscribe-features-grid eh-mobile-grid">
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <FileText size={16} />
                        </div>
                        <span>Details</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <Send size={16} />
                        </div>
                        <span>Bids</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <DollarSign size={16} />
                        </div>
                        <span>Budget</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <MessageSquare size={16} />
                        </div>
                        <span>Chat</span>
                      </div>
                    </div>

                    {/* CTA Section */}
                    <div className="eh-subscribe-cta-section">
                      <button
                        className="eh-subscribe-cta-btn"
                        onClick={() => {
                          setPropertyModalOpen(false)
                          setShowSubscriptionModal(true)
                        }}
                      >
                        <Crown size={16} />
                        <span>View Plans</span>
                        <ChevronRight size={16} />
                      </button>

                      <div className="eh-subscribe-trial-badge">
                        <span className="eh-trial-text">14-day free trial</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="eh-section-tabs">
                  <h3 className="eh-modal-section-title">Available Jobs</h3>
                  <div className="eh-jobs-list">
                    {getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                      getPropertyOpenJobs(selectedProperty.id).map((job) => {
                        return (
                          <div key={job.id} className="eh-job-card">
                            <div className="eh-job-card-header">
                              <div className="eh-job-title-section">
                                <h4 className="eh-job-title">{job.title}</h4>
                                <div className="eh-job-meta-row">
                                  <span className="eh-job-category">{job.category}</span>
                                  <span className="eh-bid-count-badge">{job.bidCount} bids</span>
                                </div>
                              </div>
                              <span className="eh-urgency-badge" style={{ backgroundColor: getUrgencyColor(job.urgency) }}>
                                {job.urgency}
                              </span>
                            </div>

                            <p className="eh-job-description">{job.description}</p>

                            <div className="eh-job-details-grid">
                              <div className="eh-detail-item">
                                <DollarSign size={16} />
                                <div>
                                  <span className="eh-detail-label">Budget Range</span>
                                  <span className="eh-detail-value">
                                    {
                                        job.budgetData.unlocked?
                                      `$${Number.parseFloat(job.budget_min).toLocaleString()} -
                                       $${Number.parseFloat(job.budget_max).toLocaleString()}` :
                                       <>
                                        <button className="unlock-budget-button" onClick={() => {
                                          setBudgetJobId(job.id)
                                          setShowUnlockBudgetModal(true)
                                        }}>Show budget</button>
                                       </>
                                      }
                                  </span>
                                </div>
                              </div>
                              <div className="eh-detail-item">
                                <Clock size={16} />
                                <div>
                                  <span className="eh-detail-label">Duration</span>
                                  <span className="eh-detail-value">{job.estimated_duration_days} days</span>
                                </div>
                              </div>
                              <div className="eh-detail-item">
                                <AlertCircle size={16} />
                                <div>
                                  <span className="eh-detail-label">Needed In</span>
                                  <span className={`eh-detail-value ${job.daysUntilNeeded <= 0 ? 'eh-urgent-value' : ''}`}>
                                    {job.daysUntilNeeded <= 0 ? 'Urgent' : `${job.daysUntilNeeded} days`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button className={(submittedBids.includes(job.id)? 'eh-bid-button eh-submitted-bid': 'eh-bid-button')} onClick={() => {
                              setPropertyModalOpen(false)
                              handleBidClick(job)
                            }}>
                              <Hammer size={18} />
                              {submittedBids.includes(job.id)? 'Bid Submitted' : 'Submit Your Bid'}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="eh-no-jobs">
                        <Hammer size={48} color="var(--color-border-divider)" />
                        <p className="eh-no-jobs-title">No Open Jobs</p>
                        <p className="eh-no-jobs-text">This property has no available jobs for bidding at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {bidModalOpen && selectedJob && (
        <div className="eh-modal-overlay eh-submit-bid" onClick={() => setBidModalOpen(false)}>
          <div className="eh-modal-content eh-bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header eh-submit-bid">
              <h2>Submit Your Bid</h2>
              <button className="eh-modal-close" onClick={() => setBidModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            {console.log("SELECTED job", selectedJob)}
            <div className="eh-modal-body">
              <div className="eh-job-summary">
                <h3>{selectedJob.title}</h3>
                <p className="eh-job-summary-category">{selectedJob.category}</p>
                <p className="eh-job-summary-budget">
                  Budget Range: {
                    selectedJob.budgetData.unlocked ?
                    `$${Number.parseFloat(selectedJob.budget_min).toLocaleString()} -
                     $${Number.parseFloat(selectedJob.budget_max).toLocaleString()}` :
                    <>
                    <button className="unlock-budget-button" onClick={() => {
                      setBudgetJobId(selectedJob.id)
                      setShowUnlockBudgetModal(true)
                    }}>Show budget</button>
                    </>
                  }
                </p>
              </div>

              {/* Bid Count Indicator for Basic Plan */}
              {userProfile?.entrepProfile?.subscription?.subscription?.plan_type === 'basic' &&
               userProfile?.entrepProfile?.subscription?.subscription?.bids && (
                <div className="eh-bid-count-indicator">
                  <div className="eh-bid-count-info">
                    <span className="eh-bid-count-label">Bids Remaining:</span>
                    <span className="eh-bid-count-value">
                      {userProfile.entrepProfile.subscription.subscription.bids.remaining ??
                       (userProfile.entrepProfile.subscription.subscription.bids.limit -
                        userProfile.entrepProfile.subscription.subscription.bids.used)} / {userProfile.entrepProfile.subscription.subscription.bids.limit}
                    </span>
                  </div>
                  <div className="eh-bid-count-bar">
                    <div
                      className="eh-bid-count-fill"
                      style={{
                        width: `${((userProfile.entrepProfile.subscription.subscription.bids.remaining ??
                                  (userProfile.entrepProfile.subscription.subscription.bids.limit -
                                   userProfile.entrepProfile.subscription.subscription.bids.used)) /
                                 userProfile.entrepProfile.subscription.subscription.bids.limit) * 100}%`
                      }}
                    ></div>
                  </div>
                  {(userProfile.entrepProfile.subscription.subscription.bids.remaining ??
                   (userProfile.entrepProfile.subscription.subscription.bids.limit -
                    userProfile.entrepProfile.subscription.subscription.bids.used)) <= 5 && (
                    <p className="eh-bid-count-warning">
                      Running low on bids! Upgrade to Premium for unlimited bids.
                    </p>
                  )}
                </div>
              )}

              <div className="eh-bid-form">
                <div className="eh-form-group">
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
                  <span className="eh-form-hint">Must be between budget range</span>
                </div>

                <div className="eh-form-group">
                  <label htmlFor="bidMessage">Proposal Message *</label>
                  <textarea
                    id="bidMessage"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Describe your approach, experience, and why you're the best fit for this job..."
                    rows="5"
                  />
                </div>

                <button onClick={handleSubmitBid} className="eh-submit-bid-button">
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