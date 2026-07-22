import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, firebaseLogin } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError(null);
    setGoogleLoading(true);
    try {
      await firebaseLogin();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  };

  return (
    <PageTransition variant="fade">
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
        {/* Animated background */}
        <AnimatedBackground variant="aurora" intensity="medium" zIndex={0} />

        {/* Back to home */}
        <Link
          to="/"
          className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition-colors z-10"
        >
          &larr; Back to home
        </Link>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-8 md:p-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/25">
                  Y
                </div>
                <span className="text-2xl font-display font-bold gradient-text">YNC</span>
              </Link>
              <h1 className="text-2xl font-display font-bold text-white">
                Welcome back
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Sign in to your account
              </p>
            </div>

            {/* API Error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm"
              >
                {apiError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
              />

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500/30 bg-black/50"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                iconRight={!loading ? HiArrowRight : undefined}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              loading={googleLoading}
              onClick={handleGoogleSignIn}
            >
              <span className="flex items-center justify-center gap-3">
                <FaGoogle className="w-4 h-4" />
                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black/60 backdrop-blur-sm px-3 text-gray-500">
                  or
                </span>
              </div>
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-orange-400 font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </GlassCard>

          {/* Admin login */}
          <div className="text-center mt-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <HiShieldCheck className="w-3.5 h-3.5" />
              Admin Login
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
