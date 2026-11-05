'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin,
  ArrowRight,
  Filter,
  BarChart2,
  LayoutDashboard,
  Eye,
  Trash2
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface PGsViewProps {
  onOpenAddPG: () => void;
  onFilterDashboard: (pgId: string) => void;
  onViewClients: (pgId: string) => void;
  selectedPG?: string;
  onSelectPG?: (pgId: string) => void;
}

export default function PGsView({
  onOpenAddPG,
  onFilterDashboard,
  onViewClients,
  selectedPG = 'ALL',
  onSelectPG,
}: PGsViewProps) {
  const [pgs, setPgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pgs');
      const json = await res.json();
      if (json.success) {
        setPgs(json.pgs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBilledAll = pgs.reduce((a, b) => a + (b.monthlyBillingAmount || 0), 0);
  const totalCollectedAll = pgs.reduce((a, b) => a + (b.totalAmountCollected || 0), 0);
  const totalPendingAll = pgs.reduce((a, b) => a + (b.pendingPaymentAmount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            Payment Groups (PGs) & Branch Operations
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
              {pgs.length} Active Hubs
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable collection points, area branches, collector assignments, and collection rate reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedPG !== 'ALL' && onSelectPG && (
            <button
              onClick={() => onSelectPG('ALL')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear Filter
            </button>
          )}

          <button
            onClick={onOpenAddPG}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Payment Group</span>
          </button>
        </div>
      </div>

      {/* Filter Active Notice Banner */}
      {selectedPG !== 'ALL' && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-900 font-medium">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>
              Dashboard & views currently filtered for: <strong>{pgs.find(p => p.id === selectedPG)?.name || selectedPG}</strong>
            </span>
          </div>
          {onSelectPG && (
            <button
              onClick={() => onSelectPG('ALL')}
              className="font-bold text-sky-700 hover:underline"
            >
              Reset to All PGs
            </button>
          )}
        </div>
      )}

      {/* Top Aggregate Rollup Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Combined PG Monthly Billing
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatINR(totalBilledAll)}
          </span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Combined PG Realized Collection
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            {formatINR(totalCollectedAll)}
          </span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
            Total Pending Arrears Across PGs
          </span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            {formatINR(totalPendingAll)}
          </span>
        </div>
      </div>

      {/* Grid of PGs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pgs.map((pg) => {
          const rate = pg.collectionRate || 0;
          const isSelected = selectedPG === pg.id;

          return (
            <div
              key={pg.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{pg.name}</h3>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {pg.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {pg.area_location}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isSelected ? 'Selected Filter' : 'Active Branch'}
                  </span>
                </div>

                {/* Collector details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Collector</span>
                    <strong className="text-slate-800">{pg.collector_name}</strong>
                    {pg.collector_username && (
                      <span className="text-[10px] text-sky-600 font-mono block">@{pg.collector_username}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                    <a href={`tel:${pg.collector_phone}`} className="text-sky-600 font-mono font-bold hover:underline">
                      {pg.collector_phone || 'None'}
                    </a>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-1.5 xs:gap-2 text-center text-xs mb-4">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                    <span className="text-[10px] xs:text-[11px] text-slate-500 block truncate">Total Billed</span>
                    <strong className="text-slate-900 font-bold block mt-0.5 text-[11px] xs:text-xs sm:text-sm truncate">{formatINR(pg.monthlyBillingAmount)}</strong>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-0">
                    <span className="text-[10px] xs:text-[11px] text-emerald-800 block truncate">Collected</span>
                    <strong className="text-emerald-700 font-bold block mt-0.5 text-[11px] xs:text-xs sm:text-sm truncate">{formatINR(pg.totalAmountCollected)}</strong>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 min-w-0">
                    <span className="text-[10px] xs:text-[11px] text-rose-800 block truncate">Pending</span>
                    <strong className="text-rose-600 font-bold block mt-0.5 text-[11px] xs:text-xs sm:text-sm truncate">{formatINR(pg.pendingPaymentAmount)}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Monthly Collection Efficiency</span>
                    <span className="text-slate-900">{rate}% Realized</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    />
                  </div>
                </div>

                {/* Clients Breakdown */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-semibold truncate">
                    <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{pg.activeClients} Active / {pg.totalClients} Total</span>
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-emerald-700 font-bold">✓ {pg.paidClients} Paid</span>
                    <span className="text-rose-600 font-bold">✗ {pg.unpaidClients} Unpaid</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: TWO SEPARATE ACTIONS */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400">ID: {pg.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onFilterDashboard(pg.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Filter main dashboard metrics by this PG"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Filter Dashboard</span>
                  </button>

                  <button
                    onClick={() => onViewClients(pg.id)}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    title="View subscribers list filtered for this PG"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Clients</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
