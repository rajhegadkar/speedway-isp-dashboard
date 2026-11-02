'use client';

import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface TrendItem {
  month: string;
  billed: number;
  collected: number;
}

interface RevenueChartWidgetProps {
  trendData: TrendItem[];
}

export default function RevenueChartWidget({ trendData = [] }: RevenueChartWidgetProps) {
  const maxVal = Math.max(...trendData.map((d) => Math.max(d.billed, d.collected)), 250000);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Collection Trend</h3>
            <p className="text-xs text-slate-500">6-Month billing invoicing vs real cash collections</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-md bg-sky-400"></span> Invoiced Billed
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-md bg-emerald-500"></span> Cash Collected
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-6 pb-2">
        <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200 px-2 sm:px-6">
          {trendData.map((item, idx) => {
            const billedHeight = Math.round((item.billed / maxVal) * 100);
            const collectedHeight = Math.round((item.collected / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                  {/* Billed Bar */}
                  <div className="w-1/2 max-w-[20px] flex flex-col items-center">
                    <div
                      className="w-full bg-sky-300 group-hover:bg-sky-400 rounded-t-md transition-all duration-300 relative"
                      style={{ height: `${Math.max(8, billedHeight)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                        Billed: {formatINR(item.billed)}
                      </div>
                    </div>
                  </div>

                  {/* Collected Bar */}
                  <div className="w-1/2 max-w-[20px] flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative"
                      style={{ height: `${Math.max(8, collectedHeight)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                        Collected: {formatINR(item.collected)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Month label */}
                <span className="text-[11px] font-bold text-slate-500 mt-1 truncate">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
