import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  as = 'div',
  ...props
}) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={`
        relative overflow-hidden
        bg-white/60 dark:bg-gray-900/60
        backdrop-blur-xl
        border border-white/20 dark:border-gray-700/30
        shadow-lg shadow-black/5
        rounded-2xl
        ${hover ? 'hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20 hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-orange-500/10 dark:shadow-orange-500/5' : ''}
        transition-all duration-500
        ${className}
      `}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
      {children}
    </Component>
  );
}
