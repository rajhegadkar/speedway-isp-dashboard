'use client';

import React, { useState, useEffect } from 'react';
import { X, Wifi, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planToEdit?: any | null;
}

export default function PlanModal({
  isOpen,
  onClose,
  onSuccess,
  planToEdit,
}: PlanModalProps) {
  const isEditing = Boolean(planToEdit);

  const [name, setName] = useState('');
  const [speedMbps, setSpeedMbps] = useState(100);
  const [price, setPrice] = useState(799);
  const [taxRate, setTaxRate] = useState(18.0);
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name || '');
      setSpeedMbps(planToEdit.speed_mbps || 100);
      setPrice(planToEdit.price || 0);
      setTaxRate(planToEdit.tax_rate !== undefined ? planToEdit.tax_rate : 18.0);
      setBillingCycle(planToEdit.billing_cycle || 'Monthly');
      setDescription(planToEdit.description || '');
      setIsActive(planToEdit.is_active === 1 || planToEdit.is_active === true);
    } else {
      setName('');
      setSpeedMbps(100);
      setPrice(799);
      setTaxRate(18.0);
      setBillingCycle('Monthly');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [planToEdit, isOpen]);

  if (!isOpen) return null;

  const taxAmount = (price * taxRate) / 100;
  const totalWithTax = price + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a plan name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: name.trim(),
        speed_mbps: Number(speedMbps),
        price: Number(price),
        tax_rate: Number(taxRate),
        billing_cycle: billingCycle,
        description: description.trim(),
        is_active: isActive ? 1 : 0,
      };

      if (isEditing) {
        payload.id = planToEdit.id;
      }

      const res = await fetch('/api/plans', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
      } else {
        setError(json.error || 'Failed to save plan');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto sm:my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {isEditing ? `Edit Plan: ${planToEdit.name}` : 'Create New Internet Plan'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure speeds, prices, validity, and tax rules
              </p>
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
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fiber Prime 150M"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Speed (Mbps) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={speedMbps}
                  onChange={(e) => setSpeedMbps(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono font-bold"
                />
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Rate (% GST)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate:</span>
                <span className="font-mono font-bold">{formatINR(price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({taxRate}%):</span>
                <span className="font-mono">+{formatINR(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-sky-200">
                <span>Total with GST:</span>
                <span className="font-mono text-sky-700">{formatINR(totalWithTax)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plan Description & Perks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Symmetrical upload/download, 99.9% uptime SLA"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_plan"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300"
              />
              <label htmlFor="is_active_plan" className="text-xs font-bold text-slate-800 cursor-pointer">
                Plan is Active & Available for New Subscriptions
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
