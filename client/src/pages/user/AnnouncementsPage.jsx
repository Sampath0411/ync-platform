import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { FiCalendar, FiAlertTriangle, FiSpeaker } from 'react-icons/fi';

const typeConfig = {
  news: { label: 'News', color: 'info', icon: FiSpeaker },
  update: { label: 'Update', color: 'primary', icon: FiCalendar },
  volunteer: { label: 'Volunteer', color: 'success', icon: FiSpeaker },
  notice: { label: 'Notice', color: 'warning', icon: FiAlertTriangle },
};

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? announcements : announcements.filter(a => a.type === filter);

  if (loading) return <Loader variant="skeleton" count={4} className="max-w-3xl mx-auto" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Announcements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Latest news and updates from YNC</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'news', 'update', 'volunteer', 'notice'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FiSpeaker className="w-12 h-12" />} title="No announcements" description="Check back later for updates." />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, i) => {
            const config = typeConfig[item.type] || typeConfig.news;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-5">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <config.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={config.color}>{config.label}</Badge>
                          {item.priority && item.priority !== 'low' && (
                            <span className={`flex items-center gap-1 text-xs ${priorityColors[item.priority] || 'text-gray-400'}`}>
                              <FiAlertTriangle className="w-3 h-3" /> {item.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">{item.content}</p>
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
