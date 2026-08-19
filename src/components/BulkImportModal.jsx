// =============================================================================
// BulkImportModal — reusable "download template, fill it, upload it back"
// modal. Entity-agnostic: pass templateUrl + uploadUrl + labels as props and
// the same component works for residents, properties, unions, or anything
// else we template in the future.
//
// Layout mirrors the InEight bulk-import pattern the user shared:
//   1. Drop zone / Browse button (top)
//   2. "Download template" link (bottom-right of the drop zone)
//   3. Cancel + Import buttons in the footer
//
// After a successful import, we render a per-row report the parent-supplied
// backend returned. Rows are grouped by status (created / skipped / errored)
// with counts, so a PM importing 60 rows can immediately see what needs
// attention without scrolling through everything.
//
// Contract with backend endpoints:
//   GET  templateUrl   → streams the .xlsx (Content-Disposition attachment)
//   POST uploadUrl     → multipart, single field named "file"
//                        200 → { summary: {total, created, skipped, errored},
//                                rows: [{rowNumber, email, status, message}] }
//                        4xx → { message }  or  { message, errors: [...] }
//
// Consumers pass onSuccess(report) so they can refetch their list once new
// rows land.
// =============================================================================

import { useRef, useState } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.token || null; }
  catch { return null; }
};

// t() returns the key when unresolved, so `t(key) || fb` never falls back.
const tf = (t, key, fallback) => { const v = t(key); return v === key ? fallback : v; };

export default function BulkImportModal({
  open,
  onClose,
  onSuccess,
  templateUrl,          // relative, e.g. "/api/properties/123/residents/import-template"
  uploadUrl,            // relative, e.g. "/api/properties/123/residents/bulk-import"
  templateFilename,     // suggested filename for the browser download
  title,
  subtitle,
  entityLabel,          // e.g. "residents" — shown in helper text
}) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState(null); // { summary, rows }
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!open) return null;

  const reset = () => { setFile(null); setReport(null); setError(null); };

  const close = () => { reset(); onClose?.(); };

  const pickFile = (f) => {
    setError(null); setReport(null);
    if (!f) { setFile(null); return; }
    // Very light client-side sanity check — server does the real one.
    const okExt = /\.(xlsx|xls|csv)$/i.test(f.name);
    if (!okExt) {
      setError(tf(t, "bulkImport.errBadExt", "Only .xlsx, .xls, or .csv files are supported."));
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) pickFile(f);
  };

  const downloadTemplate = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}${templateUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = templateFilename || "template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(tf(t, "bulkImport.dlFailed", "Couldn't download the template."));
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!file) return;
    setUploading(true); setError(null); setReport(null);
    const token = getToken();
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}${uploadUrl}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message || tf(t, "bulkImport.uploadFailed", "Import failed."));
        return;
      }
      setReport(body);
      onSuccess?.(body);
    } catch (err) {
      setError(tf(t, "bulkImport.networkError", "Network error."));
    } finally {
      setUploading(false);
    }
  };

  const grouped = report ? {
    created: report.rows.filter((r) => r.status === "created"),
    skipped: report.rows.filter((r) => r.status === "skipped"),
    errored: report.rows.filter((r) => r.status === "errored"),
  } : null;

  return (
    <div style={s.backdrop} onClick={close}>
      <form
        onSubmit={submit}
        style={s.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={s.header}>
          <div>
            <div style={s.eyebrow}>{tf(t, "bulkImport.eyebrow", "Bulk import")}</div>
            <div style={s.title}>{title || tf(t, "bulkImport.defaultTitle", "Import from spreadsheet")}</div>
            {subtitle && <div style={s.subtitle}>{subtitle}</div>}
          </div>
          <button type="button" onClick={close} style={s.close}><X size={18} /></button>
        </div>

        {/* Body — swaps between upload state and report state */}
        {!report ? (
          <div style={s.body}>
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                ...s.dropzone,
                borderColor: dragOver ? "#14919B" : "#cbd5e1",
                background: dragOver ? "#ecfeff" : "#f8fafc",
              }}
            >
              {file ? (
                <div style={s.fileChip}>
                  <FileSpreadsheet size={20} color="#14919B" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.fileName}>{file.name}</div>
                    <div style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                    style={s.chipClear}
                  ><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Upload size={22} color="#94a3b8" style={{ marginBottom: 6 }} />
                  <div style={s.dzTitle}>{tf(t, "bulkImport.dzTitle", "Upload file here")}</div>
                  <div style={s.dzSub}>{tf(t, "bulkImport.dzSub", "Excel (.xlsx, .xls) or CSV")}</div>
                  <button type="button" onClick={() => inputRef.current?.click()} style={s.browseBtn}>
                    {tf(t, "bulkImport.browse", "Browse")}
                  </button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => pickFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>

            {/* Template download link — same corner InEight puts it in */}
            <div style={s.dlRow}>
              <button type="button" onClick={downloadTemplate} style={s.dlLink}>
                <Download size={13} />
                {tf(t, "bulkImport.dlTemplate", "Download template")}
              </button>
            </div>

            <p style={s.helper}>
              {tf(
                t,
                "bulkImport.helper",
                "Download the template, fill in your {{entity}}, and upload it back here. Each template includes a Guide sheet explaining every field."
              ).replace("{{entity}}", entityLabel || tf(t, "bulkImport.entityGeneric", "rows"))}
            </p>

            {error && <div style={s.errorBox}>{error}</div>}
          </div>
        ) : (
          // -----------------------------------------------------------------
          // Report view. Grouped by status with counts. A PM importing 200
          // rows only cares about "what errored"; grouping surfaces that.
          // -----------------------------------------------------------------
          <div style={s.body}>
            <div style={s.summaryRow}>
              <SummaryPill icon={<CheckCircle2 size={14} />} label={tf(t, "bulkImport.created", "Created")}
                count={report.summary.created} tone="green" />
              <SummaryPill icon={<MinusCircle size={14} />} label={tf(t, "bulkImport.skipped", "Skipped")}
                count={report.summary.skipped} tone="amber" />
              <SummaryPill icon={<AlertTriangle size={14} />} label={tf(t, "bulkImport.errored", "Errored")}
                count={report.summary.errored} tone="red" />
            </div>
            <div style={s.reportList}>
              {["errored", "skipped", "created"].map((status) =>
                grouped[status].length > 0 && (
                  <ReportGroup
                    key={status}
                    status={status}
                    rows={grouped[status]}
                    t={t}
                  />
                )
              )}
            </div>
            <p style={s.helper}>
              {tf(
                t,
                "bulkImport.reportHelper",
                "Fix any errored rows in your file and re-import — already-created rows will be skipped automatically."
              )}
            </p>
          </div>
        )}

        <div style={s.footer}>
          {!report ? (
            <>
              <button type="button" onClick={close} style={s.btnGhost} disabled={uploading}>
                {tf(t, "bulkImport.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                style={{ ...s.btnPrimary, ...(!file || uploading ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
              >
                <Upload size={14} />
                {uploading ? tf(t, "bulkImport.uploading", "Importing…") : tf(t, "bulkImport.import", "Import")}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={reset} style={s.btnGhost}>
                {tf(t, "bulkImport.importAnother", "Import another file")}
              </button>
              <button type="button" onClick={close} style={s.btnPrimary}>
                {tf(t, "bulkImport.done", "Done")}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SummaryPill / ReportGroup — internal presentational bits. Kept in the same
// file to keep the modal self-contained; they're not used anywhere else.
// -----------------------------------------------------------------------------
const TONE = {
  green: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" },
  amber: { bg: "#fef3c7", border: "#fde68a", color: "#92400e" },
  red:   { bg: "#fee2e2", border: "#fecaca", color: "#991b1b" },
};
const STATUS_TONE = { created: "green", skipped: "amber", errored: "red" };
const STATUS_LABEL = { created: "Created", skipped: "Skipped", errored: "Errored" };

function SummaryPill({ icon, label, count, tone }) {
  const t = TONE[tone];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 999,
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      fontSize: 13, fontWeight: 700,
    }}>
      {icon}
      <span>{count}</span>
      <span style={{ fontWeight: 500, opacity: 0.85 }}>{label}</span>
    </div>
  );
}

function ReportGroup({ status, rows, t }) {
  const tone = TONE[STATUS_TONE[status]];
  const label = STATUS_LABEL[status];
  return (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: tone.color, marginBottom: 6 }}>
        {tf(t, `bulkImport.${status}`, label)} ({rows.length})
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r) => (
          <li key={`${status}-${r.rowNumber}-${r.email}`} style={{ fontSize: 12, color: "#0F223D", display: "flex", gap: 8 }}>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "#64748b", minWidth: 42 }}>
              {tf(t, "bulkImport.row", "Row")} {r.rowNumber}
            </span>
            <span style={{ fontWeight: 600 }}>{r.email || "—"}</span>
            <span style={{ color: "#475569" }}>— {r.message}</span>
          </li>
        ))}
      </ul>
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
    width: "100%", maxWidth: 560, maxHeight: "90vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    fontFamily: "inherit",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
  },
  eyebrow: {
    fontSize: 12, color: "#94a3b8", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  title: { fontSize: 18, fontWeight: 700, color: "#0F223D", marginTop: 4 },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  close: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#0F223D", flexShrink: 0,
  },
  body: { padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  dropzone: {
    border: "2px dashed #cbd5e1", borderRadius: 12,
    padding: 28, textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center",
    transition: "background 120ms, border-color 120ms",
  },
  dzTitle: { fontSize: 14, fontWeight: 600, color: "#0F223D" },
  dzSub: { fontSize: 12, color: "#64748b", marginTop: 2, marginBottom: 12 },
  browseBtn: {
    padding: "9px 20px", background: "#14919B", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  fileChip: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", width: "100%", maxWidth: 420,
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
  },
  fileName: {
    fontWeight: 600, color: "#0F223D", fontSize: 13,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    textAlign: "left",
  },
  fileSize: { fontSize: 11, color: "#94a3b8", textAlign: "left" },
  chipClear: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    width: 28, height: 28, borderRadius: 8, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  dlRow: { display: "flex", justifyContent: "flex-end" },
  dlLink: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: "none", border: "none", color: "#14919B",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    textDecoration: "underline", padding: 0, fontFamily: "inherit",
  },
  helper: { fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 },
  errorBox: {
    padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, color: "#991b1b", fontSize: 13,
  },
  summaryRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  reportList: { display: "flex", flexDirection: "column", gap: 10 },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    padding: "14px 20px", borderTop: "1px solid #f1f5f9",
    flexShrink: 0,
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
