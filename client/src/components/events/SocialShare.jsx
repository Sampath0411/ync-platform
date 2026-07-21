import { useState } from 'react';
import { HiShare, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SocialShare({ title, url, description, className = '' }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = description ? `${title}\n\n${description}` : title;

  const handleShare = async () => {
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'YNC Event',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        // Fall through to clipboard fallback
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
      } ${className}`}
      title="Share this event"
    >
      {copied ? <HiCheck className="w-4 h-4" /> : <HiShare className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
