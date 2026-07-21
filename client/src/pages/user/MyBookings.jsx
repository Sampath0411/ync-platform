import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiTicket, HiCalendar, HiLocationMarker, HiSearch, HiDownload, HiEye, HiFilter } from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import { bookingsAPI } from '@/api/client';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

function getStatusForBadge(status) {
  switch (status) {
    case 'confirmed': return 'active';
    case 'pending': return 'pending';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
}

function isUpcoming(dateStr) {
  return new Date(dateStr) > new Date();
}

function isPast(dateStr) {
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.getMy();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const eventName = booking.event_name || '';

    if (searchQuery && !eventName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    switch (activeTab) {
      case 'upcoming':
        return booking.status !== 'cancelled' && isUpcoming(booking.event_date);
      case 'past':
        return booking.status !== 'cancelled' && isPast(booking.event_date);
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  return (
    <div className="h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <HiTicket className="w-8 h-8 text-orange-500" />
          My Bookings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your event tickets and bookings.
        </p>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by event name..."
              iconLeft={HiSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <HiFilter className="w-4 h-4" />
            <span>{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/60 rounded-xl w-fit backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bookings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" size="lg" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <HiTicket className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No bookings found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : `You don't have any ${activeTab !== 'all' ? activeTab : ''} bookings yet.`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {filteredBookings.map((booking) => (
            <motion.div key={booking.id} variants={cardVariants}>
              <GlassCard className="p-5 h-full flex flex-col">
                <div className="relative z-10 flex flex-col h-full">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {booking.event_name || 'Event'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        ID: {booking.id?.slice(0, 8) || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={getStatusForBadge(booking.status)} />
                  </div>

                  {/* Card Details */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <HiCalendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>{formatDate(booking.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <HiLocationMarker className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="truncate">{booking.venue || 'Venue TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <HiTicket className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>{booking.quantity || 1} ticket(s) — ₹{booking.total_amount || 0}</span>
                    </div>
                  </div>

                  {/* Booked Date */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    Booked on {formatDate(booking.booking_date || booking.created_at)}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200/60 dark:border-gray-700/40">
                    <Link to={`/dashboard/bookings/${booking.id}/ticket`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full gap-1.5">
                        <HiEye className="w-4 h-4" />
                        View Ticket
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {}}
                    >
                      <HiDownload className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
