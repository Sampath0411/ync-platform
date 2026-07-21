import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus, HiPencil, HiTrash,
  HiSpeakerphone, HiGlobe, HiUserGroup,
  HiLightningBolt, HiInformationCircle, HiSearch,
} from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';
import { validateLength } from '@/utils/validation';

const typeConfig = {  news: { label: 'News', icon: HiInformationCircle, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  update: { label: 'Update', icon: HiGlobe, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  alert: { label: 'Alert', icon: HiLightningBolt, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  volunteer: { label: 'Volunteer', icon: HiUserGroup, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
};

const statusOptions = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const emptyForm = { title: '', content: '', type: 'news', status: 'published' };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/announcements');
      const data = res.data || res.announcements || [];
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load announcements');
      setAnnouncements([]);
    } finally { setLoading(false); }
  };

  const openCreateForm = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };

  const openEditForm = (item) => {
    setEditItem(item);
    setForm({ title: item.title || '', content: item.content || '', type: item.type || 'news', status: item.status || 'published' });
    setShowForm(true);
  };

  const handleSave = async () => {
    const errs = {};
    const titleErr = validateLength(form.title, 2, 200, 'Title');
    if (titleErr) errs.title = titleErr;
    const contentErr = validateLength(form.content, 1, 5000, 'Content');
    if (contentErr) errs.content = contentErr;
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      if (editItem) {
        await apiClient.put(`/announcements/${editItem.id}`, form);
        toast.success('Announcement updated');
      } else {
        await apiClient.post('/announcements', form);
        toast.success('Announcement created');
      }
      setShowForm(false); setEditItem(null); setForm(emptyForm);
      fetchAnnouncements();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiClient.delete(`/announcements/${deleteItem.id}`);
      toast.success('Announcement deleted');
      setDeleteItem(null);
      fetchAnnouncements();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchSearch = !search || (a.title || '').toLowerCase().includes(search.toLowerCase()) || (a.content || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage community announcements</p>
        </div>
        <Button onClick={openCreateForm} iconLeft={HiPlus}>New Announcement</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30">
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
        </select>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <EmptyState icon={HiSpeakerphone} title="No announcements" description="Create your first announcement to reach your community" actionLabel="Create Announcement" onAction={openCreateForm} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAnnouncements.map((item) => {
              const tc = typeConfig[item.type] || typeConfig.news;
              const TypeIcon = tc.icon;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <GlassCard hover={false} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}><TypeIcon className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'published' || item.is_published ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                              {item.status || (item.is_published ? 'published' : 'draft')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 sm:ml-4">
                        <button onClick={() => openEditForm(item)} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><HiPencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteItem(item)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Delete"><HiTrash className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Announcement' : 'New Announcement'} width="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined })); }} placeholder="Announcement title"
              className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.title ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} />
            {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
            <textarea value={form.content} onChange={(e) => { setForm({ ...form, content: e.target.value }); if (formErrors.content) setFormErrors(prev => ({ ...prev, content: undefined })); }} rows={5} placeholder="Write your announcement..."
              className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.content ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} />
            {formErrors.content && <p className="mt-1 text-xs text-red-500">{formErrors.content}</p>}
            {form.content && <p className="mt-1 text-xs text-gray-400 text-right">{form.content.length}/5000</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                {Object.entries(typeConfig).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status || 'published'} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Publish'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Announcement" width="sm">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
