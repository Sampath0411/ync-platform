import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiCheck } from 'react-icons/hi';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { validateEmail } from '@/utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    setLoading(true);
    try {
      const { default: api } = await import('@/api/client');
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition variant="fade">
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
        {/* Animated background */}
        <AnimatedBackground variant="aurora" intensity="low" zIndex={0} />

        <Link to="/" className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition-colors z-10">&larr; Back to home</Link>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-md">
          <GlassCard className="p-8 md:p-10">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/25">Y</div>
                <span className="text-2xl font-display font-bold gradient-text">YNC</span>
              </Link>
              <h1 className="text-2xl font-display font-bold text-white">{sent ? 'Check Your Email' : 'Reset Password'}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {sent ? 'If an account exists with that email, you\'ll receive reset instructions.' : 'Enter your email and we\'ll send you a reset link.'}
              </p>
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Email Address" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                  error={emailError} />
                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} iconRight={!loading ? HiMail : undefined}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <HiCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  If an account exists with <strong className="text-gray-300">{email}</strong>, you'll receive password reset instructions.
                </p>
                <Button variant="primary" onClick={() => setSent(false)}>Try Another Email</Button>
              </motion.div>
            )}

            <p className="text-center text-sm text-gray-400 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Sign in</Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
