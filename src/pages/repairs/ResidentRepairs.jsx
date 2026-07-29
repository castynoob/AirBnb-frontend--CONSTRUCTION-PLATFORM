// =============================================================================
// Resident Repairs — my requests list + create form
// =============================================================================
// Single-page UX: list on top, "New request" button opens an inline drawer.
// Simpler than a separate create page; residents rarely need more.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus, Wrench, Clock, CheckCircle, XCircle, RefreshCw, X, AlertCircle, ChevronRight, ImagePlus, Trash2,
} from "lucide-react";
import Nav from "../../components/Nav";
import { useLanguage } from "../../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile"))?.token; } catch { return null; }
};
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Fallback helper — t() returns the key when unresolved, so `t(key) || fb`
// never falls back. This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

// Status metadata — only the color / icon is static. The `label` is now a
// function that resolves via t() at render time, so a language switch
// updates every card without a refetch.
const STATUS_META = {
  pending_pm_approval: { key: 'residentRepairs.statusPending',   fb: 'Pending review',            color: '#92400e', bg: '#fef3c7', Icon: Clock },
  approved:            { key: 'residentRepairs.statusApproved',  fb: 'Approved · Open for bids',  color: '#065f46', bg: '#d1fae5', Icon: CheckCircle },
  rejected:            { key: 'residentRepairs.statusRejected',  fb: 'Declined',                  color: '#7f1d1d', bg: '#fee2e2', Icon: XCircle },
  withdrawn:           { key: 'residentRepairs.statusWithdrawn', fb: 'Withdrawn',                 color: '#374151', bg: '#e5e7eb', Icon: XCircle },
};

// Canonical values stay in English (they hit the DB); labels are i18n keys.
const CATEGORIES = [
  { value: 'Electrical',      key: 'residentRepairs.catElectrical',  fb: 'Electrical' },
  { value: 'Plumbing',        key: 'residentRepairs.catPlumbing',    fb: 'Plumbing' },
  { value: 'Heating / HVAC',  key: 'residentRepairs.catHvac',        fb: 'Heating / HVAC' },
  { value: 'Appliance',       key: 'residentRepairs.catAppliance',   fb: 'Appliance' },
  { value: 'Carpentry',       key: 'residentRepairs.catCarpentry',   fb: 'Carpentry' },
  { value: 'Painting',        key: 'residentRepairs.catPainting',    fb: 'Painting' },
  { value: 'Drywall',         key: 'residentRepairs.catDrywall',     fb: 'Drywall' },
  { value: 'Flooring',        key: 'residentRepairs.catFlooring',    fb: 'Flooring' },
  { value: 'Roofing',         key: 'residentRepairs.catRoofing',     fb: 'Roofing' },
  { value: 'Landscaping',     key: 'residentRepairs.catLandscaping', fb: 'Landscaping' },
  { value: 'Other',           key: 'residentRepairs.catOther',       fb: 'Other' },
];

const URGENCIES = [
  { value: 'Urgent',  key: 'residentRepairs.urgUrgent',  fb: 'Urgent — safety / uninhabitable' },
  { value: 'High',    key: 'residentRepairs.urgHigh',    fb: 'High — significant impact' },
  { value: 'Medium',  key: 'residentRepairs.urgMedium',  fb: 'Medium — inconvenient but livable' },
  { value: 'Low',     key: 'residentRepairs.urgLow',     fb: 'Low — cosmetic / non-blocking' },
];

export default function ResidentRepairs() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Create form state
  const [form, setForm] = useState({ title: "", description: "", category: "Other", urgency: "Medium" });
  const [submitting, setSubmitting] = useState(false);

  // Optional image attachments. Kept as { file, previewUrl } so we can render
  // instant thumbnails without a second read of the file. previewUrl is a
  // blob:// URL that we revoke on remove / close to avoid a memory leak.
  const [images, setImages] = useState([]);
  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // matches multer server limit

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/resident/repairs/mine`, { headers: authHeaders() });
      if (!res.ok) {
        // Surface the actual server message so 404 / 401 / 500 are
        // distinguishable (previously all three showed "Failed to load").
        let detail = "";
        try {
          const body = await res.json();
          detail = body.message || body.error || "";
        } catch { /* not JSON — likely a 404 HTML page */ }
        throw new Error(
          detail ||
            `Couldn't load your requests (HTTP ${res.status}). ${res.status === 404 ? "The backend may not be running the latest code — restart the server and try again." : ""}`
        );
      }
      const data = await res.json();
      setRepairs(data.repairs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g = { pending_pm_approval: [], approved: [], rejected: [], withdrawn: [] };
    for (const r of repairs) {
      const key = r.resident_request_status || "pending_pm_approval";
      (g[key] ||= []).push(r);
    }
    return g;
  }, [repairs]);

  const handleImageChange = (e) => {
    const picked = Array.from(e.target.files || []);
    // Reset the file input's value so picking the same file again re-fires
    // onChange. Without this, removing then re-picking is silently ignored.
    e.target.value = "";

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted = [];
    for (const file of picked.slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} is over 5 MB.`);
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (accepted.length > 0) setImages((prev) => [...prev, ...accepted]);
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx]?.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Revoke every preview URL on unmount so we don't leak blob handles.
  useEffect(() => () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForm = () => {
    if (submitting) return;
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setForm({ title: "", description: "", category: "Other", urgency: "Medium" });
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please describe the issue.");
      return;
    }
    setSubmitting(true);
    try {
      // Multipart when there are images, JSON otherwise. Backend accepts both.
      let res;
      if (images.length > 0) {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("category", form.category);
        fd.append("urgency", form.urgency);
        images.forEach(({ file }) => fd.append("images", file));
        res = await fetch(`${API_BASE}/api/resident/repairs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type — browser sets multipart boundary
          body: fd,
        });
      } else {
        res = await fetch(`${API_BASE}/api/resident/repairs`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      // Partial success: request saved but some photos failed.
      if (data.imageErrors?.length) {
        toast.success("Request submitted, but some photos didn't upload.");
        console.warn("resident-repair image errors:", data.imageErrors);
      } else {
        toast.success("Request submitted for approval.");
      }

      closeForm();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async (id) => {
    if (!confirm(tf(t, 'residentRepairs.confirmWithdraw', 'Withdraw this request?'))) return;
    try {
      const res = await fetch(`${API_BASE}/api/resident/repairs/${id}/withdraw`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || tf(t, 'residentRepairs.toastWithdrawFailed', 'Failed to withdraw'));
      toast.success(tf(t, 'residentRepairs.toastWithdrawn', 'Withdrawn.'));
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Nav />
      <div className="main-container" style={{ flex: 1, padding: "24px 32px", background: "#f8fafc", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0F223D" }}>
              {tf(t, 'residentRepairs.pageTitle', 'My Repair Requests')}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {tf(t, 'residentRepairs.pageSubtitle', "Submit a repair, follow its status, and see your property manager's response.")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} style={btnGhost}>
              <RefreshCw size={16} /> {tf(t, 'residentRepairs.refresh', 'Refresh')}
            </button>
            <button onClick={() => setShowForm(true)} style={btnPrimary}>
              <Plus size={16} /> {tf(t, 'residentRepairs.newRequest', 'New request')}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>{tf(t, 'residentRepairs.loading', 'Loading…')}</div>
        ) : error ? (
          // Don't stack the "empty" placeholder on top of the error banner.
          null
        ) : repairs.length === 0 ? (
          <div style={emptyBox}>
            <Wrench size={40} color="#94a3b8" />
            <h3 style={{ margin: "12px 0 4px" }}>{tf(t, 'residentRepairs.emptyTitle', 'No requests yet')}</h3>
            <p style={{ color: "#6b7280", margin: "0 0 14px" }}>
              {tf(t, 'residentRepairs.emptyBody', 'Submit your first repair request and your property manager will review it.')}
            </p>
            <button onClick={() => setShowForm(true)} style={btnPrimary}>
              <Plus size={16} /> {tf(t, 'residentRepairs.newRequest', 'New request')}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {["pending_pm_approval", "approved", "rejected", "withdrawn"].map((key) => (
              grouped[key]?.length > 0 && (
                <section key={key}>
                  <h3 style={sectionTitle}>{tf(t, STATUS_META[key].key, STATUS_META[key].fb)} ({grouped[key].length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {grouped[key].map((r) => (
                      <RepairCard key={r.id} repair={r} t={t} onWithdraw={withdraw} onOpen={() => navigate(`/job/${r.id}`)} />
                    ))}
                  </div>
                </section>
              )
            ))}
          </div>
        )}
      </div>

      {/* New request modal */}
      {showForm && (
        <div style={overlay} onClick={() => !submitting && closeForm()}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0F223D" }}>{tf(t, 'residentRepairs.modalTitle', 'New repair request')}</h3>
              <button onClick={closeForm} disabled={submitting} style={iconBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} style={{ padding: 22 }}>
              <label style={label}>{tf(t, 'residentRepairs.titleLabel', 'Title')} <span style={{ color: "#dc2626" }}>*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={tf(t, 'residentRepairs.titlePlaceholder', 'e.g. Kitchen sink is leaking')}
                required
                maxLength={120}
                style={input}
              />

              <label style={label}>{tf(t, 'residentRepairs.descriptionLabel', 'Description')} <span style={{ color: "#dc2626" }}>*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={tf(t, 'residentRepairs.descriptionPlaceholder', "Describe the issue with as much detail as you can — where it is, when it started, what you've tried.")}
                rows={6}
                required
                style={{ ...input, resize: "vertical", minHeight: 120, fontFamily: "inherit" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={label}>{tf(t, 'residentRepairs.categoryLabel', 'Category')}</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={input}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{tf(t, c.key, c.fb)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>{tf(t, 'residentRepairs.urgencyLabel', 'Urgency')}</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} style={input}>
                    {URGENCIES.map((u) => <option key={u.value} value={u.value}>{tf(t, u.key, u.fb)}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional photos — up to 5, images only, 5 MB each. */}
              <label style={label}>
                {tf(t, 'residentRepairs.photosLabel', 'Photos (optional)')}
                <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}>
                  {images.length}/{MAX_IMAGES} · {tf(t, 'residentRepairs.photosHint', 'up to 5 MB each')}
                </span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #d1d5db",
                      background: `url(${img.previewUrl}) center/cover`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      disabled={submitting}
                      title={tf(t, 'residentRepairs.photoRemove', 'Remove')}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(15, 23, 42, 0.75)", color: "#fff",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      border: "1.5px dashed #cbd5e1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      color: "#64748b",
                      cursor: submitting ? "not-allowed" : "pointer",
                      background: "#f8fafc",
                      fontSize: 11,
                    }}
                  >
                    <ImagePlus size={20} />
                    {tf(t, 'residentRepairs.photoAdd', 'Add')}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={submitting}
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
                <button type="button" onClick={closeForm} disabled={submitting} style={btnGhost}>
                  {tf(t, 'residentRepairs.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} style={btnPrimary}>
                  {submitting ? tf(t, 'residentRepairs.submitting', 'Submitting…') : tf(t, 'residentRepairs.submitForReview', 'Submit for review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RepairCard({ repair, t, onWithdraw, onOpen }) {
  const meta = STATUS_META[repair.resident_request_status || "pending_pm_approval"];
  const Icon = meta.Icon;
  const canWithdraw = repair.resident_request_status === "pending_pm_approval";

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
              borderRadius: 12, background: meta.bg, color: meta.color,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3,
            }}>
              <Icon size={12} /> {tf(t, meta.key, meta.fb)}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              {new Date(repair.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0F223D", marginBottom: 4 }}>{repair.title}</div>
          <div style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {repair.description}
          </div>
          {repair.pm_review_note && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8fafc", borderLeft: "3px solid #14919B", borderRadius: 4, fontSize: 13, color: "#374151" }}>
              <b style={{ fontSize: 12, color: "#6b7280" }}>{tf(t, 'residentRepairs.pmNote', 'PM note:')}</b> {repair.pm_review_note}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {canWithdraw && (
            <button onClick={() => onWithdraw(repair.id)} style={{ ...btnGhost, padding: "6px 10px", fontSize: 12 }}>
              {tf(t, 'residentRepairs.withdraw', 'Withdraw')}
            </button>
          )}
          {repair.resident_request_status === "approved" && (
            <button onClick={onOpen} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 12 }}>
              {tf(t, 'residentRepairs.viewJob', 'View job')} <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- styles --------------------
const card = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "14px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const sectionTitle = {
  margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: 0.5,
};
const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#14919B", color: "#fff", border: "1px solid #14919B",
  padding: "9px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const btnGhost = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#fff", color: "#374151", border: "1px solid #d1d5db",
  padding: "9px 14px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const emptyBox = {
  background: "#fff", border: "1px dashed #d1d5db", borderRadius: 12,
  padding: "40px 20px", textAlign: "center",
};
const overlay = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
};
const modal = {
  background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
};
const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "18px 22px", borderBottom: "1px solid #e5e7eb",
};
const iconBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", padding: 6,
};
const label = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", margin: "10px 0 6px",
};
const input = {
  width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: 14, color: "#0F223D", boxSizing: "border-box", background: "#fff",
};
