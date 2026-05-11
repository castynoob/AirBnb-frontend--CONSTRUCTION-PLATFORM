import { useState, useEffect } from "react";
import { X, Edit3, Save, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { updateJob } from "../../utils/contractApi";
import "../../styles/manager/addannouncementmodal.css";
import "../../styles/manager/submitinvoicemodal.css";

const CATEGORIES = [
  { value: "Roofing", key: "cat_roofing" },
  { value: "Plumbing", key: "cat_plumbing" },
  { value: "Electrical", key: "cat_electrical" },
  { value: "Carpentry", key: "cat_carpentry" },
  { value: "Painting", key: "cat_painting" },
  { value: "Landscaping", key: "cat_landscaping" },
  { value: "Masonry", key: "cat_masonry" },
  { value: "Flooring", key: "cat_flooring" },
  { value: "Windows/Doors", key: "cat_windowsDoors" },
  { value: "Heating/Ventilation/AC", key: "cat_hvac" },
  { value: "General Repair", key: "cat_generalRepair" },
  { value: "Other", key: "cat_other" },
];

const URGENCIES = [
  { value: "Urgent", key: "urg_urgent" },
  { value: "Planned", key: "urg_planned" },
];

const toDateInput = (v) => {
  if (!v) return "";
  // Accept Date, ISO string, or "YYYY-MM-DD"; return YYYY-MM-DD
  const d = typeof v === "string" ? new Date(v) : v;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function EditJobModal({ isOpen, onClose, job, onSaved }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Roofing",
    urgency: "Urgent",
    due_date: "",
    estimated_duration_days: "",
    budget_min: "",
    budget_max: "",
    is_budget_hidden: false,
    is_emergency: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (job && isOpen) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        category: job.category || "Roofing",
        urgency: job.urgency || "Urgent",
        due_date: toDateInput(job.due_date),
        estimated_duration_days:
          job.estimated_duration_days != null ? String(job.estimated_duration_days) : "",
        budget_min: job.budget_min != null ? String(job.budget_min) : "",
        budget_max: job.budget_max != null ? String(job.budget_max) : "",
        is_budget_hidden: !!job.is_budget_hidden,
        is_emergency: !!job.is_emergency,
      });
      setError(null);
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t("editJobModal.titleRequired") || "Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError(t("editJobModal.descriptionRequired") || "Description is required");
      return;
    }
    if (
      formData.budget_min !== "" &&
      formData.budget_max !== "" &&
      parseFloat(formData.budget_min) > parseFloat(formData.budget_max)
    ) {
      setError(t("editJobModal.budgetRangeInvalid") || "Min budget cannot exceed max budget");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        urgency: formData.urgency,
        due_date: formData.due_date || null,
        estimated_duration_days: formData.estimated_duration_days
          ? parseInt(formData.estimated_duration_days)
          : null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        is_budget_hidden: formData.is_budget_hidden,
        is_emergency: formData.is_emergency,
      };
      const result = await updateJob(job.id, payload);
      toast.success(t("editJobModal.savedSuccess") || "Job updated");
      if (onSaved) onSaved(result.job || { ...job, ...payload });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="announcement-overlay rounded-modal" onClick={onClose}>
      <div className="announcement-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="announcement-header">
          <div className="announcement-title-wrapper">
            <Edit3 size={20} className="announcement-icon" />
            <div>
              <h2>{t("editJobModal.title") || "Edit Job"}</h2>
              <p className="announcement-subtitle">
                {t("editJobModal.subtitle") || "Update the editable fields. Status & assignment are managed elsewhere."}
              </p>
            </div>
          </div>
          <button className="announcement-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="announcement-body">
          {error && <div className="error-message-box">{error}</div>}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="ej-title" className="form-label">
              {t("addWorkModal.jobTitle") || "Job Title"} <span className="required">*</span>
            </label>
            <input
              id="ej-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              maxLength={255}
              required
            />
          </div>

          {/* Category + Urgency */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ej-category" className="form-label">
                {t("addWorkModal.category") || "Category"}
              </label>
              <select
                id="ej-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {t(`addWorkModal.${c.key}`) || c.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ej-urgency" className="form-label">
                {t("addWorkModal.urgency") || "Urgency"}
              </label>
              <select
                id="ej-urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="form-select"
              >
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {t(`addWorkModal.${u.key}`) || u.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Emergency */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_emergency"
                checked={formData.is_emergency}
                onChange={handleChange}
                className="form-checkbox"
              />
              <AlertTriangle size={14} color="#ef4444" />
              <span>{t("addWorkModal.markAsEmergency") || "Mark as Emergency"}</span>
            </label>
          </div>

          {/* Due Date + Duration */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ej-due" className="form-label">
                {t("addWorkModal.dueDate") || "Due Date"}
              </label>
              <input
                id="ej-due"
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ej-duration" className="form-label">
                {t("addWorkModal.duration") || "Duration (days)"}
              </label>
              <input
                id="ej-duration"
                type="number"
                name="estimated_duration_days"
                value={formData.estimated_duration_days}
                onChange={handleChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="ej-desc" className="form-label">
              {t("addWorkModal.description") || "Description"} <span className="required">*</span>
            </label>
            <textarea
              id="ej-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows={5}
              required
            />
          </div>

          {/* Budget */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ej-bmin" className="form-label">
                {t("addWorkModal.budgetMin") || "Budget Min"}
              </label>
              <input
                id="ej-bmin"
                type="number"
                name="budget_min"
                value={formData.budget_min}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ej-bmax" className="form-label">
                {t("addWorkModal.budgetMax") || "Budget Max"}
              </label>
              <input
                id="ej-bmax"
                type="number"
                name="budget_max"
                value={formData.budget_max}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_budget_hidden"
                checked={formData.is_budget_hidden}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>{t("addWorkModal.budgetVisibilityNote") || "Hide budget from contractors"}</span>
            </label>
          </div>

          {/* Footer */}
          <div className="announcement-footer">
            <button
              type="button"
              onClick={onClose}
              className="announcement-btn announcement-btn-secondary"
              disabled={isSubmitting}
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button
              type="submit"
              className="announcement-btn announcement-btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} style={{ marginRight: 6 }} />
              {isSubmitting
                ? (t("editJobModal.saving") || "Saving...")
                : (t("editJobModal.saveChanges") || "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditJobModal;
