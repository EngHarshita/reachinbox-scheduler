import React, { useEffect, useState } from 'react';
import { Menu, User as UserIcon, LogOut, MessageSquare, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const [slackConnected, setSlackConnected] = useState<boolean>(false);
  const [slackTeamName, setSlackTeamName] = useState<string | null>(null);
  const [loadingSlack, setLoadingSlack] = useState<boolean>(false);

  const fetchSlackStatus = async () => {
    try {
      const res = await api.get('/slack/status');
      if (res.data?.status === 'success') {
        setSlackConnected(res.data.data.connected);
        setSlackTeamName(res.data.data.teamName);
      }
    } catch (err) {
      console.error('Failed to fetch Slack status:', err);
    }
  };

  useEffect(() => {
    fetchSlackStatus();
  }, []);

  const handleConnectSlack = async () => {
    try {
      setLoadingSlack(true);
      const res = await api.get('/slack/auth-url');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      console.error('Failed to get Slack auth URL:', err);
    } finally {
      setLoadingSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      setLoadingSlack(true);
      await api.post('/slack/disconnect');
      setSlackConnected(false);
      setSlackTeamName(null);
    } catch (err) {
      console.error('Failed to disconnect Slack workspace:', err);
    } finally {
      setLoadingSlack(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-shrink-0">
      {/* Left: Mobile Toggle & Slack Integration Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Slack Connection & Disconnect Controls */}
        {slackConnected ? (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Connected Slack workspace"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slack: {slackTeamName || 'Connected'}</span>
            </span>
            <button
              onClick={handleDisconnectSlack}
              disabled={loadingSlack}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
              title="Disconnect Slack workspace"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectSlack}
            disabled={loadingSlack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{loadingSlack ? 'Connecting...' : 'Connect Slack'}</span>
          </button>
        )}
      </div>

      {/* Right: User Profile Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 text-slate-500" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">
              {user?.fullName || 'User Profile'}
            </p>
            <p className="text-[11px] text-slate-500 leading-none mt-1">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Logout of session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
