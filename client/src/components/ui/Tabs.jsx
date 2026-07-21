import { motion } from 'framer-motion';

export default function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-1 p-1
        bg-gray-100 dark:bg-gray-800
        rounded-xl
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id || activeTab === tab.value;
        return (
          <button
            key={tab.id || tab.value}
            onClick={() => onTabChange?.(tab.id || tab.value)}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
              ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-orange-500 rounded-lg"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label || tab.id}
              {tab.count !== undefined && (
                <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                  ({tab.count})
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
