import { motion } from 'framer-motion';
import { HiHeart, HiLightningBolt, HiGlobe, HiAcademicCap, HiUsers, HiSparkles } from 'react-icons/hi';
import SectionTitle from '@/components/ui/SectionTitle';
import GlassCard from '@/components/ui/GlassCard';

const values = [
  { icon: HiHeart, title: 'Community First', description: 'Building meaningful connections that last beyond events.' },
  { icon: HiLightningBolt, title: 'Innovation', description: 'Embracing new ideas and creative solutions to drive change.' },
  { icon: HiGlobe, title: 'Global Mindset', description: 'Thinking locally while acting globally for maximum impact.' },
  { icon: HiAcademicCap, title: 'Continuous Learning', description: 'Fostering a culture of growth, skill development, and knowledge sharing.' },
  { icon: HiUsers, title: 'Inclusive Growth', description: 'Creating opportunities for every young person to thrive.' },
  { icon: HiSparkles, title: 'Excellence', description: 'Striving for the highest standards in everything we do.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="About YNC"
          subtitle="We're on a mission to empower every young person in India to discover their potential, build meaningful connections, and create lasting impact."
        />

        {/* Mission & Vision cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                <HiLightningBolt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
                Our Mission
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                To create a vibrant ecosystem where young Indians can connect, learn, and grow together.
                We provide the platform, tools, and community for the next generation of leaders to
                make their mark on the world.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mb-4">
                <HiGlobe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
                Our Vision
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                A future where every young person in India has access to a supportive community,
                mentorship opportunities, and the resources they need to turn their ambitions
                into achievements.
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Values grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {values.map((value) => (
            <motion.div key={value.title} variants={itemVariants}>
              <GlassCard className="p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-3">
                  <value.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
