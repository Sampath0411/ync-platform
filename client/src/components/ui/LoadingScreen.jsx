import { motion } from 'framer-motion';

export default function LoadingScreen({ text = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-950"
    >
      <div className="relative">
        {/* Logo */}
        <div className="text-4xl font-display font-bold mb-8">
          <span className="gradient-text">YNC</span>
        </div>

        {/* Spinner ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
          <div className="w-full h-full rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
        </div>
      </div>

      <p className="mt-24 text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
        {text}
      </p>
    </motion.div>
  );
}
