import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, Send, Plus, Mail, X, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Scheduled', path: '/scheduled', icon: CalendarClock },
    { label: 'Sent', path: '/sent', icon: Send },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'RI';

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Figma Specified Sidebar: 240px Fixed Width, White Background (#FFFFFF) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-white border-r border-slate-200 flex flex-col lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4 space-y-4">
          {/* Top Logo: Custom ReachInbox Branding */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">ReachInbox</span>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Card: Rounded, Soft Border, Avatar, Name, Email */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {user?.fullName || 'ReachInbox User'}
              </p>
              <p className="text-[11px] text-[#6B7280] truncate font-normal">
                {user?.email || 'user@reachinbox.com'}
              </p>
            </div>
          </div>

          {/* Compose Button: Height 42px, Radius 9999px, Green Outline, White Background */}
          <NavLink
            to="/compose"
            onClick={() => setMobileOpen(false)}
            className="w-full h-[42px] rounded-full bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Compose Email</span>
          </NavLink>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `h-10 rounded-lg flex items-center gap-3 px-3 text-xs transition-colors ${
                      isActive
                        ? 'bg-[#EAF5EE] text-[#0F172A] font-semibold'
                        : 'text-[#6B7280] hover:text-[#0F172A] hover:bg-slate-50 font-medium'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Menu: Settings & Logout */}
          <div className="pt-3 border-t border-slate-100 space-y-1">
            <NavLink
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `h-10 rounded-lg flex items-center gap-3 px-3 text-xs transition-colors ${
                  isActive
                    ? 'bg-[#EAF5EE] text-[#0F172A] font-semibold'
                    : 'text-[#6B7280] hover:text-[#0F172A] hover:bg-slate-50 font-medium'
                }`
              }
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Settings</span>
            </NavLink>

            <button
              type="button"
              onClick={logout}
              className="w-full h-10 rounded-lg flex items-center gap-3 px-3 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
