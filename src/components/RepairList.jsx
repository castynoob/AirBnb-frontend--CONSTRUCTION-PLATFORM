import React, { useState, useMemo } from 'react';
import { Building2, Home, DollarSign, Users, Grid3x3, List, ChevronDown, Filter, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function RepairList({ repairs, handleRepairClicked }) {
  const { t } = useLanguage();
  const PLACEHOLDER_IMAGE = "/defaultjobs.png";
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProperty, setSelectedProperty] = useState('all'); // 'all' or property name
  const [selectedUrgency, setSelectedUrgency] = useState('all'); // 'all' or urgency level
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const handleImageError = (e) => {
    console.log("Image failed to load:", e.target.src);
    console.log("Fallback to:", PLACEHOLDER_IMAGE);
    e.target.src = PLACEHOLDER_IMAGE;
    // Force show the image even on error
    e.target.style.display = 'block';
  };

  const handleImageLoad = (repairId, imageSrc) => {
    console.log("Image loaded successfully:", imageSrc, "for repair:", repairId);
    setImagesLoaded(prev => ({ ...prev, [repairId]: true }));
  };

  // Get unique properties from repairs
  const uniqueProperties = useMemo(() => {
    const propertiesSet = new Set();
    repairs.forEach(repair => {
      if (repair.property) {
        propertiesSet.add(repair.property);
      }
    });
    return Array.from(propertiesSet).sort();
  }, [repairs]);

  // Get unique urgency levels from repairs
  const uniqueUrgencies = useMemo(() => {
    const urgenciesSet = new Set();
    repairs.forEach(repair => {
      if (repair.category) {
        urgenciesSet.add(repair.category);
      }
    });
    return Array.from(urgenciesSet).sort();
  }, [repairs]);

  // Filter repairs based on selected property and urgency
  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      const propertyMatch = selectedProperty === 'all' || repair.property === selectedProperty;
      const urgencyMatch = selectedUrgency === 'all' || repair.category === selectedUrgency;
      return propertyMatch && urgencyMatch;
    });
  }, [repairs, selectedProperty, selectedUrgency]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRepairs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRepairs = filteredRepairs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedProperty, selectedUrgency]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // Middles
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <section className="hp-repairs-section">
      <div className="hp-section-header">
        <div className="hp-section-title-group">
          <div className="hp-filters-row">
            <div className="hp-property-filter-dropdown">
              <span className="hp-select-label">
                {selectedProperty === 'all' ? t('repairList.allRepairWork') : selectedProperty}
              </span>
              <ChevronDown size={16} className="hp-select-icon" />
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="hp-property-select"
              >
                <option value="all">{t('repairList.allRepairWork')}</option>
                {uniqueProperties.map(property => (
                  <option key={property} value={property}>
                    {property}
                  </option>
                ))}
              </select>
            </div>

            <div className="hp-urgency-filter-dropdown">
              <Filter size={14} className="hp-filter-icon" />
              <span className="hp-select-label">
                {selectedUrgency === 'all' ? t('repairList.allUrgency') : selectedUrgency}
              </span>
              <ChevronDown size={16} className="hp-select-icon" />
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="hp-property-select"
              >
                <option value="all">{t('repairList.allUrgency')}</option>
                {uniqueUrgencies.map(urgency => (
                  <option key={urgency} value={urgency}>
                    {urgency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="hp-section-subtitle">
            {filteredRepairs.length} {filteredRepairs.length !== 1 ? t('repairList.repairs') : t('repairList.repair')}
            {selectedProperty !== 'all' && ` ${t('repairList.in')} ${selectedProperty}`}
            {selectedUrgency !== 'all' && ` - ${selectedUrgency}`}
            {selectedProperty === 'all' && selectedUrgency === 'all' && ` ${t('repairList.available')}`}
            {totalPages > 1 && ` (${t('repairList.page')} ${currentPage} ${t('repairList.of')} ${totalPages})`}
          </p>
        </div>
        <div className="hp-view-toggle">
          <button
            className={`hp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={t('repairList.gridView')}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            className={`hp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title={t('repairList.listView')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'hp-repair-cards-grid' : 'hp-repair-cards-list'}>
        {paginatedRepairs.map((repair) => {
          console.log(`Repair ${repair.id} - Image URL:`, repair.images[0]);
          return (
          <div
            className="hp-repair-card-modern"
            key={repair.id}
            onClick={() => handleRepairClicked(repair)}
          >
            <div className="hp-repair-image-container">
              {!imagesLoaded[repair.id] && (
                <div className="hp-image-skeleton">
                  <div className="hp-shimmer"></div>
                </div>
              )}
              <img
                src={repair.images[0]}
                alt={repair.property}
                onError={handleImageError}
                onLoad={(e) => handleImageLoad(repair.id, e.target.src)}
                style={{
                  display: imagesLoaded[repair.id] ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <span
                className={`hp-category-badge ${
                  repair.category.includes("Urgent")
                    ? "hp-urgent"
                    : repair.category.includes("Next")
                    ? "hp-warning"
                    : "hp-info"
                }`}
              >
                {repair.category}
              </span>
              {repair.hasApprovedBid && (
                <span className="hp-approved-badge">
                  <CheckCircle2 size={12} />
                  <span>{t('repairList.approved')}</span>
                </span>
              )}
            </div>

            <div className="hp-repair-content">
              <div className="hp-repair-header">
                <div className="hp-property-info">
                  <Building2 size={16} className="hp-property-icon" />
                  <div>
                    <h3 className="hp-property-name">{repair.property}</h3>
                    <p className="hp-property-address">{repair.address}</p>
                  </div>
                </div>
              </div>

              <div className="hp-apartment-info">
                <Home size={14} />
                <span>{repair.apartment}</span>
              </div>

              <p className="hp-repair-description">{repair.description}</p>

              <div className="hp-repair-footer">
                <div className="hp-footer-item">
                  <Users size={14} />
                  <span>{repair.bids} {t('repairList.bids')}</span>
                </div>
                <div className="hp-footer-item hp-budget">
                  <DollarSign size={14} />
                  <span>{repair.budget}</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="hp-pagination">
          <button
            className="hp-pagination-btn hp-pagination-prev"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            <span>{t('repairList.previous')}</span>
          </button>

          <div className="hp-pagination-numbers">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="hp-pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={`hp-pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            className="hp-pagination-btn hp-pagination-next"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <span>{t('repairList.next')}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

export default RepairList;