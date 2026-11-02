'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Smartphone, 
  Banknote, 
  Building,
  User
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  pgList: Array<{ id: string; name: string }>;
}

export default function PaymentsView({ onOpenRecordPayment, pgList }: PaymentsViewProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPG, setSelectedPG] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [selectedPG, selectedMethod, search]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pgId: selectedPG,
        method: selectedMethod,
        q: search,
      });
      const res = await fetch(`/api/payments?${params}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.payments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCollected = payments.reduce((a, b) => a + (b.amount_received || 0), 0);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = [
      'Receipt ID',
      'Date',
      'Customer ID',
      'Customer Name',
      'Mobile',
      'Payment Group',
      'Amount Received',
      'Method',
      'Transaction Ref',
      'Collected By',
      'Notes',
    ];

    const rows = payments.map((p) => [
      p.id,
      p.payment_date,
      p.customer_id,
      `"${p.customer_name}"`,
      p.customer_mobile,
      `"${p.pg_name}"`,
      p.amount_received,
      p.payment_method,
      `"${p.transaction_ref || ''}"`,
      `"${p.collected_by}"`,
      `"${p.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Speedway_Payment_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'UPI':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold"><Smartphone className="w-3 h-3" /> UPI</span>;
      case 'CASH':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold"><Banknote className="w-3 h-3" /> Cash</span>;
      case 'BANK TRANSFER':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold"><Building className="w-3 h-3" /> Bank</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{method}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Payment Collections & Transaction Ledger
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {payments.length} Receipts
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time audit log of cash, UPI, and bank collections with reference verification
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
            onClick={onOpenRecordPayment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Aggregate Collection Banner */}
      <div className="bg-emerald-500 text-white p-4 sm:p-5 rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs uppercase font-bold text-emerald-100 tracking-wider">
            Total Filtered Collections Realized
          </span>
          <span className="text-2xl sm:text-3xl font-black tracking-tight mt-1 block">
            {formatINR(totalCollected)}
          </span>
        </div>
        <div className="text-xs text-emerald-100 bg-emerald-600/60 p-2.5 rounded-xl border border-emerald-400/40">
          All receipts are verified against invoices and calculate the customer's next billing anniversary automatically.
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt ID, transaction ref, customer name..."
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
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none font-semibold text-slate-700"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table & Mobile Card View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No transactions matching filter criteria.
          </div>
        ) : (
          <>
            {/* Mobile Card List (Visible on phones & small screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {payments.map((p) => (
                <div key={p.id} className="p-3.5 hover:bg-slate-50/70 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit mb-1">
                        {p.id}
                      </span>
                      <p className="font-bold text-slate-900 text-sm truncate">{p.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.customer_id} • {p.customer_mobile}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-emerald-600 font-mono text-base block">
                        +{formatINR(p.amount_received)}
                      </span>
                      <div className="mt-1 flex justify-end">
                        {getMethodBadge(p.payment_method)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Group & Date</span>
                      <span className="font-semibold text-slate-800 truncate block">{p.pg_name}</span>
                      <span className="font-mono text-slate-600 text-[11px]">{p.payment_date}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Collected By</span>
                      <span className="font-medium text-slate-700 block truncate">{p.collected_by}</span>
                      {p.transaction_ref && (
                        <span className="font-mono text-[10px] text-slate-500 truncate block">Ref: {p.transaction_ref}</span>
                      )}
                    </div>
                  </div>

                  {p.notes && (
                    <p className="text-[11px] text-slate-500 italic px-1">Note: {p.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (Visible on tablet & desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Customer Name & ID</th>
                    <th className="py-3 px-4">Payment Group</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Txn Ref / UTR</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4">Collected By</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{p.payment_date}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.customer_id}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{p.pg_name}</td>
                      <td className="py-3 px-4">{getMethodBadge(p.payment_method)}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.transaction_ref || 'N/A'}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                        +{formatINR(p.amount_received)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.collected_by}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[150px]">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
