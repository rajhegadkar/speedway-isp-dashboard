'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, ExternalLink, Wifi, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { formatINR, generateUpiPaymentUrl } from '@/lib/billing-engine';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export default function PrintInvoiceModal({
  isOpen,
  onClose,
  invoiceId,
}: PrintInvoiceModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [withGst, setWithGst] = useState<boolean>(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceId && isOpen) {
      setIsLoading(true);
      fetch(`/api/invoices/${invoiceId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json);
            // Default to With GST if tax_amount > 0 or is_gst === 1
            const hasTax = (json.invoice.tax_amount > 0 && json.invoice.tax_rate > 0) || json.invoice.is_gst === 1;
            setWithGst(hasTax);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [invoiceId, isOpen]);

  // Generate Dynamic NPCI UPI QR Code with exact auto-filled amount
  useEffect(() => {
    if (!data?.invoice || !data?.company) return;
    const inv = data.invoice;
    const comp = data.company;

    const displayTax = withGst ? (inv.tax_amount || (inv.base_amount * 0.18)) : 0;
    const total = withGst
      ? (inv.base_amount + displayTax + (inv.late_fee || 0))
      : (inv.base_amount + (inv.late_fee || 0));
    const balance = Math.max(0, total - (inv.amount_paid || 0));
    const payable = balance > 0 ? balance : total;

    const upiLink = generateUpiPaymentUrl({
      upiId: comp.upiId || 'speedwaybroadband@icici',
      payeeName: comp.name || 'Speedway Broadband Services',
      amount: payable,
      invoiceId: inv.id,
      customerName: inv.customer_name,
    });

    QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 170,
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate modal QR code:', err));
  }, [data, withGst]);

  if (!isOpen || !invoiceId) return null;

  const invoice = data?.invoice;
  const company = data?.company;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDedicatedTab = () => {
    window.open(`/invoices/${invoiceId}/print?gst=${withGst ? '1' : '0'}`, '_blank');
  };

  // Dynamic calculations based on GST toggle
  const displayTaxRate = withGst ? (invoice?.tax_rate || 18.0) : 0;
  const displayTaxAmount = withGst ? (invoice?.tax_amount || ((invoice?.base_amount || 0) * 0.18)) : 0;
  const displayTotalAmount = withGst
    ? ((invoice?.base_amount || 0) + displayTaxAmount + (invoice?.late_fee || 0))
    : ((invoice?.base_amount || 0) + (invoice?.late_fee || 0));
  const displayBalanceDue = Math.max(0, displayTotalAmount - (invoice?.amount_paid || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6">
        
        {/* Modal Controls Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-xs sm:text-sm">Invoice {invoiceId}</h3>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* GST Option Toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setWithGst(true)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  withGst ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                With GST
              </button>
              <button
                type="button"
                onClick={() => setWithGst(false)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  !withGst ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Without GST
              </button>
            </div>

            {/* Open dedicated clean page */}
            <button
              onClick={handleOpenDedicatedTab}
              title="Open full page print in new tab"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clean Tab</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            {/* Desktop close button */}
            <button
              onClick={onClose}
              className="hidden sm:block p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        {isLoading || !invoice ? (
          <div className="py-24 text-center text-slate-400">
            <p className="text-xs">Loading invoice details...</p>
          </div>
        ) : (
          <div
            id="isolated-printable-invoice"
            className="p-6 sm:p-10 bg-white text-slate-900 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible"
          >
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shrink-0">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                      SPEEDWAY BROADBAND SERVICES
                    </h1>
                    <p className="text-xs font-semibold text-slate-600">
                      High-Speed Fiber Optical Internet Provider
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                  <p>Main Operations Hub, Sector 4, Central Tower, Delhi NCR</p>
                  {withGst && (
                    <p>GSTIN: <strong className="text-slate-800">07AAAAA0000A1Z5</strong></p>
                  )}
                  <p>Helpline: +91 98765 43210 • Email: billing@speedwaybroadband.in</p>
                </div>
              </div>

              <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-md mb-2">
                  {withGst ? 'TAX INVOICE' : 'INVOICE'}
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900 font-mono">{invoice.id}</p>
                <p className="text-xs text-slate-500 mt-1">Invoice Date: <strong className="text-slate-700">{invoice.invoice_date}</strong></p>
                <p className="text-xs text-slate-500">Payment Due: <strong className="text-rose-700 font-mono">{invoice.due_date}</strong></p>
                <p className="text-xs text-slate-500">Billing Period: <strong className="text-slate-700">{invoice.billing_period}</strong></p>
              </div>
            </div>

            {/* Bill To & PG Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-5 text-xs">
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To (Subscriber):
                </span>
                <p className="font-bold text-sm sm:text-base text-slate-900">{invoice.customer_name}</p>
                <p className="font-mono text-slate-600 mt-0.5">Customer ID: {invoice.customer_id}</p>
                <p className="text-slate-700 mt-1">{invoice.customer_address}</p>
                <p className="text-slate-700 mt-0.5">Mobile: {invoice.customer_mobile}</p>
              </div>

              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Payment Group & Collection Hub:
                </span>
                <p className="font-bold text-slate-900 text-sm">{invoice.pg_name}</p>
                <p className="text-slate-600 font-mono">Code: {invoice.pg_code}</p>
                <p className="text-slate-700 mt-1">Area: {invoice.pg_location}</p>
                <p className="text-slate-700 mt-0.5">Collector: {invoice.collector_name} ({invoice.collector_phone})</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded text-[11px] ${
                      invoice.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.payment_status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {invoice.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto mb-5">
              <table className="w-full min-w-[520px] sm:min-w-0 text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4 w-10">#</th>
                    <th className="py-2.5 px-3 sm:px-4">Service Description</th>
                    {withGst && <th className="py-2.5 px-3 sm:px-4">HSN/SAC</th>}
                    <th className="py-2.5 px-3 sm:px-4 text-right">Plan Rate (₹)</th>
                    {withGst && <th className="py-2.5 px-3 sm:px-4 text-right">GST (18%)</th>}
                    <th className="py-2.5 px-3 sm:px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-3 px-3 sm:px-4 font-mono">1</td>
                    <td className="py-3 px-3 sm:px-4">
                      <p className="font-bold text-slate-900">{invoice.plan_name}</p>
                      <p className="text-[11px] text-slate-500">
                        Unlimited Optical Fiber Broadband Subscription ({invoice.billing_period})
                      </p>
                    </td>
                    {withGst && <td className="py-3 px-3 sm:px-4 font-mono">998422</td>}
                    <td className="py-3 px-3 sm:px-4 text-right">{formatINR(invoice.base_amount)}</td>
                    {withGst && (
                      <td className="py-3 px-3 sm:px-4 text-right">{formatINR(displayTaxAmount)}</td>
                    )}
                    <td className="py-3 px-3 sm:px-4 text-right font-bold text-slate-900">
                      {formatINR(invoice.base_amount + displayTaxAmount)}
                    </td>
                  </tr>

                  {invoice.late_fee > 0 && (
                    <tr className="bg-rose-50/30">
                      <td className="py-2.5 px-3 sm:px-4 font-mono">2</td>
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-rose-700">Late Payment Recovery Fee</td>
                      {withGst && <td className="py-2.5 px-3 sm:px-4 font-mono">9984</td>}
                      <td className="py-2.5 px-3 sm:px-4 text-right font-medium">{formatINR(invoice.late_fee)}</td>
                      {withGst && <td className="py-2.5 px-3 sm:px-4 text-right">₹0.00</td>}
                      <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-rose-700">{formatINR(invoice.late_fee)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & UPI Settlement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start mb-6 text-xs">
              {/* Payment Details & Dynamic UPI QR Code */}
              {displayBalanceDue <= 0 && invoice.payment_status === 'PAID' ? (
                <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl mb-2 border border-emerald-300">
                    ✓
                  </div>
                  <span className="font-black text-xs sm:text-sm uppercase text-emerald-800 tracking-wider">
                    INVOICE FULLY PAID & SETTLED
                  </span>
                  <p className="text-xs text-emerald-700 mt-1 font-semibold">
                    Payment settled. Thank you for choosing {company.name}!
                  </p>
                  <p className="font-mono text-[11px] text-emerald-600 mt-2 bg-emerald-100/60 px-3 py-1 rounded-lg border border-emerald-200">
                    Settlement Status: ZERO BALANCE DUE
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2.5">
                    <span className="font-black text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Instant UPI Scan & Pay
                    </span>
                    <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      NPCI UPI 2.0
                    </span>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-2 inline-block">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt={`UPI Payment QR for ${formatINR(displayBalanceDue > 0 ? displayBalanceDue : displayTotalAmount)}`}
                        className="w-28 sm:w-32 h-28 sm:h-32 object-contain"
                      />
                    ) : (
                      <div className="w-28 sm:w-32 h-28 sm:h-32 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Exact prefilled amount reminder banner */}
                  <div className="w-full bg-amber-50 border border-amber-200/90 rounded-lg py-1 px-2 mb-2 text-center">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wide">
                      Exact Amount Auto-Filled:
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {formatINR(displayBalanceDue > 0 ? displayBalanceDue : displayTotalAmount)}
                    </span>
                  </div>

                  {/* UPI ID Info Card with Copy */}
                  <div className="w-full text-slate-700 text-[11px] space-y-1 text-left bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Payee VPA:</span>
                      <div className="flex items-center gap-1">
                        <strong className="font-mono text-slate-900 font-bold">{company.upiId || 'speedwaybroadband@icici'}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(company.upiId || 'speedwaybroadband@icici');
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded transition-colors"
                          title="Copy UPI ID"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Beneficiary:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">{company.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Supported Apps:</span>
                      <span className="font-medium text-slate-600">GPay • PhonePe • Paytm • BHIM • CRED</span>
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-500 leading-snug">
                    Scan with any UPI app. Exact bill amount is automatically loaded—no manual typing required.
                  </p>
                </div>
              )}

              {/* Total Calculation breakdown */}
              <div className="space-y-1.5 border-t border-slate-200 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(invoice.base_amount)}</span>
                </div>

                {withGst && (
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%) + SGST (9%):</span>
                    <span>+{formatINR(displayTaxAmount)}</span>
                  </div>
                )}

                {invoice.late_fee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Late Fee:</span>
                    <span>+{formatINR(invoice.late_fee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                  <span>Total Invoiced:</span>
                  <span>{formatINR(displayTotalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Amount Paid:</span>
                  <span>-{formatINR(invoice.amount_paid || 0)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-rose-600 bg-rose-50 p-2 rounded-lg">
                  <span>Remaining Balance Due:</span>
                  <span>{formatINR(displayBalanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signature Footer */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between text-[11px] text-slate-500">
              <div className="max-w-md space-y-0.5">
                <p className="font-bold text-slate-700">Terms & Conditions:</p>
                <p>1. Payments are due on or before the due date to avoid service interruption.</p>
                <p>2. Speedway Broadband Services is a registered telecom internet provider.</p>
                <p>3. This is a computer-generated invoice and requires no physical signature.</p>
              </div>

              <div className="text-left sm:text-center self-end sm:self-auto">
                <div className="w-28 sm:w-32 border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-800">Authorized Signatory</p>
                <p className="text-[10px] text-slate-400">Speedway Broadband Services</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
