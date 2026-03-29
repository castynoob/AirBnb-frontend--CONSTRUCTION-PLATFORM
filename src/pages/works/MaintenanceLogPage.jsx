import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, DollarSign, User, Star, FileText, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Building2, Image } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Nav from '../../components/Nav';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const tx = (t, key, fb) => { const v = t(key); return v === key ? fb : v; };

const MaintenanceLogPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userProfile'))?.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch maintenance log and property in parallel
        const [logRes, propRes] = await Promise.all([
          fetch(`${API}/api/properties/${propertyId}/maintenance-log`, { headers }),
          fetch(`${API}/api/properties/${propertyId}`, { headers }),
        ]);

        const logJson = await logRes.json();
        if (logJson.success) setData(logJson);
        else setError(logJson.message || 'Failed to load');

        if (propRes.ok) {
          const propJson = await propRes.json();
          setProperty(propJson.property || propJson);
        }
      } catch {
        setError('Failed to load maintenance log');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId]);

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
  const propName = property?.building_name || property?.address || data?.property?.building_name || '';
  const propCity = property?.city || data?.property?.city || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Nav />
      <div className="main-container" style={{ flex: 1, background: '#f8fafc', padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <ArrowLeft size={16} /> {tx(t, 'common.back', 'Back')}
          </button>
          <Wrench size={22} style={{ color: '#00A5A9' }} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F223D', margin: 0 }}>
              {tx(t, 'profileManager.maintenanceLog', 'Maintenance Log')}
            </h1>
            {(propName || propCity) && (
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
                {[propName, propCity].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#00A5A9', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: '#9ca3af' }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <AlertCircle size={40} style={{ color: '#dc2626', margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ color: '#dc2626', fontSize: '0.9375rem' }}>{error}</p>
          </div>
        )}

        {/* Content */}
        {data && !loading && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: tx(t, 'profileManager.mlTotal', 'Total Jobs'), value: data.summary.total, icon: FileText, color: '#6366f1' },
                { label: tx(t, 'profileManager.mlOpen', 'Open'), value: data.summary.open, icon: Clock, color: '#d97706' },
                { label: tx(t, 'profileManager.mlOngoing', 'Ongoing'), value: data.summary.ongoing, icon: Wrench, color: '#2563eb' },
                { label: tx(t, 'profileManager.mlCompleted', 'Completed'), value: data.summary.completed, icon: CheckCircle, color: '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '10px', background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={22} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: '#e5e7eb', borderRadius: '10px', padding: '4px', maxWidth: 400 }}>
              {['jobs', 'contractors'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '0.5rem 1rem', border: 'none', borderRadius: '7px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                    background: activeTab === tab ? '#fff' : 'transparent',
                    color: activeTab === tab ? '#111827' : '#6b7280',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {tab === 'jobs' ? tx(t, 'profileManager.mlJobHistory', 'Job History') : tx(t, 'profileManager.mlContractors', 'Contractors')}
                </button>
              ))}
            </div>

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <>
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {['all', 'open', 'ongoing', 'completed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      style={{
                        padding: '0.35rem 0.875rem', border: '1px solid', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        background: statusFilter === s ? '#0F223D' : '#fff',
                        color: statusFilter === s ? '#fff' : '#6b7280',
                        borderColor: statusFilter === s ? '#0F223D' : '#e5e7eb',
                      }}>
                      {s === 'all' ? `All (${data.jobs.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredJobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <FileText size={32} style={{ color: '#d1d5db', margin: '0 auto 0.5rem', display: 'block' }} />
                      <p style={{ color: '#9ca3af' }}>No jobs found</p>
                    </div>
                  ) : filteredJobs.map(job => {
                    const sc = getStatusColor(job.status);
                    const isExpanded = expandedJob === job.id;
                    return (
                      <div key={job.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <div onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>{job.title}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                {job.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
                              {job.category && <span>{job.category}</span>}
                              <span>{formatDate(job.created_at)}</span>
                              {job.contract_amount && <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(job.contract_amount)}</span>}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                        </div>

                        {isExpanded && (
                          <div style={{ borderTop: '1px solid #f3f4f6', padding: '1.25rem', background: '#fafbfc' }}>
                            {job.description && <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '1rem' }}>{job.description}</p>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', fontSize: '0.875rem' }}>
                              <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Urgency</span><div style={{ fontWeight: 500, color: '#374151' }}>{job.urgency || '—'}</div></div>
                              <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due Date</span><div style={{ fontWeight: 500, color: '#374151' }}>{formatDate(job.due_date)}</div></div>
                              <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</span><div style={{ fontWeight: 500, color: '#374151' }}>{formatCurrency(job.budget_min)} – {formatCurrency(job.budget_max)}</div></div>
                              <div><span style={{ color: '#9ca3af', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</span><div style={{ fontWeight: 500, color: '#374151' }}>{job.estimated_duration_days ? `${job.estimated_duration_days} days` : '—'}</div></div>
                            </div>

                            {job.company_name && (
                              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: '0.5rem' }}>Contractor</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#0F223D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                                    {(job.company_name || '?')[0].toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{job.company_name}</div>
                                    {job.license_number && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>License: {job.license_number}</div>}
                                  </div>
                                  {job.contract_amount && <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>{formatCurrency(job.contract_amount)}</div>}
                                </div>
                              </div>
                            )}

                            {(job.contract_created_at || job.work_started_at || job.work_completed_at) && (
                              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                {job.contract_created_at && <span>Contract: {formatDate(job.contract_created_at)}</span>}
                                {job.work_started_at && <span>Started: {formatDate(job.work_started_at)}</span>}
                                {job.work_completed_at && <span>Completed: {formatDate(job.work_completed_at)}</span>}
                              </div>
                            )}

                            {job.reviews && job.reviews.length > 0 && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: '0.375rem' }}>Reviews</div>
                                {job.reviews.map((r, i) => (
                                  <div key={i} style={{ padding: '0.625rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '0.375rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                                      {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : 'none'} stroke={s <= r.rating ? '#f59e0b' : '#d1d5db'} />)}
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginLeft: '0.25rem' }}>{r.rating}/5</span>
                                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>{r.reviewer_role === 'property_manager' ? 'By you' : 'By contractor'}</span>
                                    </div>
                                    {r.comment && <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', fontStyle: 'italic' }}>"{r.comment}"</p>}
                                  </div>
                                ))}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(data.contractors || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <User size={32} style={{ color: '#d1d5db', margin: '0 auto 0.5rem', display: 'block' }} />
                    <p style={{ color: '#9ca3af' }}>No contractors yet</p>
                  </div>
                ) : data.contractors.map((c, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'linear-gradient(135deg, #0F223D, #1a3a5c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                        {(c.company_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{c.company_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{c.contact_name} {c.license_number ? `· ${c.license_number}` : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Jobs Done</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{c.jobs_count}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Spent</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#059669' }}>{formatCurrency(c.total_spent)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Specialties</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{c.specializations?.length ? c.specializations.join(', ') : '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default MaintenanceLogPage;
