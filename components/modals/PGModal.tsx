'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  UserCheck, 
  Phone, 
  Lock, 
  ChevronDown 
} from 'lucide-react';

interface PGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pgToEdit?: any | null;
}

export default function PGModal({ isOpen, onClose, onSuccess, pgToEdit }: PGModalProps) {
  const isEditing = Boolean(pgToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [area, setArea] = useState('');

  // Staff Assignment state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(''); // '' or 'custom' or 'USR-XXX'
  const [collectorName, setCollectorName] = useState('');
  const [collectorPhone, setCollectorPhone] = useState('');

  // Quick Inline Staff Creation
  const [showInlineStaffCreate, setShowInlineStaffCreate] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [inlineStaffError, setInlineStaffError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStaffUsers();
      if (pgToEdit) {
        setName(pgToEdit.name || '');
        setCode(pgToEdit.code || '');
        setArea(pgToEdit.area_location || '');
        setCollectorName(pgToEdit.collector_name || '');
        setCollectorPhone(pgToEdit.collector_phone || '');
        setSelectedStaffId(pgToEdit.collector_user_id || (pgToEdit.collector_name ? 'custom' : ''));
      } else {
        setName('');
        setCode('');
        setArea('');
        setCollectorName('');
        setCollectorPhone('');
        setSelectedStaffId('');
      }
      setShowInlineStaffCreate(false);
      setErrorMessage('');
      setInlineStaffError('');
    }
  }, [isOpen, pgToEdit]);

  const fetchStaffUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setStaffList(json.users || []);
        // If editing and collector_user_id matched
        if (pgToEdit?.collector_user_id) {
          setSelectedStaffId(pgToEdit.collector_user_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStaffSelect = (userId: string) => {
    setSelectedStaffId(userId);
    setShowInlineStaffCreate(false);

    if (!userId) {
      setCollectorName('');
      setCollectorPhone('');
      return;
    }

    if (userId === 'custom') {
      // Keep existing or allow typing
      return;
    }

    const staff = staffList.find((s) => s.id === userId);
    if (staff) {
      setCollectorName(staff.full_name || '');
      setCollectorPhone(staff.phone || '');
    }
  };

  const handleCreateStaffInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()) {
      setInlineStaffError('Name, Username, and Password are required');
      return;
    }

    setIsCreatingStaff(true);
    setInlineStaffError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newStaffName.trim(),
          username: newStaffUsername.trim(),
          password: newStaffPassword.trim(),
          phone: newStaffPhone.trim(),
          role: 'staff',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create staff account');
      }

      const createdUser = data.user;
      setStaffList((prev) => [...prev, createdUser]);
      setSelectedStaffId(createdUser.id);
      setCollectorName(createdUser.full_name);
      setCollectorPhone(createdUser.phone || '');
      setShowInlineStaffCreate(false);
      setNewStaffName('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffPhone('');
    } catch (err: any) {
      setInlineStaffError(err.message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !area.trim()) {
      setErrorMessage('Please fill in PG Name and Area Location');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const payload: any = {
        name: name.trim(),
        code: code.trim(),
        area_location: area.trim(),
        collector_name: collectorName.trim() || 'Unassigned',
        collector_phone: collectorPhone.trim() || '',
        collector_user_id: selectedStaffId && selectedStaffId !== 'custom' ? selectedStaffId : null,
      };

      if (isEditing) {
        payload.id = pgToEdit.id;
      }

      const res = await fetch('/api/pgs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} Payment Group`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStaffObj = staffList.find((s) => s.id === selectedStaffId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {isEditing ? `Edit Payment Group: ${pgToEdit.name}` : 'New Payment Group (PG)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Configure collection hub and assign authorized staff collector
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Group / Branch Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sector 12 Hub / East Collection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Area / Location Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sector 12, Indirapuram, Blocks A-K"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Short Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. PG-SEC12"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono uppercase"
            />
          </div>

          {/* Assigned Staff Collector Account Section */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assigned Staff Collector Account
                </label>
                <p className="text-[11px] text-slate-500">
                  Select an authorized staff login account for this branch
                </p>
              </div>

              {!showInlineStaffCreate && (
                <button
                  type="button"
                  onClick={() => setShowInlineStaffCreate(true)}
                  className="px-2.5 py-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Staff</span>
                </button>
              )}
            </div>

            {/* Quick Inline Staff Creation Sub-Form */}
            {showInlineStaffCreate && (
              <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                    <UserPlus className="w-4 h-4 text-sky-600" />
                    <span>Create Staff Login Account</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineStaffCreate(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                {inlineStaffError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{inlineStaffError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">Staff Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Verma"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">Login Username *</label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh_collector"
                      value={newStaffUsername}
                      onChange={(e) => setNewStaffUsername(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">Login Password *</label>
                    <input
                      type="password"
                      placeholder="Min 4 characters"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">Mobile Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98..."
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isCreatingStaff}
                    onClick={handleCreateStaffInline}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  >
                    {isCreatingStaff ? 'Creating...' : 'Create & Link to this PG'}
                  </button>
                </div>
              </div>
            )}

            {/* Staff Selector Dropdown */}
            <div>
              <select
                value={selectedStaffId}
                onChange={(e) => handleStaffSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
              >
                <option value="">-- Choose a Staff Account --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} (@{s.username}) {s.phone ? `— ${s.phone}` : ''}
                  </option>
                ))}
                <option value="custom">✏️ Enter Custom / External Collector (No App Login)</option>
              </select>
            </div>

            {/* Linked Staff Account Confirmation Banner */}
            {currentStaffObj && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Linked to Authorized Account: {currentStaffObj.full_name}</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Login: <strong className="font-mono text-emerald-900">@{currentStaffObj.username}</strong> • Phone: <span className="font-mono">{currentStaffObj.phone || 'None set'}</span>
                </p>
                <p className="text-[10px] text-emerald-600">
                  This staff member can sign into the dashboard or mobile view to collect payments and manage this area.
                </p>
              </div>
            )}

            {/* Custom Collector Name & Phone Inputs (Shown if custom or unlinked) */}
            {(selectedStaffId === 'custom' || (!currentStaffObj && selectedStaffId)) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Collector Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manoj Sharma"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Collector Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={collectorPhone}
                    onChange={(e) => setCollectorPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

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
              <span>{isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Payment Group')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
