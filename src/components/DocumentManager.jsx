import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText, Upload, Search, X, Pencil, Trash2, Download,
  Image, File, Filter, Clock, AlertTriangle, Plus, FolderOpen,
  ChevronDown, GripVertical, Calendar
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const getToken = () => JSON.parse(localStorage.getItem('userProfile'))?.token;

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'contract', label: 'Contracts' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'warranty', label: 'Warranties' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'permit', label: 'Permits' },
  { key: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  contract: '#2563eb',
  invoice: '#059669',
  warranty: '#d97706',
  certificate: '#7c3aed',
  permit: '#dc2626',
  insurance: '#0891b2',
  other: '#6b7280',
};

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name_asc', label: 'Name A-Z' },
  { key: 'expiring', label: 'Expiring soon' },
];

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(fileType) {
  if (!fileType) return File;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.startsWith('image/')) return Image;
  return File;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function DocumentManager({ ownerId, jobId, propertyId, userRole, isModal, onClose }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'other', notes: '', job_id: '', property_id: '', expiry_date: '' });
  const [dragOver, setDragOver] = useState(false);

  // ── Fetch documents ─────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (jobId) params.append('job_id', jobId);
      if (propertyId) params.append('property_id', propertyId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_BASE}/api/documents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (err) {
      console.error(err);
      toast.error(t('documents.fetchError') || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, jobId, propertyId, searchQuery, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── Sorted / filtered list ──────────────────────────────────────────────
  const sortedDocs = useMemo(() => {
    const list = [...documents];
    switch (sortBy) {
      case 'oldest': list.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at)); break;
      case 'name_asc': list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'expiring': list.sort((a, b) => {
        const da = a.expiry_date ? new Date(a.expiry_date) : new Date('2999-01-01');
        const db = b.expiry_date ? new Date(b.expiry_date) : new Date('2999-01-01');
        return da - db;
      }); break;
      default: list.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
    }
    return list;
  }, [documents, sortBy]);

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadFile(file);
    if (!uploadForm.title) {
      setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return toast.error(t('documents.selectFile') || 'Please select a file');
    if (!uploadForm.title.trim()) return toast.error(t('documents.titleRequired') || 'Title is required');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', uploadForm.title.trim());
      fd.append('category', uploadForm.category);
      fd.append('notes', uploadForm.notes);
      if (uploadForm.job_id) fd.append('job_id', uploadForm.job_id);
      if (uploadForm.property_id || propertyId) fd.append('property_id', uploadForm.property_id || propertyId);
      if (uploadForm.expiry_date) fd.append('expiry_date', uploadForm.expiry_date);
      if (ownerId) fd.append('owner_id', ownerId);

      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      toast.success(t('documents.uploadSuccess') || 'Document uploaded');
      resetUploadForm();
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error(t('documents.uploadError') || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editingDoc) return;
    try {
      const res = await fetch(`${API_BASE}/api/documents/${editingDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          title: editingDoc.title,
          category: editingDoc.category,
          notes: editingDoc.notes,
          job_id: editingDoc.job_id || undefined,
          property_id: editingDoc.property_id || undefined,
          expiry_date: editingDoc.expiry_date || undefined,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(t('documents.updateSuccess') || 'Document updated');
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error(t('documents.updateError') || 'Update failed');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(t('documents.confirmDelete') || 'Delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(t('documents.deleteSuccess') || 'Document deleted');
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error(t('documents.deleteError') || 'Delete failed');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadForm({ title: '', category: 'other', notes: '', job_id: '', property_id: '', expiry_date: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Drag & Drop handlers ───────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); };

  // ── Styles ─────────────────────────────────────────────────────────────
  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,34,61,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    container: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: isModal ? 960 : '100%', maxHeight: isModal ? '90vh' : 'none', overflow: 'auto', boxShadow: isModal ? '0 24px 48px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.08)' },
    header: {
      background: isModal ? 'linear-gradient(135deg, #0F223D 0%, #1a3a5c 100%)' : '#f9fafb',
      color: isModal ? '#fff' : '#0F223D',
      padding: '18px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: isModal ? '12px 12px 0 0' : '12px 12px 0 0',
    },
    headerTitle: { fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
    badge: { background: 'rgba(0,165,169,0.18)', color: '#00A5A9', fontSize: 12, fontWeight: 600, borderRadius: 10, padding: '2px 9px' },
    uploadBtn: { background: '#00A5A9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    body: { padding: '16px 24px 24px' },
    filterBar: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 },
    pill: (active) => ({ padding: '6px 14px', borderRadius: 20, border: active ? '2px solid #00A5A9' : '1px solid #e5e7eb', background: active ? 'rgba(0,165,169,0.08)' : '#fff', color: active ? '#00A5A9' : '#4b5563', fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }),
    searchWrap: { position: 'relative', flex: '1 1 180px', minWidth: 160 },
    searchInput: { width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
    select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    card: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fff', transition: 'box-shadow .15s', position: 'relative' },
    cardHover: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    categoryBadge: (cat) => ({ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10, color: '#fff', background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }),
    meta: { fontSize: 12, color: '#6b7280', marginTop: 6 },
    actions: { display: 'flex', gap: 6, marginTop: 10 },
    iconBtn: (color) => ({ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: color || '#6b7280', display: 'flex', alignItems: 'center' }),
    // Upload / Edit modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,34,61,0.5)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modalBox: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
    modalTitle: { fontSize: 17, fontWeight: 700, color: '#0F223D', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
    dropZone: (active) => ({ border: `2px dashed ${active ? '#00A5A9' : '#d1d5db'}`, borderRadius: 10, padding: 32, textAlign: 'center', cursor: 'pointer', background: active ? 'rgba(0,165,169,0.04)' : '#fafbfc', transition: 'all .15s', marginBottom: 16 }),
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, marginTop: 12 },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
    primaryBtn: (disabled) => ({ background: disabled ? '#9ca3af' : '#00A5A9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', marginTop: 16 }),
    cancelBtn: { background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 20px', fontWeight: 500, fontSize: 14, cursor: 'pointer', width: '100%', marginTop: 8, color: '#374151' },
    skeleton: { background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 10, height: 180 },
    emptyState: { textAlign: 'center', padding: '48px 24px', color: '#9ca3af' },
    expiryWarn: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 8, marginTop: 4 },
  };

  // ── Skeleton loader ─────────────────────────────────────────────────────
  const SkeletonCards = () => (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={s.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={s.skeleton} />)}
      </div>
    </>
  );

  // ── Document Card ───────────────────────────────────────────────────────
  const DocCard = ({ doc }) => {
    const [hovered, setHovered] = useState(false);
    const IconComp = getFileIcon(doc.file_type || doc.fileType);
    const days = daysUntil(doc.expiry_date);
    const expiringSoon = days !== null && days >= 0 && days <= 30;
    const expired = days !== null && days < 0;
    const uploadDate = doc.createdAt || doc.created_at;

    return (
      <div
        style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ padding: 10, background: '#f3f4f6', borderRadius: 8, flexShrink: 0 }}>
            <IconComp size={22} color={CATEGORY_COLORS[doc.category] || '#6b7280'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0F223D', wordBreak: 'break-word' }}>{doc.title || 'Untitled'}</div>
            <div style={{ marginTop: 4 }}>
              <span style={s.categoryBadge(doc.category)}>{doc.category || 'other'}</span>
            </div>
            {(doc.job_name || doc.property_name) && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {doc.job_name && <span>Job: {doc.job_name}</span>}
                {doc.job_name && doc.property_name && <span> &middot; </span>}
                {doc.property_name && <span>Property: {doc.property_name}</span>}
              </div>
            )}
            <div style={s.meta}>
              {formatFileSize(doc.file_size || doc.fileSize)} &middot; {uploadDate ? new Date(uploadDate).toLocaleDateString() : '—'}
            </div>
            {doc.expiry_date && (
              <div style={expired ? { ...s.expiryWarn, color: '#dc2626', background: '#fef2f2' } : expiringSoon ? s.expiryWarn : { ...s.meta, marginTop: 4 }}>
                {(expired || expiringSoon) && <AlertTriangle size={12} />}
                {expired ? t('documents.expired') || 'Expired' : expiringSoon ? `${t('documents.expiresSoon') || 'Expires in'} ${days}d` : `Exp: ${new Date(doc.expiry_date).toLocaleDateString()}`}
              </div>
            )}
          </div>
        </div>
        <div style={s.actions}>
          {doc.file_url && (
            <button style={s.iconBtn('#2563eb')} title={t('documents.download') || 'Download'} onClick={() => window.open(doc.file_url, '_blank')}>
              <Download size={16} />
            </button>
          )}
          <button style={s.iconBtn('#6b7280')} title={t('documents.edit') || 'Edit'} onClick={() => setEditingDoc({ ...doc })}>
            <Pencil size={16} />
          </button>
          <button style={s.iconBtn('#dc2626')} title={t('documents.delete') || 'Delete'} onClick={() => handleDelete(doc._id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ── Upload / Edit Form ──────────────────────────────────────────────────
  const DocForm = ({ isEdit }) => {
    const form = isEdit ? editingDoc : uploadForm;
    const setForm = isEdit
      ? (fn) => setEditingDoc((prev) => (typeof fn === 'function' ? fn(prev) : { ...prev, ...fn }))
      : (fn) => setUploadForm((prev) => (typeof fn === 'function' ? fn(prev) : { ...prev, ...fn }));
    const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    return (
      <div style={s.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { isEdit ? setEditingDoc(null) : (setShowUploadModal(false), resetUploadForm()); } }}>
        <div style={s.modalBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={s.modalTitle}>
              {isEdit ? <Pencil size={18} /> : <Upload size={18} />}
              {isEdit ? (t('documents.editDocument') || 'Edit Document') : (t('documents.uploadDocument') || 'Upload Document')}
            </div>
            <button style={{ ...s.iconBtn('#6b7280'), padding: 6 }} onClick={() => { isEdit ? setEditingDoc(null) : (setShowUploadModal(false), resetUploadForm()); }}>
              <X size={18} />
            </button>
          </div>

          {/* Drop zone (upload only) */}
          {!isEdit && (
            <div
              style={s.dropZone(dragOver)}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files?.[0])} />
              {uploadFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FileText size={20} color="#00A5A9" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0F223D' }}>{uploadFile.name}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>({formatFileSize(uploadFile.size)})</span>
                </div>
              ) : (
                <>
                  <Upload size={28} color="#9ca3af" />
                  <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
                    {t('documents.dragDrop') || 'Drag & drop a file here, or click to browse'}
                  </div>
                </>
              )}
            </div>
          )}

          <label style={s.label}>{t('documents.title') || 'Title'}</label>
          <input style={s.input} value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Document title" />

          <label style={s.label}>{t('documents.category') || 'Category'}</label>
          <select style={{ ...s.input, cursor: 'pointer' }} value={form.category || 'other'} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <label style={s.label}>{t('documents.notes') || 'Notes'}</label>
          <textarea style={s.textarea} value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} placeholder="Optional notes..." />

          {!jobId && (
            <>
              <label style={s.label}>{t('documents.linkJob') || 'Link to Job (ID)'}</label>
              <input style={s.input} value={form.job_id || ''} onChange={(e) => update('job_id', e.target.value)} placeholder="Optional job ID" />
            </>
          )}
          {!propertyId && (
            <>
              <label style={s.label}>{t('documents.linkProperty') || 'Link to Property (ID)'}</label>
              <input style={s.input} value={form.property_id || ''} onChange={(e) => update('property_id', e.target.value)} placeholder="Optional property ID" />
            </>
          )}

          <label style={s.label}>{t('documents.expiryDate') || 'Expiry Date'}</label>
          <input style={s.input} type="date" value={form.expiry_date ? form.expiry_date.slice(0, 10) : ''} onChange={(e) => update('expiry_date', e.target.value)} />

          <button
            style={s.primaryBtn(isEdit ? false : uploading || !uploadFile)}
            disabled={isEdit ? false : uploading || !uploadFile}
            onClick={isEdit ? handleUpdate : handleUpload}
          >
            {uploading ? (t('documents.uploading') || 'Uploading...') : isEdit ? (t('documents.save') || 'Save Changes') : (t('documents.upload') || 'Upload')}
          </button>
          <button style={s.cancelBtn} onClick={() => { isEdit ? setEditingDoc(null) : (setShowUploadModal(false), resetUploadForm()); }}>
            {t('documents.cancel') || 'Cancel'}
          </button>
        </div>
      </div>
    );
  };

  // ── Content ─────────────────────────────────────────────────────────────
  const content = (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTitle}>
          <FolderOpen size={20} />
          {t('documents.title_header') || 'Documents'}
          <span style={s.badge}>{documents.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={s.uploadBtn} onClick={() => { resetUploadForm(); setShowUploadModal(true); }}>
            <Plus size={16} /> {t('documents.upload') || 'Upload'}
          </button>
          {isModal && onClose && (
            <button style={{ ...s.iconBtn(isModal ? '#fff' : '#6b7280'), padding: 6 }} onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div style={s.body}>
        {/* Filter bar */}
        <div style={s.filterBar}>
          {CATEGORIES.map((cat) => (
            <button key={cat.key} style={s.pill(selectedCategory === cat.key)} onClick={() => setSelectedCategory(cat.key)}>
              {t(`documents.cat_${cat.key}`) || cat.label}
            </button>
          ))}
          <div style={s.searchWrap}>
            <Search size={15} style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder={t('documents.search') || 'Search documents...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select style={s.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{t(`documents.sort_${o.key}`) || o.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonCards />
        ) : sortedDocs.length === 0 ? (
          <div style={s.emptyState}>
            <FolderOpen size={48} color="#d1d5db" />
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: '#6b7280' }}>
              {t('documents.noDocuments') || 'No documents yet'}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>
              {t('documents.uploadFirst') || 'Upload your first document to get started'}
            </div>
            <button style={{ ...s.uploadBtn, margin: '16px auto 0', display: 'inline-flex' }} onClick={() => { resetUploadForm(); setShowUploadModal(true); }}>
              <Plus size={16} /> {t('documents.upload') || 'Upload'}
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {sortedDocs.map((doc) => <DocCard key={doc._id || doc.id} doc={doc} />)}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && <DocForm isEdit={false} />}

      {/* Edit modal */}
      {editingDoc && <DocForm isEdit={true} />}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  if (isModal) {
    return (
      <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
        {content}
      </div>
    );
  }

  return content;
}
