'use client';

import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, ShieldAlert, CheckCircle2, History, Shield } from 'lucide-react';

interface BackupViewProps {
  currentUser?: { id: string; username: string; name: string; role: string } | null;
}

export default function BackupView({ currentUser }: BackupViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit');
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleResetDemoData = async () => {
    if (!confirm('Are you sure you want to reset demo data? All current records will be re-seeded to initial demonstration state.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Database re-seeded successfully. Page will reload.');
        window.location.reload();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600" />
            Database Safety, Backups & Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Export persistent data snapshots, review financial change logs, and ensure business disaster recovery
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Backup (JSON)</span>
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            Staff View-Only (Audit Inspection)
          </span>
        )}
      </div>

      {/* Safety Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">ACID Relational Persistence</h3>
              <p className="text-xs text-slate-500">Local SQLite database with strict foreign keys</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All customer accounts, monthly recurring invoices, payment transactions, and PG assignments are permanently committed to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">data/speedway.db</code>. Backups can be downloaded at any time for zero data-loss disaster recovery.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Database Maintenance</h3>
              <p className="text-xs text-slate-500">Demo reset and table maintenance</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Need to restart with fresh sample records for Speedway Broadband Services? Use the button below to re-initialize schema and default clients.
          </p>
          {isAdmin ? (
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
            >
              {resetting ? 'Resetting...' : 'Re-seed Demo Database'}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium italic block">
              Database reset restricted to Administrator
            </span>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Financial & System Audit Logs</h3>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit events logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">{log.entity_type}</td>
                    <td className="py-2.5 px-4 text-slate-800">{log.user_name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
