import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiBell, HiPaperAirplane, HiUsers, HiUserGroup,
  HiUser, HiClock, HiCheckCircle, HiSearch,
} from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

const recipientOptions = [
  { value: 'all', label: 'All Users', icon: HiUsers },
  { value: 'members', label: 'Members Only', icon: HiUserGroup },
  { value: 'specific', label: 'Specific Users', icon: HiUser },
];

const notifTypes = [
  { value: 'general', label: 'General Announcement' },
  { value: 'event_reminder', label: 'Event Reminder' },
  { value: 'community_news', label: 'Community News' },
  { value: 'event_cancellation', label: 'Event Cancellation' },
  { value: 'event_update', label: 'Event Update' },
  { value: 'membership', label: 'Membership' },
  { value: 'system', label: 'System Notice' },
];

export default function AdminNotifications() {
  const [form, setForm] = useState({ type: 'general', title: '', message: '', recipients: 'all', specific_users: '' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/notifications');
      setHistory(res.data || res.notifications || []);
    } catch { setHistory([]); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required'); return; }
    if (form.recipients === 'specific' && !form.specific_users.trim()) { toast.error('Please enter user emails'); return; }
    setSending(true);
    try {
      await apiClient.post('/admin/notifications/send', {
        type: form.type, title: form.title, message: form.message,
        is_global: form.recipients === 'all', recipients: form.recipients,
        specific_users: form.recipients === 'specific' ? form.specific_users.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      });
      toast.success('Notification sent successfully!');
      setForm({ type: 'general', title: '', message: '', recipients: 'all', specific_users: '' });
      fetchHistory();
    } catch (err) { toast.error(err.message || 'Failed to send notification'); }
    finally { setSending(false); }
  };

  const filteredHistory = history.filter((n) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (n.title || '').toLowerCase().includes(s) || (n.message || '').toLowerCase().includes(s);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'event_reminder': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'event_cancellation': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'membership': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'system': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'community_news': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Send push notifications to community members</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-5">Send New Notification</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                {notifTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipients</label>
              <select value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                {recipientOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {form.recipients === 'specific' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Emails (comma separated)</label>
              <input value={form.specific_users} onChange={(e) => setForm({ ...form, specific_users: e.target.value })} placeholder="user1@example.com, user2@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Write your notification message..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSend} loading={sending}><HiPaperAirplane className="w-4 h-4 mr-2" />Send Notification</Button>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">Sent History</h2>
          <div className="relative w-full sm:w-72">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon={HiBell} title="No notifications sent yet" description="Use the form above to send your first notification" />
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((notif, index) => (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <GlassCard hover={false} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <HiBell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{notif.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeBadgeColor(notif.type)}`}>
                            {notifTypes.find(t => t.value === notif.type)?.label || notif.type}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <HiUsers className="w-3 h-3" />
                            {notif.is_global ? 'All Users' : 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><HiCheckCircle className="w-3.5 h-3.5" />Sent</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><HiClock className="w-3 h-3" />{formatDate(notif.created_at)}</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
