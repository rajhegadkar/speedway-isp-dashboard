'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Wifi, 
  CreditCard, 
  Send, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  Power,
  RefreshCw,
  Printer
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onOpenPayment: (client: any) => void;
  onOpenReminder: (client: any, type: any) => void;
  onPrintInvoice?: (invoiceId: string) => void;
  onClientStatusChanged?: () => void;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
}

export default function ClientDetailsModal({
  isOpen,
  onClose,
  clientId,
  onOpenPayment,
  onOpenReminder,
  onPrintInvoice,
  onClientStatusChanged,
  currentUser,
}: ClientDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (clientId && isOpen) {
      fetchClientDetails();
    }
  }, [clientId, isOpen]);

  const fetchClientDetails = async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConnectionStatus = async (newStatus: string) => {
    if (!clientId) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_status: newStatus,
          reason: `Manual toggle to ${newStatus} from Client Modal`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchClientDetails();
        if (onClientStatusChanged) onClientStatusChanged();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen || !clientId) return null;

  const client = data?.client;
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto sm:my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-lg truncate">{client?.name || 'Loading...'}</h3>
                <span className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold shrink-0">
                  {clientId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {client?.pg_name} • {client?.area_location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onOpenPayment(client)}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Record Payment</span>
              <span className="sm:hidden">Pay</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading || !client ? (
          <div className="py-24 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
            <p className="text-sm font-semibold">Loading client records...</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
            {/* Top Status & Quick Action Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      client.payment_status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : client.payment_status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    Payment: {client.payment_status}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      client.connection_status === 'ACTIVE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : client.connection_status === 'SUSPENDED'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Line: {client.connection_status}
                  </span>
                </div>
              </div>

              {/* Action buttons: Suspend / Reconnect */}
              <div className="flex items-center gap-2">
                {client.connection_status === 'ACTIVE' ? (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleConnectionStatus('SUSPENDED')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Suspend Line</span>
                  </button>
                ) : (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleConnectionStatus('ACTIVE')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Reactivate Line</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenReminder(client, client.payment_status === 'OVERDUE' ? 'OVERDUE' : 'DUE_TODAY')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Grid Information Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account & Billing */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                  Subscription & Billing
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-bold text-slate-900">{client.plan_name} ({client.speed_mbps} Mbps)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rate:</span>
                  <span className="font-bold text-slate-900">{formatINR(client.monthly_price)} (inc. GST)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="font-semibold text-slate-800">{client.billing_cycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Next Payment Due:</span>
                  <span className="font-bold text-amber-700 font-mono">{client.payment_due_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Payment Date:</span>
                  <span className="font-mono text-slate-800">{client.last_payment_date || 'None'}</span>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Contact & Installation
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono font-bold text-slate-900">{client.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="font-mono text-slate-800">{client.whatsapp || client.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{client.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-slate-800 text-right max-w-[200px] truncate">{client.address}</span>
                </div>
              </div>
            </div>

            {/* Sensitive Network Credentials Vault */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    Network & PPPoE Credentials Vault
                  </span>
                </div>
                {currentUser?.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide Secret' : 'Reveal Secret'}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    Protected (Admin Only)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">PPPoE Username:</span>
                  <span className="font-mono text-white font-bold">{client.pppoe_username || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PPPoE Password:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {currentUser?.role === 'admin' && showPassword ? client.pppoe_password : '••••••••••••'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Static IP:</span>
                  <span className="font-mono text-white">{client.static_ip || 'Dynamic / DHCP'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ONT / MAC:</span>
                  <span className="text-slate-300 truncate block">{client.router_ont_details || 'Generic ONT'}</span>
                </div>
              </div>
            </div>

            {/* Invoices History Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Billing & Invoice History ({invoices.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Paid</th>
                      <th className="py-2.5 px-3">Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-slate-400">
                          No invoices generated yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.id}</td>
                          <td className="py-2 px-3">{inv.billing_period}</td>
                          <td className="py-2 px-3 font-mono">{inv.due_date}</td>
                          <td className="py-2 px-3 font-bold">{formatINR(inv.total_amount)}</td>
                          <td className="py-2 px-3 text-emerald-600">{formatINR(inv.amount_paid)}</td>
                          <td className="py-2 px-3 text-rose-600 font-bold">{formatINR(inv.balance_due)}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inv.payment_status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.payment_status === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {inv.payment_status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {onPrintInvoice && (
                              <button
                                onClick={() => onPrintInvoice(inv.id)}
                                className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded"
                                title="Print Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Receipts History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Payment Transactions & Receipts ({payments.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Ref ID</th>
                      <th className="py-2.5 px-3">Collected By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.id}</td>
                          <td className="py-2 px-3 font-mono">{p.payment_date}</td>
                          <td className="py-2 px-3 font-bold text-emerald-600">+{formatINR(p.amount_received)}</td>
                          <td className="py-2 px-3 font-semibold">{p.payment_method}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{p.transaction_ref || 'N/A'}</td>
                          <td className="py-2 px-3 text-slate-700">{p.collected_by}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
