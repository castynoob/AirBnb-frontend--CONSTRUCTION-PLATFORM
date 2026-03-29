import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/Nav";
import {
  ArrowLeft,
  Building2,
  Tag,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle,
  Download,
  File,
  Edit3,
  AlertTriangle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import JobsPreviewModal from "../../components/modal/JobsPreviewModal";
import { useLanguage } from "../../contexts/LanguageContext";
import "../../styles/manager/addworkform.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function AddWorkForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [parsedJobsData, setParsedJobsData] = useState(null);
  const [inspectionId, setInspectionId] = useState(null);
  const [inputMethod, setInputMethod] = useState("manual");
  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    category: "Roofing",
    urgency: "Urgent",
    due_date: "",
    estimated_duration_days: "",
    budget_min: "",
    budget_max: "",
    is_budget_hidden: true,
    is_emergency: false,
  });

  const [images, setImages] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ stage: "", message: "", percent: 0 });

  const categories = [
    "Roofing", "Plumbing", "Electrical", "Carpentry", "Painting",
    "Landscaping", "Masonry", "Flooring", "Windows/Doors",
    "Heating/Ventilation/AC", "General Repair", "Other",
  ];

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const userProfile = localStorage.getItem("userProfile");
        if (!userProfile) return;
        const user = JSON.parse(userProfile);
        const res = await fetch(`${API_BASE_URL}/api/properties`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setProperties(data.properties || data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
        toast.error("Failed to load properties");
      } finally {
        setIsLoadingProperties(false);
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
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFile(file);
    setExcelPreview({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.property_id) newErrors.property_id = "Property is required";
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setUploadProgress({ stage: "creating", message: "Creating job...", percent: 30 });

    try {
      const userProfile = JSON.parse(localStorage.getItem("userProfile"));
      const body = {
        ...formData,
        status: "Open",
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        estimated_duration_days: formData.estimated_duration_days
          ? parseInt(formData.estimated_duration_days)
          : null,
      };

      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userProfile.token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create job");
      const jobData = await res.json();

      // Upload images if any
      const createdJobId = jobData.job?.id || jobData.id;
      if (images.length > 0 && createdJobId) {
        setUploadProgress({ stage: "uploading", message: "Uploading images...", percent: 60 });
        const fd = new FormData();
        for (let i = 0; i < images.length; i++) {
          fd.append("images", images[i].file);
        }
        await fetch(`${API_BASE_URL}/api/jobs/${createdJobId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${userProfile.token}` },
          body: fd,
        });
      }

      setUploadProgress({ stage: "complete", message: "Job created!", percent: 100 });
      toast.success(t("addWorkModal.jobCreated") || "Job created successfully!");
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error("Error creating job:", err);
      toast.error(t("addWorkModal.jobCreateError") || "Failed to create job");
      setIsSubmitting(false);
      setUploadProgress({ stage: "", message: "", percent: 0 });
    }
  };

  const handleSubmitExcel = async () => {
    if (!excelFile || !formData.property_id) {
      toast.error("Please select a property and upload an Excel file");
      return;
    }
    setIsSubmitting(true);
    setUploadProgress({ stage: "uploading", message: "Uploading Excel file...", percent: 5 });

    try {
      const userProfile = JSON.parse(localStorage.getItem("userProfile"));
      const fd = new FormData();
      fd.append("file", excelFile);
      fd.append("property_id", formData.property_id);

      const response = await fetch(`${API_BASE_URL}/api/inspections/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userProfile.token}` },
        body: fd,
      });

      // Read SSE stream for progress updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.stage === "reading") {
              setUploadProgress({ stage: "reading", message: `Found ${data.totalRows} rows`, percent: 10 });
            } else if (data.stage === "extracting") {
              const percent = data.totalBatches > 0 ? Math.round(10 + (data.currentBatch / data.totalBatches) * 75) : 50;
              setUploadProgress({ stage: "extracting", message: data.message, percent });
            } else if (data.stage === "saving") {
              setUploadProgress({ stage: "saving", message: "Saving inspection record...", percent: 90 });
            } else if (data.stage === "complete") {
              finalResult = data.result;
              setUploadProgress({ stage: "complete", message: `Found ${data.result.parsedData.successCount} jobs!`, percent: 100 });
            } else if (data.stage === "error") {
              throw new Error(data.message);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }

      if (!finalResult) throw new Error("No result received from server");

      toast.success(`Successfully parsed ${finalResult.parsedData.successCount} jobs from Excel`);
      setParsedJobsData(finalResult.parsedData);
      setInspectionId(finalResult.inspection.id);
      setTimeout(() => setShowPreviewModal(true), 500);
    } catch (err) {
      console.error("Error uploading excel:", err);
      toast.error("Failed to process file");
      setUploadProgress({ stage: "", message: "", percent: 0 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="main-container">
        <div className="awp-wrapper">
          {/* Header */}
          <div className="awp-header">
            <button className="awp-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              {t("common.back") || "Back"}
            </button>
            <div className="awp-header-title">
              <Tag size={20} />
              <h1>{t("addWorkModal.addNewJob") || "Add New Job"}</h1>
            </div>
          </div>

          {/* Loading overlay */}
          {isSubmitting && (
            <div className="awp-loading-overlay">
              <div className="awp-loading-content">
                {uploadProgress.stage === "complete" ? (
                  <CheckCircle size={48} color="#059669" />
                ) : (
                  <Loader2 size={48} className="awp-spinner" />
                )}
                <h3>{uploadProgress.message || "Processing..."}</h3>
                {uploadProgress.percent > 0 && (
                  <div className="awp-progress-bar">
                    <div
                      className="awp-progress-fill"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared Property Select */}
          <div className="awp-form-section" style={{ marginBottom: '1.5rem' }}>
            <label className="awp-label">
              <Building2 size={14} />
              {t("addWorkModal.selectProperty") || "Select Property"} *
            </label>
            <select
              name="property_id"
              value={formData.property_id}
              onChange={handleChange}
              className={`awp-select ${errors.property_id ? "error" : ""}`}
            >
              <option value="">{t("addWorkModal.selectProperty") || "Choose a property..."}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.building_name || p.address}
                </option>
              ))}
            </select>
            {errors.property_id && <span className="awp-error">{errors.property_id}</span>}
          </div>

          {/* Two-column layout: Manual Form + Excel Upload */}
          <div className="awp-two-col">

          {/* LEFT: Manual Entry Form */}
          <div className="awp-col-left">
            <div className="awp-col-header">
              <Edit3 size={16} />
              <h2>{t("addWorkModal.manualEntry") || "Manual Entry"}</h2>
            </div>

            <form onSubmit={handleSubmitManual} className="awp-form">
              {/* Title */}
              <div className="awp-form-section">
                <label className="awp-label">
                  <FileText size={14} />
                  {t("addWorkModal.jobTitle") || "Job Title"} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t("addWorkModal.jobTitlePlaceholder") || "e.g., Fix leaking roof"}
                  className={`awp-input ${errors.title ? "error" : ""}`}
                />
                {errors.title && <span className="awp-error">{errors.title}</span>}
              </div>

              {/* Category + Urgency */}
              <div className="awp-row">
                <div className="awp-form-section">
                  <label className="awp-label">{t("addWorkModal.category") || "Category"}</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="awp-select">
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="awp-form-section">
                  <label className="awp-label">{t("addWorkModal.urgency") || "Urgency"}</label>
                  <select name="urgency" value={formData.urgency} onChange={handleChange} className="awp-select">
                    <option value="Urgent">Urgent</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
              </div>

              {/* Emergency checkbox */}
              <label className="awp-checkbox-label">
                <input type="checkbox" name="is_emergency" checked={formData.is_emergency} onChange={handleChange} />
                <AlertTriangle size={14} color="#ef4444" />
                {t("addWorkModal.markAsEmergency") || "Mark as Emergency"}
              </label>

              {/* Due Date + Duration */}
              <div className="awp-row">
                <div className="awp-form-section">
                  <label className="awp-label">
                    <Calendar size={14} />
                    {t("addWorkModal.dueDate") || "Due Date"}
                  </label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="awp-input" />
                </div>
                <div className="awp-form-section">
                  <label className="awp-label">
                    <Clock size={14} />
                    {t("addWorkModal.duration") || "Duration (days)"} <span className="awp-optional">({t("addWorkModal.optional") || "Optional"})</span>
                  </label>
                  <input
                    type="number"
                    name="estimated_duration_days"
                    value={formData.estimated_duration_days}
                    onChange={handleChange}
                    placeholder="e.g., 7"
                    className="awp-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="awp-form-section">
                <label className="awp-label">
                  <FileText size={14} />
                  {t("addWorkModal.description") || "Description"} *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t("addWorkModal.descriptionPlaceholder") || "Describe the work needed..."}
                  className={`awp-textarea ${errors.description ? "error" : ""}`}
                  rows={4}
                />
                {errors.description && <span className="awp-error">{errors.description}</span>}
              </div>

              {/* Budget */}
              <div className="awp-form-section">
                <label className="awp-label">
                  <DollarSign size={14} />
                  {t("addWorkModal.budgetRange") || "Budget Range"}
                </label>
                <p className="awp-hint">{t("addWorkModal.budgetHint") || "Set the budget range you are willing to pay for this work."}</p>
                <div className="awp-row">
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    placeholder="Min"
                    className="awp-input"
                  />
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    placeholder="Max"
                    className="awp-input"
                  />
                </div>
                <label className="awp-checkbox-label" style={{ marginTop: "0.5rem" }}>
                  <input type="checkbox" name="is_budget_hidden" checked={formData.is_budget_hidden} onChange={handleChange} />
                  {t("addWorkModal.budgetVisibilityNote") || "Hide budget from contractors"}
                </label>
              </div>

              {/* Images */}
              <div className="awp-form-section">
                <label className="awp-label">
                  <Upload size={14} />
                  {t("addWorkModal.photos") || "Photos"} <span className="awp-optional">({t("addWorkModal.optional") || "Optional"})</span>
                </label>
                <div className="awp-image-upload">
                  <label className="awp-upload-btn">
                    <Upload size={16} />
                    {t("addWorkModal.clickToUpload") || "Add Photos"}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
                  </label>
                  {images.length > 0 && (
                    <div className="awp-image-grid">
                      {images.map((img, i) => (
                        <div key={i} className="awp-image-preview">
                          <img src={img.preview} alt={img.name} />
                          <button type="button" className="awp-image-remove" onClick={() => removeImage(i)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="awp-submit-btn" disabled={isSubmitting}>
                <CheckCircle size={18} />
                {t("addWorkModal.createJob") || "Create Job"}
              </button>
            </form>
          </div>

          {/* RIGHT: Excel Upload + Divider */}
          <div className="awp-col-right">
            <div className="awp-col-header">
              <Download size={16} />
              <h2>{t("addWorkModal.uploadExcel") || "Upload Excel"}</h2>
            </div>
            <p className="awp-excel-desc">{t("addWorkModal.allJobsForProperty") || "Upload an inspection report to create multiple jobs at once."}</p>

            <div className="awp-excel-upload-area">
              <div className="awp-excel-dropzone">
                <Upload size={32} />
                <p>{t("addWorkModal.dragDropExcel") || "Drag & drop your Excel file here"}</p>
                <span>{t("addWorkModal.supportedFormats") || "Supported: .XLSX, .XLS, .CSV"}</span>
                <label className="awp-upload-btn">
                  {t("addWorkModal.clickToUpload") || "Select File"}
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} hidden />
                </label>
              </div>

              {excelPreview && (
                <div className="awp-excel-preview">
                  <File size={16} />
                  <span>{excelPreview.name}</span>
                  <span className="awp-file-size">{excelPreview.size}</span>
                  <button type="button" onClick={() => { setExcelFile(null); setExcelPreview(null); }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <button
              className="awp-submit-btn"
              onClick={handleSubmitExcel}
              disabled={!excelFile || !formData.property_id || isSubmitting}
            >
              <Upload size={18} />
              {t("addWorkModal.previewJobs") || "Process File"}
            </button>
          </div>

          </div>
        </div>
      </div>

      {/* Jobs Preview Modal (for Excel) */}
      {showPreviewModal && parsedJobsData && (
        <JobsPreviewModal
          isOpen={showPreviewModal}
          parsedData={parsedJobsData}
          inspectionId={inspectionId}
          onClose={() => { setShowPreviewModal(false); setParsedJobsData(null); }}
          onSuccess={(result) => {
            toast.success(`${result?.jobs?.length || 0} jobs created!`);
            setShowPreviewModal(false);
            setParsedJobsData(null);
            navigate(-1);
          }}
        />
      )}
    </>
  );
}

export default AddWorkForm;
