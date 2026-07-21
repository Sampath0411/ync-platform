const variantStyles = {
  default:
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  success:
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  warning:
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  error:
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  info:
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  primary:
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'success' ? 'bg-emerald-500' : ''}
            ${variant === 'warning' ? 'bg-red-500' : ''}
            ${variant === 'error' ? 'bg-red-500' : ''}
            ${variant === 'info' ? 'bg-amber-500' : ''}
            ${variant === 'primary' ? 'bg-orange-500' : ''}
            ${variant === 'default' ? 'bg-gray-400 dark:bg-gray-500' : ''}
          `}
        />
      )}
      {children}
    </span>
  );
}
