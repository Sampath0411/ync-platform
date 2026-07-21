import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiCog, HiUser, HiLockClosed, HiGlobe,
  HiMail, HiPhone, HiLocationMarker, HiSave,
} from 'react-icons/hi';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageTransition from '@/components/ui/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

const tabs = [
  { id: 'profile', label: 'Profile', icon: HiUser },
  { id: 'password', label: 'Password', icon: HiLockClosed },
  { id: 'general', label: 'General', icon: HiCog },
  { id: 'social', label: 'Social Links', icon: HiGlobe },
];

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [settings, setSettings] = useState({
    siteName: '', tagline: '', description: '',
    contactEmail: '', contactPhone: '', address: '',
    timezone: 'Asia/Kolkata', language: 'en',
    maintenanceMode: false, allowRegistration: true,
    requireEmailVerification: false, maxEventsPerDay: 10,
  });

  const [social, setSocial] = useState({
    instagram: '', youtube: '', twitter: '', linkedin: '', facebook: '', website: '',
  });

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      const items = res.data || [];
      const map = {};
      items.forEach(s => { map[s.key] = s.value; });

      setSettings(prev => ({
        ...prev,
        siteName: map.site_name || 'YNC',
        tagline: map.tagline || 'Youth Network Community',
        description: map.description || '',
        contactEmail: map.contact_email || '',
        contactPhone: map.contact_phone || '',
        address: map.address || '',
        timezone: map.timezone || 'Asia/Kolkata',
        maintenanceMode: map.maintenance_mode === 'true',
        allowRegistration: map.allow_registration !== 'false',
        requireEmailVerification: map.require_email_verification === 'true',
        maxEventsPerDay: parseInt(map.max_events_per_day) || 10,
      }));

      // Load social links from individual settings
      setSocial({
        instagram: map.social_instagram || '',
        youtube: map.social_youtube || '',
        twitter: map.social_twitter || '',
        linkedin: map.social_linkedin || '',
        facebook: map.social_facebook || '',
        website: map.social_website || '',
      });

      setSettingsLoaded(true);
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Could not load settings. Using defaults.');
      setSettings(prev => ({
        ...prev,
        siteName: 'YNC',
        tagline: 'Youth Network Community',
        contactPhone: '+91 9291493225',
        address: 'Andhra University, Visakhapatnam',
        timezone: 'Asia/Kolkata',
      }));
      setSettingsLoaded(true);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/profile', profile);
      if (updateUser) updateUser({ ...user, ...profile });
      toast.success('Profile updated successfully');
    } catch (err) { toast.error(err.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('Please fill in all password fields'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    setSaving(true);
    try {
      await apiClient.put('/auth/password', { old_password: passwordForm.currentPassword, new_password: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const handleSettingsSave = async () => {
    setSaving(true);
    try {
      const keyMapping = {
        siteName: 'site_name', tagline: 'tagline', description: 'description',
        contactEmail: 'contact_email', contactPhone: 'contact_phone', address: 'address',
        timezone: 'timezone', maintenanceMode: 'maintenance_mode',
        allowRegistration: 'allow_registration', requireEmailVerification: 'require_email_verification',
        maxEventsPerDay: 'max_events_per_day',
      };
      await Promise.all(Object.entries(keyMapping).map(([camelKey, snakeKey]) =>
        apiClient.put(`/settings/${snakeKey}`, { value: settings[camelKey] })
      ));
      toast.success('System settings saved');
    } catch (err) { toast.error(err.message || 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleSocialSave = async () => {
    setSaving(true);
    try {
      // Save each social link as individual settings
      const socialMapping = {
        instagram: 'social_instagram', youtube: 'social_youtube', twitter: 'social_twitter',
        linkedin: 'social_linkedin', facebook: 'social_facebook', website: 'social_website',
      };
      await Promise.all(Object.entries(socialMapping).map(([camelKey, snakeKey]) =>
        apiClient.put(`/settings/${snakeKey}`, { value: social[camelKey] })
      ));
      toast.success('Social links saved');
    } catch (err) { toast.error(err.message || 'Failed to save social links'); }
    finally { setSaving(false); }
  };

  if (!settingsLoaded) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your profile and system configuration</p>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Admin Profile</h3>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold font-display">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div><p className="font-medium text-gray-900 dark:text-white">{profile.name}</p><p className="text-sm text-gray-500">{profile.email}</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} iconLeft={HiUser} />
                <Input label="Email Address" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} iconLeft={HiMail} />
                <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} iconLeft={HiPhone} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none" placeholder="A brief description about yourself..." />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleProfileSave} loading={saving} iconLeft={HiSave}>Save Profile</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h3>
              <div className="space-y-4">
                <Input label="Current Password" type={showPasswords.current ? 'text' : 'password'} value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} iconLeft={HiLockClosed} />
                <Input label="New Password" type={showPasswords.new ? 'text' : 'password'} value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} iconLeft={HiLockClosed} helperText="Minimum 8 characters" />
                <Input label="Confirm New Password" type={showPasswords.confirm ? 'text' : 'password'} value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} iconLeft={HiLockClosed}
                  error={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'Passwords do not match' : ''} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handlePasswordChange} loading={saving} iconLeft={HiLockClosed}>Update Password</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Site Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Site Name" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} iconLeft={HiGlobe} />
                <Input label="Tagline" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Site Description</label>
                  <textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none" />
                </div>
                <Input label="Contact Email" type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} iconLeft={HiMail} />
                <Input label="Contact Phone" value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} iconLeft={HiPhone} />
                <div className="md:col-span-2"><Input label="Address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} iconLeft={HiLocationMarker} /></div>
              </div>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Configuration</h3>
              <div className="space-y-4">
                {[
                  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Disable public access during maintenance' },
                  { key: 'allowRegistration', label: 'Allow Registration', desc: 'Allow new users to create accounts' },
                  { key: 'requireEmailVerification', label: 'Require Email Verification', desc: 'Users must verify email before accessing the platform' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                    <button onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key] ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Timezone</label>
                    <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <Input label="Max Events Per Day" type="number" value={settings.maxEventsPerDay} onChange={(e) => setSettings({ ...settings, maxEventsPerDay: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSettingsSave} loading={saving} iconLeft={HiSave}>Save Settings</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Social Media Links</h3>
              <div className="space-y-4">
                {[
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
                  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                  { key: 'website', label: 'Website', placeholder: 'https://...' },
                ].map((item) => (
                  <div key={item.key}>
                    <Input label={item.label} value={social[item.key]} onChange={(e) => setSocial({ ...social, [item.key]: e.target.value })} placeholder={item.placeholder} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSocialSave} loading={saving} iconLeft={HiSave}>Save Social Links</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
