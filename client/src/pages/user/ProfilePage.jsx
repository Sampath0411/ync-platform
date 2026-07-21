import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiCamera, FiSave, FiLock,
} from 'react-icons/fi';
import {
  validateName, validateMobile, validateDateOfBirth,
  validatePassword, validateConfirmPassword,
} from '@/utils/validation';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', city: '', date_of_birth: '', gender: '',
    social_instagram: '', social_linkedin: '', social_twitter: '',
  });

  const [errors, setErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    old_password: '', new_password: '', confirm_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const { default: api } = await import('@/api/client');
      const res = await api.upload('/auth/photo', formData);
      if (res.data?.profile_photo) updateUser({ profile_photo: res.data.profile_photo });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        city: user.city || '',
        date_of_birth: user.date_of_birth?.split('T')[0] || '',
        gender: user.gender || '',
        social_instagram: user.social_links?.instagram || '',
        social_linkedin: user.social_links?.linkedin || '',
        social_twitter: user.social_links?.twitter || '',
      });
    }
  }, [user]);

  const validateProfileForm = () => {
    const newErrors = {};
    const nameErr = validateName(form.name);
    if (nameErr) newErrors.name = nameErr;
    const mobileErr = validateMobile(form.mobile);
    if (mobileErr) newErrors.mobile = mobileErr;
    const dobErr = validateDateOfBirth(form.date_of_birth);
    if (dobErr) newErrors.date_of_birth = dobErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfileForm()) return;
    setSaving(true);
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.put('/auth/profile', {
        name: form.name, mobile: form.mobile, city: form.city,
        date_of_birth: form.date_of_birth, gender: form.gender,
        social_links: { instagram: form.social_instagram, linkedin: form.social_linkedin, twitter: form.social_twitter },
      });
      if (res.data) updateUser(res.data);
      toast.success('Profile updated successfully');
      setErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    const pwErr = validatePassword(passwordForm.new_password, 8);
    if (pwErr) newErrors.new_password = pwErr;
    const confirmErr = validateConfirmPassword(passwordForm.new_password, passwordForm.confirm_password);
    if (confirmErr) newErrors.confirm_password = confirmErr;
    if (!passwordForm.old_password) newErrors.old_password = 'Current password is required';
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    setSavingPassword(true);
    try {
      const { default: api } = await import('@/api/client');
      await api.put('/auth/password', { old_password: passwordForm.old_password, new_password: passwordForm.new_password });
      toast.success('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setPasswordErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'password', label: 'Security', icon: FiLock },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <GlassCard className="p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="relative group cursor-pointer" onClick={() => !uploadingPhoto && fileInputRef.current?.click()}>
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-2xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingPhoto ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCamera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{form.name || 'Your Name'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{form.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
              error={errors.name} />
            <Input label="Email" value={form.email} disabled />
            <Input label="Mobile" value={form.mobile}
              onChange={e => { setForm({ ...form, mobile: e.target.value }); if (errors.mobile) setErrors(prev => ({ ...prev, mobile: undefined })); }}
              error={errors.mobile} />
            <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="Date of Birth" type="date" value={form.date_of_birth}
              onChange={e => { setForm({ ...form, date_of_birth: e.target.value }); if (errors.date_of_birth) setErrors(prev => ({ ...prev, date_of_birth: undefined })); }}
              error={errors.date_of_birth} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Social Links (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="Instagram" value={form.social_instagram} onChange={e => setForm({ ...form, social_instagram: e.target.value })} placeholder="@username" />
              <Input label="LinkedIn" value={form.social_linkedin} onChange={e => setForm({ ...form, social_linkedin: e.target.value })} placeholder="URL" />
              <Input label="Twitter/X" value={form.social_twitter} onChange={e => setForm({ ...form, social_twitter: e.target.value })} placeholder="URL" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} loading={saving}><FiSave className="w-4 h-4 mr-2" />Save Changes</Button>
          </div>
        </GlassCard>
      )}

      {activeTab === 'password' && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <FiLock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <Input label="Current Password" type="password" value={passwordForm.old_password}
              onChange={e => { setPasswordForm({ ...passwordForm, old_password: e.target.value }); if (passwordErrors.old_password) setPasswordErrors(prev => ({ ...prev, old_password: undefined })); }}
              error={passwordErrors.old_password} placeholder="Enter current password" />
            <Input label="New Password" type="password" value={passwordForm.new_password}
              onChange={e => { setPasswordForm({ ...passwordForm, new_password: e.target.value }); if (passwordErrors.new_password) setPasswordErrors(prev => ({ ...prev, new_password: undefined })); }}
              error={passwordErrors.new_password} placeholder="Min 8 characters" />
            <Input label="Confirm New Password" type="password" value={passwordForm.confirm_password}
              onChange={e => { setPasswordForm({ ...passwordForm, confirm_password: e.target.value }); if (passwordErrors.confirm_password) setPasswordErrors(prev => ({ ...prev, confirm_password: undefined })); }}
              error={passwordErrors.confirm_password} placeholder="Re-enter new password" />
            <Button onClick={handleChangePassword} loading={savingPassword}>Update Password</Button>
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}
