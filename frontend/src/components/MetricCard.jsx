function MetricCard({ title, value, subtitle, type = 'default', children }) {
  // Format large numbers
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val.toString();
    }
    return val;
  };

  if (type === 'hero') {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-bold text-white mb-4">
            {formatValue(value)}
          </h2>
          <p className="text-xl md:text-2xl text-gray-300">{title}</p>
          
          {/* Additional stats */}
          {subtitle && (
            <div className="mt-8 flex justify-center gap-8">
              {subtitle.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-semibold text-white">{formatValue(stat.value)}</div>
                  <div className="text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* User avatars or additional content */}
          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default card style
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
      <div className="relative z-10">
        <p className="text-gray-400 text-sm mb-2">{title}</p>
        <p className="text-3xl font-semibold text-white">{formatValue(value)}</p>
      </div>
    </div>
  );
}

export default MetricCard;
