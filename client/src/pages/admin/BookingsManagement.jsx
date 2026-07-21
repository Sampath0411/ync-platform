import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiTicket, HiSearch, HiFilter, HiDownload, HiEye,
  HiCheckCircle, HiXCircle, HiClock, HiRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import PageTransition from '../../components/ui/PageTransition';
import GlassCard from '../../components/ui/GlassCard';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const statusColors = {
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  checked_in: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (eventFilter !== 'all') params.event_id = eventFilter;
      const res = await apiClient.get('/admin/bookings', params);
      setBookings(res.bookings || res.data || []);
    } catch (err) {
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally { setLoading(false); }
  }, [currentPage, search, statusFilter, eventFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    const fetchEventsList = async () => {
      try {
        const res = await apiClient.get('/events', { limit: 100 });
        setEvents(res.data || []);
      } catch { setEvents([]); }
    };
    fetchEventsList();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      await apiClient.patch(`/admin/bookings/${bookingId}`, { status: 'cancelled' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch { toast.error('Failed to cancel booking'); }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await apiClient.patch(`/admin/bookings/${bookingId}`, { status: 'checked_in' });
      toast.success('Checked in successfully');
      fetchBookings();
    } catch { toast.error('Failed to check in'); }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.id || '').toLowerCase().includes(q) ||
      (b.user_name || b.user?.name || '').toLowerCase().includes(q) ||
      (b.event_name || b.event?.title || b.event?.name || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton variant="text" size="lg" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="text" size="md" className="w-full h-12" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Bookings Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all event bookings and ticket statuses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchBookings} iconLeft={HiRefresh}>Refresh</Button>
            <Button variant="outline" size="sm" iconLeft={HiDownload}>Export</Button>
          </div>
        </div>

        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by ID, user, or event..." className="flex-1" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30">
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="checked_in">Checked In</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30">
              <option value="all">All Events</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name || ev.title}</option>)}
            </select>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: HiTicket, color: 'from-orange-500 to-amber-500' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: HiCheckCircle, color: 'from-green-500 to-emerald-500' },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: HiClock, color: 'from-yellow-500 to-orange-500' },
            { label: 'Checked In', value: bookings.filter(b => b.status === 'checked_in').length, icon: HiEye, color: 'from-orange-500 to-red-500' },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}><stat.icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {paginatedBookings.length === 0 ? (
          <EmptyState icon={<HiTicket className="w-12 h-12" />} title="No bookings found" description="No bookings match your current filters." />
        ) : (
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Booking ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Event</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking, i) => (
                    <motion.tr key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{booking.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{booking.user_name || booking.user?.name}</p>
                        <p className="text-xs text-gray-500">{booking.user_email || booking.user?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{booking.event_name || booking.event?.title}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{new Date(booking.booking_date || booking.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[booking.status] || statusColors.pending}`}>
                          {booking.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedBooking(booking)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors" title="View details">
                            <HiEye className="w-4 h-4" />
                          </button>
                          {booking.status === 'confirmed' && (
                            <button onClick={() => handleCheckIn(booking.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Check in">
                              <HiCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <button onClick={() => handleCancelBooking(booking.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancel booking">
                              <HiXCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === i + 1 ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        )}

        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details" width="lg">
          {selectedBooking && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Booking ID</p><p className="font-mono text-sm text-gray-900 dark:text-white">{selectedBooking.id}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">User</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedBooking.user_name || selectedBooking.user?.name}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Event</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedBooking.event_name || selectedBooking.event?.title || selectedBooking.event_name}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Booking Date</p><p className="text-sm text-gray-900 dark:text-white">{new Date(selectedBooking.booking_date || selectedBooking.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Amount</p><p className="text-sm font-medium text-gray-900 dark:text-white">₹{selectedBooking.total_amount || selectedBooking.amount || 0}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p><p className="text-sm text-gray-900 dark:text-white">{selectedBooking.quantity || 1}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedBooking.status]}`}>{selectedBooking.status?.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>Close</Button>
                {selectedBooking.status === 'confirmed' && (
                  <Button variant="primary" size="sm" iconLeft={HiCheckCircle} onClick={() => { handleCheckIn(selectedBooking.id); setSelectedBooking(null); }}>Check In</Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
