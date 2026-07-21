const statusConfig = {
  active: {
    label: 'Active',
    dot: 'bg-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  upcoming: {
    label: 'Upcoming',
    dot: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-gray-400 dark:bg-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  draft: {
    label: 'Draft',
    dot: 'bg-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
  },
};

export default function StatusBadge({ status = 'active', className = '' }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${config.bg}
        ${config.text}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
