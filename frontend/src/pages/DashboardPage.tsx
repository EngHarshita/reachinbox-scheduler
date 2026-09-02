import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, CalendarClock, Send, Zap, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ scheduled: 0, sent: 0, pending: 0 });

  const loadStats = async () => {
    try {
      const res = await api.get('/emails/stats');
      if (res.data?.status === 'success') {
        setStats({
          scheduled: res.data.data.scheduled || 0,
          sent: res.data.data.sent || 0,
          pending: res.data.data.pending || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Banner Section (32px bottom margin: mb-8) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Welcome back, {user?.fullName || 'User'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {user?.email} • Engine Status: Operational
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/compose"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Schedule Email
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (Fixed Height 160px: h-40, 24px Gap: gap-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="h-40 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Scheduled Queue</span>
            <CalendarClock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-zinc-100 tracking-tight">{stats.scheduled}</span>
            <Link to="/scheduled" className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1">
              View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="h-40 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Delivered Emails</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-zinc-100 tracking-tight">{stats.sent}</span>
            <Link to="/sent" className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1">
              View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="h-40 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Hourly Rate Limit</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-zinc-100 tracking-tight">100 / hr</span>
            <span className="text-xs text-zinc-500 font-mono">Sliding Window</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Card (Section Gap: 32px) */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">Engine Infrastructure Status</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Distributed BullMQ multi-worker execution active. Redis AOF persistence and PostgreSQL transactional logging synchronized.
        </p>
      </div>
    </div>
  );
};
