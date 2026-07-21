import { HiChevronRight, HiHome } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <nav className={`flex items-center gap-1 text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <HiHome className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1">
            <HiChevronRight className="w-3.5 h-3.5 text-gray-400" />
            {isLast ? (
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
