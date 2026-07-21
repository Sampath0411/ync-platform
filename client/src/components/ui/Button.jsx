import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25 active:shadow-none',
  secondary:
    'bg-gradient-to-r from-red-500 to-rose-400 text-white hover:shadow-lg hover:shadow-red-500/25 active:shadow-none',
  outline:
    'border-2 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 hover:border-orange-500/60',
  ghost:
    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/25 active:shadow-none',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

const SpinnerIcon = ({ size }) => (
  <svg
    className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      iconLeft: IconLeft,
      iconRight: IconRight,
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        className={`
          inline-flex items-center justify-center font-medium rounded-xl
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${variants[variant] || variants.primary}
          ${sizes[size] || sizes.md}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <SpinnerIcon size={size} />
        ) : IconLeft ? (
          <IconLeft className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
        ) : null}
        {children && <span>{children}</span>}
        {!loading && IconRight && (
          <IconRight className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
