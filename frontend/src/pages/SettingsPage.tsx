import React, { useState, useEffect } from 'react';
import { Slack, CheckCircle2, ArrowUpRight, ShieldCheck, Mail, Sliders } from 'lucide-react';
import axios from 'axios';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'general' | 'notifications'>('integrations');
  const [slackConnected, setSlackConnected] = useState<boolean>(false);
  const [gmailConnected, setGmailConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [slackTeam, setSlackTeam] = useState<string | null>(null);
  const [slackChannel, setSlackChannel] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) {
      setErrorMessage(decodeURIComponent(errParam));
    }
    checkStatuses();
  }, []);

  const checkStatuses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('reachinbox_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Check Slack Status
      try {
        const slackRes = await axios.get('/api/v1/slack/status', { headers });
        if (slackRes.data?.connected) {
          setSlackConnected(true);
          setSlackTeam(slackRes.data.teamName || 'Workspace');
          setSlackChannel(slackRes.data.channelName || '#alerts');
        }
      } catch {
        setSlackConnected(false);
      }

      // Check Gmail Status
      try {
        const gmailRes = await axios.get('/api/v1/auth/gmail/status', { headers });
        setGmailConnected(Boolean(gmailRes.data?.connected));
      } catch {
        setGmailConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSlack = async () => {
    try {
      const token = localStorage.getItem('reachinbox_token');
      const res = await axios.get('/api/v1/slack/auth-url', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Failed to get Slack Auth URL:', err);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = '/api/v1/auth/gmail/connect';
  };

  const handleDisconnectGmail = async () => {
    try {
      const token = localStorage.getItem('reachinbox_token');
      await axios.post('/api/v1/auth/gmail/disconnect', {}, { headers: { Authorization: `Bearer ${token}` } });
      setGmailConnected(false);
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      const token = localStorage.getItem('reachinbox_token');
      await axios.post('/api/v1/slack/disconnect', {}, { headers: { Authorization: `Bearer ${token}` } });
      setSlackConnected(false);
      setSlackTeam(null);
      setSlackChannel(null);
    } catch (err) {
      console.error('Failed to disconnect Slack:', err);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto space-y-6 w-full bg-white text-slate-900">
      {/* Header Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage system configurations, webhooks, and third-party integrations.</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'integrations'
              ? 'border-emerald-600 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Integrations & Apps
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'general'
              ? 'border-emerald-600 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          General Preferences
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'notifications'
              ? 'border-emerald-600 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Alert Rules
        </button>
      </div>

      {/* Tab Content: Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {/* Gmail API Multi-Tenant Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Gmail OAuth Sender Account</h3>
                    {gmailConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Connected (Multi-Tenant)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Not Connected (Action Required)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">
                    Connect your Google account to grant email sending permissions via Gmail REST API (`gmail.send`). Basic login only authenticates your profile.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {gmailConnected && (
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
                <button
                  onClick={handleConnectGmail}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail Account'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slack Notifications Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 flex-shrink-0">
                  <Slack className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Slack Notifications</h3>
                    {slackConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">
                    Receive real-time Slack alerts whenever delayed emails are dispatched, rate limits are reached, or queue execution fails.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {slackConnected && (
                  <button
                    onClick={handleDisconnectSlack}
                    className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
                <button
                  onClick={handleConnectSlack}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{slackConnected ? 'Reconnect Workspace' : 'Connect Slack'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {slackConnected && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <div>
                  Active Workspace: <span className="text-slate-900 font-semibold">{slackTeam}</span>
                </div>
                <div>
                  Target Channel: <span className="text-slate-900 font-semibold">{slackChannel}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: General */}
      {activeTab === 'general' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-500 space-y-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Default Timezone & Locale</h3>
              <p className="text-xs text-slate-500 mt-0.5">All scheduled email timestamps are normalized to UTC standard time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-500 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated Event Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5">System automatically triggers webhooks on SMTP error events.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
