'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Users, 
  CreditCard,
  CircleDollarSign,
  PieChart
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface ReportsViewProps {
  pgList: Array<{ id: string; name: string }>;
}

export default function ReportsView({ pgList }: ReportsViewProps) {
  const [data, setData] = useState<any>(null);
  const [selectedPG, setSelectedPG] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [selectedPG]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?pgId=${selectedPG}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportOutstandingCSV = () => {
    const list = data?.clientOutstandingReport || [];
    if (list.length === 0) return;
    const headers = ['Client ID', 'Client Name', 'Mobile', 'PG', 'Payment Due Date', 'Status', 'Outstanding Amount'];
    const rows = list.map((c: any) => [
      c.id,
      `"${c.name}"`,
      c.mobile,
      `"${c.pg_name}"`,
      c.payment_due_date,
      c.payment_status,
      c.balance_due,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Speedway_Outstanding_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Financial Analytics & Executive Reports
          </h2>
          <p className="text-xs text-slate-500">
            Realized cash collections, net revenue after expenses, PG breakdown, and client arrears
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPG}
            onChange={(e) => setSelectedPG(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
          >
            <option value="ALL">All Payment Groups</option>
            {pgList.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportOutstandingCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Arrears CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-500 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/20">
          <span className="text-xs uppercase font-bold text-emerald-100 tracking-wider block">
            Gross Collections Realized
          </span>
          <span className="text-2xl font-black mt-1 block">
            {formatINR(data?.financialSummary?.totalRevenueCollected || 0)}
          </span>
          <span className="text-[11px] text-emerald-100 mt-1 block">
            Direct subscriber payments recorded
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
            Operating Expenses Logged
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {formatINR(data?.financialSummary?.totalExpenses || 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Bandwidth upstream & field fiber maintenance
          </span>
        </div>

        <div className="bg-sky-600 text-white p-5 rounded-2xl shadow-lg shadow-sky-600/20">
          <span className="text-xs uppercase font-bold text-sky-100 tracking-wider block">
            Net Cash Flow
          </span>
          <span className="text-2xl font-black mt-1 block">
            {formatINR(data?.financialSummary?.netCashFlow || 0)}
          </span>
          <span className="text-[11px] text-sky-100 mt-1 block">
            Gross collections minus operational overhead
          </span>
        </div>
      </div>

      {/* Grid: Daily Collections & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Collections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              Daily Collection History (Recent Days)
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
            {(data?.dailyCollections || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No daily data recorded</p>
            ) : (
              (data?.dailyCollections || []).map((d: any) => (
                <div key={d.payment_date} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-800">{d.payment_date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{d.count} transactions</span>
                    <span className="font-bold text-emerald-600">{formatINR(d.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Payment Method Breakdown
            </h3>
          </div>
          <div className="space-y-3">
            {(data?.methodReport || []).map((m: any) => {
              const totalRev = data?.financialSummary?.totalRevenueCollected || 1;
              const pct = Math.round((m.total / totalRev) * 100);
              return (
                <div key={m.payment_method}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">{m.payment_method} ({m.count} txns)</span>
                    <span className="font-bold text-slate-900">{formatINR(m.total)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Client Outstanding Balances Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Client-Wise Outstanding Balance & Aging Arrears
            </h3>
            <p className="text-xs text-slate-500">Unsettled customer invoices ranked by highest balance due</p>
          </div>
        </div>

        {/* Mobile View: Outstanding Balances Card List */}
        <div className="block md:hidden divide-y divide-slate-100">
          {(data?.clientOutstandingReport || []).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No outstanding client balances recorded!
            </div>
          ) : (
            (data?.clientOutstandingReport || []).map((c: any) => (
              <div key={c.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{c.id} • {c.mobile}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-black text-rose-600 block">
                      {formatINR(c.balance_due)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Balance Due</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1.5 border-t border-slate-100">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {c.pg_name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">{c.unpaid_invoices_count} inv</span>
                    <span className="font-mono font-bold text-rose-700">Due: {c.payment_due_date}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Client ID & Name</th>
                <th className="py-3 px-4">Payment Group</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Unpaid Invoices</th>
                <th className="py-3 px-4 text-right">Total Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(data?.clientOutstandingReport || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No outstanding client balances recorded!
                  </td>
                </tr>
              ) : (
                (data?.clientOutstandingReport || []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{c.id} • {c.mobile}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{c.pg_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{c.payment_due_date}</td>
                    <td className="py-3 px-4">{c.unpaid_invoices_count} Invoice(s)</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                      {formatINR(c.balance_due)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
