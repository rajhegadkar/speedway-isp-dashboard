'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  CreditCard, 
  FileText, 
  RefreshCw, 
  Wifi, 
  Menu,
  X,
  Smartphone,
  Copy,
  Check,
  LayoutDashboard,
  Users,
  Building2,
  Send,
  BarChart3,
  Database,
  ExternalLink,
  Sliders,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  selectedPG: string;
  onSelectPG: (pgId: string) => void;
  pgList: Array<{ id: string; name: string; code: string }>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenRecordPayment: () => void;
  onOpenAddClient: () => void;
  onOpenBatchInvoice: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueTodayCount: number;
  overdueCount: number;
  networkUrl?: string;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
  onLogout?: () => void;
}

export default function Navbar({
  selectedPG,
  onSelectPG,
  pgList,
  searchQuery,
  onSearchChange,
  onOpenRecordPayment,
  onOpenAddClient,
  onOpenBatchInvoice,
  onRefresh,
  isLoading,
  activeTab,
  setActiveTab,
  dueTodayCount,
  overdueCount,
  networkUrl = 'http://192.168.1.128:3000',
  currentUser,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyNetworkUrl = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const navLinks = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients Directory', icon: Users },
    { id: 'pgs', label: 'Payment Groups (PGs)', icon: Building2 },
    { id: 'invoices', label: 'Billing & Invoices', icon: FileText },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard },
    { id: 'reminders', label: 'Reminder Center', icon: Send, badge: dueTodayCount + overdueCount },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'customize', label: 'Customize & Plans', icon: Sliders },
    { id: 'backup', label: 'Data & Backups', icon: Database },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm no-print">
        <div className="px-3 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Mobile Hamburger & Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded-xl"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo & Brand */}
              <div
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20 shrink-0">
                  <Wifi className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 tracking-tight text-sm sm:text-lg">
                      SPEEDWAY
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider hidden xs:inline">
                      ISP
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 hidden sm:block">
                    Billing & Client Operations Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Middle: Global Search (Desktop & Tablet) */}
            <div className="flex-1 max-w-sm mx-2 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients by name, ID, mobile, IP or PPPoE..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 placeholder-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Right: Network IP, PG Selector & Quick Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Network Wi-Fi Access Badge */}
              <button
                type="button"
                onClick={() => setShowNetworkModal(true)}
                title="Access on Phone / Same Network"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl border border-sky-200 text-xs font-semibold transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden lg:inline">Wi-Fi Access:</span>
                <span className="font-mono text-[11px]">{networkUrl.replace('http://', '')}</span>
              </button>

              {/* PG Filter Dropdown */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 hover:border-slate-300 max-w-[110px] xs:max-w-[130px] sm:max-w-none">
                <Filter className="w-3 h-3 text-slate-500 mr-1 shrink-0 hidden xs:block" />
                <select
                  value={selectedPG}
                  onChange={(e) => onSelectPG(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                >
                  <option value="ALL">All PGs</option>
                  {pgList.map((pg) => (
                    <option key={pg.id} value={pg.id}>
                      {pg.name} ({pg.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Refresh Button */}
              <button
                onClick={onRefresh}
                title="Refresh Data"
                disabled={isLoading}
                className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
              </button>

              {/* Quick Action: Record Payment */}
              <button
                onClick={onOpenRecordPayment}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Pay</span>
              </button>

              {/* Quick Action: Add Client */}
              <button
                onClick={onOpenAddClient}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Add</span>
              </button>

              {/* User Profile Badge */}
              {currentUser && (
                <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                    {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <p className="font-bold text-slate-800 truncate max-w-[90px]">{currentUser.name}</p>
                    <span className="text-[9px] uppercase font-bold text-sky-700 bg-sky-50 px-1 rounded">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out of Speedway Dashboard"
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 hover:text-rose-600" />
                  <span className="hidden 2xl:inline">Logout</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 p-4 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Brand */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-white block">SPEEDWAY</span>
                    <span className="text-[10px] text-slate-400">Broadband Services</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subscribers..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px]">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer: User Profile & Phone Wi-Fi Access */}
            <div className="pt-4 border-t border-slate-800 text-xs space-y-3">
              {currentUser && (
                <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-xs truncate">{currentUser.name}</p>
                      <span className="text-[10px] text-sky-400 font-semibold uppercase">{currentUser.role} Mode</span>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Connect Other Phones & Tablets
                </span>
                <p className="font-mono text-sky-400 text-[11px] truncate">{networkUrl}</p>
                <button
                  onClick={handleCopyNetworkUrl}
                  className="mt-2 w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied Link' : 'Copy Network URL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Access Dialog Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span>Open on Phone & Network Devices</span>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Any phone, tablet, or laptop connected to the same Wi-Fi or office network can access Speedway Broadband Services by typing this address into their browser:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 mb-4 font-mono text-sm font-bold text-sky-700">
              <span className="truncate">{networkUrl}</span>
              <button
                onClick={handleCopyNetworkUrl}
                className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg shrink-0 transition-colors"
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={() => setShowNetworkModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
