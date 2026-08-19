// =============================================================================
// CustomSelect — reusable dropdown that visually replaces native <select>.
//
// Modeled on the homepage filter dropdowns (pm-custom-dropdown pattern) but
// packaged as a standalone component with its own scoped CSS. Two size
// variants keep it appropriate for both compact filter bars and full-width
// form fields:
//   - size="form"    (default) — matches form-input height (~40px), full width
//   - size="compact"           — matches homepage filter chip (~34px)
//
// Props
//   value        current selection (string / number). Compared with ===.
//   onChange     (value) => void
//   options      Array<Option> where Option is either:
//                  - a string  ("Plumbing")  — used as both value and label
//                  - an object { value, label, icon?, disabled? }
//   placeholder  Text shown when value doesn't match any option
//   icon         Leading icon element for the trigger (e.g. <Building2 size={14}/>)
//   size         "form" | "compact"
//   disabled     boolean
//   id           passthrough for label htmlFor
//   ariaLabel    accessible label when there's no visible <label>
//   className    extra class on the outer wrapper
//   menuMaxHeight  override the default scrollable menu height
//
// Behavior
//   - Click trigger toggles the menu
//   - Backdrop absorbs outside clicks so it closes anywhere on the page
//   - Escape key closes the menu
//   - Selecting an option fires onChange + closes
//   - Menu positions absolutely below the trigger; auto-flips when it would
//     overflow the viewport bottom
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import "./CustomSelect.css";

const normalizeOption = (opt) =>
  typeof opt === "string" || typeof opt === "number"
    ? { value: opt, label: String(opt) }
    : opt;

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  icon = null,
  size = "form",
  disabled = false,
  id,
  ariaLabel,
  className = "",
  menuMaxHeight,
}) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const normalized = options.map(normalizeOption);
  const selected = normalized.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;
  const showingPlaceholder = !selected;

  const close = useCallback(() => setOpen(false), []);

  // Position guard — if the menu would spill past the viewport bottom, flip
  // it above the trigger. Runs whenever the menu opens.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const desired = menuMaxHeight || 260;
    setFlipUp(spaceBelow < desired + 20 && spaceAbove > spaceBelow);
  }, [open, menuMaxHeight]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const pick = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    close();
  };

  return (
    <div
      ref={wrapRef}
      className={`cs-root cs-${size} ${open ? "cs-open" : ""} ${disabled ? "cs-disabled" : ""} ${className}`}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="cs-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        {icon && <span className="cs-trigger-icon">{icon}</span>}
        <span className={`cs-trigger-label ${showingPlaceholder ? "cs-placeholder" : ""}`}>
          {label}
        </span>
        <ChevronDown size={14} className="cs-chevron" />
      </button>

      {open && (
        <>
          {/* Backdrop — fixed layer that catches every outside click so the
              menu closes reliably even when the parent has its own overlays. */}
          <div className="cs-backdrop" onClick={close} />
          <div
            ref={menuRef}
            role="listbox"
            className={`cs-menu ${flipUp ? "cs-menu-flip" : ""}`}
            style={menuMaxHeight ? { maxHeight: menuMaxHeight } : undefined}
          >
            {normalized.length === 0 ? (
              <div className="cs-empty">No options</div>
            ) : (
              normalized.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    disabled={opt.disabled}
                    className={`cs-option ${isActive ? "cs-active" : ""} ${opt.disabled ? "cs-option-disabled" : ""}`}
                    onClick={() => pick(opt)}
                  >
                    {opt.icon && <span className="cs-option-icon">{opt.icon}</span>}
                    <span className="cs-option-label">{opt.label}</span>
                    {isActive && <Check size={14} className="cs-check" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
