import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Building2, AlertCircle, Clock, DollarSign, Hammer, X, Send, Bell, SlidersHorizontal, MapPin, Wrench, Zap, Filter } from 'lucide-react';
import Nav from '../../components/Nav';
import '../../styles/entrepreneur/homepageentrepreneur.css';
import SubscriptionModal from '../../components/SubcriptionModal';

// Expanded sample data with 15+ properties
const properties = [
  { id: "prop-1", name: "Sunset Apartments", latitude: 16.0418, longitude: 120.3335, address: "123 Main St, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Downtown", propertyType: "Residential", propertySize: "Medium", totalUnits: 12 },
  { id: "prop-2", name: "Harbor View Complex", latitude: 16.0478, longitude: 120.3385, address: "456 Beach Rd, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Beachfront", propertyType: "Commercial", propertySize: "Large", totalUnits: 24 },
  { id: "prop-3", name: "City Center Tower", latitude: 16.0398, longitude: 120.3295, address: "789 Downtown Ave, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Business District", propertyType: "Mixed-Use", propertySize: "Large", totalUnits: 36 },
  { id: "prop-4", name: "Palm Grove Residences", latitude: 16.0448, longitude: 120.3265, address: "234 Palm St, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Suburban", propertyType: "Residential", propertySize: "Small", totalUnits: 8 },
  { id: "prop-5", name: "Marina Bay Condos", latitude: 16.0488, longitude: 120.3415, address: "567 Marina Dr, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Beachfront", propertyType: "Residential", propertySize: "Large", totalUnits: 48 },
  { id: "prop-6", name: "Tech Hub Plaza", latitude: 16.0368, longitude: 120.3325, address: "890 Innovation Blvd, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Business District", propertyType: "Commercial", propertySize: "Medium", totalUnits: 16 },
  { id: "prop-7", name: "Riverside Apartments", latitude: 16.0438, longitude: 120.3245, address: "345 River Rd, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Riverside", propertyType: "Residential", propertySize: "Medium", totalUnits: 20 },
  { id: "prop-8", name: "Heritage Mall", latitude: 16.0408, longitude: 120.3365, address: "678 Heritage Ave, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Downtown", propertyType: "Commercial", propertySize: "Large", totalUnits: 32 },
  { id: "prop-9", name: "Garden View Villas", latitude: 16.0458, longitude: 120.3285, address: "901 Garden Ln, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Suburban", propertyType: "Residential", propertySize: "Small", totalUnits: 6 },
  { id: "prop-10", name: "Skyline Towers", latitude: 16.0388, longitude: 120.3345, address: "123 Sky St, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Business District", propertyType: "Mixed-Use", propertySize: "Large", totalUnits: 52 },
  { id: "prop-11", name: "Coastal Breeze Hotel", latitude: 16.0498, longitude: 120.3395, address: "456 Coastal Rd, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Beachfront", propertyType: "Commercial", propertySize: "Large", totalUnits: 40 },
  { id: "prop-12", name: "Oak Street Homes", latitude: 16.0428, longitude: 120.3305, address: "789 Oak St, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Downtown", propertyType: "Residential", propertySize: "Small", totalUnits: 10 },
  { id: "prop-13", name: "Commerce Center", latitude: 16.0378, longitude: 120.3315, address: "234 Commerce Dr, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Business District", propertyType: "Commercial", propertySize: "Medium", totalUnits: 18 },
  { id: "prop-14", name: "Lakeside Estates", latitude: 16.0468, longitude: 120.3255, address: "567 Lake View, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Suburban", propertyType: "Residential", propertySize: "Medium", totalUnits: 14 },
  { id: "prop-15", name: "Metro Plaza", latitude: 16.0398, longitude: 120.3375, address: "890 Metro Blvd, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Downtown", propertyType: "Mixed-Use", propertySize: "Large", totalUnits: 44 },
  { id: "prop-16", name: "Pine Hills Apartments", latitude: 16.0448, longitude: 120.3225, address: "123 Pine Ave, Dagupan City", region: "Ilocos Region", city: "Dagupan City", neighborhood: "Suburban", propertyType: "Residential", propertySize: "Medium", totalUnits: 16 }
];

const units = [
  { id: "unit-1", property_id: "prop-1", unit_number: "101", floor: 1, bedrooms: 2, bathrooms: 1, square_feet: 850, is_occupied: true },
  { id: "unit-2", property_id: "prop-1", unit_number: "102", floor: 1, bedrooms: 3, bathrooms: 2, square_feet: 1200, is_occupied: false },
  { id: "unit-3", property_id: "prop-1", unit_number: "201", floor: 2, bedrooms: 2, bathrooms: 1, square_feet: 850, is_occupied: true },
  { id: "unit-4", property_id: "prop-2", unit_number: "A1", floor: 1, bedrooms: 1, bathrooms: 1, square_feet: 650, is_occupied: true },
  { id: "unit-5", property_id: "prop-2", unit_number: "A2", floor: 1, bedrooms: 2, bathrooms: 1.5, square_feet: 900, is_occupied: false },
  { id: "unit-6", property_id: "prop-3", unit_number: "1A", floor: 1, bedrooms: 3, bathrooms: 2, square_feet: 1400, is_occupied: true }
];

const jobs = [
  { id: "job-1", property_id: "prop-1", unit_id: "unit-1", title: "Leaking Faucet Repair", description: "Kitchen faucet needs replacement. The current faucet is dripping constantly.", category: "Plumbing", urgency: "This Month", daysUntilNeeded: 15, due_date: "2025-11-15T16:00:00.000Z", estimated_duration_days: 1, budget_min: "150.00", budget_max: "300.00", status: "Open", bidCount: 3 },
  { id: "job-2", property_id: "prop-1", unit_id: null, title: "Roof Repair Needed", description: "Replace damaged shingles on building roof after recent storm.", category: "Roofing", urgency: "This Year", daysUntilNeeded: 75, due_date: "2025-12-30T16:00:00.000Z", estimated_duration_days: 5, budget_min: "5000.00", budget_max: "8000.00", status: "Open", bidCount: 8 },
  { id: "job-3", property_id: "prop-2", unit_id: "unit-4", title: "AC Unit Maintenance", description: "Annual AC maintenance and filter replacement with coil cleaning.", category: "HVAC", urgency: "Next Year", daysUntilNeeded: 135, due_date: "2026-03-01T16:00:00.000Z", estimated_duration_days: 2, budget_min: "200.00", budget_max: "400.00", status: "Open", bidCount: 1 },
  { id: "job-4", property_id: "prop-3", unit_id: "unit-6", title: "Electrical Wiring Update", description: "Update outdated electrical wiring. Replace aluminum with copper wiring.", category: "Electrical", urgency: "Immediate", daysUntilNeeded: 5, due_date: "2025-11-30T16:00:00.000Z", estimated_duration_days: 3, budget_min: "1500.00", budget_max: "2500.00", status: "In Progress", bidCount: 12 },
  { id: "job-5", property_id: "prop-2", unit_id: null, title: "Parking Lot Resurfacing", description: "Resurface and repaint the main parking lot. Fill cracks and apply sealant.", category: "General Maintenance", urgency: "Flexible", daysUntilNeeded: 180, due_date: "2026-04-15T16:00:00.000Z", estimated_duration_days: 7, budget_min: "8000.00", budget_max: "12000.00", status: "Open", bidCount: 5 },
  { id: "job-6", property_id: "prop-1", unit_id: "unit-2", title: "Interior Painting", description: "Paint all interior walls with premium quality paint. Two coats required.", category: "Painting", urgency: "This Month", daysUntilNeeded: 20, due_date: "2025-11-25T16:00:00.000Z", estimated_duration_days: 4, budget_min: "800.00", budget_max: "1200.00", status: "Open", bidCount: 6 },
  { id: "job-7", property_id: "prop-4", unit_id: null, title: "Foundation Crack Repair", description: "Repair foundation cracks and waterproof basement.", category: "Masonry", urgency: "This Year", daysUntilNeeded: 60, due_date: "2025-12-15T16:00:00.000Z", estimated_duration_days: 6, budget_min: "3000.00", budget_max: "5000.00", status: "Open", bidCount: 4 },
  { id: "job-8", property_id: "prop-5", unit_id: null, title: "Elevator Maintenance", description: "Comprehensive elevator inspection and maintenance service.", category: "General Maintenance", urgency: "Immediate", daysUntilNeeded: 7, due_date: "2025-11-10T16:00:00.000Z", estimated_duration_days: 2, budget_min: "2000.00", budget_max: "3500.00", status: "Open", bidCount: 9 },
  { id: "job-9", property_id: "prop-6", unit_id: null, title: "HVAC System Installation", description: "Install new commercial HVAC system for office spaces.", category: "HVAC", urgency: "This Month", daysUntilNeeded: 25, due_date: "2025-11-20T16:00:00.000Z", estimated_duration_days: 10, budget_min: "15000.00", budget_max: "25000.00", status: "Open", bidCount: 7 },
  { id: "job-10", property_id: "prop-7", unit_id: null, title: "Plumbing System Upgrade", description: "Replace old galvanized pipes with modern PEX plumbing.", category: "Plumbing", urgency: "This Year", daysUntilNeeded: 90, due_date: "2026-01-15T16:00:00.000Z", estimated_duration_days: 8, budget_min: "6000.00", budget_max: "9000.00", status: "Open", bidCount: 2 },
  { id: "job-11", property_id: "prop-8", unit_id: null, title: "Flooring Replacement", description: "Replace worn carpet with luxury vinyl plank flooring.", category: "Flooring", urgency: "Next Year", daysUntilNeeded: 120, due_date: "2026-02-15T16:00:00.000Z", estimated_duration_days: 5, budget_min: "4000.00", budget_max: "7000.00", status: "Open", bidCount: 6 },
  { id: "job-12", property_id: "prop-9", unit_id: null, title: "Deck Restoration", description: "Sand, stain, and seal wooden deck. Replace damaged boards.", category: "Carpentry", urgency: "Flexible", daysUntilNeeded: 150, due_date: "2026-03-20T16:00:00.000Z", estimated_duration_days: 4, budget_min: "1800.00", budget_max: "3000.00", status: "Open", bidCount: 3 },
  { id: "job-13", property_id: "prop-10", unit_id: null, title: "Fire Alarm System Update", description: "Upgrade fire alarm system to meet new safety codes.", category: "Electrical", urgency: "Immediate", daysUntilNeeded: 10, due_date: "2025-11-05T16:00:00.000Z", estimated_duration_days: 3, budget_min: "5000.00", budget_max: "8000.00", status: "Open", bidCount: 11 },
  { id: "job-14", property_id: "prop-11", unit_id: null, title: "Pool Equipment Repair", description: "Repair pool pump and filter system. Replace damaged components.", category: "General Maintenance", urgency: "This Month", daysUntilNeeded: 18, due_date: "2025-11-12T16:00:00.000Z", estimated_duration_days: 2, budget_min: "1200.00", budget_max: "2000.00", status: "Open", bidCount: 5 },
  { id: "job-15", property_id: "prop-12", unit_id: null, title: "Window Replacement", description: "Replace single-pane windows with energy-efficient double-pane.", category: "General Maintenance", urgency: "This Year", daysUntilNeeded: 70, due_date: "2025-12-25T16:00:00.000Z", estimated_duration_days: 6, budget_min: "7000.00", budget_max: "10000.00", status: "Open", bidCount: 8 },
  { id: "job-16", property_id: "prop-13", unit_id: null, title: "Exterior Painting", description: "Paint entire building exterior. Pressure wash and prime first.", category: "Painting", urgency: "Next Year", daysUntilNeeded: 140, due_date: "2026-03-05T16:00:00.000Z", estimated_duration_days: 12, budget_min: "12000.00", budget_max: "18000.00", status: "Open", bidCount: 4 },
  { id: "job-17", property_id: "prop-14", unit_id: null, title: "Driveway Paving", description: "Pave gravel driveway with asphalt. Include proper drainage.", category: "General Maintenance", urgency: "Flexible", daysUntilNeeded: 200, due_date: "2026-05-01T16:00:00.000Z", estimated_duration_days: 5, budget_min: "9000.00", budget_max: "14000.00", status: "Open", bidCount: 2 },
  { id: "job-18", property_id: "prop-15", unit_id: null, title: "Security System Installation", description: "Install comprehensive security camera and access control system.", category: "Electrical", urgency: "This Month", daysUntilNeeded: 22, due_date: "2025-11-18T16:00:00.000Z", estimated_duration_days: 4, budget_min: "8000.00", budget_max: "12000.00", status: "Open", bidCount: 10 },
  { id: "job-19", property_id: "prop-16", unit_id: null, title: "Siding Repair", description: "Repair damaged vinyl siding and replace missing panels.", category: "General Maintenance", urgency: "This Year", daysUntilNeeded: 80, due_date: "2026-01-05T16:00:00.000Z", estimated_duration_days: 3, budget_min: "2500.00", budget_max: "4000.00", status: "Open", bidCount: 6 },
  { id: "job-20", property_id: "prop-3", unit_id: null, title: "Landscape Renovation", description: "Complete landscape overhaul with new plants and irrigation.", category: "General Maintenance", urgency: "Next Year", daysUntilNeeded: 160, due_date: "2026-03-25T16:00:00.000Z", estimated_duration_days: 8, budget_min: "6000.00", budget_max: "10000.00", status: "Open", bidCount: 3 }
];

// Map Controller Component for programmatic map control
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

// Create custom building icon
const createBuildingIcon = (jobCount) => {
  const color = jobCount > 0 ? '#E74C3C' : '#7F8C8D';
  
  return L.divIcon({
    className: 'custom-building-icon',
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        ${jobCount > 0 ? `
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
        ` : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });
};

function HomePageEntrepreneur() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [userProfile, setUserProfile] = useState()
  const [isLoading, setIsLoading] = useState(true)
  
  // data variables
  // const [properties, setProperties] = useState([])
  // const [units, setUnits] = useState([])
  // const [jobs, setJobs] = useState([])

  // Filter states
  const [filters, setFilters] = useState({
    regions: [],
    cities: [],
    neighborhoods: [],
    workTypes: [],
    urgency: [],
    daysUntilNeeded: '',
    duration: '',
    budgetMin: '',
    budgetMax: '',
    bidCount: '',
    propertyTypes: [],
    propertySizes: []
  });

  // Get open jobs count for each property
  const getPropertyOpenJobsCount = (propertyId) => {
    return jobs.filter(job => job.property_id === propertyId && job.status === 'Open').length;
  };

  // Get units for a property
  const getPropertyUnits = (propertyId) => {
    return units.filter(unit => unit.property_id === propertyId);
  };

  // Get open jobs for a property
  const getPropertyOpenJobs = (propertyId) => {
    return jobs.filter(job => job.property_id === propertyId && job.status === 'Open');
  };

  // Filter properties and jobs based on all filters
  const filteredProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(property.region);
      const matchesCity = filters.cities.length === 0 || filters.cities.includes(property.city);
      const matchesNeighborhood = filters.neighborhoods.length === 0 || filters.neighborhoods.includes(property.neighborhood);
      
      const matchesPropertyType = filters.propertyTypes.length === 0 || filters.propertyTypes.includes(property.propertyType);
      const matchesPropertySize = filters.propertySizes.length === 0 || filters.propertySizes.includes(property.propertySize);
      
      const propertyJobs = jobs.filter(job => job.property_id === property.id && job.status === 'Open');
      
      if (propertyJobs.length === 0) return false;
      
      const matchesWorkType = filters.workTypes.length === 0 || 
        propertyJobs.some(job => filters.workTypes.includes(job.category));
      
      const matchesUrgency = filters.urgency.length === 0 || 
        propertyJobs.some(job => filters.urgency.includes(job.urgency));
      
      const matchesDays = !filters.daysUntilNeeded || 
        propertyJobs.some(job => job.daysUntilNeeded <= parseInt(filters.daysUntilNeeded));
      
      const matchesDuration = !filters.duration || 
        propertyJobs.some(job => job.estimated_duration_days <= parseInt(filters.duration));
      
      const matchesBudget = (!filters.budgetMin && !filters.budgetMax) ||
        propertyJobs.some(job => {
          const min = filters.budgetMin ? parseFloat(job.budget_min) >= parseFloat(filters.budgetMin) : true;
          const max = filters.budgetMax ? parseFloat(job.budget_max) <= parseFloat(filters.budgetMax) : true;
          return min && max;
        });
      
      const matchesBidCount = !filters.bidCount || 
        propertyJobs.some(job => job.bidCount <= parseInt(filters.bidCount));
      
      return matchesSearch && matchesRegion && matchesCity && matchesNeighborhood && 
             matchesPropertyType && matchesPropertySize && matchesWorkType && 
             matchesUrgency && matchesDays && matchesDuration && matchesBudget && matchesBidCount;
    });

    return filtered;
  }, [searchTerm, filters]);

  // Get search results for dropdown (only based on search term, not other filters)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return properties.filter(property => {
      const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && getPropertyOpenJobsCount(property.id) > 0;
    }).slice(0, 5); // Limit to 5 results
  }, [searchTerm]);

  const getUrgencyColor = (urgency) => {
    if (urgency === 'Immediate') return 'var(--color-status-urgent)';
    if (urgency === 'This Month') return 'var(--color-status-warning)';
    if (urgency === 'This Year') return 'var(--color-status-warning)';
    return 'var(--color-status-info)';
  };

  const handleBidClick = (job) => {
    setSelectedJob(job);
    setBidAmount('');
    setBidMessage('');
    setBidModalOpen(true);
  };

  const handleSubmitBid = () => {
    if (!bidAmount || !bidMessage) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Submitting bid:', {
      jobId: selectedJob.id,
      amount: bidAmount,
      message: bidMessage
    });
    
    alert('Bid submitted successfully!');
    setBidModalOpen(false);
  };

  const handleSearchFocus = () => {
    setSearchExpanded(true);
    setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow click on results
    setTimeout(() => {
      if (!searchTerm) {
        setSearchExpanded(false);
      }
      setShowSearchResults(false);
    }, 200);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
  };

  const handleResultClick = (property) => {
    setSelectedProperty(property);
    setMapCenter([property.latitude, property.longitude]);
    setMapZoom(17);
    setSearchTerm('');
    setShowSearchResults(false);
    setSearchExpanded(false);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      if (Array.isArray(prev[filterType])) {
        const newArray = prev[filterType].includes(value)
          ? prev[filterType].filter(item => item !== value)
          : [...prev[filterType], value];
        return { ...prev, [filterType]: newArray };
      } else {
        return { ...prev, [filterType]: value };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      regions: [],
      cities: [],
      neighborhoods: [],
      workTypes: [],
      urgency: [],
      daysUntilNeeded: '',
      duration: '',
      budgetMin: '',
      budgetMax: '',
      bidCount: '',
      propertyTypes: [],
      propertySizes: []
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        count += filters[key].length;
      } else if (filters[key]) {
        count += 1;
      }
    });
    return count;
  }, [filters]);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const profileString = localStorage.getItem('userProfile');
    console.log(profileString)

    if (profileString) {
      const user = JSON.parse(profileString);
      setUserProfile(user)
    } else {
      console.log("User profile not found.");
    }
    setIsLoading(false)
  }, [])

  return (
    <div className="homepage-container">
      <Nav />
      
      <main className="main-content">
        {
          isLoading?
          <div className="loading">
            <h1>LOADING</h1>
          </div> :
          userProfile.subscription && userProfile.subscription.plan_type == 'none' &&
          <SubscriptionModal />
        }
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Available Construction Jobs</h1>
            <p className="page-subtitle">Find and bid on construction projects in your area</p>
          </div>
          
          <div className="header-actions">
            <div className={`search-box-entrep ${searchExpanded ? 'expanded' : ''}`} ref={searchContainerRef}>
              <button 
                className="search-trigger-btn entrep"
                onClick={handleSearchFocus}
                aria-label="Search"
              >
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
                    <div
                      key={property.id}
                      className="search-result-item"
                      onClick={() => handleResultClick(property)}
                    >
                      <div className="search-result-icon">
                        <Building2 size={20} />
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-name">{property.name}</div>
                        <div className="search-result-address">{property.address}</div>
                      </div>
                      <div className="search-result-badge">
                        {getPropertyOpenJobsCount(property.id)} jobs
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className={`filters-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setFiltersPanelOpen(!filtersPanelOpen)}
              aria-label="Filters"
            >
              <Filter size={20} />
              <span className="filter-btn-text">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count">{activeFiltersCount}</span>
              )}
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
                      {['Ilocos Region'].map(item => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.regions.includes(item)}
                            onChange={() => handleFilterChange('regions', item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                      {['Dagupan City'].map(item => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.cities.includes(item)}
                            onChange={() => handleFilterChange('cities', item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                      {['Downtown', 'Beachfront', 'Business District', 'Suburban', 'Riverside'].map(item => (
                        <label key={item} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.neighborhoods.includes(item)}
                            onChange={() => handleFilterChange('neighborhoods', item)}
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
                      {['Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Roofing', 'HVAC', 'Painting', 'Flooring', 'General Maintenance'].map(type => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.workTypes.includes(type)}
                            onChange={() => handleFilterChange('workTypes', type)}
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
                      {['Immediate', 'This Month', 'This Year', 'Next Year', 'Flexible'].map(urgency => (
                        <label key={urgency} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.urgency.includes(urgency)}
                            onChange={() => handleFilterChange('urgency', urgency)}
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
                          onChange={(e) => handleFilterChange('daysUntilNeeded', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Work Duration (max days)</label>
                        <input
                          type="number"
                          placeholder="e.g., 7"
                          value={filters.duration}
                          onChange={(e) => handleFilterChange('duration', e.target.value)}
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
                          onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Maximum Budget ($)</label>
                        <input
                          type="number"
                          placeholder="e.g., 10000"
                          value={filters.budgetMax}
                          onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
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
                        {['Residential', 'Commercial', 'Mixed-Use'].map(item => (
                          <label key={item} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filters.propertyTypes.includes(item)}
                              onChange={() => handleFilterChange('propertyTypes', item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="filter-section">
                      <p className="filter-subsection-title">Property Size</p>
                      <div className="filter-options">
                        {['Small', 'Medium', 'Large'].map(item => (
                          <label key={item} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filters.propertySizes.includes(item)}
                              onChange={() => handleFilterChange('propertySizes', item)}
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
                          onChange={(e) => handleFilterChange('bidCount', e.target.value)}
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
                  {activeFiltersCount > 0 && (
                    <span className="footer-badge">({activeFiltersCount})</span>
                  )}
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
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController center={mapCenter} zoom={mapZoom} />
              
              {filteredProperties.map((property) => {
                const jobCount = getPropertyOpenJobsCount(property.id);
                return (
                  <Marker
                    key={property.id}
                    position={[property.latitude, property.longitude]}
                    icon={createBuildingIcon(jobCount)}
                    eventHandlers={{
                      click: () => setSelectedProperty(property)
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h3>{property.name}</h3>
                        <p>{property.address}</p>
                        <div className="popup-stats">
                          <span className="popup-stat">
                            {getPropertyUnits(property.id).length} Units
                          </span>
                          <span className="popup-stat highlight">
                            {jobCount} Open Jobs
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
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
                        <span className="meta-badge">{selectedProperty.propertySize}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Units</span>
                    <span className="stat-value">{getPropertyUnits(selectedProperty.id).length}</span>
                  </div>
                  <div className="stat-card highlight">
                    <span className="stat-label">Open Jobs</span>
                    <span className="stat-value">{getPropertyOpenJobsCount(selectedProperty.id)}</span>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="section-tabs">
                  <div className="section-header">
                    <h3>Available Jobs for Bidding</h3>
                    <span className="job-count-badge">
                      {getPropertyOpenJobs(selectedProperty.id).length} Jobs
                    </span>
                  </div>
                  <div className="jobs-list">
                    {getPropertyOpenJobs(selectedProperty.id).length > 0 ? (
                      getPropertyOpenJobs(selectedProperty.id).map(job => {
                        const unit = units.find(u => u.id === job.unit_id);
                        return (
                          <div key={job.id} className="job-card">
                            <div className="job-card-header">
                              <div className="job-title-section">
                                <h4 className="job-title">{job.title}</h4>
                                <div className="job-meta-row">
                                  <span className="job-category">{job.category}</span>
                                  {unit && (
                                    <span className="unit-badge">Unit {unit.unit_number}</span>
                                  )}
                                  <span className="bid-count-badge">{job.bidCount} bids</span>
                                </div>
                              </div>
                              <span 
                                className="urgency-badge" 
                                style={{ backgroundColor: getUrgencyColor(job.urgency) }}
                              >
                                {job.urgency}
                              </span>
                            </div>
                            
                            <p className="job-description">{job.description}</p>
                            
                            <div className="job-details-grid">
                              <div className="detail-item">
                                <DollarSign size={16} />
                                <div>
                                  <span className="detail-label">Budget Range</span>
                                  <span className="detail-value">${parseFloat(job.budget_min).toLocaleString()} - ${parseFloat(job.budget_max).toLocaleString()}</span>
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
                            
                            <button 
                              className="bid-button"
                              onClick={() => handleBidClick(job)}
                            >
                              <Hammer size={18} />
                              Submit Your Bid
                            </button>
                          </div>
                        );
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
                  Budget Range: ${parseFloat(selectedJob.budget_min).toLocaleString()} - ${parseFloat(selectedJob.budget_max).toLocaleString()}
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
  );
}

export default HomePageEntrepreneur;