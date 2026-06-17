// =============================================================================
// ConfirmDialog
// Drop-in replacement for window.confirm() / window.alert() — keeps the user
// inside the admin UI and matches our visual language.
//
// Usage:
//   const [confirmState, setConfirmState] = useState(null);
//   setConfirmState({
//     title: "Approve this bid?",
//     message: "Other pending bids will be auto-declined and a contract will be created.",
//     variant: "primary",     // "primary" | "danger" | "warning"  (controls accent color + icon)
//     confirmLabel: "Approve",
//     onConfirm: async () => { await doThing(); },
//   });
//   <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
//
// `onConfirm` may return a promise — the dialog waits, disables buttons,
// shows a spinner on the confirm button, then auto-closes on success.
// =============================================================================

import { useState } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, X, Loader2 } from "lucide-react";

const VARIANTS = {
  primary: {
    accent: "#00A5A9",
    iconBg: "#e0f7f8",
    Icon: CheckCircle2,
    btn: { bg: "#00A5A9", hoverBg: "#008C8F", color: "#fff" },
  },
  danger: {
    accent: "#dc2626",
    iconBg: "#fee2e2",
    Icon: AlertTriangle,
    btn: { bg: "#dc2626", hoverBg: "#b91c1c", color: "#fff" },
  },
  warning: {
    accent: "#d97706",
    iconBg: "#fef3c7",
    Icon: AlertCircle,
    btn: { bg: "#d97706", hoverBg: "#b45309", color: "#fff" },
  },
};

export default function ConfirmDialog({ state, onClose }) {
  const [working, setWorking] = useState(false);

  if (!state) return null;

  const variant = VARIANTS[state.variant] || VARIANTS.primary;
  const Icon = variant.Icon;

  const handleConfirm = async () => {
    if (!state.onConfirm) {
      onClose?.();
      return;
    }
    setWorking(true);
    try {
      await state.onConfirm();
      onClose?.();
    } catch (e) {
      // If the caller's handler throws, leave the dialog open so the user can
      // retry. The handler is expected to surface a toast for the error itself.
      console.warn("ConfirmDialog: onConfirm threw —", e);
    } finally {
      setWorking(false);
    }
  };

  const handleCancel = () => {
    if (working) return;
    onClose?.();
  };

  return (
    <div style={S.overlay} onClick={handleCancel}>
      <div style={S.box} onClick={(e) => e.stopPropagation()}>
        <button
          style={S.closeBtn}
          onClick={handleCancel}
          aria-label="Close"
          disabled={working}
        >
          <X size={16} />
        </button>

        <div style={{ ...S.iconWrap, background: variant.iconBg }}>
          <Icon size={26} color={variant.accent} />
        </div>

        <h3 style={S.title}>{state.title || "Are you sure?"}</h3>
        {state.message && <p style={S.message}>{state.message}</p>}
        {state.subject && (
          <div style={S.subject}>{state.subject}</div>
        )}

        <div style={S.actions}>
          <button
            style={S.cancelBtn}
            onClick={handleCancel}
            disabled={working}
          >
            {state.cancelLabel || "Cancel"}
          </button>
          <button
            style={{
              ...S.confirmBtn,
              background: working ? `${variant.btn.bg}99` : variant.btn.bg,
              color: variant.btn.color,
            }}
            onClick={handleConfirm}
            disabled={working}
          >
            {working && <Loader2 size={14} className="spin" />}
            {working
              ? state.workingLabel || "Working…"
              : state.confirmLabel || "Confirm"}
          </button>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,34,61,0.55)",
    backdropFilter: "blur(3px)", zIndex: 1300,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  box: {
    position: "relative",
    background: "#fff", borderRadius: 14, padding: "26px 24px 20px",
    maxWidth: 440, width: "100%",
    boxShadow: "0 25px 60px rgba(15,34,61,0.25)",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute", top: 10, right: 10,
    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent", border: "none", borderRadius: 6, color: "#9ca3af", cursor: "pointer",
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px",
  },
  title: {
    fontSize: "1.05rem", fontWeight: 700, color: "#0F223D",
    margin: "0 0 8px",
  },
  message: {
    fontSize: 13, color: "#4b5563", lineHeight: 1.5, margin: "0 0 12px",
  },
  subject: {
    background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#0F223D",
    margin: "0 0 16px", wordBreak: "break-word",
  },
  actions: {
    display: "flex", gap: 8, marginTop: 6,
  },
  cancelBtn: {
    flex: 1, padding: "10px 16px",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
    fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit", fontSize: 14,
  },
  confirmBtn: {
    flex: 1, padding: "10px 16px",
    border: "none", borderRadius: 8,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
};
