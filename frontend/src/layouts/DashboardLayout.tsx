import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen bg-white text-slate-900 flex flex-col overflow-hidden select-none max-w-full">
      {/* Figma Specified Sidebar: 240px Fixed Width */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container Offset by Sidebar (240px) */}
      <div className="lg:pl-[240px] flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header Navbar */}
        <Navbar setMobileOpen={setMobileOpen} />

        {/* Page Body Container */}
        <main className="flex-1 flex overflow-hidden min-h-0 w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
