'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Wifi, Printer, ArrowLeft, QrCode, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { formatINR, generateUpiPaymentUrl } from '@/lib/billing-engine';

export default function StandaloneInvoicePrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <p>Loading invoice...</p>
      </div>
    }>
      <InvoicePrintContent />
    </Suspense>
  );
}

function InvoicePrintContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const gstQuery = searchParams.get('gst'); // '1' or '0'

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withGst, setWithGst] = useState<boolean>(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetch(`/api/invoices/${id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json);
            // Default GST based on query param or invoice record
            if (gstQuery !== null) {
              setWithGst(gstQuery === '1');
            } else {
              setWithGst(json.invoice.tax_amount > 0 && json.invoice.tax_rate > 0);
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, gstQuery]);

  // Generate Dynamic NPCI UPI QR Code whenever invoice details change
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
      width: 180,
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate UPI QR code:', err));
  }, [data, withGst]);

  if (isLoading || !data?.invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <p className="text-sm font-semibold text-slate-500">Loading invoice document...</p>
      </div>
    );
  }

  const invoice = data.invoice;
  const company = data.company;

  // Calculate values according to With GST / Without GST
  const displayTaxRate = withGst ? (invoice.tax_rate || 18.0) : 0;
  const displayTaxAmount = withGst ? (invoice.tax_amount || (invoice.base_amount * 0.18)) : 0;
  const displayTotalAmount = withGst 
    ? (invoice.base_amount + displayTaxAmount + (invoice.late_fee || 0))
    : (invoice.base_amount + (invoice.late_fee || 0));
  const displayBalanceDue = Math.max(0, displayTotalAmount - (invoice.amount_paid || 0));

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 font-sans py-4 sm:py-8">
      {/* Top Controls Bar (Hidden when printing) */}
      <div className="max-w-3xl mx-auto px-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <button
          onClick={() => window.close()}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Close Window</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* GST Toggle */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setWithGst(true)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                withGst ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              With GST (18%)
            </button>
            <button
              onClick={() => setWithGst(false)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                !withGst ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Without GST
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* The Printable Invoice Document */}
      <div
        id="isolated-printable-invoice"
        className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
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
            <p className="text-base font-black text-slate-900 font-mono">{invoice.id}</p>
            <p className="text-xs text-slate-500 mt-1">Invoice Date: <strong className="text-slate-700">{invoice.invoice_date}</strong></p>
            <p className="text-xs text-slate-500">Payment Due: <strong className="text-rose-700 font-mono">{invoice.due_date}</strong></p>
            <p className="text-xs text-slate-500">Billing Period: <strong className="text-slate-700">{invoice.billing_period}</strong></p>
          </div>
        </div>

        {/* Bill To & PG Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-6 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To (Subscriber):
            </span>
            <p className="font-bold text-base text-slate-900">{invoice.customer_name}</p>
            <p className="font-mono text-slate-600 mt-0.5">Customer ID: {invoice.customer_id}</p>
            <p className="text-slate-700 mt-1">{invoice.customer_address}</p>
            <p className="text-slate-700 mt-0.5">Mobile: {invoice.customer_mobile}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
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
        <div className="border border-slate-200 rounded-xl overflow-x-auto mb-6">
          <table className="w-full min-w-[520px] sm:min-w-0 text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Service Description</th>
                {withGst && <th className="py-3 px-4">HSN/SAC</th>}
                <th className="py-3 px-4 text-right">Plan Rate (₹)</th>
                {withGst && <th className="py-3 px-4 text-right">GST (18%)</th>}
                <th className="py-3 px-4 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3.5 px-4 font-mono">1</td>
                <td className="py-3.5 px-4">
                  <p className="font-bold text-slate-900">{invoice.plan_name}</p>
                  <p className="text-[11px] text-slate-500">
                    Unlimited Optical Fiber Broadband Subscription ({invoice.billing_period})
                  </p>
                </td>
                {withGst && <td className="py-3.5 px-4 font-mono">998422</td>}
                <td className="py-3.5 px-4 text-right">{formatINR(invoice.base_amount)}</td>
                {withGst && (
                  <td className="py-3.5 px-4 text-right">{formatINR(displayTaxAmount)}</td>
                )}
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                  {formatINR(invoice.base_amount + displayTaxAmount)}
                </td>
              </tr>

              {invoice.late_fee > 0 && (
                <tr className="bg-rose-50/30">
                  <td className="py-2.5 px-4 font-mono">2</td>
                  <td className="py-2.5 px-4 font-semibold text-rose-700">Late Payment Recovery Fee</td>
                  {withGst && <td className="py-2.5 px-4 font-mono">9984</td>}
                  <td className="py-2.5 px-4 text-right font-medium">{formatINR(invoice.late_fee)}</td>
                  {withGst && <td className="py-2.5 px-4 text-right">₹0.00</td>}
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">{formatINR(invoice.late_fee)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculations and UPI Settlement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mb-8 text-xs">
          {/* Payment Details & Dynamic UPI QR Code */}
          {displayBalanceDue <= 0 && invoice.payment_status === 'PAID' ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-2xl mb-2 border border-emerald-300">
                ✓
              </div>
              <span className="font-black text-sm uppercase text-emerald-800 tracking-wider">
                INVOICE FULLY PAID & SETTLED
              </span>
              <p className="text-xs text-emerald-700 mt-1 font-semibold">
                Thank you for your payment!
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
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
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

              {/* UPI ID Info Card */}
              <div className="w-full text-slate-700 text-[11px] space-y-1 text-left bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payee VPA:</span>
                  <strong className="font-mono text-slate-900 font-bold">{company.upiId || 'speedwaybroadband@icici'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[160px]">{company.name}</span>
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

          {/* Breakdown summary */}
          <div className="space-y-2 border-t border-slate-200 pt-2">
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

            <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
              <span>Total Invoiced:</span>
              <span>{formatINR(displayTotalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Amount Paid:</span>
              <span>-{formatINR(invoice.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-rose-600 bg-rose-50 p-2 rounded-lg">
              <span>Remaining Balance Due:</span>
              <span>{formatINR(displayBalanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Footer */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between text-[11px] text-slate-500">
          <div className="max-w-md space-y-0.5">
            <p className="font-bold text-slate-700">Terms & Conditions:</p>
            <p>1. Payments are due on or before the due date to avoid service interruption.</p>
            <p>2. Speedway Broadband Services is a registered telecom internet provider.</p>
            <p>3. This is a computer-generated invoice and requires no physical signature.</p>
          </div>

          <div className="text-left sm:text-center self-end sm:self-auto">
            <div className="w-32 border-b border-slate-400 mb-1"></div>
            <p className="font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-[10px] text-slate-400">Speedway Broadband Services</p>
          </div>
        </div>
      </div>
    </div>
  );
}
