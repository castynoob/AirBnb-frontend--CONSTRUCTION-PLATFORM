import React, { useState } from "react";
import { Building2, Calendar, DollarSign, FileText, MapPin, Search, Filter, Check, X, Clock, Star, MessageCircle, Upload, Image as ImageIcon, Heart } from "lucide-react";
import "../../styles/manager/submissions.css"
import Nav from '../../components/Nav'

export default function Submissions() {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    quality: 5,
    timeliness: 5,
    communication: 5,
    professionalism: 5,
    wouldRecommend: true,
    comments: "",
    images: []
  });

  const [submissions, setSubmissions] = useState([
    { id: 1, bidder: "Skyline Roofing Co.", logo: "https://via.placeholder.com/60x60.png?text=SR", licenseNumber: "LIC-45821", yearsInBusiness: 12, address: "123 Elm St, Toronto, ON", averageRating: 4.7, property: "Maple Heights", apartment: "Unit 304", budget: 5200, projectDate: "2025-11-10", submissionDate: "2025-10-12", status: "pending" },
    { id: 2, bidder: "UrbanBuild Contractors", logo: "https://via.placeholder.com/60x60.png?text=UB", licenseNumber: "LIC-78213", yearsInBusiness: 8, address: "45 Wellington Ave, Toronto, ON", averageRating: 4.5, property: "Lakeside Towers", apartment: "Unit 112", budget: 3400, projectDate: "2025-11-22", submissionDate: "2025-10-14", status: "pending" },
    { id: 3, bidder: "Apex Maintenance Group", logo: "https://via.placeholder.com/60x60.png?text=AM", licenseNumber: "LIC-12489", yearsInBusiness: 15, address: "99 Front St E, Toronto, ON", averageRating: 4.9, property: "Cedarwood Complex", apartment: "Unit 502", budget: 6100, projectDate: "2025-12-01", submissionDate: "2025-10-10", status: "accepted" },
    { id: 4, bidder: "NorthPoint Renovations", logo: "https://via.placeholder.com/60x60.png?text=NP", licenseNumber: "LIC-33125", yearsInBusiness: 10, address: "15 King St W, Toronto, ON", averageRating: 4.4, property: "Sunset Residences", apartment: "Unit 410", budget: 7800, projectDate: "2025-11-18", submissionDate: "2025-10-13", status: "pending" },
    { id: 5, bidder: "BlueHaven Builders", logo: "https://via.placeholder.com/60x60.png?text=BH", licenseNumber: "LIC-56788", yearsInBusiness: 9, address: "302 Bayview Blvd, Toronto, ON", averageRating: 4.2, property: "Oakridge Condos", apartment: "Unit 225", budget: 4500, projectDate: "2025-11-30", submissionDate: "2025-10-11", status: "cancelled" },
    { id: 6, bidder: "CraftPro Solutions", logo: "https://via.placeholder.com/60x60.png?text=CP", licenseNumber: "LIC-67823", yearsInBusiness: 6, address: "20 Dundas Sq, Toronto, ON", averageRating: 4.6, property: "Riverview Apartments", apartment: "Unit 703", budget: 3800, projectDate: "2025-12-15", submissionDate: "2025-10-09", status: "pending" },
    { id: 7, bidder: "MetroFix Experts", logo: "https://via.placeholder.com/60x60.png?text=MF", licenseNumber: "LIC-44211", yearsInBusiness: 14, address: "54 Liberty Village, Toronto, ON", averageRating: 4.8, property: "Hilltop Homes", apartment: "Unit 101", budget: 8900, projectDate: "2025-12-05", submissionDate: "2025-10-10", status: "ongoing" },
    { id: 8, bidder: "Everest Construction", logo: "https://via.placeholder.com/60x60.png?text=EC", licenseNumber: "LIC-55678", yearsInBusiness: 18, address: "210 Queen St W, Toronto, ON", averageRating: 4.9, property: "Aspen Gardens", apartment: "Unit 330", budget: 5600, projectDate: "2025-12-20", submissionDate: "2025-10-08", status: "pending" },
    { id: 9, bidder: "RenovaWorks Inc.", logo: "https://via.placeholder.com/60x60.png?text=RW", licenseNumber: "LIC-98231", yearsInBusiness: 11, address: "1 Spadina Ave, Toronto, ON", averageRating: 4.5, property: "Silver Oaks", apartment: "Unit 609", budget: 7200, projectDate: "2025-11-27", submissionDate: "2025-10-13", status: "done" },
    { id: 10, bidder: "PrimeEdge Contractors", logo: "https://via.placeholder.com/60x60.png?text=PE", licenseNumber: "LIC-11345", yearsInBusiness: 7, address: "77 Richmond St, Toronto, ON", averageRating: 4.3, property: "Elmwood Lofts", apartment: "Unit 202", budget: 4900, projectDate: "2025-12-08", submissionDate: "2025-10-15", status: "pending" },
    { id: 11, bidder: "Summit Electrical Services", logo: "https://via.placeholder.com/60x60.png?text=SE", licenseNumber: "LIC-22451", yearsInBusiness: 13, address: "88 College St, Toronto, ON", averageRating: 4.7, property: "Pine Grove", apartment: "Unit 415", budget: 4200, projectDate: "2025-11-14", submissionDate: "2025-10-14", status: "accepted" },
    { id: 12, bidder: "GreenLine Landscaping", logo: "https://via.placeholder.com/60x60.png?text=GL", licenseNumber: "LIC-34982", yearsInBusiness: 10, address: "165 Bloor St W, Toronto, ON", averageRating: 4.4, property: "Willow Park", apartment: "Common Areas", budget: 9500, projectDate: "2025-12-10", submissionDate: "2025-10-11", status: "ongoing" },
    { id: 13, bidder: "Alpha Flooring Solutions", logo: "https://via.placeholder.com/60x60.png?text=AF", licenseNumber: "LIC-77623", yearsInBusiness: 9, address: "42 Yonge St, Toronto, ON", averageRating: 4.6, property: "Riverside Complex", apartment: "Unit 512", budget: 6700, projectDate: "2025-11-20", submissionDate: "2025-10-13", status: "done" },
    { id: 14, bidder: "TechHome Automation", logo: "https://via.placeholder.com/60x60.png?text=TH", licenseNumber: "LIC-45129", yearsInBusiness: 5, address: "98 King St E, Toronto, ON", averageRating: 4.8, property: "Downtown Lofts", apartment: "Unit 801", budget: 5300, projectDate: "2025-12-18", submissionDate: "2025-10-15", status: "pending" },
    { id: 15, bidder: "Precision Windows & Doors", logo: "https://via.placeholder.com/60x60.png?text=PW", licenseNumber: "LIC-66234", yearsInBusiness: 16, address: "203 Adelaide St, Toronto, ON", averageRating: 4.9, property: "Harbor View", apartment: "Unit 203", budget: 8400, projectDate: "2025-11-25", submissionDate: "2025-10-09", status: "ongoing" },
    { id: 16, bidder: "SafeGuard Fire Protection", logo: "https://via.placeholder.com/60x60.png?text=SF", licenseNumber: "LIC-91827", yearsInBusiness: 20, address: "75 Church St, Toronto, ON", averageRating: 4.9, property: "Cityscape Towers", apartment: "Building Wide", budget: 15200, projectDate: "2025-12-22", submissionDate: "2025-10-08", status: "accepted" },
    { id: 17, bidder: "EcoClean Services", logo: "https://via.placeholder.com/60x60.png?text=EC", licenseNumber: "LIC-55239", yearsInBusiness: 7, address: "132 Queen St E, Toronto, ON", averageRating: 4.3, property: "Maple Heights", apartment: "Unit 715", budget: 2900, projectDate: "2025-11-12", submissionDate: "2025-10-16", status: "cancelled" },
    { id: 18, bidder: "Premier Insulation Co.", logo: "https://via.placeholder.com/60x60.png?text=PI", licenseNumber: "LIC-88451", yearsInBusiness: 11, address: "44 Harbord St, Toronto, ON", averageRating: 4.5, property: "Northwind Estates", apartment: "Unit 104", budget: 5800, projectDate: "2025-12-03", submissionDate: "2025-10-12", status: "done" },
    { id: 19, bidder: "VisionGlass Specialists", logo: "https://via.placeholder.com/60x60.png?text=VG", licenseNumber: "LIC-77912", yearsInBusiness: 14, address: "22 Bay St, Toronto, ON", averageRating: 4.7, property: "Lakeview Terraces", apartment: "Unit 908", budget: 3900, projectDate: "2025-11-15", submissionDate: "2025-10-10", status: "ongoing" },
    { id: 20, bidder: "Titanium Tile Works", logo: "https://via.placeholder.com/60x60.png?text=TT", licenseNumber: "LIC-44098", yearsInBusiness: 8, address: "77 Bloor St E, Toronto, ON", averageRating: 4.6, property: "Maplewood Estates", apartment: "Unit 622", budget: 5100, projectDate: "2025-12-12", submissionDate: "2025-10-14", status: "accepted" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const handleAction = (id, newStatus) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
    );
  };

  const handleReview = (id) => {
    const submission = submissions.find(sub => sub.id === id);
    setSelectedContractor(submission);
    setShowReviewForm(true);
    // Reset review data
    setReviewData({
      rating: 0,
      quality: 5,
      timeliness: 5,
      communication: 5,
      professionalism: 5,
      wouldRecommend: true,
      comments: "",
      images: []
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Create preview URLs for images
    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setReviewData({
      ...reviewData,
      images: [...reviewData.images, ...newImages]
    });
  };

  const handleRemoveImage = (index) => {
    const updatedImages = reviewData.images.filter((_, i) => i !== index);
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(reviewData.images[index].preview);
    setReviewData({
      ...reviewData,
      images: updatedImages
    });
  };

  const handleChatContractor = (id) => {
    const submission = submissions.find(sub => sub.id === id);
    console.log(`Opening chat with ${submission.bidder}`);
    // This would typically open the messages page or chat modal
    alert(`Chat with ${submission.bidder} would open here`);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(favId => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    console.log("Review submitted:", {
      contractor: selectedContractor.bidder,
      ...reviewData,
      imageCount: reviewData.images.length
    });
    
    // Clean up object URLs
    reviewData.images.forEach(img => URL.revokeObjectURL(img.preview));
    
    alert(`Review submitted for ${selectedContractor.bidder}!`);
    setShowReviewForm(false);
    setSelectedContractor(null);
  };

  const handleCloseReview = () => {
    // Clean up object URLs
    reviewData.images.forEach(img => URL.revokeObjectURL(img.preview));
    setShowReviewForm(false);
    setSelectedContractor(null);
  };

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    accepted: submissions.filter(s => s.status === "accepted").length,
    ongoing: submissions.filter(s => s.status === "ongoing").length,
    done: submissions.filter(s => s.status === "done").length,
    cancelled: submissions.filter(s => s.status === "cancelled").length,
  };

  const filteredSubmissions = submissions
    .filter((sub) => {
      const matchesSearch = sub.bidder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.property.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "all" || sub.status === activeTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.submissionDate) - new Date(a.submissionDate);
      if (sortBy === "budget-high") return b.budget - a.budget;
      if (sortBy === "budget-low") return a.budget - b.budget;
      if (sortBy === "rating") return b.averageRating - a.averageRating;
      return 0;
    });

  const tabs = [
    { id: "all", label: "All", icon: FileText },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "accepted", label: "Accepted", icon: Check },
    { id: "ongoing", label: "Ongoing", icon: Clock },
    { id: "done", label: "Done", icon: Check },
    { id: "cancelled", label: "Cancelled", icon: X },
  ];

  return (
    <div className="homepage">
      <Nav />
      <div className="main-container">
        <header className="page-header">
          <h1>Submissions</h1>
          <p>Review and manage all contractor bids across your properties.</p>
        </header>

        {/* Tabs Navigation */}
        <div className="tabs-container">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              >
                <Icon size={18} />
                {tab.label}
                <span className="tab-count">{statusCounts[tab.id]}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by contractor or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="recent">Most Recent</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="results-count">
          <p>{filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="submissions-grid">
          {filteredSubmissions.map((sub) => (
            <div key={sub.id} className="submission-card">
              <div className="card-header">
                <div className="bidder-profile">
                  <div className="bidder-logo">
                    <img src={sub.logo} alt={sub.bidder} />
                  </div>
                  <div className="bidder-details">
                    <h3 className="bidder-name">{sub.bidder}</h3>
                    <div className="location">
                      <MapPin size={14} />
                      <span>{sub.address}</span>
                    </div>
                  </div>
                </div>
                <span className={`status-badge ${sub.status}`}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>

              <div className="contractor-stats">
                <div className="stat-item">
                  <p className="stat-label">Rating</p>
                  <p className="stat-value submissions">{sub.averageRating}</p>
                </div>
                <div className="stat-item">
                  <p className="stat-label">Experience</p>
                  <p className="stat-value submissions">{sub.yearsInBusiness} Years</p>
                </div>
                <div className="stat-item">
                  <p className="stat-label">License</p>
                  <p className="stat-value submissions">{sub.licenseNumber}</p>
                </div>
              </div>

              <div className="project-details">
                <h4 className="section-title">Project Details</h4>
                <div className="details-compact">
                  <div className="detail-row-compact">
                    <Building2 size={12} />
                    <span>{sub.property} • {sub.apartment}</span>
                  </div>
                  <div className="detail-row-compact">
                    <DollarSign size={12} />
                    <span>${sub.budget.toLocaleString()}</span>
                  </div>
                  <div className="detail-row-compact">
                    <Calendar size={12} />
                    <span>{sub.projectDate}</span>
                  </div>
                  <div className="detail-row-compact">
                    <FileText size={12} />
                    <span>Submitted {sub.submissionDate}</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className={`favorite-btn ${favorites.includes(sub.id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(sub.id)}
                  title={favorites.includes(sub.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart size={18} fill={favorites.includes(sub.id) ? 'currentColor' : 'none'} />
                </button>

                <div className="action-buttons">
                  {sub.status === "pending" ? (
                    <>
                      <button
                        className="action-btn accept-btn"
                        onClick={() => handleAction(sub.id, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="action-btn decline-btn"
                        onClick={() => handleAction(sub.id, "cancelled")}
                      >
                        Decline
                      </button>
                    </>
                  ) : sub.status === "ongoing" ? (
                    <button
                      className="action-btn chat-btn"
                      onClick={() => handleChatContractor(sub.id)}
                    >
                      <MessageCircle size={16} />
                      Chat to Contractor
                    </button>
                  ) : sub.status === "done" ? (
                    <button
                      className="action-btn review-btn"
                      onClick={() => handleReview(sub.id)}
                    >
                      <Star size={16} />
                      Write Review
                    </button>
                  ) : sub.status === "cancelled" ? (
                    <p className="status-note">
                      This bid has been cancelled.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="no-results">
            <p>No submissions found matching your criteria.</p>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && selectedContractor && (
          <div className="review-overlay">
            <div className="review-modal">
              <div className="review-header">
                <div>
                  <h2>Write Review</h2>
                  <p className="review-subtitle">Share your experience with {selectedContractor.bidder}</p>
                </div>
                <button className="close-btn" onClick={handleCloseReview}>
                  <X size={24} />
                </button>
              </div>

              <div className="review-project-info">
                <div className="review-contractor">
                  <div className="review-logo">
                    <img src={selectedContractor.logo} alt={selectedContractor.bidder} />
                  </div>
                  <div>
                    <h3>{selectedContractor.bidder}</h3>
                    <p>{selectedContractor.property} • {selectedContractor.apartment}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="form-section">
                  <label className="form-label">Overall Rating *</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${reviewData.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewData({...reviewData, rating: star})}
                      >
                        <Star size={32} fill={reviewData.rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">Detailed Ratings</label>
                  <div className="rating-sliders">
                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Quality of Work</span>
                        <span className="slider-value">{reviewData.quality}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={reviewData.quality}
                        onChange={(e) => setReviewData({...reviewData, quality: parseInt(e.target.value)})}
                        className="rating-slider"
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Timeliness</span>
                        <span className="slider-value">{reviewData.timeliness}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={reviewData.timeliness}
                        onChange={(e) => setReviewData({...reviewData, timeliness: parseInt(e.target.value)})}
                        className="rating-slider"
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Communication</span>
                        <span className="slider-value">{reviewData.communication}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={reviewData.communication}
                        onChange={(e) => setReviewData({...reviewData, communication: parseInt(e.target.value)})}
                        className="rating-slider"
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Professionalism</span>
                        <span className="slider-value">{reviewData.professionalism}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={reviewData.professionalism}
                        onChange={(e) => setReviewData({...reviewData, professionalism: parseInt(e.target.value)})}
                        className="rating-slider"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">Would you recommend this contractor?</label>
                  <div className="recommendation-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${reviewData.wouldRecommend ? 'active' : ''}`}
                      onClick={() => setReviewData({...reviewData, wouldRecommend: true})}
                    >
                      <Check size={18} />
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!reviewData.wouldRecommend ? 'active' : ''}`}
                      onClick={() => setReviewData({...reviewData, wouldRecommend: false})}
                    >
                      <X size={18} />
                      No
                    </button>
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">Additional Comments</label>
                  <textarea
                    className="review-textarea"
                    rows="5"
                    placeholder="Share details about your experience with this contractor..."
                    value={reviewData.comments}
                    onChange={(e) => setReviewData({...reviewData, comments: e.target.value})}
                  />
                </div>

                <div className="form-section">
                  <label className="form-label">
                    Attach Images (Optional)
                    <span className="label-hint">Upload photos of the completed work</span>
                  </label>
                  
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-upload-input"
                    />
                    <label htmlFor="image-upload" className="image-upload-label">
                      <Upload size={24} />
                      <span>Click to upload images</span>
                      <span className="upload-hint">PNG, JPG, GIF up to 10MB each</span>
                    </label>
                  </div>

                  {reviewData.images.length > 0 && (
                    <div className="image-preview-grid">
                      {reviewData.images.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={image.preview} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {reviewData.images.length > 0 && (
                    <p className="image-count">
                      <ImageIcon size={16} />
                      {reviewData.images.length} image{reviewData.images.length !== 1 ? 's' : ''} attached
                    </p>
                  )}
                </div>

                <div className="review-actions">
                  <button type="button" className="cancel-review-btn" onClick={handleCloseReview}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-review-btn"
                    disabled={reviewData.rating === 0}
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}