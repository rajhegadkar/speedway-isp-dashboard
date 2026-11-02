'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  RefreshCw,
  Phone,
  CreditCard
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface RemindersViewProps {
  onOpenReminderModal: (client: any, type: any) => void;
  onOpenRecordPayment: (client: any) => void;
  pgList: Array<{ id: string; name: string }>;
}

export default function RemindersView({
  onOpenReminderModal,
  onOpenRecordPayment,
  pgList,
}: RemindersViewProps) {
  const [data, setData] = useState<any>(null);
  const [selectedPG, setSelectedPG] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'DUE_TODAY' | 'OVERDUE' | 'UPCOMING_3D' | 'UPCOMING_7D' | 'RENEWAL'>('DUE_TODAY');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, [selectedPG]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reminders?pgId=${selectedPG}`);
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const dueToday = data?.dueTodayReminders || [];
  const overdue = data?.overdueReminders || [];
  const upcoming3d = data?.upcoming3dReminders || [];
  const upcoming7d = data?.upcoming7dReminders || [];
  const renewals = data?.renewalReminders || [];

  let currentList = dueToday;
  if (activeTab === 'OVERDUE') currentList = overdue;
  if (activeTab === 'UPCOMING_3D') currentList = upcoming3d;
  if (activeTab === 'UPCOMING_7D') currentList = upcoming7d;
  if (activeTab === 'RENEWAL') currentList = renewals;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            Automated Reminder & Communication Center
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {data?.summary?.totalActionable || 0} Ready to Send
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Speedway Broadband Services 1-click WhatsApp and SMS notification dispatcher
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
            onClick={fetchReminders}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('DUE_TODAY')}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'DUE_TODAY'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Due Today ({dueToday.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OVERDUE')}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'OVERDUE'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Follow-ups ({overdue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING_3D')}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'UPCOMING_3D'
              ? 'bg-sky-600 text-white border-sky-700 shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Due in 3 Days ({upcoming3d.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING_7D')}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'UPCOMING_7D'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Due in 7 Days ({upcoming7d.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RENEWAL')}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'RENEWAL'
              ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Plan Renewal Today ({renewals.length})</span>
        </button>
      </div>

      {/* Reminders Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentList.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-bold text-slate-700">No pending reminders in this category!</p>
            <p className="text-xs text-slate-400">All customer dues for this stage have been addressed.</p>
          </div>
        ) : (
          currentList.map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-base text-slate-900 truncate">{item.customer.name}</h4>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {item.customer.id} • {item.customer.pg_name} • Mobile: {item.customer.mobile}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-black text-rose-600 block">
                      {formatINR(item.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Due: {item.dueDate}
                    </span>
                  </div>
                </div>

                {/* Pre-composed message text preview */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans mb-4 relative group">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>Message Body</span>
                    <button
                      onClick={() => handleCopy(item.id, item.message)}
                      className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="whitespace-pre-line text-slate-800">{item.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onOpenRecordPayment(item.customer)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Pay</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={item.smsUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS</span>
                  </a>

                  <a
                    href={item.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
