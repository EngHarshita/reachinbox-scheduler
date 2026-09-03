import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to ReachInbox</span>
          </Link>
          <div className="text-xs font-mono font-medium text-slate-500">
            Last Updated: September 2026
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <div className="space-y-3 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Terms of Service
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="text-xs text-slate-500">
            These Terms of Service govern your use of the ReachInbox Email Scheduler application.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              By logging into or scheduling emails through ReachInbox Email Scheduler, you agree to comply with these terms. This application is provided for demonstration, outreach testing, and multi-tenant email scheduling purposes.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">2. Acceptable Use & Email Anti-Spam Policy</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Users must adhere to acceptable email practices:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-2">
              <li>Do not use this platform to send unsolicited bulk commercial emails (spam).</li>
              <li>Do not send malicious links, phishing material, or deceptive messages.</li>
              <li>Comply with Google API Services User Data Policy when connecting Gmail accounts.</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">3. Rate Limits & Quotas</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ReachInbox enforces automated hourly rate limits (default 100 emails/hour per user) via Redis atomic counters to protect sender domain reputation. Excess messages are deferred automatically to subsequent hourly dispatch windows.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">4. Service Limitations & Disclaimer</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The service is provided "AS IS" without warranties of uninterrupted availability. Delivery times depend on third-party provider APIs (Google Gmail REST API, Ethereal SMTP) and network conditions.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">5. Contact Support</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              For questions concerning terms or service usage, reach out to:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono border border-slate-200">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>demo.user@reachinbox.com</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
          <div>&copy; {new Date().getFullYear()} ReachInbox Email Scheduler</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
