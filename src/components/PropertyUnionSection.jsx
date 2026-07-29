// =============================================================================
// PropertyUnionSection — the "Union" block inside the Property Details modal.
// Shows the property's current union (if any), lets the PM create + join a
// union, and post broadcasts from here.
//
// MVP UX:
//   • No union yet → "Attach to a union" panel with two paths:
//       – Pick from unions I already created
//       – Create a new one inline
//   • Union attached → union card + broadcasts list + "Post broadcast" button
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Users, Plus, Megaphone, X, Send, Trash2, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

// Fallback helper — t() returns the key when unresolved, which is truthy,
// so `t(key) || fallback` never falls back. This does.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

// Category colours only. Labels are resolved via i18n at render time.
const CATEGORY_COLORS = {
  notice:      { bg: "#eef4ff", color: "#1e40af" },
  event:       { bg: "#dcfce7", color: "#166534" },
  maintenance: { bg: "#fef3c7", color: "#92400e" },
  emergency:   { bg: "#fee2e2", color: "#7f1d1d" },
};

export default function PropertyUnionSection({ propertyId }) {
  const { t, language } = useLanguage();
  const catLabel = (cat) => tf(t, `union.cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`, cat);
  const [union, setUnion] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [myUnions, setMyUnions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token || !propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/unions/property/${propertyId}/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setUnion(body.union || null);
      setBroadcasts(body.broadcasts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // Pull my-unions lazily — only when the attach modal opens.
  const loadMyUnions = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/unions/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const body = await res.json();
      setMyUnions(body.unions || []);
    } catch { /* silent */ }
  }, []);

  return (
    <div className="mp-modal-section">
      <div style={s.header}>
        <h3 style={{ margin: 0 }}>
          <Users size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {tf(t, 'union.sectionTitle', 'Union / Condo Association')}
        </h3>
        {union && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            style={s.postBtn}
          >
            <Megaphone size={14} />
            {tf(t, 'union.postBroadcast', 'Post broadcast')}
          </button>
        )}
      </div>

      {loading ? (
        <div style={s.empty}>{tf(t, 'union.loading', 'Loading…')}</div>
      ) : !union ? (
        <div style={s.emptyPanel}>
          <p style={{ margin: 0, fontWeight: 600, color: "#0F223D" }}>
            {tf(t, 'union.noUnionTitle', "This property isn't linked to any union yet.")}
          </p>
          <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            {tf(t, 'union.noUnionBody', 'Attach it to a condo association / union so residents receive cross-property broadcasts here (announcements, notices, emergencies).')}
          </p>
          <button
            type="button"
            onClick={() => { setAttachOpen(true); loadMyUnions(); }}
            style={s.primaryBtn}
          >
            <Plus size={14} />
            {tf(t, 'union.attachBtn', 'Attach to a union')}
          </button>
        </div>
      ) : (
        <>
          <div style={s.unionCard}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F223D" }}>
              {union.name}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {[union.city, union.province].filter(Boolean).join(", ") || tf(t, 'union.noLocation', 'No location')}
              {union.contact_email && ` · ${union.contact_email}`}
            </div>
            {union.description && (
              <div style={{ fontSize: 13, color: "#334155", marginTop: 8, lineHeight: 1.55 }}>
                {union.description}
              </div>
            )}
          </div>

          <div style={s.subheader}>{tf(t, 'union.recentBroadcasts', 'Recent broadcasts')} ({broadcasts.length})</div>
          {broadcasts.length === 0 ? (
            <div style={s.empty}>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
                {tf(t, 'union.noBroadcastsPm', 'No broadcasts yet. Post one to get started.')}
              </p>
            </div>
          ) : (
            <ul style={s.broadcastList}>
              {broadcasts.slice(0, 5).map((b) => {
                const colors = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.notice;
                const author = `${b.author_first_name || ""} ${b.author_last_name || ""}`.trim() || tf(t, 'union.unionBadge', 'Union');
                return (
                  <li key={b.id} style={s.broadcast}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999,
                        background: colors.bg, color: colors.color,
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{catLabel(b.category)}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(b.published_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 14 }}>{b.title}</div>
                    <div style={{ fontSize: 13, color: "#334155", marginTop: 4, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {b.body}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>— {author}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Attach-to-union modal (create new OR pick existing) */}
      {attachOpen && (
        <AttachUnionModal
          propertyId={propertyId}
          myUnions={myUnions}
          t={t}
          onClose={() => setAttachOpen(false)}
          onAttached={() => { setAttachOpen(false); load(); }}
          onNewUnion={loadMyUnions}
        />
      )}

      {/* Broadcast composer */}
      {composerOpen && union && (
        <BroadcastComposer
          unionId={union.id}
          t={t}
          catLabel={catLabel}
          onClose={() => setComposerOpen(false)}
          onPosted={() => { setComposerOpen(false); load(); }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// AttachUnionModal — pick from existing unions OR create + attach.
// -----------------------------------------------------------------------------
function AttachUnionModal({ propertyId, myUnions, t, onClose, onAttached, onNewUnion }) {
  const tt = (key, fallback) => { const v = t(key); return v === key ? fallback : v; };
  const [mode, setMode] = useState(myUnions.length > 0 ? "pick" : "create");
  const [pickedId, setPickedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [busy, setBusy] = useState(false);

  const attach = async (unionId) => {
    setBusy(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/unions/${unionId}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: propertyId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || tt('union.toastAttachFailed', "Couldn't attach property."));
      toast.success(tt('union.toastAttached', 'Property attached to union.'));
      onAttached?.();
    } catch (err) {
      toast.error(err.message || tt('union.networkError', 'Network error.'));
    } finally { setBusy(false); }
  };

  const createThenAttach = async (e) => {
    e?.preventDefault?.();
    if (!newName.trim()) return;
    setBusy(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/unions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          city: newCity.trim() || undefined,
          province: newProvince.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || tt('union.toastCreateFailed', "Couldn't create union."));
      onNewUnion?.();
      // Chain: attach the property to the newly created union.
      await attach(body.union.id);
    } catch (err) {
      toast.error(err.message || tt('union.networkError', 'Network error.'));
      setBusy(false);
    }
  };

  const memberCountLabel = (u) =>
    tt('union.memberCount', '{{count}} properties · {{broadcasts}} broadcasts')
      .replace('{{count}}', u.member_count)
      .replace('{{broadcasts}}', u.broadcast_count);

  return (
    <div style={sMod.backdrop} onClick={onClose}>
      <div style={sMod.panel} onClick={(e) => e.stopPropagation()}>
        <div style={sMod.header}>
          <div>
            <div style={sMod.eyebrow}>{tt('union.attachEyebrow', 'Attach to a union')}</div>
            <div style={sMod.title}>{tt('union.attachTitle', 'Choose or create')}</div>
          </div>
          <button type="button" onClick={onClose} style={sMod.close}><X size={18} /></button>
        </div>

        <div style={{ padding: "0 20px" }}>
          <div style={sMod.tabs}>
            <button
              type="button"
              onClick={() => setMode("pick")}
              style={{ ...sMod.tab, ...(mode === "pick" ? sMod.tabActive : {}) }}
              disabled={myUnions.length === 0}
            >
              {tt('union.pickExisting', 'Pick existing')} ({myUnions.length})
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              style={{ ...sMod.tab, ...(mode === "create" ? sMod.tabActive : {}) }}
            >
              {tt('union.createNew', 'Create new')}
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 20px", flex: 1, overflowY: "auto" }}>
          {mode === "pick" ? (
            myUnions.length === 0 ? (
              <div style={sMod.empty}>{tt('union.pickEmpty', "You haven't created any unions yet. Switch to \"Create new\".")}</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {myUnions.map((u) => (
                  <li key={u.id}>
                    <label style={{ ...sMod.row, ...(pickedId === u.id ? sMod.rowSelected : {}) }}>
                      <input
                        type="radio"
                        name="union-pick"
                        checked={pickedId === u.id}
                        onChange={() => setPickedId(u.id)}
                        style={{ marginRight: 12, accentColor: "#14919B" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#0F223D", fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {memberCountLabel(u)}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <form onSubmit={createThenAttach} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={sMod.field}>
                <span style={sMod.label}>{tt('union.unionNameLabel', 'Union name')}</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required style={sMod.input} placeholder={tt('union.unionNamePlaceholder', 'e.g. Le Solano Condo Association')} />
              </label>
              <label style={sMod.field}>
                <span style={sMod.label}>{tt('union.descriptionLabel', 'Description')} <span style={{ color: "#94a3b8", fontWeight: 400 }}>{tt('union.optionalTag', '(optional)')}</span></span>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} style={{ ...sMod.input, resize: "vertical" }} placeholder={tt('union.descriptionPlaceholder', 'Short blurb about the union.')} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={sMod.field}>
                  <span style={sMod.label}>{tt('union.cityLabel', 'City')}</span>
                  <input value={newCity} onChange={(e) => setNewCity(e.target.value)} style={sMod.input} placeholder={tt('union.cityPlaceholder', 'Montréal')} />
                </label>
                <label style={sMod.field}>
                  <span style={sMod.label}>{tt('union.provinceLabel', 'Province')}</span>
                  <input value={newProvince} onChange={(e) => setNewProvince(e.target.value)} style={sMod.input} placeholder={tt('union.provincePlaceholder', 'QC')} />
                </label>
              </div>
            </form>
          )}
        </div>

        <div style={sMod.footer}>
          <button type="button" onClick={onClose} style={sMod.btnGhost} disabled={busy}>{tt('union.cancel', 'Cancel')}</button>
          {mode === "pick" ? (
            <button
              type="button"
              onClick={() => attach(pickedId)}
              disabled={!pickedId || busy}
              style={{ ...sMod.btnPrimary, ...(!pickedId || busy ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
            >
              {tt('union.attachProperty', 'Attach property')}
            </button>
          ) : (
            <button
              type="button"
              onClick={createThenAttach}
              disabled={!newName.trim() || busy}
              style={{ ...sMod.btnPrimary, ...(!newName.trim() || busy ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
            >
              {tt('union.createAndAttach', 'Create & attach')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BroadcastComposer
// -----------------------------------------------------------------------------
function BroadcastComposer({ unionId, t, catLabel, onClose, onPosted }) {
  const tt = (key, fallback) => { const v = t(key); return v === key ? fallback : v; };
  const [category, setCategory] = useState("notice");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (e) => {
    e?.preventDefault?.();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/unions/${unionId}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, title: title.trim(), body: body.trim() }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b.message || tt('union.toastPostFailed', "Couldn't post broadcast."));
      toast.success(tt('union.toastPosted', 'Broadcast posted to all member properties.'));
      onPosted?.();
    } catch (err) {
      toast.error(err.message || tt('union.networkError', 'Network error.'));
    } finally { setBusy(false); }
  };

  return (
    <div style={sMod.backdrop} onClick={onClose}>
      <form onSubmit={post} style={sMod.panel} onClick={(e) => e.stopPropagation()}>
        <div style={sMod.header}>
          <div>
            <div style={sMod.eyebrow}>{tt('union.composerEyebrow', 'Union broadcast')}</div>
            <div style={sMod.title}>{tt('union.composerTitle', 'Post to all member properties')}</div>
          </div>
          <button type="button" onClick={onClose} style={sMod.close}><X size={18} /></button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={sMod.label}>{tt('union.categoryLabel', 'Category')}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {["notice", "event", "maintenance", "emergency"].map((c) => {
                const colors = CATEGORY_COLORS[c];
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    style={{
                      padding: "6px 12px", borderRadius: 999,
                      background: active ? colors.color : "#fff",
                      color: active ? "#fff" : colors.color,
                      border: `1px solid ${colors.color}`,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {catLabel(c)}
                  </button>
                );
              })}
            </div>
          </div>
          <label style={sMod.field}>
            <span style={sMod.label}>{tt('union.titleLabel', 'Title')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} style={sMod.input} placeholder={tt('union.titlePlaceholder', 'e.g. Water shutoff Saturday 8am–12pm')} />
          </label>
          <label style={sMod.field}>
            <span style={sMod.label}>{tt('union.bodyLabel', 'Body')}</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5} maxLength={2000} style={{ ...sMod.input, resize: "vertical" }} placeholder={tt('union.bodyPlaceholder', 'Details for residents…')} />
          </label>
        </div>
        <div style={sMod.footer}>
          <button type="button" onClick={onClose} style={sMod.btnGhost} disabled={busy}>{tt('union.cancel', 'Cancel')}</button>
          <button
            type="submit"
            disabled={!title.trim() || !body.trim() || busy}
            style={{ ...sMod.btnPrimary, ...(!title.trim() || !body.trim() || busy ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
          >
            <Send size={14} />
            {busy ? tt('union.posting', 'Posting…') : tt('union.postBroadcast', 'Post broadcast')}
          </button>
        </div>
      </form>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const s = {
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 },
  postBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 12px", background: "#14919B", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  empty: { padding: 20, textAlign: "center", background: "#f8fafc", border: "1px dashed #d1d5db", borderRadius: 10 },
  emptyPanel: {
    padding: 20, background: "#f8fafc",
    border: "1px dashed #cbd5e1", borderRadius: 10,
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 16px", background: "#14919B", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  unionCard: {
    padding: 14,
    background: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
    border: "1px solid #a5f3fc", borderRadius: 12,
    marginBottom: 16,
  },
  subheader: {
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.06em",
    margin: "0 0 8px",
  },
  broadcastList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  broadcast: {
    padding: 14,
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
  },
};

const sMod = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,34,61,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  panel: {
    background: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 520, maxHeight: "85vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: "inherit",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
  },
  eyebrow: { fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  title: { fontSize: 18, fontWeight: 700, color: "#0F223D", marginTop: 4 },
  close: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#0F223D",
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    padding: "14px 20px", borderTop: "1px solid #f1f5f9",
  },
  tabs: {
    display: "flex", gap: 4, padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  tab: {
    flex: 1, padding: "8px 12px", borderRadius: 8,
    background: "#fff", border: "1px solid transparent", color: "#64748b",
    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: { background: "#0F223D", color: "#fff" },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: {
    fontSize: 11, fontWeight: 700, color: "#0F223D",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  input: {
    padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
    fontSize: 13, fontFamily: "inherit", color: "#0F223D",
    outline: "none", boxSizing: "border-box", width: "100%",
  },
  empty: { padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 },
  row: {
    display: "flex", alignItems: "center",
    padding: "10px 12px",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
    cursor: "pointer",
  },
  rowSelected: { borderColor: "#14919B", background: "#ecfeff" },
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
