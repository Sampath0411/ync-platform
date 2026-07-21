import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiCalendar,
  HiTicket,
  HiIdentification,
  HiBell,
  HiUser,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiSearch,
  HiMoon,
  HiSun,
  HiChevronDown,
  HiSpeakerphone,
  HiHeart,
  HiClock,
  HiStar,
} from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const sidebarLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: HiHome },
  { label: 'Events', href: '/dashboard/events', icon: HiCalendar },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: HiTicket },
  { label: 'Favorites', href: '/dashboard/favorites', icon: HiHeart },
  { label: 'Waitlist', href: '/dashboard/waitlist', icon: HiClock },
  { label: 'My Reviews', href: '/dashboard/reviews', icon: HiStar },
  { label: 'Membership', href: '/dashboard/membership', icon: HiIdentification },
  { label: 'Notifications', href: '/dashboard/notifications', icon: HiBell },
  { label: 'My Tickets', href: '/dashboard/tickets', icon: HiTicket },
  { label: 'Announcements', href: '/dashboard/announcements', icon: HiSpeakerphone },
  { label: 'Profile', href: '/dashboard/profile', icon: HiUser },
  { label: 'Settings', href: '/dashboard/settings', icon: HiCog },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('ync_token');
        if (!token) return;
        const res = await fetch('/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.count !== undefined) setNotificationCount(data.count);
      } catch {
        // silently ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen flex overflow-hidden bg-black">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex-shrink-0
          bg-black/90 lg:bg-black/40 backdrop-blur-2xl
          border-r border-white/5
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar header */}
          <div className={`flex items-center p-4 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shrink-0 shadow-lg shadow-orange-500/20">
                Y
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-display font-bold gradient-text">YNC</span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className={`p-4 border-b border-white/5 ${sidebarCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-lg shadow-orange-500/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
            {sidebarLinks.map((link) => {
              const isActive =
                location.pathname === link.href ||
                (link.href !== '/dashboard' && location.pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  title={sidebarCollapsed ? link.label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-400 shadow-sm shadow-orange-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap">{link.label}</span>
                  )}
                  {link.href === '/dashboard/notifications' && notificationCount > 0 && (
                    <span
                      className={`
                        ${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}
                        min-w-[20px] h-5 px-1.5 flex items-center justify-center
                        bg-red-500 text-white text-xs font-bold rounded-full
                      `}
                    >
                      {notificationCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="hidden lg:block p-3 border-t border-white/5">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <HiChevronDown className="w-4 h-4 -rotate-90" />
              </motion.div>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={logout}
              title={sidebarCollapsed ? 'Logout' : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <HiLogout className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Open sidebar"
              >
                <HiMenu className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/30 transition-all w-64">
                <HiSearch className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 w-full"
                />
              </div>
              <button className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <HiSearch className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              </button>

              <Link
                to="/dashboard/notifications"
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors relative"
              >
                <HiBell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-black">
                    {notificationCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-orange-500/20">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate">
                    {user?.name || 'User'}
                  </span>
                  <HiChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden py-2"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email || ''}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <HiUser className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <HiCog className="w-4 h-4" />
                          Settings
                        </Link>
                      </div>
                      <div className="border-t border-white/5 pt-1">
                        <button
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                        >
                          <HiLogout className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content — compact padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
