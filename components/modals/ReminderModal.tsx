'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { composeReminderMessage, formatINR } from '@/lib/billing-engine';

interface ClientItem {
  id: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  pg_name: string;
  plan_name: string;
  monthly_price: number;
  payment_due_date: string;
  latest_invoice_id?: string;
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientItem | null;
  initialType?: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'CONFIRMATION' | 'RENEWAL';
  onReminderLogged?: () => void;
}

export default function ReminderModal({
  isOpen,
  onClose,
  client,
  initialType = 'DUE_TODAY',
  onReminderLogged,
}: ReminderModalProps) {
  const [reminderType, setReminderType] = useState(initialType);
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    if (initialType) setReminderType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (client) {
      const generated = composeReminderMessage(reminderType, {
        customerName: client.name,
        amount: client.monthly_price,
        dueDate: client.payment_due_date,
        invoiceNo: client.latest_invoice_id,
        pgName: client.pg_name,
        planName: client.plan_name,
      });
      setCustomText(generated.message);
    }
  }, [client, reminderType]);

  if (!isOpen || !client) return null;

  const cleanPhone = (client.whatsapp || client.mobile || '').replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(customText)}`;
  const smsUrl = `sms:${client.mobile}?body=${encodeURIComponent(customText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logReminder('COPIED');
  };

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank');
    logReminder('WHATSAPP_CLICKED');
  };

  const handleSmsClick = () => {
    window.open(smsUrl, '_blank');
    logReminder('SMS_CLICKED');
  };

  const logReminder = async (channel: string) => {
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: client.id,
          reminder_type: reminderType,
          channel,
          recipient_phone: client.mobile,
          message_text: customText,
        }),
      });
      if (onReminderLogged) onReminderLogged();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Reminder & Communication Hub</h3>
              <p className="text-xs text-slate-400">1-Click WhatsApp & SMS ready notification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Client summary pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block">{client.name}</span>
              <span className="text-slate-500">Mobile: {client.mobile} • PG: {client.pg_name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Due Date: {client.payment_due_date}</span>
              <span className="font-bold text-rose-600">{formatINR(client.monthly_price)}</span>
            </div>
          </div>

          {/* Reminder Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Message Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { type: 'DUE_TODAY', label: 'Due Today' },
                { type: 'UPCOMING', label: 'Upcoming Payment' },
                { type: 'OVERDUE', label: 'Overdue Notice' },
                { type: 'CONFIRMATION', label: 'Payment Done' },
                { type: 'RENEWAL', label: 'Plan Renewal' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setReminderType(item.type as any)}
                  className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center ${
                    reminderType === item.type
                      ? 'bg-sky-50 text-sky-700 border-sky-400 shadow-sm ring-1 ring-sky-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview & Edit box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 leading-relaxed font-sans"
            />
          </div>

          {/* Action Dispatch Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleSmsClick}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
