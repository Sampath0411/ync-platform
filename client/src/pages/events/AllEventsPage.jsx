import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch, HiCalendar, HiLocationMarker, HiChevronRight } from 'react-icons/hi';
import { eventsAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import FavoriteButton from '@/components/events/FavoriteButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const CATEGORIES = ['All', 'Workshop', 'Seminar', 'Conference', 'Cultural', 'Sports', 'Tech', 'Music', 'Art', 'Networking', 'Other'];

export default function AllEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('date');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll({ status: 'upcoming' });
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...events];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q));
    }
    if (category !== 'All') result = result.filter(e => e.category === category);
    if (sort === 'date') result.sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));
    if (sort === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sort === 'seats') result.sort((a, b) => (b.available_seats || 0) - (a.available_seats || 0));
    return result;
  }, [events, search, category, sort]);

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">All Events</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Discover and book upcoming events</p>
            </div>
            <Link to="/events/calendar"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors">
              <HiCalendar className="w-4 h-4" /> Calendar View
            </Link>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500">
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="seats">Sort by Availability</option>
            </select>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === c ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>{c}</button>
            ))}
          </div>

          {/* Events grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="!h-64 !rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HiCalendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No events found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/events/${event.id}`}>
                    <GlassCard className="group overflow-hidden hover:ring-1 hover:ring-orange-500/30 transition-all duration-300">
                      <div className="relative h-40 overflow-hidden">
                        {event.cover_image ? (
                          <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white/30">{event.name?.charAt(0) || 'E'}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-2 right-2">
                          <FavoriteButton eventId={event.id} size="sm" />
                        </div>
                        <div className="absolute bottom-2 left-2 flex gap-1.5">
                          <Badge variant="primary" size="sm">{event.category || 'Event'}</Badge>
                          {event.available_seats <= 5 && event.available_seats > 0 && (
                            <Badge variant="warning" size="sm">{event.available_seats} left</Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-400 transition-colors truncate">{event.name}</h3>
                        <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <HiCalendar className="w-3.5 h-3.5" />
                            {event.event_date ? new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1.5">
                              <HiLocationMarker className="w-3.5 h-3.5" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-sm font-bold text-orange-500">
                            {event.price === 0 ? 'Free' : `₹${event.price}`}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium">
                            View <HiChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}
