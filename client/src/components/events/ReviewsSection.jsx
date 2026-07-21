import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiStar, HiTrash } from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { reviewsAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <HiStar
            className={`${starSize} ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ eventId, compact = false }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState({ rating: 5, review: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) fetchReviews();
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      const res = await reviewsAPI.getByEvent(eventId);
      setReviews(res.data?.reviews || []);
      setStats(res.data?.stats || null);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { toast.error('Please login to review'); return; }
    setSubmitting(true);
    try {
      await reviewsAPI.create({ event_id: eventId, rating: myReview.rating, review: myReview.review });
      toast.success('Review submitted!');
      setMyReview({ rating: 5, review: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reviewsAPI.delete(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  if (loading) return null;

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
        Reviews {stats?.count ? `(${stats.count})` : ''}
      </h2>

      {/* Stats summary */}
      {stats && stats.count > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(stats.average || 0).toFixed(1)}
            </div>
            <StarRating value={Math.round(stats.average || 0)} readonly size="sm" />
            <div className="text-xs text-gray-500 mt-1">{stats.count} reviews</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = stats[['one', 'two', 'three', 'four', 'five'][n - 1]] || 0;
              const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-3">{n}</span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review */}
      {isAuthenticated && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Write a Review</h3>
          <div className="mb-2">
            <StarRating value={myReview.rating} onChange={(r) => setMyReview({ ...myReview, rating: r })} />
          </div>
          <textarea
            value={myReview.review}
            onChange={(e) => setMyReview({ ...myReview, review: e.target.value })}
            placeholder="Share your experience (optional)"
            maxLength={2000}
            rows={compact ? 2 : 3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{myReview.review.length}/2000</span>
            <Button size="sm" onClick={handleSubmit} loading={submitting}>Submit Review</Button>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className={`space-y-3 ${compact ? 'max-h-60 overflow-y-auto' : ''}`}>
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {review.user_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    {(user?.id || user?._id) && review.user_id === user.id && (
                      <button onClick={() => handleDelete(review.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {review.review && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.review}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export { StarRating };
