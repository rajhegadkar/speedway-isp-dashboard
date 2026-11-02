'use client';

import React, { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle, Wifi, Shield } from 'lucide-react';
import { getTodayDateString } from '@/lib/billing-engine';

interface PGItem {
  id: string;
  name: string;
  code: string;
  area_location: string;
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  speed_mbps: number;
  tax_rate: number;
  billing_cycle: string;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  pgList: PGItem[];
  planList: PlanItem[];
  onClientCreated: () => void;
}

export default function AddClientModal({
  isOpen,
  onClose,
  pgList,
  planList,
  onClientCreated,
}: AddClientModalProps) {
  const today = getTodayDateString();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pgId, setPgId] = useState(pgList[0]?.id || '');
  const [planId, setPlanId] = useState(planList[0]?.id || '');
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [customDays, setCustomDays] = useState(30);
  const [installationDate, setInstallationDate] = useState(today);
  const [billingStartDate, setBillingStartDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [routerDetails, setRouterDetails] = useState('');
  const [pppoeUser, setPppoeUser] = useState('');
  const [pppoePass, setPppoePass] = useState('Speedway@123');
  const [staticIp, setStaticIp] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [withGst, setWithGst] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePlanChange = (pId: string) => {
    setPlanId(pId);
    const sel = planList.find((p) => p.id === pId);
    if (sel) {
      setBillingCycle(sel.billing_cycle || 'Monthly');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!pppoeUser) {
      setPppoeUser(`sbs_${val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !address || !pgId || !planId) {
      setErrorMessage('Please fill in all required customer details');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          whatsapp: whatsapp || mobile,
          email,
          address,
          pg_id: pgId,
          plan_id: planId,
          billing_cycle: billingCycle,
          custom_cycle_days: billingCycle === 'Custom' ? customDays : null,
          installation_date: installationDate,
          billing_start_date: billingStartDate,
          payment_due_date: dueDate,
          next_due_date: dueDate,
          router_ont_details: routerDetails,
          pppoe_username: pppoeUser,
          pppoe_password: pppoePass,
          static_ip: staticIp,
          notes,
          include_gst: withGst,
          connection_status: 'ACTIVE',
          payment_status: 'DUE_TODAY',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create customer');
      }

      onClientCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">New Client Registration</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Add subscriber with plan, billing schedule, and ONT setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: Personal Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Customer Identity & Contacts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="Same as mobile if blank"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="subscriber@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Installation / House Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Flat/House No, Building/Tower, Street, Colony..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section: Plan & PG Assignment */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Plan, PG Assignment & Billing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Payment Group (PG) *
                </label>
                <select
                  required
                  value={pgId}
                  onChange={(e) => setPgId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold"
                >
                  {pgList.map((pg) => (
                    <option key={pg.id} value={pg.id}>
                      {pg.name} ({pg.area_location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internet Plan *
                </label>
                <select
                  required
                  value={planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold"
                >
                  {planList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.speed_mbps} Mbps - ₹{p.price}/mo + {p.tax_rate}% GST)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing Cycle *
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                >
                  <option value="Monthly">Monthly (1 Month)</option>
                  <option value="Quarterly">Quarterly (3 Months)</option>
                  <option value="Half-Yearly">Half-Yearly (6 Months)</option>
                  <option value="Yearly">Yearly (12 Months)</option>
                  <option value="Custom">Custom Days</option>
                </select>
              </div>

              {billingCycle === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Cycle Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Bill Format
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setWithGst(true)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      withGst
                        ? 'bg-sky-50 text-sky-700 border-sky-400 ring-1 ring-sky-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    With GST (18%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithGst(false)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      !withGst
                        ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Without GST
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Network & Credentials */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>3. Network & Credentials (Encrypted)</span>
              <span className="text-[11px] text-slate-500 font-normal">Restricted Access</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PPPoE Username
                </label>
                <input
                  type="text"
                  value={pppoeUser}
                  onChange={(e) => setPppoeUser(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PPPoE Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pppoePass}
                    onChange={(e) => setPppoePass(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Router / ONT Model & MAC
                </label>
                <input
                  type="text"
                  placeholder="e.g. Syrotech GPON ONT (MAC: E0:CC:...)"
                  value={routerDetails}
                  onChange={(e) => setRouterDetails(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Static IP (If Assigned)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 103.140.88.42"
                  value={staticIp}
                  onChange={(e) => setStaticIp(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call before visiting, prefers UPI payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Client & Generate Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
