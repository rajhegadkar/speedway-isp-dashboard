'use client';

import React from 'react';
import { CreditCard, CheckCircle2, QrCode, Banknote, Building, Smartphone } from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface PaymentItem {
  id: string;
  customer_name: string;
  customer_id: string;
  pg_name: string;
  amount_received: number;
  payment_date: string;
  payment_method: string;
  transaction_ref: string;
  collected_by: string;
}

interface RecentPaymentsWidgetProps {
  payments: PaymentItem[];
  onViewCustomer?: (customerId: string) => void;
}

export default function RecentPaymentsWidget({ payments, onViewCustomer }: RecentPaymentsWidgetProps) {
  const getMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
      case 'CASH':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'BANK TRANSFER':
        return <Building className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Payment Collections</h3>
            <p className="text-xs text-slate-500">Live audit of verified incoming client subscriptions</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Live Sync
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
        {payments.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No payment receipts logged yet.</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {p.customer_name}
                  </span>
                  <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                    {p.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-[10px] xs:text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 shrink-0">
                    {getMethodIcon(p.payment_method)}
                    {p.payment_method}
                  </span>
                  <span>•</span>
                  <span className="truncate">{p.pg_name}</span>
                  {p.transaction_ref && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[90px] xs:max-w-[140px]">Ref: {p.transaction_ref}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-emerald-600 text-xs sm:text-sm block">
                  +{formatINR(p.amount_received)}
                </span>
                <span className="text-[9px] xs:text-[10px] text-slate-400 font-mono block truncate max-w-[110px] xs:max-w-none">
                  {p.payment_date} • {p.collected_by}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
