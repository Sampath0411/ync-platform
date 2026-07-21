import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, addMonths, subMonths,
} from 'date-fns';
import { HiChevronLeft, HiChevronRight, HiCalendar, HiLocationMarker } from 'react-icons/hi';
import { eventsAPI } from '@/api/client';
import PageTransition from '@/components/ui/PageTransition';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.getAll({});
      setEvents(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const eventDates = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (e.event_date) {
        const key = format(parseISO(e.event_date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    return map;
  }, [events]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const d = [];
    let day = startDate;
    while (day <= endDate) {
      d.push(day);
      day = addDays(day, 1);
    }
    return d;
  }, [currentMonth]);

  const selectedEvents = selectedDate ? eventDates[format(selectedDate, 'yyyy-MM-dd')] || [] : [];

  return (
    <PageTransition>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/events" className="text-sm text-orange-500 hover:text-orange-400 mb-2 inline-block">&larr; All Events</Link>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Events Calendar</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <HiChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <HiChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const hasEvents = !!eventDates[key];
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`relative p-2 text-sm transition-all min-h-[2.5rem] ${
                        !isSameMonth(day, currentMonth) ? 'text-gray-500/40' :
                        isSelected ? 'bg-orange-500 text-white font-semibold rounded-lg' :
                        isToday ? 'text-orange-500 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'
                      }`}
                    >
                      {format(day, 'd')}
                      {hasEvents && (
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-orange-500'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected date events */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {selectedDate ? 'No events on this day' : 'Click a date to see events'}
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(event => (
                    <Link key={event.id} to={`/events/${event.id}`}
                      className="block p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.name}</p>
                      {event.venue && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <HiLocationMarker className="w-3 h-3" />{event.venue}
                        </p>
                      )}
                      {event.start_time && (
                        <p className="text-xs text-gray-400 mt-1">{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}
