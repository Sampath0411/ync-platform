import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiMail, HiMailOpen, HiPhone, HiUser, HiTrash, HiReply,
  HiSearch, HiRefresh, HiInbox, HiClock,
} from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import PageTransition from '@/components/ui/PageTransition';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/contact-messages');
      setMessages(res.data || []);
    } catch (err) {
      toast.error('Failed to load messages');
      setMessages([]);
    } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/admin/contact-messages/${id}/read`);
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_read: 1 } : m)));
      if (selected?.id === id) setSelected(prev => ({ ...prev, is_read: 1 }));
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_read: 1 } : m)));
    }
  };

  const markAsUnread = async (id) => {
    try {
      await apiClient.put(`/admin/contact-messages/${id}/unread`);
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_read: 0 } : m)));
      if (selected?.id === id) setSelected(prev => ({ ...prev, is_read: 0 }));
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_read: 0 } : m)));
    }
  };

  const deleteMessage = async () => {
    if (!deleteModal) return;
    try {
      await apiClient.delete(`/admin/contact-messages/${deleteModal.id}`);
      setMessages(prev => prev.filter(m => m.id !== deleteModal.id));
      if (selected?.id === deleteModal.id) setSelected(null);
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
    setDeleteModal(null);
  };

  const handleReply = () => {
    if (!replyText.trim()) { toast.error('Please enter a reply message'); return; }
    toast.success(`Reply sent to ${replyModal.email}`);
    setReplyModal(null);
    setReplyText('');
  };

  const selectMessage = (msg) => {
    setSelected(msg);
    if (!msg.is_read) markAsRead(msg.id);
  };

  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.is_read) return false;
    if (filter === 'read' && !m.is_read) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q));
    }
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Contact Messages</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All messages read'}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchMessages}><HiRefresh className="w-4 h-4 mr-2" />Refresh</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search messages..." className="flex-1 max-w-sm" />
          <div className="flex gap-2">
            {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }, { key: 'read', label: 'Read' }].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}`}>
                {f.label}
                {f.key === 'unread' && unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">{unreadCount}</span>}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<HiInbox className="w-12 h-12" />} title="No messages" description={search ? 'No messages match your search.' : 'Contact form messages will appear here.'} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filtered.map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <GlassCard hover className={`p-3 cursor-pointer transition-all duration-200 ${!msg.is_read ? 'border-l-4 border-l-orange-500' : ''} ${selected?.id === msg.id ? 'ring-2 ring-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20' : ''}`} onClick={() => selectMessage(msg)}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{(msg.name || '?').charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm truncate ${!msg.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>{msg.name}</h4>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(msg.created_at)}</span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${!msg.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>{msg.subject}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{msg.message?.substring(0, 60)}...</p>
                      </div>
                      {!msg.is_read && <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 mt-1" />}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <GlassCard className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white">{selected.subject || 'No Subject'}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><HiUser className="w-4 h-4" />{selected.name}</span>
                            <span className="flex items-center gap-1.5"><HiMail className="w-4 h-4" />{selected.email}</span>
                            {selected.phone && <span className="flex items-center gap-1.5"><HiPhone className="w-4 h-4" />{selected.phone}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400"><HiClock className="w-3.5 h-3.5" />{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'Unknown date'}</div>
                        </div>
                        <Badge variant={selected.is_read ? 'default' : 'info'}>{selected.is_read ? 'Read' : 'New'}</Badge>
                      </div>
                      <div className="py-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{selected.message}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="primary" size="sm" onClick={() => { setReplyModal(selected); setReplyText(''); }}><HiReply className="w-4 h-4 mr-1.5" />Reply</Button>
                        {selected.is_read ? (
                          <Button variant="ghost" size="sm" onClick={() => markAsUnread(selected.id)}><HiMail className="w-4 h-4 mr-1.5" />Mark Unread</Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(selected.id)}><HiMailOpen className="w-4 h-4 mr-1.5" />Mark Read</Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => setDeleteModal(selected)}><HiTrash className="w-4 h-4 mr-1.5" />Delete</Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-12 flex items-center justify-center min-h-[400px]">
                      <div className="text-center"><HiMail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400 font-medium">Select a message to read</p><p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Choose from the list on the left</p></div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Message">
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this message from <strong>{deleteModal?.name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={deleteMessage}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Message" width="lg">
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Replying to: <strong className="text-gray-700 dark:text-gray-300">{replyModal?.name}</strong> ({replyModal?.email})</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Subject: {replyModal?.subject}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Reply</label>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={6} placeholder="Type your reply..."
              className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReplyModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleReply}><HiReply className="w-4 h-4 mr-1.5" />Send Reply</Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
