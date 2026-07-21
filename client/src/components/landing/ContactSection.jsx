import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiMail, HiPhone, HiLocationMarker, HiPaperAirplane } from 'react-icons/hi';
import { FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SectionTitle from '@/components/ui/SectionTitle';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { contactAPI } from '@/api/client';

const contactInfo = [
  { icon: HiMail, label: 'Email', value: 'hello@ync.in', href: 'mailto:hello@ync.in' },
  { icon: HiPhone, label: 'Phone', value: '+91 9291493225', href: 'tel:+919291493225' },
  { icon: HiLocationMarker, label: 'Location', value: 'Visakhapatnam, India', href: null },
];

const socialLinks = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaYoutube, href: '#', label: 'YouTube' },
];

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await contactAPI.send({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      setError(err.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Get in Touch"
          subtitle="Have a question, idea, or just want to say hi? We would love to hear from you."
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((info) => (
              <GlassCard key={info.label} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                      {info.label}
                    </p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {info.value}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}

            {/* Social links */}
            <GlassCard className="p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-3">
                Follow Us
              </p>
              <div className="flex items-center gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center justify-center transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </GlassCard>

            {/* Map placeholder */}
            <GlassCard className="p-0 overflow-hidden h-40">
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <HiLocationMarker className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Map integration coming soon</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
                  >
                    Message sent! We'll get back to you soon.
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="grid sm:grid-cols-2 gap-5">
                  <Input
                    label="Your Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={errors.name}
                  />
                  <Input
                    label="Your Email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={errors.email}
                  />
                </div>

                <Input
                  label="Subject"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleChange('subject')}
                  error={errors.subject}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={handleChange('message')}
                    rows={5}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-200 ${
                      errors.message
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 dark:text-red-400">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  iconRight={HiPaperAirplane}
                  loading={loading}
                  fullWidth
                >
                  Send Message
                </Button>
              </form>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
