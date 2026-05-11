import { useState, useEffect } from 'react';
import { X, Wrench, Calendar, DollarSign, User, Star, FileText, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Building2, MapPin, Image } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translateStatus, translateCategory } from '../../utils/translateEnums';

const MaintenanceLogModal = ({ property, onClose }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userProfile'))?.token;
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/properties/${property.id}/maintenance-log`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message);
        }
      } catch {
        setError('Failed to load maintenance log');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [property.id]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const formatCurrency = (a) => a ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(a) : '—';

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      case 'ongoing': case 'accepted': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'open': return { bg: '#fefce8', color: '#a16207', border: '#fde68a' };
      default: return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
    }
  };

  const filteredJobs = data?.jobs?.filter(j => statusFilter === 'all' || j.status === statusFilter) || [];

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem' };
  const modalStyle = { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' };
  const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', color: '#fff', flexShrink: 0 };
  const bodyStyle = { flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench size={20} style={{ color: '#00A5A9' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600 }}>
                {t('profileManager.maintenanceLog') || 'Maintenance Log'}
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>
                {property.building_name || property.address}, {property.city}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#00A5A9', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('profileManager.loadingMaintenanceLog') || 'Loading maintenance log...'}</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              <p>{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: t('profileManager.mlTotal') || 'Total Jobs', value: data.summary.total, icon: FileText, color: '#6366f1' },
                  { label: t('profileManager.mlOpen') || 'Open', value: data.summary.open, icon: Clock, color: '#d97706' },
                  { label: t('profileManager.mlOngoing') || 'Ongoing', value: data.summary.ongoing, icon: Wrench, color: '#2563eb' },
                  { label: t('profileManager.mlCompleted') || 'Completed', value: data.summary.completed, icon: CheckCircle, color: '#059669' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '0.875rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={18} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{s.value}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: '#e5e7eb', borderRadius: '8px', padding: '3px' }}>
                {['jobs', 'contractors'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                      background: activeTab === tab ? '#fff' : 'transparent',
                      color: activeTab === tab ? '#111827' : '#6b7280',
                      boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {tab === 'jobs' ? (t('profileManager.mlJobHistory') || 'Job History') : (t('profileManager.mlContractors') || 'Contractors')}
                  </button>
                ))}
              </div>

              {/* Jobs Tab */}
              {activeTab === 'jobs' && (
                <>
                  {/* Status filter */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {['all', 'open', 'ongoing', 'completed'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        style={{
                          padding: '0.3rem 0.75rem', border: '1px solid', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                          background: statusFilter === s ? '#0F223D' : '#fff',
                          color: statusFilter === s ? '#fff' : '#6b7280',
                          borderColor: statusFilter === s ? '#0F223D' : '#e5e7eb',
                        }}>
                        {s === 'all' ? (t('profileManager.mlAll') || 'All') : s.charAt(0).toUpperCase() + s.slice(1)}
                        {s === 'all' && ` (${data.jobs.length})`}
                      </button>
                    ))}
                  </div>

                  {/* Job List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filteredJobs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                        <FileText size={28} style={{ color: '#d1d5db', margin: '0 auto 0.5rem', display: 'block' }} />
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('profileManager.mlNoJobs') || 'No jobs found'}</p>
                      </div>
                    ) : filteredJobs.map(job => {
                      const sc = getStatusColor(job.status);
                      const isExpanded = expandedJob === job.id;
                      return (
                        <div key={job.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                          {/* Job header — clickable */}
                          <div onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{job.title}</span>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                  {translateStatus(t, job.status, { uppercase: true })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                {job.category && <span>{translateCategory(t, job.category)}</span>}
                                <span>{formatDate(job.created_at)}</span>
                                {job.contract_amount && <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(job.contract_amount)}</span>}
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp size={16} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem', background: '#fafbfc' }}>
                              {job.description && (
                                <p style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.5, marginBottom: '0.75rem' }}>{job.description}</p>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.8125rem' }}>
                                <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlUrgency') || 'Urgency'}</span><div style={{ fontWeight: 500, color: '#374151' }}>{job.urgency || '—'}</div></div>
                                <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlDueDate') || 'Due Date'}</span><div style={{ fontWeight: 500, color: '#374151' }}>{formatDate(job.due_date)}</div></div>
                                <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlBudget') || 'Budget'}</span><div style={{ fontWeight: 500, color: '#374151' }}>{formatCurrency(job.budget_min)} – {formatCurrency(job.budget_max)}</div></div>
                                <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlDuration') || 'Duration'}</span><div style={{ fontWeight: 500, color: '#374151' }}>{job.estimated_duration_days ? `${job.estimated_duration_days} days` : '—'}</div></div>
                              </div>

                              {/* Contractor info */}
                              {job.company_name && (
                                <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: '0.375rem' }}>{t('profileManager.mlContractor') || 'Contractor'}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#0F223D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                      {(job.company_name || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{job.company_name}</div>
                                      <div style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>{job.license_number ? `License: ${job.license_number}` : ''}</div>
                                    </div>
                                    {job.contract_amount && (
                                      <div style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>{formatCurrency(job.contract_amount)}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Timeline */}
                              {(job.contract_created_at || job.work_started_at || job.work_completed_at) && (
                                <div style={{ marginTop: '0.75rem' }}>
                                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: '0.375rem' }}>{t('profileManager.mlTimeline') || 'Timeline'}</div>
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                    {job.contract_created_at && <span>Contract: {formatDate(job.contract_created_at)}</span>}
                                    {job.work_started_at && <span>Started: {formatDate(job.work_started_at)}</span>}
                                    {job.work_completed_at && <span>Completed: {formatDate(job.work_completed_at)}</span>}
                                  </div>
                                </div>
                              )}

                              {/* Reviews */}
                              {job.reviews && job.reviews.length > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: '0.375rem' }}>{t('profileManager.mlReviews') || 'Reviews'}</div>
                                  {job.reviews.map((r, i) => (
                                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '0.375rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                                        {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : 'none'} stroke={s <= r.rating ? '#f59e0b' : '#d1d5db'} />)}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginLeft: '0.25rem' }}>{r.rating}/5</span>
                                        <span style={{ fontSize: '0.6875rem', color: '#9ca3af', marginLeft: 'auto' }}>{r.reviewer_role === 'property_manager' ? 'By you' : 'By contractor'}</span>
                                      </div>
                                      {r.comment && <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4b5563', fontStyle: 'italic' }}>"{r.comment}"</p>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Image count */}
                              {Number(job.image_count) > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                  <Image size={13} />
                                  <span>{job.image_count} {t('profileManager.mlPhotos') || 'photos attached'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Contractors Tab */}
              {activeTab === 'contractors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {data.contractors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                      <User size={28} style={{ color: '#d1d5db', margin: '0 auto 0.5rem', display: 'block' }} />
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{t('profileManager.mlNoContractors') || 'No contractors yet'}</p>
                    </div>
                  ) : data.contractors.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                          {(c.company_name || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>{c.company_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.contact_name} {c.license_number ? `· ${c.license_number}` : ''}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlJobsDone') || 'Jobs Done'}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{c.jobs_count}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlTotalSpent') || 'Total Spent'}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>{formatCurrency(c.total_spent)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('profileManager.mlSpecialties') || 'Specialties'}</div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>{c.specializations?.length ? c.specializations.join(', ') : '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLogModal;
