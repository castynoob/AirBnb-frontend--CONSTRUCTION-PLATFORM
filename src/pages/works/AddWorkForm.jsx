import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/Nav";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Upload,
  X,
  AlertCircle,
  Tag,
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  CheckCircle,
} from "lucide-react";
import "../../styles/manager/addworkform.css";
import AddWorkFormSkeleton from '../../components/loading/AddWorkFormSkeleton';
import InspectionReportUploadModal from '../../components/InspectionReportUploadModal';

function AddWorkForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    category: "Roofing",
    urgency: "Urgent (Current Year)",
    due_date: "",
    estimated_duration_days: "",
    budget_min: "",
    budget_max: "",
    is_budget_hidden: false,
    is_emergency: false,
    status: "Open",
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    stage: '',
    message: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const userProfile = localStorage.getItem("userProfile");
        const user = JSON.parse(userProfile);
        const token = user.token;
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const res = await fetch(`${API_BASE_URL}/api/properties`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setProperties(data.properties);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.property_id) newErrors.property_id = "Property is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.budget_min) newErrors.budget_min = "Minimum budget required";
    if (!formData.budget_max) newErrors.budget_max = "Maximum budget required";
    if (
      formData.budget_min &&
      formData.budget_max &&
      parseFloat(formData.budget_min) > parseFloat(formData.budget_max)
    )
      newErrors.budget_max =
        "Maximum budget must be greater than minimum budget";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInspectionSubmit = (createdJobs) => {
    console.log('Jobs created from inspection:', createdJobs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress({ stage: 'creating', message: 'Creating job...' });

    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        alert("User not logged in!");
        return;
      }
      const user = JSON.parse(userProfile);
      const token = user?.token;
      if (!token) {
        alert("No authentication token found!");
        return;
      }

      const jobData = {
        property_id: formData.property_id || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        due_date: formData.due_date || null,
        estimated_duration_days: parseInt(formData.estimated_duration_days) || null,
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        is_budget_hidden: formData.is_budget_hidden || false,
        is_emergency: formData.is_emergency || false,
        status: "Open",
      };

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error response:", data);
        alert(data.message || "Failed to create job.");
        return;
      }

      const jobId = data.job.id;
      console.log("✓ Job created with ID:", jobId);

      if (images.length > 0) {
        setUploadProgress({ 
          stage: 'uploading', 
          message: `Uploading ${images.length} image(s)...` 
        });

        const uploadFormData = new FormData();
        
        images.forEach((img) => {
          uploadFormData.append('images', img.file);
        });

        console.log(`Uploading ${images.length} images for job ${jobId}`);

        try {
          const uploadRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/images`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          });

          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            console.error('Image upload failed:', uploadData);
            alert(`Job created successfully, but image upload failed: ${uploadData.message || 'Unknown error'}`);
          } else {
            console.log('✓ Images uploaded successfully:', uploadData);
            setUploadProgress({ 
              stage: 'complete', 
              message: `Job and ${uploadData.images?.length || images.length} image(s) uploaded successfully!` 
            });
          }
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          alert('Job created successfully, but failed to upload images.');
        }
      } else {
        setUploadProgress({ 
          stage: 'complete', 
          message: 'Job created successfully!' 
        });
      }

      setTimeout(() => {
        alert("Job created successfully!");
        
        setFormData({
          property_id: "",
          title: "",
          description: "",
          category: "Roofing",
          urgency: "Urgent (Current Year)",
          due_date: "",
          estimated_duration_days: "",
          budget_min: "",
          budget_max: "",
          is_budget_hidden: false,
          is_emergency: false,
          status: "Open",
        });
        setImages([]);
        setUploadProgress({ stage: '', message: '' });
      }, 500);

    } catch (error) {
      console.error("Error creating job:", error);
      alert("Something went wrong while creating the job.");
      setUploadProgress({ stage: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="aw-loading">
        <Nav />
        <AddWorkFormSkeleton />
      </div>
    );
  }

  return (
    <div className="aw-add-work-page">
      <Nav />
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="aw-loading-overlay">
          <div className="aw-loading-content">
            <div className="aw-loading-spinner">
              {uploadProgress.stage === 'complete' ? (
                <CheckCircle size={48} className="aw-success-icon" />
              ) : (
                <Loader2 size={48} className="aw-spinner-icon" />
              )}
            </div>
            <h3>{uploadProgress.message}</h3>
            {uploadProgress.stage === 'creating' && (
              <p>Please wait while we create your job...</p>
            )}
            {uploadProgress.stage === 'uploading' && (
              <p>This may take a moment depending on image size...</p>
            )}
            {uploadProgress.stage === 'complete' && (
              <p>Redirecting...</p>
            )}
          </div>
        </div>
      )}

      <div className="aw-main-container">
        <header className="aw-form-header">
          <div className="aw-header-buttons">
            <button 
              className="aw-back-btn" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <button 
              className="aw-back-btn aw-upload-excel" 
              onClick={handleOpenModal}
              disabled={isSubmitting}
            >
              <ClipboardList size={18} />
              <span>Upload excel file</span>
            </button>
          </div>
          <div>
            <h1>Add New Work | Repair | Job</h1>
            <p>Submit a new repair request for your property</p>
          </div>
        </header>

        <form className="aw-add-work-form" onSubmit={handleSubmit}>
          {/* Property Selection */}
          <section className="aw-form-section">
            <h2 className="aw-section-title">Select Property</h2>
            <div className="aw-form-group aw-property-select">
              <label htmlFor="property_id">
                <Building2 size={16} /> Property <span className="aw-required">*</span>
              </label>
              <div className="aw-select-wrapper aw-styled-select">
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.building_name}
                    </option>
                  ))}
                </select>
                <span className="aw-dropdown-icon">▾</span>
              </div>
              {errors.property_id && (
                <span className="aw-error-message">
                  <AlertCircle size={14} /> {errors.property_id}
                </span>
              )}
            </div>
          </section>

          {/* Work Details */}
          <section className="aw-form-section">
            <h2 className="aw-section-title">Work Details</h2>
            <div className="aw-form-group">
              <label htmlFor="title">
                <Tag size={16} /> Title <span className="aw-required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Roof Repair Needed"
                className={errors.title ? "aw-error" : ""}
                disabled={isSubmitting}
              />
              {errors.title && (
                <span className="aw-error-message">
                  <AlertCircle size={14} /> {errors.title}
                </span>
              )}
            </div>

            <div className="aw-form-group">
              <label htmlFor="description">
                <FileText size={16} /> Description <span className="aw-required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the work to be done..."
                rows="5"
                className={errors.description ? "aw-error" : ""}
                disabled={isSubmitting}
              />
              {errors.description && (
                <span className="aw-error-message">
                  <AlertCircle size={14} /> {errors.description}
                </span>
              )}
            </div>

            <div className="aw-form-row">
              <div className="aw-form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Roofing">Roofing</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Painting">Painting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="aw-form-group">
                <label htmlFor="urgency">Urgency</label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Urgent (Current Year)">Urgent (Current Year)</option>
                  <option value="Next Year">Next Year</option>
                  <option value="Year After">Year After</option>
                </select>
              </div>
            </div>

            <div className="aw-form-row">
              <div className="aw-form-group">
                <label htmlFor="due_date">
                  <Calendar size={16} /> Due Date
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              <div className="aw-form-group">
                <label htmlFor="estimated_duration_days">
                  <Clock size={16} /> Duration (Days)
                </label>
                <input
                  type="number"
                  id="estimated_duration_days"
                  name="estimated_duration_days"
                  value={formData.estimated_duration_days}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  min="1"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="aw-form-row">
              <div className="aw-form-group">
                <label htmlFor="budget_min">
                  <DollarSign size={16} /> Minimum Budget
                </label>
                <input
                  type="number"
                  id="budget_min"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="aw-form-group">
                <label htmlFor="budget_max">
                  <DollarSign size={16} /> Maximum Budget
                </label>
                <input
                  type="number"
                  id="budget_max"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="e.g., 8000"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="aw-form-row">
              <div className="aw-checkbox-group">
                <input
                  type="checkbox"
                  id="is_budget_hidden"
                  name="is_budget_hidden"
                  checked={formData.is_budget_hidden}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="is_budget_hidden">Hide Budget from Entrepreneurs</label>
              </div>
              <div className="aw-checkbox-group">
                <input
                  type="checkbox"
                  id="is_emergency"
                  name="is_emergency"
                  checked={formData.is_emergency}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="is_emergency">Mark as Emergency</label>
              </div>
            </div>
          </section>

          {/* Image Upload Section */}
          <section className="aw-form-section">
            <h2 className="aw-section-title">Upload Images</h2>
            <div className="aw-upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
                disabled={isSubmitting}
              />
              <label 
                htmlFor="image-upload" 
                className={`aw-upload-label ${isSubmitting ? 'aw-disabled' : ''}`}
              >
                <Upload size={40} />
                <p>Click to upload images or drag and drop</p>
                <span>PNG, JPG, JPEG up to 10MB each</span>
              </label>
            </div>
            {errors.images && images.length === 0 && (
              <span className="aw-error-message">
                <AlertCircle size={14} /> {errors.images}
              </span>
            )}
            {images.length > 0 && (
              <div className="aw-image-preview-grid">
                {images.map((image, index) => (
                  <div key={index} className="aw-image-preview-item">
                    <img src={image.preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="aw-remove-image-btn"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                    </button>
                    <span className="aw-image-name">{image.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="aw-form-actions">
            <button 
              type="button" 
              className="aw-cancel-btn" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="aw-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="aw-spinner-icon" />
                  Creating Job...
                </>
              ) : (
                'Add Job'
              )}
            </button>
          </div>
        </form>
      </div>

      <InspectionReportUploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleInspectionSubmit}
        propertyId={formData.property_id}
      />
    </div>
  );
}

export default AddWorkForm;