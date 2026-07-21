import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiDuplicate,
  HiCalendar,
  HiX,
  HiSearch,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { eventsAPI } from '@/api/client';
import { validateLength, validateNonNegative, validatePositiveInt, validateDate } from '@/utils/validation';

const statusColors = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  upcoming: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  ongoing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const categories = ['Tech', 'Sports', 'Cultural', 'Social', 'Education', 'Workshop', 'Seminar', 'Other'];

const emptyForm = {
  name: '', description: '', cover_image: '', event_date: '', start_time: '', end_time: '',
  venue: '', google_maps_link: '', organizer_name: '', category: 'Tech',
  max_capacity: '', price: '0', member_discount: '0', non_member_price: '0',
  rules: '', highlights: '', contact_info: '', status: 'draft',
};

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    const nameErr = validateLength(form.name, 2, 200, 'Event name');
    if (nameErr) errs.name = nameErr;
    const dateErr = validateDate(form.event_date, 'Event date');
    if (dateErr) errs.event_date = dateErr;
    if (!form.category) errs.category = 'Category is required';
    if (form.max_capacity !== '') {
      const capErr = validatePositiveInt(form.max_capacity, 'Capacity');
      if (capErr) errs.max_capacity = capErr;
    }
    if (form.price !== '') {
      const priceErr = validateNonNegative(form.price, 'Price');
      if (priceErr) errs.price = priceErr;
    }
    if (form.non_member_price !== '') {
      const nmPriceErr = validateNonNegative(form.non_member_price, 'Non-member price');
      if (nmPriceErr) errs.non_member_price = nmPriceErr;
    }
    if (form.member_discount !== '') {
      const discErr = validateNonNegative(form.member_discount, 'Member discount');
      if (discErr) errs.member_discount = discErr;
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => { fetchEvents(); }, [search, filterStatus]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await eventsAPI.getAll(params);
      const data = res || {};
      setEvents(data.data || data.events || []);
    } catch (error) {
      toast.error('Failed to load events');
      setEvents([]);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name, description: form.description, cover_image: form.cover_image || null,
        event_date: form.event_date, start_time: form.start_time || null, end_time: form.end_time || null,
        venue: form.venue || null, google_maps_link: form.google_maps_link || null,
        organizer_name: form.organizer_name || null, category: form.category || null,
        max_capacity: parseInt(form.max_capacity) || 0, price: parseFloat(form.price) || 0,
        member_discount: parseFloat(form.member_discount) || 0, non_member_price: parseFloat(form.non_member_price) || 0,
        registration_deadline: form.registration_deadline || null, rules: form.rules || null,
        highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
        contact_info: form.contact_info ? { phone: form.contact_info } : {},
        status: form.status || 'draft',
      };

      if (editingEvent) {
        await eventsAPI.update(editingEvent.id || editingEvent._id, payload);
        toast.success('Event updated');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event created');
      }
      setShowForm(false); setEditingEvent(null); setForm(emptyForm);
      fetchEvents();
    } catch (error) {
      toast.error(editingEvent ? 'Failed to update event' : 'Failed to create event');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setForm({
      name: event.name || '', description: event.description || '', cover_image: event.cover_image || '',
      event_date: event.event_date ? event.event_date.split('T')[0] : '', start_time: event.start_time || '', end_time: event.end_time || '',
      venue: event.venue || '', google_maps_link: event.google_maps_link || '', organizer_name: event.organizer_name || '',
      category: event.category || 'Tech', max_capacity: event.max_capacity?.toString() || '',
      price: event.price?.toString() || '0', member_discount: event.member_discount?.toString() || '0', non_member_price: event.non_member_price?.toString() || '0',
      rules: event.rules || '', highlights: Array.isArray(event.highlights) ? event.highlights.join('\n') : event.highlights || '',
      contact_info: event.contact_info ? (typeof event.contact_info === 'string' ? JSON.parse(event.contact_info) : event.contact_info).phone || '' : '',
      status: event.status || 'draft',
    });
    setShowForm(true);
  };

  const handleDuplicate = (event) => {
    setEditingEvent(null);
    setForm({ ...emptyForm, name: `${event.name} (Copy)`, description: event.description || '', category: event.category || 'Tech', max_capacity: event.max_capacity?.toString() || '', venue: event.venue || '', organizer_name: event.organizer_name || '' });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsAPI.delete(eventId);
      toast.success('Event deleted');
      fetchEvents();
    } catch (error) { toast.error('Failed to delete event'); }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await eventsAPI.update(eventId, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      fetchEvents();
    } catch (error) { toast.error('Failed to update status'); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage events</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingEvent(null); setForm(emptyForm); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all">
          <HiPlus className="w-4 h-4" /> Create Event
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <HiCalendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {events.map((event) => (
                  <tr key={event.id || event._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 dark:text-white">{event.name || event.title}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(event.event_date || event.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">{event.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {event.max_capacity ? `${event.max_capacity - (event.available_seats || 0)}/${event.max_capacity}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select value={event.status} onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[event.status] || statusColors.draft}`}>
                        <option value="draft">Draft</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(event)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors" title="Edit"><HiPencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicate(event)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" title="Duplicate"><HiDuplicate className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(event.id || event._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete"><HiTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><HiX className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Event Name *</label>
                  <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border ${formErrors.name ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} placeholder="Event name" />
                  {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" placeholder="Describe the event..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date *</label>
                    <input type="date" value={form.event_date} onChange={(e) => { setForm({ ...form, event_date: e.target.value }); if (formErrors.event_date) setFormErrors(prev => ({ ...prev, event_date: undefined })); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border ${formErrors.event_date ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} />
                    {formErrors.event_date && <p className="mt-1 text-xs text-red-500">{formErrors.event_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
                    <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
                    <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Venue</label>
                    <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" placeholder="Event venue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Organizer</label>
                    <input type="text" value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" placeholder="Organizer name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                    <select value={form.category} onChange={(e) => { setForm({ ...form, category: e.target.value }); if (formErrors.category) setFormErrors(prev => ({ ...prev, category: undefined })); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border ${formErrors.category ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`}>
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {formErrors.category && <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Capacity</label>
                    <input type="number" value={form.max_capacity} onChange={(e) => { setForm({ ...form, max_capacity: e.target.value }); if (formErrors.max_capacity) setFormErrors(prev => ({ ...prev, max_capacity: undefined })); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border ${formErrors.max_capacity ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} placeholder="Max attendees" />
                    {formErrors.max_capacity && <p className="mt-1 text-xs text-red-500">{formErrors.max_capacity}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Member Price (INR)</label>
                    <input type="number" value={form.price} onChange={(e) => { setForm({ ...form, price: e.target.value }); if (formErrors.price) setFormErrors(prev => ({ ...prev, price: undefined })); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border ${formErrors.price ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`} placeholder="0 for free" />
                    {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Non-Member Price</label>
                    <input type="number" value={form.non_member_price} onChange={(e) => setForm({ ...form, non_member_price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" placeholder="Non-member price" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Member Discount</label>
                    <input type="number" value={form.member_discount} onChange={(e) => setForm({ ...form, member_discount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" placeholder="Discount amount" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rules (one per line)</label>
                  <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" placeholder="Enter rules, one per line..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Highlights (one per line)</label>
                  <textarea value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" placeholder="Event highlights, one per line..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </form>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 transition-all">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
