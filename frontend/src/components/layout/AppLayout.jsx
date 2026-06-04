import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[268px]">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1320px] animate-fade-in px-4 py-6 lg:px-7 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
