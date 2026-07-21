import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push('...');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (i > 1 && i < totalPages) pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push('...');

  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`} aria-label="Pagination">
      <button
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage <= 1}
        className="
          p-2 rounded-lg text-gray-500 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors
        "
        aria-label="Previous page"
      >
        <HiChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-1 text-gray-400 dark:text-gray-500 text-sm select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`
              min-w-[2.25rem] h-9 rounded-lg text-sm font-medium transition-all duration-200
              ${
                page === currentPage
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="
          p-2 rounded-lg text-gray-500 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors
        "
        aria-label="Next page"
      >
        <HiChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
