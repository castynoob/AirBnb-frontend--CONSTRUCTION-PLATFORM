import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Award,
  FileText,
  Send,
  Search,
  X,
  Phone,
  Mail,
  Globe,
  Package,
  Upload,
  Filter,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Shield,
  MessageSquare,
  Building2,
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import Nav from "../../components/Nav";
import SupplierProfileModal from "../../components/modal/SupplierProfileModal";
import ViewMyRequestsModal from "../../components/modal/ViewMyRequestsModal";
import '../../styles/supplier/supplierlist.css';
import '../../styles/manager/submissions.css'; // For modal styles

// Custom Select Component
function CustomSelect({ value, onChange, options, icon: Icon, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = typeof options[0] === 'string'
    ? value
    : options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className="sl-custom-select" ref={selectRef}>
      <div className="sl-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        {Icon && <Icon size={16} />}
        <span className="sl-select-value">{displayValue}</span>
        <ChevronDown size={14} className={`sl-select-arrow ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <div className="sl-select-dropdown">
          {options.map((option, index) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <div
                key={index}
                className={`sl-select-option ${value === optValue ? 'selected' : ''}`}
                onClick={() => {
                  onChange(optValue);
                  setIsOpen(false);
                }}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedMaterial, setSelectedMaterial] = useState('All Materials');
  const [selectedYearsFilter, setSelectedYearsFilter] = useState('All');
  const [certificationFilter, setCertificationFilter] = useState('All');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [requestFile, setRequestFile] = useState(null);
  const [requestType, setRequestType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showMyRequestsModal, setShowMyRequestsModal] = useState(false);

  // Supplier Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const areaOptions = [
    'All Areas',
    'Metro Manila',
    'Quezon City',
    'Manila',
    'Caloocan',
    'Pasig',
    'Makati',
    'Taguig',
    'Paranaque',
    'Las Pinas',
    'Muntinlupa',
    'Mandaluyong',
    'Marikina',
    'Pasay',
    'Valenzuela',
    'Malabon',
    'Navotas',
    'San Juan',
    'Cavite',
    'Laguna',
    'Batangas',
    'Rizal',
    'Bulacan',
    'Pampanga'
  ];

  const materialOptions = [
    'All Materials',
    'Cement',
    'Steel & Rebar',
    'Sand & Gravel',
    'Concrete',
    'Lumber & Wood',
    'Bricks & Blocks',
    'Roofing Materials',
    'Electrical Supplies',
    'Plumbing Supplies',
    'Paint & Coatings',
    'Tiles & Flooring',
    'Hardware & Tools'
  ];

  const yearsOptions = [
    { label: 'All', value: 'All' },
    { label: 'New (0-2 years)', value: '0-2' },
    { label: 'Established (3-5 years)', value: '3-5' },
    { label: 'Experienced (6-10 years)', value: '6-10' },
    { label: 'Veteran (10+ years)', value: '10+' }
  ];

  const certificationOptions = [
    { label: 'All', value: 'All' },
    { label: 'Certified Only', value: 'certified' },
    { label: 'Non-Certified', value: 'non-certified' }
  ];

  useEffect(() => {
    fetchSuppliers();
    fetchMyRequests();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedArea, selectedMaterial, selectedYearsFilter, certificationFilter, suppliers]);

  const fetchSuppliers = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (userProfile) {
      const user = JSON.parse(userProfile);

      try {
        const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setSuppliers(data.suppliers || []);
        setFilteredSuppliers(data.suppliers || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchMyRequests = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (userProfile) {
      const user = JSON.parse(userProfile);

      try {
        const response = await fetch(`${API_BASE_URL}/api/my-supplier-requests`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMyRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching my requests:', error);
      }
    }
  };

  // Check if entrepreneur can chat with a specific supplier
  const canChatWithSupplier = (supplierId) => {
    return myRequests.some(
      request => request.supplier_id === supplierId &&
                 (request.status === 'in-progress' || request.status === 'completed')
    );
  };

  // Get the supplier request data (to get supplier_user_id)
  const getSupplierRequest = (supplierId) => {
    return myRequests.find(
      request => request.supplier_id === supplierId &&
                 (request.status === 'in-progress' || request.status === 'completed')
    );
  };

  const handleChatWithSupplier = (supplier) => {
    // Set target receiver info in localStorage for the messaging page
    localStorage.setItem('targetReceiverId', supplier.user_id);
    localStorage.setItem('targetReceiverName', supplier.company_name || 'Supplier');
    // Navigate to messages
    navigate('/messages/entrepreneur');
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.business_license?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
      );
    }

    if (selectedArea !== 'All Areas') {
      filtered = filtered.filter(supplier =>
        supplier.delivery_areas && supplier.delivery_areas.some(area =>
          area.toLowerCase().includes(selectedArea.toLowerCase())
        )
      );
    }

    if (selectedMaterial !== 'All Materials') {
      filtered = filtered.filter(supplier =>
        supplier.materials_supplied &&
        supplier.materials_supplied.some(material =>
          material.toLowerCase().includes(selectedMaterial.toLowerCase())
        )
      );
    }

    if (selectedYearsFilter !== 'All') {
      filtered = filtered.filter(supplier => {
        const years = supplier.years_in_business || 0;
        switch (selectedYearsFilter) {
          case '0-2':
            return years >= 0 && years <= 2;
          case '3-5':
            return years >= 3 && years <= 5;
          case '6-10':
            return years >= 6 && years <= 10;
          case '10+':
            return years > 10;
          default:
            return true;
        }
      });
    }

    if (certificationFilter !== 'All') {
      filtered = filtered.filter(supplier => {
        const hasCertification = supplier.business_license && supplier.business_license.trim() !== '';
        return certificationFilter === 'certified' ? hasCertification : !hasCertification;
      });
    }

    setFilteredSuppliers(filtered);
  };

  const handleDownloadCatalog = (catalogUrl) => {
    if (catalogUrl) {
      window.open(catalogUrl, '_blank');
    }
  };

  const openRequestModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedSupplier(null);
    setRequestDetails('');
    setRequestFile(null);
    setRequestType('text');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setRequestFile(file);
    }
  };

  const handleSubmitRequest = async () => {
    if (requestType === 'text' && !requestDetails.trim()) {
      toast.error('Please enter your material request details');
      return;
    }
    if (requestType === 'file' && !requestFile) {
      toast.error('Please upload a PDF file with your request details');
      return;
    }

    setIsSubmitting(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    try {
      if (userProfile) {
        const user = JSON.parse(userProfile);

        const formData = new FormData();
        formData.append('supplier_id', selectedSupplier.id);

        if (requestType === 'text') {
          formData.append('request_details', requestDetails);
        } else {
          formData.append('request_file', requestFile);
        }

        const response = await fetch(`${API_BASE_URL}/api/supplier-requests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Failed to submit request');
        }

        toast.success('Material request submitted successfully! The supplier will review and create an invoice for you.');
        closeRequestModal();
        // Refresh requests list
        fetchMyRequests();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(`Failed to submit request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  // Handle viewing supplier profile modal
  const handleViewSupplierProfile = async (supplier) => {
    const userId = supplier.user_id;
    if (!userId || isLoadingProfile) return;

    setIsLoadingProfile(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const userProfile = localStorage.getItem('userProfile');
      if (!userProfile) return;

      const user = JSON.parse(userProfile);

      const response = await fetch(
        `${API_BASE_URL}/api/users/supplier/user/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch supplier profile');
      }

      const data = await response.json();
      // Use the profile data directly - it now includes all user fields from the backend
      setSelectedProfile(data.profile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching supplier profile:', error);
      toast.error('Failed to load supplier profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const hasActiveFilters = selectedArea !== 'All Areas' || selectedMaterial !== 'All Materials' ||
    selectedYearsFilter !== 'All' || certificationFilter !== 'All';

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Skeleton Loading Component
  const SupplierListSkeleton = () => (
    <div className="supplier-list-container">
      <Nav />
      <div className="supplier-list-content">
        {/* Header Skeleton */}
        <header className="sl-page-header">
          <div className="sl-header-left">
            <div className="sl-header-title-group">
              <div className="sl-skeleton" style={{ width: '220px', height: '32px' }}></div>
              <div className="sl-skeleton" style={{ width: '100px', height: '24px', borderRadius: '20px' }}></div>
            </div>
          </div>
          <div className="sl-header-actions">
            <div className="sl-skeleton" style={{ width: '140px', height: '40px' }}></div>
            <div className="sl-skeleton" style={{ width: '100px', height: '40px' }}></div>
          </div>
        </header>

        {/* Controls Bar Skeleton */}
        <div className="sl-controls-bar">
          <div className="sl-skeleton" style={{ flex: 1, height: '44px' }}></div>
          <div className="sl-skeleton" style={{ width: '100px', height: '44px' }}></div>
        </div>

        {/* Suppliers Grid Skeleton */}
        <div className="sl-suppliers-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="sl-supplier-card sl-skeleton-card">
              {/* Card Header */}
              <div className="sl-card-header">
                <div className="sl-skeleton" style={{ width: '52px', height: '52px', borderRadius: '12px' }}></div>
                <div className="sl-header-info">
                  <div className="sl-skeleton" style={{ width: '70%', height: '20px', marginBottom: '8px' }}></div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="sl-skeleton" style={{ width: '60px', height: '20px' }}></div>
                    <div className="sl-skeleton" style={{ width: '50px', height: '20px' }}></div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="sl-card-body">
                <div className="sl-skeleton" style={{ width: '100%', height: '16px' }}></div>
                <div className="sl-skeleton" style={{ width: '80%', height: '16px' }}></div>
                <div className="sl-skeleton" style={{ width: '60%', height: '16px' }}></div>
              </div>

              {/* Card Actions */}
              <div className="sl-card-actions">
                <div className="sl-skeleton" style={{ flex: 1, height: '36px' }}></div>
                <div className="sl-skeleton" style={{ width: '36px', height: '36px' }}></div>
                <div className="sl-skeleton" style={{ flex: 1, height: '36px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <SupplierListSkeleton />;
  }

  return (
    <div className="supplier-list-container">
      <Nav />
      <div className="supplier-list-content">
        {/* Page Header */}
        <header className="sl-page-header">
          <div className="sl-header-left">
            <div className="sl-header-title-group">
              <h1>Material Suppliers</h1>
              <span className="sl-supplier-count">{filteredSuppliers.length} suppliers</span>
            </div>
          </div>
          <div className="sl-header-actions">
            <button
              className="sl-header-btn sl-header-btn-primary"
              onClick={() => setShowMyRequestsModal(true)}
            >
              <Send size={16} />
              <span>My Requests {myRequests.length > 0 && `(${myRequests.length})`}</span>
            </button>
            <div className="sl-header-btn sl-header-btn-secondary">
              <Package size={16} />
              <span>{suppliers.length} Total</span>
            </div>
          </div>
        </header>

        {/* Controls Bar */}
        <div className="sl-controls-bar">
          <div className="sl-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by company name, license, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="sl-clear-search" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`sl-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="sl-filters-panel">
            <div className="sl-filters-grid">
              <div className="sl-filter-item">
                <label>Location</label>
                <CustomSelect
                  value={selectedArea}
                  onChange={setSelectedArea}
                  options={areaOptions}
                  icon={MapPin}
                  placeholder="Select area"
                />
              </div>

              <div className="sl-filter-item">
                <label>Material Type</label>
                <CustomSelect
                  value={selectedMaterial}
                  onChange={setSelectedMaterial}
                  options={materialOptions}
                  icon={Package}
                  placeholder="Select material"
                />
              </div>

              <div className="sl-filter-item">
                <label>Years in Business</label>
                <CustomSelect
                  value={selectedYearsFilter}
                  onChange={setSelectedYearsFilter}
                  options={yearsOptions}
                  icon={Briefcase}
                  placeholder="Select experience"
                />
              </div>

              <div className="sl-filter-item">
                <label>Certification</label>
                <CustomSelect
                  value={certificationFilter}
                  onChange={setCertificationFilter}
                  options={certificationOptions}
                  icon={Shield}
                  placeholder="Select certification"
                />
              </div>
            </div>

            <button
              className="sl-clear-filters"
              onClick={() => {
                setSelectedArea('All Areas');
                setSelectedMaterial('All Materials');
                setSelectedYearsFilter('All');
                setCertificationFilter('All');
              }}
            >
              <X size={16} />
              Clear All Filters
            </button>
          </div>
        )}

        {/* Suppliers Grid */}
        {filteredSuppliers.length === 0 ? (
          <div className="sl-empty-state">
            <Package size={48} />
            <h3>No suppliers found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="sl-suppliers-grid">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="sl-supplier-card" onClick={() => handleViewSupplierProfile(supplier)}>
                {/* Card Header with Avatar */}
                <div className="sl-card-header">
                  <div className="sl-supplier-avatar">
                    {getInitials(supplier.company_name)}
                  </div>
                  <div className="sl-header-info">
                    <h3 className="sl-company-name">{supplier.company_name}</h3>
                    <div className="sl-header-badges">
                      {supplier.business_license ? (
                        <span className="sl-cert-badge certified">
                          <Award size={10} />
                          Certified
                        </span>
                      ) : (
                        <span className="sl-cert-badge not-certified">
                          <Shield size={10} />
                          Not Certified
                        </span>
                      )}
                      <span className="sl-years-badge">
                        <Calendar size={10} />
                        {supplier.years_in_business || 0} yrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="sl-card-body">
                  <div className="sl-contact-info">
                    {supplier.phone && (
                      <div className="sl-contact-row">
                        <Phone size={14} />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="sl-contact-row">
                        <Mail size={14} />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Areas */}
                  {supplier.delivery_areas && supplier.delivery_areas.length > 0 && (
                    <div className="sl-delivery-section">
                      <div className="sl-section-label">
                        <Truck size={12} />
                        Delivery Areas
                      </div>
                      <div className="sl-area-tags">
                        {supplier.delivery_areas.slice(0, 3).map((area, idx) => (
                          <span key={idx} className="sl-area-tag">{area}</span>
                        ))}
                        {supplier.delivery_areas.length > 3 && (
                          <span className="sl-area-tag more">+{supplier.delivery_areas.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="sl-card-actions">
                  <button
                    className="sl-action-btn sl-details-btn"
                    onClick={(e) => { e.stopPropagation(); handleViewSupplierProfile(supplier); }}
                  >
                    Details
                    <ChevronRight size={14} />
                  </button>

                  {supplier.catalog_pdf_url && (
                    <button
                      className="sl-action-btn sl-catalog-btn"
                      onClick={(e) => { e.stopPropagation(); handleDownloadCatalog(supplier.catalog_pdf_url); }}
                      title="View Catalog"
                    >
                      <FileText size={14} />
                    </button>
                  )}

                  {canChatWithSupplier(supplier.id) && (
                    <button
                      className="sl-action-btn sl-chat-btn"
                      onClick={(e) => { e.stopPropagation(); handleChatWithSupplier(supplier); }}
                      title="Chat with Supplier"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}

                  <button
                    className="sl-action-btn sl-request-btn"
                    onClick={(e) => { e.stopPropagation(); openRequestModal(supplier); }}
                  >
                    <Package size={14} />
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplier Details Modal */}
      {showDetailsModal && selectedSupplier && (
        <div className="bid-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h2>{selectedSupplier.company_name}</h2>
              <button className="bid-modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              {/* Company Information */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <Package size={20} />
                  Company Information
                </h3>
                <div className="bid-info-grid">
                  <div className="bid-info-item">
                    <label>Years in Business</label>
                    <p>{selectedSupplier.years_in_business || 0} years</p>
                  </div>
                  <div className="bid-info-item">
                    <label>Certification</label>
                    <p>{selectedSupplier.business_license ? 'Certified' : 'Not Certified'}</p>
                  </div>
                  {selectedSupplier.business_license && (
                    <div className="bid-info-item">
                      <label>License Number</label>
                      <p>{selectedSupplier.business_license}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Contact Information */}
              <section className="bid-modal-section bid-modal-highlight">
                <h3 className="bid-section-title">
                  <Phone size={20} />
                  Contact Information
                </h3>
                <div className="bid-info-grid">
                  {selectedSupplier.phone && (
                    <div className="bid-info-item">
                      <label><Phone size={14} /> Phone</label>
                      <p>{selectedSupplier.phone}</p>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div className="bid-info-item">
                      <label><Mail size={14} /> Email</label>
                      <p>{selectedSupplier.email}</p>
                    </div>
                  )}
                  {selectedSupplier.website && (
                    <div className="bid-info-item">
                      <label><Globe size={14} /> Website</label>
                      <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" style={{ color: '#00a5a9' }}>
                        {selectedSupplier.website}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Delivery Areas */}
              {selectedSupplier.delivery_areas && selectedSupplier.delivery_areas.length > 0 && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <MapPin size={20} />
                    Delivery Areas
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedSupplier.delivery_areas.map((area, index) => (
                      <span key={index} style={{
                        background: '#f1f5f9',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        color: '#475569'
                      }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Materials Supplied */}
              {selectedSupplier.materials_supplied && selectedSupplier.materials_supplied.length > 0 && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">
                    <Package size={20} />
                    Materials Supplied
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedSupplier.materials_supplied.map((material, index) => (
                      <span key={index} style={{
                        background: '#ecfdf5',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        color: '#059669'
                      }}>
                        {material}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="bid-modal-footer">
              {selectedSupplier.catalog_pdf_url && (
                <button
                  className="bid-btn-decline"
                  onClick={() => handleDownloadCatalog(selectedSupplier.catalog_pdf_url)}
                >
                  <FileText size={16} />
                  View Catalog
                </button>
              )}
              {canChatWithSupplier(selectedSupplier.id) && (
                <button
                  className="bid-btn-decline"
                  onClick={() => {
                    handleChatWithSupplier(selectedSupplier);
                    setShowDetailsModal(false);
                  }}
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none' }}
                >
                  <MessageSquare size={16} />
                  Chat with Supplier
                </button>
              )}
              <button
                className="bid-btn-accept"
                onClick={() => {
                  setShowDetailsModal(false);
                  openRequestModal(selectedSupplier);
                }}
              >
                <Package size={16} />
                Request Materials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Materials Modal */}
      {isRequestModalOpen && selectedSupplier && (
        <div className="bid-modal-overlay" onClick={closeRequestModal}>
          <div className="bid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h2>Request Materials</h2>
              <button className="bid-modal-close" onClick={closeRequestModal}>
                <X size={24} />
              </button>
            </div>

            <div className="bid-modal-body">
              <section className="bid-modal-section bid-modal-highlight">
                <h3 className="bid-section-title">
                  <Package size={20} />
                  {selectedSupplier.company_name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Please review the supplier's catalog (if available) to identify specific materials and quantities needed.
                  The supplier will create a custom invoice based on your request.
                </p>
              </section>

              {/* Request Type Selection */}
              <section className="bid-modal-section">
                <h3 className="bid-section-title">
                  <FileText size={20} />
                  Submit Your Request As
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className={requestType === 'text' ? 'bid-btn-accept' : 'bid-btn-decline'}
                    onClick={() => setRequestType('text')}
                    style={{ flex: 1 }}
                  >
                    <FileText size={16} />
                    Text Description
                  </button>
                  <button
                    type="button"
                    className={requestType === 'file' ? 'bid-btn-accept' : 'bid-btn-decline'}
                    onClick={() => setRequestType('file')}
                    style={{ flex: 1 }}
                  >
                    <Upload size={16} />
                    PDF Document
                  </button>
                </div>
              </section>

              {/* Text Input */}
              {requestType === 'text' && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">Material Request Details</h3>
                  <textarea
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    placeholder="Please specify the materials you need, quantities, and any special requirements...&#10;&#10;Example:&#10;- Cement: 50 bags&#10;- Steel bars: 100 pieces (10mm)&#10;- Sand: 5 cubic meters&#10;- Delivery needed by: [Date]"
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Be as specific as possible to receive an accurate quote
                  </p>
                </section>
              )}

              {/* File Upload */}
              {requestType === 'file' && (
                <section className="bid-modal-section">
                  <h3 className="bid-section-title">Upload Request Document (PDF)</h3>
                  <div style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginTop: '0.75rem'
                  }}>
                    {!requestFile ? (
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <Upload size={32} color="#94a3b8" />
                        <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                          <span style={{ color: '#00a5a9', fontWeight: 500 }}>Click to upload</span> or drag and drop
                        </p>
                        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                          PDF file up to 10MB
                        </p>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={24} color="#00a5a9" />
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{requestFile.name}</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>
                              {(requestFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRequestFile(null)}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={16} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="bid-modal-footer">
              <button
                className="bid-btn-decline"
                onClick={closeRequestModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="bid-btn-accept"
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send size={16} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Profile Modal */}
      <SupplierProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
        onRequestMaterials={() => {
          // Close profile modal and open request modal
          setShowProfileModal(false);
          // Find the supplier from the list that matches the profile
          const supplier = suppliers.find(s => s.id === selectedProfile?.id);
          if (supplier) {
            openRequestModal(supplier);
          }
        }}
      />

      {/* View My Requests Modal */}
      <ViewMyRequestsModal
        isOpen={showMyRequestsModal}
        onClose={() => setShowMyRequestsModal(false)}
        requests={myRequests}
        onChatWithSupplier={handleChatWithSupplier}
        onRefresh={fetchMyRequests}
      />
    </div>
  );
}

export default SupplierList;
