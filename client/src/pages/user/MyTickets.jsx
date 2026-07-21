import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { FiDownload, FiEye, FiCalendar, FiMapPin } from 'react-icons/fi';
import { HiTicket } from 'react-icons/hi';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/tickets/my');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter(t => filter === 'all' || t.status === filter);

  if (loading) return <Loader variant="skeleton" count={4} className="max-w-4xl mx-auto" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">My Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View and download your event tickets</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'used', 'expired', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<HiTicket className="w-12 h-12" />}
          title="No tickets found" description="Book an event to get your tickets here." />
      ) : (
        <div className="space-y-4 max-w-3xl">
          {filtered.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center flex-shrink-0">
                      <HiTicket className="w-7 h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.event_name || 'Event Ticket'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">#{ticket.ticket_number || ticket.id?.slice(0, 8)}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{ticket.event_date ? new Date(ticket.event_date).toLocaleDateString() : 'Date TBD'}</span>
                        <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{ticket.venue || 'Venue TBD'}</span>
                      </div>
                      <div className="mt-2">
                        <Badge variant={ticket.status === 'active' ? 'success' : ticket.status === 'used' ? 'info' : ticket.status === 'expired' ? 'warning' : 'error'}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button onClick={() => setSelectedTicket(ticket)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-500 transition-all">
                      <FiEye className="w-5 h-5" />
                    </button>
                    <button onClick={() => downloadTicket(ticket)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-500 transition-all">
                      <FiDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <div className="text-center p-6">
            <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 mb-4 flex items-center justify-center border-2 border-dashed border-orange-200">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🎟️</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">QR Code</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTicket.event_name || 'Event Ticket'}</h3>
            <p className="text-sm text-gray-500 mt-1">Ticket: #{selectedTicket.ticket_number || selectedTicket.id?.slice(0, 8)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTicket.event_date ? new Date(selectedTicket.event_date).toLocaleDateString() : 'TBD'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500">Status</p>
                <Badge variant={selectedTicket.status === 'active' ? 'success' : 'warning'}>{selectedTicket.status}</Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

function downloadTicket(ticket) {
  const content = `YNC TICKET\nEvent: ${ticket.event_name || 'Event'}\nTicket: ${ticket.ticket_number || ticket.id}\nDate: ${ticket.event_date ? new Date(ticket.event_date).toLocaleDateString() : 'TBD'}\nStatus: ${ticket.status}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${ticket.ticket_number || ticket.id?.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
