import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { FiCalendar, FiMapPin, FiUsers, FiArrowRight } from 'react-icons/fi';

export default function MyEvents() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/bookings/my');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return b.status === 'confirmed' && b.event_status !== 'completed';
    if (filter === 'completed') return b.status === 'confirmed' && b.event_status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  if (loading) return <Loader variant="skeleton" count={3} className="max-w-4xl mx-auto" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">My Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your event bookings</p>
        </div>
        <Link to="/events" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">
          <FiCalendar className="w-4 h-4" /> Browse Events <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FiCalendar className="w-12 h-12" />}
          title="No events found" description={filter === 'all' ? "You haven't booked any events yet." : `No ${filter} events.`}
          action={<Link to="/events" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Browse Events</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                    {new Date(booking.event_date || Date.now()).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{booking.event_name || 'Event'}</h3>
                      <Badge variant={booking.status === 'cancelled' ? 'error' : booking.status === 'confirmed' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2"><FiCalendar className="w-3.5 h-3.5" />{new Date(booking.event_date || Date.now()).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2"><FiMapPin className="w-3.5 h-3.5" />{booking.venue || 'Venue TBD'}</div>
                      <div className="flex items-center gap-2"><FiUsers className="w-3.5 h-3.5" />{booking.quantity} ticket(s)</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
