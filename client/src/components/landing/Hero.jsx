import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { HiArrowDown, HiArrowRight } from 'react-icons/hi';
import { FiZap, FiUsers, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const stats = [
  { icon: FiUsers, label: 'Active Members', end: 2500, suffix: '+' },
  { icon: FiZap, label: 'Events Hosted', end: 150, suffix: '+' },
  { icon: FiGlobe, label: 'Cities', end: 50, suffix: '+' },
  { icon: FiTrendingUp, label: 'Partners', end: 10, suffix: '+' },
];

const floatingShapes = [
  { size: 80, x: '10%', y: '15%', color: 'from-orange-500/30 to-red-500/20', delay: 0, duration: 7 },
  { size: 50, x: '85%', y: '25%', color: 'from-red-500/30 to-amber-400/20', delay: 1, duration: 8 },
  { size: 100, x: '75%', y: '65%', color: 'from-amber-500/20 to-amber-400/10', delay: 2, duration: 9 },
  { size: 40, x: '20%', y: '70%', color: 'from-orange-500/20 to-red-400/10', delay: 0.5, duration: 6 },
  { size: 60, x: '92%', y: '8%', color: 'from-orange-400/20 to-amber-500/10', delay: 1.5, duration: 7.5 },
  { size: 35, x: '50%', y: '85%', color: 'from-amber-500/20 to-orange-400/10', delay: 2.5, duration: 6.5 },
];

const words = ['Tomorrow', 'Community', 'Leaders', 'Change'];

function CountUp({ end, suffix = '', duration = 2000 }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Hero() {
  const ref = useRef(null);

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Black base layer */}
      <div className="absolute inset-0 bg-black" />

      {/* Animated aurora/mesh gradient */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-[length:200%_200%] bg-gradient-to-br from-black via-orange-950/30 to-black"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(249, 115, 22, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 20%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)`,
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating gradient orbs — no rotation, just gentle drift */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${shape.color} blur-3xl pointer-events-none`}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 8, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: shape.duration + 2,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ember particles floating upward */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 1.5 + (i % 3) * 0.5,
            height: 1.5 + (i % 3) * 0.5,
            left: `${2 + (i * 6.4) % 96}%`,
            bottom: '-5%',
            background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#ef4444' : '#f59e0b',
            boxShadow: `0 0 ${3 + (i % 3)}px ${
              i % 3 === 0 ? 'rgba(249,115,22,0.8)' : i % 3 === 1 ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)'
            }`,
          }}
          animate={{
            y: [0, -(window.innerHeight * 0.6)],
            x: [0, (i % 5 - 2) * 15],
            opacity: [0, 0.6, 0.6, 0],
            scale: [1, 1.3, 1.1, 0.3],
          }}
          transition={{
            duration: 3 + (i * 0.3) % 3,
            repeat: Infinity,
            delay: (i * 0.4) % 3,
            ease: 'linear',
          }}
        />
      ))}

      {/* Animated grid overlay with pulsing dots */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(249,115,22,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${5 + (i * 8.3) % 90}%`,
              top: `${5 + (i * 9.7 + 3) % 90}%`,
              background: i % 2 === 0 ? 'rgba(249,115,22,0.6)' : 'rgba(239,68,68,0.5)',
              boxShadow: i % 2 === 0
                ? '0 0 6px rgba(249,115,22,0.4)'
                : '0 0 6px rgba(239,68,68,0.3)',
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 2 + (i * 0.2) % 2, repeat: Infinity, delay: (i * 0.15) % 2, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Main content — stays perfectly centered, no parallax */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-24 pb-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm mb-8 shadow-lg shadow-black/10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          Now accepting applications for 2026
        </motion.div>

        {/* Heading with animated word — cross-fade only, stays perfectly in line */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] mb-6"
        >
          <span className="text-white">Empowering Youth,</span>
          <br />
          <span className="text-white">Building </span>
          <span className="relative inline-block min-w-[200px] md:min-w-[300px] h-[1.1em] align-bottom">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[wordIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute left-0 inset-y-0 flex items-center bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent"
              >
                {words[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Join India's fastest growing youth network. Connect, learn, and grow
          with thousands of young leaders across the nation.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link
            to="/register"
            className="group relative inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-orange-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative">Join Community</span>
            <HiArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#events"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-white/80 hover:text-white rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 backdrop-blur-sm transition-all duration-300"
          >
            Explore Events
          </a>
        </motion.div>

        {/* Stats inline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 group hover:bg-white/10 transition-all duration-300"
            >
              <stat.icon className="w-5 h-5 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                <CountUp end={stat.end} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
          }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
          <HiArrowDown className="w-5 h-5" />
        </motion.a>
      </motion.div>
    </section>
  );
}
