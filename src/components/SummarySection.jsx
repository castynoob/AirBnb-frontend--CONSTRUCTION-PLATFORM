import { Building2, CheckCircle, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";

function SummarySection({ totalProperties, totalBidsApproved, totalJobs }) {
  // Placeholder trend data - can be replaced with real data later
  const propertyTrend = { direction: 'up', value: '+2', label: 'this month' };
  const bidTrend = { direction: 'up', value: '+15%', label: 'this month' };
  const jobTrend = { direction: 'down', value: '-3', label: 'this month' };

  return (
    <section className="pm-summary-section">
      {/* Total Properties Card */}
      <div className="pm-summary-card pm-card-red">
        <div className="pm-card-left-content">
          <span className="pm-card-title">Total Properties</span>
          <div className="pm-card-value-row">
            <h3 className="pm-metric-value">{totalProperties}</h3>
          </div>
          <span className="pm-metric-label">{propertyTrend.label}</span>
        </div>
        <div className="pm-card-right-column">
          <div className="pm-card-icon-circle pm-icon-red">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <span className={`pm-trend-badge-bottom ${propertyTrend.direction === 'up' ? 'pm-trend-positive' : 'pm-trend-negative'}`}>
            {propertyTrend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{propertyTrend.value}</span>
          </span>
        </div>
      </div>

      {/* Total Bids Approved Card */}
      <div className="pm-summary-card pm-card-teal">
        <div className="pm-card-left-content">
          <span className="pm-card-title">Bids Approved</span>
          <div className="pm-card-value-row">
            <h3 className="pm-metric-value">{totalBidsApproved}</h3>
          </div>
          <span className="pm-metric-label">{bidTrend.label}</span>
        </div>
        <div className="pm-card-right-column">
          <div className="pm-card-icon-circle pm-icon-teal">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
          <span className={`pm-trend-badge-bottom ${bidTrend.direction === 'up' ? 'pm-trend-positive' : 'pm-trend-negative'}`}>
            {bidTrend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{bidTrend.value}</span>
          </span>
        </div>
      </div>

      {/* Total Jobs Card */}
      <div className="pm-summary-card pm-card-navy">
        <div className="pm-card-left-content">
          <span className="pm-card-title">Total Jobs</span>
          <div className="pm-card-value-row">
            <h3 className="pm-metric-value">{totalJobs}</h3>
          </div>
          <span className="pm-metric-label">{jobTrend.label}</span>
        </div>
        <div className="pm-card-right-column">
          <div className="pm-card-icon-circle pm-icon-navy">
            <ClipboardList size={20} strokeWidth={2.5} />
          </div>
          <span className={`pm-trend-badge-bottom ${jobTrend.direction === 'up' ? 'pm-trend-positive' : 'pm-trend-negative'}`}>
            {jobTrend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{jobTrend.value}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default SummarySection;