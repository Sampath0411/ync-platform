import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import Skeleton from '@/components/ui/Skeleton';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchSponsors = async () => {
      try {
        setLoading(true);
        setError(null);
        const { default: api } = await import('@/api/client');
        const res = await api.get('/sponsors');
        if (mounted) {
          const sorted = (res.data || []).sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          setSponsors(sorted);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load sponsors');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSponsors();
    return () => { mounted = false; };
  }, []);

  const renderSponsorLogo = (sponsor, index) => (
    <motion.div
      key={sponsor.id || sponsor.name}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.05 }}
      className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300"
    >
      {sponsor.website_url ? (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          title={sponsor.name}
        >
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="max-h-10 md:max-h-12 w-auto object-contain"
            loading="lazy"
          />
        </a>
      ) : (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="max-h-10 md:max-h-12 w-auto object-contain"
          loading="lazy"
        />
      )}
    </motion.div>
  );

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Our Partners"
          subtitle="Trusted by leading organizations across India."
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <Skeleton variant="text" count={1} className="!h-10 !w-32" />
              </div>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No sponsors yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center">
            {sponsors.map((sponsor, index) => renderSponsorLogo(sponsor, index))}
          </div>
        )}
      </div>
    </section>
  );
}
