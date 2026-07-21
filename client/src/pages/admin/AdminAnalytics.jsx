import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiUsers, HiCalendar, HiTicket, HiCurrencyRupee,
  HiTrendingUp, HiUserGroup,
} from 'react-icons/hi';
import { analyticsAPI } from '@/api/client';
import GlassCard from '@/components/ui/GlassCard';
import Loader from '@/components/ui/Loader';

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getOverview(),
      analyticsAPI.getRevenue(),
      analyticsAPI.getEvents(),
      analyticsAPI.getUsers(),
    ]).then(([o, r, e, u]) => {
      setOverview(o.data);
      setRevenue(r.data || []);
      setEventStats(e.data);
      setUserStats(u.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader variant="skeleton" count={6} className="max-w-6xl" />;

  const statCards = overview ? [
    { label: 'Total Users', value: overview.users?.total || 0, icon: HiUsers, color: 'from-blue-600 to-blue-400' },
    { label: 'Active Members', value: overview.users?.members || 0, icon: HiUserGroup, color: 'from-green-600 to-green-400' },
    { label: 'Total Events', value: overview.events?.total || 0, icon: HiCalendar, color: 'from-orange-600 to-red-400' },
    { label: 'Upcoming Events', value: overview.events?.upcoming || 0, icon: HiTrendingUp, color: 'from-purple-600 to-pink-400' },
    { label: 'Bookings', value: overview.bookings?.confirmed || 0, icon: HiTicket, color: 'from-cyan-600 to-blue-400' },
    { label: 'Revenue', value: `₹${(overview.revenue || 0).toLocaleString()}`, icon: HiCurrencyRupee, color: 'from-emerald-600 to-teal-400' },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and statistics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Over Time</h3>
          {revenue.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No revenue data yet</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Month</span>
                <span>Revenue</span>
              </div>
              {revenue.map((r) => {
                const maxRev = Math.max(...revenue.map(x => x.revenue), 1);
                const pct = (r.revenue / maxRev) * 100;
                return (
                  <div key={r.month} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{r.month}</span>
                      <span className="text-gray-900 dark:text-white font-medium">₹{r.revenue}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Event popularity */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Events</h3>
          {eventStats?.popular?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No event data yet</p>
          ) : (
            <div className="space-y-3">
              {eventStats?.popular?.slice(0, 10).map((event, i) => (
                <div key={event.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.total_tickets || 0} tickets / {event.max_capacity || 0} capacity</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-orange-500">{event.booking_count || 0}</span>
                    <span className="text-xs text-gray-500 block">bookings</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* User growth */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          {userStats?.growth?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No user data yet</p>
          ) : (
            <div className="space-y-2">
              {userStats?.growth?.map((g) => {
                const maxReg = Math.max(...userStats.growth.map(x => x.registrations), 1);
                const pct = (g.registrations / maxReg) * 100;
                return (
                  <div key={g.month} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{g.month}</span>
                      <span className="text-gray-900 dark:text-white font-medium">+{g.registrations}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Category distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Categories</h3>
          {eventStats?.categories?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No categories yet</p>
          ) : (
            <div className="space-y-3">
              {eventStats?.categories?.map((cat) => {
                const total = eventStats.categories.reduce((s, c) => s + c.count, 0);
                const pct = total > 0 ? (cat.count / total) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize w-24 truncate">{cat.category}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{cat.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Membership breakdown */}
      {userStats?.memberships?.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Membership Status</h3>
          <div className="flex gap-4 flex-wrap">
            {userStats.memberships.map((m) => (
              <div key={m.membership_status} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-sm capitalize text-gray-600 dark:text-gray-400">{m.membership_status}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{m.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}
