import { format, formatDistanceToNow, parseISO, isValid, differenceInDays } from 'date-fns';

/**
 * Format a date string or Date object to a readable format.
 * @param {string|Date} date
 * @param {string} formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns {string}
 */
export function formatDate(date, formatStr = 'MMM d, yyyy') {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, formatStr);
}

/**
 * Format a date with time.
 * @param {string|Date} date
 * @returns {string} e.g. "Jan 15, 2024 at 3:30 PM"
 */
export function formatDateTime(date) {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format a date as relative time (e.g. "2 hours ago", "3 days ago").
 * @param {string|Date} date
 * @returns {string}
 */
export function formatRelative(date) {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Smart date formatter: shows relative for recent, absolute for older.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatSmart(date) {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';

  const daysDiff = differenceInDays(new Date(), parsed);

  if (daysDiff < 1) return formatDistanceToNow(parsed, { addSuffix: true });
  if (daysDiff < 7) return format(parsed, 'EEEE');
  if (daysDiff < 365) return format(parsed, 'MMM d');
  return format(parsed, 'MMM d, yyyy');
}

/**
 * Format a date for event display.
 * @param {string|Date} date
 * @returns {string} e.g. "Sat, Jan 15"
 */
export function formatEventDate(date) {
  return formatDate(date, 'EEE, MMM d');
}

/**
 * Format time only.
 * @param {string|Date} date
 * @returns {string} e.g. "3:30 PM"
 */
export function formatTime(date) {
  return formatDate(date, 'h:mm a');
}

/**
 * Format a date range for events.
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {string}
 */
export function formatDateRange(start, end) {
  if (!start) return '';
  const startStr = formatDate(start, 'MMM d');
  if (!end) return startStr;

  const startParsed = typeof start === 'string' ? parseISO(start) : start;
  const endParsed = typeof end === 'string' ? parseISO(end) : end;

  if (!isValid(startParsed) || !isValid(endParsed)) return startStr;

  // Same day
  if (format(startParsed, 'yyyy-MM-dd') === format(endParsed, 'yyyy-MM-dd')) {
    return `${format(startParsed, 'MMM d, yyyy')} ${format(startParsed, 'h:mm a')} - ${format(endParsed, 'h:mm a')}`;
  }

  // Same month
  if (format(startParsed, 'yyyy-MM') === format(endParsed, 'yyyy-MM')) {
    return `${format(startParsed, 'MMM d')} - ${format(endParsed, 'd, yyyy')}`;
  }

  return `${format(startParsed, 'MMM d')} - ${format(endParsed, 'MMM d, yyyy')}`;
}
