const variants = {
  text: 'space-y-2',
  card: 'space-y-3 p-5',
  avatar: 'rounded-full',
  image: 'rounded-xl',
};

const sizes = {
  sm: { text: 'h-3', card: 'h-32', avatar: 'w-8 h-8', image: 'w-full h-32' },
  md: { text: 'h-4', card: 'h-48', avatar: 'w-12 h-12', image: 'w-full h-48' },
  lg: { text: 'h-5', card: 'h-64', avatar: 'w-16 h-16', image: 'w-full h-64' },
};

function SkeletonBlock({ variant = 'text', size = 'md', count = 1, className = '' }) {
  const baseClass = `bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${variants[variant]} ${sizes[size]?.[variant] || sizes.md[variant]} ${className}`;

  if (count > 1) {
    return (
      <div className={variants[variant]}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${baseClass} ${i === count - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={baseClass}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
        </div>
      </div>
    );
  }

  return <div className={baseClass} />;
}

export default function Skeleton({ variant = 'text', size = 'md', count = 1, className = '' }) {
  return <SkeletonBlock variant={variant} size={size} count={count} className={className} />;
}
