import { useState, useEffect } from 'react';
import { HiHeart } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesAPI } from '@/api/client';
import toast from 'react-hot-toast';

export default function FavoriteButton({ eventId, className = '', size = 'md' }) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && eventId) {
      checkFavorite();
    }
  }, [eventId, isAuthenticated]);

  const checkFavorite = async () => {
    try {
      const res = await favoritesAPI.check(eventId);
      setIsFavorited(res.data?.is_favorited || false);
    } catch { /* ignore */ }
  };

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      return;
    }
    setLoading(true);
    try {
      if (isFavorited) {
        await favoritesAPI.remove(eventId);
        setIsFavorited(false);
      } else {
        await favoritesAPI.add(eventId);
        setIsFavorited(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all duration-200 ${
        isFavorited
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
      } ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <HiHeart className={`${iconSize} ${isFavorited ? 'fill-current' : ''}`} />
    </button>
  );
}
