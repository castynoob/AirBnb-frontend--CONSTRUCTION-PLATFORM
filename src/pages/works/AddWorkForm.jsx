import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/Nav";
import {
  ArrowLeft,
  Building2,
  Home,
  MapPin,
  DollarSign,
  FileText,
  Upload,
  X,
  AlertCircle,
  Tag,
} from "lucide-react";
import "../../styles/addworkform.css";

function AddWorkForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    property: "",
    address: "",
    apartment: "",
    category: "Urgent (Current Year)",
    description: "",
    budgetMin: "",
    budgetMax: "",
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages]);
    // Clear image error if images are uploaded
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.property.trim()) newErrors.property = "Property name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.apartment.trim()) newErrors.apartment = "Apartment/Unit is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.budgetMin) newErrors.budgetMin = "Minimum budget is required";
    if (!formData.budgetMax) newErrors.budgetMax = "Maximum budget is required";
    
    if (formData.budgetMin && formData.budgetMax) {
      if (parseFloat(formData.budgetMin) > parseFloat(formData.budgetMax)) {
        newErrors.budgetMax = "Maximum budget must be greater than minimum";
      }
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Create the repair object
    const newRepair = {
      id: Date.now(),
      property: formData.property,
      address: formData.address,
      apartment: formData.apartment,
      category: formData.category,
      description: formData.description,
      bids: 0,
      budget: `$${formData.budgetMin} - $${formData.budgetMax}`,
      images: images.map((img) => img.preview),
    };

    console.log("New Repair Work:", newRepair);
    alert("Work/Repair added successfully!");
    navigate("/homepage/manager");
  };

  return (
    <div className="add-work-page">
      <Nav />

      <div className="main-container">
        <header className="form-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div>
            <h1>Add New Work/Repair</h1>
            <p>Submit a new repair request for your property</p>
          </div>
        </header>

        <form className="add-work-form" onSubmit={handleSubmit}>
          {/* Property Information Section */}
          <section className="form-section">
            <h2 className="section-title">Property Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="property">
                  <Building2 size={16} />
                  Property Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="property"
                  name="property"
                  value={formData.property}
                  onChange={handleChange}
                  placeholder="e.g., Maple Heights"
                  className={errors.property ? "error" : ""}
                />
                {errors.property && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.property}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="apartment">
                  <Home size={16} />
                  Apartment/Unit <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="apartment"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  placeholder="e.g., A2010"
                  className={errors.apartment ? "error" : ""}
                />
                {errors.apartment && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.apartment}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address">
                  <MapPin size={16} />
                  Full Address <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main St, Toronto"
                  className={errors.address ? "error" : ""}
                />
                {errors.address && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.address}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Work Details Section */}
          <section className="form-section">
            <h2 className="section-title">Work Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  <Tag size={16} />
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Urgent (Current Year)">Urgent (Current Year)</option>
                  <option value="Next Year">Next Year</option>
                  <option value="Year After">Year After</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budgetMin">
                  <DollarSign size={16} />
                  Minimum Budget <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  placeholder="e.g., 12000"
                  min="0"
                  step="100"
                  className={errors.budgetMin ? "error" : ""}
                />
                {errors.budgetMin && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.budgetMin}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="budgetMax">
                  <DollarSign size={16} />
                  Maximum Budget <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  placeholder="e.g., 15000"
                  min="0"
                  step="100"
                  className={errors.budgetMax ? "error" : ""}
                />
                {errors.budgetMax && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.budgetMax}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                <FileText size={16} />
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the repair work needed in detail..."
                rows="6"
                className={errors.description ? "error" : ""}
              />
              {errors.description && (
                <span className="error-message">
                  <AlertCircle size={14} />
                  {errors.description}
                </span>
              )}
            </div>
          </section>

          {/* Image Upload Section */}
          <section className="form-section">
            <h2 className="section-title">Upload Images</h2>

            <div className="upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload" className="upload-label">
                <Upload size={40} />
                <p>Click to upload images or drag and drop</p>
                <span>PNG, JPG, JPEG up to 10MB each</span>
              </label>
            </div>

            {errors.images && images.length === 0 && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.images}
              </span>
            )}

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={image.preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Work/Repair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWorkForm;