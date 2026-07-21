import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { FiBell, FiCheck, FiCheckCircle, FiInfo, FiAlertCircle, FiCalendar, FiAward, FiXCircle } from 'react-icons/fi';

const typeConfig = {
  event_reminder: { icon: FiCalendar, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
  membership_approval: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
  membership_rejection: { icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
  event_cancellation: { icon: FiAlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
  event_update: { icon: FiCalendar, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
  community_news: { icon: FiInfo, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
  general: { icon: FiAward, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      const { default: api } = await import('@/api/client');
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      const { default: api } = await import('@/api/client');
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { console.error(err); }
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) return <Loader variant="skeleton" count={5} className="max-w-3xl mx-auto" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with community news</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors">
            <FiCheckCircle className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>{f} {f === 'unread' && `(${notifications.filter(n => !n.is_read).length})`}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FiBell className="w-12 h-12" />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.general;
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className={`p-4 cursor-pointer transition-all hover:shadow-md ${!notif.is_read ? 'border-l-4 border-l-orange-500' : ''}`}
                  onClick={() => !notif.is_read && markRead(notif.id)}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm ${notif.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white font-semibold'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notif.created_at)}</span>
                      </div>
                      <p className={`text-sm mt-1 ${notif.is_read ? 'text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>{notif.message}</p>
                      {!notif.is_read && (
                        <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                          className="flex items-center gap-1 text-xs text-orange-500 mt-2 hover:underline">
                          <FiCheck className="w-3 h-3" /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
