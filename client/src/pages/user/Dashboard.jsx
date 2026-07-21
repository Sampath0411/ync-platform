import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiCalendar, HiTicket, HiIdentification, HiBell, HiArrowRight, HiSpeakerphone, HiLightningBolt } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI, bookingsAPI, announcementsAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const statConfigs = [
  { label: 'Upcoming Events', value: 0, icon: HiCalendar, gradient: 'from-orange-600 to-red-600' },
  { label: 'Active Bookings', value: 0, icon: HiTicket, gradient: 'from-red-500 to-rose-500' },
  { label: 'Membership', value: 'Active', icon: HiIdentification, gradient: 'from-amber-500 to-orange-500' },
  { label: 'Notifications', value: 0, icon: HiBell, gradient: 'from-orange-500 to-red-500' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eventsData, setEventsData] = useState([]);
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, announcementsRes, bookingsRes] = await Promise.all([
        eventsAPI.getAll({ status: 'published', limit: 4 }),
        announcementsAPI.getAll({ limit: 3 }),
        bookingsAPI.getMy(),
      ]);
      setEventsData(eventsRes.data || []);
      setAnnouncementsData(announcementsRes.data || []);
      setBookingsCount(bookingsRes.data?.length || 0);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setEventsData([]);
      setAnnouncementsData([]);
      setBookingsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const mappedEvents = (eventsData || []).map(e => ({
    id: e.id,
    title: e.name || e.title,
    date: e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    venue: e.venue || ''
  }));

  const mappedAnnouncements = (announcementsData || []).map(a => ({
    id: a.id,
    title: a.title,
    description: a.content,
    timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : ''
  }));

  const stats = statConfigs.map(s => {
    if (s.label === 'Upcoming Events') return { ...s, value: eventsData.length };
    if (s.label === 'Active Bookings') return { ...s, value: bookingsCount };
    return s;
  });

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="h-full">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
          Welcome back, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening in your community today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <GlassCard className="p-5">
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                    {loading ? (
                      <Skeleton className="h-7 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6" hover={false}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-orange-500" />
                  Recent Events
                </h2>
                <Link
                  to="/dashboard/events"
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
                >
                  View all <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))
                  : mappedEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center">
                          <HiCalendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.date} &bull; {event.venue}
                          </p>
                        </div>
                        <HiArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </motion.div>
                    ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="p-6" hover={false}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiSpeakerphone className="w-5 h-5 text-amber-500" />
                  Announcements
                </h2>
              </div>

              <div className="space-y-4">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))
                  : mappedAnnouncements.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {item.timestamp}
                        </p>
                      </motion.div>
                    ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8"
      >
        <GlassCard className="p-6" hover={false}>
          <div className="relative z-10">
            <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <HiLightningBolt className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/events">
                <Button className="flex items-center gap-2">
                  <HiCalendar className="w-4 h-4" />
                  Browse Events
                </Button>
              </Link>
              <Link to="/dashboard/membership">
                <Button variant="secondary" className="flex items-center gap-2">
                  <HiIdentification className="w-4 h-4" />
                  View Membership
                </Button>
              </Link>
              <Link to="/dashboard/profile">
                <Button variant="outline" className="flex items-center gap-2">
                  <HiArrowRight className="w-4 h-4" />
                  Update Profile
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
