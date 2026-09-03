import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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
            <ShieldCheck className="w-3.5 h-3.5" /> Official Privacy Notice
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-500">
            This Privacy Policy explains how ReachInbox Email Scheduler collects, uses, and safeguards user information.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you authenticate with ReachInbox Email Scheduler using Google OAuth 2.0, we collect basic profile information necessary to establish your user account:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-2">
              <li><strong>Google User ID (sub)</strong>: Used to uniquely identify your account.</li>
              <li><strong>Email Address</strong>: Used for account identification and notifications.</li>
              <li><strong>Full Name</strong>: Displayed in user interface headers.</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">2. Google OAuth & Gmail API Scopes</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ReachInbox uses a two-tier scope authorization model:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
              <li><strong>Basic Login Scopes (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">openid</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">userinfo.profile</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">userinfo.email</code>)</strong>: Non-sensitive scopes requested during sign-in to authenticate your identity.</li>
              <li><strong>Gmail Sending Scope (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">https://www.googleapis.com/auth/gmail.send</code>)</strong>: Requested ONLY when you explicitly connect your Gmail sender account in <strong>Settings</strong> to dispatch outbound emails.</li>
            </ul>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never read your personal inbox messages, store email drafts, or access non-sending Gmail APIs. Google OAuth refresh tokens are encrypted and stored in PostgreSQL strictly to execute your scheduled email dispatches.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">3. Email Scheduling Data & Analytics</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              To provide email scheduling, we store:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-2">
              <li>Recipient email addresses, email subjects, and message body contents.</li>
              <li>Scheduled dispatch timestamps and queue delivery status.</li>
              <li>Optional Slack OAuth tokens if you choose to enable real-time rate limit alerts.</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">4. Data Storage & Security</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              All application data is stored in isolated PostgreSQL databases with row-level tenant access controls. JWT session tokens enforce server-side authorization on every API request.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">5. Contact Support</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              If you have questions regarding data privacy or wish to request data deletion, contact our support team at:
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
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
