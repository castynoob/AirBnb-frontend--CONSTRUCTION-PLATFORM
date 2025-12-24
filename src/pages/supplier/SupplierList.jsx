import { useState, useEffect, useRef } from 'react';
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
  Briefcase,
  Shield
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/manager/submissions.css';

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
    <div className="subs-custom-select" ref={selectRef}>
      <div className="subs-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        {Icon && <Icon size={16} />}
        <span className="subs-select-value">{displayValue}</span>
        <ChevronDown size={14} className={`subs-select-arrow ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <div className="subs-select-dropdown">
          {options.map((option, index) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <div
                key={index}
                className={`subs-select-option ${value === optValue ? 'selected' : ''}`}
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
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [requestFile, setRequestFile] = useState(null);
  const [requestType, setRequestType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  const hasActiveFilters = selectedArea !== 'All Areas' || selectedMaterial !== 'All Materials' ||
    selectedYearsFilter !== 'All' || certificationFilter !== 'All';

  if (isLoading) {
    return (
      <div className="subs-submissions-container">
        <Nav />
        <div className="subs-submissions-content">
          <div className="subs-loading-state">
            <div className="subs-spinner"></div>
            <p>Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subs-submissions-container">
      <Nav />
      <div className="subs-submissions-content">
        {/* Page Header */}
        <header className="subs-page-header">
          <div className="subs-header-left">
            <div className="subs-header-title-group">
              <h1>MATERIAL SUPPLIERS</h1>
              <span className="subs-submission-count">{filteredSuppliers.length} suppliers</span>
            </div>
          </div>
          <div className="subs-header-actions">
            <div className="subs-btn subs-btn-secondary">
              <Package size={18} />
              <span>{suppliers.length} Total</span>
            </div>
          </div>
        </header>

        {/* Controls Bar */}
        <div className="subs-controls-bar">
          <div className="subs-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by company name, license, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="subs-clear-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`subs-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && <span className="subs-filter-badge"></span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="subs-filter-panel">
            <div className="subs-filter-grid">
              <div className="subs-filter-item">
                <label className="subs-filter-label">Location</label>
                <CustomSelect
                  value={selectedArea}
                  onChange={setSelectedArea}
                  options={areaOptions}
                  icon={MapPin}
                  placeholder="Select area"
                />
              </div>

              <div className="subs-filter-item">
                <label className="subs-filter-label">Material Type</label>
                <CustomSelect
                  value={selectedMaterial}
                  onChange={setSelectedMaterial}
                  options={materialOptions}
                  icon={Package}
                  placeholder="Select material"
                />
              </div>

              <div className="subs-filter-item">
                <label className="subs-filter-label">Years in Business</label>
                <CustomSelect
                  value={selectedYearsFilter}
                  onChange={setSelectedYearsFilter}
                  options={yearsOptions}
                  icon={Briefcase}
                  placeholder="Select experience"
                />
              </div>

              <div className="subs-filter-item">
                <label className="subs-filter-label">Certification</label>
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
              className="subs-clear-filters-btn"
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

        {/* Suppliers Grid */}
        {filteredSuppliers.length === 0 ? (
          <div className="subs-empty-state">
            <Package size={48} />
            <h3>No suppliers found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="subs-bids-grid">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="subs-bid-card" onClick={() => handleViewDetails(supplier)}>
                {/* Top Row: Certification + Years */}
                <div className="subs-card-top">
                  {supplier.business_license ? (
                    <div className="subs-status-badge-subs status-accepted">
                      <Award size={12} />
                      Certified
                    </div>
                  ) : (
                    <div className="subs-status-badge-subs status-pending">
                      <Shield size={12} />
                      Not Certified
                    </div>
                  )}
                  <div className="subs-card-top-right">
                    <span className="subs-bid-amount">
                      <Calendar size={12} />
                      {supplier.years_in_business || 0} yrs
                    </span>
                  </div>
                </div>

                {/* Company Name */}
                <h3 className="subs-job-title">{supplier.company_name}</h3>

                {/* Info Row */}
                <div className="subs-card-info">
                  {supplier.phone && (
                    <div className="subs-info-item">
                      <Phone size={12} />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="subs-info-item">
                      <Mail size={12} />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.delivery_areas && supplier.delivery_areas.length > 0 && (
                    <div className="subs-info-item">
                      <MapPin size={12} />
                      <span>
                        {supplier.delivery_areas.slice(0, 2).join(', ')}
                        {supplier.delivery_areas.length > 2 && ` +${supplier.delivery_areas.length - 2}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Row */}
                <div className="subs-card-actions">
                  <button className="subs-expand-btn" onClick={(e) => { e.stopPropagation(); handleViewDetails(supplier); }}>
                    <FileText size={14} />
                  </button>

                  {supplier.catalog_pdf_url && (
                    <button
                      className="subs-chat-btn"
                      onClick={(e) => { e.stopPropagation(); handleDownloadCatalog(supplier.catalog_pdf_url); }}
                      title="View Catalog"
                    >
                      <FileText size={14} />
                    </button>
                  )}

                  <button
                    className="subs-accept-btn"
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
    </div>
  );
}

export default SupplierList;
