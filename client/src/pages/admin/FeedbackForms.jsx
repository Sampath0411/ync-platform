import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiDocumentText, HiPlus, HiEye, HiTrash, HiX } from 'react-icons/hi';
import { feedbackAPI, eventsAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function FeedbackForms() {
  const [forms, setForms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showResponses, setShowResponses] = useState(null);
  const [responses, setResponses] = useState([]);
  const [formData, setFormData] = useState({ event_id: '', title: '', description: '', questions: [{ question: '', type: 'text' }] });

  useEffect(() => {
    Promise.all([
      feedbackAPI.getAllForms(),
      eventsAPI.getAll({}),
    ]).then(([f, e]) => {
      setForms(f.data || []);
      setEvents(e.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!formData.event_id || !formData.title) { toast.error('Event and title required'); return; }
    const validQuestions = formData.questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) { toast.error('At least one question required'); return; }

    try {
      const res = await feedbackAPI.createForm({
        event_id: formData.event_id,
        title: formData.title,
        description: formData.description,
        questions: validQuestions,
      });
      setForms(prev => [res.data, ...prev]);
      setShowCreate(false);
      setFormData({ event_id: '', title: '', description: '', questions: [{ question: '', type: 'text' }] });
      toast.success('Feedback form created');
    } catch (err) {
      toast.error(err.message || 'Failed to create form');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback form?')) return;
    try {
      await feedbackAPI.deleteForm(id);
      setForms(prev => prev.filter(f => f.id !== id));
      toast.success('Form deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const viewResponses = async (id) => {
    try {
      const res = await feedbackAPI.getResponses(id);
      setShowResponses(res.data.form);
      setResponses(res.data.responses || []);
    } catch { toast.error('Failed to load responses'); }
  };

  const addQuestion = () => {
    setFormData(prev => ({ ...prev, questions: [...prev.questions, { question: '', type: 'text' }] }));
  };

  const removeQuestion = (idx) => {
    setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx, field, value) => {
    setFormData(prev => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Feedback Forms</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage event feedback forms</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><HiPlus className="w-4 h-4 mr-2" />New Form</Button>
      </div>

      {forms.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <HiDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No feedback forms yet</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <GlassCard key={form.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{form.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{form.event_name || 'Event'}</p>
                </div>
                <Badge variant={form.is_active ? 'success' : 'warning'}>{form.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span>{form.response_count || 0} response(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => viewResponses(form.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors">
                  <HiEye className="w-3.5 h-3.5" /> View Responses
                </button>
                <button onClick={() => handleDelete(form.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <div className="p-6 space-y-4 max-w-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Feedback Form</h3>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event</label>
            <select value={formData.event_id} onChange={e => setFormData({ ...formData, event_id: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500">
              <option value="">Select event</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions</label>
              <button onClick={addQuestion} className="text-xs text-orange-500 hover:text-orange-400">+ Add question</button>
            </div>
            <div className="space-y-2">
              {formData.questions.map((q, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)}
                    placeholder={`Question ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
                  <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                    <option value="text">Text</option>
                    <option value="rating">Rating</option>
                    <option value="yesno">Yes/No</option>
                  </select>
                  {formData.questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} className="p-2 text-gray-400 hover:text-red-400"><HiX className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Form</Button>
          </div>
        </div>
      </Modal>

      {/* Responses modal */}
      <Modal isOpen={!!showResponses} onClose={() => setShowResponses(null)}>
        <div className="p-6 space-y-4 max-w-lg max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {showResponses?.title || 'Responses'}
            </h3>
            <button onClick={() => setShowResponses(null)} className="text-gray-400 hover:text-white"><HiX className="w-5 h-5" /></button>
          </div>

          {responses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No responses yet</p>
          ) : (
            <div className="space-y-4">
              {responses.map((r, i) => (
                <div key={r.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 mb-2">{r.user_name || 'Anonymous'} - {new Date(r.submitted_at).toLocaleDateString()}</p>
                  <div className="space-y-2">
                    {(r.answers || []).map((ans, j) => (
                      <div key={j}>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Q{j + 1}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{typeof ans === 'object' ? JSON.stringify(ans) : String(ans)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
