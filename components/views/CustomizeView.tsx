'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Wifi, 
  Building2, 
  Building, 
  Bell, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Zap, 
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Users,
  UserPlus,
  KeyRound
} from 'lucide-react';
import { formatINR } from '@/lib/billing-engine';
import PlanModal from '@/components/modals/PlanModal';
import PGModal from '@/components/modals/PGModal';
import StaffModal from '@/components/modals/StaffModal';

interface CustomizeViewProps {
  onOpenAddPG: () => void;
  onRefreshGlobalData?: () => void;
  currentUser?: { id: string; username: string; name: string; role: string } | null;
}

export default function CustomizeView({ onOpenAddPG, onRefreshGlobalData, currentUser }: CustomizeViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'pgs' | 'staff' | 'business' | 'policies'>('plans');

  // Plans data
  const [plans, setPlans] = useState<any[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState<any | null>(null);

  // PGs data
  const [pgs, setPgs] = useState<any[]>([]);
  const [isPGModalOpen, setIsPGModalOpen] = useState(false);
  const [selectedPGToEdit, setSelectedPGToEdit] = useState<any | null>(null);

  // Staff Team data
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState<'create' | 'edit' | 'reset_password'>('create');
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<any | null>(null);

  // System Settings state
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatusMessage, setSettingsStatusMessage] = useState<string | null>(null);

  // Loading indicator
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchPGs();
    fetchStaff();
    fetchSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const json = await res.json();
      if (json.success) {
        setPlans(json.plans);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPGs = async () => {
    try {
      const res = await fetch('/api/pgs');
      const json = await res.json();
      if (json.success) {
        setPgs(json.pgs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddPlan = () => {
    setSelectedPlanToEdit(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    setSelectedPlanToEdit(plan);
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = async (plan: any) => {
    if (!confirm(`Are you sure you want to delete plan "${plan.name}" (${plan.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/plans?id=${plan.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPlans();
        if (onRefreshGlobalData) onRefreshGlobalData();
      } else {
        alert(json.error || 'Failed to delete plan');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setStaffList(json.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddStaff = () => {
    setSelectedStaffToEdit(null);
    setStaffModalMode('create');
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: any) => {
    setSelectedStaffToEdit(staff);
    setStaffModalMode('edit');
    setIsStaffModalOpen(true);
  };

  const handleOpenResetPassword = (staff: any) => {
    setSelectedStaffToEdit(staff);
    setStaffModalMode('reset_password');
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (staff: any) => {
    if (!confirm(`Are you sure you want to delete staff account "${staff.full_name}" (@${staff.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${staff.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchStaff();
        fetchPGs();
        if (onRefreshGlobalData) onRefreshGlobalData();
      } else {
        alert(json.error || 'Failed to delete staff account');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEditPG = (pg: any) => {
    setSelectedPGToEdit(pg);
    setIsPGModalOpen(true);
  };

  const handleDeletePG = async (pg: any) => {
    if (!confirm(`Are you sure you want to delete payment group "${pg.name}" (${pg.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pgs?id=${pg.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPGs();
        if (onRefreshGlobalData) onRefreshGlobalData();
      } else {
        alert(json.error || 'Failed to delete payment group');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsStatusMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (json.success) {
        setSettingsStatusMessage('Settings saved successfully!');
        setSettings(json.settings);
        if (onRefreshGlobalData) onRefreshGlobalData();
        setTimeout(() => setSettingsStatusMessage(null), 4000);
      } else {
        alert(json.error || 'Failed to save settings');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              System Customization & Settings Hub
            </h2>
            <p className="text-xs text-slate-500">
              Customize internet plans, branch payment groups, business branding, and reminder policies
            </p>
          </div>
        </div>

        {/* Action Button for Current View (Admin Only) */}
        {isAdmin && activeSubTab === 'plans' && (
          <button
            onClick={handleOpenAddPlan}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Plan</span>
          </button>
        )}
        {isAdmin && activeSubTab === 'pgs' && (
          <button
            onClick={onOpenAddPG}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Payment Group</span>
          </button>
        )}
        {isAdmin && activeSubTab === 'staff' && (
          <button
            onClick={handleOpenAddStaff}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
        {!isAdmin && (
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Staff View-Only Mode</span>
          </span>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'plans'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Internet Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pgs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'pgs'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Payment Groups ({pgs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'staff'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Team & Collectors ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('business')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'business'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Company & Branding</span>
        </button>

        <button
          onClick={() => setActiveSubTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'policies'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Reminders & Billing Rules</span>
        </button>
      </div>

      {/* SUB-TAB 1: INTERNET PLANS */}
      {activeSubTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const basePrice = plan.price || 0;
              const tax = (basePrice * (plan.tax_rate || 18)) / 100;
              const totalWithTax = basePrice + tax;
              const isActive = plan.is_active === 1 || plan.is_active === true;
              const subscribers = plan.subscriber_count || 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">{plan.name}</h3>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {plan.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {plan.description || 'Optical Fiber Broadband Plan'}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Speed Badge & Price */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Bandwidth</span>
                          <span className="text-sm font-black text-slate-900">{plan.speed_mbps} Mbps</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Price</span>
                        <span className="text-base font-black text-slate-900">{formatINR(basePrice)}</span>
                      </div>
                    </div>

                    {/* Details breakdown */}
                    <div className="space-y-1 text-xs text-slate-600 mb-3 px-1">
                      <div className="flex justify-between">
                        <span>Billing Cycle:</span>
                        <strong className="text-slate-800">{plan.billing_cycle || 'Monthly'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({plan.tax_rate || 18}%):</span>
                        <span className="font-mono text-slate-600">+{formatINR(tax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Total with GST:</span>
                        <span className="text-sky-700">{formatINR(totalWithTax)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-1">
                        <span>Assigned Clients:</span>
                        <span className="font-semibold text-slate-700">{subscribers} Subscribers</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Plan</span>
                        </button>

                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        Plan Managed by Administrator
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAYMENT GROUPS (PGs) */}
      {activeSubTab === 'pgs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pgs.map((pg) => (
              <div
                key={pg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">{pg.name}</h3>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {pg.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {pg.area_location}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Field Collector</span>
                      <strong className="text-slate-800">{pg.collector_name}</strong>
                      {pg.collector_username && (
                        <span className="text-[10px] text-sky-600 font-mono block">@{pg.collector_username}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                      <a href={`tel:${pg.collector_phone}`} className="text-sky-600 font-mono font-bold hover:underline">
                        {pg.collector_phone || 'None'}
                      </a>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span>Total Assigned Subscribers:</span>
                      <strong className="text-slate-800">{pg.totalClients || 0} Clients</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Connections:</span>
                      <strong className="text-emerald-700">{pg.activeClients || 0} Active</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ID: {pg.id}</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditPG(pg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Hub</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePG(pg)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Hub"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: STAFF TEAM & COLLECTORS */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Staff Accounts</span>
                <p className="text-lg font-black text-slate-900">{staffList.length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Active Field Collectors</span>
                <p className="text-lg font-black text-emerald-700">
                  {staffList.filter((s) => s.role === 'staff' && s.is_active).length}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Assigned Payment Groups</span>
                <p className="text-lg font-black text-indigo-700">
                  {pgs.filter((p) => p.collector_user_id).length} of {pgs.length}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const isUserAdmin = staff.role === 'admin';
              const initial = staff.full_name?.charAt(0)?.toUpperCase() || 'U';

              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Role */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base text-white shadow-sm ${
                            isUserAdmin
                              ? 'bg-gradient-to-br from-indigo-500 to-sky-600'
                              : 'bg-gradient-to-br from-sky-500 to-blue-600'
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{staff.full_name}</h4>
                          <span className="text-xs font-mono text-sky-600 font-bold">@{staff.username}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isUserAdmin
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isUserAdmin ? 'Admin' : 'Collector'}
                      </span>
                    </div>

                    {/* Contact & Status */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mobile Phone:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {staff.phone || 'None set'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Login Status:</span>
                        <span className={`font-bold ${staff.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {staff.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Payment Groups */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Assigned Payment Groups ({staff.assignedCount || 0})
                      </span>
                      {staff.assignedPGs && staff.assignedPGs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {staff.assignedPGs.map((p: any) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-100 rounded-md text-[11px] font-semibold"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No branch assigned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Admin Only) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{staff.id}</span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenResetPassword(staff)}
                          title="Reset Password"
                          className="px-2 py-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Password</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditStaff(staff)}
                          title="Edit Details"
                          className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {staff.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteStaff(staff)}
                            title="Delete Account"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPANY & INVOICE BRANDING */}
      {activeSubTab === 'business' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Company & Invoice Header Details</h3>
              <p className="text-xs text-slate-500">
                These details appear on printed invoices, WhatsApp reminders, and system headers
              </p>
            </div>
            {settingsStatusMessage && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {settingsStatusMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ISP Business Name *
              </label>
              <input
                type="text"
                required
                value={settings.company_name || 'Speedway Broadband Services'}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Tagline
              </label>
              <input
                type="text"
                value={settings.company_tagline || 'High-Speed Fiber Optical Internet Provider'}
                onChange={(e) => setSettings({ ...settings, company_tagline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN Number (for GST Invoices)
              </label>
              <input
                type="text"
                value={settings.gstin || '07AAAAA0000A1Z5'}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Billing Format
              </label>
              <select
                value={settings.default_bill_type || 'WITH_GST'}
                onChange={(e) => setSettings({ ...settings, default_bill_type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-semibold"
              >
                <option value="WITH_GST">With GST (18%) by default</option>
                <option value="WITHOUT_GST">Without GST (Plain bill with no GST mentions)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Support Helpline Phone *
              </label>
              <input
                type="text"
                required
                value={settings.support_phone || '+91 98765 43210'}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Billing Support Email
              </label>
              <input
                type="email"
                value={settings.support_email || 'billing@speedwaybroadband.in'}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Business Address (Shown on Invoices)
              </label>
              <input
                type="text"
                value={settings.office_address || 'Main Operations Hub, Sector 4, Central Tower, Delhi NCR - 110092'}
                onChange={(e) => setSettings({ ...settings, office_address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Instant UPI Payment ID (VPA)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. speedwaybroadband@icici"
                  value={settings.upi_id || 'speedwaybroadband@icici'}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono font-bold text-sky-700"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Subscribers can scan and transfer payments directly to this UPI address.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {!isAdmin && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Read-only: Company branding settings are restricted to Administrator</span>
              </span>
            )}
            {isAdmin && (
              <button
                type="submit"
                disabled={isSavingSettings}
                className="ml-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving Changes...' : 'Save Business Settings'}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* SUB-TAB 4: REMINDER TEMPLATES & POLICIES */}
      {activeSubTab === 'policies' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Automated Reminders & Due Date Policies</h3>
              <p className="text-xs text-slate-500">
                Customize late fees, grace days, and prepared WhatsApp reminder templates
              </p>
            </div>
            {settingsStatusMessage && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {settingsStatusMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Late Payment Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settings.late_fee_amount || '50'}
                onChange={(e) => setSettings({ ...settings, late_fee_amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono font-bold text-rose-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grace Period (Days Before Late Fee Applies)
              </label>
              <input
                type="number"
                min={0}
                value={settings.grace_period_days || '3'}
                onChange={(e) => setSettings({ ...settings, grace_period_days: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>

          {/* WhatsApp Templates */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Prepared WhatsApp Message Templates</span>
            </h4>
            <p className="text-xs text-slate-500">
              You can use variables: <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{name}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{amount}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{due_date}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{plan}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{company}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{invoice}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">{'{next_due}'}</code>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. Upcoming Payment Reminder (7 Days & 3 Days Buffer)
              </label>
              <textarea
                rows={2}
                value={settings.whatsapp_upcoming_template || 'Hello {name}, your internet bill of {amount} for plan {plan} is due on {due_date}. Please pay on time to avoid service interruption. Thank you, {company}.'}
                onChange={(e) => setSettings({ ...settings, whatsapp_upcoming_template: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Due Today Urgent Reminder
              </label>
              <textarea
                rows={2}
                value={settings.whatsapp_today_template || 'URGENT: Hello {name}, your broadband bill of {amount} is due TODAY ({due_date}). Please pay before 9 PM to avoid interruption. Thank you, {company}.'}
                onChange={(e) => setSettings({ ...settings, whatsapp_today_template: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Overdue Collection Notice
              </label>
              <textarea
                rows={2}
                value={settings.whatsapp_overdue_template || 'OVERDUE ALERT: Hello {name}, your internet bill of {amount} is OVERDUE ({due_date}). Please clear dues immediately to avoid disconnection. Thank you, {company}.'}
                onChange={(e) => setSettings({ ...settings, whatsapp_overdue_template: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Payment Received Confirmation Receipt
              </label>
              <textarea
                rows={2}
                value={settings.whatsapp_confirmation_template || 'Payment Received: Thank you {name}, we received {amount} for invoice #{invoice}. Next due date: {next_due}. Thank you, {company}.'}
                onChange={(e) => setSettings({ ...settings, whatsapp_confirmation_template: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {!isAdmin && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Read-only: Reminder policies and templates are managed by Administrator</span>
              </span>
            )}
            {isAdmin && (
              <button
                type="submit"
                disabled={isSavingSettings}
                className="ml-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving Policies...' : 'Save Policies & Templates'}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Plan Modal (Add / Edit) */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={() => {
          fetchPlans();
          if (onRefreshGlobalData) onRefreshGlobalData();
        }}
        planToEdit={selectedPlanToEdit}
      />

      {/* Staff Modal (Add / Edit / Password Reset) */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setSelectedStaffToEdit(null);
        }}
        onSuccess={() => {
          fetchStaff();
          fetchPGs();
          if (onRefreshGlobalData) onRefreshGlobalData();
        }}
        staffToEdit={selectedStaffToEdit}
        mode={staffModalMode}
      />

      {/* Payment Group Modal (Edit Hub) */}
      <PGModal
        isOpen={isPGModalOpen}
        onClose={() => {
          setIsPGModalOpen(false);
          setSelectedPGToEdit(null);
        }}
        onSuccess={() => {
          fetchPGs();
          fetchStaff();
          if (onRefreshGlobalData) onRefreshGlobalData();
        }}
        pgToEdit={selectedPGToEdit}
      />
    </div>
  );
}
