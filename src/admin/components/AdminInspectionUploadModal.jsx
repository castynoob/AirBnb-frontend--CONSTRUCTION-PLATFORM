// =============================================================================
// AdminInspectionUploadModal
// Mirror of the property-manager inspection-upload flow for admin users:
//   1. Pick ownership (admin / on-behalf-of-manager) and property
//   2. Upload an Excel file (.xlsx, .xls, .csv) → backend parses with AI
//   3. Review and edit the parsed jobs in an inline table
//   4. Submit → bulk-create the jobs under the right owner
// =============================================================================

import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import {
  X, Upload, FileSpreadsheet, Trash2, Plus, Shield, User, AlertCircle, Loader2, Save, CheckCircle2,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Roofing", "Masonry", "Painting",
  "Flooring", "Landscaping", "Windows/Doors", "General Repair", "Carpentry", "Other",
];
const URGENCY_LEVELS = ["Low", "Medium", "High", "Urgent", "Planned"];

const COLUMNS = [
  { key: "title",       label: "Title",      width: 160 },
  { key: "description", label: "Description", width: 240 },
  { key: "category",    label: "Category",   width: 130, type: "select", options: CATEGORIES },
  { key: "urgency",     label: "Urgency",    width: 110, type: "select", options: URGENCY_LEVELS },
  { key: "budget_min",  label: "Min $",      width: 90,  type: "number" },
  { key: "budget_max",  label: "Max $",      width: 90,  type: "number" },
  { key: "location",    label: "Location",   width: 130 },
  { key: "dueDate",     label: "Due date",   width: 130, type: "date" },
];

export default function AdminInspectionUploadModal({ isOpen, onClose, onSuccess }) {
  const { getToken } = useAdminAuth();

  // Step state: "setup" → "review" → done
  const [step, setStep] = useState("setup");

  // Ownership + property selection
  const [ownership, setOwnership] = useState("admin");
  const [managerUserId, setManagerUserId] = useState("");
  const [managers, setManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [loadingProps, setLoadingProps] = useState(false);

  // File upload state
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);

  // Parsed jobs (editable table)
  const [jobs, setJobs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) return;
    setStep("setup");
    setOwnership("admin");
    setManagerUserId("");
    setPropertyId("");
    setFile(null);
    setJobs([]);
    setManagerSearch("");
  }, [isOpen]);

  // Fetch managers (only when ownership === "manager")
  useEffect(() => {
    if (!isOpen) return;
    if (ownership !== "manager") {
      setManagers([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoadingManagers(true);
        const url = new URL(`${API_URL}/api/admin/managers`);
        if (managerSearch.trim()) url.searchParams.set("search", managerSearch.trim());
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
        setManagers(data.managers || []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoadingManagers(false);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ownership, managerSearch]);

  // Fetch properties for the chosen scope
  useEffect(() => {
    if (!isOpen) return;
    if (ownership === "manager" && !managerUserId) {
      setProperties([]);
      return;
    }
    const fetchProps = async () => {
      try {
        setLoadingProps(true);
        const url =
          ownership === "admin"
            ? `${API_URL}/api/admin/my-properties`
            : `${API_URL}/api/admin/properties?limit=200`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
        let list = data.properties || [];
        if (ownership === "manager") {
          const m = managers.find((mm) => mm.user_id === managerUserId);
          list = list.filter(
            (p) =>
              p.manager_id === m?.manager_profile_id ||
              p.manager_profile_id === m?.manager_profile_id
          );
        }
        setProperties(list);
        // Clear selection if it doesn't match the new scope.
        if (propertyId && !list.find((p) => p.id === propertyId)) {
          setPropertyId("");
        }
      } catch (e) {
        toast.error(e.message);
        setProperties([]);
      } finally {
        setLoadingProps(false);
      }
    };
    fetchProps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ownership, managerUserId, managers]);

  const selectedManager = useMemo(
    () => managers.find((m) => m.user_id === managerUserId),
    [managers, managerUserId]
  );

  // -----------------------------------------------------------------------
  // Step 1 → Step 2: upload Excel
  // -----------------------------------------------------------------------
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload a valid Excel file (.xlsx, .xls, or .csv)");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!propertyId) {
      toast.error("Pick a property first");
      return;
    }
    if (!file) {
      toast.error("Choose an Excel file");
      return;
    }

    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("property_id", propertyId);

      const res = await fetch(`${API_URL}/api/admin/inspections/parse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Parse failed");

      const parsedJobs = (data.parsedData?.jobs || []).map((j, i) => ({
        _id: `parsed-${i}`,
        title: j.title || "",
        description: j.description || "",
        category: j.category || "Other",
        urgency: j.urgency || "Medium",
        budget_min: j.budget_min ?? "",
        budget_max: j.budget_max ?? "",
        location: j.location || "",
        dueDate: j.dueDate || j.due_date || "",
      }));

      if (parsedJobs.length === 0) {
        toast.error("No jobs found in the file");
        return;
      }

      setJobs(parsedJobs);
      setStep("review");
      toast.success(`Parsed ${parsedJobs.length} job(s) — review and submit.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setParsing(false);
    }
  };

  // -----------------------------------------------------------------------
  // Step 2 helpers — edit / remove / add rows
  // -----------------------------------------------------------------------
  const updateRow = (id, field, value) => {
    setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, [field]: value } : j)));
  };
  const removeRow = (id) => setJobs((prev) => prev.filter((j) => j._id !== id));
  const addRow = () =>
    setJobs((prev) => [
      ...prev,
      {
        _id: `new-${Date.now()}`,
        title: "",
        description: "",
        category: "General Repair",
        urgency: "Medium",
        budget_min: "",
        budget_max: "",
        location: "",
        dueDate: "",
      },
    ]);

  // -----------------------------------------------------------------------
  // Step 2 → submit: bulk-create jobs
  // -----------------------------------------------------------------------
  const handleSubmit = async () => {
    // Client-side sanity: require a title and budget on every row.
    const invalid = jobs.findIndex(
      (j) => !j.title.trim() || j.budget_min === "" || j.budget_max === ""
    );
    if (invalid !== -1) {
      toast.error(`Row ${invalid + 1}: title, min and max budget are required.`);
      return;
    }
    for (const [i, j] of jobs.entries()) {
      if (parseFloat(j.budget_min) > parseFloat(j.budget_max)) {
        toast.error(`Row ${i + 1}: max budget must be ≥ min`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        property_id: propertyId,
        ownership,
        manager_user_id: ownership === "manager" ? managerUserId : null,
        jobs: jobs.map((j) => ({
          title: j.title.trim(),
          description: j.description || "",
          category: j.category,
          urgency: j.urgency,
          budget_min: parseFloat(j.budget_min),
          budget_max: parseFloat(j.budget_max),
          location: j.location || null,
          dueDate: j.dueDate || null,
        })),
      };

      const res = await fetch(`${API_URL}/api/admin/inspections/create-jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Create failed");

      toast.success(data.message || `Created ${data.jobs?.length || 0} job(s)`);
      onSuccess?.(data.jobs || []);
      onClose?.();
    } catch (e) {
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
            <FileSpreadsheet size={22} />
            <span>{step === "setup" ? "Import jobs from Excel" : "Review & submit jobs"}</span>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {step === "setup" ? (
          <div style={S.body}>
            {/* Ownership */}
            <div style={S.section}>
              <label style={S.label}>Ownership</label>
              <div style={S.toggleRow}>
                <button
                  type="button"
                  onClick={() => { setOwnership("admin"); setPropertyId(""); }}
                  style={{ ...S.toggleBtn, ...(ownership === "admin" ? S.toggleBtnActive : {}) }}
                >
                  <Shield size={14} />
                  <span>
                    <strong>As admin</strong>
                    <em style={S.toggleSub}>You'll own these jobs</em>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setOwnership("manager"); setPropertyId(""); }}
                  style={{ ...S.toggleBtn, ...(ownership === "manager" ? S.toggleBtnActive : {}) }}
                >
                  <User size={14} />
                  <span>
                    <strong>On behalf of</strong>
                    <em style={S.toggleSub}>Assign to a property manager</em>
                  </span>
                </button>
              </div>
            </div>

            {/* Manager picker */}
            {ownership === "manager" && (
              <div style={S.section}>
                <label style={S.label}>Property manager <span style={S.req}>*</span></label>
                <input
                  type="text"
                  placeholder="Search by name, company, or email…"
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
                      const sel = m.user_id === managerUserId;
                      return (
                        <button
                          type="button"
                          key={m.user_id}
                          onClick={() => setManagerUserId(m.user_id)}
                          style={{ ...S.managerItem, ...(sel ? S.managerItemSelected : {}) }}
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
              </div>
            )}

            {/* Property picker */}
            {(ownership === "admin" || selectedManager) && (
              <div style={S.section}>
                <label style={S.label}>Property <span style={S.req}>*</span></label>
                {loadingProps ? (
                  <div style={S.muted}>Loading properties…</div>
                ) : properties.length === 0 ? (
                  <div style={S.muted}>
                    {ownership === "admin"
                      ? "You don't have any admin-owned properties yet. Create one from 'My Properties' first."
                      : "This manager has no properties yet."}
                  </div>
                ) : (
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
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
              </div>
            )}

            {/* File picker */}
            {propertyId && (
              <div style={S.section}>
                <label style={S.label}>Excel file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={S.fileBtn}
                >
                  <Upload size={16} />
                  {file ? file.name : "Choose .xlsx, .xls, or .csv"}
                </button>
                <p style={S.hint}>
                  The first row should be column headers. The parser auto-detects
                  fields like "Title", "Job Title", "Tâche", "Description",
                  "Budget", "Category", etc. — in English or French.
                </p>
              </div>
            )}

            <div style={S.footer}>
              <button type="button" style={S.cancelBtn} onClick={onClose} disabled={parsing}>
                Cancel
              </button>
              <button
                type="button"
                style={{ ...S.primaryBtn, ...(parsing || !file || !propertyId ? S.btnDisabled : {}) }}
                onClick={handleUpload}
                disabled={parsing || !file || !propertyId}
              >
                {parsing ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                {parsing ? "Parsing…" : "Parse Excel"}
              </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
          </div>
        ) : (
          // ─── Step 2: review parsed jobs ─────────────────────────────────────
          <div style={S.body}>
            <div style={S.banner}>
              <CheckCircle2 size={14} color="#059669" />
              <span>
                <strong>{jobs.length} job(s)</strong> ready. Adjust any row, remove
                what you don't want, or add new ones, then submit.
              </span>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.thNum}>#</th>
                    {COLUMNS.map((c) => (
                      <th key={c.key} style={{ ...S.th, minWidth: c.width }}>{c.label}</th>
                    ))}
                    <th style={S.thAct}></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j, idx) => (
                    <tr key={j._id} style={S.tr}>
                      <td style={S.tdNum}>{idx + 1}</td>
                      {COLUMNS.map((c) => (
                        <td key={c.key} style={S.td}>
                          {c.type === "select" ? (
                            <select
                              value={j[c.key]}
                              onChange={(e) => updateRow(j._id, c.key, e.target.value)}
                              style={S.cellInput}
                            >
                              {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type={c.type || "text"}
                              value={j[c.key] ?? ""}
                              onChange={(e) => updateRow(j._id, c.key, e.target.value)}
                              style={S.cellInput}
                              placeholder={c.label}
                              step={c.type === "number" ? "0.01" : undefined}
                            />
                          )}
                        </td>
                      ))}
                      <td style={S.tdAct}>
                        <button
                          type="button"
                          onClick={() => removeRow(j._id)}
                          style={S.deleteBtn}
                          title="Remove this row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addRow} style={S.addRowBtn}>
              <Plus size={14} /> Add row
            </button>

            <div style={S.footer}>
              <button type="button" style={S.cancelBtn} onClick={() => setStep("setup")} disabled={submitting}>
                Back
              </button>
              <button
                type="button"
                style={{ ...S.primaryBtn, ...(submitting || jobs.length === 0 ? S.btnDisabled : {}) }}
                onClick={handleSubmit}
                disabled={submitting || jobs.length === 0}
              >
                {submitting ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                {submitting ? "Creating…" : `Create ${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,34,61,0.45)",
    backdropFilter: "blur(3px)", zIndex: 1100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", width: "100%", maxWidth: 1000,
    height: "min(720px, 90vh)", maxHeight: "90vh",
    borderRadius: 14, overflow: "hidden",
    display: "flex", flexDirection: "column",
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
  section: { display: "flex", flexDirection: "column", gap: 8 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151" },
  req: { color: "#dc2626" },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#0F223D",
    background: "#fff", outline: "none",
  },
  managerList: { maxHeight: 160, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" },
  managerItem: {
    width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid #f3f4f6",
    background: "#fff", cursor: "pointer", display: "flex",
    justifyContent: "space-between", alignItems: "center",
    fontFamily: "inherit", textAlign: "left", fontSize: 13,
  },
  managerItemSelected: { background: "rgba(0,165,169,0.08)", borderLeft: "3px solid #00A5A9" },
  managerCount: { fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 10 },
  muted: { padding: 14, color: "#9ca3af", fontSize: 13, textAlign: "center" },
  fileBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "12px 16px", background: "#f8fafc", border: "1.5px dashed #b3e8ea",
    borderRadius: 10, color: "#0F223D", cursor: "pointer", fontFamily: "inherit",
    fontSize: 14, fontWeight: 500, width: "100%", justifyContent: "center",
  },
  hint: { fontSize: 11, color: "#6b7280", margin: 0 },
  toggleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  toggleBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer", fontFamily: "inherit",
    textAlign: "left", color: "#0F223D",
  },
  toggleBtnActive: {
    borderColor: "#00A5A9", background: "rgba(0,165,169,0.06)",
    boxShadow: "0 0 0 3px rgba(0,165,169,0.08)",
  },
  toggleSub: { display: "block", fontSize: 11, color: "#6b7280", fontStyle: "normal", marginTop: 2 },
  banner: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 8, fontSize: 13, color: "#0F223D",
  },
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 10, overflow: "auto", maxHeight: 360 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: {
    textAlign: "left", padding: "8px 10px", background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb", fontSize: 10, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600,
    position: "sticky", top: 0, zIndex: 1,
  },
  thNum: { textAlign: "center", padding: "8px 6px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: 10, color: "#9ca3af", width: 32, position: "sticky", top: 0, zIndex: 1 },
  thAct: { background: "#f8fafc", borderBottom: "1px solid #e5e7eb", width: 36, position: "sticky", top: 0, zIndex: 1 },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "4px 6px", verticalAlign: "middle" },
  tdNum: { textAlign: "center", color: "#9ca3af", fontSize: 11, padding: "4px 0" },
  tdAct: { padding: "4px 6px" },
  cellInput: {
    width: "100%", padding: "6px 8px", border: "1px solid transparent", borderRadius: 4,
    fontSize: 12, fontFamily: "inherit", color: "#0F223D", background: "transparent", outline: "none",
  },
  deleteBtn: {
    width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#fff", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", cursor: "pointer",
  },
  addRowBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#fff", border: "1px dashed #e5e7eb",
    borderRadius: 8, color: "#374151", fontFamily: "inherit", fontSize: 13,
    fontWeight: 500, cursor: "pointer", alignSelf: "flex-start",
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
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
