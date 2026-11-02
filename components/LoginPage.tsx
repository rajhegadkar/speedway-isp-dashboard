'use client';

import React, { useState } from 'react';
import { 
  Wifi, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { id: string; username: string; name: string; role: string }) => void;
  networkUrl?: string;
}

export default function LoginPage({
  onLoginSuccess,
  networkUrl = 'http://192.168.1.128:3000',
}: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials. Please verify your login details.');
      }

      // Persist session if rememberMe is enabled
      if (rememberMe) {
        localStorage.setItem('speedway_isp_user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('speedway_isp_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    
    // Auto-trigger sign-in
    setIsLoading(true);
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem('speedway_isp_user', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        } else {
          setErrorMessage(data.error || 'Failed to authenticate');
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Top Bar with Network Access Info */}
      <div className="relative z-10 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black shadow-md shadow-sky-600/20">
            <Wifi className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight">SPEEDWAY</span>
            <span className="text-[10px] text-sky-400 font-bold ml-1.5 px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-800">
              ISP SECURE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Smartphone className="w-3.5 h-3.5 text-sky-400 hidden sm:inline" />
          <span className="hidden sm:inline">Network Access:</span>
          <span className="font-mono text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
            {networkUrl.replace('http://', '')}
          </span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-xl shadow-sky-500/25 mb-3">
              <Wifi className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Speedway Broadband Services
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Billing, Customer Management & Payment Tracking System
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Username / Operator ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or staff1"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[11px] text-slate-500">Encrypted AES-256</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 hover:shadow-sky-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center flex items-center justify-center gap-1">
              <KeyRound className="w-3 h-3 text-sky-400" />
              <span>One-Click Quick Sign In</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-sky-400 group-hover:text-sky-300">Admin</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 font-mono">Full</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">admin / admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff1', 'staff123')}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Staff</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">Collector</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">staff1 / staff123</p>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Credentials & Protection */}
      <div className="relative z-10 px-4 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role-Based ISP Access Control • Speedway Operations Engine</span>
        </div>
        <div>
          <span>Speedway Broadband Services © 2026 • Local Network Secure</span>
        </div>
      </div>

    </div>
  );
}
