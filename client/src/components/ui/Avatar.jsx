import { useState } from 'react';

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const badgeSizes = {
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name) {
  if (!name) return 'bg-orange-500';
  const colors = [
    'bg-orange-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({
  src,
  name,
  size = 'md',
  online = false,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeStyles[size]} rounded-full object-cover`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`
            ${sizeStyles[size]}
            ${getColorFromName(name)}
            rounded-full flex items-center justify-center text-white font-semibold
          `}
        >
          {getInitials(name)}
        </div>
      )}

      {online && (
        <span
          className={`
            absolute bottom-0 right-0
            ${badgeSizes[size]}
            bg-emerald-500 border-white dark:border-gray-900
            rounded-full
          `}
        />
      )}
    </div>
  );
}
