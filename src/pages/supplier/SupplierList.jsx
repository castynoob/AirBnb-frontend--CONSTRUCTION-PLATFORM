import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Award,
  FileText,
  Download,
  Send,
  Search,
  X,
  Phone,
  Mail,
  Globe,
  Package,
  Upload,
  Check,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
  Briefcase,
  Shield
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/supplier/supplierlist.css';

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
        {Icon && <Icon size={18} />}
        <span className="sl-select-value">{displayValue}</span>
        <ChevronDown size={16} className={`sl-select-arrow ${isOpen ? 'open' : ''}`} />
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
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedMaterial, setSelectedMaterial] = useState('All Materials');
  const [selectedYearsFilter, setSelectedYearsFilter] = useState('All');
  const [certificationFilter, setCertificationFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [requestFile, setRequestFile] = useState(null);
  const [requestType, setRequestType] = useState('text'); // 'text' or 'file'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const filterSuppliers = () => {
    let filtered = suppliers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.business_license?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
      );
    }

    // Filter by area
    if (selectedArea !== 'All Areas') {
      filtered = filtered.filter(supplier =>
        supplier.delivery_areas && supplier.delivery_areas.some(area =>
          area.toLowerCase().includes(selectedArea.toLowerCase())
        )
      );
    }

    // Filter by material type
    if (selectedMaterial !== 'All Materials') {
      filtered = filtered.filter(supplier =>
        supplier.materials_supplied &&
        supplier.materials_supplied.some(material =>
          material.toLowerCase().includes(selectedMaterial.toLowerCase())
        )
      );
    }

    // Filter by years in business
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

    // Filter by certification
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
        alert('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }
      setRequestFile(file);
    }
  };

  const handleSubmitRequest = async () => {
    // Validate based on request type
    if (requestType === 'text' && !requestDetails.trim()) {
      alert('Please enter your material request details');
      return;
    }
    if (requestType === 'file' && !requestFile) {
      alert('Please upload a PDF file with your request details');
      return;
    }

    setIsSubmitting(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    try {
      if (userProfile) {
        const user = JSON.parse(userProfile);

        // Create FormData to handle both text and file
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

        alert('Material request submitted successfully! The supplier will review and create an invoice for you.');
        closeRequestModal();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(`Failed to submit request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sl-app-layout">
        <Nav />
        <div className="sl-loading">
          <div className="sl-loader"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-app-layout">
      {!isRequestModalOpen && <Nav />}
      <div className="sl-container">
        <div className="sl-content-wrapper">
          {/* Header */}
          <div className="sl-header">
            <div className="sl-header-content">
              <h1 className="sl-title">Material Suppliers</h1>
              <p className="sl-subtitle">Browse suppliers, view catalogs, and request materials for your projects</p>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="sl-controls-section">
            <div className="sl-search-box">
              <Search size={20} className="sl-search-icon" />
              <input
                type="text"
                placeholder="Search by company name, license, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sl-search-input"
              />
            </div>

            <div className="sl-controls-right">
              <button
                className="sl-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                Filters
                {(selectedArea !== 'All Areas' || selectedMaterial !== 'All Materials' ||
                  selectedYearsFilter !== 'All' || certificationFilter !== 'All') && (
                  <span className="sl-filter-badge">Active</span>
                )}
              </button>

              <div className="sl-view-toggle">
                <button
                  className={`sl-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  className={`sl-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="sl-filter-panel">
              <div className="sl-filter-grid">
                <div className="sl-filter-item">
                  <label className="sl-filter-label">Location</label>
                  <CustomSelect
                    value={selectedArea}
                    onChange={setSelectedArea}
                    options={areaOptions}
                    icon={MapPin}
                    placeholder="Select area"
                  />
                </div>

                <div className="sl-filter-item">
                  <label className="sl-filter-label">Material Type</label>
                  <CustomSelect
                    value={selectedMaterial}
                    onChange={setSelectedMaterial}
                    options={materialOptions}
                    icon={Package}
                    placeholder="Select material"
                  />
                </div>

                <div className="sl-filter-item">
                  <label className="sl-filter-label">Years in Business</label>
                  <CustomSelect
                    value={selectedYearsFilter}
                    onChange={setSelectedYearsFilter}
                    options={yearsOptions}
                    icon={Briefcase}
                    placeholder="Select experience"
                  />
                </div>

                <div className="sl-filter-item">
                  <label className="sl-filter-label">Certification</label>
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
                Clear All Filters
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="sl-results-bar">
            <span className="sl-results-count">
              {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'} found
            </span>
          </div>

          {/* Suppliers Display */}
          {filteredSuppliers.length > 0 ? (
            <div className={`sl-suppliers-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
              {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className={`sl-supplier-card ${viewMode}`}>
                  <div className="sl-card-header">
                    <div className="sl-company-info">
                      <h3 className="sl-company-name">{supplier.company_name}</h3>
                      {supplier.business_license && (
                        <span className="sl-license-badge">
                          <Award size={12} />
                          Certified
                        </span>
                      )}
                    </div>
                    <div className="sl-years-badge">
                      <Calendar size={14} />
                      {supplier.years_in_business || 0} years
                    </div>
                  </div>

                  <div className="sl-card-body">
                    {/* Contact Info */}
                    <div className="sl-contact-section">
                      {supplier.phone && (
                        <div className="sl-detail-row">
                          <Phone size={14} color="#64748b" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="sl-detail-row">
                          <Mail size={14} color="#64748b" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.website && (
                        <div className="sl-detail-row">
                          <Globe size={14} color="#64748b" />
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="sl-website-link">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Delivery Areas */}
                    {supplier.delivery_areas && supplier.delivery_areas.length > 0 && (
                      <div className="sl-delivery-section">
                        <div className="sl-section-label">
                          <MapPin size={12} />
                          Delivery
                        </div>
                        <div className="sl-areas-tags">
                          {supplier.delivery_areas.slice(0, 2).map((area, index) => (
                            <span key={index} className="sl-area-tag">{area}</span>
                          ))}
                          {supplier.delivery_areas.length > 2 && (
                            <span className="sl-area-tag more">+{supplier.delivery_areas.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="sl-card-footer">
                    {supplier.catalog_pdf_url && (
                      <button
                        className="sl-catalog-btn"
                        onClick={() => handleDownloadCatalog(supplier.catalog_pdf_url)}
                        title="View Catalog"
                      >
                        <FileText size={16} />
                        Catalog
                      </button>
                    )}
                    <button
                      className="sl-request-btn"
                      onClick={() => openRequestModal(supplier)}
                    >
                      <Package size={16} />
                      Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sl-no-results">
              <Package size={64} color="#cbd5e1" />
              <h3>No suppliers found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {isRequestModalOpen && selectedSupplier && (
        <div className="sl-modal-backdrop">
          <div className="sl-modal-container">
            <div className="sl-modal-header">
              <div className="sl-modal-header-content">
                <h2 className="sl-modal-title">Request Materials</h2>
                <p className="sl-modal-subtitle">From: {selectedSupplier.company_name}</p>
              </div>
              <button onClick={closeRequestModal} className="sl-modal-close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="sl-modal-body">
              <div className="sl-modal-info-card">
                <FileText size={20} color="#00a5a9" />
                <div>
                  <p className="sl-modal-info-title">Before submitting your request:</p>
                  <p className="sl-modal-info-text">
                    Please review the supplier's catalog (if available) to identify specific materials and quantities needed.
                    The supplier will create a custom invoice based on your request.
                  </p>
                </div>
              </div>

              {/* Request Type Selection */}
              <div className="sl-request-type-selector">
                <label className="sl-form-label">Submit Your Request As: *</label>
                <div className="sl-type-buttons">
                  <button
                    type="button"
                    className={`sl-type-btn ${requestType === 'text' ? 'active' : ''}`}
                    onClick={() => setRequestType('text')}
                  >
                    <FileText size={18} />
                    <span>Text Description</span>
                    {requestType === 'text' && <Check size={16} className="sl-check-icon" />}
                  </button>
                  <button
                    type="button"
                    className={`sl-type-btn ${requestType === 'file' ? 'active' : ''}`}
                    onClick={() => setRequestType('file')}
                  >
                    <Upload size={18} />
                    <span>PDF Document</span>
                    {requestType === 'file' && <Check size={16} className="sl-check-icon" />}
                  </button>
                </div>
              </div>

              {/* Text Input */}
              {requestType === 'text' && (
                <div className="sl-form-group sl-fade-in">
                  <label className="sl-form-label">Material Request Details *</label>
                  <textarea
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    className="sl-form-textarea"
                    placeholder="Please specify the materials you need, quantities, and any special requirements...&#10;&#10;Example:&#10;- Cement: 50 bags&#10;- Steel bars: 100 pieces (10mm)&#10;- Sand: 5 cubic meters&#10;- Delivery needed by: [Date]"
                    rows="8"
                  />
                  <p className="sl-form-hint">
                    Be as specific as possible to receive an accurate quote
                  </p>
                </div>
              )}

              {/* File Upload */}
              {requestType === 'file' && (
                <div className="sl-form-group sl-fade-in">
                  <label className="sl-form-label">Upload Request Document (PDF) *</label>
                  <div className="sl-file-upload-area">
                    {!requestFile ? (
                      <label className="sl-file-upload-label">
                        <div className="sl-upload-icon-wrapper">
                          <Upload size={40} />
                        </div>
                        <p className="sl-upload-text">
                          <span className="sl-upload-highlight">Click to upload</span> or drag and drop
                        </p>
                        <p className="sl-upload-subtext">PDF file up to 10MB</p>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div className="sl-file-preview">
                        <div className="sl-file-info">
                          <FileText size={32} color="#00a5a9" />
                          <div className="sl-file-details">
                            <p className="sl-file-name">{requestFile.name}</p>
                            <p className="sl-file-size">
                              {(requestFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="sl-file-remove-btn"
                          onClick={() => setRequestFile(null)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="sl-form-hint">
                    Upload a PDF with your detailed material requirements, quantities, and specifications
                  </p>
                </div>
              )}

              <div className="sl-modal-footer">
                <button
                  onClick={closeRequestModal}
                  className="sl-cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="sl-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierList;
