import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { FiShield, FiClock, FiCheckCircle, FiXCircle, FiSend, FiAward } from 'react-icons/fi';

export default function MembershipPage() {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    try {
      const { default: api } = await import('@/api/client');
      const res = await api.get('/memberships/my');
      setMembership(res.data || null);
    } catch (err) {
      console.error('Failed to load membership:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const { default: api } = await import('@/api/client');
      await api.post('/memberships/request', { reason });
      setShowForm(false);
      setReason('');
      fetchMembership();
    } catch (err) {
      console.error('Failed to submit request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = () => {
    if (!user) return 'none';
    const ms = user.membership_status;
    if (ms === 'active') return 'active';
    if (ms === 'trial') return 'trial';
    if (membership?.memberships?.length > 0) {
      const last = membership.memberships[0];
      if (last.status === 'pending') return 'pending';
      if (last.status === 'rejected') return 'rejected';
    }
    return 'trial';
  };

  const status = getStatus();

  const statusConfig = {
    active: { icon: FiCheckCircle, color: 'from-green-500 to-emerald-600', text: 'Active Member', desc: 'You have full access to all YNC benefits.' },
    trial: { icon: FiClock, color: 'from-blue-500 to-indigo-600', text: 'Free Trial', desc: 'Enjoy your 1-month free trial. Apply for full membership!' },
    pending: { icon: FiClock, color: 'from-yellow-500 to-orange-600', text: 'Pending Review', desc: 'Your membership request is being reviewed.' },
    rejected: { icon: FiXCircle, color: 'from-red-500 to-rose-600', text: 'Not Approved', desc: 'Your request was not approved. You can re-apply.' },
    none: { icon: FiAward, color: 'from-gray-500 to-gray-600', text: 'No Membership', desc: 'Join YNC to unlock premium benefits.' },
  };

  const cfg = statusConfig[status] || statusConfig.none;
  const Icon = cfg.icon;

  if (loading) return <Loader variant="skeleton" count={3} className="max-w-2xl mx-auto" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Digital Membership Card */}
      <div className="max-w-md mx-auto mb-8">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.color} p-[2px] shadow-2xl`}>
          <div className="rounded-2xl bg-gray-900 p-6 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Youth Network Community</p>
                  <p className="text-lg font-bold text-white font-display mt-1">Member Card</p>
                </div>
                <Icon className="w-8 h-8 text-white/80" />
              </div>

              {/* Profile */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{user?.name || 'Member'}</h3>
                  <p className="text-gray-400 text-sm">{user?.email || ''}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <Badge variant={status === 'active' ? 'success' : status === 'trial' ? 'info' : 'warning'}>
                    {cfg.text}
                  </Badge>
                </div>
                {user?.membership_expiry && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Expiry</p>
                    <p className="text-sm text-white font-medium">{new Date(user.membership_expiry).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* QR Placeholder */}
              <div className="mt-4 flex justify-center">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">QR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">{cfg.desc}</p>
      </div>

      {/* Content Sections */}
      {status === 'trial' && !membership?.memberships?.some(m => m.status === 'pending') && (
        <GlassCard className="max-w-lg mx-auto p-6">
          <div className="text-center">
            <FiAward className="w-10 h-10 text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-display">Upgrade to Full Membership</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tell us why you want to join the YNC community</p>

            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="mt-4">Apply for Membership</Button>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-24"
                  placeholder="Write your reason for joining YNC..." />
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} loading={submitting}><FiSend className="w-4 h-4 mr-2" />Submit Request</Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {status === 'pending' && (
        <GlassCard className="max-w-lg mx-auto p-6 text-center">
          <FiClock className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-display">Request Pending</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your membership request is being reviewed by our team. We'll notify you once it's processed.</p>
        </GlassCard>
      )}

      {status === 'rejected' && (
        <GlassCard className="max-w-lg mx-auto p-6 text-center">
          <FiXCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-display">Request Not Approved</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{membership?.memberships?.[0]?.admin_notes || 'Your request did not meet the criteria. You can submit a new request.'}</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">Apply Again</Button>
        </GlassCard>
      )}

      {/* Benefits Section */}
      <div className="max-w-lg mx-auto mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-display mb-4">Membership Benefits</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: FiShield, label: 'Exclusive Events', desc: 'Member-only events' },
            { icon: FiAward, label: 'Discounts', desc: 'Special pricing on events' },
            { icon: FiCheckCircle, label: 'Priority Access', desc: 'Early bird registration' },
            { icon: FiClock, label: 'Community', desc: 'Connect with members' },
          ].map((b, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <b.icon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">{b.label}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
