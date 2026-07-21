import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiCheck, HiArrowRight, HiStar } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const tiers = [
  {
    name: 'Trial',
    price: 'Free',
    period: '30 days',
    description: 'Get started and explore what YNC has to offer.',
    features: [
      'Access to community events',
      'Basic profile',
      'Join public discussions',
      'Monthly newsletter',
      '1 event registration',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    name: 'Active Member',
    price: '499',
    period: '/year',
    description: 'Full access to all YNC features and premium benefits.',
    features: [
      'All Trial features',
      'Unlimited event registrations',
      'Priority support',
      'Exclusive workshops & webinars',
      'Mentorship program access',
      'Member-only networking events',
      'Certificate of participation',
      'Early bird pricing on events',
    ],
    cta: 'Join Now',
    href: '/register',
    popular: true,
    gradient: 'from-orange-500 via-red-500 to-amber-500',
  },
];

export default function MembershipSection() {
  return (
    <section id="membership" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Membership Plans"
          subtitle="Choose the plan that fits your journey. Start free and upgrade as you grow."
        />

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-start">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/25">
                    <HiStar className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <GlassCard
                className={`p-8 ${tier.popular ? 'ring-2 ring-orange-500/50' : ''}`}
                hover={false}
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    {tier.price === 'Free' ? (
                      <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-sm text-gray-500 dark:text-gray-400">&#8377;</span>
                        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                          {tier.price}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{tier.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <HiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to={tier.href}>
                  <Button
                    variant={tier.popular ? 'primary' : 'outline'}
                    fullWidth
                    size="lg"
                    iconRight={HiArrowRight}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
