import { motion } from 'framer-motion';

// Spinning loader component
function SpinningLoader({ size = 'md', color = 'primary', className = '' }) {
  const sizeStyles = {
    xs: 'w-3 h-3 border-[2px]',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorStyles = {
    primary: 'border-orange-200 dark:border-orange-900 border-t-orange-600 dark:border-t-orange-400',
    secondary: 'border-red-200 dark:border-red-900 border-t-red-600 dark:border-t-red-400',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 dark:border-gray-700 border-t-gray-500',
  };

  return (
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
}

// Skeleton loader for content placeholders
function SkeletonLoader({ variant = 'line', count = 1, className = '' }) {
  const baseClass = 'bg-gray-200 dark:bg-gray-700 rounded animate-skeleton';

  if (variant === 'circle') {
    return <div className={`${baseClass} w-12 h-12 rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className={`space-y-3 p-4 ${className}`}>
        <div className={`${baseClass} h-40 w-full rounded-xl`} />
        <div className={`${baseClass} h-4 w-3/4`} />
        <div className={`${baseClass} h-4 w-1/2`} />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${baseClass} w-10 h-10 rounded-full`} />
        <div className="space-y-2 flex-1">
          <div className={`${baseClass} h-3 w-1/3`} />
          <div className={`${baseClass} h-2.5 w-1/4`} />
        </div>
      </div>
    );
  }

  // Default: line variant
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} h-3.5 ${i === count - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// Full-page loader
function PageLoader({ text = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] py-12"
    >
      <div className="relative">
        <SpinningLoader size="lg" />
        <div className="absolute inset-0 rounded-full animate-pulse-glow" />
      </div>
      {text && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          {text}
        </p>
      )}
    </motion.div>
  );
}

// Inline loader (for buttons, sections)
function InlineLoader({ size = 'sm', text, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SpinningLoader size={size} />
      {text && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{text}</span>
      )}
    </div>
  );
}

// Main Loader export with sub-components
export default function Loader({ variant = 'spin', ...props }) {
  switch (variant) {
    case 'skeleton':
      return <SkeletonLoader {...props} />;
    case 'page':
      return <PageLoader {...props} />;
    case 'inline':
      return <InlineLoader {...props} />;
    case 'spin':
    default:
      return <SpinningLoader {...props} />;
  }
}

// Named exports for direct imports
Loader.Spin = SpinningLoader;
Loader.Skeleton = SkeletonLoader;
Loader.Page = PageLoader;
Loader.Inline = InlineLoader;
