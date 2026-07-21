import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FiMoon, FiSun, FiBell, FiTrash2, FiLogOut, FiAlertTriangle, FiDownload } from 'react-icons/fi';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    event_reminders: true,
    community_updates: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ync_preferences');
      if (saved) setPrefs(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      localStorage.setItem('ync_preferences', JSON.stringify(prefs));
      // Small delay to show saving state
      await new Promise(r => setTimeout(r, 300));
      toast.success('Preferences saved');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/auth/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ync-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password'); return; }
    setDeleteError(null);
    setDeleting(true);
    try {
      const { default: api } = await import('@/api/client');
      await api.request('/auth/account', { method: 'DELETE', body: { password: deletePassword } });
      toast.success('Account deleted');
      setShowDelete(false);
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err.data?.message || err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences</p>
      </div>

      {/* Theme */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              {isDark ? <FiMoon className="w-5 h-5 text-orange-500" /> : <FiSun className="w-5 h-5 text-orange-500" />}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Appearance</h3>
              <p className="text-sm text-gray-500">Toggle dark mode</p>
            </div>
          </div>
          <button onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-orange-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      </GlassCard>

      {/* Notification Preferences */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <FiBell className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-sm text-gray-500">Choose what to be notified about</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive email updates' },
            { key: 'event_reminders', label: 'Event Reminders', desc: 'Get reminded about upcoming events' },
            { key: 'community_updates', label: 'Community Updates', desc: 'News and announcements from YNC' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={prefs[item.key]} onChange={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSavePrefs} loading={savingPrefs} size="sm">Save Preferences</Button>
        </div>
      </GlassCard>

      {/* Account Actions */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <FiTrash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Account</h3>
            <p className="text-sm text-gray-500">Dangerous actions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExportData} loading={exporting}><FiDownload className="w-4 h-4 mr-2" />Export My Data</Button>
          <Button variant="outline" onClick={logout}><FiLogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}><FiTrash2 className="w-4 h-4 mr-2" />Delete Account</Button>
        </div>
      </GlassCard>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account?</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">This action is irreversible. All your data will be permanently deleted.</p>
          </div>
          <Input label="Enter your password to confirm" type="password" value={deletePassword}
            onChange={(e) => { setDeletePassword(e.target.value); if (deleteError) setDeleteError(null); }}
            error={deleteError} placeholder="Your password" />
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="ghost" onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteError(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting}>Delete Forever</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
