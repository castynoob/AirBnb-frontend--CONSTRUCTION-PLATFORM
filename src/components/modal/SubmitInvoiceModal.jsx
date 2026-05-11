import { useEffect, useMemo, useRef, useState } from "react";
import { X, FileText, Upload, Save, Receipt, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import "../../styles/manager/addannouncementmodal.css";
import "../../styles/manager/submitinvoicemodal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Quebec sales taxes — same rates the rest of the platform uses.
const GST_RATE = 0.05;
const QST_RATE = 0.09975;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function getToken() {
  const userProfile = localStorage.getItem("userProfile");
  if (!userProfile) return null;
  return JSON.parse(userProfile).token;
}

function SubmitInvoiceModal({ isOpen, onClose, contract, jobTitle, onSubmitted }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [subtotal, setSubtotal] = useState("");
  const [gst, setGst] = useState("");
  const [qst, setQst] = useState("");
  const [total, setTotal] = useState("");
  const [taxesAuto, setTaxesAuto] = useState(true);  // when true, GST/QST/total derive from subtotal
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isResubmission = !!contract?.invoice_submitted_at;

  // Pre-fill from contract on open
  useEffect(() => {
    if (!isOpen || !contract) return;
    if (isResubmission) {
      setSubtotal(contract.invoice_subtotal != null ? String(contract.invoice_subtotal) : "");
      setGst(contract.invoice_gst != null ? String(contract.invoice_gst) : "");
      setQst(contract.invoice_qst != null ? String(contract.invoice_qst) : "");
      setTotal(contract.invoice_total != null ? String(contract.invoice_total) : "");
      setNotes(contract.invoice_notes || "");
      setExistingFileName(contract.invoice_file_name || null);
      setTaxesAuto(false); // editing — user can override freely
    } else {
      const seed = contract.contract_amount != null ? Number(contract.contract_amount) : 0;
      const sub = round2(seed);
      const g = round2(sub * GST_RATE);
      const q = round2(sub * QST_RATE);
      setSubtotal(sub ? String(sub) : "");
      setGst(sub ? String(g) : "");
      setQst(sub ? String(q) : "");
      setTotal(sub ? String(round2(sub + g + q)) : "");
      setNotes("");
      setExistingFileName(null);
      setTaxesAuto(true);
    }
    setFile(null);
    setError(null);
  }, [isOpen, contract, isResubmission]);

  // Auto-derive when taxesAuto and subtotal changes
  useEffect(() => {
    if (!taxesAuto) return;
    const sub = Number(subtotal);
    if (!Number.isFinite(sub)) return;
    const g = round2(sub * GST_RATE);
    const q = round2(sub * QST_RATE);
    setGst(String(g));
    setQst(String(q));
    setTotal(String(round2(sub + g + q)));
  }, [subtotal, taxesAuto]);

  const computedTotal = useMemo(() => {
    const sub = Number(subtotal) || 0;
    const g = Number(gst) || 0;
    const q = Number(qst) || 0;
    return round2(sub + g + q);
  }, [subtotal, gst, qst]);

  if (!isOpen || !contract) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError(t("submitInvoice.fileTooLarge") || "File must be 10 MB or smaller.");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sub = Number(subtotal);
    const g = Number(gst);
    const q = Number(qst);
    const tot = Number(total);

    if ([sub, g, q, tot].some((n) => !Number.isFinite(n) || n < 0)) {
      setError(t("submitInvoice.invalidAmounts") || "Subtotal, GST, QST and total must all be non-negative numbers.");
      return;
    }
    if (Math.abs(sub + g + q - tot) > 0.01) {
      setError(t("submitInvoice.totalMismatch") || "Total must equal subtotal + GST + QST.");
      return;
    }
    if (!file && !isResubmission) {
      setError(t("submitInvoice.fileRequired") || "Please attach the invoice file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      let documentId = contract.invoice_document_id || null;

      // Upload a new file if provided (mandatory on first submit; optional on edit)
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", `Invoice — ${jobTitle || "Job"}`);
        fd.append("category", "invoice");
        fd.append("contract_id", contract.id);
        if (notes) fd.append("notes", notes);

        const uploadRes = await fetch(`${API_BASE_URL}/api/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadBody.message || uploadBody.error || "Failed to upload invoice file");
        }
        documentId = uploadBody.document?.id;
        if (!documentId) throw new Error("Upload succeeded but no document id returned");
      }

      // Submit/replace the invoice record
      const invoiceRes = await fetch(`${API_BASE_URL}/api/contracts/${contract.id}/invoice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: round2(sub),
          gst: round2(g),
          qst: round2(q),
          total: round2(tot),
          document_id: documentId,
          notes: notes || null,
        }),
      });
      const invoiceBody = await invoiceRes.json().catch(() => ({}));
      if (!invoiceRes.ok) {
        throw new Error(invoiceBody.message || invoiceBody.error || "Failed to submit invoice");
      }

      toast.success(invoiceBody.message || (isResubmission ? "Invoice updated" : "Invoice submitted"));
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error("Submit invoice error:", err);
      setError(err.message || "Failed to submit invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="announcement-overlay si-modal" onClick={onClose}>
      <div className="announcement-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="announcement-header">
          <div className="announcement-title-wrapper">
            <Receipt size={20} className="announcement-icon" />
            <div>
              <h2>{isResubmission
                ? (t("submitInvoice.editTitle") || "Edit Invoice")
                : (t("submitInvoice.title") || "Submit Invoice")}</h2>
              <p className="announcement-subtitle">
                {t("submitInvoice.subtitle") || "Required before marking the work complete."}
              </p>
            </div>
          </div>
          <button className="announcement-close-btn" onClick={onClose} aria-label="Close" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="announcement-body">
          {error && <div className="error-message-box">{error}</div>}

          {/* Subtotal */}
          <div className="form-group">
            <label htmlFor="si-subtotal" className="form-label">
              {t("submitInvoice.subtotal") || "Subtotal (pre-tax)"} <span className="required">*</span>
            </label>
            <input
              id="si-subtotal"
              type="number"
              min="0"
              step="0.01"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Auto-tax toggle */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taxesAuto}
                onChange={(e) => setTaxesAuto(e.target.checked)}
                className="form-checkbox"
              />
              <span>{t("submitInvoice.autoTaxes") || "Auto-calculate GST (5%) and QST (9.975%)"}</span>
            </label>
          </div>

          {/* GST + QST */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="si-gst" className="form-label">GST (5%) <span className="required">*</span></label>
              <input
                id="si-gst"
                type="number"
                min="0"
                step="0.01"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                disabled={taxesAuto}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="si-qst" className="form-label">QST (9.975%) <span className="required">*</span></label>
              <input
                id="si-qst"
                type="number"
                min="0"
                step="0.01"
                value={qst}
                onChange={(e) => setQst(e.target.value)}
                disabled={taxesAuto}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Total */}
          <div className="form-group">
            <label htmlFor="si-total" className="form-label">
              {t("submitInvoice.total") || "Total (incl. taxes)"} <span className="required">*</span>
            </label>
            <input
              id="si-total"
              type="number"
              min="0"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              disabled={taxesAuto}
              className="form-input"
              required
            />
            {!taxesAuto && Math.abs(Number(total) - computedTotal) > 0.01 && (
              <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>
                {(t("submitInvoice.expectedTotal") || "Expected total")}: ${computedTotal.toFixed(2)}
              </small>
            )}
          </div>

          {/* File */}
          <div className="form-group">
            <label className="form-label">
              <Paperclip size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {t("submitInvoice.attachment") || "Invoice file (PDF or image)"}
              {!isResubmission && <span className="required"> *</span>}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              hidden
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="announcement-btn announcement-btn-secondary"
              style={{ alignSelf: "flex-start" }}
              disabled={isSubmitting}
            >
              <Upload size={14} style={{ marginRight: 6 }} />
              {file
                ? file.name
                : existingFileName
                  ? `${t("submitInvoice.replaceFile") || "Replace"}: ${existingFileName}`
                  : (t("submitInvoice.chooseFile") || "Choose file...")}
            </button>
            <small style={{ color: "#6b7280", marginTop: 4, display: "block" }}>
              {t("submitInvoice.fileHint") || "PDF, PNG, JPG up to 10 MB."}
            </small>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="si-notes" className="form-label">
              {t("submitInvoice.notes") || "Notes"} <span style={{ color: "#9ca3af", fontWeight: 400 }}>({t("common.optional") || "optional"})</span>
            </label>
            <textarea
              id="si-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              rows={3}
              placeholder={t("submitInvoice.notesPlaceholder") || "Anything the manager should know about this invoice"}
            />
          </div>

          {/* Footer */}
          <div className="announcement-footer">
            <button
              type="button"
              onClick={onClose}
              className="announcement-btn announcement-btn-secondary"
              disabled={isSubmitting}
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button
              type="submit"
              className="announcement-btn announcement-btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} style={{ marginRight: 6 }} />
              {isSubmitting
                ? (t("submitInvoice.submitting") || "Submitting...")
                : isResubmission
                  ? (t("submitInvoice.update") || "Update Invoice")
                  : (t("submitInvoice.submit") || "Submit Invoice")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitInvoiceModal;
