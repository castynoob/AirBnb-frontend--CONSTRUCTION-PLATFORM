// =============================================================================
// AdminJobFormModal
// Create OR edit a job as an admin acting on behalf of any property manager.
// Mirrors the PM AddWorkForm fields (title, category, urgency, budget, etc.)
// plus a manager + property selector at the top.
//
// On submit, posts to /api/admin/jobs or /api/admin/jobs/:id with both
// `manager_user_id` and `property_id` set.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  X, Briefcase, User, Building2, AlertCircle, Save, Plus, DollarSign, Calendar, Tag, Shield,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Roofing", "Masonry", "Painting",
  "Flooring", "Landscaping", "Windows/Doors", "General Repair", "Carpentry", "Other",
];

const URGENCY_LEVELS = ["Low", "Medium", "High", "Urgent", "Planned"];

const initialForm = {
  ownership: "admin", // "admin" | "manager"
  manager_user_id: "",
  property_id: "",
  title: "",
  description: "",
  category: "General Repair",
  urgency: "Medium",
  due_date: "",
  estimated_duration_days: "",
  budget_min: "",
  budget_max: "",
  is_budget_hidden: false,
  is_emergency: false,
};

export default function AdminJobFormModal({
  isOpen,
  onClose,
  onSuccess,
  job = null, // null = create, object = edit
}) {
  const { getToken } = useAdminAuth();
  const isEdit = !!job;

  const [formData, setFormData] = useState(initialForm);
  const [managers, setManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Hydrate form from job when editing
  useEffect(() => {
    if (!isOpen) return;
    if (job) {
      setFormData({
        ownership: job.admin_owner_id ? "admin" : "manager",
        manager_user_id: job.manager_user_id || "",
        property_id: job.property_id || "",
        title: job.title || "",
        description: job.description || "",
        category: job.category || "General Repair",
        urgency: job.urgency || "Medium",
        due_date: job.due_date ? job.due_date.slice(0, 10) : "",
        estimated_duration_days: job.estimated_duration_days ?? "",
        budget_min: job.budget_min ?? "",
        budget_max: job.budget_max ?? "",
        is_budget_hidden: !!job.is_budget_hidden,
        is_emergency: !!job.is_emergency,
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [isOpen, job]);

  // Fetch managers
  const fetchManagers = async (search) => {
    try {
      setLoadingManagers(true);
      const url = new URL(`${API_URL}/api/admin/managers`);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load managers");
      setManagers(data.managers || []);
    } catch (e) {
      toast.error(e.message || "Failed to load managers");
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchManagers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => fetchManagers(managerSearch), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerSearch]);

  // Fetch properties scoped to the current ownership choice.
  // - admin mode → /api/admin/my-properties (admin's own portfolio)
  // - manager mode → all-platform list, filtered to the chosen manager
  useEffect(() => {
    const fetchProps = async () => {
      // Skip in manager mode until a manager is picked.
      if (formData.ownership === "manager" && !formData.manager_user_id) {
        setProperties([]);
        return;
      }
      try {
        setLoadingProps(true);
        let url;
        if (formData.ownership === "admin") {
          url = `${API_URL}/api/admin/my-properties`;
        } else {
          url = `${API_URL}/api/admin/properties?limit=200`;
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load properties");

        let list = data.properties || [];
        if (formData.ownership === "manager") {
          const selectedManager = managers.find((m) => m.user_id === formData.manager_user_id);
          list = list.filter(
            (p) =>
              p.manager_profile_id === selectedManager?.manager_profile_id ||
              p.manager_id === selectedManager?.manager_profile_id
          );
        }
        setProperties(list);

        // If the currently-selected property no longer matches the new scope, clear it.
        if (formData.property_id && !list.find((p) => p.id === formData.property_id)) {
          setFormData((prev) => ({ ...prev, property_id: "" }));
        }
      } catch (e) {
        toast.error(e.message || "Failed to load properties");
        setProperties([]);
      } finally {
        setLoadingProps(false);
      }
    };
    if (isOpen) fetchProps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.ownership, formData.manager_user_id, managers]);

  const selectedManager = useMemo(
    () => managers.find((m) => m.user_id === formData.manager_user_id),
    [managers, formData.manager_user_id]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const err = {};
    if (formData.ownership === "manager" && !formData.manager_user_id) {
      err.manager_user_id = "Pick a property manager";
    }
    if (!formData.property_id) err.property_id = "Pick a property";
    if (!formData.title.trim()) err.title = "Title is required";
    if (formData.budget_min === "" || formData.budget_max === "")
      err.budget = "Budget min and max are required";
    else if (parseFloat(formData.budget_min) > parseFloat(formData.budget_max))
      err.budget = "Max budget must be greater than min";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const url = isEdit
        ? `${API_URL}/api/admin/jobs/${job.id}`
        : `${API_URL}/api/admin/jobs`;
      const method = isEdit ? "PUT" : "POST";

      const body = {
        ownership: formData.ownership,
        manager_user_id:
          formData.ownership === "manager" ? formData.manager_user_id : null,
        property_id: formData.property_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        urgency: formData.urgency,
        due_date: formData.due_date || null,
        estimated_duration_days:
          formData.estimated_duration_days === ""
            ? null
            : parseInt(formData.estimated_duration_days, 10),
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        is_budget_hidden: !!formData.is_budget_hidden,
        is_emergency: !!formData.is_emergency,
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} job`);

      toast.success(isEdit ? "Job updated" : "Job created");
      onSuccess?.(data.job);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>
            <Briefcase size={22} />
            <span>{isEdit ? "Edit job" : "Create job"}</span>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={S.body}>
          {/* Ownership toggle */}
          <div style={S.section}>
            <label style={S.label}>Ownership</label>
            <div style={S.toggleRow}>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, ownership: "admin", property_id: "" }))}
                style={{
                  ...S.toggleBtn,
                  ...(formData.ownership === "admin" ? S.toggleBtnActive : {}),
                }}
              >
                <Shield size={14} />
                <span>
                  <strong>As admin</strong>
                  <em style={S.toggleSub}>You own this job</em>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, ownership: "manager", property_id: "" }))}
                style={{
                  ...S.toggleBtn,
                  ...(formData.ownership === "manager" ? S.toggleBtnActive : {}),
                }}
              >
                <User size={14} />
                <span>
                  <strong>On behalf of</strong>
                  <em style={S.toggleSub}>Assign to a property manager</em>
                </span>
              </button>
            </div>
          </div>

          {/* Manager picker — only in manager mode */}
          {formData.ownership === "manager" && (
            <div style={S.section}>
              <label style={S.label}>
                Property manager <span style={S.req}>*</span>
              </label>
              <input
                type="text"
                placeholder="Search by name, company, or email..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                style={S.input}
              />
              <div style={S.managerList}>
                {loadingManagers ? (
                  <div style={S.muted}>Loading…</div>
                ) : managers.length === 0 ? (
                  <div style={S.muted}>No managers found.</div>
                ) : (
                  managers.map((m) => {
                    const selected = m.user_id === formData.manager_user_id;
                    return (
                      <button
                        type="button"
                        key={m.user_id}
                        onClick={() => setFormData((prev) => ({ ...prev, manager_user_id: m.user_id }))}
                        style={{ ...S.managerItem, ...(selected ? S.managerItemSelected : {}) }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <strong style={{ color: "#0F223D" }}>
                            {m.company_name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email}
                          </strong>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>{m.email}</span>
                        </div>
                        <span style={S.managerCount}>{m.property_count} props</span>
                      </button>
                    );
                  })
                )}
              </div>
              {errors.manager_user_id && <FieldError msg={errors.manager_user_id} />}
            </div>
          )}

          {/* Property picker — admin mode lists my-properties, manager mode lists chosen manager's properties */}
          {(formData.ownership === "admin" || selectedManager) && (
            <div style={S.section}>
              <label style={S.label}>
                Property <span style={S.req}>*</span>
              </label>
              {loadingProps ? (
                <div style={S.muted}>Loading properties…</div>
              ) : properties.length === 0 ? (
                <div style={S.muted}>
                  {formData.ownership === "admin"
                    ? "You don't have any admin-owned properties yet. Create one from 'My Properties' first."
                    : "This manager has no properties yet. Create one first, then come back."}
                </div>
              ) : (
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  style={S.input}
                >
                  <option value="">-- Pick a property --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.building_name || p.address} — {p.city}
                    </option>
                  ))}
                </select>
              )}
              {errors.property_id && <FieldError msg={errors.property_id} />}
            </div>
          )}

          {/* Job fields — only show once owner + property are picked (or in edit mode) */}
          {(isEdit ||
            (formData.property_id &&
              (formData.ownership === "admin" ||
                (formData.ownership === "manager" && formData.manager_user_id)))) && (
            <div style={S.section}>
              <Field label="Title" required>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="e.g. Replace damaged components"
                />
                {errors.title && <FieldError msg={errors.title} />}
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...S.input, resize: "vertical", minHeight: 70 }}
                  placeholder="Detailed description of the work needed..."
                />
              </Field>

              <Row>
                <Field label="Category">
                  <div style={S.inputWithIcon}>
                    <Tag size={16} style={S.icon} />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={{ ...S.input, paddingLeft: 36 }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Urgency">
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    style={S.input}
                  >
                    {URGENCY_LEVELS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Row>
                <Field label="Due date">
                  <div style={S.inputWithIcon}>
                    <Calendar size={16} style={S.icon} />
                    <input
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                      style={{ ...S.input, paddingLeft: 36 }}
                    />
                  </div>
                </Field>
                <Field label="Estimated duration (days)">
                  <input
                    name="estimated_duration_days"
                    type="number"
                    min="0"
                    value={formData.estimated_duration_days}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="e.g. 5"
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Budget min ($)" required>
                  <div style={S.inputWithIcon}>
                    <DollarSign size={16} style={S.icon} />
                    <input
                      name="budget_min"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_min}
                      onChange={handleChange}
                      style={{ ...S.input, paddingLeft: 36 }}
                    />
                  </div>
                </Field>
                <Field label="Budget max ($)" required>
                  <div style={S.inputWithIcon}>
                    <DollarSign size={16} style={S.icon} />
                    <input
                      name="budget_max"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_max}
                      onChange={handleChange}
                      style={{ ...S.input, paddingLeft: 36 }}
                    />
                  </div>
                </Field>
              </Row>
              {errors.budget && <FieldError msg={errors.budget} />}

              <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                <label style={S.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_budget_hidden"
                    checked={formData.is_budget_hidden}
                    onChange={handleChange}
                  />
                  Hide budget from contractors
                </label>
                <label style={S.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_emergency"
                    checked={formData.is_emergency}
                    onChange={handleChange}
                  />
                  Mark as emergency
                </label>
              </div>
            </div>
          )}

          <div style={S.footer}>
            <button type="button" style={S.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={S.primaryBtn} disabled={submitting}>
              {isEdit ? <Save size={16} /> : <Plus size={16} />}
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                ? "Save changes"
                : "Create job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={S.label}>
        {label} {required && <span style={S.req}>*</span>}
      </label>
      {children}
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <div style={S.err}>
      <AlertCircle size={12} /> {msg}
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,34,61,0.45)", backdropFilter: "blur(3px)",
    zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", width: "100%", maxWidth: 720,
    height: "min(720px, 90vh)", maxHeight: "90vh",
    borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 50px rgba(15,34,61,0.18)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", background: "#0F223D", color: "#fff", flexShrink: 0,
  },
  title: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: "1rem" },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
  },
  body: { padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  banner: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px", background: "#E0F7F8", border: "1px solid #B3E8EA",
    borderRadius: 8, fontSize: 12, color: "#0F223D",
  },
  section: { display: "flex", flexDirection: "column", gap: 12 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 },
  req: { color: "#dc2626" },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", color: "#0F223D", background: "#fff", outline: "none",
  },
  inputWithIcon: { position: "relative" },
  icon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
  managerList: {
    maxHeight: 160, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff",
  },
  managerItem: {
    width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid #f3f4f6",
    background: "#fff", cursor: "pointer", display: "flex",
    justifyContent: "space-between", alignItems: "center",
    fontFamily: "inherit", textAlign: "left", fontSize: 13,
  },
  managerItemSelected: { background: "rgba(0,165,169,0.08)", borderLeft: "3px solid #00A5A9" },
  managerCount: {
    fontSize: 11, fontWeight: 600, color: "#6b7280",
    background: "#f3f4f6", padding: "2px 8px", borderRadius: 10,
  },
  muted: { padding: 14, color: "#9ca3af", fontSize: 13, textAlign: "center" },
  err: { display: "flex", alignItems: "center", gap: 4, color: "#dc2626", fontSize: 11, marginTop: 4 },
  checkboxLabel: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer",
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 8,
    paddingTop: 8, borderTop: "1px solid #e5e7eb", marginTop: 4,
  },
  cancelBtn: {
    padding: "9px 18px", background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 8, fontWeight: 500, color: "#374151", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 18px", background: "#00A5A9", border: "none",
    borderRadius: 8, fontWeight: 600, color: "#fff", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14,
  },
  toggleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  toggleBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer", fontFamily: "inherit",
    textAlign: "left", color: "#0F223D",
    transition: "border-color 0.15s, background 0.15s",
  },
  toggleBtnActive: {
    borderColor: "#00A5A9",
    background: "rgba(0,165,169,0.06)",
    boxShadow: "0 0 0 3px rgba(0,165,169,0.08)",
  },
  toggleSub: { display: "block", fontSize: 11, color: "#6b7280", fontStyle: "normal", marginTop: 2 },
};
