import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Hero from '@/components/landing/Hero';
import AboutSection from '@/components/landing/AboutSection';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import MembershipSection from '@/components/landing/MembershipSection';
import Testimonials from '@/components/landing/Testimonials';
import Sponsors from '@/components/landing/Sponsors';
import GalleryPreview from '@/components/landing/GalleryPreview';
import FaqSection from '@/components/landing/FaqSection';
import ContactSection from '@/components/landing/ContactSection';

function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 z-[60] origin-left"
      style={{ scaleX: progress }}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="relative bg-black">
      {/* Animated background behind everything */}
      <AnimatedBackground variant="hero" intensity="high" zIndex={0} />

      <PageTransition variant="fade">
        <ProgressBar />
        <Hero />
        <AboutSection />
        <UpcomingEvents />
        <MembershipSection />
        <Testimonials />
        <Sponsors />
        <GalleryPreview />
        <FaqSection />
        <ContactSection />
      </PageTransition>
    </div>
  );
}
