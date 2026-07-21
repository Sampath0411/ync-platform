export default function Spinner({ size = 'md', color = 'primary', fullPage = false, className = '' }) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  const colorStyles = {
    primary: 'border-orange-200 dark:border-orange-800 border-t-orange-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 dark:border-gray-700 border-t-gray-500',
  };

  const spinner = (
    <div
      className={`
        rounded-full animate-spin
        ${sizeStyles[size] || sizeStyles.md}
        ${colorStyles[color] || colorStyles.primary}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return spinner;
}
