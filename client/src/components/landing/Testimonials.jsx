import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiStar, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import GlassCard from '@/components/ui/GlassCard';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError(null);
        const { default: api } = await import('@/api/client');
        const res = await api.get('/testimonials');
        if (mounted) {
          setTestimonials(res.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load testimonials');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTestimonials();
    return () => { mounted = false; };
  }, []);

  // Auto-rotate every 5 seconds, pause on hover
  useEffect(() => {
    if (isPaused || testimonials.length === 0) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  const next = useCallback(() => {
    if (testimonials.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    if (testimonials.length === 0) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="What Members Say"
          subtitle="Hear from the people who make YNC special."
        />

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-orange-500 hover:text-orange-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton variant="avatar" size="lg" className="!w-20 !h-20" />
              <Skeleton variant="text" count={1} className="!h-4 !w-32" />
              <Skeleton variant="text" count={3} className="!h-4" />
            </div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No testimonials yet.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto relative">
            {/* Navigation buttons */}
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              aria-label="Previous testimonial"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              aria-label="Next testimonial"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel */}
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <GlassCard className="p-8 md:p-10 text-center">
                    <Avatar
                      src={testimonials[current].user_profile_photo}
                      name={testimonials[current].user_name}
                      size="xl"
                      className="mx-auto mb-4"
                    />
                    <div className="flex items-center justify-center gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonials[current].rating
                              ? 'text-amber-400'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <blockquote className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 italic">
                      &ldquo;{testimonials[current].content}&rdquo;
                    </blockquote>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonials[current].user_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonials[current].role || 'Community Member'}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot navigation */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === current
                      ? 'w-8 h-2 bg-orange-500'
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
