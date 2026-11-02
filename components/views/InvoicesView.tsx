'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  CreditCard, 
  Search, 
  RotateCw,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface InvoicesViewProps {
  onPrintInvoice: (invoiceId: string) => void;
  onOpenRecordPayment: (client: any) => void;
  pgList: Array<{ id: string; name: string }>;
}

export default function InvoicesView({
  onPrintInvoice,
  onOpenRecordPayment,
  pgList,
}: InvoicesViewProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedPG, setSelectedPG] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  // Bill type choice for batch generator
  const [batchBillType, setBatchBillType] = useState<'WITH_GST' | 'WITHOUT_GST'>('WITH_GST');

  useEffect(() => {
    fetchInvoices();
  }, [selectedPG, selectedStatus, search]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pgId: selectedPG,
        status: selectedStatus,
        q: search,
      });
      const res = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBatchInvoices = async () => {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const gstNotice = batchBillType === 'WITH_GST' ? 'WITH GST (18%)' : 'WITHOUT GST (Plain Bill)';
    if (!confirm(`Run batch monthly invoice generation for ${currentMonth} (${gstNotice})? Existing invoices for this period will be safely skipped.`)) {
      return;
    }

    setIsGeneratingBatch(true);
    setBatchResult(null);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'batch',
          billing_period: currentMonth,
          pg_id: selectedPG,
          bill_type: batchBillType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBatchResult(json.message);
        fetchInvoices();
      } else {
        alert(json.error || 'Failed to generate batch invoices');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const totalInvoiced = invoices.reduce((a, b) => a + (b.total_amount || 0), 0);
  const totalPaid = invoices.reduce((a, b) => a + (b.amount_paid || 0), 0);
  const totalBalance = invoices.reduce((a, b) => a + (b.balance_due || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Billing & Invoices Management
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
              {invoices.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Generate monthly subscription bills with GST or without GST (zero mention of GST on bill)
          </p>
        </div>

        {/* Batch Generation Control */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* GST Option Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBatchBillType('WITH_GST')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                batchBillType === 'WITH_GST' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              With GST (18%)
            </button>
            <button
              type="button"
              onClick={() => setBatchBillType('WITHOUT_GST')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                batchBillType === 'WITHOUT_GST' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Without GST
            </button>
          </div>

          <button
            onClick={handleRunBatchInvoices}
            disabled={isGeneratingBatch}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 hover:shadow-sky-600/30 transition-all flex items-center gap-1.5"
          >
            <RotateCw className={`w-4 h-4 ${isGeneratingBatch ? 'animate-spin' : ''}`} />
            <span>{isGeneratingBatch ? 'Generating...' : 'Run Batch Generation'}</span>
          </button>
        </div>
      </div>

      {batchResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{batchResult}</span>
          <button onClick={() => setBatchResult(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial rollups */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Filtered Total Invoiced
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block">
            {formatINR(totalInvoiced)}
          </span>
        </div>
        <div className="bg-emerald-50/50 p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Filtered Amount Collected
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 block">
            {formatINR(totalPaid)}
          </span>
        </div>
        <div className="bg-rose-50/50 p-3.5 sm:p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
            Filtered Pending Balance
          </span>
          <span className="text-lg sm:text-xl font-black text-rose-600 mt-0.5 block">
            {formatINR(totalBalance)}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table & Mobile Card View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No invoices matching filter criteria.
          </div>
        ) : (
          <>
            {/* Mobile Card List (Visible on phones & small screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {invoices.map((inv) => {
                const hasGst = inv.is_gst === 1 || (inv.tax_amount > 0 && inv.tax_rate > 0);

                return (
                  <div key={inv.id} className="p-3.5 hover:bg-slate-50/70 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 block w-fit mb-1">
                          {inv.id}
                        </span>
                        <p className="font-bold text-slate-900 text-sm truncate">{inv.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{inv.customer_mobile}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            inv.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.payment_status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          hasGst ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hasGst ? 'GST 18%' : 'Regular'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Billing Period</span>
                        <span className="font-semibold text-slate-800">{inv.billing_period}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{inv.pg_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Due / Balance</span>
                        <span className="font-bold text-slate-900 font-mono">{formatINR(inv.total_amount)}</span>
                        <span className={`block font-black font-mono text-[11px] ${inv.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Due: {formatINR(inv.balance_due)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        Due Date: <strong className="font-mono text-slate-700">{inv.due_date}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onPrintInvoice(inv.id)}
                          title="Print / Save PDF"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        {inv.balance_due > 0 && (
                          <button
                            onClick={() => onOpenRecordPayment({
                              id: inv.customer_id,
                              name: inv.customer_name,
                              mobile: inv.customer_mobile,
                              pg_id: inv.pg_id,
                              pg_name: inv.pg_name,
                              total_outstanding: inv.balance_due,
                              latest_invoice_id: inv.id,
                              monthly_price: inv.total_amount,
                              payment_due_date: inv.due_date,
                            })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on tablet & desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Name & Mobile</th>
                    <th className="py-3 px-4">PG</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => {
                    const hasGst = inv.is_gst === 1 || (inv.tax_amount > 0 && inv.tax_rate > 0);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{inv.customer_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{inv.customer_mobile}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{inv.pg_name}</td>
                        <td className="py-3 px-4 font-medium">{inv.billing_period}</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-700">{inv.due_date}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.total_amount)}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">{formatINR(inv.balance_due)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            hasGst ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {hasGst ? 'GST' : 'Regular'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              inv.payment_status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.payment_status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {inv.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onPrintInvoice(inv.id)}
                              title="Print / Save PDF"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                            {inv.balance_due > 0 && (
                              <button
                                onClick={() => onOpenRecordPayment({
                                  id: inv.customer_id,
                                  name: inv.customer_name,
                                  mobile: inv.customer_mobile,
                                  pg_id: inv.pg_id,
                                  pg_name: inv.pg_name,
                                  total_outstanding: inv.balance_due,
                                  latest_invoice_id: inv.id,
                                  monthly_price: inv.total_amount,
                                  payment_due_date: inv.due_date,
                                })}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition-colors"
                              >
                                Pay
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
