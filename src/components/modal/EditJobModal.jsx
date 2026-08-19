import { useState, useEffect, useRef } from "react";
import { X, Edit3, Save, AlertTriangle, ImagePlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { updateJob } from "../../utils/contractApi";
import CustomSelect from "../CustomSelect";
import "../../styles/manager/addannouncementmodal.css";
import "../../styles/manager/submitinvoicemodal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper — grab a Bearer token from the localStorage profile blob. Same
// pattern the other modals in this codebase use.
const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

// Normalize a raw image row from the backend to { id, url }. Different code
// paths in the API return slightly different shapes (image_url vs url,
// image_id vs id), so we accept both.
const normalizeImage = (raw) => ({
  id:  raw.id || raw.image_id || raw.imageId || null,
  url: raw.url || raw.image_url || raw.imageUrl || raw.publicUrl || null,
});

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

  // Image roster for the job — mutations (add / remove) hit the backend
  // IMMEDIATELY rather than being queued for Save. That keeps the mental
  // model simple ("what you see is what's saved") and avoids the awkward
  // half-state where the user closes the modal and loses their new photos.
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageBusy, setImageBusy] = useState(false); // true during any upload/delete
  const fileInputRef = useRef(null);

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

  // Fetch the current image roster whenever the modal opens on a job. Kept
  // in its own effect so re-fetches are cheap when a filename changes but
  // the job id stays the same.
  useEffect(() => {
    if (!isOpen || !job?.id) return;
    let cancelled = false;
    const load = async () => {
      const token = getToken();
      if (!token) return;
      setImagesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        // Backend returns either an array or { images: [...] } depending on
        // the code path. Normalize both.
        const raw = Array.isArray(body) ? body : (body.images || []);
        if (!cancelled) setImages(raw.map(normalizeImage).filter((i) => i.url));
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, job?.id]);

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Very light client-side gate — server enforces the real limits (5MB / 10 files).
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(t("editJobModal.imageTooBig") || "Each image must be 5MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const token = getToken();
    if (!token) return;
    setImageBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      const body = await res.json().catch(() => ({}));
      // The upload response shape varies — fall back to a re-fetch when the
      // server doesn't hand back the updated roster directly.
      const returned = Array.isArray(body) ? body : (body.images || body.uploaded || null);
      if (Array.isArray(returned) && returned.length > 0) {
        const fresh = returned.map(normalizeImage).filter((i) => i.url);
        setImages((prev) => [...prev, ...fresh]);
      } else {
        const listRes = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (listRes.ok) {
          const list = await listRes.json();
          const raw = Array.isArray(list) ? list : (list.images || []);
          setImages(raw.map(normalizeImage).filter((i) => i.url));
        }
      }
      toast.success(
        (t("editJobModal.imageUploaded") || "{{count}} image(s) added.")
          .replace("{{count}}", files.length)
      );
    } catch (err) {
      toast.error(err.message || t("editJobModal.imageUploadFailed") || "Couldn't upload images.");
    } finally {
      setImageBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageDelete = async (image) => {
    if (!image?.id) return;
    if (!window.confirm(t("editJobModal.imageDeleteConfirm") || "Remove this image?")) return;
    const token = getToken();
    if (!token) return;
    setImageBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/images/${image.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
      toast.success(t("editJobModal.imageDeleted") || "Image removed.");
    } catch (err) {
      toast.error(t("editJobModal.imageDeleteFailed") || "Couldn't remove image.");
    } finally {
      setImageBusy(false);
    }
  };

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

          {/* Category + Urgency — custom dropdowns for a consistent look with
              the homepage filter chips. Options are localized on the fly. */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ej-category" className="form-label">
                {t("addWorkModal.category") || "Category"}
              </label>
              <CustomSelect
                id="ej-category"
                value={formData.category}
                onChange={(v) => setFormData((p) => ({ ...p, category: v }))}
                options={CATEGORIES.map((c) => ({
                  value: c.value,
                  label: t(`addWorkModal.${c.key}`) || c.value,
                }))}
                placeholder={t("addWorkModal.category") || "Category"}
              />
            </div>
            <div className="form-group">
              <label htmlFor="ej-urgency" className="form-label">
                {t("addWorkModal.urgency") || "Urgency"}
              </label>
              <CustomSelect
                id="ej-urgency"
                value={formData.urgency}
                onChange={(v) => setFormData((p) => ({ ...p, urgency: v }))}
                options={URGENCIES.map((u) => ({
                  value: u.value,
                  label: t(`addWorkModal.${u.key}`) || u.value,
                }))}
                placeholder={t("addWorkModal.urgency") || "Urgency"}
              />
            </div>
          </div>

          {/* Emergency — explicit inline styles so the icon and text don't
              collapse into the checkbox regardless of any parent CSS conflicts. */}
          <div className="form-group">
            <label
              className="checkbox-label"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <input
                type="checkbox"
                name="is_emergency"
                checked={formData.is_emergency}
                onChange={handleChange}
                className="form-checkbox"
                style={{ margin: 0, flexShrink: 0 }}
              />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{t("addWorkModal.markAsEmergency") || "Mark as Emergency"}</span>
              </span>
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
            <label
              className="checkbox-label"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <input
                type="checkbox"
                name="is_budget_hidden"
                checked={formData.is_budget_hidden}
                onChange={handleChange}
                className="form-checkbox"
                style={{ margin: 0, flexShrink: 0 }}
              />
              <span>{t("addWorkModal.budgetVisibilityNote") || "Hide budget from contractors"}</span>
            </label>
          </div>

          {/* Images — thumbnails with X to remove, + button to add more. All
              mutations hit the backend immediately so what you see is what's
              saved (no pending queue). */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 8 }}>
              {t("editJobModal.imagesLabel") || "Photos"}
              <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>
                {t("editJobModal.imagesHint") || "(add, remove — max 5MB each)"}
              </span>
            </label>

            {imagesLoading ? (
              <div style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}>
                {t("editJobModal.imagesLoading") || "Loading photos…"}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
                  gap: 8,
                }}
              >
                {images.map((img) => (
                  <div
                    key={img.id || img.url}
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "100%",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                      background: "#f8fafc",
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(img)}
                      disabled={imageBusy || !img.id}
                      title={t("editJobModal.removeImage") || "Remove"}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        background: "rgba(15,34,61,0.85)", color: "#fff",
                        border: "none", borderRadius: "50%",
                        width: 22, height: 22, cursor: imageBusy ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Add-more tile — matches the aspect of the thumbnails so
                    the grid stays even. Clicks the hidden file input. */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageBusy}
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "100%",
                    borderRadius: 8,
                    border: "2px dashed #cbd5e1",
                    background: "#f8fafc",
                    cursor: imageBusy ? "not-allowed" : "pointer",
                    color: "#14919B",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {imageBusy
                      ? <Loader2 size={18} className="preview-spinner" />
                      : <ImagePlus size={20} />}
                    <span>{imageBusy
                      ? (t("editJobModal.imageWorking") || "Working…")
                      : (t("editJobModal.addImage") || "Add photo")}</span>
                  </div>
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImagePick}
              style={{ display: "none" }}
            />
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
