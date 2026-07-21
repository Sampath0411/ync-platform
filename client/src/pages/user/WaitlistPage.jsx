import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiClock, HiCalendar, HiLocationMarker, HiX } from 'react-icons/hi';
import { waitlistAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function WaitlistPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null);

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    try {
      const res = await waitlistAPI.getMy();
      setEntries(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleLeave = async (id) => {
    setLeaving(id);
    try {
      await waitlistAPI.leave(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Removed from waitlist');
    } catch { toast.error('Failed to leave waitlist'); } finally { setLeaving(null); }
  };

  if (loading) return <Loader variant="skeleton" count={3} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Waitlist</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Events you're waiting to get into</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={<HiClock className="w-12 h-12" />}
          title="No waitlist entries"
          description="When an event is full, you can join the waitlist"
          action={<Link to="/events" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Browse Events</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.filter(e => e.status === 'waiting').map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    {entry.cover_image ? (
                      <img src={entry.cover_image} alt={entry.event_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                        {entry.event_name?.charAt(0) || 'E'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/events/${entry.event_id}`} className="font-semibold text-gray-900 dark:text-white hover:text-orange-400 transition-colors truncate block">
                      {entry.event_name || 'Event'}
                    </Link>
                    <div className="mt-1.5 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <HiCalendar className="w-3.5 h-3.5" />
                        {entry.event_date ? new Date(entry.event_date).toLocaleDateString() : 'TBD'}
                      </div>
                      {entry.venue && (
                        <div className="flex items-center gap-1.5">
                          <HiLocationMarker className="w-3.5 h-3.5" />
                          <span className="truncate">{entry.venue}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="warning">{entry.quantity} ticket(s)</Badge>
                      <button onClick={() => handleLeave(entry.id)} disabled={leaving === entry.id}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                        <HiX className="w-3.5 h-3.5" /> {leaving === entry.id ? 'Leaving...' : 'Leave'}
                      </button>
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
