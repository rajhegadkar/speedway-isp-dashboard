'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Building2, User, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { formatINR, getTodayDateString, generateUpiPaymentUrl } from '@/lib/billing-engine';

interface ClientOption {
  id: string;
  name: string;
  mobile: string;
  pg_id: string;
  pg_name: string;
  monthly_price: number;
  payment_due_date: string;
  total_outstanding?: number;
  latest_invoice_id?: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClient?: ClientOption | null;
  clientsList: ClientOption[];
  onPaymentSuccess: (res: any) => void;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  preselectedClient,
  clientsList,
  onPaymentSuccess,
  currentUser,
}: RecordPaymentModalProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [collectedBy, setCollectedBy] = useState(currentUser?.name || 'Speedway Admin');
  const [remarks, setRemarks] = useState('');
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentClient = clientsList.find((c) => c.id === selectedClientId) || preselectedClient;

  useEffect(() => {
    if (preselectedClient) {
      setSelectedClientId(preselectedClient.id);
      setInvoiceId(preselectedClient.latest_invoice_id || '');
      setAmount(String(preselectedClient.total_outstanding || preselectedClient.monthly_price || ''));
    } else if (clientsList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsList[0].id);
      setInvoiceId(clientsList[0].latest_invoice_id || '');
      setAmount(String(clientsList[0].total_outstanding || clientsList[0].monthly_price || ''));
    }
  }, [preselectedClient, clientsList]);

  useEffect(() => {
    if (isOpen && currentUser?.name) {
      setCollectedBy(currentUser.name);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (selectedClientId && currentClient) {
      setInvoiceId(currentClient.latest_invoice_id || '');
      setAmount(String(currentClient.total_outstanding || currentClient.monthly_price || ''));
    }
  }, [selectedClientId]);

  // Generate dynamic QR code whenever amount or client changes and QR is open
  useEffect(() => {
    if (!showUpiQr) return;
    const payAmount = parseFloat(amount) || 0;
    if (payAmount <= 0) {
      setUpiQrDataUrl('');
      return;
    }
    const upiLink = generateUpiPaymentUrl({
      upiId: 'speedwaybroadband@icici',
      payeeName: 'Speedway Broadband Services',
      amount: payAmount,
      invoiceId: invoiceId || currentClient?.id || 'RECEIPT',
      customerName: currentClient?.name,
    });
    QRCode.toDataURL(upiLink, { errorCorrectionLevel: 'M', margin: 1, width: 160 })
      .then((url) => setUpiQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [showUpiQr, amount, invoiceId, currentClient]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Please select a client');
      return;
    }
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedClientId,
          invoice_id: invoiceId || null,
          amount_received: payAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_ref: transactionRef,
          collected_by: collectedBy,
          notes: remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      onPaymentSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Record Payment Receipt</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Instant balance adjustment & due date advancement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Customer / Account *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            >
              <option value="">-- Choose Customer --</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) • {c.pg_name} • Due: {c.payment_due_date}
                </option>
              ))}
            </select>
          </div>

          {/* Current Client Balance Banner */}
          {currentClient && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{currentClient.name}</p>
                <p className="text-slate-500 text-[11px]">PG: {currentClient.pg_name} • Due: {currentClient.payment_due_date}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Pending Amount</span>
                <span className="text-sm font-black text-rose-600">
                  {formatINR(currentClient.total_outstanding || currentClient.monthly_price)}
                </span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Amount"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
              />
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold"
              >
                <option value="UPI">UPI / GooglePay / PhonePe</option>
                <option value="Cash">Cash (Hand Collection)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Txn ID / Ref / Receipt #
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI/20261018/..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>

          {/* Quick Dynamic UPI QR Popup for Counter Collection */}
          {paymentMethod === 'UPI' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Show Dynamic UPI QR for Walk-in Client</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpiQr(!showUpiQr)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    showUpiQr
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {showUpiQr ? 'Hide QR' : 'Display QR Code'}
                </button>
              </div>

              {showUpiQr && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col items-center text-center animate-in fade-in duration-150">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs mb-2">
                    {upiQrDataUrl ? (
                      <img
                        src={upiQrDataUrl}
                        alt="Dynamic UPI QR"
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                        Enter amount to view QR
                      </div>
                    )}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg py-1 px-3 mb-1 text-center">
                    <span className="text-[10px] text-amber-800 font-bold block">
                      Auto-filled exact amount:
                    </span>
                    <strong className="text-sm font-mono text-slate-900 font-black">
                      {formatINR(parseFloat(amount) || 0)}
                    </strong>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                    UPI VPA: <strong>speedwaybroadband@icici</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Customer scans with GooglePay / PhonePe / Paytm. Exact amount loads automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Collected By & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Collected By
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm & Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
