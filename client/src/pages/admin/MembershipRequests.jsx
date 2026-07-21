import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCheck,
  HiX,
  HiRefresh,
  HiCalendar,
  HiDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

const tabs = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MembershipRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchRequests(); }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/memberships', { status: activeTab });
      const data = res.data || res.requests || res || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load membership requests');
      setRequests([]);
    } finally { setLoading(false); }
  };

  const handleApprove = async (requestId) => {
    try {
      await apiClient.put(`/memberships/${requestId}/approve`);
      toast.success('Membership approved! ID generated.');
      fetchRequests();
    } catch (error) { toast.error('Failed to approve request'); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await apiClient.put(`/memberships/${rejectModal.requestId}/reject`, { notes: rejectReason });
      toast.success('Request rejected');
      setRejectModal({ open: false, requestId: null });
      setRejectReason('');
      fetchRequests();
    } catch (error) { toast.error('Failed to reject request'); }
  };

  const handleReturnForCorrection = async (requestId) => {
    try {
      await apiClient.put(`/memberships/${requestId}/return`, { notes: 'Please provide additional details.' });
      toast.success('Returned for correction');
      fetchRequests();
    } catch (error) { toast.error('Failed to return request'); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Membership Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and manage membership applications</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <HiDocumentText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No {activeTab} requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {requests.map((request) => (
              <motion.div key={request.id || request._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(request.user_name || request.user?.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{request.user_name || request.user?.name || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{request.user_email || request.user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <HiCalendar className="w-3.5 h-3.5" />
                    {formatDate(request.created_at || request.request_date || request.submittedAt)}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason for joining</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
                </div>

                {activeTab === 'rejected' && request.admin_notes && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/30">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{request.admin_notes}</p>
                  </div>
                )}

                {activeTab === 'approved' && request.membership_id && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                    <HiCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">ID: {request.membership_id}</span>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => handleApprove(request.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors">
                      <HiCheck className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => setRejectModal({ open: true, requestId: request.id })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">
                      <HiX className="w-4 h-4" /> Reject
                    </button>
                    <button onClick={() => handleReturnForCorrection(request.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <HiRefresh className="w-4 h-4" /> Return
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {rejectModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal({ open: false, requestId: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">Reject Request</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection..." rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setRejectModal({ open: false, requestId: null }); setRejectReason(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleReject} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
