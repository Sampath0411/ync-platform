import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHeart, HiCalendar, HiLocationMarker, HiTrash } from 'react-icons/hi';
import { favoritesAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => { fetchFavorites(); }, []);

  const fetchFavorites = async () => {
    try {
      const res = await favoritesAPI.getAll();
      setFavorites(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleRemove = async (eventId) => {
    setRemoving(eventId);
    try {
      await favoritesAPI.remove(eventId);
      setFavorites(prev => prev.filter(f => f.id !== eventId));
      toast.success('Removed from favorites');
    } catch { toast.error('Failed to remove'); } finally { setRemoving(null); }
  };

  if (loading) return <Loader variant="skeleton" count={3} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Favorites</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Events you've saved</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState icon={<HiHeart className="w-12 h-12" />}
          title="No favorites yet"
          description="Browse events and click the heart icon to save them"
          action={<Link to="/events" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Browse Events</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((event, i) => (
            <motion.div key={event.fav_id || event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                        {event.name?.charAt(0) || 'E'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/events/${event.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-orange-400 transition-colors truncate block">
                      {event.name || 'Event'}
                    </Link>
                    <div className="mt-1.5 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <HiCalendar className="w-3.5 h-3.5" />
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-1.5">
                          <HiLocationMarker className="w-3.5 h-3.5" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Link to={`/events/${event.id}`}
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors">
                        View Event
                      </Link>
                      <button onClick={() => handleRemove(event.id)} disabled={removing === event.id}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors">
                        {removing === event.id ? '...' : <><HiTrash className="w-3 h-3 inline" /> Remove</>}
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
