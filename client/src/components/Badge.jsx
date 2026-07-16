const styles = {
  Active: 'bg-secondary-50 text-secondary-700',
  Disabled: 'bg-slate-100 text-slate-500',
  Draft: 'bg-amber-50 text-amber-700',
  Sufficient: 'bg-secondary-50 text-secondary-700',
  Insufficient: 'bg-red-50 text-red-700',
  Completed: 'bg-secondary-50 text-secondary-700',
  Cancelled: 'bg-red-50 text-red-700',
  Administrator: 'bg-primary-50 text-primary-700',
  Manager: 'bg-purple-50 text-purple-700',
  'Production Operator': 'bg-amber-50 text-amber-700',
  'Store Keeper': 'bg-teal-50 text-teal-700',
};

const Badge = ({ children }) => {
  const cls = styles[children] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${cls}`}>{children}</span>;
};

export default Badge;
