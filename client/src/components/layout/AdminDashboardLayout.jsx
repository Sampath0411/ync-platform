import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiCalendar,
  HiUserGroup,
  HiPhotograph,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiBell,
  HiChartBar,
  HiUsers,
  HiMail,
  HiCollection,
  HiShieldCheck,
} from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import Breadcrumb from '@/components/ui/Breadcrumb';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: HiHome },
  { label: 'Analytics', href: '/admin/analytics', icon: HiChartBar },
  { label: 'Events', href: '/admin/events', icon: HiCalendar },
  { label: 'Members', href: '/admin/members', icon: HiUsers },
  { label: 'Gallery', href: '/admin/gallery', icon: HiPhotograph },
  { label: 'Messages', href: '/admin/messages', icon: HiMail },
  { label: 'Content', href: '/admin/content', icon: HiCollection },
  { label: 'Settings', href: '/admin/settings', icon: HiCog },
];

export default function AdminDashboardLayout({ children, breadcrumbs }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-xs">
                A
              </div>
              <div>
                <span className="text-lg font-display font-bold gradient-text">Admin</span>
                <span className="block text-[10px] text-gray-400 font-medium leading-none">Panel</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Admin badge */}
          <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <HiShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                Admin Access
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              You have full system access
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <HiHome className="w-4 h-4" />
              Back to Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            >
              <HiLogout className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <HiMenu className="w-5 h-5" />
              </button>
              {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                <HiBell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              </button>
              <Avatar src={user?.avatar} name={user?.name || 'Admin'} size="sm" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
