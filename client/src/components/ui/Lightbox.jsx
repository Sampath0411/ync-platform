import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function Lightbox({ images = [], initialIndex = 0, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, images.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    },
    [isOpen, onClose, goToNext, goToPrev]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  /* Touch / swipe handlers */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (Math.abs(delta) > threshold) {
      if (delta > 0) goToPrev();
      else goToNext();
    }
    touchStartX.current = null;
  };

  const currentImage = images[currentIndex] || {};

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -400 : 400, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex flex-col bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Top bar — counter + close */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end p-4">
            <div className="flex items-center gap-3">
              {images.length > 1 && (
                <span className="text-white/70 text-sm font-medium px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors backdrop-blur-sm"
                aria-label="Close lightbox"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <HiChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <HiChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center p-4 pt-16 pb-24"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
                className="max-w-5xl w-full h-full flex items-center justify-center"
              >
                {currentImage.url ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.title || 'Gallery image'}
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full max-w-lg aspect-video rounded-2xl bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">No image available</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom info bar */}
          <div
            className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
          >
            <div className="max-w-2xl mx-auto text-center pointer-events-auto">
              {currentImage.title && (
                <h3 className="text-white font-semibold text-lg font-display">
                  {currentImage.title}
                </h3>
              )}
              {currentImage.description && (
                <p className="text-white/70 text-sm mt-1 max-w-xl mx-auto line-clamp-2">
                  {currentImage.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
