import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiCalendar, HiClock, HiLocationMarker, HiUser,
  HiPhone, HiMail, HiArrowLeft, HiCheck, HiX, HiPhotograph, HiTicket,
} from 'react-icons/hi';
import PageTransition from '@/components/ui/PageTransition';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { eventsAPI, bookingsAPI, waitlistAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import FavoriteButton from '@/components/events/FavoriteButton';
import SocialShare from '@/components/events/SocialShare';
import ReviewsSection from '@/components/events/ReviewsSection';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await eventsAPI.getById(id);
      setEvent(res.data);
    } catch (err) {
      setError(err.data?.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) { toast.error('Please login to join waitlist'); navigate('/login'); return; }
    setJoiningWaitlist(true);
    try {
      await waitlistAPI.join(id, { quantity: 1 });
      toast.success('Added to waitlist!');
      setOnWaitlist(true);
    } catch (err) {
      toast.error(err.message || 'Failed to join waitlist');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this event');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const res = await bookingsAPI.create({ event_id: id, quantity: 1 });
      if (res.data) {
        toast.success('Booking confirmed!');
        navigate(`/dashboard/bookings/${res.data.booking?.id}/ticket`);
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to book event');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <Skeleton className="!rounded-2xl !h-72 w-full" />
            <Skeleton count={5} />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !event) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-24">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <HiX className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'The event does not exist or has been removed.'}</p>
            <Link to="/"><Button variant="primary" iconLeft={HiArrowLeft}>Back to Home</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const coverImages = [];
  if (event.cover_image) coverImages.push(event.cover_image);
  if (event.gallery_images) {
    try {
      const gallery = typeof event.gallery_images === 'string' ? JSON.parse(event.gallery_images) : event.gallery_images;
      gallery.forEach(img => { if (img && !coverImages.includes(img)) coverImages.push(img); });
    } catch (e) { /* ignore */ }
  }
  if (coverImages.length === 0) coverImages.push('');

  const eventName = event.name || 'Event';
  const eventDate = event.event_date || '';
  const startTime = event.start_time || '';
  const endTime = event.end_time || '';
  const venue = event.venue || 'Venue TBD';
  const organizerName = event.organizer_name || 'YNC Team';
  const availableSeats = event.available_seats || 0;
  const maxCapacity = event.max_capacity || 0;
  const seatsPercent = maxCapacity > 0 ? Math.round(((maxCapacity - availableSeats) / maxCapacity) * 100) : 0;

  let highlights = [];
  try { highlights = typeof event.highlights === 'string' ? JSON.parse(event.highlights) : (event.highlights || []); } catch (e) { highlights = []; }

  let rules = [];
  try { rules = typeof event.rules === 'string' ? JSON.parse(event.rules) : (event.rules || []); } catch (e) { rules = event.rules ? [event.rules] : []; }

  let contactInfo = {};
  try { contactInfo = typeof event.contact_info === 'string' ? JSON.parse(event.contact_info) : (event.contact_info || {}); } catch (e) { contactInfo = {}; }

  const memberPrice = event.price || 0;
  const nonMemberPrice = event.non_member_price || event.price || 0;
  const deadline = event.registration_deadline || '';

  return (
    <PageTransition variant="fade">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard/events"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6">
            <HiArrowLeft className="w-4 h-4" />
            Back to events
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero image */}
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
                {coverImages[selectedImage] ? (
                  <img src={coverImages[selectedImage]} alt={eventName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/30">{eventName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Badge variant={event.status === 'published' ? 'success' : event.status === 'draft' ? 'warning' : 'error'}>
                    {event.status || 'draft'}
                  </Badge>
                  {event.category && <Badge variant="primary" size="sm">{event.category}</Badge>}
                </div>
              </div>

              {/* Thumbnail carousel */}
              {coverImages.length > 1 && (
                <div className="flex gap-2">
                  {coverImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      {img ? <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center"><HiPhotograph className="w-5 h-5 text-gray-400" /></div>}
                    </button>
                  ))}
                </div>
              )}

              {/* Event info */}
              <GlassCard className="p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">{eventName}</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-start gap-2.5">
                    <HiCalendar className="w-4 h-4 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <HiClock className="w-4 h-4 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{startTime || 'All day'}{endTime ? ` - ${endTime}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <HiLocationMarker className="w-4 h-4 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Venue</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{venue}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <HiUser className="w-4 h-4 text-primary-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Organizer</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{organizerName}</p>
                    </div>
                  </div>
                </div>

                {eventDate && <CountdownTimer targetDate={eventDate} className="justify-start mb-6" />}

                {/* Description */}
                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-3">About This Event</h2>
                    <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line text-sm">{event.description}</div>
                  </div>
                )}

                {/* Highlights */}
                {highlights.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-3">Highlights</h2>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                          <HiCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rules */}
                {rules.length > 0 && (
                  <div>
                    <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-3">Event Rules</h2>
                    <ul className="space-y-2">
                      {rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />{rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>

              {/* Location */}
              {event.google_maps_link && (
                <GlassCard className="p-6">
                  <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-3">Location</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{venue}</p>
                  <a href={event.google_maps_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 text-sm font-medium">
                    <HiLocationMarker className="w-4 h-4" />View on Google Maps
                  </a>
                </GlassCard>
              )}

              {/* Reviews */}
              <ReviewsSection eventId={id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <GlassCard className="p-6 sticky top-24">
                <div className="text-center mb-6">
                  <Badge variant={availableSeats > 0 ? 'success' : 'error'} size="md" dot>
                    {availableSeats > 0 ? `${availableSeats} seats left` : 'Sold out'}
                  </Badge>
                </div>

                {availableSeats > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Availability</span>
                      <span className="text-gray-900 dark:text-white font-medium">{100 - seatsPercent}% filled</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all" style={{ width: `${seatsPercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Member Price</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{memberPrice === 0 ? 'Free' : `₹${memberPrice}`}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Non-Member</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{nonMemberPrice}</span>
                  </div>
                </div>

                {availableSeats > 0 ? (
                  <Button variant="primary" size="lg" fullWidth loading={registering} onClick={handleRegister} iconLeft={HiTicket}>
                    Book Now
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" fullWidth loading={joiningWaitlist} onClick={handleJoinWaitlist} disabled={onWaitlist}>
                    {onWaitlist ? 'On Waitlist' : 'Join Waitlist'}
                  </Button>
                )}
                <div className="flex gap-2 mt-3">
                  <FavoriteButton eventId={id} className="flex-1" />
                  <SocialShare title={eventName} url={window.location.href} className="flex-1" />
                </div>

                {deadline && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    Registration closes {new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  </p>
                )}

                {/* Contact info */}
                {(contactInfo.email || contactInfo.phone) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Contact</p>
                    {contactInfo.email && (
                      <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400 mb-1">
                        <HiMail className="w-3.5 h-3.5" /> {contactInfo.email}
                      </a>
                    )}
                    {contactInfo.phone && (
                      <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400">
                        <HiPhone className="w-3.5 h-3.5" /> {contactInfo.phone}
                      </a>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
