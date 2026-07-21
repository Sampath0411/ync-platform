// API base URL
export const API_BASE_URL = '/api';

// Event categories
export const EVENT_CATEGORIES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'conference', label: 'Conference' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'competition', label: 'Competition' },
  { value: 'social', label: 'Social Event' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

// Membership statuses
export const MEMBERSHIP_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// Membership status labels and colors
export const MEMBERSHIP_STATUS_CONFIG = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  expired: { label: 'Expired', variant: 'error' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'error' },
};

// Event statuses
export const EVENT_STATUSES = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Event status config
export const EVENT_STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', variant: 'info' },
  ongoing: { label: 'Ongoing', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  USER: 'user',
};

// User role labels
export const USER_ROLE_CONFIG = {
  admin: { label: 'Admin', variant: 'error' },
  member: { label: 'Member', variant: 'primary' },
  user: { label: 'User', variant: 'default' },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [5, 10, 20, 50],
};

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword'],
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'ync_token',
  THEME: 'ync_theme',
  USER: 'ync_user',
};

// Social links
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/ync_community',
  twitter: 'https://twitter.com/ync_community',
  linkedin: 'https://linkedin.com/company/ync',
  youtube: 'https://youtube.com/@ync_community',
};

// Contact info
export const CONTACT_INFO = {
  email: 'contact@ync.org',
  phone: '+91 9XXXXXXXXX',
  address: 'Andhra University, Visakhapatnam, AP, India',
};

// Navigation items
export const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

// Dashboard navigation
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: 'HiHome' },
  { label: 'Events', path: '/admin/events', icon: 'HiCalendar' },
  { label: 'Members', path: '/admin/members', icon: 'HiUsers' },
  { label: 'Gallery', path: '/admin/gallery', icon: 'HiPhotograph' },
  { label: 'Applications', path: '/admin/applications', icon: 'HiDocumentText' },
  { label: 'Settings', path: '/admin/settings', icon: 'HiCog' },
];

export const USER_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'HiHome' },
  { label: 'Events', path: '/dashboard/events', icon: 'HiCalendar' },
  { label: 'My Tickets', path: '/dashboard/tickets', icon: 'HiTicket' },
  { label: 'Profile', path: '/dashboard/profile', icon: 'HiUser' },
];
