// =============================================================================
// AdminPropertyFormModal
// Create OR edit a property as an admin acting on behalf of any property manager.
// Reused for both create (no `property` prop) and edit (with `property` prop).
//
// On submit, posts to /api/admin/properties or /api/admin/properties/:id with
// a `manager_user_id` field pointing at the selected manager.
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { X, Building2, User, MapPin, Hash, Layers, AlertCircle, Save, Plus, Shield } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import PropertyLocationPicker from "./PropertyLocationPicker";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const BUILDING_TYPES = [
  "Apartment", "Condominium", "High-Rise", "Townhouse", "Duplex", "Triplex",
  "Single Family", "Multi-Family", "Commercial Building", "Mixed-Use",
  "Student Housing", "Senior Living",
];

const initialForm = {
  ownership: "admin", // "admin" | "manager"
  manager_user_id: "",
  building_name: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  num_units: "",
  building_type: "Apartment",
  latitude: "",
  longitude: "",
};

export default function AdminPropertyFormModal({
  isOpen,
  onClose,
  onSuccess,
  property = null, // null = create, object = edit
}) {
  const { getToken } = useAdminAuth();
  const isEdit = !!property;

  const [formData, setFormData] = useState(initialForm);
  const [managers, setManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Hydrate form from existing property when editing
  useEffect(() => {
    if (!isOpen) return;
    if (property) {
      setFormData({
        ownership: property.admin_owner_id ? "admin" : "manager",
        manager_user_id: property.manager_user_id || "",
        building_name: property.building_name || "",
        address: property.address || "",
        city: property.city || "",
        province: property.province || "",
        postal_code: property.postal_code || "",
        num_units: property.num_units ?? "",
        building_type: property.building_type || "Apartment",
        latitude: property.latitude || "",
        longitude: property.longitude || "",
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [isOpen, property]);

  // Fetch managers list once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchManagers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      console.error(e);
      toast.error(e.message || "Failed to load managers");
    } finally {
      setLoadingManagers(false);
    }
  };

  // Debounced refetch when search changes
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => fetchManagers(managerSearch), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerSearch]);

  const selectedManager = useMemo(
    () => managers.find((m) => m.user_id === formData.manager_user_id),
    [managers, formData.manager_user_id]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const err = {};
    if (formData.ownership === "manager" && !formData.manager_user_id) {
      err.manager_user_id = "Pick a property manager";
    }
    if (!formData.address.trim()) err.address = "Address is required";
    if (!formData.city.trim()) err.city = "City is required";
    if (formData.num_units !== "" && Number(formData.num_units) < 0) {
      err.num_units = "Cannot be negative";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const url = isEdit
        ? `${API_URL}/api/admin/properties/${property.id}`
        : `${API_URL}/api/admin/properties`;
      const method = isEdit ? "PUT" : "POST";

      const body = {
        ownership: formData.ownership,
        manager_user_id:
          formData.ownership === "manager" ? formData.manager_user_id : null,
        building_name: formData.building_name || null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        province: formData.province || null,
        postal_code: formData.postal_code || null,
        num_units: formData.num_units === "" ? 0 : parseInt(formData.num_units, 10),
        building_type: formData.building_type,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
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
      if (!res.ok) throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} property`);

      toast.success(isEdit ? "Property updated" : "Property created");
      onSuccess?.(data.property);
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
            <Building2 size={22} />
            <span>{isEdit ? "Edit property" : "Create property"}</span>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={S.body}>
          {/* Ownership toggle — admin self-owns OR acts on behalf of a manager */}
          <div style={S.section}>
            <label style={S.label}>Ownership</label>
            <div style={S.toggleRow}>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, ownership: "admin" }))}
                style={{
                  ...S.toggleBtn,
                  ...(formData.ownership === "admin" ? S.toggleBtnActive : {}),
                }}
              >
                <Shield size={14} />
                <span>
                  <strong>As admin</strong>
                  <em style={S.toggleSub}>You own this property</em>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, ownership: "manager" }))}
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

          {/* Manager picker — only when ownership === "manager" */}
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
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, manager_user_id: m.user_id }))
                        }
                        style={{
                          ...S.managerItem,
                          ...(selected ? S.managerItemSelected : {}),
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <strong style={{ color: "#0F223D" }}>
                            {m.company_name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email}
                          </strong>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>
                            {m.email}
                            {m.company_name && (m.first_name || m.last_name)
                              ? ` · ${m.first_name || ""} ${m.last_name || ""}`.trim()
                              : ""}
                          </span>
                        </div>
                        <span style={S.managerCount}>{m.property_count} props</span>
                      </button>
                    );
                  })
                )}
              </div>
              {errors.manager_user_id && <FieldError msg={errors.manager_user_id} />}
              {selectedManager && (
                <div style={S.selectedNotice}>
                  <User size={12} /> Acting on behalf of:{" "}
                  <strong>
                    {selectedManager.company_name ||
                      `${selectedManager.first_name || ""} ${selectedManager.last_name || ""}`.trim()}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Map picker — click to drop pin, auto-fills address below */}
          <div style={S.section}>
            <label style={S.label}>Location (click map or search)</label>
            <PropertyLocationPicker
              lat={formData.latitude || null}
              lng={formData.longitude || null}
              onPick={({ lat, lng, address, city, province, postal_code }) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: String(lat),
                  longitude: String(lng),
                  // Only overwrite text fields when the geocoder returned a value,
                  // so partial responses don't blank manual edits.
                  ...(address ? { address } : {}),
                  ...(city ? { city } : {}),
                  ...(province ? { province } : {}),
                  ...(postal_code ? { postal_code } : {}),
                }));
                if (errors.address) setErrors((e) => ({ ...e, address: null }));
                if (errors.city) setErrors((e) => ({ ...e, city: null }));
              }}
            />
          </div>

          {/* Property fields */}
          <div style={S.section}>
            <Row>
              <Field label="Building name" htmlFor="building_name">
                <input
                  id="building_name"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="e.g. Oak Tower"
                />
              </Field>
              <Field label="Building type" htmlFor="building_type">
                <select
                  id="building_type"
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  style={S.input}
                >
                  {BUILDING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>

            <Field label="Address" htmlFor="address" required>
              <div style={S.inputWithIcon}>
                <MapPin size={16} style={S.icon} />
                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ ...S.input, paddingLeft: 36 }}
                  placeholder="e.g. 456 Oak Avenue"
                />
              </div>
              {errors.address && <FieldError msg={errors.address} />}
            </Field>

            <Row>
              <Field label="City" htmlFor="city" required>
                <input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="e.g. Montreal"
                />
                {errors.city && <FieldError msg={errors.city} />}
              </Field>
              <Field label="Province / State" htmlFor="province">
                <input
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="e.g. QC"
                />
              </Field>
            </Row>

            <Row>
              <Field label="Postal code" htmlFor="postal_code">
                <input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="e.g. H2X 1Y4"
                />
              </Field>
              <Field label="Number of units" htmlFor="num_units">
                <div style={S.inputWithIcon}>
                  <Layers size={16} style={S.icon} />
                  <input
                    id="num_units"
                    name="num_units"
                    type="number"
                    min="0"
                    value={formData.num_units}
                    onChange={handleChange}
                    style={{ ...S.input, paddingLeft: 36 }}
                    placeholder="e.g. 12"
                  />
                </div>
                {errors.num_units && <FieldError msg={errors.num_units} />}
              </Field>
            </Row>
          </div>

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
                : "Create property"}
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

function Field({ label, htmlFor, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={S.label}>
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

// =============================================================================
// Inline styles — kept here so the modal is fully self-contained.
// =============================================================================
const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,34,61,0.45)",
    backdropFilter: "blur(3px)",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#fff",
    width: "100%",
    maxWidth: 680,
    height: "min(720px, 90vh)",
    maxHeight: "90vh",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 50px rgba(15,34,61,0.18)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    background: "#0F223D",
    color: "#fff",
    flexShrink: 0,
  },
  title: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: "1rem" },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
  },
  body: {
    padding: 20,
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  banner: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px",
    background: "#E0F7F8",
    border: "1px solid #B3E8EA",
    borderRadius: 8,
    fontSize: 12,
    color: "#0F223D",
  },
  section: { display: "flex", flexDirection: "column", gap: 12 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  req: { color: "#dc2626" },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    color: "#0F223D",
    background: "#fff",
    outline: "none",
  },
  inputWithIcon: { position: "relative" },
  icon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
  managerList: {
    maxHeight: 180,
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
  },
  managerItem: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #f3f4f6",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "inherit",
    textAlign: "left",
    fontSize: 13,
  },
  managerItemSelected: {
    background: "rgba(0,165,169,0.08)",
    borderLeft: "3px solid #00A5A9",
  },
  managerCount: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: 10,
  },
  selectedNotice: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#0F223D",
    padding: "6px 10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
  },
  muted: { padding: 14, color: "#9ca3af", fontSize: 13, textAlign: "center" },
  err: {
    display: "flex", alignItems: "center", gap: 4,
    color: "#dc2626", fontSize: 11, marginTop: 4,
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 8,
    paddingTop: 8,
    borderTop: "1px solid #e5e7eb",
    marginTop: 4,
  },
  cancelBtn: {
    padding: "9px 18px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 18px",
    background: "#00A5A9",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
  },
  toggleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    color: "#0F223D",
    transition: "border-color 0.15s, background 0.15s",
  },
  toggleBtnActive: {
    borderColor: "#00A5A9",
    background: "rgba(0,165,169,0.06)",
    boxShadow: "0 0 0 3px rgba(0,165,169,0.08)",
  },
  toggleSub: { display: "block", fontSize: 11, color: "#6b7280", fontStyle: "normal", marginTop: 2 },
};
