import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch, HiCalendar, HiLocationMarker, HiCurrencyRupee, HiUsers, HiViewGrid, HiViewList, HiFilter, HiClock } from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import { eventsAPI } from '@/api/client';

const categories = ['All', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Tech', 'Leadership'];

const EVENTS_PER_PAGE = 6;

function getDaysLeft(dateStr) {
  const eventDate = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll({ status: 'upcoming,published' });
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, dateFrom, dateTo]);

  const filteredEvents = events.filter((event) => {
    const eventName = event.name || event.title || '';
    const eventVenue = event.venue || '';
    const eventDate = event.event_date || event.date || '';

    const matchesSearch =
      eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eventVenue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || event.category === selectedCategory;

    const matchesDateFrom = !dateFrom || eventDate >= dateFrom;
    const matchesDateTo = !dateTo || eventDate <= dateTo;

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * EVENTS_PER_PAGE,
    page * EVENTS_PER_PAGE
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="h-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Events</h1>
        <p className="text-gray-400">Discover and register for upcoming events</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <Input
            type="text"
            placeholder="Search events by name or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 w-full bg-white/5 border-white/10 text-white placeholder-gray-500 rounded-xl"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Date Range & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <HiFilter className="text-gray-400" />
            <span className="text-gray-400 text-sm">Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <HiViewGrid className="text-xl" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              aria-label="List view"
            >
              <HiViewList className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className={`grid gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <HiSearch className="text-3xl text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
          <p className="text-gray-400 max-w-md">
            Try adjusting your search or filter criteria to find events that match your interests.
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setDateFrom('');
              setDateTo('');
            }}
            className="mt-6"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Event Cards Grid */}
      {!loading && filteredEvents.length > 0 && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}
          >
            {paginatedEvents.map((event) => {
              const eventName = event.name || event.title || '';
              const eventDate = event.event_date || event.date || '';
              const eventImage = event.cover_image || event.image || '';
              const availableSeats = event.available_seats ?? event.seatsAvailable ?? 0;
              const maxCapacity = event.max_capacity ?? event.totalSeats ?? 0;
              const eventPrice = event.price ?? 0;
              const daysLeft = getDaysLeft(eventDate);
              const seatPercentage = maxCapacity > 0 ? ((maxCapacity - availableSeats) / maxCapacity) * 100 : 0;

              return (
                <motion.div key={event.id || event._id} variants={itemVariants}>
                  <Link to={`/events/${event.id || event._id}`}>
                    <GlassCard className={`overflow-hidden group hover:border-orange-500/50 transition-all duration-300 ${
                      viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
                    }`}>
                      {/* Event Image */}
                      <div className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'sm:w-64 h-48 sm:h-auto' : 'h-48'
                      }`}>
                        {eventImage ? (
                          <img
                            src={eventImage}
                            alt={eventName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white/50">{eventName.charAt(0) || 'E'}</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge variant="primary">{event.category || 'Event'}</Badge>
                        </div>
                        {daysLeft > 0 && daysLeft <= 30 && (
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <HiClock className="text-orange-400" />
                            {daysLeft} days left
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="p-4 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-1">
                          {eventName}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <HiCalendar className="text-orange-400 flex-shrink-0" />
                            <span>{new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <HiLocationMarker className="text-orange-400 flex-shrink-0" />
                            <span className="line-clamp-1">{event.venue || 'Venue TBD'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1">
                            <HiCurrencyRupee className="text-orange-400" />
                            <span className="text-white font-semibold">
                              {eventPrice === 0 ? 'Free for members' : `₹${eventPrice}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <HiUsers className="text-gray-400" />
                            <span className={`${availableSeats <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
                              {availableSeats} seats left
                            </span>
                          </div>
                        </div>

                        {/* Seat Fill Bar */}
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                seatPercentage > 90 ? 'bg-red-500' : seatPercentage > 70 ? 'bg-amber-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${seatPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
