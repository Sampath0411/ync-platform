import { motion } from 'framer-motion';

export default function SectionTitle({
  title,
  subtitle,
  variant = 'center',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`
        ${variant === 'center' ? 'text-center' : 'text-left'}
        mb-12 md:mb-16
        ${className}
      `}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div
        className={`
          mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-red-500
          ${variant === 'center' ? 'mx-auto' : ''}
        `}
      />
    </motion.div>
  );
}
