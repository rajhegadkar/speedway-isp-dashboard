'use client';

import React from 'react';
import { Clock, Send, CreditCard, CheckCircle2, Phone, Calendar } from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface ClientItem {
  id: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  pg_name: string;
  plan_name: string;
  monthly_price: number;
  payment_due_date: string;
  daysDiff: number;
}

interface DueTodayWidgetProps {
  dueTodayList: ClientItem[];
  upcomingList: ClientItem[];
  onOpenPayment: (client: ClientItem) => void;
  onOpenReminder: (client: ClientItem, type: 'DUE_TODAY' | 'UPCOMING') => void;
  onViewClient: (clientId: string) => void;
  onViewAllDueToday?: () => void;
}

export default function DueTodayWidget({
  dueTodayList,
  upcomingList,
  onOpenPayment,
  onOpenReminder,
  onViewClient,
  onViewAllDueToday,
}: DueTodayWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 animate-pulse">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Bills Due Today & Tomorrow
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-100 text-amber-800">
                {dueTodayList.length} Due Today
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Immediate action: Send friendly WhatsApp reminder before 12 PM or record collection
            </p>
          </div>
        </div>

        {onViewAllDueToday && (
          <button
            onClick={onViewAllDueToday}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
          >
            <span>Filter Client Directory ({dueTodayList.length})</span>
            <span className="text-base leading-none">→</span>
          </button>
        )}
      </div>

      <div className="p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {dueTodayList.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">No client bills due today!</p>
            <p className="text-xs text-slate-400">All clients for this cycle have either paid or are scheduled later.</p>
          </div>
        ) : (
          dueTodayList.map((client) => (
            <div key={client.id} className="py-3 flex items-center justify-between gap-3 hover:bg-amber-50/40 px-2 rounded-xl transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewClient(client.id)}
                    className="font-bold text-slate-900 hover:text-sky-600 truncate text-sm"
                  >
                    {client.name}
                  </button>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                    DUE TODAY
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-slate-600">{client.id}</span>
                  <span>•</span>
                  <span>{client.pg_name}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-900">{formatINR(client.monthly_price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenReminder(client, 'DUE_TODAY')}
                  title="WhatsApp Reminder"
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onOpenPayment(client)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Upcoming in next 3 days section */}
        {upcomingList.length > 0 && (
          <div className="pt-3 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Upcoming in Next 7 Days ({upcomingList.length})
            </h4>
            <div className="space-y-2">
              {upcomingList.slice(0, 3).map((client) => (
                <div key={client.id} className="py-2 px-2 flex items-center justify-between text-xs bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-semibold text-slate-800">{client.name}</span>
                    <span className="text-slate-400 ml-2">({client.pg_name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold">{formatINR(client.monthly_price)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px]">
                      Due in {client.daysDiff}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
