'use client';

import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CircleDollarSign, 
  Wallet, 
  TrendingDown, 
  Hourglass, 
  Flame,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface Metrics {
  totalActiveClients: number;
  totalInactiveClients: number;
  totalSuspendedClients: number;
  totalClientsDueToday: number;
  totalOverdueClients: number;
  totalPaidClientsThisMonth: number;
  totalUnpaidClients: number;
  totalMonthlyBillingAmount: number;
  totalAmountCollectedThisMonth: number;
  totalOutstandingAmount: number;
  clientsExpiringSoon: number;
  plansExpiringToday: number;
}

interface SummaryCardsProps {
  metrics: Metrics;
  onFilterClick?: (filterKey: string, targetTab?: string, label?: string) => void;
}

export default function SummaryCards({ metrics, onFilterClick }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Active Clients',
      value: metrics.totalActiveClients,
      subtext: 'Operational links (Blue)',
      icon: UserCheck,
      cardBg: 'bg-white border-slate-200 hover:border-blue-400',
      iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
      filterKey: 'ACTIVE',
      targetTab: 'clients',
      label: 'Active Subscribers',
      isCurrency: false,
    },
    {
      title: 'Due Today',
      value: metrics.totalClientsDueToday,
      subtext: 'Requires collection (Orange)',
      icon: Clock,
      cardBg: metrics.totalClientsDueToday > 0 ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300 hover:border-amber-400' : 'bg-white border-slate-200 hover:border-amber-400',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
      filterKey: 'DUE_TODAY',
      targetTab: 'clients',
      label: 'Due Today',
      alert: metrics.totalClientsDueToday > 0,
      isCurrency: false,
    },
    {
      title: 'Overdue Clients',
      value: metrics.totalOverdueClients,
      subtext: 'Immediate action (Red)',
      icon: AlertTriangle,
      cardBg: metrics.totalOverdueClients > 0 ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 hover:border-rose-400' : 'bg-white border-slate-200 hover:border-rose-400',
      iconBg: 'bg-rose-600 text-white shadow-rose-600/20',
      filterKey: 'OVERDUE',
      targetTab: 'clients',
      label: 'Overdue Clients',
      alert: metrics.totalOverdueClients > 0,
      isCurrency: false,
    },
    {
      title: 'Paid This Month',
      value: metrics.totalPaidClientsThisMonth,
      subtext: 'Settled this cycle (Green)',
      icon: CheckCircle2,
      cardBg: 'bg-white border-slate-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
      filterKey: 'PAID',
      targetTab: 'clients',
      label: 'Paid Subscribers',
      isCurrency: false,
    },
    {
      title: 'Unpaid Clients',
      value: metrics.totalUnpaidClients,
      subtext: 'Pending payment',
      icon: Hourglass,
      cardBg: 'bg-white border-slate-200 hover:border-slate-400',
      iconBg: 'bg-slate-700 text-white shadow-slate-700/20',
      filterKey: 'UNPAID',
      targetTab: 'clients',
      label: 'Unpaid / Pending Subscribers',
      isCurrency: false,
    },
    {
      title: 'Inactive / Off',
      value: metrics.totalInactiveClients,
      subtext: 'Dormant links (Grey)',
      icon: UserX,
      cardBg: 'bg-white border-slate-200 hover:border-gray-400',
      iconBg: 'bg-gray-400 text-white shadow-gray-400/20',
      filterKey: 'INACTIVE',
      targetTab: 'clients',
      label: 'Inactive / Disconnected',
      isCurrency: false,
    },
    {
      title: 'Monthly Billing',
      value: formatINR(metrics.totalMonthlyBillingAmount),
      subtext: 'Invoiced this cycle',
      icon: CircleDollarSign,
      cardBg: 'bg-white border-slate-200 hover:border-sky-400',
      iconBg: 'bg-sky-600 text-white shadow-sky-600/20',
      filterKey: 'ALL',
      targetTab: 'invoices',
      label: 'Monthly Invoices',
      isCurrency: true,
      valueColor: 'text-slate-900',
    },
    {
      title: 'Total Collected',
      value: formatINR(metrics.totalAmountCollectedThisMonth),
      subtext: 'Realized receipts (Green)',
      icon: Wallet,
      cardBg: 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
      filterKey: 'ALL',
      targetTab: 'payments',
      label: 'Collection Receipts',
      isCurrency: true,
      valueColor: 'text-emerald-700',
    },
    {
      title: 'Total Outstanding',
      value: formatINR(metrics.totalOutstandingAmount),
      subtext: 'Pending arrears (Red)',
      icon: TrendingDown,
      cardBg: 'bg-rose-50/40 border-rose-200 hover:border-rose-400',
      iconBg: 'bg-rose-600 text-white shadow-rose-600/20',
      filterKey: 'UNPAID',
      targetTab: 'invoices',
      label: 'Pending Invoices',
      isCurrency: true,
      valueColor: 'text-rose-600',
    },
    {
      title: 'Expiring in 7 Days',
      value: metrics.clientsExpiringSoon,
      subtext: 'Approaching due (Orange)',
      icon: Clock,
      cardBg: 'bg-white border-slate-200 hover:border-orange-400',
      iconBg: 'bg-orange-500 text-white shadow-orange-500/20',
      filterKey: 'DUE_SOON',
      targetTab: 'clients',
      label: 'Expiring Soon (Next 7 Days)',
      isCurrency: false,
    },
    {
      title: 'Plans Expiring Today',
      value: metrics.plansExpiringToday,
      subtext: 'Renew today (Orange)',
      icon: Flame,
      cardBg: 'bg-white border-slate-200 hover:border-amber-400',
      iconBg: 'bg-amber-600 text-white shadow-amber-600/20',
      filterKey: 'RENEWAL_TODAY',
      targetTab: 'clients',
      label: 'Plans Expiring Today',
      isCurrency: false,
    },
    {
      title: 'Suspended Lines',
      value: metrics.totalSuspendedClients,
      subtext: 'Overdue paused',
      icon: ShieldAlert,
      cardBg: 'bg-white border-slate-200 hover:border-purple-400',
      iconBg: 'bg-purple-600 text-white shadow-purple-600/20',
      filterKey: 'SUSPENDED',
      targetTab: 'clients',
      label: 'Suspended Lines',
      isCurrency: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => onFilterClick && onFilterClick(card.filterKey, card.targetTab, card.label)}
            title={`Click to filter: ${card.label}`}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group ${
              card.cardBg || 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110 ${card.iconBg}`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-0.5 sm:mt-1">
                <span className={`font-black tracking-tight block truncate font-mono ${card.valueColor || 'text-slate-900'} ${
                  card.isCurrency ? 'text-sm xs:text-base sm:text-lg lg:text-xl' : 'text-lg xs:text-2xl lg:text-3xl'
                }`}>
                  {card.value}
                </span>
              </div>
            </div>

            <div className="mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
              <span className="truncate">{card.subtext}</span>
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 ml-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
