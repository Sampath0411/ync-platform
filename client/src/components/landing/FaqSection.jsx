import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiSearch } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import Skeleton from '@/components/ui/Skeleton';

const faqCategories = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'membership', label: 'Membership' },
  { id: 'events', label: 'Events' },
];

export default function FaqSection() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqs, setOpenFaqs] = useState(new Set());

  useEffect(() => {
    let mounted = true;

    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);
        const { default: api } = await import('@/api/client');
        const res = await api.get('/faqs');
        if (mounted) {
          const sorted = (res.data || []).sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          setFaqs(sorted);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load FAQs');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFaqs();
    return () => { mounted = false; };
  }, []);

  const toggleFaq = (id) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Frequently Asked Questions"
          subtitle="Got questions? We have answers."
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
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <Skeleton variant="text" count={1} className="!h-5 !w-3/4" />
              </div>
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No FAQs available yet.</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-8">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* FAQ items */}
            <AnimatePresence mode="wait">
              {filteredFaqs.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 dark:text-gray-400 py-12"
                >
                  No matching questions found.
                </motion.p>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqs.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-all duration-200"
                      >
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
                            {faq.question}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            <HiChevronDown className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Contact link */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Still have questions?{' '}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-orange-600 dark:text-orange-400 font-medium hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
