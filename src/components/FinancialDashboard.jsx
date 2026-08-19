import { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, FileText, TrendingUp, Briefcase, ChevronDown, Building2, Star, AlertCircle, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateStatus, translateCategory } from '../utils/translateEnums';
import CustomSelect from './CustomSelect';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const tx = (t, key, fb) => { const v = t(key); return v === key ? fb : v; };
const PRIMARY = '#00A5A9';
const DARK = '#0F223D';
const SUCCESS = '#059669';
const DANGER = '#dc2626';
const WARNING = '#d97706';

const CATEGORY_COLORS = {
  Plumbing: '#2563eb', Roofing: '#dc2626', Electrical: '#d97706',
  Carpentry: '#059669', Landscaping: '#16a34a', Painting: '#7c3aed',
  HVAC: '#0891b2', Masonry: '#92400e', Flooring: '#6366f1', Other: '#6b7280',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

function FinancialDashboard() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const [year, setYear] = useState(currentYear);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = JSON.parse(localStorage.getItem('userProfile'));
      const token = profile?.token;
      let url = `${BASE_URL}/api/financial?year=${year}`;
      if (propertyFilter) url += `&property_id=${propertyFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch financial data');
      setData(await res.json());
    } catch (err) {
      toast.error(tx(t, 'financial.fetchError', 'Could not load financial data'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, propertyFilter, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthlyData = useMemo(() => {
    const map = {};
    (data?.by_month || []).forEach(m => { map[m.month] = m.total_spent; });
    return MONTH_LABELS.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return { label, spent: map[key] || 0 };
    });
  }, [data, year]);

  const maxMonthSpent = Math.max(...monthlyData.map(m => m.spent), 1);

  const sortedCategories = useMemo(() =>
    [...(data?.by_category || [])].sort((a, b) => b.total_spent - a.total_spent), [data]);
  const maxCatSpent = Math.max(...sortedCategories.map(c => c.total_spent), 1);

  const sortedBudget = useMemo(() =>
    [...(data?.budget_comparison || [])].sort((a, b) => {
      const va = a.actual_cost - (a.budget_min + a.budget_max) / 2;
      const vb = b.actual_cost - (b.budget_min + b.budget_max) / 2;
      return vb - va;
    }), [data]);

  const ov = data?.overview || {};
  const utilPct = ov.total_budget_planned ? Math.round((ov.total_spent / ov.total_budget_planned) * 100) : 0;

  // --- Styles ---
  const s = {
    wrap: { padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: DARK },
    heading: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: DARK },
    sub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
    controls: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 },
    select: { padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: DARK, background: '#fff', cursor: 'pointer', minWidth: 160 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
    card: (accent) => ({ background: '#fff', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${accent}` }),
    cardLabel: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 500 },
    cardVal: (color) => ({ fontSize: 26, fontWeight: 700, color: color || DARK, margin: 0 }),
    cardIcon: (bg) => ({ width: 36, height: 36, borderRadius: 8, background: bg + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }),
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: DARK },
    barRow: { display: 'flex', alignItems: 'center', marginBottom: 8, gap: 10 },
    barLabel: { width: 40, fontSize: 13, fontWeight: 500, color: '#475569', flexShrink: 0, textAlign: 'right' },
    barTrack: { flex: 1, height: 22, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' },
    barFill: (pct, color) => ({ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }),
    barAmt: { width: 90, fontSize: 13, fontWeight: 600, color: DARK, textAlign: 'right', flexShrink: 0 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
    td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9' },
    badge: (bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: bg + '1a', color: bg }),
    propCard: { background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 },
    skeleton: { background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 12, height: 100 },
    empty: { textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 },
    miniBar: { height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', width: '100%' },
  };

  if (loading) {
    return (
      <div style={s.wrap}>
        <div style={s.heading}>{tx(t, 'financial.title', 'Financial Dashboard')}</div>
        <div style={s.sub}>{tx(t, 'financial.loading', 'Loading financial data...')}</div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={s.grid}>
          {[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}
        </div>
        <div style={{ ...s.skeleton, height: 250, marginBottom: 24 }} />
        <div style={{ ...s.skeleton, height: 200 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.wrap}>
        <div style={s.heading}>{tx(t, 'financial.title', 'Financial Dashboard')}</div>
        <div style={s.empty}>
          <AlertCircle size={40} style={{ marginBottom: 12, color: '#cbd5e1' }} />
          <div>{tx(t, 'financial.noData', 'No financial data available.')}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.heading}>{tx(t, 'financial.title', 'Financial Dashboard')}</div>
      <div style={s.sub}>{tx(t, 'financial.subtitle', 'Track expenses, budgets, and contractor performance')}</div>

      {/* Controls */}
      <div style={s.controls}>
        <CustomSelect
          size="compact"
          value={year}
          onChange={(v) => setYear(Number(v))}
          icon={<Calendar size={13} />}
          options={years.map((y) => ({ value: y, label: String(y) }))}
        />
        <CustomSelect
          size="compact"
          value={propertyFilter}
          onChange={setPropertyFilter}
          icon={<Building2 size={13} />}
          options={[
            { value: '', label: tx(t, 'financial.allProperties', 'All Properties') },
            ...((data.by_property || []).map((p) => ({
              value: p.property_id,
              label: p.building_name,
            }))),
          ]}
        />
      </div>

      {/* Overview Cards */}
      <div style={s.grid}>
        <div style={s.card(SUCCESS)}>
          <div style={s.cardIcon(SUCCESS)}><DollarSign size={18} color={SUCCESS} /></div>
          <div style={s.cardLabel}>{tx(t, 'financial.totalSpent', 'Total Spent')}</div>
          <p style={s.cardVal(SUCCESS)}>{fmt(ov.total_spent)}</p>
        </div>
        <div style={s.card(PRIMARY)}>
          <div style={s.cardIcon(PRIMARY)}><FileText size={18} color={PRIMARY} /></div>
          <div style={s.cardLabel}>{tx(t, 'financial.totalJobs', 'Total Jobs')}</div>
          <p style={s.cardVal(DARK)}>{ov.total_jobs || 0}</p>
        </div>
        <div style={s.card(WARNING)}>
          <div style={s.cardIcon(WARNING)}><TrendingUp size={18} color={WARNING} /></div>
          <div style={s.cardLabel}>{tx(t, 'financial.avgJobCost', 'Avg Job Cost')}</div>
          <p style={s.cardVal(DARK)}>{fmt(ov.avg_job_cost)}</p>
        </div>
        <div style={s.card('#6366f1')}>
          <div style={s.cardIcon('#6366f1')}><Briefcase size={18} color="#6366f1" /></div>
          <div style={s.cardLabel}>{tx(t, 'financial.activeContracts', 'Active Contracts')}</div>
          <p style={s.cardVal(DARK)}>{ov.active_contracts || 0}</p>
        </div>
        <div style={s.card(PRIMARY)}>
          <div style={s.cardIcon(PRIMARY)}><TrendingUp size={18} color={PRIMARY} /></div>
          <div style={s.cardLabel}>{tx(t, 'financial.budgetUtilization', 'Budget Utilization')}</div>
          <p style={{ ...s.cardVal(utilPct > 100 ? DANGER : DARK), fontSize: 22 }}>{utilPct}%</p>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(utilPct, 100)}%`, height: '100%', background: utilPct > 100 ? DANGER : PRIMARY, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Spending by Month */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{tx(t, 'financial.monthlySpending', 'Spending by Month')}</div>
        {monthlyData.map((m, i) => (
          <div key={i} style={s.barRow}>
            <div style={s.barLabel}>{m.label}</div>
            <div style={s.barTrack}>
              <div style={s.barFill((m.spent / maxMonthSpent) * 100, PRIMARY)} />
            </div>
            <div style={s.barAmt}>{fmt(m.spent)}</div>
          </div>
        ))}
      </div>

      {/* Spending by Category */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{tx(t, 'financial.categorySpending', 'Spending by Category')}</div>
        {sortedCategories.length === 0 && <div style={{ color: '#94a3b8', fontSize: 14 }}>{tx(t, 'financial.noCategories', 'No category data.')}</div>}
        {sortedCategories.map((c, i) => {
          const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Other;
          return (
            <div key={i} style={s.barRow}>
              <div style={{ ...s.barLabel, width: 90, textAlign: 'left' }}>{translateCategory(t, c.category)}</div>
              <div style={s.barTrack}>
                <div style={s.barFill((c.total_spent / maxCatSpent) * 100, color)} />
              </div>
              <div style={{ ...s.barAmt, width: 130 }}>
                {fmt(c.total_spent)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({c.job_count} {tx(t, 'financial.jobs', 'jobs')})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spending by Property */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{tx(t, 'financial.propertySpending', 'Spending by Property')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {(data.by_property || []).map((p, i) => {
            const pct = p.budget_planned ? Math.round((p.total_spent / p.budget_planned) * 100) : 0;
            return (
              <div key={i} style={s.propCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} color={PRIMARY} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{p.building_name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.address}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                  <span>{tx(t, 'financial.spent', 'Spent')}: <b>{fmt(p.total_spent)}</b></span>
                  <span>{tx(t, 'financial.planned', 'Planned')}: <b>{fmt(p.budget_planned)}</b></span>
                </div>
                <div style={s.miniBar}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct > 100 ? DANGER : PRIMARY, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.job_count} {tx(t, 'financial.jobs', 'jobs')} &middot; {pct}% {tx(t, 'financial.utilized', 'utilized')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Comparison Table */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{tx(t, 'financial.budgetComparison', 'Budget Comparison')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>{tx(t, 'financial.jobTitle', 'Job Title')}</th>
                <th style={s.th}>{tx(t, 'financial.category', 'Category')}</th>
                <th style={s.th}>{tx(t, 'financial.budgetRange', 'Budget Range')}</th>
                <th style={s.th}>{tx(t, 'financial.actualCost', 'Actual Cost')}</th>
                <th style={s.th}>{tx(t, 'financial.variance', 'Variance')}</th>
                <th style={s.th}>{tx(t, 'financial.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedBudget.length === 0 && (
                <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#94a3b8' }}>{tx(t, 'financial.noJobs', 'No job data.')}</td></tr>
              )}
              {sortedBudget.map((j, i) => {
                const mid = (j.budget_min + j.budget_max) / 2;
                const variance = j.actual_cost - mid;
                const over = variance > 0;
                return (
                  <tr key={i}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{j.title}</td>
                    <td style={s.td}>{translateCategory(t, j.category)}</td>
                    <td style={s.td}>{fmt(j.budget_min)} - {fmt(j.budget_max)}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{fmt(j.actual_cost)}</td>
                    <td style={{ ...s.td, color: over ? DANGER : SUCCESS, fontWeight: 600 }}>
                      {over ? '+' : ''}{fmt(variance)}
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(j.status === 'completed' ? SUCCESS : WARNING)}>
                        {translateStatus(t, j.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Contractors */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{tx(t, 'financial.topContractors', 'Top Contractors')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {(data.top_contractors || []).map((c, i) => (
            <div key={i} style={{ ...s.propCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.company_name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{fmt(c.total_paid)} &middot; {c.job_count} {tx(t, 'financial.jobs', 'jobs')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} fill={s <= Math.round(c.avg_rating) ? '#f59e0b' : 'none'} color="#f59e0b" />
                ))}
                <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4, color: DARK }}>{c.avg_rating?.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FinancialDashboard;
