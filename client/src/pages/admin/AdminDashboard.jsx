import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiUsers,
  HiUserGroup,
  HiCalendar,
  HiTicket,
  HiClock,
  HiCheckCircle,
  HiTrendingUp,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import apiClient, { adminAPI } from '@/api/client';

const statCards = [
  { label: 'Total Users', key: 'totalUsers', icon: HiUsers, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/10' },
  { label: 'Active Members', key: 'activeMembers', icon: HiUserGroup, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10' },
  { label: 'Pending Requests', key: 'pendingRequests', icon: HiClock, color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-500/10' },
  { label: 'Total Events', key: 'totalEvents', icon: HiCalendar, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500/10' },
  { label: 'Tickets Sold', key: 'ticketsSold', icon: HiTicket, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500/10' },
  { label: 'Today Check-ins', key: 'todayCheckins', icon: HiCheckCircle, color: 'from-teal-500 to-green-500', bgColor: 'bg-teal-500/10' },
];

function AnimatedNumber({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, activeMembers: 0, pendingRequests: 0,
    totalEvents: 0, ticketsSold: 0, todayCheckins: 0,
    totalRevenue: 0, unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await adminAPI.getStats();
      const d = res.data || res;
      setStats({
        totalUsers: d.totalUsers || 0,
        activeMembers: d.activeMembers || 0,
        pendingRequests: d.pendingMemberships || 0,
        totalEvents: d.totalEvents || 0,
        ticketsSold: d.ticketsSold || 0,
        todayCheckins: d.todayCheckins || 0,
        totalRevenue: d.totalRevenue || 0,
        unreadMessages: d.unreadMessages || 0,
      });
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      setStats({ totalUsers: 0, activeMembers: 0, pendingRequests: 0, totalEvents: 0, ticketsSold: 0, todayCheckins: 0, totalRevenue: 0, unreadMessages: 0 });
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative overflow-hidden bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-1">
                  <AnimatedNumber value={stats[card.key] || 0} />
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              <HiTrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">Live</span>
              <span className="text-gray-400">from database</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-1">
            ₹{(stats.totalRevenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unread Messages</p>
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-1">
            <AnimatedNumber value={stats.unreadMessages || 0} />
          </p>
        </div>
      </div>

      {/* Real-time summary info */}
      <div className="bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Platform Status</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All systems operational. Data is fetched live from the database.
        </p>
      </div>
    </div>
  );
}
