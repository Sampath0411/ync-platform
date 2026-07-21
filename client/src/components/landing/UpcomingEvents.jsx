import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowRight, HiCalendar } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { eventsAPI } from '@/api/client';

const categoryColors = {
  Leadership: 'primary',
  Tech: 'primary',
  Arts: 'warning',
  Workshop: 'primary',
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await eventsAPI.getAll({ status: 'published' });
        if (mounted) {
          setEvents(res.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load events');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
    return () => { mounted = false; };
  }, []);

  const seatsLeftPercent = (available, total) => Math.round((available / total) * 100);

  return (
    <section id="events" className="relative py-24 md:py-32 overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Upcoming Events"
          subtitle="Join us at our next event and be part of something extraordinary."
        />

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-orange-500 hover:text-orange-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton variant="image" size="md" className="!h-48 !rounded-2xl" />
                <Skeleton variant="text" count={3} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={HiCalendar}
            title="No upcoming events"
            description="Check back soon for new events!"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/events/${event.id}`}>
                  <GlassCard className="group overflow-hidden h-full" hover>
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.cover_image}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge variant={categoryColors[event.category] || 'default'} size="sm">
                          {event.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {event.name}
                      </h3>

                      <CountdownTimer targetDate={event.event_date} className="justify-start" />

                      {/* Seats indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {event.available_seats} seats left
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            {event.max_capacity} total
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${seatsLeftPercent(event.available_seats, event.max_capacity)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* View all link */}
        {!loading && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium hover:gap-3 transition-all"
            >
              View All Events
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
