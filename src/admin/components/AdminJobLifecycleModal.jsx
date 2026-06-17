// =============================================================================
// AdminJobLifecycleModal
// One stop for managing the full lifecycle of an admin-owned job:
//   - View bids submitted by contractors
//   - Approve / decline / cancel-approval
//   - When approved, a contract is auto-created — that contract state is
//     surfaced inline (invoice status, work completion, mutual confirmation)
//   - Confirm completion when the contractor has marked it done
//
// Props:
//   isOpen, onClose, job — the admin-owned job object from MyJobs.jsx
//   onChange? — called after any backend mutation so the parent can refresh
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  X, Briefcase, Star, User, Loader2, Check, XCircle, RotateCcw,
  Award, Clock, DollarSign, MessageSquare, AlertCircle, ChevronDown, CheckCircle2,
  FileText, Calendar, Receipt,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import ConfirmDialog from "./ConfirmDialog";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const fmtMoney = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
};

export default function AdminJobLifecycleModal({ isOpen, onClose, job, onChange }) {
  const { getToken } = useAdminAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // bid id currently mutating
  const [contract, setContract] = useState(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const fetchBids = useCallback(async () => {
    if (!job?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/my-jobs/${job.id}/bids`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load bids");
      setBids(data.bids || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, job?.id]);

  const fetchContract = useCallback(async () => {
    if (!job?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/my-contracts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      const c = (data.contracts || []).find((x) => x.job_id === job.id);
      setContract(c || null);
    } catch (e) {
      console.warn(e);
    }
  }, [getToken, job?.id]);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmNote("");
    fetchBids();
    fetchContract();
  }, [isOpen, fetchBids, fetchContract]);

  // -------------------------------------------------------------------------
  // Bid actions
  // -------------------------------------------------------------------------
  const callBidAction = async (bidId, action, body = null) => {
    setActing(bidId);
    try {
      const res = await fetch(`${API_URL}/api/admin/bids/${bidId}/${action}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      toast.success(data.message || "Done");
      await fetchBids();
      await fetchContract();
      onChange?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleApprove = (bid) => {
    setConfirmState({
      title: "Approve this bid?",
      message:
        "Other pending bids on this job will be auto-declined and a contract will be created.",
      subject: `${bid.company_name || bid.first_name || "Contractor"} — ${fmtMoney(bid.amount)}`,
      variant: "primary",
      confirmLabel: "Approve",
      workingLabel: "Approving…",
      onConfirm: () => callBidAction(bid.id, "approve"),
    });
  };

  const handleDecline = (bid) => {
    setConfirmState({
      title: "Decline this bid?",
      message:
        "The contractor will be notified. You can change your mind later if the bid is still on file.",
      subject: `${bid.company_name || bid.first_name || "Contractor"} — ${fmtMoney(bid.amount)}`,
      variant: "danger",
      confirmLabel: "Decline",
      workingLabel: "Declining…",
      onConfirm: () => callBidAction(bid.id, "decline"),
    });
  };

  const handleCancelApproval = (bid) => {
    setConfirmState({
      title: "Cancel approval?",
      message:
        "The contract will be voided and the job will re-open for bidding. Previously declined bids will be restored to pending so you can reconsider them.",
      subject: `${bid.company_name || bid.first_name || "Contractor"} — ${fmtMoney(bid.amount)}`,
      variant: "warning",
      confirmLabel: "Cancel approval",
      workingLabel: "Cancelling…",
      onConfirm: () => callBidAction(bid.id, "cancel-approval"),
    });
  };

  // -------------------------------------------------------------------------
  // Contract completion confirmation
  // -------------------------------------------------------------------------
  const handleConfirmCompletion = async () => {
    if (!contract) return;
    setConfirming(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/contracts/${contract.id}/confirm-completion`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ manager_completion_note: confirmNote || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(data.message || "Confirmed");
      setConfirmNote("");
      await fetchContract();
      await fetchBids();
      onChange?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen || !job) return null;

  const approvedBid = bids.find((b) => b.status === "approved");
  const pendingBids = bids.filter((b) => b.status === "pending");
  const declinedBids = bids.filter((b) => b.status === "declined");

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>
            <Briefcase size={22} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.title}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Job lifecycle management</div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={S.body}>
          {/* Contract status banner — only when a contract exists */}
          {contract && <ContractPanel
            contract={contract}
            note={confirmNote}
            setNote={setConfirmNote}
            confirming={confirming}
            onConfirm={handleConfirmCompletion}
          />}

          {/* Bid sections */}
          {loading ? (
            <div style={S.loading}><Loader2 size={18} className="spin" /> Loading bids…</div>
          ) : bids.length === 0 ? (
            <div style={S.empty}>
              <Briefcase size={36} color="#cbd5e1" />
              <p style={{ margin: "12px 0 4px", color: "#0F223D", fontWeight: 600 }}>
                No bids yet
              </p>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                Contractors will see this job in their feed and can submit bids. Check back later.
              </p>
            </div>
          ) : (
            <>
              {approvedBid && (
                <Section title="Approved bid" icon={<CheckCircle2 size={14} color="#059669" />}>
                  <BidRow
                    bid={approvedBid}
                    busy={acting === approvedBid.id}
                    canCancelApproval={!contract?.work_started_at && !contract?.invoice_submitted_at}
                    onCancelApproval={() => handleCancelApproval(approvedBid)}
                  />
                </Section>
              )}

              {pendingBids.length > 0 && (
                <Section title={`Pending bids (${pendingBids.length})`} icon={<Clock size={14} color="#d97706" />}>
                  {pendingBids.map((b) => (
                    <BidRow
                      key={b.id}
                      bid={b}
                      busy={acting === b.id}
                      canApprove={!approvedBid}
                      canDecline={!approvedBid}
                      onApprove={() => handleApprove(b)}
                      onDecline={() => handleDecline(b)}
                    />
                  ))}
                </Section>
              )}

              {declinedBids.length > 0 && (
                <Section title={`Declined (${declinedBids.length})`} icon={<XCircle size={14} color="#9ca3af" />}>
                  {declinedBids.map((b) => (
                    <BidRow key={b.id} bid={b} compact />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
      </div>

      {/* In-app confirmation dialog — replaces the browser confirm() */}
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function Section({ title, icon, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionHeader}>
        {icon} <span>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function BidRow({
  bid, busy, compact,
  canApprove, canDecline, canCancelApproval,
  onApprove, onDecline, onCancelApproval,
}) {
  const fullName =
    `${bid.first_name || ""} ${bid.last_name || ""}`.trim() || bid.email;
  const displayName = bid.company_name || fullName;
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <div style={{ ...S.bidCard, ...(compact ? S.bidCardCompact : {}) }}>
      <div style={S.avatar}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.bidHeader}>
          <strong style={S.bidName}>{displayName}</strong>
          {bid.company_name && (
            <span style={S.bidSub}>· {fullName}</span>
          )}
          {bid.avg_rating != null && (
            <span style={S.ratingChip}>
              <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
              {Number(bid.avg_rating).toFixed(1)} ({bid.review_count})
            </span>
          )}
        </div>
        <div style={S.bidMeta}>
          <span style={S.metaItem}><DollarSign size={11} /> <strong>{fmtMoney(bid.amount)}</strong></span>
          {bid.estimated_duration_days && (
            <span style={S.metaItem}><Clock size={11} /> {bid.estimated_duration_days} days</span>
          )}
          {bid.years_experience && (
            <span style={S.metaItem}><Award size={11} /> {bid.years_experience}y exp</span>
          )}
          {bid.license_number && (
            <span style={S.metaItem}><FileText size={11} /> {bid.license_number}</span>
          )}
        </div>
        {bid.proposal && !compact && (
          <div style={S.proposal}>
            <MessageSquare size={11} style={{ verticalAlign: "middle", marginRight: 4, color: "#9ca3af" }} />
            {bid.proposal}
          </div>
        )}
      </div>

      {/* Actions */}
      {!compact && (canApprove || canDecline || canCancelApproval) && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {canApprove && (
            <button style={S.btnApprove} disabled={busy} onClick={onApprove}>
              {busy ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
              Approve
            </button>
          )}
          {canDecline && (
            <button style={S.btnDecline} disabled={busy} onClick={onDecline}>
              <XCircle size={13} /> Decline
            </button>
          )}
          {canCancelApproval && (
            <button style={S.btnCancelApproval} disabled={busy} onClick={onCancelApproval}>
              {busy ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
              Cancel approval
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ContractPanel({ contract, note, setNote, confirming, onConfirm }) {
  const isCompleted = !!contract.mutual_confirmation_completed_at;
  const adminConfirmed = !!contract.manager_completion_confirmed;
  const contractorConfirmed = !!contract.contractor_completion_confirmed;

  // What step we're on
  let step = "Active — contractor working";
  let stepColor = "#2563eb";
  if (isCompleted) {
    step = "Completed";
    stepColor = "#059669";
  } else if (contract.work_completed_at && !contractorConfirmed) {
    step = "Work marked done — awaiting contractor confirmation";
    stepColor = "#d97706";
  } else if (contractorConfirmed && !adminConfirmed) {
    step = "Contractor confirmed — your confirmation needed";
    stepColor = "#d97706";
  } else if (adminConfirmed && !contractorConfirmed) {
    step = "You confirmed — awaiting contractor";
    stepColor = "#d97706";
  } else if (contract.invoice_submitted_at) {
    step = "Invoice submitted";
    stepColor = "#7c3aed";
  } else if (contract.work_started_at) {
    step = "Work in progress";
    stepColor = "#2563eb";
  }

  return (
    <div style={S.contractPanel}>
      <div style={S.contractHeader}>
        <Receipt size={16} color={stepColor} />
        <span style={{ fontWeight: 700, color: "#0F223D" }}>Contract status</span>
        <span style={{ ...S.statusPill, background: `${stepColor}1a`, color: stepColor, border: `1px solid ${stepColor}40` }}>
          {step}
        </span>
      </div>
      <div style={S.contractGrid}>
        <Stat label="Amount" value={fmtMoney(contract.contract_amount)} />
        <Stat label="Started" value={fmtDate(contract.work_started_at)} />
        <Stat label="Invoice" value={contract.invoice_submitted_at ? fmtMoney(contract.invoice_total) : "—"} />
        <Stat label="Completed" value={fmtDate(contract.work_completed_at)} />
      </div>

      {/* Action: confirm completion */}
      {!isCompleted && contractorConfirmed && !adminConfirmed && (
        <div style={S.confirmBox}>
          <p style={{ fontSize: 12, color: "#0F223D", margin: "0 0 8px", fontWeight: 600 }}>
            <CheckCircle2 size={12} style={{ verticalAlign: "middle", color: "#059669", marginRight: 4 }} />
            The contractor confirmed completion. Confirm to close the contract.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. final inspection notes)…"
            rows={2}
            style={S.confirmTextarea}
          />
          <button
            style={{ ...S.btnApprove, marginTop: 8, justifyContent: "center", width: "100%" }}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
            Confirm completion
          </button>
        </div>
      )}
      {!isCompleted && !contractorConfirmed && !adminConfirmed && contract.work_completed_at && (
        <div style={S.confirmBox}>
          <p style={{ fontSize: 12, color: "#0F223D", margin: "0 0 8px", fontWeight: 600 }}>
            <Clock size={12} style={{ verticalAlign: "middle", color: "#d97706", marginRight: 4 }} />
            The contractor marked work complete. You can confirm now, or wait until they explicitly confirm too.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            rows={2}
            style={S.confirmTextarea}
          />
          <button
            style={{ ...S.btnApprove, marginTop: 8, justifyContent: "center", width: "100%" }}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
            Confirm your side
          </button>
        </div>
      )}
      {adminConfirmed && !contractorConfirmed && (
        <div style={{ ...S.confirmBox, background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <p style={{ fontSize: 12, color: "#1d4ed8", margin: 0, fontWeight: 600 }}>
            You confirmed at {fmtDate(contract.manager_confirmed_at)}. Waiting for the contractor to confirm their side.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0F223D", fontWeight: 600 }}>{value}</div>
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
    background: "#fff", width: "100%", maxWidth: 760,
    height: "min(720px, 90vh)", maxHeight: "90vh",
    borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 50px rgba(15,34,61,0.18)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 18px", background: "#0F223D", color: "#fff", flexShrink: 0, gap: 12,
  },
  title: { display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", flexShrink: 0,
  },
  body: { padding: 18, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: 40, color: "#6b7280" },
  empty: { padding: 50, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb", borderRadius: 12 },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionHeader: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 600, color: "#374151",
    textTransform: "uppercase", letterSpacing: ".04em",
    paddingBottom: 4, borderBottom: "1px solid #e5e7eb",
  },
  bidCard: {
    display: "flex", gap: 10, alignItems: "flex-start",
    padding: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
  },
  bidCardCompact: { opacity: 0.65, background: "#f8fafc" },
  avatar: {
    width: 36, height: 36, borderRadius: 8, color: "#fff",
    background: "linear-gradient(135deg, #00A5A9, #008C8F)",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  bidHeader: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 },
  bidName: { color: "#0F223D", fontSize: 14 },
  bidSub: { fontSize: 12, color: "#6b7280" },
  ratingChip: {
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "1px 6px", background: "#fef3c7", border: "1px solid #fde68a",
    borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#a16207",
  },
  bidMeta: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 5 },
  metaItem: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "#374151" },
  proposal: {
    marginTop: 8, padding: "6px 8px", background: "#f8fafc", border: "1px solid #f3f4f6",
    borderRadius: 6, fontSize: 12, color: "#4b5563", lineHeight: 1.4,
  },
  btnApprove: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "7px 12px", background: "#059669", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnDecline: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "7px 12px", background: "#fef2f2", color: "#b91c1c",
    border: "1px solid #fecaca", borderRadius: 8, fontWeight: 600, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnCancelApproval: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "7px 12px", background: "#fff", color: "#374151",
    border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit",
  },
  contractPanel: {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14,
    display: "flex", flexDirection: "column", gap: 12,
  },
  contractHeader: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusPill: {
    padding: "3px 8px", borderRadius: 6,
    fontSize: 11, fontWeight: 600,
  },
  contractGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid #f3f4f6",
  },
  confirmBox: {
    padding: 10, background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 8,
  },
  confirmTextarea: {
    width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb",
    borderRadius: 6, fontSize: 12, fontFamily: "inherit",
    resize: "vertical", minHeight: 50, outline: "none",
  },
};
