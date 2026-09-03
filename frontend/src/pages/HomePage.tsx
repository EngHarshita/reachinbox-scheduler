import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">ReachInbox</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
              Scheduler
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Body */}
      <main className="max-w-4xl mx-auto px-6 py-20 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" /> Multi-Tenant Email Dispatch Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-3xl">
          Automated Email Scheduling & Queue Management
        </h1>

        <p className="text-base text-slate-600 mt-4 max-w-2xl leading-relaxed">
          ReachInbox Email Scheduler provides multi-tenant outreach dispatch, BullMQ background job processing, atomic concurrency controls, and direct Gmail REST API integration.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Precision Scheduling</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Schedule outreach messages down to the exact minute using distributed BullMQ queues backed by Redis.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Gmail OAuth Dispatch</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Send RFC 2822 MIME-formatted emails directly via user-authorized Gmail API sender accounts.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Atomic Concurrency</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Row-level PostgreSQL status claiming prevents duplicate email dispatches across concurrent worker threads.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} ReachInbox Email Scheduler. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
