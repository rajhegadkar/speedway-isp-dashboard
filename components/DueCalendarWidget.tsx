'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getTodayDateString } from '@/lib/billing-engine';

interface DueCalendarWidgetProps {
  onDayClick?: (dayDate: string) => void;
  dueTodayList: Array<{ payment_due_date: string }>;
  allClients: Array<{ payment_due_date: string; payment_status: string }>;
}

export default function DueCalendarWidget({
  onDayClick,
  dueTodayList,
  allClients = [],
}: DueCalendarWidgetProps) {
  const today = getTodayDateString();
  const [selectedDay, setSelectedDay] = useState(today);

  // Group clients due date count by day of current month (2026-10)
  const dueCountByDate: Record<string, { total: number; unpaid: number }> = {};

  allClients.forEach((c) => {
    if (c.payment_due_date) {
      if (!dueCountByDate[c.payment_due_date]) {
        dueCountByDate[c.payment_due_date] = { total: 0, unpaid: 0 };
      }
      dueCountByDate[c.payment_due_date].total++;
      if (c.payment_status !== 'PAID') {
        dueCountByDate[c.payment_due_date].unpaid++;
      }
    }
  });

  // Days in October 2026 (31 days, starts on Thursday Oct 1)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-10-${String(dayNum).padStart(2, '0')}`;
    const stats = dueCountByDate[dateStr] || { total: 0, unpaid: 0 };
    return {
      dayNum,
      dateStr,
      isToday: dateStr === today,
      isPast: dateStr < today,
      stats,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Due Date Calendar Heatmap</h3>
            <p className="text-xs text-slate-500">October 2026 • Client renewal & collection density</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-semibold flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paid
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Due Today
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Overdue
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* Days Grid (Oct 1 2026 is Thursday, so offset by 4 blank slots) */}
      <div className="grid grid-cols-7 gap-1">
        <div className="h-10"></div>
        <div className="h-10"></div>
        <div className="h-10"></div>
        <div className="h-10"></div>

        {daysInMonth.map((d) => {
          const hasUnpaid = d.stats.unpaid > 0;
          const isSelected = selectedDay === d.dateStr;

          let bgClass = 'bg-slate-50 hover:bg-slate-100 text-slate-700';
          if (d.isToday) {
            bgClass = 'bg-amber-100 text-amber-900 font-bold border-2 border-amber-400';
          } else if (d.isPast && hasUnpaid) {
            bgClass = 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200';
          } else if (hasUnpaid) {
            bgClass = 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200';
          }

          return (
            <button
              key={d.dateStr}
              onClick={() => {
                setSelectedDay(d.dateStr);
                if (onDayClick) onDayClick(d.dateStr);
              }}
              title={d.stats.total > 0 ? `${d.stats.unpaid} unpaid of ${d.stats.total} total` : ''}
              className={`h-11 rounded-xl p-1 text-xs flex flex-col items-center justify-between transition-all ${bgClass} ${
                isSelected ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <span className="text-[11px] font-semibold">{d.dayNum}</span>

              {d.stats.total > 0 && (
                <div className="flex items-center justify-center">
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                      hasUnpaid
                        ? d.isToday
                          ? 'bg-amber-500 text-white'
                          : d.isPast
                          ? 'bg-rose-500 text-white'
                          : 'bg-sky-600 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {d.stats.unpaid > 0 ? d.stats.unpaid : '✓'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
