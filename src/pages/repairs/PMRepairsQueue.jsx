// =============================================================================
// PM Repairs Queue — resident-submitted requests awaiting approval
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wrench, RefreshCw, X, CheckCircle, XCircle, User, MapPin, Calendar, AlertCircle, Eye, ImageIcon } from "lucide-react";
import Nav from "../../components/Nav";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile"))?.token; } catch { return null; }
};
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export default function PMRepairsQueue() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action modal state
  const [action, setAction] = useState(null); // { kind: 'approve' | 'reject', repair }
  const [note, setNote] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [processing, setProcessing] = useState(false);

  // Detail viewer state
  const [viewing, setViewing] = useState(null); // repair being viewed
  const [viewingImages, setViewingImages] = useState([]);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null); // enlarged image URL

  const openView = async (repair) => {
    setViewing(repair);
    setViewingImages([]);
    setViewingLoading(true);
    try {
      // Repair id === job id. `/api/jobs/:id/images` returns { images: [...] }.
      const res = await fetch(`${API_BASE}/api/jobs/${repair.id}/images`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setViewingImages(Array.isArray(data) ? data : (data.images || []));
      }
    } catch (err) {
      console.error("Failed to load images:", err);
    } finally {
      setViewingLoading(false);
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/resident/repairs/pending`, { headers: authHeaders() });
      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body.message || body.error || "";
        } catch { /* not JSON */ }
        throw new Error(
          detail ||
            `Couldn't load the queue (HTTP ${res.status}). ${res.status === 404 ? "The backend may not be running the latest code — restart the server and try again." : ""}`
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

  const openApprove = (repair) => { setAction({ kind: "approve", repair }); setNote(""); setBudgetMin(""); setBudgetMax(""); };
  const openReject  = (repair) => { setAction({ kind: "reject", repair });  setNote(""); };

  const submit = async () => {
    if (!action) return;
    if (action.kind === "reject" && !note.trim()) {
      toast.error("Please include a reason so the resident understands.");
      return;
    }
    setProcessing(true);
    try {
      const url = `${API_BASE}/api/resident/repairs/${action.repair.id}/${action.kind}`;
      const body = action.kind === "approve"
        ? { note: note.trim() || null, budget_min: budgetMin || null, budget_max: budgetMax || null }
        : { note: note.trim() };
      const res = await fetch(url, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(action.kind === "approve" ? "Approved — job is open for bids." : "Request declined.");
      setAction(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Nav />
      <div className="main-container" style={{ flex: 1, padding: "24px 32px", background: "#f8fafc", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0F223D" }}>Resident Requests</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              Repair requests submitted by residents at your properties, awaiting your review.
            </p>
          </div>
          <button onClick={load} style={btnGhost}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>
        ) : error ? (
          null
        ) : repairs.length === 0 ? (
          <div style={emptyBox}>
            <Wrench size={40} color="#94a3b8" />
            <h3 style={{ margin: "12px 0 4px" }}>No pending requests</h3>
            <p style={{ color: "#6b7280", margin: 0 }}>
              You're caught up. Requests will appear here when residents submit them.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {repairs.map((r) => (
              <div key={r.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
                        borderRadius: 12, background: "#fef3c7", color: "#92400e",
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3,
                      }}>
                        <AlertCircle size={12} /> Pending review
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        <Calendar size={11} style={{ verticalAlign: "middle" }} />{" "}
                        {new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      {r.urgency && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
                          background: r.urgency === "Urgent" ? "#fee2e2" : "#e0f2fe",
                          color: r.urgency === "Urgent" ? "#dc2626" : "#0369a1",
                        }}>{r.urgency}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0F223D", marginBottom: 4 }}>{r.title}</div>
                    <div style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>
                      {r.description}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <User size={12} /> {r.resident_name || "Resident"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} /> {r.property_name || r.property_address || "—"}
                      </span>
                      {r.category && (
                        <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 4, background: "#f1f5f9", color: "#334155" }}>
                          {r.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                    <button onClick={() => openView(r)} style={btnGhost}>
                      <Eye size={14} /> View
                    </button>
                    <button onClick={() => openReject(r)} style={btnOutlineDanger}>
                      <XCircle size={14} /> Decline
                    </button>
                    <button onClick={() => openApprove(r)} style={btnPrimary}>
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve / Reject modal */}
      {action && (
        <div style={overlay} onClick={() => !processing && setAction(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0F223D" }}>
                {action.kind === "approve" ? "Approve request" : "Decline request"}
              </h3>
              <button onClick={() => setAction(null)} disabled={processing} style={iconBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 14, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, borderLeft: "3px solid #14919B" }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Request</div>
                <div style={{ fontWeight: 600, color: "#0F223D" }}>{action.repair.title}</div>
              </div>

              {action.kind === "approve" && (
                <>
                  <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 14px" }}>
                    Approving will open this as a job for contractors to bid on. You can set a budget range now or leave blank and let bidders propose it.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={label}>Budget min ($)</label>
                      <input type="number" min="0" step="1" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="e.g. 500" style={input} />
                    </div>
                    <div>
                      <label style={label}>Budget max ($)</label>
                      <input type="number" min="0" step="1" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="e.g. 1500" style={input} />
                    </div>
                  </div>
                  <label style={label}>Note to resident (optional)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                    placeholder="e.g. Thanks — we've scheduled a contractor visit for next week."
                    style={{ ...input, resize: "vertical", minHeight: 80, fontFamily: "inherit" }} />
                </>
              )}

              {action.kind === "reject" && (
                <>
                  <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 14px" }}>
                    Please explain why so the resident understands.
                  </p>
                  <label style={label}>Reason <span style={{ color: "#dc2626" }}>*</span></label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                    placeholder="e.g. This isn't a building responsibility — please contact your appliance manufacturer for warranty service."
                    style={{ ...input, resize: "vertical", minHeight: 100, fontFamily: "inherit" }} />
                </>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
                <button onClick={() => setAction(null)} disabled={processing} style={btnGhost}>Cancel</button>
                <button onClick={submit} disabled={processing} style={action.kind === "approve" ? btnPrimary : btnDanger}>
                  {processing ? "Working…" : action.kind === "approve" ? "Approve" : "Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail viewer — full description + photo gallery + quick actions */}
      {viewing && (
        <div style={overlay} onClick={() => setViewing(null)}>
          <div
            style={{ ...modal, maxWidth: 720 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
                  <AlertCircle size={11} /> Pending review
                </div>
                <h3 style={{ margin: "8px 0 0", fontSize: 20, color: "#0F223D", lineHeight: 1.25 }}>
                  {viewing.title}
                </h3>
              </div>
              <button onClick={() => setViewing(null)} style={iconBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 22 }}>
              {/* Meta strip */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#6b7280", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <User size={13} /> {viewing.resident_name || "Resident"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={13} /> {viewing.property_name || viewing.property_address || "—"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={13} /> {new Date(viewing.created_at).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                {viewing.urgency && (
                  <span style={{ padding: "2px 10px", borderRadius: 999, background: viewing.urgency === "Urgent" ? "#fee2e2" : "#e0f2fe", color: viewing.urgency === "Urgent" ? "#dc2626" : "#0369a1", fontSize: 11, fontWeight: 600 }}>
                    {viewing.urgency}
                  </span>
                )}
                {viewing.category && (
                  <span style={{ padding: "2px 10px", borderRadius: 4, background: "#f1f5f9", color: "#334155", fontSize: 11, fontWeight: 500 }}>
                    {viewing.category}
                  </span>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>Description</div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
                  {viewing.description}
                </p>
              </div>

              {/* Photos */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <ImageIcon size={13} /> Photos {viewingImages.length > 0 && `(${viewingImages.length})`}
                </div>
                {viewingLoading ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
                    Loading…
                  </div>
                ) : viewingImages.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
                    No photos attached
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {viewingImages.map((img, i) => {
                      const src = img.image_url || img.url || img;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightbox(src)}
                          style={{
                            padding: 0,
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            overflow: "hidden",
                            aspectRatio: "1",
                            cursor: "zoom-in",
                            background: `url(${src}) center/cover`,
                          }}
                          title="Click to enlarge"
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 14, borderTop: "1px solid #e5e7eb" }}>
                <button
                  onClick={() => { setViewing(null); openReject(viewing); }}
                  style={btnOutlineDanger}
                >
                  <XCircle size={14} /> Decline
                </button>
                <button
                  onClick={() => { setViewing(null); openApprove(viewing); }}
                  style={btnPrimary}
                >
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — click any photo to enlarge */}
      {lightbox && (
        <div
          style={{ ...overlay, background: "rgba(0,0,0,0.85)", zIndex: 101 }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", top: 20, right: 20,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", color: "#fff",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------- styles --------------------
const card = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#059669", color: "#fff", border: "1px solid #059669",
  padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const btnOutlineDanger = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#fff", color: "#dc2626", border: "1px solid #fca5a5",
  padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const btnDanger = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#dc2626", color: "#fff", border: "1px solid #dc2626",
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
