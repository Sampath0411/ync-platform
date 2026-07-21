import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiTrash } from 'react-icons/hi';
import { reviewsAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function UserReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await reviewsAPI.getMy();
      setReviews(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await reviewsAPI.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Loader variant="skeleton" count={3} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">My Reviews</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Reviews you've written for events</p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={<HiStar className="w-12 h-12" />}
          title="No reviews yet"
          description="After attending an event, you can leave a review"
          action={<Link to="/dashboard/my-events" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">My Events</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      {review.cover_image ? (
                        <img src={review.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold">
                          {review.event_name?.charAt(0) || 'E'}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link to={`/events/${review.event_id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-orange-400 transition-colors">
                        {review.event_name || 'Event'}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <HiStar key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(review.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                {review.review && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{review.review}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
