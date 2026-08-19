// =============================================================================
// PropertyResidentsSection — the "Residents" block shown inside the Property
// Details modal. PMs use it to see who's on the roster, invite new residents,
// and remove existing ones.
//
// Backed by:
//   GET    /api/properties/:id/residents
//   POST   /api/properties/:id/residents/invite
//   DELETE /api/properties/:id/residents/invites/:inviteId
//   DELETE /api/properties/:id/residents/:userId
//
// UX contract:
//   • Current residents: name + unit + email/phone + Remove button
//   • Pending invites: email + kind pill + Cancel button
//   • Invite modal: email (required), unit (optional), message (optional)
//   • After invite: toast "Invitation sent" — kind determines whether we
//     mention "email link" (signup) or "in-app notification" (link_existing).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { UserPlus, Users, X, Trash2, Mail, Send, Search, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";
import BulkImportModal from "./BulkImportModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

const fullName = (first, last) =>
  `${first || ""} ${last || ""}`.trim() || "—";

// Fallback helper — t() returns the key when unresolved, so `t(key) || fb`
// never falls back. This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

export default function PropertyResidentsSection({ propertyId }) {
  const { t } = useLanguage();
  const [residents, setResidents] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [pickedResident, setPickedResident] = useState(null); // {id, first_name, last_name, email}
  const [inviteUnit, setInviteUnit] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // {userId, name}
  const [bulkOpen, setBulkOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token || !propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}/residents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setResidents(body.residents || []);
      setPending(body.pending_invites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // Debounced resident search — fires while the PM types in the invite modal.
  // Skip if a resident is already picked; the input is disabled at that point.
  useEffect(() => {
    if (!inviteOpen || pickedResident) return;
    const q = inviteQuery.trim();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.length < 2) { setInviteResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      const token = getToken();
      try {
        const res = await fetch(
          `${API_BASE}/api/residents/search?q=${encodeURIComponent(q)}&exclude_property=${propertyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const body = await res.json();
        setInviteResults(body.residents || []);
      } catch { /* silent */ }
    }, 300);
    return () => searchDebounceRef.current && clearTimeout(searchDebounceRef.current);
  }, [inviteQuery, inviteOpen, pickedResident, propertyId]);

  const resetInviteForm = () => {
    setInviteQuery(""); setInviteResults([]);
    setPickedResident(null);
    setInviteUnit(""); setInviteMessage("");
  };

  const submitInvite = async (e) => {
    e?.preventDefault?.();
    if (!pickedResident) return;
    setSending(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}/residents/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resident_user_id: pickedResident.id,
          unit_number: inviteUnit.trim() || undefined,
          message: inviteMessage.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.message || "Couldn't send invite.");
        return;
      }
      const name = `${pickedResident.first_name || ""} ${pickedResident.last_name || ""}`.trim() || "the resident";
      toast.success(
        tf(t, 'residents.toastInviteSent', "Invite sent to {{name}}. They'll see it in their notifications.")
          .replace('{{name}}', name)
      );
      setInviteOpen(false);
      resetInviteForm();
      load();
    } catch (err) {
      toast.error(tf(t, 'residents.networkError', "Network error."));
    } finally {
      setSending(false);
    }
  };

  const cancelInvite = async (inviteId) => {
    const token = getToken();
    try {
      const res = await fetch(
        `${API_BASE}/api/properties/${propertyId}/residents/invites/${inviteId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      toast.success(tf(t, 'residents.toastCancelled', "Invite cancelled."));
      load();
    } catch { toast.error(tf(t, 'residents.toastCancelFailed', "Couldn't cancel invite.")); }
  };

  const removeResident = async () => {
    if (!confirmRemove) return;
    const token = getToken();
    try {
      const res = await fetch(
        `${API_BASE}/api/properties/${propertyId}/residents/${confirmRemove.userId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      toast.success(
        tf(t, 'residents.toastRemoved', "{{name}} removed from this property.")
          .replace('{{name}}', confirmRemove.name)
      );
      setConfirmRemove(null);
      load();
    } catch { toast.error(tf(t, 'residents.toastRemoveFailed', "Couldn't remove resident.")); }
  };

  return (
    <div className="mp-modal-section">
      <div style={s.header}>
        <h3 style={{ margin: 0 }}>
          <Users size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {tf(t, 'residents.sectionTitle', 'Residents')}
          <span style={s.count}>{residents.length}</span>
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setBulkOpen(true)} style={s.bulkBtn}>
            <Upload size={14} />
            {tf(t, 'residents.bulkImportBtn', 'Bulk import')}
          </button>
          <button type="button" onClick={() => setInviteOpen(true)} style={s.inviteBtn}>
            <UserPlus size={14} />
            {tf(t, 'residents.inviteBtn', 'Invite resident')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={s.empty}>{tf(t, 'residents.loading', 'Loading…')}</div>
      ) : residents.length === 0 && pending.length === 0 ? (
        <div style={s.empty}>
          <p style={{ margin: 0, fontWeight: 600, color: "#0F223D" }}>{tf(t, 'residents.noResidents', 'No residents yet.')}</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            {tf(t, 'residents.noResidentsHint', 'Invite someone by name or email to get started.')}
          </p>
        </div>
      ) : (
        <>
          {residents.length > 0 && (
            <ul style={s.list}>
              {residents.map((r) => (
                <li key={r.user_id} style={s.row}>
                  <div style={s.avatar}>
                    {r.profile_picture
                      ? <img src={r.profile_picture} alt="" style={s.avatarImg} />
                      : <span>{(r.first_name || "?")[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.rowName}>{fullName(r.first_name, r.last_name)}</div>
                    <div style={s.rowMeta}>
                      {r.unit_number ? `Unit ${r.unit_number} · ` : ""}
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove({ userId: r.user_id, name: fullName(r.first_name, r.last_name) })}
                    style={s.removeBtn}
                    title="Remove from property"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pending.length > 0 && (
            <>
              <div style={s.subheader}>{tf(t, 'residents.pendingInvites', 'Pending invites')}</div>
              <ul style={s.list}>
                {pending.map((inv) => (
                  <li key={inv.id} style={{ ...s.row, background: "#fffbeb", borderColor: "#fde68a" }}>
                    <div style={{ ...s.avatar, background: "#f59e0b" }}>
                      <Mail size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.rowName}>{inv.invited_email}</div>
                      <div style={s.rowMeta}>
                        {inv.invited_unit_number ? `${tf(t, 'residents.unit', 'Unit')} ${inv.invited_unit_number} · ` : ""}
                        <span style={{
                          padding: "1px 8px", borderRadius: 999,
                          background: inv.kind === "link_existing" ? "#eef4ff" : "#fef3c7",
                          color: inv.kind === "link_existing" ? "#1e40af" : "#92400e",
                          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {inv.kind === "link_existing" ? tf(t, 'residents.pillExisting', 'existing resident') : tf(t, 'residents.pillSignup', 'signup link')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelInvite(inv.id)}
                      style={s.cancelBtn}
                    >
                      {tf(t, 'residents.cancelInvite', 'Cancel')}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Invite modal — autocomplete picker of existing resident accounts */}
      {inviteOpen && (
        <div style={s.backdrop} onClick={() => { setInviteOpen(false); resetInviteForm(); }}>
          <form
            onSubmit={submitInvite}
            style={s.modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalEyebrow}>{tf(t, 'residents.inviteEyebrow', 'Invite to property')}</div>
                <div style={s.modalTitle}>{tf(t, 'residents.inviteTitle', 'Add a resident')}</div>
              </div>
              <button
                type="button"
                onClick={() => { setInviteOpen(false); resetInviteForm(); }}
                style={s.modalClose}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={s.field}>
                <span style={s.label}>{tf(t, 'residents.findResident', 'Find a resident')}</span>
                {pickedResident ? (
                  // Selected-resident chip. Clicking × clears the pick and
                  // returns the search input.
                  <div style={s.pickedChip}>
                    <div style={{ ...s.avatar, width: 32, height: 32 }}>
                      <span>{(pickedResident.first_name || "?")[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 14 }}>
                        {fullName(pickedResident.first_name, pickedResident.last_name)}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pickedResident.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickedResident(null)}
                      style={s.chipClear}
                      title={tf(t, 'residents.changeResident', 'Change resident')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      value={inviteQuery}
                      onChange={(e) => setInviteQuery(e.target.value)}
                      placeholder={tf(t, 'residents.searchPlaceholder', 'Search by name or email…')}
                      style={{ ...s.input, paddingLeft: 32 }}
                      autoFocus
                    />
                    {/* Results dropdown */}
                    {inviteQuery.trim().length >= 2 && (
                      <div style={s.dropdown}>
                        {inviteResults.length === 0 ? (
                          <div style={{ padding: 12, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
                            {tf(t, 'residents.noMatches', 'No matching residents.')}
                          </div>
                        ) : (
                          inviteResults.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setPickedResident(r)}
                              style={s.dropdownRow}
                              disabled={!!r.current_property_id}
                              title={r.current_property_id ? tf(t, 'residents.onAnotherProperty', 'on another property') : ""}
                            >
                              <div style={s.avatar}>
                                {r.profile_picture
                                  ? <img src={r.profile_picture} alt="" style={s.avatarImg} />
                                  : <span>{(r.first_name || "?")[0].toUpperCase()}</span>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {fullName(r.first_name, r.last_name)}
                                </div>
                                <div style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.email}
                                </div>
                              </div>
                              {r.current_property_id && (
                                <span style={s.dropdownBadge}>{tf(t, 'residents.onAnotherProperty', 'on another property')}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label style={s.field}>
                <span style={s.label}>{tf(t, 'residents.unitLabel', 'Unit number')} <span style={{ color: "#94a3b8", fontWeight: 400 }}>{tf(t, 'union.optionalTag', '(optional)')}</span></span>
                <input
                  type="text"
                  value={inviteUnit}
                  onChange={(e) => setInviteUnit(e.target.value)}
                  placeholder={tf(t, 'residents.unitPlaceholder', 'e.g. 302')}
                  style={s.input}
                />
              </label>
              <label style={s.field}>
                <span style={s.label}>{tf(t, 'residents.welcomeLabel', 'Welcome note')} <span style={{ color: "#94a3b8", fontWeight: 400 }}>{tf(t, 'union.optionalTag', '(optional)')}</span></span>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={tf(t, 'residents.welcomePlaceholder', 'Include anything they should know about the building.')}
                  style={{ ...s.input, resize: "vertical" }}
                />
              </label>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                {tf(t, 'residents.inviteHelper', 'The resident will get an in-app notification with an Accept / Decline card on their home page. Nothing is emailed.')}
              </p>
            </div>

            <div style={s.modalFooter}>
              <button
                type="button"
                onClick={() => { setInviteOpen(false); resetInviteForm(); }}
                style={s.btnGhost}
                disabled={sending}
              >
                {tf(t, 'residents.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={!pickedResident || sending}
                style={{
                  ...s.btnPrimary,
                  ...(!pickedResident || sending ? { opacity: 0.6, cursor: "not-allowed" } : {}),
                }}
              >
                <Send size={14} />
                {sending ? tf(t, 'residents.sending', 'Sending…') : tf(t, 'residents.sendInvite', 'Send invite')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk import modal — download template, fill, upload, see per-row report */}
      <BulkImportModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => load()}
        templateUrl={`/api/properties/${propertyId}/residents/import-template`}
        uploadUrl={`/api/properties/${propertyId}/residents/bulk-import`}
        templateFilename={`intervos_residents_template.xlsx`}
        title={tf(t, 'residents.bulkModalTitle', 'Bulk import residents')}
        subtitle={tf(t, 'residents.bulkModalSubtitle', 'Upload a spreadsheet of residents to invite them all at once.')}
        entityLabel={tf(t, 'residents.entityLabel', 'residents')}
      />

      {/* Remove-confirm modal */}
      {confirmRemove && (
        <div style={s.backdrop} onClick={() => setConfirmRemove(null)}>
          <div style={{ ...s.modalPanel, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalEyebrow}>{tf(t, 'residents.removeEyebrow', 'Remove resident')}</div>
                <div style={s.modalTitle}>{confirmRemove.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                style={s.modalClose}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                {tf(t, 'residents.removeBody', "They'll be unlinked from this property. Their account and profile stay intact — you can invite them back or link them to a different property later.")}
              </p>
            </div>
            <div style={s.modalFooter}>
              <button type="button" onClick={() => setConfirmRemove(null)} style={s.btnGhost}>
                {tf(t, 'residents.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={removeResident}
                style={{ ...s.btnPrimary, background: "#dc2626" }}
              >
                <Trash2 size={14} />
                {tf(t, 'residents.remove', 'Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12, gap: 12, flexWrap: "wrap",
  },
  count: {
    display: "inline-block", marginLeft: 8,
    padding: "1px 8px", borderRadius: 999,
    background: "#e5e7eb", color: "#0F223D",
    fontSize: 11, fontWeight: 700,
  },
  inviteBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#14919B", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  bulkBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", background: "#fff", color: "#0F223D",
    border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  empty: {
    padding: 24, textAlign: "center",
    background: "#f8fafc", border: "1px dashed #d1d5db", borderRadius: 10,
  },
  subheader: {
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.06em",
    margin: "16px 0 8px",
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg, #14919B, #0F223D)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  rowName: {
    fontWeight: 600, color: "#0F223D", fontSize: 14,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  rowMeta: {
    fontSize: 12, color: "#6b7280", marginTop: 2,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  removeBtn: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    width: 30, height: 30, borderRadius: 8, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cancelBtn: {
    background: "#fff", border: "1px solid #e5e7eb", color: "#0F223D",
    padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
  },

  // Modal shell (shared by invite + confirm modals)
  backdrop: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,34,61,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  modalPanel: {
    background: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 480,
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    fontFamily: "inherit",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
  },
  modalEyebrow: {
    fontSize: 12, color: "#94a3b8", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#0F223D", marginTop: 4 },
  modalClose: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#0F223D",
  },
  modalFooter: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    padding: "14px 20px", borderTop: "1px solid #f1f5f9",
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: {
    fontSize: 12, fontWeight: 700, color: "#0F223D",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  input: {
    padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
    fontSize: 13, fontFamily: "inherit", color: "#0F223D",
    outline: "none", boxSizing: "border-box", width: "100%",
  },

  // Autocomplete picker chip (selected resident) + results dropdown
  pickedChip: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px",
    background: "#ecfeff", border: "1px solid #67e8f9",
    borderRadius: 10,
  },
  chipClear: {
    background: "#fff", border: "1px solid #67e8f9", color: "#0e7490",
    width: 28, height: 28, borderRadius: 8, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
    boxShadow: "0 6px 20px rgba(15,34,61,0.08)",
    maxHeight: 260, overflowY: "auto", zIndex: 10,
    display: "flex", flexDirection: "column",
  },
  dropdownRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px",
    background: "#fff", border: "none", borderBottom: "1px solid #f1f5f9",
    cursor: "pointer", fontFamily: "inherit", width: "100%",
    textAlign: "left",
  },
  dropdownBadge: {
    padding: "2px 8px", borderRadius: 999,
    background: "#fef3c7", color: "#92400e",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.05em", flexShrink: 0,
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
};
