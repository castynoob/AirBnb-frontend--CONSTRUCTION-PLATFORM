import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";

function DateFilterModal({
  isOpen,
  onClose,
  onApply,
  currentPeriod,
  currentDateRange,
  title = "Filter Data",
}) {
  const [period, setPeriod] = useState(currentPeriod || "day");
  const [dateRange, setDateRange] = useState({
    start: currentDateRange?.start || "",
    end: currentDateRange?.end || "",
  });
  const [useCustomRange, setUseCustomRange] = useState(!!currentDateRange?.start);

  useEffect(() => {
    if (isOpen) {
      setPeriod(currentPeriod || "day");
      setDateRange({
        start: currentDateRange?.start || "",
        end: currentDateRange?.end || "",
      });
      setUseCustomRange(!!currentDateRange?.start);
    }
  }, [isOpen, currentPeriod, currentDateRange]);

  const handleApply = () => {
    if (useCustomRange && dateRange.start && dateRange.end) {
      onApply(period, dateRange);
    } else {
      onApply(period, { start: "", end: "" });
    }
    onClose();
  };

  const handlePeriodClick = (newPeriod) => {
    setPeriod(newPeriod);
    setUseCustomRange(false);
    setDateRange({ start: "", end: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal date-filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="filter-section">
            <label className="filter-label">Time Period</label>
            <div className="filter-period-buttons">
              {["day", "week", "month", "year"].map((p) => (
                <button
                  key={p}
                  className={`filter-period-btn ${period === p && !useCustomRange ? "active" : ""}`}
                  onClick={() => handlePeriodClick(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-divider">
            <span>or</span>
          </div>

          <div className="filter-section">
            <label className="filter-label">
              <input
                type="checkbox"
                checked={useCustomRange}
                onChange={(e) => setUseCustomRange(e.target.checked)}
              />
              <span>Custom Date Range</span>
            </label>

            {useCustomRange && (
              <div className="filter-date-range">
                <div className="filter-date-field">
                  <label>From</label>
                  <div className="filter-date-input-wrapper">
                    <Calendar size={16} />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="filter-date-input"
                    />
                  </div>
                </div>
                <div className="filter-date-field">
                  <label>To</label>
                  <div className="filter-date-input-wrapper">
                    <Calendar size={16} />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="filter-date-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="filter-info">
            <p>
              {useCustomRange && dateRange.start && dateRange.end
                ? `Showing data from ${new Date(dateRange.start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${new Date(dateRange.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} grouped by ${period}`
                : `Showing data grouped by ${period}`}
            </p>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleApply}
            disabled={useCustomRange && (!dateRange.start || !dateRange.end)}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateFilterModal;
