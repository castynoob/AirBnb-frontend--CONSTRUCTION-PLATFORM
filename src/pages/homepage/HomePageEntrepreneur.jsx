"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useQueryClient } from '@tanstack/react-query'
import { useProperties, useJobs, useBids } from '../../hooks/useEntrepreneurData'
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
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Loader,
  Briefcase,
} from "lucide-react"
import toast from "react-hot-toast"
import { useLanguage } from "../../contexts/LanguageContext"
import Nav from "../../components/Nav"
import "../../styles/entrepreneur/homepageentrepreneur.css"
import SubscriptionModal from "../../components/SubcriptionModal"
import UnlockBudgetForm from '../../components/UnlockBudgetForm'
import NotificationBell from '../../components/NotificationBell'
import PropertyManagerProfileModal from '../../components/modal/PropertyManagerProfileModal'


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
  const { t, language } = useLanguage()
  const queryClient = useQueryClient()

  // TanStack Query hooks — cached data, instant on revisit
  const { data: cachedProperties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cachedJobs = [], isLoading: jobsQueryLoading } = useJobs()
  const { data: cachedBids = [], isLoading: bidsLoading } = useBids()

  // Job type image mapping
  const PLACEHOLDER_IMAGE = "/defaultjob.jpg";
  const workTypeImages = {
    'electrical': '/electrical.jpg', 'electric': '/electrical.jpg', 'wiring': '/electrical.jpg', 'électrique': '/electrical.jpg',
    'plumbing': '/plumbing.png', 'plomb': '/plumbing.png', 'faucet': '/plumbing.png', 'robinet': '/plumbing.png',
    'pipe': '/plumbing.png', 'tuyau': '/plumbing.png', 'drain': '/plumbing.png', 'leak': '/plumbing.png', 'fuite': '/plumbing.png',
    'hvac': '/HVAC.png', 'heating': '/HVAC.png', 'chauffage': '/HVAC.png', 'cooling': '/HVAC.png',
    'climatisation': '/HVAC.png', 'air conditioning': '/HVAC.png', 'ventilation': '/HVAC.png',
    'roofing': '/roofing.png', 'roof': '/roofing.png', 'toit': '/roofing.png', 'toiture': '/roofing.png',
    'shingle': '/roofing.png', 'gutter': '/roofing.png', 'gouttière': '/roofing.png',
    'painting': '/painting.png', 'paint': '/painting.png', 'peinture': '/painting.png',
    'flooring': '/flooring.png', 'floor': '/flooring.png', 'plancher': '/flooring.png', 'tile': '/flooring.png', 'carrelage': '/flooring.png',
    'carpentry': '/carpentry.jpg', 'menuiserie': '/carpentry.jpg', 'wood': '/carpentry.jpg', 'bois': '/carpentry.jpg',
    'cabinet': '/carpentry.jpg', 'armoire': '/carpentry.jpg', 'door': '/carpentry.jpg', 'porte': '/carpentry.jpg',
    'window': '/carpentry.jpg', 'fenêtre': '/carpentry.jpg',
    'masonry': '/masonry.png', 'maçonnerie': '/masonry.png', 'brick': '/masonry.png', 'brique': '/masonry.png',
    'concrete': '/masonry.png', 'béton': '/masonry.png', 'stone': '/masonry.png', 'pierre': '/masonry.png',
    'fissure': '/masonry.png', 'crack': '/masonry.png', 'injection': '/masonry.png',
  };

  const getWorkTypeImage = (title) => {
    if (!title) return PLACEHOLDER_IMAGE;
    const lowerTitle = title.toLowerCase();
    for (const [keyword, image] of Object.entries(workTypeImages)) {
      if (lowerTitle.includes(keyword)) return image;
    }
    return PLACEHOLDER_IMAGE;
  };

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
  const [searchTab, setSearchTab] = useState('all') // 'all' | 'jobs' | 'properties' | 'places'
  const [placeResults, setPlaceResults] = useState([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const placeSearchTimeout = useRef(null)
  const searchContainerRef = useRef(null)
  const [userProfile, setUserProfile] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef(null)
  const floatingPanelRef = useRef(null)
  const [savedScrollPosition, setSavedScrollPosition] = useState(0)
  const [expandedDescs, setExpandedDescs] = useState(new Set())

  // Mobile view states
  const [mobileView, setMobileView] = useState("map") // "map" or "list"
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  // Collapsible floating panel state (collapsed by default)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)

  // Skill match filter state
  const [skillMatchEnabled, setSkillMatchEnabled] = useState(false)
  const [entrepreneurSpecializations, setEntrepreneurSpecializations] = useState([])

  // data variables — seeded from TanStack Query cache
  const [properties, setProperties] = useState([])
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [submittedBids, setSubmittedBids] = useState([])

  // Sync query cache → local state (enables instant data on revisit)
  useEffect(() => {
    if (cachedProperties.length > 0) setProperties(cachedProperties)
  }, [cachedProperties])

  useEffect(() => {
    if (cachedJobs.length > 0) {
      setJobs(cachedJobs)
      setJobsLoading(false)
    }
  }, [cachedJobs])

  useEffect(() => {
    if (cachedBids.length > 0) setSubmittedBids(cachedBids)
  }, [cachedBids])
  const [showUnlockBudgetModal, setShowUnlockBudgetModal] = useState(false)
  const [budgetJobId, setBudgetJobId] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  // View/Edit Bid Modal states
  const [viewBidModalOpen, setViewBidModalOpen] = useState(false)
  const [selectedBidToView, setSelectedBidToView] = useState(null)
  const [isEditingBid, setIsEditingBid] = useState(false)
  const [editBidAmount, setEditBidAmount] = useState("")
  const [editBidMessage, setEditBidMessage] = useState("")
  const [isSubmittingBidAction, setIsSubmittingBidAction] = useState(false)
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)

  // Property Manager Profile Modal states
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [selectedManagerProfile, setSelectedManagerProfile] = useState(null)
  const [isLoadingManagerProfile, setIsLoadingManagerProfile] = useState(false)

  // Radius filter states
  const [radiusFilter, setRadiusFilter] = useState({
    enabled: false,
    radius: 10, // km
    center: null // {lat, lng}
  })

  // Filter states - appliedFilters is what's actually used for filtering
  const initialFilters = {
    provinces: [],
    otherProvince: "",
    cities: [],
    neighborhoods: [],
    workTypes: [],
    otherWorkType: "",
    urgency: [],
    deadlinePreset: "",
    deadlineDate: "",
    bidCount: "",
    propertyTypes: [],
    propertySizes: [],
  }
  const [filters, setFilters] = useState(initialFilters) // Pending filters (in modal)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters) // Actually applied filters

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

  // NOTE: Properties, jobs, and bids initial fetching is handled by TanStack Query hooks
  // (useProperties, useJobs, useBids) — see top of component.

  // Fetch budget status for all jobs in the background and update state
  const enrichJobsWithBudgetData = useCallback(async (jobsList, user) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const budgetResults = await Promise.allSettled(
      jobsList.map(async (job) => {
        const budgetData = await fetchBudgetStatus(job, user, API_BASE_URL)
        return { jobId: job.id, budgetData }
      })
    )

    const budgetMap = {}
    budgetResults.forEach(result => {
      if (result.status === 'fulfilled') {
        budgetMap[result.value.jobId] = {
          unlocked: result.value.budgetData.unlocked,
          unlockDate: result.value.budgetData.unlock_date,
          amountPaid: result.value.budgetData.amount_paid
        }
      }
    })

    setJobs(prev => prev.map(job => budgetMap[job.id]
      ? { ...job, budgetData: budgetMap[job.id] }
      : job
    ))
  }, [])

  // Refresh data function (used after subscription/budget unlock)
  // Invalidates TanStack Query cache so fresh data is fetched
  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['entrepreneur'] })

    // Also enrich budget data after refresh
    const profileString = localStorage.getItem("userProfile")
    if (profileString) {
      try {
        const user = JSON.parse(profileString)
        const freshJobs = queryClient.getQueryData(['entrepreneur', 'jobs'])
        if (freshJobs) {
          enrichJobsWithBudgetData(freshJobs, user)
        }
      } catch (error) {
        console.error("Error enriching budget data:", error)
      }
    }
  }, [queryClient, enrichJobsWithBudgetData])

  // Helper function to check if user has bid on a job
  const hasBidOnJob = useCallback((jobId) => {
    return submittedBids.some(bid => bid.job_id === jobId)
  }, [submittedBids])

  // Helper function to get bid for a job
  const getBidForJob = useCallback((jobId) => {
    return submittedBids.find(bid => bid.job_id === jobId)
  }, [submittedBids])

  // get user location — try browser geolocation, fallback to Montreal
  useEffect(() => {
    setIsLoadingLocation(true)
    const defaultLocation = { lat: 45.5017, lng: -73.5673 }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
          setIsLoadingLocation(false)
        },
        () => {
          // Denied or error — fallback to Montreal
          setUserLocation(defaultLocation)
          setIsLoadingLocation(false)
        },
        { timeout: 5000, maximumAge: 300000 }
      )
    } else {
      setUserLocation(defaultLocation)
      setIsLoadingLocation(false)
    }
  }, [])


  // Get open jobs count for each property
  const getPropertyOpenJobsCount = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status?.toLowerCase() === 'open').length
  }

  // Get open jobs for a property
  const getPropertyOpenJobs = (propertyId) => {
    return jobs.filter((job) => job.property_id === propertyId && job.status?.toLowerCase() === 'open')
  }

  // Filter properties and jobs based on all filters including radius
  const filteredProperties = useMemo(() => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())

      // Province/State filter - combine checkbox selections and text field input
      const selectedProvinces = [...appliedFilters.provinces]
      if (appliedFilters.otherProvince && appliedFilters.otherProvince.trim()) {
        selectedProvinces.push(appliedFilters.otherProvince.trim())
      }
      const matchesProvince = selectedProvinces.length === 0 || selectedProvinces.some(province =>
        property.region?.toLowerCase().includes(province.toLowerCase())
      )
      const matchesCity = appliedFilters.cities.length === 0 || appliedFilters.cities.includes(property.city)

      const matchesPropertyType =
        appliedFilters.propertyTypes.length === 0 || appliedFilters.propertyTypes.includes(property.propertyType)

      // Radius filter
      const matchesRadius = !radiusFilter.enabled || !radiusFilter.center ||
        calculateDistance(
          radiusFilter.center.lat,
          radiusFilter.center.lng,
          property.latitude,
          property.longitude
        ) <= radiusFilter.radius

      // Filter for open jobs
      const propertyJobs = jobs.filter((job) => job.property_id === property.id && job.status?.toLowerCase() === 'open')

      // Work type filter - combine checkbox selections and text field input
      const selectedWorkTypes = [...appliedFilters.workTypes]
      if (appliedFilters.otherWorkType && appliedFilters.otherWorkType.trim()) {
        selectedWorkTypes.push(appliedFilters.otherWorkType.trim())
      }
      const matchesWorkType =
        selectedWorkTypes.length === 0 || propertyJobs.some((job) =>
          selectedWorkTypes.some(type => job.category?.toLowerCase().includes(type.toLowerCase()))
        )

      const matchesUrgency =
        appliedFilters.urgency.length === 0 || propertyJobs.some((job) => {
          const jobUrgency = (job.urgency || "").toLowerCase()
          return appliedFilters.urgency.some(filterVal => {
            if (filterVal === "Urgent") {
              return jobUrgency.includes("urgent") || jobUrgency === "critical" || jobUrgency === "high"
            }
            if (filterVal === "Planned") {
              return !jobUrgency.includes("urgent") && jobUrgency !== "critical" && jobUrgency !== "high"
            }
            return false
          })
        })

      // Submission deadline filter - checks job's due_date
      const matchesDeadline = (() => {
        if (!appliedFilters.deadlinePreset && !appliedFilters.deadlineDate) return true
        let cutoffDate = null
        if (appliedFilters.deadlineDate) {
          cutoffDate = new Date(appliedFilters.deadlineDate)
          cutoffDate.setHours(23, 59, 59, 999)
        } else if (appliedFilters.deadlinePreset) {
          const days = { "7": 7, "30": 30, "90": 90 }[appliedFilters.deadlinePreset]
          if (days) {
            cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          }
        }
        if (!cutoffDate) return true
        return propertyJobs.some((job) => {
          if (!job.due_date) return false
          return new Date(job.due_date) <= cutoffDate
        })
      })()

      const matchesBidCount =
        !appliedFilters.bidCount || propertyJobs.some((job) => job.bidCount <= Number.parseInt(appliedFilters.bidCount))

      // Skill match filter - only show properties with jobs matching entrepreneur's specializations
      const matchesSkills = !skillMatchEnabled || entrepreneurSpecializations.length === 0 ||
        propertyJobs.some((job) =>
          entrepreneurSpecializations.some(spec =>
            job.category?.toLowerCase().includes(spec.toLowerCase()) ||
            spec.toLowerCase().includes(job.category?.toLowerCase() || '')
          )
        )

      return (
        matchesSearch &&
        matchesProvince &&
        matchesCity &&
        matchesPropertyType &&
        matchesRadius &&
        matchesWorkType &&
        matchesUrgency &&
        matchesDeadline &&
        matchesBidCount &&
        matchesSkills
      )
    })

    // Sort properties by open job count (most jobs first)
    const sorted = filtered.sort((a, b) => {
      const aJobCount = jobs.filter((job) => job.property_id === a.id && job.status?.toLowerCase() === 'open').length
      const bJobCount = jobs.filter((job) => job.property_id === b.id && job.status?.toLowerCase() === 'open').length
      return bJobCount - aJobCount
    })

    return sorted
  }, [properties, jobs, searchTerm, appliedFilters, radiusFilter, calculateDistance, skillMatchEnabled, entrepreneurSpecializations])

  // Get search results for dropdown — properties and jobs
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return []
    return properties
      .filter((property) => {
        const matchesSearch =
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch && getPropertyOpenJobsCount(property.id) > 0
      })
      .slice(0, 4)
  }, [searchTerm, properties, jobs])

  const jobSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase()
    return jobs
      .filter(job =>
        job.title?.toLowerCase().includes(term) ||
        job.category?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term)
      )
      .slice(0, 4)
  }, [searchTerm, jobs])

  const hasAnyResults = searchResults.length > 0 || jobSearchResults.length > 0 || placeResults.length > 0

  // Check if any filters are active (in the modal - pending)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.provinces.length > 0 ||
      filters.otherProvince !== "" ||
      filters.cities.length > 0 ||
      filters.neighborhoods.length > 0 ||
      filters.workTypes.length > 0 ||
      filters.otherWorkType !== "" ||
      filters.urgency.length > 0 ||
      filters.deadlinePreset !== "" ||
      filters.deadlineDate !== "" ||
      filters.bidCount !== "" ||
      filters.propertyTypes.length > 0 ||
      filters.propertySizes.length > 0
    )
  }, [filters])

  // Count applied filters (shown in badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (appliedFilters.provinces.length > 0 || appliedFilters.otherProvince !== "") count++
    if (appliedFilters.cities.length > 0) count++
    if (appliedFilters.neighborhoods.length > 0) count++
    if (appliedFilters.workTypes.length > 0 || appliedFilters.otherWorkType !== "") count++
    if (appliedFilters.urgency.length > 0) count++
    if (appliedFilters.deadlinePreset !== "" || appliedFilters.deadlineDate !== "") count++
    if (appliedFilters.bidCount !== "") count++
    if (appliedFilters.propertyTypes.length > 0) count++
    if (appliedFilters.propertySizes.length > 0) count++
    return count
  }, [appliedFilters])

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
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  // Apply filters - this is called when "Apply Filters" button is clicked
  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setFiltersPanelOpen(false)
  }

  // Cancel filters - reset pending filters to applied filters
  const cancelFilters = () => {
    setFilters({ ...appliedFilters })
    setFiltersPanelOpen(false)
  }

  const handleBidClick = (job) => {
    const subscription = userProfile?.entrepProfile?.subscription?.subscription

    // Check if user has no subscription
    if (!subscription) {
      toast.error(t('entrepreneurHome.subscriptionRequired') || 'You need a subscription to place bids.')
      setShowSubscriptionModal(true)
      return
    }

    // Check if trial has expired (0 days remaining)
    if (subscription.is_trial && subscription.trial_days_remaining !== null && subscription.trial_days_remaining <= 0) {
      toast.error(t('entrepreneurHome.trialExpired') || 'Your free trial has ended. Please subscribe or update your payment method to continue.')
      setShowSubscriptionModal(true)
      return
    }

    // Check if subscription is past_due (card charge failed)
    if (subscription.status === 'past_due') {
      toast.error(t('entrepreneurHome.paymentFailed') || 'Your payment failed. Please update your payment method to continue.')
      setShowSubscriptionModal(true)
      return
    }

    // Check if subscription is canceled or inactive
    if (subscription.status && !['active', 'trialing'].includes(subscription.status)) {
      toast.error(t('entrepreneurHome.subscriptionInactive') || 'Your subscription is inactive. Please resubscribe to continue.')
      setShowSubscriptionModal(true)
      return
    }

    // Check bid limit for starter and basic plan users
    const planType = subscription?.plan_type
    const bidsInfo = subscription?.bids

    if ((planType === 'starter' || planType === 'basic') && bidsInfo) {
      const remaining = bidsInfo.remaining ?? (bidsInfo.limit - bidsInfo.used)
      if (remaining <= 0) {
        const upgradeMsg = planType === 'starter'
          ? `You have used all ${bidsInfo.limit} bids for this month. Upgrade to Basic or Premium for more bids.`
          : `You have used all ${bidsInfo.limit} bids for this month. Upgrade to Premium for unlimited bids.`
        toast.error(upgradeMsg)
        setShowSubscriptionModal(true)
        return
      }
    }

    // Starter plan: cannot bid on projects over $2,500
    if (planType === 'starter' && job.budget && parseFloat(job.budget) > 2500) {
      toast.error(t('toasts.starterPlanLimit'))
      return
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
      toast.error(t('entrepreneurHome.fillAllFields'))
      return
    }

    if (!selectedJob) {
      toast.error(t('entrepreneurHome.selectJobError') || 'Please select a job first')
      return
    }

    const storedProfile = localStorage.getItem('userProfile')

    if(storedProfile) {
      const user = JSON.parse(storedProfile)
      setIsSubmittingBid(true)
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

        // Handle subscription/bid errors (403)
        if (response.status === 403) {
          const errorData = await response.json()
          setBidModalOpen(false)

          if (errorData.action === 'update_payment_method' || errorData.error === 'Trial expired' || errorData.error === 'Payment failed') {
            toast.error(t('common.trialEnded') || 'Your trial has ended. Please update your payment method.')
            setShowSubscriptionModal(true)
            return
          }

          if (errorData.error === 'Bid limit reached') {
            toast.error(t('common.upgradeRequired') || 'Upgrade to Premium for unlimited bids.')
            setShowSubscriptionModal(true)
            return
          }

          if (errorData.action === 'upgrade_plan') {
            toast.error(t('common.upgradeRequired') || 'Upgrade your subscription to bid on this project.')
            setShowSubscriptionModal(true)
            return
          }

          if (errorData.action === 'create_subscription' || errorData.action === 'reactivate_subscription') {
            toast.error(t('common.subscriptionRequired') || 'Subscription required to place bids.')
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
        refreshBids()

        // Update local subscription data with new bids_remaining for starter/basic plan
        if (result.subscription && (result.subscription.plan_type === 'starter' || result.subscription.plan_type === 'basic')) {
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

        toast.success(t('entrepreneurHome.bidSubmittedSuccess'))
        setBidModalOpen(false)
        setBidAmount("")
        setBidMessage("")
        setSelectedJob(null)
      } catch(err) {
        console.log(err)
        toast.error(t('entrepreneurHome.bidSubmitError') || "Failed to submit bid. Please try again.")
      } finally {
        setIsSubmittingBid(false)
      }
    }
  }

  // Refresh bids via TanStack Query cache invalidation
  const refreshBids = () => {
    queryClient.invalidateQueries({ queryKey: ['entrepreneur', 'bids'] })
  }

  // Handle viewing a bid
  const handleViewBid = (jobId) => {
    const bid = getBidForJob(jobId)
    if (bid) {
      setSelectedBidToView(bid)
      setEditBidAmount(bid.amount.toString())
      setEditBidMessage(bid.message || "")
      setIsEditingBid(false)
      setViewBidModalOpen(true)
    }
  }

  // Handle updating a bid
  const handleUpdateBid = async () => {
    if (!editBidAmount) {
      toast.error(t('entrepreneurHome.enterBidAmountError'))
      return
    }

    const storedProfile = localStorage.getItem('userProfile')
    if (!storedProfile || !selectedBidToView) return

    setIsSubmittingBidAction(true)
    try {
      const user = JSON.parse(storedProfile)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/bids/${selectedBidToView.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(editBidAmount),
          message: editBidMessage
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update bid')
      }

      toast.success(t('entrepreneurHome.bidUpdatedSuccess'))
      setViewBidModalOpen(false)
      setIsEditingBid(false)
      setSelectedBidToView(null)
      refreshBids() // Refresh bids via cache
    } catch (err) {
      console.error(err)
      toast.error(t('entrepreneurHome.bidUpdateError') || "Failed to update bid.")
    } finally {
      setIsSubmittingBidAction(false)
    }
  }

  // Handle deleting a bid
  const handleDeleteBid = async () => {
    const storedProfile = localStorage.getItem('userProfile')
    if (!storedProfile || !selectedBidToView) return

    setIsSubmittingBidAction(true)
    try {
      const user = JSON.parse(storedProfile)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/bids/${selectedBidToView.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete bid')
      }

      toast.success(t('entrepreneurHome.bidDeletedSuccess'))
      setViewBidModalOpen(false)
      setSelectedBidToView(null)
      refreshBids() // Refresh bids via cache
    } catch (err) {
      console.error(err)
      toast.error(t('entrepreneurHome.bidDeleteError') || "Failed to delete bid.")
    } finally {
      setIsSubmittingBidAction(false)
    }
  }

  // Handle viewing property manager profile
  const handleViewManagerProfile = async (property) => {
    if (!property.managerId || isLoadingManagerProfile) return

    setIsLoadingManagerProfile(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(
        `${API_BASE_URL}/api/users/manager/profile/id/${property.managerId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userProfile.token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch manager profile')
      }

      const data = await response.json()
      // Use the profile data directly - it now includes all user fields from the backend
      setSelectedManagerProfile(data.profile)
      setShowManagerModal(true)
    } catch (error) {
      console.error('Error fetching manager profile:', error)
      toast.error(t('entrepreneurHome.failedLoadManagerProfile'))
    } finally {
      setIsLoadingManagerProfile(false)
    }
  }

  const getUrgencyClass = (urgency) => {
    const u = (urgency || "").toLowerCase()
    if (u === "urgent" || u.includes("urgent") || u.includes("critical") || u.includes("high") || u.includes("immediate")) {
      return "eh-urgency-urgent"
    }
    return "eh-urgency-planned"
  }

  const toggleDescExpand = (jobId, e) => {
    e.stopPropagation()
    setExpandedDescs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
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

  // Search places via Nominatim when searchTerm changes
  useEffect(() => {
    if (placeSearchTimeout.current) clearTimeout(placeSearchTimeout.current)
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setPlaceResults([])
      return
    }
    placeSearchTimeout.current = setTimeout(async () => {
      setIsSearchingPlaces(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=ca&limit=4&addressdetails=1`,
          { headers: { 'User-Agent': 'INTERVOS Construction Platform' } }
        )
        const data = await res.json()
        setPlaceResults(data || [])
      } catch {
        setPlaceResults([])
      }
      setIsSearchingPlaces(false)
    }, 500)
    return () => { if (placeSearchTimeout.current) clearTimeout(placeSearchTimeout.current) }
  }, [searchTerm])

  const handlePlaceClick = (place) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    setMapCenter([lat, lng])
    setMapZoom(14)
    setMapTriggerKey(prev => prev + 1)
    setShowSearchResults(false)
    setSearchTerm(place.display_name.split(',').slice(0, 2).join(','))
    setSearchExpanded(false)
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
      // Property has no valid coordinates - show toast to user
      toast.error(t('entrepreneurHome.locationNotAvailable') || `Location not available for this property.`)
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

  // Initialize user profile and restore selected property from cache
  useEffect(() => {
    const profileString = localStorage.getItem("userProfile")
    if (profileString) {
      try {
        const user = JSON.parse(profileString)
        setUserProfile(user)
        getProfileAfterSubs(user)

        // Extract entrepreneur specializations for skill-based filtering
        const specs = user.entrepProfile?.entrepProfile?.specializations ||
                      user.entrepProfile?.profile?.specializations || []
        setEntrepreneurSpecializations(Array.isArray(specs) ? specs : [])
      } catch (error) {
        console.error("Error parsing profile:", error)
      }
    }
  }, [])

  // Restore selected property when properties are loaded (from cache or fetch)
  useEffect(() => {
    if (cachedProperties.length > 0) {
      const savedPropertyId = localStorage.getItem("selectedPropertyId")
      if (savedPropertyId && !selectedProperty) {
        const restoredProperty = cachedProperties.find((p) => p.id === savedPropertyId)
        if (restoredProperty) {
          setSelectedProperty(restoredProperty)
          setMapCenter([restoredProperty.latitude, restoredProperty.longitude])
          setMapZoom(17)
        }
      }
      setIsLoading(false)
    }
    if (!propertiesLoading && cachedProperties.length === 0) {
      setIsLoading(false)
    }
  }, [cachedProperties, propertiesLoading])

  // Enrich jobs with budget data once TanStack Query delivers them
  useEffect(() => {
    if (cachedJobs.length > 0) {
      const profileString = localStorage.getItem("userProfile")
      if (profileString) {
        try {
          const user = JSON.parse(profileString)
          enrichJobsWithBudgetData(cachedJobs, user)
        } catch (error) {
          console.error("Error enriching budget data:", error)
        }
      }
    }
  }, [cachedJobs, enrichJobsWithBudgetData])

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

  // Auto-show subscription plans modal for unsubscribed users on each login
  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) return

    const profileString = localStorage.getItem('userProfile')
    if (!profileString) return

    const user = JSON.parse(profileString)
    const userId = user.id

    // Use sessionStorage to show modal once per login session
    // This ensures modal shows each time user logs in, but not repeatedly during same session
    const modalShownKey = `subscription_modal_shown_session_${userId}`
    const wasModalShownThisSession = sessionStorage.getItem(modalShownKey)

    if (wasModalShownThisSession) return

    // Check if user has NO subscription (not even trial)
    const hasSubscription = user.entrepProfile?.subscription?.hasSubscription
    const subscriptionData = user.entrepProfile?.subscription?.subscription

    // If no subscription at all, show the plans modal
    if (!hasSubscription && (!subscriptionData || !subscriptionData.status)) {
      // Small delay to let the page render first
      setTimeout(() => {
        setShowSubscriptionModal(true)
        // Mark that we've shown the modal this session
        sessionStorage.setItem(modalShownKey, 'true')
      }, 800)
    }
  }, [isLoading])

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
            zoom={17}
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
                        <span className="eh-popup-stat eh-highlight">{jobCount} {t('entrepreneurHome.openJobs')}</span>
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
              {isLoadingLocation ? t('entrepreneurHome.gettingLocation') : t('entrepreneurHome.loadingMap')}
            </p>
            {error && <p style={{ color: '#999', fontSize: '12px' }}>{t('entrepreneurHome.usingDefaultLocation')}</p>}
          </div>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className={`eh-map-zoom-controls ${isPanelCollapsed ? "eh-panel-collapsed" : ""}`}>
        <button
          className="eh-map-zoom-btn"
          onClick={handleZoomIn}
          title={t('entrepreneurHome.zoomIn')}
        >
          <Plus size={20} />
        </button>
        <button
          className="eh-map-zoom-btn"
          onClick={handleZoomOut}
          title={t('entrepreneurHome.zoomOut')}
        >
          <Minus size={20} />
        </button>
        <div className="eh-map-zoom-divider" />
        <button
          className="eh-map-zoom-btn"
          onClick={handleResetView}
          title={t('entrepreneurHome.resetView')}
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
        <NotificationBell />

        <div className="eh-search-box-fullwidth" ref={searchContainerRef}>
          <Search size={16} className="eh-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="eh-search-input-full"
            placeholder={t('entrepreneurHome.searchPlaceholder')}
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

          {showSearchResults && searchTerm.trim() && (
            <div className="eh-search-results-dropdown" style={{ maxHeight: '360px', display: 'flex', flexDirection: 'column' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0, padding: '0 0.25rem' }}>
                {[
                  { key: 'all', label: t('entrepreneurHome.searchAll') || 'All' },
                  { key: 'jobs', label: t('entrepreneurHome.searchJobs') || 'Jobs', count: jobSearchResults.length },
                  { key: 'properties', label: t('entrepreneurHome.searchProperties') || 'Properties', count: searchResults.length },
                  { key: 'places', label: t('entrepreneurHome.searchPlaces') || 'Places', count: placeResults.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSearchTab(tab.key) }}
                    style={{
                      flex: 1, padding: '0.5rem 0.25rem', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
                      color: searchTab === tab.key ? '#00A5A9' : '#9ca3af',
                      borderBottom: searchTab === tab.key ? '2px solid #00A5A9' : '2px solid transparent',
                      transition: 'all 0.15s', whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Jobs */}
                {(searchTab === 'all' || searchTab === 'jobs') && jobSearchResults.length > 0 && (
                  <>
                    {searchTab === 'all' && <div style={{ padding: '0.375rem 0.75rem', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', background: '#f9fafb' }}>{t('entrepreneurHome.searchJobs') || 'Jobs'}</div>}
                    {jobSearchResults.map(job => {
                      const prop = properties.find(p => p.jobs?.some(j => j.id === job.id))
                      return (
                        <div key={job.id} className="eh-search-result-item" onClick={() => {
                          if (prop) {
                            setSelectedProperty(prop)
                            setMapCenter([prop.latitude, prop.longitude])
                            setMapZoom(17)
                          }
                          setShowSearchResults(false)
                          setSearchExpanded(false)
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={16} style={{ color: '#00A5A9' }} />
                          </div>
                          <div className="eh-search-result-content">
                            <div className="eh-search-result-name">{job.title}</div>
                            <div className="eh-search-result-address">{job.category}{prop ? ` · ${prop.address}` : ''}</div>
                          </div>
                          {job.budget_min && <div className="eh-search-result-badge">${Number(job.budget_min).toLocaleString()}</div>}
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Properties */}
                {(searchTab === 'all' || searchTab === 'properties') && searchResults.length > 0 && (
                  <>
                    {searchTab === 'all' && <div style={{ padding: '0.375rem 0.75rem', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', background: '#f9fafb' }}>{t('entrepreneurHome.searchProperties') || 'Properties'}</div>}
                    {searchResults.map(property => (
                      <div key={property.id} className="eh-search-result-item" onClick={() => handleSearchResultClick(property)}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={16} style={{ color: '#2563eb' }} />
                        </div>
                        <div className="eh-search-result-content">
                          <div className="eh-search-result-name">{property.name}</div>
                          <div className="eh-search-result-address">{property.address}</div>
                        </div>
                        <div className="eh-search-result-badge">{getPropertyOpenJobsCount(property.id)} {t('entrepreneurHome.jobs')}</div>
                      </div>
                    ))}
                  </>
                )}

                {/* Places */}
                {(searchTab === 'all' || searchTab === 'places') && placeResults.length > 0 && (
                  <>
                    {searchTab === 'all' && <div style={{ padding: '0.375rem 0.75rem', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', background: '#f9fafb' }}>{t('entrepreneurHome.searchPlaces') || 'Places'}</div>}
                    {placeResults.map((place, i) => (
                      <div key={i} className="eh-search-result-item" onClick={() => handlePlaceClick(place)}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin size={16} style={{ color: '#d97706' }} />
                        </div>
                        <div className="eh-search-result-content">
                          <div className="eh-search-result-name">{place.display_name.split(',')[0]}</div>
                          <div className="eh-search-result-address">{place.display_name.split(',').slice(1, 3).join(',').trim()}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Loading places */}
                {isSearchingPlaces && placeResults.length === 0 && (searchTab === 'all' || searchTab === 'places') && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8125rem' }}>
                    {t('entrepreneurHome.searchingPlaces') || 'Searching places...'}
                  </div>
                )}

                {/* No results */}
                {!hasAnyResults && !isSearchingPlaces && (
                  <div className="eh-no-results">
                    <p>{t('entrepreneurHome.noResultsFound') || 'No results found'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {entrepreneurSpecializations.length > 0 && (
          <button
            className={`eh-skill-match-btn ${skillMatchEnabled ? "eh-active" : ""}`}
            onClick={() => setSkillMatchEnabled(!skillMatchEnabled)}
            title={skillMatchEnabled ? t('entrepreneurHome.showAllJobs') : t('entrepreneurHome.matchMySkills')}
          >
            <Target size={16} />
            <span className="eh-filter-btn-text">{t('entrepreneurHome.mySkills')}</span>
          </button>
        )}

        <button
          className={`eh-filters-btn ${activeFiltersCount > 0 ? "eh-active" : ""}`}
          onClick={() => {
            setFilters({ ...appliedFilters }) // Sync pending filters with applied
            setFiltersPanelOpen(true)
          }}
        >
          <Filter size={16} />
          <span className="eh-filter-btn-text">{t('entrepreneurHome.filters')}</span>
          {activeFiltersCount > 0 && <span className="eh-filter-count">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Mobile View Toggle */}
      <div className="eh-mobile-view-toggle">
        <button
          className={`eh-view-toggle-btn ${mobileView === "map" ? "eh-active" : ""}`}
          onClick={() => setMobileView("map")}
        >
          <Map size={18} />
          <span>{t('entrepreneurHome.map')}</span>
        </button>
        <button
          className={`eh-view-toggle-btn ${mobileView === "list" ? "eh-active" : ""}`}
          onClick={() => setMobileView("list")}
        >
          <List size={18} />
          <span>{t('entrepreneurHome.list')}</span>
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
            <span>{t('entrepreneurHome.showPanel')}</span>
          </>
        ) : (
          <>
            <ChevronRight size={16} />
            <span>{t('entrepreneurHome.hidePanel')}</span>
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
                  <span>{t('entrepreneurHome.backToAllProperties')}</span>
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
                    <span className="eh-stat-label">{t('entrepreneurHome.openJobs')}</span>
                    <span className="eh-stat-value">{getPropertyOpenJobsCount(selectedProperty.id)}</span>
                  </div>
                </div>

                {/* Property Manager Info */}
                {selectedProperty.managerCompanyName && (
                  <div
                    className="eh-manager-info"
                    onClick={() => handleViewManagerProfile(selectedProperty)}
                    title={t('entrepreneurHome.viewManagerProfile')}
                  >
                    <div className="eh-manager-avatar">
                      {selectedProperty.managerImage ? (
                        <img src={selectedProperty.managerImage} alt={selectedProperty.managerCompanyName} />
                      ) : (
                        selectedProperty.managerCompanyName?.charAt(0) || 'P'
                      )}
                    </div>
                    <div className="eh-manager-details">
                      <span className="eh-manager-label">{t('entrepreneurHome.managedBy')}</span>
                      <span className="eh-manager-name">{selectedProperty.managerCompanyName}</span>
                    </div>
                    <ChevronRight size={16} className="eh-manager-chevron" />
                  </div>
                )}

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
                        <span>{getPropertyOpenJobsCount(selectedProperty.id)} {t('entrepreneurHome.jobsAvailable')}</span>
                      </div>

                      <h3 className="eh-subscribe-title">{t('entrepreneurHome.unlockPremiumAccess')}</h3>
                      <p className="eh-subscribe-description">
                        {t('entrepreneurHome.unlockDescription')}
                      </p>

                      {/* Features grid */}
                      <div className="eh-subscribe-features-grid">
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <FileText size={18} />
                          </div>
                          <span>{t('entrepreneurHome.fullJobDetails')}</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <Send size={18} />
                          </div>
                          <span>{t('entrepreneurHome.submitBids')}</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <DollarSign size={18} />
                          </div>
                          <span>{t('entrepreneurHome.viewBudgets')}</span>
                        </div>
                        <div className="eh-subscribe-feature-card">
                          <div className="eh-feature-icon">
                            <MessageSquare size={18} />
                          </div>
                          <span>{t('entrepreneurHome.directChat')}</span>
                        </div>
                      </div>

                      {/* CTA Section */}
                      <div className="eh-subscribe-cta-section">
                        <button
                          className="eh-subscribe-cta-btn"
                          onClick={() => setShowSubscriptionModal(true)}
                        >
                          <Crown size={18} />
                          <span>{t('entrepreneurHome.viewPlans')}</span>
                          <ChevronRight size={18} />
                        </button>

                        <div className="eh-subscribe-trial-badge">
                          <span className="eh-trial-text">{t('entrepreneurHome.freeTrial')}</span>
                          <span className="eh-trial-dot">•</span>
                          <span className="eh-trial-text">{t('entrepreneurHome.cancelAnytime')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="eh-section-tabs">
                    <div className="eh-section-header">
                      <h3>{t('entrepreneurHome.availableJobsForBidding')}</h3>
                      {!jobsLoading && (
                        <span className="eh-job-count-badge">{getPropertyOpenJobs(selectedProperty.id).length} {t('entrepreneurHome.jobs')}</span>
                      )}
                    </div>
                    <div className="eh-jobs-list">
                      {jobsLoading ? (
                        <div className="eh-jobs-loading">
                          <Loader size={20} className="eh-loading-spinner" />
                          <p className="eh-loading-text">{t('entrepreneurHome.loadingJobs')}</p>
                          <SkeletonJobCard />
                          <SkeletonJobCard />
                          <SkeletonJobCard />
                        </div>
                      ) : getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                        getPropertyOpenJobs(selectedProperty.id).map((job) => {
                          return (
                            <div key={job.id} className="eh-job-card">
                              <div className="eh-job-card-header">
                                <span className={`eh-urgency-badge ${getUrgencyClass(job.urgency)}`}>
                                  {job.urgency}
                                </span>
                                <div className="eh-job-title-section">
                                  <h4 className="eh-job-title">{job.title}</h4>
                                  <div className="eh-job-meta-row">
                                    <span className="eh-job-category">{job.category}</span>
                                  </div>
                                </div>
                              </div>

                              <p
                                className={`eh-job-description ${expandedDescs.has(job.id) ? 'eh-desc-expanded' : 'eh-desc-clamped'}`}
                                onClick={(e) => toggleDescExpand(job.id, e)}
                              >
                                {job.description}
                              </p>

                              <div className="eh-job-details-grid">
                                <div className="eh-detail-item">
                                  <DollarSign size={16} />
                                  <div>
                                    {/* unlock */}
                                    <span className="eh-detail-label">{t('entrepreneurHome.budgetRange')}</span>
                                    <span className="eh-detail-value">
                                      {
                                        (job.budget_min == null || job.budget_max == null) ?
                                        'Budget to be defined' :
                                        job.budgetData.unlocked?
                                      `$${Number.parseFloat(job.budget_min).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -
                                       $${Number.parseFloat(job.budget_max).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                       <>
                                        <button className="unlock-budget-button" onClick={() => {
                                          setBudgetJobId(job.id)
                                          setShowUnlockBudgetModal(true)
                                        }}>{t('entrepreneurHome.showBudget')}</button>
                                       </>
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="eh-detail-item">
                                  <Clock size={16} />
                                  <div>
                                    <span className="eh-detail-label">{t('entrepreneurHome.duration')}</span>
                                    <span className="eh-detail-value">{job.estimated_duration_days} {t('entrepreneurHome.days')}</span>
                                  </div>
                                </div>
                                <div className="eh-detail-item">
                                  <AlertCircle size={16} />
                                  <div>
                                    <span className="eh-detail-label">{t('entrepreneurHome.neededIn')}</span>
                                    <span className={`eh-detail-value ${job.daysUntilNeeded <= 0 ? 'eh-urgent-value' : ''}`}>
                                      {job.daysUntilNeeded <= 0 ? t('entrepreneurHome.urgent') : `${job.daysUntilNeeded} ${t('entrepreneurHome.days')}`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="eh-bid-actions-row">
                                {hasBidOnJob(job.id) ? (
                                  <>
                                    <button className="eh-bid-button eh-submitted-bid" disabled>
                                      <Check size={18} />
                                      {t('entrepreneurHome.bidSubmitted')}
                                    </button>
                                    <button
                                      className="eh-view-bid-icon-btn"
                                      onClick={() => handleViewBid(job.id)}
                                      title={t('entrepreneurHome.viewBid')}
                                    >
                                      <Eye size={20} />
                                    </button>
                                  </>
                                ) : (
                                  <button className="eh-bid-button" onClick={() => handleBidClick(job)}>
                                    <Hammer size={18} />
                                    {t('entrepreneurHome.submitYourBid')}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="eh-no-jobs">
                          <Hammer size={48} color="var(--color-border-divider)" />
                          <p className="eh-no-jobs-title">{t('entrepreneurHome.noOpenJobs')}</p>
                          <p className="eh-no-jobs-text">{t('entrepreneurHome.noOpenJobsDescription')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="eh-all-properties-list">
                <div className="eh-list-header">
                  <h3>{t('entrepreneurHome.allProperties')}</h3>
                  <span className="eh-property-count-badge">{filteredProperties.length} {t('entrepreneurHome.properties')}</span>
                </div>

                <div className="eh-properties-grid">
                  {filteredProperties.map((property) => {
                    const jobCount = getPropertyOpenJobsCount(property.id)
                    return (
                      <div
                        key={property.id}
                        className={`eh-property-list-card ${jobCount === 0 ? 'eh-property-no-jobs' : ''}`}
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
                            <span>{jobCount} {t('entrepreneurHome.openJobs')}</span>
                          </div>
                          <div className="eh-property-card-actions">
                            <button
                              className="eh-view-location-btn"
                              onClick={(e) => handleViewLocation(property, e)}
                              title={t('entrepreneurHome.viewLocation')}
                            >
                              <MapPin size={16} />
                            </button>
                            <button className="eh-view-jobs-btn">{t('entrepreneurHome.viewJobs')}</button>
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
                <h2>{t('entrepreneurHome.filterJobs')}</h2>
              </div>
              <button className="eh-modal-close" onClick={() => setFiltersPanelOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="eh-modal-body">
              <div className="eh-filters-grid">
                {/* Location Filters - Quebec Regions */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <MapPin size={18} />
                    <h3>{t('entrepreneurHome.location')}</h3>
                  </div>
                  <div className="eh-filter-section">
                    <div className="eh-filter-subsection-title">{t('entrepreneurHome.filterRegion')}</div>
                    <div className="eh-checkbox-group">
                      {[
                        { value: "Montreal", labelKey: "entrepreneurHome.regionMontreal" },
                        { value: "Laval", labelKey: "entrepreneurHome.regionLaval" },
                        { value: "Rive-Nord", labelKey: "entrepreneurHome.regionNorthShore" },
                        { value: "Rive-Sud", labelKey: "entrepreneurHome.regionSouthShore" },
                        { value: "Quebec City", labelKey: "entrepreneurHome.regionQuebecCity" },
                        { value: "Gatineau", labelKey: "entrepreneurHome.regionGatineau" },
                        { value: "Sherbrooke", labelKey: "entrepreneurHome.regionSherbrooke" },
                        { value: "Trois-Rivieres", labelKey: "entrepreneurHome.regionTroisRivieres" },
                      ].map((region) => (
                        <label key={region.value} className="eh-checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.provinces.includes(region.value)}
                            onChange={() => handleFilterChange("provinces", region.value)}
                          />
                          <span className="eh-checkbox-text">{t(region.labelKey)}</span>
                        </label>
                      ))}
                    </div>
                    <div className="eh-input-group eh-other-input">
                      <label>{t('entrepreneurHome.otherRegion')}</label>
                      <input
                        type="text"
                        value={filters.otherProvince}
                        onChange={(e) => handleFilterChange("otherProvince", e.target.value)}
                        placeholder={t('entrepreneurHome.otherRegionPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Work Type Filters - Expanded */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Wrench size={18} />
                    <h3>{t('entrepreneurHome.workType')}</h3>
                  </div>
                  <div className="eh-checkbox-group eh-checkbox-grid-scrollable">
                    {[
                      { value: "Plumbing", labelKey: "entrepreneurHome.wtPlumbing" },
                      { value: "Electrical", labelKey: "entrepreneurHome.wtElectrical" },
                      { value: "HVAC", labelKey: "entrepreneurHome.wtHVAC" },
                      { value: "Roofing", labelKey: "entrepreneurHome.wtRoofing" },
                      { value: "Windows/Doors", labelKey: "entrepreneurHome.wtWindowsDoors" },
                      { value: "Snow Removal", labelKey: "entrepreneurHome.wtSnowRemoval" },
                      { value: "Janitorial", labelKey: "entrepreneurHome.wtJanitorial" },
                      { value: "Painting", labelKey: "entrepreneurHome.wtPainting" },
                      { value: "Masonry", labelKey: "entrepreneurHome.wtMasonry" },
                      { value: "Landscaping", labelKey: "entrepreneurHome.wtLandscaping" },
                      { value: "Duct Cleaning", labelKey: "entrepreneurHome.wtDuctCleaning" },
                      { value: "Elevators", labelKey: "entrepreneurHome.wtElevators" },
                      { value: "Carpentry", labelKey: "entrepreneurHome.wtCarpentry" },
                      { value: "Flooring", labelKey: "entrepreneurHome.wtFlooring" },
                      { value: "General Repair", labelKey: "entrepreneurHome.wtGeneralRepair" },
                    ].map((type) => (
                      <label key={type.value} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.workTypes.includes(type.value)}
                          onChange={() => handleFilterChange("workTypes", type.value)}
                        />
                        <span className="eh-checkbox-text">{t(type.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="eh-input-group eh-other-input">
                    <label>{t('entrepreneurHome.otherWorkType')}</label>
                    <input
                      type="text"
                      value={filters.otherWorkType}
                      onChange={(e) => handleFilterChange("otherWorkType", e.target.value)}
                      placeholder={t('entrepreneurHome.otherWorkTypePlaceholder')}
                    />
                  </div>
                </div>

                {/* Urgency Filters - Urgent vs Planned */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Zap size={18} />
                    <h3>{t('entrepreneurHome.urgency')}</h3>
                  </div>
                  <div className="eh-checkbox-group">
                    {[
                      { value: "Urgent", color: "#dc2626", labelKey: "entrepreneurHome.urgentLabel" },
                      { value: "Planned", color: "#7F8C8D", labelKey: "entrepreneurHome.plannedLabel" },
                    ].map((urgency) => (
                      <label key={urgency.value} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.urgency.includes(urgency.value)}
                          onChange={() => handleFilterChange("urgency", urgency.value)}
                        />
                        <span className="eh-checkbox-text">
                          <span className="eh-urgency-dot" style={{ backgroundColor: urgency.color }}></span>
                          {t(urgency.labelKey)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submission Deadline Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Calendar size={18} />
                    <h3>{t('entrepreneurHome.submissionDeadline')}</h3>
                  </div>
                  <div className="eh-preset-buttons">
                    {[
                      { labelKey: "entrepreneurHome.next7Days", value: "7" },
                      { labelKey: "entrepreneurHome.next30Days", value: "30" },
                      { labelKey: "entrepreneurHome.next90Days", value: "90" },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        className={`eh-preset-btn ${filters.deadlinePreset === preset.value ? 'active' : ''}`}
                        onClick={() => {
                          if (filters.deadlinePreset === preset.value) {
                            setFilters({ ...filters, deadlinePreset: "", deadlineDate: "" })
                          } else {
                            setFilters({ ...filters, deadlinePreset: preset.value, deadlineDate: "" })
                          }
                        }}
                      >
                        {t(preset.labelKey)}
                      </button>
                    ))}
                  </div>
                  <div className="eh-input-group">
                    <label>{t('entrepreneurHome.customDeadline')}</label>
                    <input
                      type="date"
                      value={filters.deadlineDate}
                      onChange={(e) => setFilters({ ...filters, deadlineDate: e.target.value, deadlinePreset: "" })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Property Type Filters */}
                <div className="eh-filter-group">
                  <div className="eh-filter-group-header">
                    <Building2 size={18} />
                    <h3>{t('entrepreneurHome.propertyType')}</h3>
                  </div>
                  <div className="eh-checkbox-group">
                    {[
                      { value: "Residential", labelKey: "entrepreneurHome.ptResidential" },
                      { value: "Commercial", labelKey: "entrepreneurHome.ptCommercial" },
                    ].map((type) => (
                      <label key={type.value} className="eh-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.propertyTypes.includes(type.value)}
                          onChange={() => handleFilterChange("propertyTypes", type.value)}
                        />
                        <span className="eh-checkbox-text">{t(type.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <button className="eh-clear-filters-btn" onClick={clearFilters}>
                  {t('entrepreneurHome.clearAllFilters')}
                </button>
              )}
            </div>

            <div className="eh-filters-modal-footer">
              <button className="eh-cancel-btn" onClick={cancelFilters}>
                {t('common.cancel')}
              </button>
              <button className="eh-apply-filters-btn" onClick={applyFilters}>
                <Filter size={18} />
                {t('entrepreneurHome.applyFilters')}
                {hasActiveFilters && <span className="eh-footer-badge">!</span>}
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
                  <span className="eh-jobs-count-meta">{getPropertyOpenJobsCount(selectedProperty.id)} {t('entrepreneurHome.openJobs')}</span>
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
                      <span>{getPropertyOpenJobsCount(selectedProperty.id)} {t('entrepreneurHome.jobs')}</span>
                    </div>

                    <h3 className="eh-subscribe-title">{t('entrepreneurHome.unlockAccess')}</h3>
                    <p className="eh-subscribe-description">
                      {t('entrepreneurHome.unlockAccessDescription')}
                    </p>

                    {/* Features grid - compact for mobile */}
                    <div className="eh-subscribe-features-grid eh-mobile-grid">
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <FileText size={16} />
                        </div>
                        <span>{t('entrepreneurHome.details')}</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <Send size={16} />
                        </div>
                        <span>{t('entrepreneurHome.bids')}</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <DollarSign size={16} />
                        </div>
                        <span>{t('entrepreneurHome.budget')}</span>
                      </div>
                      <div className="eh-subscribe-feature-card">
                        <div className="eh-feature-icon">
                          <MessageSquare size={16} />
                        </div>
                        <span>{t('entrepreneurHome.chat')}</span>
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
                        <span>{t('entrepreneurHome.viewPlans')}</span>
                        <ChevronRight size={16} />
                      </button>

                      <div className="eh-subscribe-trial-badge">
                        <span className="eh-trial-text">{t('entrepreneurHome.freeTrial')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="eh-section-tabs">
                  <h3 className="eh-modal-section-title">{t('entrepreneurHome.availableJobs')}</h3>
                  <div className="eh-jobs-list">
                    {getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                      getPropertyOpenJobs(selectedProperty.id).map((job) => {
                        return (
                          <div key={job.id} className="eh-job-card">
                            <div className="eh-job-card-header">
                              <span className={`eh-urgency-badge ${getUrgencyClass(job.urgency)}`}>
                                {job.urgency}
                              </span>
                              <div className="eh-job-title-section">
                                <h4 className="eh-job-title">{job.title}</h4>
                                <div className="eh-job-meta-row">
                                  <span className="eh-job-category">{job.category}</span>
                                  <span className="eh-bid-count-badge">{job.bidCount} {t('entrepreneurHome.bids')}</span>
                                </div>
                              </div>
                            </div>

                            <p
                              className={`eh-job-description ${expandedDescs.has(job.id) ? 'eh-desc-expanded' : 'eh-desc-clamped'}`}
                              onClick={(e) => toggleDescExpand(job.id, e)}
                            >
                              {job.description}
                            </p>

                            <div className="eh-job-details-grid">
                              <div className="eh-detail-item">
                                <DollarSign size={16} />
                                <div>
                                  <span className="eh-detail-label">{t('entrepreneurHome.budgetRange')}</span>
                                  <span className="eh-detail-value">
                                    {
                                        (job.budget_min == null || job.budget_max == null) ?
                                        'Budget to be defined' :
                                        job.budgetData.unlocked?
                                      `$${Number.parseFloat(job.budget_min).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -
                                       $${Number.parseFloat(job.budget_max).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                       <>
                                        <button className="unlock-budget-button" onClick={() => {
                                          setBudgetJobId(job.id)
                                          setShowUnlockBudgetModal(true)
                                        }}>{t('entrepreneurHome.showBudget')}</button>
                                       </>
                                      }
                                  </span>
                                </div>
                              </div>
                              <div className="eh-detail-item">
                                <Clock size={16} />
                                <div>
                                  <span className="eh-detail-label">{t('entrepreneurHome.duration')}</span>
                                  <span className="eh-detail-value">{job.estimated_duration_days} {t('entrepreneurHome.days')}</span>
                                </div>
                              </div>
                              <div className="eh-detail-item">
                                <AlertCircle size={16} />
                                <div>
                                  <span className="eh-detail-label">{t('entrepreneurHome.neededIn')}</span>
                                  <span className={`eh-detail-value ${job.daysUntilNeeded <= 0 ? 'eh-urgent-value' : ''}`}>
                                    {job.daysUntilNeeded <= 0 ? t('entrepreneurHome.urgent') : `${job.daysUntilNeeded} ${t('entrepreneurHome.days')}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="eh-bid-actions-row">
                              {hasBidOnJob(job.id) ? (
                                <>
                                  <button className="eh-bid-button eh-submitted-bid" disabled>
                                    <Check size={18} />
                                    {t('entrepreneurHome.bidSubmitted')}
                                  </button>
                                  <button
                                    className="eh-view-bid-icon-btn"
                                    onClick={() => {
                                      setPropertyModalOpen(false)
                                      handleViewBid(job.id)
                                    }}
                                    title={t('entrepreneurHome.viewBid')}
                                  >
                                    <Eye size={20} />
                                  </button>
                                </>
                              ) : (
                                <button className="eh-bid-button" onClick={() => {
                                  setPropertyModalOpen(false)
                                  handleBidClick(job)
                                }}>
                                  <Hammer size={18} />
                                  {t('entrepreneurHome.submitYourBid')}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="eh-no-jobs">
                        <Hammer size={48} color="var(--color-border-divider)" />
                        <p className="eh-no-jobs-title">{t('entrepreneurHome.noOpenJobs')}</p>
                        <p className="eh-no-jobs-text">{t('entrepreneurHome.noOpenJobsDescription')}</p>
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
              <h2>{t('entrepreneurHome.submitYourBid')}</h2>
              <button className="eh-modal-close" onClick={() => setBidModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            {console.log("SELECTED job", selectedJob)}
            <div className="eh-modal-body">
              <div className="eh-job-image-container">
                <img
                  src={getWorkTypeImage(selectedJob.title)}
                  alt={selectedJob.title}
                  className="eh-job-image"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
              </div>
              <div className="eh-job-summary">
                <h3>{selectedJob.title}</h3>
                <p className="eh-job-summary-category">{selectedJob.category}</p>
                <p className="eh-job-summary-budget">
                  {t('entrepreneurHome.budgetRange')}: {
                    selectedJob.budgetData.unlocked ?
                    `$${Number.parseFloat(selectedJob.budget_min).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -
                     $${Number.parseFloat(selectedJob.budget_max).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                    <>
                    <button className="unlock-budget-button" onClick={() => {
                      setBudgetJobId(selectedJob.id)
                      setShowUnlockBudgetModal(true)
                    }}>{t('entrepreneurHome.showBudget')}</button>
                    </>
                  }
                </p>
              </div>

              {/* Bid Count Indicator for Starter/Basic Plan */}
              {(userProfile?.entrepProfile?.subscription?.subscription?.plan_type === 'starter' ||
                userProfile?.entrepProfile?.subscription?.subscription?.plan_type === 'basic') &&
               userProfile?.entrepProfile?.subscription?.subscription?.bids && (
                <div className="eh-bid-count-indicator">
                  <div className="eh-bid-count-info">
                    <span className="eh-bid-count-label">{t('entrepreneurHome.bidsRemaining')}:</span>
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
                      {t('entrepreneurHome.lowBidsWarning')}
                    </p>
                  )}
                </div>
              )}

              <div className="eh-bid-form">
                <div className="eh-form-group">
                  <label htmlFor="bidAmount">{t('entrepreneurHome.yourBidAmount')} *</label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={t('entrepreneurHome.enterBidAmount')}
                    min={selectedJob.budget_min}
                    max={selectedJob.budget_max}
                  />
                </div>

                <div className="eh-form-group">
                  <label htmlFor="bidMessage">{t('entrepreneurHome.proposalMessage')} *</label>
                  <textarea
                    id="bidMessage"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder={t('entrepreneurHome.proposalPlaceholder')}
                    rows="5"
                  />
                </div>

                <button onClick={handleSubmitBid} className="eh-submit-bid-button" disabled={isSubmittingBid}>
                  {isSubmittingBid ? (
                    <>
                      <span className="eh-bid-spinner" />
                      {t('entrepreneurHome.submitting') || 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('entrepreneurHome.submitBid')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Bid Modal */}
      {viewBidModalOpen && selectedBidToView && (
        <div className="eh-modal-overlay eh-view-bid" onClick={() => {
          setViewBidModalOpen(false)
          setIsEditingBid(false)
          setSelectedBidToView(null)
        }}>
          <div className="eh-modal-content eh-view-bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header eh-view-bid">
              <h2>{isEditingBid ? t('entrepreneurHome.editYourBid') : t('entrepreneurHome.yourSubmittedBid')}</h2>
              <button className="eh-modal-close" onClick={() => {
                setViewBidModalOpen(false)
                setIsEditingBid(false)
                setSelectedBidToView(null)
              }}>
                <X size={24} />
              </button>
            </div>

            <div className="eh-modal-body">
              {/* Job Info */}
              <div className="eh-view-bid-job-info">
                <h3>{selectedBidToView.job_title}</h3>
                <p className="eh-view-bid-category">{selectedBidToView.category}</p>
                {selectedBidToView.property_address && (
                  <p className="eh-view-bid-location">
                    <MapPin size={14} />
                    {selectedBidToView.property_address}, {selectedBidToView.city}
                  </p>
                )}
              </div>

              {/* Bid Status Badge */}
              <div className={`eh-view-bid-status eh-status-${selectedBidToView.status}`}>
                <span>{t('entrepreneurHome.status')}: {selectedBidToView.status.charAt(0).toUpperCase() + selectedBidToView.status.slice(1)}</span>
              </div>

              {/* Bid Details */}
              {isEditingBid ? (
                <div className="eh-edit-bid-form">
                  <div className="eh-form-group">
                    <label htmlFor="editBidAmount">{t('entrepreneurHome.bidAmountLabel')} *</label>
                    <input
                      type="number"
                      id="editBidAmount"
                      value={editBidAmount}
                      onChange={(e) => setEditBidAmount(e.target.value)}
                      placeholder={t('entrepreneurHome.enterBidAmount')}
                    />
                  </div>

                  <div className="eh-form-group">
                    <label htmlFor="editBidMessage">{t('entrepreneurHome.proposalMessage')}</label>
                    <textarea
                      id="editBidMessage"
                      value={editBidMessage}
                      onChange={(e) => setEditBidMessage(e.target.value)}
                      placeholder={t('entrepreneurHome.describeApproach')}
                      rows="5"
                    />
                  </div>

                  <div className="eh-edit-bid-actions">
                    <button
                      className="eh-cancel-edit-btn"
                      onClick={() => {
                        setIsEditingBid(false)
                        setEditBidAmount(selectedBidToView.amount.toString())
                        setEditBidMessage(selectedBidToView.message || "")
                      }}
                      disabled={isSubmittingBidAction}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="eh-save-bid-btn"
                      onClick={handleUpdateBid}
                      disabled={isSubmittingBidAction}
                    >
                      {isSubmittingBidAction ? t('entrepreneurHome.saving') : t('entrepreneurHome.saveChanges')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="eh-view-bid-details">
                    <div className="eh-view-bid-detail-item">
                      <DollarSign size={20} />
                      <div>
                        <span className="eh-view-bid-label">{t('entrepreneurHome.yourBidAmountLabel')}</span>
                        <span className="eh-view-bid-value">${Number(selectedBidToView.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="eh-view-bid-detail-item">
                      <Clock size={20} />
                      <div>
                        <span className="eh-view-bid-label">{t('entrepreneurHome.submittedOn')}</span>
                        <span className="eh-view-bid-value">
                          {new Date(selectedBidToView.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedBidToView.message && (
                    <div className="eh-view-bid-message">
                      <h4>{t('entrepreneurHome.yourProposalMessage')}</h4>
                      <p>{selectedBidToView.message}</p>
                    </div>
                  )}

                  {/* Action buttons - only show for pending bids */}
                  {selectedBidToView.status === 'pending' && (
                    <div className="eh-view-bid-actions">
                      <button
                        className="eh-edit-bid-btn"
                        onClick={() => setIsEditingBid(true)}
                        disabled={isSubmittingBidAction}
                      >
                        <Edit3 size={18} />
                        {t('entrepreneurHome.editBid')}
                      </button>
                      <button
                        className="eh-delete-bid-btn"
                        onClick={handleDeleteBid}
                        disabled={isSubmittingBidAction}
                      >
                        <Trash2 size={18} />
                        {isSubmittingBidAction ? t('entrepreneurHome.deleting') : t('entrepreneurHome.deleteBid')}
                      </button>
                    </div>
                  )}

                  {selectedBidToView.status !== 'pending' && (
                    <div className="eh-view-bid-status-message">
                      <p>
                        {selectedBidToView.status === 'approved'
                          ? t('entrepreneurHome.bidApprovedMessage')
                          : t('entrepreneurHome.bidDeclinedMessage')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Property Manager Profile Modal */}
      <PropertyManagerProfileModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        profile={selectedManagerProfile}
      />
    </div>
  )
}

export default HomePageEntrepreneur