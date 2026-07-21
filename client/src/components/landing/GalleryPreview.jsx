import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiX } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import Skeleton from '@/components/ui/Skeleton';
import { galleryAPI } from '@/api/client';

function distributeIntoColumns(items, columnCount = 3) {
  const cols = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    cols[index % columnCount].push(item);
  });
  return cols;
}

export default function GalleryPreview() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await galleryAPI.getAll();
        if (mounted) {
          setGalleryItems(res.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load gallery');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGallery();
    return () => { mounted = false; };
  }, []);

  const masonryCols = distributeIntoColumns(galleryItems, 3);

  return (
    <section id="gallery" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Gallery"
          subtitle="Moments captured from our events and community gatherings."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-4">
                {[1, 2].map((row) => (
                  <Skeleton
                    key={row}
                    variant="image"
                    size="md"
                    className={`!rounded-2xl ${row % 2 === 0 ? '!h-48' : '!h-64'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No gallery images yet.</p>
          </div>
        ) : (
          <>
            {/* Masonry grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {masonryCols.map((col, colIdx) => (
                <div key={colIdx} className="space-y-4">
                  {col.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: image.id * 0.1 }}
                      className="relative group cursor-pointer rounded-2xl overflow-hidden"
                      onClick={() => setLightbox(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.title || 'Gallery image'}
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        style={{ aspectRatio: image.id % 2 === 0 ? '4/3' : '3/4' }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            View Photo
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>

            {/* View all link */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <a
                href="#"
                className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium hover:gap-3 transition-all"
              >
                View Full Gallery
                <HiArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              key={lightbox.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.url}
                alt={lightbox.title || 'Gallery image'}
                className="w-full h-full object-contain rounded-2xl"
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <HiX className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
