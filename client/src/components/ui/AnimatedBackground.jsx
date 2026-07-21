import { useMemo } from 'react';
import { motion } from 'framer-motion';

const variants = {
  orbs: 'orbs',
  ember: 'ember',
  aurora: 'aurora',
  mesh: 'mesh',
  particles: 'particles',
  hero: 'hero',
  subtle: 'subtle',
};

export default function AnimatedBackground({
  variant = 'subtle',
  className = '',
  intensity = 'medium',
  zIndex = 0,
  withOverlay = true,
  children,
}) {
  const intensityClass = {
    low: 'opacity-30',
    medium: 'opacity-60',
    high: 'opacity-90',
  }[intensity] || 'opacity-60';

  // Generate random positions for floating elements — stable across renders
  const floatingElements = useMemo(() => {
    if (variant !== 'orbs' && variant !== 'hero') return [];
    const count = variant === 'hero' ? 8 : 5;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: variant === 'hero'
        ? [120, 180, 80, 250, 100, 60, 150, 90][i]
        : [100, 150, 70, 200, 80][i],
      x: `${10 + (i * 13) % 80}%`,
      y: `${10 + (i * 17 + 5) % 80}%`,
      duration: 12 + (i * 1.5) % 8,
      delay: i * 0.8,
      colors: [
        'from-orange-500/20 to-red-500/10',
        'from-red-500/20 to-amber-400/10',
        'from-amber-500/15 to-amber-400/8',
        'from-orange-400/15 to-red-400/10',
        'from-orange-600/10 to-amber-500/8',
        'from-red-500/15 to-rose-500/8',
        'from-amber-400/12 to-orange-500/10',
        'from-orange-500/20 to-amber-500/12',
      ][i % 8],
      blur: variant === 'hero' ? 'blur-3xl' : 'blur-2xl',
    }));
  }, [variant]);

  // Generate ember particles for the fire-ember variant
  const emberParticles = useMemo(() => {
    if (variant !== 'ember' && variant !== 'hero') return [];
    const count = variant === 'hero' ? 20 : 12;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${2 + (i * 5.2) % 96}%`,
      size: 1.5 + (i % 3) * 0.5,
      duration: 2 + (i * 0.4) % 3,
      delay: (i * 0.3) % 3,
      opacity: 0.4 + (i % 3) * 0.2,
    }));
  }, [variant]);

  // Generate aurora bands
  const auroraBands = useMemo(() => {
    if (variant !== 'aurora' && variant !== 'hero') return [];
    const count = variant === 'hero' ? 4 : 3;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: `${20 + i * 18}%`,
      left: `${10 + i * 8}%`,
      width: `${60 + i * 15}%`,
      height: `${25 + i * 5}%`,
      colors: [
        'from-orange-500/10 via-red-500/8 to-transparent',
        'from-red-500/8 via-amber-500/6 to-transparent',
        'from-amber-500/6 via-orange-500/5 to-transparent',
        'from-orange-400/8 via-red-400/6 to-transparent',
      ][i % 4],
      duration: 12 + i * 2,
      delay: i * 1.5,
    }));
  }, [variant]);

  // Generate grid particles
  const gridParticles = useMemo(() => {
    if (variant !== 'particles' && variant !== 'hero') return [];
    if (variant === 'hero') {
      return Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: `${5 + (i * 6.5) % 90}%`,
        y: `${5 + (i * 8.3 + 3) % 90}%`,
        delay: (i * 0.2) % 3,
        size: 2 + (i % 3),
      }));
    }
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: `${5 + (i * 8) % 90}%`,
      y: `${5 + (i * 10 + 2) % 90}%`,
      delay: (i * 0.25) % 3,
      size: 2 + (i % 2),
    }));
  }, [variant]);

  const baseClasses = 'fixed inset-0 pointer-events-none overflow-hidden';

  return (
    <div className={`${baseClasses} ${className}`} style={{ zIndex }}>
      {/* Base black layer */}
      <div className="absolute inset-0 bg-black" />

      {/* ---- Variant: Aurora ---- */}
      {(variant === 'aurora' || variant === 'hero') && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          {auroraBands.map((band) => (
            <motion.div
              key={`aurora-${band.id}`}
              className={`absolute bg-gradient-to-r ${band.colors} rounded-full`}
              style={{
                top: band.top,
                left: band.left,
                width: band.width,
                height: band.height,
                filter: 'blur(60px)',
              }}
              animate={{
                x: [0, 30, -20, 15, 0],
                y: [0, -15, 10, -5, 0],
                scale: [1, 1.05, 0.95, 1.02, 1],
              }}
              transition={{
                duration: band.duration,
                repeat: Infinity,
                delay: band.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ---- Variant: Mesh ---- */}
      {(variant === 'mesh' || variant === 'hero') && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 20% 30%, rgba(249, 115, 22, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 60% 70%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 40% 80%, rgba(249, 115, 22, 0.08) 0%, transparent 50%)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '5% 3%', '-3% -2%', '2% -3%', '0% 0%'],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* ---- Variant: Floating Orbs ---- */}
      {(variant === 'orbs' || variant === 'hero' || variant === 'ember') && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          {floatingElements.map((orb) => (
            <motion.div
              key={`orb-${orb.id}`}
              className={`absolute rounded-full bg-gradient-to-br ${orb.colors} ${orb.blur}`}
              style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
              animate={{
                y: [0, -30, 15, -10, 0],
                x: [0, 20, -15, 10, 0],
                scale: [1, 1.15, 0.95, 1.08, 1],
              }}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                delay: orb.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ---- Variant: Ember / Fire Particles ---- */}
      {(variant === 'ember' || variant === 'hero') && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          {emberParticles.map((particle) => (
            <motion.div
              key={`ember-${particle.id}`}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                left: particle.left,
                bottom: '-5%',
                background: particle.id % 3 === 0
                  ? 'rgb(249, 115, 22)'
                  : particle.id % 3 === 1
                    ? 'rgb(239, 68, 68)'
                    : 'rgb(245, 158, 11)',
                boxShadow: `0 0 4px ${
                  particle.id % 3 === 0
                    ? 'rgba(249, 115, 22, 0.8)'
                    : particle.id % 3 === 1
                      ? 'rgba(239, 68, 68, 0.8)'
                      : 'rgba(245, 158, 11, 0.8)'
                }`,
              }}
              animate={{
                y: [0, -window.innerHeight * 0.8],
                x: [0, (particle.id % 5 - 2) * 20],
                opacity: [0, particle.opacity, particle.opacity, 0],
                scale: [1, 1.2, 1.1, 0.5],
              }}
              transition={{
                duration: particle.duration + 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* ---- Variant: Grid Particles ---- */}
      {(variant === 'particles' || variant === 'hero') && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Glowing dots at intersections */}
          {gridParticles.map((dot) => (
            <motion.div
              key={`grid-dot-${dot.id}`}
              className="absolute rounded-full"
              style={{
                width: dot.size,
                height: dot.size,
                left: dot.x,
                top: dot.y,
                background: dot.id % 2 === 0
                  ? 'rgba(249, 115, 22, 0.6)'
                  : 'rgba(239, 68, 68, 0.5)',
                boxShadow: dot.id % 2 === 0
                  ? '0 0 6px rgba(249, 115, 22, 0.4)'
                  : '0 0 6px rgba(239, 68, 68, 0.3)',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: dot.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ---- Subtle variant: just a gentle gradient ---- */}
      {variant === 'subtle' && (
        <div className={`absolute inset-0 ${intensityClass}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-black via-orange-950/10 to-black" />
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.05) 0%, transparent 50%)',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Overlay gradient at bottom (for readability of content) */}
      {withOverlay && (
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />
      )}

      {/* Everything above this is behind the content — this makes the container only a background */}
      {children}
    </div>
  );
}

export { variants as backgroundVariants };
