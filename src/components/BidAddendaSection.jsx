// =============================================================================
// BidAddendaSection — one component used by both sides of the bid conversation.
// =============================================================================
//
// Renders under the bid detail modal for the PM and the contractor. Shows:
//   * Effective bid total (original + accepted deltas)
//   * A running list of every addendum with status chips
//   * "Propose price adjustment" form (either side can propose)
//   * Accept / Reject buttons on pending addenda proposed by the OTHER side
//   * Withdraw button on pending addenda proposed by YOU
//
// Props:
//   bidId              (uuid) — required
//   currentUserId      (uuid) — required, used to decide which actions to show
//   canAct             (bool) — pass `true` when the bid is still negotiable
//                                (pending / under_review). Hides the propose
//                                form and the response buttons when false.
//   onChange           (fn)   — called after any successful mutation so the
//                                parent (bid modal) can refresh its own state.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("userProfile"))?.token;
  } catch {
    return null;
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const money = (n) =>
  n == null || Number.isNaN(Number(n))
    ? "—"
    : `${Number(n) < 0 ? "-" : ""}$${Math.abs(Number(n)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const signedMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 0) return `+$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `-$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const statusChipStyle = (status) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  };
  switch (status) {
    case "accepted":
      return { ...base, background: "#dcfce7", color: "#166534" };
    case "rejected":
      return { ...base, background: "#fee2e2", color: "#991b1b" };
    case "withdrawn":
      return { ...base, background: "#f1f5f9", color: "#475569" };
    default: // pending
      return { ...base, background: "#fef3c7", color: "#92400e" };
  }
};

export default function BidAddendaSection({ bidId, currentUserId, canAct = true, onChange }) {
  const { t } = useLanguage();
  const tx = (k, fb) => {
    const v = t(k);
    return v === k ? fb : v;
  };

  const [state, setState] = useState({
    addenda: [],
    effective: null,
    loading: true,
    error: null,
  });
  const [form, setForm] = useState({ amountDelta: "", reason: "", submitting: false });
  const [actingId, setActingId] = useState(null);

  // Translate whatever the server sent into something a non-technical user
  // can act on. Raw SQL like `relation "bid_addenda" does not exist` should
  // never reach the UI. The `technical` payload is stashed for the console
  // so we can still triage from the dev tools if needed.
  const friendlyErrorFrom = (rawMessage) => {
    const raw = String(rawMessage || "");
    if (/relation .+ does not exist|bid_addenda/i.test(raw)) {
      console.error("BidAddendaSection: schema missing —", raw);
      return {
        title: tx("addenda.unavailableTitle", "Price-adjustment thread isn't available right now"),
        body: tx("addenda.unavailableBody", "This section will be back once the platform update finishes rolling out. You can still submit and manage your bid as usual."),
      };
    }
    return {
      title: tx("addenda.errorTitle", "Couldn't load the price-adjustment thread"),
      body: tx("addenda.errorBody", "Please refresh the page or try again in a moment."),
    };
  };

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const res = await fetch(`${API_BASE}/api/bids/${bidId}/addenda`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load addenda");
      setState({ addenda: data.addenda || [], effective: data.effective, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: friendlyErrorFrom(err.message) }));
    }
  }, [bidId]);

  useEffect(() => {
    if (bidId) load();
  }, [bidId, load]);

  const propose = async (e) => {
    e.preventDefault();
    const delta = Number(form.amountDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      toast.error(tx("addenda.deltaRequired", "Enter a non-zero adjustment amount."));
      return;
    }
    if (!form.reason.trim()) {
      toast.error(tx("addenda.reasonRequired", "Explain what changed and why."));
      return;
    }
    setForm((f) => ({ ...f, submitting: true }));
    try {
      const res = await fetch(`${API_BASE}/api/bids/${bidId}/addenda`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount_delta: delta, reason: form.reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to propose addendum");
      toast.success(tx("addenda.proposed", "Addendum proposed."));
      setForm({ amountDelta: "", reason: "", submitting: false });
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.message);
      setForm((f) => ({ ...f, submitting: false }));
    }
  };

  const respond = async (id, action) => {
    setActingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/bids/${bidId}/addenda/${id}/${action}`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action}`);
      toast.success(tx(`addenda.${action}`, `Addendum ${action}.`));
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActingId(null);
    }
  };

  if (state.loading) {
    return <div style={s.wrap}><div style={s.dim}>{tx("addenda.loading", "Loading addenda…")}</div></div>;
  }
  if (state.error) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.err, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontWeight: 600 }}>{state.error.title}</div>
          <div style={{ opacity: 0.9 }}>{state.error.body}</div>
        </div>
      </div>
    );
  }

  const eff = state.effective;
  const originalAmount = eff?.originalAmount ?? 0;
  const acceptedDelta = eff?.acceptedDelta ?? 0;
  const effectiveAmount = eff?.effectiveAmount ?? originalAmount;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h4 style={s.title}>{tx("addenda.title", "Price adjustments (addenda)")}</h4>
        {eff?.pendingCount > 0 && (
          <span style={s.pendingBadge}>
            {eff.pendingCount} {eff.pendingCount === 1 ? tx("addenda.pending", "pending") : tx("addenda.pending_plural", "pending")}
          </span>
        )}
      </div>

      <div style={s.summaryGrid}>
        <div style={s.summaryCell}>
          <div style={s.summaryLabel}>{tx("addenda.original", "Original bid")}</div>
          <div style={s.summaryValue}>{money(originalAmount)}</div>
        </div>
        <div style={s.summaryCell}>
          <div style={s.summaryLabel}>{tx("addenda.acceptedAdjustments", "Accepted adjustments")}</div>
          <div style={{ ...s.summaryValue, color: acceptedDelta === 0 ? "#64748b" : acceptedDelta > 0 ? "#166534" : "#991b1b" }}>
            {acceptedDelta === 0 ? "—" : signedMoney(acceptedDelta)}
          </div>
        </div>
        <div style={s.summaryCell}>
          <div style={s.summaryLabel}>{tx("addenda.effective", "Effective bid")}</div>
          <div style={{ ...s.summaryValue, color: "#00A5A9", fontWeight: 800 }}>{money(effectiveAmount)}</div>
        </div>
      </div>

      {state.addenda.length === 0 ? (
        <div style={s.empty}>
          {tx("addenda.emptyHint", "No addenda yet. Propose a price adjustment if the scope or conditions have changed.")}
        </div>
      ) : (
        <ul style={s.list}>
          {state.addenda.map((a) => {
            const proposedByYou = a.proposed_by_user_id === currentUserId;
            const isPending = a.status === "pending";
            return (
              <li key={a.id} style={s.item}>
                <div style={s.itemHead}>
                  <div style={s.delta(Number(a.amount_delta))}>{signedMoney(a.amount_delta)}</div>
                  <span style={statusChipStyle(a.status)}>{a.status}</span>
                </div>
                <div style={s.reason}>{a.reason}</div>
                <div style={s.meta}>
                  <span>
                    {tx("addenda.proposedBy", "Proposed by")}{" "}
                    <strong>{proposedByYou ? tx("addenda.you", "you") : (a.proposed_by_name || tx("addenda.counterparty", "the other party"))}</strong>{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                  {a.responded_at && (
                    <span>
                      • {a.status} {tx("addenda.by", "by")}{" "}
                      {a.responded_by_user_id === currentUserId ? tx("addenda.you", "you") : a.responded_by_name}{" "}
                      {new Date(a.responded_at).toLocaleString()}
                    </span>
                  )}
                </div>
                {isPending && canAct && (
                  <div style={s.actions}>
                    {proposedByYou ? (
                      <button
                        style={s.btnGhost}
                        disabled={actingId === a.id}
                        onClick={() => respond(a.id, "withdraw")}
                      >
                        {actingId === a.id ? tx("addenda.working", "…") : tx("addenda.withdraw", "Withdraw")}
                      </button>
                    ) : (
                      <>
                        <button
                          style={s.btnPrimary}
                          disabled={actingId === a.id}
                          onClick={() => respond(a.id, "accept")}
                        >
                          {actingId === a.id ? tx("addenda.working", "…") : tx("addenda.accept", "Accept")}
                        </button>
                        <button
                          style={s.btnDanger}
                          disabled={actingId === a.id}
                          onClick={() => respond(a.id, "reject")}
                        >
                          {actingId === a.id ? tx("addenda.working", "…") : tx("addenda.reject", "Reject")}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canAct && (
        <form onSubmit={propose} style={s.form}>
          <div style={s.formTitle}>{tx("addenda.proposeTitle", "Propose price adjustment")}</div>
          <div style={s.formRow}>
            <div style={{ flex: "0 0 160px" }}>
              <label style={s.label}>{tx("addenda.delta", "Amount change ($)")}</label>
              <input
                type="number"
                step="0.01"
                placeholder="+250.00"
                value={form.amountDelta}
                onChange={(e) => setForm({ ...form, amountDelta: e.target.value })}
                style={s.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>{tx("addenda.reason", "Reason")}</label>
              <input
                type="text"
                placeholder={tx("addenda.reasonPlaceholder", "e.g. Site walk revealed additional prep work")}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                style={s.input}
              />
            </div>
          </div>
          <button type="submit" style={s.submit} disabled={form.submitting}>
            {form.submitting
              ? tx("addenda.proposing", "Proposing…")
              : tx("addenda.proposeBtn", "Propose adjustment")}
          </button>
          <div style={s.helper}>
            {tx("addenda.helper", "Use a positive number to raise the price, negative to lower it. The other side accepts or rejects.")}
          </div>
        </form>
      )}
    </div>
  );
}

const s = {
  wrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    color: "#0F223D",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { margin: 0, fontSize: 14, fontWeight: 700 },
  pendingBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: "#fef3c7",
    color: "#92400e",
    padding: "3px 8px",
    borderRadius: 999,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  summaryCell: { display: "flex", flexDirection: "column", gap: 2 },
  summaryLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 15, fontWeight: 700, color: "#0F223D" },
  empty: { padding: "12px 0", color: "#64748b", fontSize: 13 },
  list: { listStyle: "none", padding: 0, margin: "0 0 12px", display: "flex", flexDirection: "column", gap: 8 },
  item: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 },
  itemHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  delta: (v) => ({
    fontSize: 15,
    fontWeight: 800,
    color: v >= 0 ? "#166534" : "#991b1b",
  }),
  reason: { fontSize: 13, color: "#334155", marginBottom: 6, lineHeight: 1.4 },
  meta: { fontSize: 11, color: "#64748b", display: "flex", flexWrap: "wrap", gap: 6 },
  actions: { display: "flex", gap: 8, marginTop: 8 },
  form: { borderTop: "1px dashed #e5e7eb", paddingTop: 12, marginTop: 4 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "#0F223D", marginBottom: 8 },
  formRow: { display: "flex", gap: 10, marginBottom: 8 },
  label: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "inherit",
    marginTop: 4,
  },
  submit: {
    background: "#00A5A9",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  helper: { marginTop: 6, fontSize: 11, color: "#64748b" },
  btnPrimary: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnGhost: {
    background: "transparent",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  dim: { color: "#64748b", fontSize: 13 },
  err: { color: "#991b1b", fontSize: 13 },
};
