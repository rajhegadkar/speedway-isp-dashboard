'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  Phone, 
  Eye, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ShieldAlert,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface ClientsViewProps {
  onOpenAddClient: () => void;
  onOpenRecordPayment: (client: any) => void;
  onOpenReminder: (client: any, type: any) => void;
  onViewClient: (clientId: string) => void;
  pgList: Array<{ id: string; name: string }>;
  globalSearch: string;
  initialPG?: string;
  initialFilterType?: string;
  initialDueDate?: string;
  initialFilterLabel?: string;
  onSelectPG?: (pgId: string) => void;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
}

export default function ClientsView({
  onOpenAddClient,
  onOpenRecordPayment,
  onOpenReminder,
  onViewClient,
  pgList,
  globalSearch,
  initialPG = 'ALL',
  initialFilterType = 'ALL',
  initialDueDate = '',
  initialFilterLabel = '',
  onSelectPG,
  currentUser,
}: ClientsViewProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    active: number;
    inactive: number;
    suspended: number;
    paid: number;
    unpaid: number;
    dueToday: number;
    overdue: number;
    dueSoon: number;
    plansToday: number;
  }>({
    all: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    paid: 0,
    unpaid: 0,
    dueToday: 0,
    overdue: 0,
    dueSoon: 0,
    plansToday: 0,
  });

  const [search, setSearch] = useState(globalSearch || '');
  const [selectedPG, setSelectedPG] = useState(initialPG);
  const [filterType, setFilterType] = useState(initialFilterType);
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [filterLabel, setFilterLabel] = useState(initialFilterLabel);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialPG !== undefined) {
      setSelectedPG(initialPG);
    }
  }, [initialPG]);

  useEffect(() => {
    if (initialFilterType !== undefined) {
      setFilterType(initialFilterType);
    }
  }, [initialFilterType]);

  useEffect(() => {
    if (initialDueDate !== undefined) {
      setDueDate(initialDueDate);
    }
  }, [initialDueDate]);

  useEffect(() => {
    if (initialFilterLabel !== undefined) {
      setFilterLabel(initialFilterLabel);
    }
  }, [initialFilterLabel]);

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
    }
  }, [globalSearch]);

  const handlePGChange = (pgId: string) => {
    setSelectedPG(pgId);
    if (onSelectPG) {
      onSelectPG(pgId);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, selectedPG, filterType, dueDate, selectedBillingCycle, sortBy, sortOrder]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: search,
        pgId: selectedPG,
        filterType,
        dueDate,
        billingCycle: selectedBillingCycle,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      if (json.success) {
        setClients(json.clients);
        if (json.counts) {
          setCounts(json.counts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) return;
    const headers = [
      'Customer ID',
      'Customer Name',
      'Mobile',
      'WhatsApp',
      'Address',
      'Payment Group',
      'Plan Name',
      'Monthly Rate',
      'Billing Cycle',
      'Due Date',
      'Last Payment Date',
      'Payment Status',
      'Connection Status',
      'PPPoE Username',
      'Static IP',
      'Outstanding Balance',
    ];

    const rows = clients.map((c) => [
      c.id,
      `"${c.name}"`,
      c.mobile,
      c.whatsapp || c.mobile,
      `"${c.address}"`,
      `"${c.pg_name}"`,
      `"${c.plan_name}"`,
      c.monthly_price,
      c.billing_cycle,
      c.payment_due_date,
      c.last_payment_date || 'N/A',
      c.payment_status,
      c.connection_status,
      c.pppoe_username,
      c.static_ip || 'DHCP',
      c.total_outstanding || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Speedway_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}" (${id})? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchClients();
      } else {
        alert(json.error || 'Failed to delete client');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Clients Directory & Subscriber Database
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
              {clients.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive customer records, billing cycles, installation details, and ONT credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddClient}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 hover:shadow-sky-600/30 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Pills with live real-time counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {[
          { id: 'ALL', label: 'All Subscribers', count: counts.all, color: 'text-slate-700 bg-white hover:bg-slate-100' },
          { id: 'ACTIVE', label: 'Active', count: counts.active, color: 'text-blue-700 bg-blue-50/70 hover:bg-blue-100' },
          { id: 'DUE_TODAY', label: 'Due Today', count: counts.dueToday, color: 'text-amber-800 bg-amber-50 hover:bg-amber-100' },
          { id: 'OVERDUE', label: 'Overdue', count: counts.overdue, color: 'text-rose-700 bg-rose-50 hover:bg-rose-100' },
          { id: 'PAID', label: 'Paid', count: counts.paid, color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
          { id: 'UNPAID', label: 'Unpaid', count: counts.unpaid, color: 'text-slate-700 bg-slate-100 hover:bg-slate-200' },
          { id: 'DUE_SOON', label: 'Due in 7d', count: counts.dueSoon, color: 'text-orange-700 bg-orange-50 hover:bg-orange-100' },
          { id: 'SUSPENDED', label: 'Suspended', count: counts.suspended, color: 'text-purple-700 bg-purple-50 hover:bg-purple-100' },
          { id: 'INACTIVE', label: 'Inactive / Off', count: counts.inactive, color: 'text-gray-600 bg-gray-100 hover:bg-gray-200' },
        ].map((pill) => {
          const isActive = filterType === pill.id && !dueDate;
          return (
            <button
              key={pill.id}
              onClick={() => {
                setFilterType(pill.id);
                setDueDate('');
                setFilterLabel(pill.id === 'ALL' ? '' : pill.label);
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold ring-2 ring-slate-900/10'
                  : `border-slate-200 ${pill.color}`
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Reconciled Banner */}
      {(filterType !== 'ALL' || selectedPG !== 'ALL' || dueDate || search) && (
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-sky-950 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
            <span>
              <strong>Filtered View:</strong>{' '}
              <span className="font-bold text-sky-900 underline">
                {filterLabel || (filterType !== 'ALL' ? filterType : 'All Statuses')}
              </span>
              {selectedPG !== 'ALL' && (
                <span>
                  {' '}• Payment Group:{' '}
                  <strong className="text-slate-900 bg-white/80 px-1.5 py-0.5 rounded border border-sky-200">
                    {pgList.find((p) => p.id === selectedPG)?.name || selectedPG}
                  </strong>
                </span>
              )}
              {dueDate && (
                <span>
                  {' '}• Due Date: <strong className="font-mono text-slate-900 bg-white/80 px-1.5 py-0.5 rounded border border-sky-200">{dueDate}</strong>
                </span>
              )}
              {search && (
                <span>
                  {' '}• Search: &ldquo;<strong className="text-slate-900">{search}</strong>&rdquo;
                </span>
              )}
              <span> • Found <strong>{clients.length}</strong> matching subscribers</span>
            </span>
          </div>

          <button
            onClick={() => {
              setFilterType('ALL');
              setDueDate('');
              setFilterLabel('');
              setSelectedPG('ALL');
              setSearch('');
              if (onSelectPG) onSelectPG('ALL');
            }}
            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold rounded-xl transition-colors self-start sm:self-auto text-[11px] shadow-sm flex items-center gap-1"
          >
            <span>✕ Clear All Filters</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone, PPPoE username, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          {/* PG Filter */}
          <div>
            <select
              value={selectedPG}
              onChange={(e) => handlePGChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="ALL">All Payment Groups ({counts.all})</option>
              {pgList.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setDueDate('');
                const option = e.target.options[e.target.selectedIndex].text;
                setFilterLabel(e.target.value === 'ALL' ? '' : option);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Subscribers</option>
              <option value="DUE_TODAY">Due Today</option>
              <option value="OVERDUE">Overdue Clients</option>
              <option value="PAID">Paid Subscribers</option>
              <option value="UNPAID">Unpaid / Pending</option>
              <option value="DUE_SOON">Due in 7 Days</option>
              <option value="SUSPENDED">Suspended Lines</option>
              <option value="INACTIVE">Inactive / Off</option>
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <select
              value={selectedBillingCycle}
              onChange={(e) => setSelectedBillingCycle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
            >
              <option value="ALL">All Billing Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
              <option value="Custom">Custom Days</option>
            </select>
          </div>
        </div>

        {/* Sorting options bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Sort By:</span>
            <button
              onClick={() => {
                if (sortBy === 'name') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                else { setSortBy('name'); setSortOrder('ASC'); }
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === 'name' ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-100'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'dueDate') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                else { setSortBy('dueDate'); setSortOrder('ASC'); }
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === 'dueDate' ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-100'
              }`}
            >
              Due Date {sortBy === 'dueDate' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'outstanding') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                else { setSortBy('outstanding'); setSortOrder('DESC'); }
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === 'outstanding' ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-100'
              }`}
            >
              Outstanding {sortBy === 'outstanding' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'lastPaymentDate') setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                else { setSortBy('lastPaymentDate'); setSortOrder('DESC'); }
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                sortBy === 'lastPaymentDate' ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-100'
              }`}
            >
              Last Payment {sortBy === 'lastPaymentDate' && (sortOrder === 'ASC' ? '↑' : '↓')}
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-500">
            Showing {clients.length} of {counts.all} subscribers
          </span>
        </div>
      </div>

      {/* Main Clients Table & Mobile Card View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading subscribers...
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No clients found matching the selected filters.
          </div>
        ) : (
          <>
            {/* Mobile Card List (Visible on phones & small screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {clients.map((c) => {
                const isOverdue = c.daysDiff < 0;
                const isDueToday = c.daysDiff === 0 && c.payment_status !== 'PAID';

                return (
                  <div key={c.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2.5">
                    {/* Name, Status Badges & Quick Details */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          onClick={() => onViewClient(c.id)}
                          className="font-bold text-sm text-slate-900 hover:text-sky-600 truncate block text-left"
                        >
                          {c.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 rounded text-slate-700 text-[10px]">{c.id}</span>
                          <span>•</span>
                          <a href={`tel:${c.mobile}`} className="text-sky-600 font-medium hover:underline">{c.mobile}</a>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            c.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.payment_status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {c.payment_status}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            c.connection_status === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-700'
                              : c.connection_status === 'SUSPENDED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.connection_status}
                        </span>
                      </div>
                    </div>

                    {/* Plan & PG Information Bar */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Plan & Group</span>
                        <span className="font-semibold text-slate-800 truncate block">{c.plan_name} • {c.pg_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Rate / Mo</span>
                        <span className="font-bold text-slate-900 font-mono">{formatINR(c.monthly_price)}</span>
                      </div>
                    </div>

                    {/* Due Date & Financial Status */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div>
                        <span className="text-slate-500 text-[11px]">Due: </span>
                        <span className="font-mono font-bold text-slate-800">{c.payment_due_date}</span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 ml-1.5">
                            ({c.daysOverdue}d late)
                          </span>
                        )}
                        {isDueToday && (
                          <span className="text-[10px] font-bold text-amber-600 ml-1.5">
                            (Today!)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Balance: </span>
                        <span className={`font-mono font-bold ${c.total_outstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatINR(c.total_outstanding || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => onViewClient(c.id)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Profile</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenReminder(c, c.payment_status === 'OVERDUE' ? 'OVERDUE' : 'DUE_TODAY')}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                          title="WhatsApp Reminder"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenRecordPayment(c)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                        >
                          Pay
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            title="Delete Client"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Visible on tablet & desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Client ID & Name</th>
                    <th className="py-3 px-4">Payment Group & Area</th>
                    <th className="py-3 px-4">Plan & Cycle</th>
                    <th className="py-3 px-4">Payment Due Date</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Line Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {clients.map((c) => {
                    const isOverdue = c.daysDiff < 0;
                    const isDueToday = c.daysDiff === 0 && c.payment_status !== 'PAID';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onViewClient(c.id)}
                            className="font-bold text-slate-900 hover:text-sky-600 block text-left"
                          >
                            {c.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                            <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{c.id}</span>
                            <span>•</span>
                            <span className="font-mono">{c.mobile}</span>
                          </div>
                        </td>

                        {/* PG */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{c.pg_name}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{c.address}</p>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{formatINR(c.monthly_price)}</p>
                          <p className="text-[11px] text-slate-500">
                            {c.plan_name} ({c.billing_cycle})
                          </p>
                        </td>

                        {/* Due Date & Badge */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-800 block">
                            {c.payment_due_date}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600">
                              {c.daysOverdue} days overdue
                            </span>
                          )}
                          {isDueToday && (
                            <span className="text-[10px] font-bold text-amber-600">
                              Due Today!
                            </span>
                          )}
                        </td>

                        {/* Outstanding */}
                        <td className="py-3.5 px-4">
                          <span className={`font-bold ${c.total_outstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatINR(c.total_outstanding || 0)}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              c.payment_status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : c.payment_status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {c.payment_status}
                          </span>
                        </td>

                        {/* Connection Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.connection_status === 'ACTIVE'
                                ? 'bg-blue-50 text-blue-700'
                                : c.connection_status === 'SUSPENDED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.connection_status}
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onOpenRecordPayment(c)}
                              title="Record Payment"
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px]"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => onOpenReminder(c, c.payment_status === 'OVERDUE' ? 'OVERDUE' : 'DUE_TODAY')}
                              title="WhatsApp Reminder"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onViewClient(c.id)}
                              title="View Details"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {currentUser?.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteClient(c.id, c.name)}
                                title="Delete Client (Admin Only)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
