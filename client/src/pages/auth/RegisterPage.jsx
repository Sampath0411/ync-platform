import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiArrowRight,
  HiArrowLeft,
  HiCamera,
  HiCheck,
} from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Personal' },
  { id: 3, label: 'Profile' },
];

const cities = [
  'Visakhapatnam', 'Hyderabad', 'Bangalore', 'Chennai', 'Mumbai',
  'Delhi', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Other',
];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 3);
}

const strengthConfig = {
  0: { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' },
  1: { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-500' },
  2: { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  3: { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    dob: '',
    gender: '',
    city: '',
    instagram: '',
    linkedin: '',
    twitter: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Validation for each step
  const validateStep1 = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile.replace(/\s/g, '')))
      newErrors.mobile = 'Enter a valid 10-digit number';
    if (!form.dob) newErrors.dob = 'Date of birth is required';
    if (!form.gender) newErrors.gender = 'Please select your gender';
    if (!form.city) newErrors.city = 'Please select your city';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    // Step 3 fields are optional, no mandatory validation
    return true;
  };

  const goNext = () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else valid = validateStep3();

    if (valid && step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    if (!validateStep3()) return;

    setApiError(null);
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
        dob: form.dob,
        gender: form.gender,
        city: form.city,
        photo,
        socialLinks: {
          instagram: form.instagram,
          linkedin: form.linkedin,
          twitter: form.twitter,
        },
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <PageTransition variant="fade">
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4 py-20">
        {/* Animated background */}
        <AnimatedBackground variant="mesh" intensity="medium" zIndex={0} />

        {/* Back to home */}
        <Link
          to="/"
          className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition-colors z-10"
        >
          &larr; Back to home
        </Link>

        {/* Register card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-lg"
        >
          <GlassCard className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold font-display text-sm shadow-lg shadow-orange-500/25">
                  Y
                </div>
                <span className="text-2xl font-display font-bold gradient-text">YNC</span>
              </Link>
              <h1 className="text-2xl font-display font-bold text-white">
                Create your account
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Join the community and start your journey
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-1 mb-8">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step > s.id
                        ? 'bg-emerald-500 text-white'
                        : step === s.id
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {step > s.id ? <HiCheck className="w-4 h-4" /> : s.id}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block transition-colors ${
                      step >= s.id
                        ? 'text-orange-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded transition-colors duration-300 ${
                        step > s.id ? 'bg-emerald-500' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
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

            {/* Form with animated steps */}
            <form onSubmit={handleSubmit} className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {/* Step 1: Account Details */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange('name')}
                      error={errors.name}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange('email')}
                      error={errors.email}
                    />

                    <div>
                      <Input
                        label="Password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={handleChange('password')}
                        error={errors.password}
                      />
                      {form.password && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                  i <= passwordStrength
                                    ? strengthConfig[passwordStrength].color
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span
                            className={`text-xs font-medium ${strengthConfig[passwordStrength].textColor}`}
                          >
                            {strengthConfig[passwordStrength].label}
                          </span>
                        </div>
                      )}
                    </div>

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      error={errors.confirmPassword}
                    />
                  </motion.div>
                )}

                {/* Step 2: Personal Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      onChange={handleChange('mobile')}
                      error={errors.mobile}
                    />

                    <Input
                      label="Date of Birth"
                      type="date"
                      value={form.dob}
                      onChange={handleChange('dob')}
                      error={errors.dob}
                    />

                    {/* Gender select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={handleChange('gender')}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-black/50 backdrop-blur-sm text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${
                          errors.gender
                            ? 'border-red-500'
                            : 'border-white/10'
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                      )}
                    </div>

                    {/* City select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        City
                      </label>
                      <select
                        value={form.city}
                        onChange={handleChange('city')}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-black/50 backdrop-blur-sm text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${
                          errors.city
                            ? 'border-red-500'
                            : 'border-white/10'
                        }`}
                      >
                        <option value="">Select your city</option>
                        {cities.map((city) => (
                          <option key={city} value={city.toLowerCase()}>
                            {city}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Profile & Social */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    {/* Profile photo upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer flex items-center justify-center overflow-hidden group"
                        >
                          {photoPreview ? (
                            <>
                              <img
                                src={photoPreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <HiCamera className="w-5 h-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                              <HiCamera className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Upload a profile photo
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            JPG, PNG or GIF. Max 5MB.
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors"
                          >
                            Choose file
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="pt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Social Links
                        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                          (optional)
                        </span>
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            instagram.com/
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            value={form.instagram}
                            onChange={handleChange('instagram')}
                            className="w-full pl-[120px] pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            linkedin.com/in/
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            value={form.linkedin}
                            onChange={handleChange('linkedin')}
                            className="w-full pl-[130px] pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            twitter.com/
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            value={form.twitter}
                            onChange={handleChange('twitter')}
                            className="w-full pl-[105px] pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={goBack}
                    iconLeft={HiArrowLeft}
                  >
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconRight={HiArrowRight}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    iconRight={HiCheck}
                  >
                    Create Account
                  </Button>
                )}
              </div>
            </form>

            {/* Sign in link */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
