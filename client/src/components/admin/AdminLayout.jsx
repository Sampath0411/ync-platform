import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiTicket,
  HiSpeakerphone,
  HiPhotograph,
  HiBell,
  HiMail,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiChevronLeft,
  HiQrcode,
  HiShieldCheck,
  HiChartBar,
  HiDocumentText,
} from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: HiHome },
  { label: 'Analytics', href: '/admin/analytics', icon: HiChartBar },
  { label: 'Users', href: '/admin/users', icon: HiUsers },
  { label: 'Members', href: '/admin/members', icon: HiUserGroup },
  { label: 'Events', href: '/admin/events', icon: HiCalendar },
  { label: 'Bookings/Tickets', href: '/admin/bookings', icon: HiTicket },
  { label: 'Feedback', href: '/admin/feedback', icon: HiDocumentText },
  { label: 'Scanner', href: '/admin/scanner', icon: HiQrcode },
  { label: 'Announcements', href: '/admin/announcements', icon: HiSpeakerphone },
  { label: 'Gallery', href: '/admin/gallery', icon: HiPhotograph },
  { label: 'Notifications', href: '/admin/notifications', icon: HiBell },
  { label: 'Contact Messages', href: '/admin/contacts', icon: HiMail },
  { label: 'Settings', href: '/admin/settings', icon: HiCog },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center p-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <Link to="/admin" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/20">
                  Y
                </div>
                <div>
                  <span className="text-base font-display font-bold gradient-text">YNC</span>
                  <span className="block text-[10px] text-gray-500 font-medium leading-none">Admin Panel</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm">
                Y
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-2 mx-3 mt-3 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-xs ml-2">Collapse</span>}
          </button>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-orange-500/20 text-orange-400 shadow-sm shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 space-y-2">
            {!collapsed && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@ync.org'}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <HiLogout className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <HiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <HiShieldCheck className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-gray-400">Admin Panel</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">
                {user?.name || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Logout"
              >
                <HiLogout className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
