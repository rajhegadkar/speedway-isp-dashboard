'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Lock 
} from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffToEdit?: any | null;
  mode?: 'create' | 'edit' | 'reset_password';
}

export default function StaffModal({
  isOpen,
  onClose,
  onSuccess,
  staffToEdit,
  mode = 'create',
}: StaffModalProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (staffToEdit) {
        setFullName(staffToEdit.full_name || '');
        setUsername(staffToEdit.username || '');
        setPhone(staffToEdit.phone || '');
        setRole(staffToEdit.role || 'staff');
        setIsActive(staffToEdit.is_active !== undefined ? Boolean(staffToEdit.is_active) : true);
        setPassword('');
      } else {
        setFullName('');
        setUsername('');
        setPassword('');
        setPhone('');
        setRole('staff');
        setIsActive(true);
      }
      setErrorMessage('');
    }
  }, [isOpen, staffToEdit, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'create') {
      if (!fullName.trim() || !username.trim() || !password.trim()) {
        setErrorMessage('Full Name, Username, and Password are required');
        return;
      }
      if (password.trim().length < 4) {
        setErrorMessage('Password must be at least 4 characters long');
        return;
      }
    } else if (mode === 'reset_password') {
      if (!password.trim() || password.trim().length < 4) {
        setErrorMessage('Please enter a new password of at least 4 characters');
        return;
      }
    } else if (mode === 'edit') {
      if (!fullName.trim()) {
        setErrorMessage('Full Name is required');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName.trim(),
            username: username.trim(),
            password: password.trim(),
            phone: phone.trim(),
            role,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create staff account');
        }
      } else if (mode === 'reset_password') {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: staffToEdit.id,
            password: password.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to reset password');
        }
      } else {
        // edit
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: staffToEdit.id,
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update account');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              {mode === 'reset_password' ? (
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {mode === 'create' && 'New Staff Account'}
                {mode === 'edit' && `Edit Staff: ${staffToEdit?.full_name}`}
                {mode === 'reset_password' && `Reset Password: ${staffToEdit?.full_name}`}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {mode === 'create' && 'Create field collector credentials for dashboard & receipts'}
                {mode === 'edit' && 'Modify contact information and role assignment'}
                {mode === 'reset_password' && 'Assign a new secure password for this user account'}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'reset_password' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">User Account</span>
                <p className="font-bold text-slate-800">{staffToEdit?.full_name} (<code className="text-sky-700 font-mono">@{staffToEdit?.username}</code>)</p>
                <p className="text-slate-500 text-[11px]">Role: <span className="uppercase font-semibold">{staffToEdit?.role}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter at least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                />
              </div>

              {mode === 'create' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rajesh_collector"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                  >
                    <option value="staff">Field Staff / Collector</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                {mode === 'edit' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Account Status
                    </label>
                    <select
                      value={isActive ? '1' : '0'}
                      onChange={(e) => setIsActive(e.target.value === '1')}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                    >
                      <option value="1">Active</option>
                      <option value="0">Deactivated</option>
                    </select>
                  </div>
                )}

                {mode === 'edit' && (
                  <div className="col-span-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assigned Payment Groups ({staffToEdit?.assignedCount || 0})
                    </label>
                    {staffToEdit?.assignedPGs && staffToEdit.assignedPGs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl">
                        {staffToEdit.assignedPGs.map((pg: any) => (
                          <span
                            key={pg.id}
                            className="px-2.5 py-1 bg-white text-sky-900 border border-sky-200 rounded-lg text-xs font-semibold shadow-2xs"
                          >
                            🏢 {pg.name} ({pg.code})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                        Not currently assigned to any Payment Group. You can link this collector when creating or editing a Payment Group.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

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
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : mode === 'create'
                  ? 'Create Staff Account'
                  : mode === 'reset_password'
                  ? 'Set New Password'
                  : 'Save Account Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
