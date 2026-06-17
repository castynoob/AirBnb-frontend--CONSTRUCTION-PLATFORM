// =============================================================================
// MyProperties — admin's own (admin_owner_id) property portfolio.
// Distinct from /admin/properties (all-platform moderation list).
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, RefreshCw, Search, Building2, MapPin, Layers, AlertCircle,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminPropertyFormModal from "../components/AdminPropertyFormModal";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function MyProperties() {
  const { getToken, isAdminOrHigher } = useAdminAuth();
  const canManage = typeof isAdminOrHigher === "function" ? isAdminOrHigher() : false;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/admin/my-properties`);
      if (search.trim()) url.searchParams.set("search", search.trim());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load properties");
      setProperties(data.properties || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async () => {
    if (!deletingProperty) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/properties/${deletingProperty.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("Property deleted");
      setDeletingProperty(null);
      fetchProperties();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inject form modal in admin-owned mode by overriding the default ownership.
  // Since AdminPropertyFormModal already defaults to "admin" mode for new
  // properties, we don't need to do anything special here.

  return (
    <div className="admin-properties">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">My Properties</h1>
          <p className="admin-page-subtitle">
            Properties owned directly by you as an admin. These don't belong to any property manager.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchProperties}>
            <RefreshCw size={16} /> Refresh
          </button>
          {canManage && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => { setEditingProperty(null); setShowForm(true); }}
            >
              <Plus size={16} /> New property
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: "relative", maxWidth: 380 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          type="text"
          placeholder="Search by address, city, building name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", paddingLeft: 36, padding: "9px 12px 9px 36px",
            border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit",
          }}
        />
      </div>

      {/* Property cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : properties.length === 0 ? (
        <div style={EmptyStyles.empty}>
          <Building2 size={36} color="#cbd5e1" />
          <p style={{ margin: "12px 0 4px", color: "#0F223D", fontWeight: 600 }}>
            You don't own any properties yet
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            Click <strong>New property</strong> to create one — you can also
            drop a pin on the map and we'll fill in the address.
          </p>
        </div>
      ) : (
        <div style={GridStyles.grid}>
          {properties.map((p) => (
            <div key={p.id} style={GridStyles.card}>
              <div style={GridStyles.cardHeader}>
                <div style={GridStyles.iconBox}>
                  <Building2 size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={GridStyles.cardTitle}>
                    {p.building_name || p.address}
                  </h3>
                  <p style={GridStyles.cardMeta}>
                    <MapPin size={12} /> {p.address}, {p.city}
                  </p>
                </div>
              </div>
              <div style={GridStyles.cardFooter}>
                <span style={GridStyles.chip}>{p.building_type}</span>
                {p.num_units > 0 && (
                  <span style={GridStyles.chip}>
                    <Layers size={11} /> {p.num_units} units
                  </span>
                )}
                {p.job_count > 0 && (
                  <span style={GridStyles.chipGreen}>{p.job_count} jobs</span>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  {canManage && (
                    <>
                      <button
                        style={GridStyles.iconBtn}
                        onClick={() => { setEditingProperty(p); setShowForm(true); }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        style={{ ...GridStyles.iconBtn, color: "#dc2626" }}
                        onClick={() => setDeletingProperty(p)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AdminPropertyFormModal
        isOpen={showForm}
        property={editingProperty}
        onClose={() => { setShowForm(false); setEditingProperty(null); }}
        onSuccess={fetchProperties}
      />

      {/* Delete confirm */}
      {deletingProperty && (
        <DeleteConfirm
          title="Delete this property?"
          desc="This will permanently remove the property and cascade-delete its jobs."
          subject={`${deletingProperty.building_name || deletingProperty.address} — ${deletingProperty.city}`}
          isDeleting={isDeleting}
          onCancel={() => setDeletingProperty(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Shared delete confirm — reused by MyJobs.jsx too via export below
// -----------------------------------------------------------------------------
export function DeleteConfirm({ title, desc, subject, isDeleting, onCancel, onConfirm }) {
  return (
    <div
      onClick={() => !isDeleting && onCancel()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,34,61,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 20px 50px rgba(15,34,61,0.18)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F223D" }}>{title}</div>
        </div>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.5, margin: "0 0 8px" }}>{desc}</p>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F223D", padding: "8px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 16, wordBreak: "break-word" }}>
          {subject}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ flex: 1, padding: "10px 20px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 500, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            style={{ flex: 1, background: isDeleting ? "#fca5a5" : "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Styles (local to this page)
// =============================================================================
const EmptyStyles = {
  empty: {
    padding: 60, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb",
    borderRadius: 12, marginTop: 16,
  },
};

const GridStyles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
  card: {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
    padding: 14, display: "flex", flexDirection: "column", gap: 10,
  },
  cardHeader: { display: "flex", gap: 12, alignItems: "flex-start" },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    background: "linear-gradient(135deg, #00A5A9, #008C8F)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
    flexShrink: 0,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#0F223D", margin: 0, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardMeta: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardFooter: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 },
  chip: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#475569" },
  chipGreen: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#166534" },
  iconBtn: {
    width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, color: "#374151",
    cursor: "pointer",
  },
};
