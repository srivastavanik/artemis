function MetricCard({ title, value, change, trend }) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-neutral-500';
  };

  return (
    <div className="card">
      <div className="text-sm text-neutral-600 mb-2">{title}</div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`text-sm mt-1 ${getTrendColor()}`}>
          {change}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
