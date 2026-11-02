'use client';

import React from 'react';
import { Building2, TrendingUp, Users, ArrowRight, CheckCircle2, Clock, Filter, Eye } from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface PGStat {
  id: string;
  name: string;
  code: string;
  area_location: string;
  collector_name: string;
  collector_phone: string;
  totalClients: number;
  activeClients: number;
  paidClients: number;
  unpaidClients: number;
  billedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionRate: number;
}

interface PGComparisonWidgetProps {
  pgStats: PGStat[];
  onSelectPG: (pgId: string) => void;
  onViewClients?: (pgId: string) => void;
  selectedPG: string;
}

export default function PGComparisonWidget({
  pgStats,
  onSelectPG,
  onViewClients,
  selectedPG,
}: PGComparisonWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Payment Groups (PGs) Collection & Performance
              {selectedPG !== 'ALL' && (
                <span className="px-2 py-0.5 text-xs font-black rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Filtered: {pgStats.find((p) => p.id === selectedPG)?.name || selectedPG}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Comparative collection rates, assigned collectors, and pending arrears across operational branches
            </p>
          </div>
        </div>

        {selectedPG !== 'ALL' && (
          <button
            onClick={() => onSelectPG('ALL')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors self-start sm:self-auto"
          >
            ✕ Clear Filter (Show All Hubs)
          </button>
        )}
      </div>

      {/* Grid of PG Cards - 2x2 grid when paired with Due Today widget */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {pgStats.map((pg) => {
          const isSelected = selectedPG === pg.id;
          const rate = pg.collectionRate || 0;

          return (
            <div
              key={pg.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/30 shadow-md'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* PG Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{pg.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{pg.area_location}</p>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                    {pg.code}
                  </span>
                </div>

                {/* Collector Info */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-[11px] text-slate-600 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Collector</span>
                    <strong className="text-slate-800 truncate">{pg.collector_name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Contact</span>
                    <a href={`tel:${pg.collector_phone}`} className="text-sky-600 font-mono font-bold hover:underline">
                      {pg.collector_phone}
                    </a>
                  </div>
                </div>

                {/* Financial Metrics */}
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collected:</span>
                    <span className="font-bold text-emerald-600">{formatINR(pg.collectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Arrears:</span>
                    <span className="font-bold text-rose-600">{formatINR(pg.pendingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Billed:</span>
                    <span className="font-semibold text-slate-700">{formatINR(pg.billedAmount)}</span>
                  </div>
                </div>

                {/* Collection Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-600">Collection Rate</span>
                    <span className="text-slate-900">{rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    />
                  </div>
                </div>

                {/* Client count summary */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mb-3">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="w-3 h-3 text-sky-600" />
                    {pg.activeClients} Active / {pg.totalClients} Total
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {pg.paidClients} Paid
                  </span>
                </div>
              </div>

              {/* Action Buttons: Filter Dashboard & View Clients */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectPG(isSelected ? 'ALL' : pg.id)}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={isSelected ? 'Reset filter to show all' : 'Filter complete dashboard for this PG'}
                >
                  <Filter className="w-3 h-3" />
                  <span>{isSelected ? 'Filtered' : 'Filter Hub'}</span>
                </button>

                {onViewClients && (
                  <button
                    type="button"
                    onClick={() => onViewClients(pg.id)}
                    className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold rounded-lg border border-sky-200 transition-all text-center flex items-center justify-center gap-1"
                    title="View client records assigned to this PG"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Subscribers</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
