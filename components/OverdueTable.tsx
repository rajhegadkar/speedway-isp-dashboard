'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Send, 
  CreditCard, 
  Phone, 
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface OverdueClient {
  id: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  pg_name: string;
  plan_name: string;
  monthly_price: number;
  payment_due_date: string;
  daysOverdue: number;
  connection_status: string;
  latest_invoice_id?: string;
}

interface OverdueTableProps {
  overdueBuckets: {
    overdue1to7: OverdueClient[];
    overdue8to15: OverdueClient[];
    overdue15Plus: OverdueClient[];
  };
  onOpenPayment: (client: OverdueClient) => void;
  onOpenReminder: (client: OverdueClient, type: 'OVERDUE') => void;
  onViewClient: (clientId: string) => void;
  onViewAllOverdue?: (bucketFilter?: string) => void;
}

export default function OverdueTable({
  overdueBuckets,
  onOpenPayment,
  onOpenReminder,
  onViewClient,
  onViewAllOverdue,
}: OverdueTableProps) {
  const [activeBucket, setActiveBucket] = useState<'ALL' | '1-7' | '8-15' | '15+'>('ALL');

  const list1to7 = overdueBuckets.overdue1to7 || [];
  const list8to15 = overdueBuckets.overdue8to15 || [];
  const list15Plus = overdueBuckets.overdue15Plus || [];

  let displayedList: OverdueClient[] = [];
  if (activeBucket === '1-7') displayedList = list1to7;
  else if (activeBucket === '8-15') displayedList = list8to15;
  else if (activeBucket === '15+') displayedList = list15Plus;
  else displayedList = [...list15Plus, ...list8to15, ...list1to7];

  const totalOverdueCount = list1to7.length + list8to15.length + list15Plus.length;

  const handleFilterDirectory = () => {
    if (!onViewAllOverdue) return;
    if (activeBucket === '1-7') onViewAllOverdue('OVERDUE_1_7');
    else if (activeBucket === '8-15') onViewAllOverdue('OVERDUE_8_15');
    else if (activeBucket === '15+') onViewAllOverdue('OVERDUE_15_PLUS');
    else onViewAllOverdue('OVERDUE');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Overdue Collections & Critical Follow-ups
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-100 text-rose-800">
                {totalOverdueCount} Clients
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Clients past their billing due date requiring immediate collection or reminder
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bucket filter pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveBucket('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeBucket === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              All ({totalOverdueCount})
            </button>
            <button
              onClick={() => setActiveBucket('1-7')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeBucket === '1-7' ? 'bg-rose-50 text-rose-700 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              1–7d ({list1to7.length})
            </button>
            <button
              onClick={() => setActiveBucket('8-15')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeBucket === '8-15' ? 'bg-rose-100 text-rose-800 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              8–15d ({list8to15.length})
            </button>
            <button
              onClick={() => setActiveBucket('15+')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeBucket === '15+' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              &gt;15d ({list15Plus.length})
            </button>
          </div>

          {onViewAllOverdue && (
            <button
              onClick={handleFilterDirectory}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1 shadow-sm"
              title="Open client directory filtered by this overdue bucket"
            >
              <span>Filter Directory</span>
              <span className="text-base leading-none">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Table & Mobile Card Content */}
      <div>
        {displayedList.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-600">No overdue clients in this category!</p>
            <p className="text-xs text-slate-400">All collections for this period are settled on time.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (Visible on phones & small screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {displayedList.map((client) => {
                const isCritical = client.daysOverdue > 15;
                const isMedium = client.daysOverdue >= 8 && client.daysOverdue <= 15;

                return (
                  <div key={client.id} className="p-3.5 hover:bg-rose-50/30 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          onClick={() => onViewClient(client.id)}
                          className="font-bold text-sm text-slate-900 hover:text-sky-600 truncate block text-left"
                        >
                          {client.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 rounded text-slate-700 text-[10px]">{client.id}</span>
                          <span>•</span>
                          <a href={`tel:${client.mobile}`} className="text-sky-600 font-medium hover:underline">{client.mobile}</a>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                          isCritical
                            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                            : isMedium
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isCritical && <ShieldAlert className="w-3 h-3" />}
                        {client.daysOverdue}d late
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Plan & Group</span>
                        <span className="font-semibold text-slate-800 truncate block">{client.plan_name} • {client.pg_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Amount Due</span>
                        <span className="font-black text-rose-600 font-mono text-sm">{formatINR(client.monthly_price)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-500">
                        Due: <strong className="font-mono text-slate-700">{client.payment_due_date}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenReminder(client, 'OVERDUE')}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>
                        <button
                          onClick={() => onOpenPayment(client)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </button>
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
                    <th className="py-3 px-4">Client ID & Name</th>
                    <th className="py-3 px-4">Payment Group</th>
                    <th className="py-3 px-4">Plan & Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Days Overdue</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedList.map((client) => {
                    const isCritical = client.daysOverdue > 15;
                    const isMedium = client.daysOverdue >= 8 && client.daysOverdue <= 15;

                    return (
                      <tr key={client.id} className="hover:bg-rose-50/30 transition-colors">
                        {/* Client Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onViewClient(client.id)}
                              className="font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1 group"
                            >
                              {client.name}
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                            <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{client.id}</span>
                            <span>•</span>
                            <a href={`tel:${client.mobile}`} className="hover:underline flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {client.mobile}
                            </a>
                          </div>
                        </td>

                        {/* PG */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{client.pg_name}</span>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{formatINR(client.monthly_price)}</p>
                          <p className="text-[11px] text-slate-500">{client.plan_name}</p>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-700 font-semibold">{client.payment_due_date}</span>
                        </td>

                        {/* Days Overdue Tag */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isCritical
                                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                : isMedium
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isCritical && <ShieldAlert className="w-3 h-3" />}
                            {client.daysOverdue} days late
                          </span>
                        </td>

                        {/* Connection Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              client.connection_status === 'ACTIVE'
                                ? 'bg-sky-50 text-sky-700'
                                : client.connection_status === 'SUSPENDED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {client.connection_status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onOpenReminder(client, 'OVERDUE')}
                              title="Send WhatsApp Reminder"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => onOpenPayment(client)}
                              title="Record Immediate Payment"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Now</span>
                            </button>
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
