import React from 'react';
import { Menu, LogOut, UserCircle2, Bell, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-xs">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.username || 'Admin'}</p>
            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5 inline" /> {user?.role || 'Admin'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
