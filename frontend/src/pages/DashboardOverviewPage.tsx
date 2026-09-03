import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Send, Clock, AlertCircle, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';

export const DashboardOverviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metrics, setMetrics] = useState({ scheduled: 0, sent: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const gmailConnected = searchParams.get('gmail') === 'connected';
  const errorMessage = searchParams.get('error');

  const dismissBanner = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('gmail');
    newParams.delete('error');
    setSearchParams(newParams, { replace: true });
  };

  const fetchMetrics = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(`/emails/stats?_t=${Date.now()}`);
      if (res.data?.status === 'success') {
        setMetrics({
          scheduled: res.data.data.scheduled || 0,
          sent: res.data.data.sent || 0,
          pending: res.data.data.pending || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics(true);
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 space-y-8">
      {gmailConnected && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Gmail account connected successfully! You can now compose and send emails.</span>
          </div>
          <button onClick={dismissBanner} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={dismissBanner} className="text-amber-600 hover:text-amber-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ReachInbox Outbox Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status monitoring for BullMQ automated dispatches.</p>
        </div>

        <Link
          to="/compose"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <span>Schedule Campaign</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Scheduled */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Dispatches</span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : metrics.scheduled}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Active queued jobs in BullMQ Redis</p>
          </div>
        </div>

        {/* Card 2: Sent Successfully */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent Successfully</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : metrics.sent}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Delivered via Gmail API / SMTP</p>
          </div>
        </div>

        {/* Card 3: Pending Queue */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processing & Pending</span>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : metrics.pending}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Waiting worker pick-up</p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Links */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/scheduled"
          className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              View Scheduled Queue
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Inspect upcoming dispatches & timing</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          to="/sent"
          className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              View Delivered Outbox
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Inspect delivered email logs & delivery responses</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
};
