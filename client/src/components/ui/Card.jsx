import { motion } from 'framer-motion';

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
  glass:
    'bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg',
  gradient:
    'bg-gradient-to-br from-orange-500/10 via-red-500/10 to-red-500/10 border border-orange-500/20 dark:border-orange-500/10',
  bordered:
    'bg-transparent border-2 border-gray-200 dark:border-gray-700',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <motion.div
      className={`
        rounded-2xl
        ${variantStyles[variant] || variantStyles.default}
        ${paddingStyles[padding] || paddingStyles.md}
        ${hover ? 'hover:shadow-xl hover:-translate-y-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}
