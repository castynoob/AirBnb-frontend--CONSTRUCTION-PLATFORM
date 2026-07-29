// =============================================================================
// DemoModeBanner — fixed-top red strip that shows whenever demo mode is on.
// Mounted at the app root so it's visible on every page. The whole point is
// to be hard to leave on accidentally: red background, all-caps, click-to-
// exit. Also useful mid-pitch as a "yes, this is our demo mode" tell.
// =============================================================================

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { isDemoModeOn, setDemoMode, subscribeDemoMode } from "../utils/demoMode";

export default function DemoModeBanner() {
  const [on, setOn] = useState(() => isDemoModeOn());

  useEffect(() => subscribeDemoMode(setOn), []);

  if (!on) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 5000,
        background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
        color: "#fff",
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <AlertTriangle size={14} />
      Demo mode — you're seeing simulated tenders, not real data
      <button
        type="button"
        onClick={() => setDemoMode(false)}
        title="Exit demo mode"
        aria-label="Exit demo mode"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 10px",
          background: "rgba(255,255,255,0.18)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.35)", borderRadius: 999,
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em", cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <X size={12} /> Exit
      </button>
    </div>
  );
}
