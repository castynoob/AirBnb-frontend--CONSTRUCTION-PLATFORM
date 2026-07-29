// =============================================================================
// DeadlineIndicator — pure-visual countdown pill for a job's due_date.
//
// No functionality (no auto-close, no notifications, no backend hits). Just a
// glanceable "time-left" chip that changes color as the deadline approaches
// and flips to an urgent red state when overdue. Meant to be dropped anywhere
// a job is displayed.
//
// Colour steps (based on hours remaining):
//   >  7d           slate  — "3 weeks left"
//   2d – 7d         teal   — "5 days left"
//   1d – 2d         amber  — "1 day left"
//   0 – 24h         orange — "Due today" / "6h left"
//   overdue         red    — "Overdue by 3 days"  (also pulses)
//
// Live-updating: re-renders every minute so a "3h left" pill actually ticks
// down. Cleared on unmount.
//
// Renders nothing when `dueDate` is falsy — every consumer can drop this in
// without a guard.
// =============================================================================

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY  = 24 * MS_PER_HOUR;

// Fallback helper — t() returns the key when unresolved, so `t(key) || fb`
// never falls back. This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

// Compute the visual bucket + i18n key/count from a due_date string. We
// intentionally return a template + params rather than a pre-formatted label
// so the caller can resolve via the current locale.
const compute = (dueDate) => {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const days  = Math.floor(absMs / MS_PER_DAY);
  const hours = Math.floor(absMs / MS_PER_HOUR);

  if (overdue) {
    if (days >= 1) {
      return {
        tone: "overdue",
        key: days === 1 ? 'deadline.overdueDays' : 'deadline.overdueDaysMany',
        fb: days === 1 ? 'Overdue by {{count}} day' : 'Overdue by {{count}} days',
        count: days,
      };
    }
    return { tone: "overdue", key: 'deadline.overdueHours', fb: 'Overdue by {{count}}h', count: hours || 1 };
  }

  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return {
      tone: "calm",
      key: weeks === 1 ? 'deadline.weekLeft' : 'deadline.weeksLeft',
      fb: weeks === 1 ? '{{count}} week left' : '{{count}} weeks left',
      count: weeks,
    };
  }
  if (days >= 2)  return { tone: "ok",   key: 'deadline.daysLeft',    fb: '{{count}} days left',   count: days };
  if (days >= 1)  return { tone: "warn", key: 'deadline.dayLeftOne',  fb: '1 day left',            count: 1 };
  if (hours >= 1) return { tone: "hot",  key: 'deadline.hoursLeft',   fb: '{{count}}h left',       count: hours };
  return { tone: "hot", key: 'deadline.dueWithinHour', fb: 'Due within the hour', count: 0 };
};

const TONE_STYLES = {
  calm:    { bg: "#f1f5f9", border: "#e2e8f0", color: "#0F223D" },
  ok:      { bg: "#ecfeff", border: "#a5f3fc", color: "#0e7490" },
  warn:    { bg: "#fef3c7", border: "#fde68a", color: "#92400e" },
  hot:     { bg: "#ffedd5", border: "#fdba74", color: "#9a3412" },
  overdue: { bg: "#fee2e2", border: "#fecaca", color: "#991b1b" },
};

// Compact = smaller footprint for card lists. Default = comfortable for detail
// pages / headers. Both use the same tone palette.
export default function DeadlineIndicator({ dueDate, compact = false, style }) {
  const { t } = useLanguage();
  const [state, setState] = useState(() => (dueDate ? compute(dueDate) : null));

  useEffect(() => {
    if (!dueDate) { setState(null); return; }
    setState(compute(dueDate));
    // Recompute every minute — cheap, and keeps hour/day labels honest.
    // Renamed from `t` to `tick` so it doesn't shadow the i18n `t` from the
    // outer scope (that shadowing quietly broke label translation).
    const tick = setInterval(() => setState(compute(dueDate)), 60_000);
    return () => clearInterval(tick);
  }, [dueDate]);

  if (!state) return null;

  const tone = TONE_STYLES[state.tone] || TONE_STYLES.calm;
  const isOverdue = state.tone === "overdue";
  const size = compact ? 11 : 12;

  return (
    <>
      {/* Scoped keyframe for the overdue pulse. Cheap to inline. */}
      <style>{`
        @keyframes deadline-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
          70%  { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: compact ? "2px 8px" : "4px 10px",
          borderRadius: 999,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          color: tone.color,
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          animation: isOverdue ? "deadline-pulse 1.6s ease-out infinite" : "none",
          ...style,
        }}
        title={new Date(dueDate).toLocaleString(undefined, {
          weekday: "long", month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        })}
      >
        {isOverdue ? <AlertTriangle size={size} /> : <Clock size={size} />}
        {tf(t, state.key, state.fb).replace('{{count}}', state.count)}
      </span>
    </>
  );
}

// -----------------------------------------------------------------------------
// OverdueBanner — thin red banner for detail pages. Shows only when the job
// is past its due date. Sits above the page header to make the state
// unmissable, matching the same visual language as the pill's overdue tone.
// -----------------------------------------------------------------------------
export function OverdueBanner({ dueDate }) {
  const { t, language } = useLanguage();
  const [overdue, setOverdue] = useState(false);
  useEffect(() => {
    if (!dueDate) { setOverdue(false); return; }
    const check = () => {
      const due = new Date(dueDate).getTime();
      setOverdue(!Number.isNaN(due) && due < Date.now());
    };
    check();
    // Renamed from `t` → `tick` so it doesn't shadow the i18n `t`.
    const tick = setInterval(check, 60_000);
    return () => clearInterval(tick);
  }, [dueDate]);

  if (!overdue) return null;

  const due = new Date(dueDate);
  const days = Math.floor((Date.now() - due.getTime()) / MS_PER_DAY);
  const dateStr = due.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    month: "long", day: "numeric", year: "numeric",
  });

  const key = days === 0 ? 'deadline.bannerJobOverdueToday'
            : days === 1 ? 'deadline.bannerJobOverdueDay'
                         : 'deadline.bannerJobOverdueDays';
  const fb  = days === 0 ? 'This job is overdue today — the original deadline was {{date}}.'
            : days === 1 ? 'This job is overdue by 1 day — the original deadline was {{date}}.'
                         : 'This job is overdue by {{count}} days — the original deadline was {{date}}.';

  return (
    <div
      role="alert"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        background: "linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)",
        border: "1px solid #fca5a5",
        borderRadius: 10,
        color: "#7f1d1d",
        fontSize: 13, fontWeight: 600,
        marginBottom: 12,
      }}
    >
      <AlertTriangle size={16} />
      <span>
        {tf(t, key, fb).replace('{{count}}', days).replace('{{date}}', dateStr)}
      </span>
    </div>
  );
}
