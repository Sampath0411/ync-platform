import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSun, HiMoon, HiLogout, HiUser, HiCollection, HiCog } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Avatar from '@/components/ui/Avatar';

const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Events', href: '#events' },
  { label: 'Membership', href: '#membership' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (location.pathname !== '/') {
      navigate('/' + href);
    }
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${
          scrolled
            ? 'bg-black/70 backdrop-blur-2xl shadow-lg shadow-black/20 border-b border-white/5'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
              Y
            </div>
            <span className="text-xl font-display font-bold">
              <span className="gradient-text">YNC</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <HiSun className="w-5 h-5" />
              ) : (
                <HiMoon className="w-5 h-5" />
              )}
            </button>

            {/* Auth buttons or user menu */}
            {isAuthenticated && user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate hidden lg:block">
                    {user.name}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 py-1.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl"
                    >
                      <Link
                        to="/dashboard/profile"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <HiUser className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/dashboard'}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <HiCollection className="w-4 h-4" />
                        Dashboard
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin/settings"
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <HiCog className="w-4 h-4" />
                          Settings
                        </Link>
                      )}
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                      >
                        <HiLogout className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  Join YNC
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-black/90 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}

              <hr className="my-2 border-white/10" />

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/5"
                  >
                    <HiUser className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/5"
                  >
                    <HiCollection className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-950/30"
                  >
                    <HiLogout className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    className="w-full text-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl transition-all"
                  >
                    Join YNC
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
