import { Link } from 'react-router-dom';
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import {
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
  FaGithub,
} from 'react-icons/fa';

const quickLinks = [
  { label: 'About Us', href: '#about' },
  { label: 'Events', href: '#events' },
  { label: 'Membership', href: '#membership' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

const forMembers = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Events', href: '/dashboard/events' },
  { label: 'Profile', href: '/dashboard/profile' },
  { label: 'Settings', href: '/dashboard/settings' },
];

const socialLinks = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaYoutube, href: '#', label: 'YouTube' },
  { icon: FaGithub, href: '#', label: 'GitHub' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t border-white/5">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 via-red-500 to-red-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/25">
                Y
              </div>
              <span className="text-xl font-display font-bold">
                <span className="gradient-text">YNC</span>
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Empowering youth, building community. Join the Youth Network Community
              and be part of something bigger.
            </p>
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center justify-center transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Members */}
          <div>
            <h3 className="text-sm font-display font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              For Members
            </h3>
            <ul className="space-y-2.5">
              {forMembers.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-display font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <HiMail className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:hello@ync.in"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  hello@ync.in
                </a>
              </li>
              <li className="flex items-start gap-3">
                <HiPhone className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+919291493225"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  +91 9291493225
                </a>
              </li>
              <li className="flex items-start gap-3">
                <HiLocationMarker className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Visakhapatnam, India
                </span>
              </li>
            </ul>

            {/* Newsletter placeholder */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Stay updated with our newsletter
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:shadow-lg transition-shadow">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              &copy; {currentYear} YNC. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="#"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="#"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
