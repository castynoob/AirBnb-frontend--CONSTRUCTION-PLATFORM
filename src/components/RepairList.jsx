import React, { useState, useMemo } from 'react';
import { Building2, Home, DollarSign, Users, Grid3x3, List, ChevronDown, Filter, CheckCircle2 } from 'lucide-react';

function RepairList({ repairs, handleRepairClicked }) {
  const PLACEHOLDER_IMAGE = "/defaultjobs.png";
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProperty, setSelectedProperty] = useState('all'); // 'all' or property name
  const [selectedUrgency, setSelectedUrgency] = useState('all'); // 'all' or urgency level

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

  return (
    <section className="hp-repairs-section">
      <div className="hp-section-header">
        <div className="hp-section-title-group">
          <div className="hp-filters-row">
            <div className="hp-property-filter-dropdown">
              <span className="hp-select-label">
                {selectedProperty === 'all' ? 'All Repair Work' : selectedProperty}
              </span>
              <ChevronDown size={16} className="hp-select-icon" />
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="hp-property-select"
              >
                <option value="all">All Repair Work</option>
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
                {selectedUrgency === 'all' ? 'All Urgency' : selectedUrgency}
              </span>
              <ChevronDown size={16} className="hp-select-icon" />
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="hp-property-select"
              >
                <option value="all">All Urgency</option>
                {uniqueUrgencies.map(urgency => (
                  <option key={urgency} value={urgency}>
                    {urgency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="hp-section-subtitle">
            {filteredRepairs.length} repair{filteredRepairs.length !== 1 ? 's' : ''}
            {selectedProperty !== 'all' && ` in ${selectedProperty}`}
            {selectedUrgency !== 'all' && ` - ${selectedUrgency}`}
            {selectedProperty === 'all' && selectedUrgency === 'all' && ' available'}
          </p>
        </div>
        <div className="hp-view-toggle">
          <button
            className={`hp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            className={`hp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'hp-repair-cards-grid' : 'hp-repair-cards-list'}>
        {filteredRepairs.map((repair) => {
          console.log(`Repair ${repair.id} - Image URL:`, repair.images[0]);
          return (
          <div
            className="hp-repair-card-modern"
            key={repair.id}
            onClick={() => handleRepairClicked(false, repair)}
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
                  <span>Approved</span>
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
                  <span>{repair.bids} bids</span>
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
    </section>
  );
}

export default RepairList;