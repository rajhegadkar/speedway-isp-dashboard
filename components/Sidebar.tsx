'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  Send, 
  BarChart3, 
  Database,
  Clock,
  Smartphone,
  Sliders,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueTodayCount: number;
  overdueCount: number;
  networkUrl?: string;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
  onLogout?: () => void;
  pulseLabel?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  dueTodayCount,
  overdueCount,
  networkUrl = 'http://192.168.1.128:3000',
  currentUser,
  onLogout,
  pulseLabel = 'Action Pulse',
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'clients',
      label: 'Clients Directory',
      icon: Users,
      badge: null,
    },
    {
      id: 'pgs',
      label: 'Payment Groups (PGs)',
      icon: Building2,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Billing & Invoices',
      icon: FileText,
      badge: null,
    },
    {
      id: 'payments',
      label: 'Payment Tracking',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'reminders',
      label: 'Reminder Center',
      icon: Send,
      badge: dueTodayCount + overdueCount > 0 ? (
        <span className="ml-auto px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
          {dueTodayCount + overdueCount}
        </span>
      ) : null,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'customize',
      label: 'Customize & Plans',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'backup',
      label: 'Data & Backups',
      icon: Database,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-61px)] no-print">
      {/* Quick Status Pill */}
      <div className="p-4 border-b border-slate-800">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">{pulseLabel}</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Due Today:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
              {dueTodayCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold mt-1.5">
            <span className="text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Overdue:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">
              {overdueCount}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.badge}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out */}
      {currentUser && (
        <div className="p-3 mx-3 mb-2 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
              {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs truncate leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] text-sky-400 font-bold uppercase">{currentUser.role}</span>
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors"
              title="Sign Out of Dashboard"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Footer Info: Local Network Link */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold">
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Mobile & Wi-Fi URL:</span>
        </div>
        <p className="font-mono text-sky-400 text-[10px] break-all">{networkUrl}</p>
        <p className="text-slate-600 text-[10px]">Speedway Broadband Services • v1.0</p>
      </div>
    </aside>
  );
}
