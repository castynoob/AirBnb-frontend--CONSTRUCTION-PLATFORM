import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Circle, Clock, Camera, ChevronRight,
  Play, Flag, Eye, X, Loader2, FileText, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getToken = () => JSON.parse(localStorage.getItem('userProfile'))?.token;

const COLORS = {
  primary: '#00A5A9',
  primaryLight: '#e0f7f8',
  dark: '#0F223D',
  success: '#059669',
  successLight: '#d1fae5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  white: '#ffffff',
};

const STAGE_NAMES = {
  not_started: 'Project Setup',
  mobilization: 'Mobilization & Planning',
  in_progress: 'Work In Progress',
  inspection: 'Inspection & Review',
  completed: 'Project Completed',
};

const STAGE_KEYS = ['not_started', 'mobilization', 'in_progress', 'inspection', 'completed'];

const STATUS_CONFIG = {
  pending: { color: COLORS.gray400, bg: COLORS.gray100, label: 'Pending' },
  in_progress: { color: COLORS.primary, bg: COLORS.primaryLight, label: 'In Progress' },
  completed: { color: COLORS.success, bg: COLORS.successLight, label: 'Completed' },
  validated: { color: COLORS.success, bg: COLORS.successLight, label: 'Validated' },
};

const pulseKeyframes = `
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 165, 169, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(0, 165, 169, 0); }
}
`;

export default function JobProgressTracker({
  jobId,
  contractId,
  userRole,
  onClose,
  isModal = false,
}) {
  const { t } = useLanguage();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteText, setNoteText] = useState('');

  const isEntrepreneur = userRole === 'entrepreneur';
  const isManager = userRole === 'property_manager';

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }), []);

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress/${jobId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStages(Array.isArray(data) ? data : data.stages || []);
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, authHeaders]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const initializeStages = async () => {
    setUpdating('init');
    try {
      const res = await fetch(`${API_BASE}/api/progress/${jobId}/init`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ contractId }),
      });
      if (!res.ok) throw new Error('Failed to initialize');
      toast.success(t('progress.initialized') || 'Progress tracking initialized');
      await fetchStages();
    } catch {
      toast.error(t('progress.initError') || 'Failed to initialize progress');
    } finally {
      setUpdating(null);
    }
  };

  const updateStage = async (stageId, status, notes) => {
    setUpdating(stageId);
    try {
      const body = { status };
      if (notes !== undefined) body.notes = notes;
      const res = await fetch(`${API_BASE}/api/progress/stage/${stageId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(t('progress.updated') || 'Stage updated');
      setNoteEditing(null);
      await fetchStages();
    } catch {
      toast.error(t('progress.updateError') || 'Failed to update stage');
    } finally {
      setUpdating(null);
    }
  };

  const validateStage = async (stageId) => {
    setUpdating(stageId);
    try {
      const res = await fetch(`${API_BASE}/api/progress/stage/${stageId}/validate`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to validate');
      toast.success(t('progress.validated') || 'Stage validated');
      await fetchStages();
    } catch {
      toast.error(t('progress.validateError') || 'Failed to validate stage');
    } finally {
      setUpdating(null);
    }
  };

  const canStartStage = (index) => {
    if (index === 0) return true;
    const prev = stages[index - 1];
    return prev && (prev.status === 'completed' || prev.status === 'validated');
  };

  const getStageName = (stage) => {
    const key = stage.stageName || stage.name || STAGE_KEYS[stages.indexOf(stage)];
    // Map underscore keys to camelCase translation keys
    const keyMap = { not_started: 'notStarted', mobilization: 'mobilization', in_progress: 'inProgress', inspection: 'inspection', completed: 'completed' };
    const translationKey = keyMap[key] || key;
    const translated = t(`progress.${translationKey}`);
    return (translated && translated !== `progress.${translationKey}`) ? translated : (STAGE_NAMES[key] || key);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getDotStyle = (status) => {
    const base = {
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.3s ease',
      zIndex: 2,
      position: 'relative',
    };
    if (status === 'validated') return { ...base, backgroundColor: COLORS.success, border: `3px solid ${COLORS.success}` };
    if (status === 'completed') return { ...base, backgroundColor: COLORS.successLight, border: `3px solid ${COLORS.success}` };
    if (status === 'in_progress') return { ...base, backgroundColor: COLORS.primaryLight, border: `3px solid ${COLORS.primary}`, animation: 'pulse-dot 2s infinite' };
    return { ...base, backgroundColor: COLORS.gray200, border: `3px solid ${COLORS.gray300}` };
  };

  const getLineColor = (index) => {
    if (index >= stages.length - 1) return 'transparent';
    const current = stages[index];
    return (current.status === 'completed' || current.status === 'validated') ? COLORS.success : COLORS.gray300;
  };

  // ── Render helpers ──

  const renderDotIcon = (status) => {
    if (status === 'validated') return <CheckCircle size={16} color={COLORS.white} />;
    if (status === 'completed') return <CheckCircle size={16} color={COLORS.success} />;
    if (status === 'in_progress') return <Play size={12} color={COLORS.primary} style={{ marginLeft: 1 }} />;
    return <Circle size={12} color={COLORS.gray400} />;
  };

  const renderBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}>
        {(() => {
          const statusMap = { pending: 'statusPending', in_progress: 'statusInProgress', completed: 'statusCompleted', validated: 'statusValidated' };
          const tk = statusMap[status] || status;
          const translated = t(`progress.${tk}`);
          return (translated && translated !== `progress.${tk}`) ? translated : cfg.label;
        })()}
      </span>
    );
  };

  const renderActions = (stage, index) => {
    const id = stage._id || stage.id;
    const isUpdating = updating === id;

    if (isEntrepreneur) {
      if (stage.status === 'pending' && canStartStage(index)) {
        return (
          <button
            onClick={() => updateStage(id, 'in_progress')}
            disabled={isUpdating}
            style={btnStyle(COLORS.primary)}
          >
            {isUpdating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
            <span style={{ marginLeft: 6 }}>{t('progress.start') || 'Start'}</span>
          </button>
        );
      }
      if (stage.status === 'in_progress') {
        return (
          <button
            onClick={() => updateStage(id, 'completed')}
            disabled={isUpdating}
            style={btnStyle(COLORS.success)}
          >
            {isUpdating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Flag size={14} />}
            <span style={{ marginLeft: 6 }}>{t('progress.markComplete') || 'Mark Complete'}</span>
          </button>
        );
      }
    }

    if (isManager && stage.status === 'completed') {
      return (
        <button
          onClick={() => validateStage(id)}
          disabled={isUpdating}
          style={btnStyle(COLORS.primary)}
        >
          {isUpdating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={14} />}
          <span style={{ marginLeft: 6 }}>{t('progress.validate') || 'Validate'}</span>
        </button>
      );
    }

    return null;
  };

  const renderNotes = (stage) => {
    const id = stage._id || stage.id;
    const isEditing = noteEditing === id;

    if (isEntrepreneur && stage.status === 'in_progress') {
      if (isEditing) {
        return (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${COLORS.gray300}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder={t('progress.notesPlaceholder') || 'Add notes about this stage...'}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={() => updateStage(id, stage.status, noteText)}
                disabled={updating === id}
                style={{ ...btnStyle(COLORS.primary), padding: '4px 14px', fontSize: 12 }}
              >
                {t('progress.save') || 'Save'}
              </button>
              <button
                onClick={() => setNoteEditing(null)}
                style={{ ...btnStyle(COLORS.gray500), padding: '4px 14px', fontSize: 12 }}
              >
                {t('progress.cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        );
      }
      return (
        <div style={{ marginTop: 6 }}>
          {stage.notes && (
            <p style={{ fontSize: 13, color: COLORS.gray600, margin: '0 0 4px' }}>
              <FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {stage.notes}
            </p>
          )}
          <button
            onClick={() => { setNoteEditing(id); setNoteText(stage.notes || ''); }}
            style={{
              background: 'none', border: 'none', color: COLORS.primary,
              fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500,
            }}
          >
            {stage.notes ? (t('progress.editNotes') || 'Edit notes') : (t('progress.addNotes') || 'Add notes')}
          </button>
        </div>
      );
    }

    if (stage.notes) {
      return (
        <p style={{ fontSize: 13, color: COLORS.gray600, marginTop: 6, marginBottom: 0 }}>
          <FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {stage.notes}
        </p>
      );
    }
    return null;
  };

  const renderPhotos = (stage) => {
    if (!stage.photos || stage.photos.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <Camera size={14} color={COLORS.gray400} style={{ alignSelf: 'center' }} />
        {stage.photos.map((photo, i) => (
          <img
            key={i}
            src={typeof photo === 'string' ? photo : photo.url}
            alt={`Stage photo ${i + 1}`}
            style={{
              width: 48, height: 48, objectFit: 'cover',
              borderRadius: 6, border: `1px solid ${COLORS.gray200}`,
            }}
          />
        ))}
      </div>
    );
  };

  const renderStage = (stage, index) => {
    const id = stage._id || stage.id;
    const isLast = index === stages.length - 1;

    return (
      <div key={id || index} style={{ display: 'flex', position: 'relative', minHeight: 100 }}>
        {/* Timeline column */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: 40, flexShrink: 0, position: 'relative',
        }}>
          <div style={getDotStyle(stage.status)}>
            {renderDotIcon(stage.status)}
          </div>
          {!isLast && (
            <div style={{
              width: 3, flex: 1, backgroundColor: getLineColor(index),
              borderRadius: 2, marginTop: 2, marginBottom: 2,
              transition: 'background-color 0.3s ease',
            }} />
          )}
        </div>

        {/* Stage card */}
        <div style={{
          flex: 1, marginLeft: 12, marginBottom: isLast ? 0 : 12,
          padding: 16, borderRadius: 10,
          backgroundColor: stage.status === 'in_progress' ? COLORS.primaryLight : COLORS.white,
          border: `1px solid ${stage.status === 'in_progress' ? COLORS.primary + '33' : COLORS.gray200}`,
          transition: 'all 0.3s ease',
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: 8,
          }}>
            <div>
              <h4 style={{
                margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.dark,
              }}>
                {getStageName(stage)}
              </h4>
              <div style={{ marginTop: 4 }}>
                {renderBadge(stage.status)}
              </div>
            </div>
            {renderActions(stage, index)}
          </div>

          {/* Dates */}
          {(stage.plannedStart || stage.actualStart) && (
            <div style={{
              display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: COLORS.gray500,
              flexWrap: 'wrap',
            }}>
              {stage.plannedStart && (
                <span>
                  <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  {t('progress.planned') || 'Planned'}: {formatDate(stage.plannedStart)} – {formatDate(stage.plannedEnd)}
                </span>
              )}
              {stage.actualStart && (
                <span style={{ color: COLORS.success }}>
                  <ChevronRight size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                  {t('progress.actual') || 'Actual'}: {formatDate(stage.actualStart)} – {formatDate(stage.actualEnd)}
                </span>
              )}
            </div>
          )}

          {renderNotes(stage)}
          {renderPhotos(stage)}
        </div>
      </div>
    );
  };

  // ── Main content ──

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 60, color: COLORS.gray500,
        }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: COLORS.primary }} />
          <p style={{ marginTop: 12, fontSize: 14 }}>{t('progress.loading') || 'Loading progress...'}</p>
        </div>
      );
    }

    if (stages.length === 0) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 48, textAlign: 'center',
        }}>
          <AlertCircle size={40} color={COLORS.gray400} />
          <p style={{ fontSize: 15, color: COLORS.gray600, marginTop: 12, marginBottom: 20 }}>
            {t('progress.noStages') || 'Progress tracking has not been set up for this job yet.'}
          </p>
          {isEntrepreneur && (
            <button
              onClick={initializeStages}
              disabled={updating === 'init'}
              style={{
                ...btnStyle(COLORS.primary),
                padding: '10px 24px',
                fontSize: 14,
                borderRadius: 10,
              }}
            >
              {updating === 'init' ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Flag size={16} />
              )}
              <span style={{ marginLeft: 8 }}>
                {t('progress.initialize') || 'Initialize Progress Tracking'}
              </span>
            </button>
          )}
        </div>
      );
    }

    // Calculate overall progress
    const doneCount = stages.filter(s => s.status === 'completed' || s.status === 'validated').length;
    const pct = Math.round((doneCount / stages.length) * 100);

    return (
      <div>
        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark }}>
              {t('progress.overall') || 'Overall Progress'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{pct}%</span>
          </div>
          <div style={{
            height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`, backgroundColor: COLORS.primary,
              borderRadius: 3, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {stages.map((stage, i) => renderStage(stage, i))}
        </div>
      </div>
    );
  };

  const card = (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: isModal ? 16 : 12,
      overflow: 'hidden',
      width: '100%',
      maxWidth: isModal ? 600 : '100%',
      maxHeight: isModal ? '90vh' : 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isModal ? '0 25px 50px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      {/* Inject keyframes */}
      <style>{pulseKeyframes}{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: COLORS.dark,
        color: COLORS.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flag size={18} />
          {t('progress.title') || 'Job Progress'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: COLORS.white,
              cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(15, 34, 61, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
        onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      >
        {card}
      </div>
    );
  }

  return card;
}

// ── Shared button style ──

function btnStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: color,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}
