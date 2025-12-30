function StatsCard({ title, value, change, icon: Icon, color = "primary" }) {
  const colorClasses = {
    primary: "stats-card-primary",
    success: "stats-card-success",
    warning: "stats-card-warning",
    danger: "stats-card-danger",
    info: "stats-card-info",
  };

  return (
    <div className={`admin-stats-card ${colorClasses[color] || ""}`}>
      <div className="admin-stats-card-header">
        <div className="admin-stats-card-title">{title}</div>
        {Icon && (
          <div className="admin-stats-card-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="admin-stats-card-value">{value}</div>
      {change && (
        <div className="admin-stats-card-change">
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;
