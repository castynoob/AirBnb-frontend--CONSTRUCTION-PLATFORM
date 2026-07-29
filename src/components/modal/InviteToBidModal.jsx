// =============================================================================
// InviteToBidModal — reusable "Invite to Bid" flow for property managers.
//
// Extracted from SpecialistDirectory so multiple surfaces (favorites, PM
// homepage, per-job "who else should bid?" pickers) can drop in the same
// UX without duplicating the API dance, error handling, and 409 recovery.
//
// Props:
//   contractor         Object with { user_id, display_name } (or nulls). Modal
//                      is open when this is truthy.
//   onClose            Called when the modal should close (Cancel / backdrop
//                      click / after a successful send).
//   onInvited          Optional. Called with the contractor's user_id after a
//                      successful (or already-invited) send. Host uses this to
//                      toggle "Invited" state on its trigger button.
//
// The modal:
//   1. On open, fetches the PM's own dashboard jobs and filters to statuses
//      that are still bidding-eligible (Open / bidding).
//   2. Renders a radio list of jobs + an optional message textarea.
//   3. POSTs to /api/invites; handles 409 already_invited without closing
//      (so the PM can pick a different job).
// =============================================================================

import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getViewer = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}"); }
  catch { return null; }
};

export default function InviteToBidModal({ contractor, onClose, onInvited }) {
  const isOpen = !!contractor;

  const [myJobs, setMyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Load the PM's own dashboard jobs when the modal opens. Filter to jobs
  // that are still in the bidding phase — awarded/completed shouldn't accept
  // new invites and would confuse the picker.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedJobId("");
    setInviteMessage("");
    const viewer = getViewer();
    if (!viewer?.token || !viewer?.id) return;
    setLoadingJobs(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/jobs/manager/${viewer.id}/dashboard?limit=50`,
          { headers: { Authorization: `Bearer ${viewer.token}` } }
        );
        if (!res.ok) throw new Error(`Couldn't load your jobs (HTTP ${res.status}).`);
        const json = await res.json();
        const eligible = (json.jobs || []).filter((j) => {
          const s = (j.status || "").toLowerCase();
          return s === "open" || s === "bidding";
        });
        setMyJobs(eligible);
      } catch (err) {
        toast.error(err.message || "Failed to load your jobs.");
        setMyJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, [isOpen]);

  const send = async () => {
    if (!contractor?.user_id || !selectedJobId) return;
    const viewer = getViewer();
    if (!viewer?.token) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${viewer.token}`,
        },
        body: JSON.stringify({
          job_id: selectedJobId,
          entrepreneur_user_id: contractor.user_id,
          message: inviteMessage.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 409 already_invited means (this contractor, this job) exists. Let
        // the PM pick a different job — keep the modal open.
        if (res.status === 409 && body.code === "already_invited") {
          toast(
            "You already invited this contractor to that job. Pick a different one.",
            { icon: "ℹ️" }
          );
          return;
        }
        throw new Error(body.message || `Failed to send invite (${res.status}).`);
      }
      toast.success(`Invite sent to ${contractor.display_name || "contractor"}.`);
      onInvited?.(contractor.user_id);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.panel} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <div style={s.eyebrow}>Invite to bid</div>
            <div style={s.title}>{contractor.display_name || "Contractor"}</div>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
          <label style={s.label}>Which job?</label>
          {loadingJobs ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>Loading your jobs…</div>
          ) : myJobs.length === 0 ? (
            <div style={s.emptyJobs}>
              <p style={{ margin: 0, fontWeight: 600, color: "#0F223D" }}>
                No open jobs to invite to.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Post a job first and it'll show up here.
              </p>
            </div>
          ) : (
            <div style={s.jobList}>
              {myJobs.map((job) => {
                const selected = selectedJobId === job.id;
                return (
                  <label
                    key={job.id}
                    style={{ ...s.jobRow, ...(selected ? s.jobRowSelected : {}) }}
                  >
                    <input
                      type="radio"
                      name="invite-job"
                      checked={selected}
                      onChange={() => setSelectedJobId(job.id)}
                      style={{ marginRight: 12, accentColor: "#14919B" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.jobTitle}>{job.title}</div>
                      <div style={s.jobMeta}>
                        {[job.property_name, job.property_city].filter(Boolean).join(" · ") || "No property"}
                      </div>
                    </div>
                    {job.status && <span style={s.jobStatus}>{job.status}</span>}
                  </label>
                );
              })}
            </div>
          )}

          <label style={{ ...s.label, marginTop: 16 }}>
            Add a note <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder="e.g. Saw your kitchen work, would love a quote by Friday."
            rows={3}
            maxLength={500}
            style={s.textarea}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 4 }}>
            {inviteMessage.length}/500
          </div>
        </div>

        <div style={s.footer}>
          <button onClick={onClose} style={s.btnGhost} disabled={sending}>
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!selectedJobId || sending}
            style={{ ...s.btnPrimary, ...(!selectedJobId || sending ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
          >
            <Send size={14} />
            {sending ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,34,61,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  panel: {
    background: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 520, maxHeight: "85vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  eyebrow: {
    fontSize: 12, color: "#94a3b8", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  title: {
    fontSize: 18, fontWeight: 700, color: "#0F223D", marginTop: 4,
  },
  closeBtn: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#0F223D",
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 700, color: "#0F223D",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    padding: "14px 20px",
    borderTop: "1px solid #f1f5f9",
  },
  btnGhost: {
    padding: "9px 16px", border: "1px solid #e5e7eb", borderRadius: 8,
    background: "#fff", color: "#0F223D", fontWeight: 600, fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 16px", border: "none", borderRadius: 8,
    background: "#14919B", color: "#fff", fontWeight: 700, fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
  },
  jobList: {
    display: "flex", flexDirection: "column", gap: 8,
    maxHeight: 280, overflowY: "auto",
  },
  jobRow: {
    display: "flex", alignItems: "center",
    padding: "10px 12px",
    border: "1px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
  },
  jobRowSelected: { borderColor: "#14919B", background: "#ecfeff" },
  jobTitle: {
    fontWeight: 600, color: "#0F223D", fontSize: 14,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  jobMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  jobStatus: {
    padding: "2px 8px", borderRadius: 999,
    background: "#eef4ff", color: "#1e40af",
    fontSize: 11, fontWeight: 700, textTransform: "capitalize",
    marginLeft: 8, flexShrink: 0,
  },
  emptyJobs: {
    padding: 20, textAlign: "center",
    background: "#f8fafc", border: "1px dashed #d1d5db", borderRadius: 10,
  },
  textarea: {
    width: "100%", padding: "10px 12px",
    border: "1px solid #e5e7eb", borderRadius: 8,
    fontSize: 13, color: "#0F223D", fontFamily: "inherit",
    resize: "vertical", outline: "none",
    boxSizing: "border-box",
  },
};
