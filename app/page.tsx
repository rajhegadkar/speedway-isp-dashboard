'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SummaryCards from '@/components/SummaryCards';
import OverdueTable from '@/components/OverdueTable';
import DueTodayWidget from '@/components/DueTodayWidget';
import PGComparisonWidget from '@/components/PGComparisonWidget';
import DueCalendarWidget from '@/components/DueCalendarWidget';
import RevenueChartWidget from '@/components/RevenueChartWidget';
import RecentPaymentsWidget from '@/components/RecentPaymentsWidget';

// Views
import ClientsView from '@/components/views/ClientsView';
import PGsView from '@/components/views/PGsView';
import InvoicesView from '@/components/views/InvoicesView';
import PaymentsView from '@/components/views/PaymentsView';
import RemindersView from '@/components/views/RemindersView';
import ReportsView from '@/components/views/ReportsView';
import BackupView from '@/components/views/BackupView';
import CustomizeView from '@/components/views/CustomizeView';

// Modals
import RecordPaymentModal from '@/components/modals/RecordPaymentModal';
import AddClientModal from '@/components/modals/AddClientModal';
import ClientDetailsModal from '@/components/modals/ClientDetailsModal';
import PrintInvoiceModal from '@/components/modals/PrintInvoiceModal';
import ReminderModal from '@/components/modals/ReminderModal';
import PGModal from '@/components/modals/PGModal';
import LoginPage from '@/components/LoginPage';
import { getTimeGreeting, TimeGreetingInfo } from '@/lib/billing-engine';

export default function SpeedwayDashboardPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPG, setSelectedPG] = useState('ALL');
  const [clientFilter, setClientFilter] = useState<{
    filterType: string;
    dueDate?: string;
    label?: string;
  }>({ filterType: 'ALL' });
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stats data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pgList, setPgList] = useState<any[]>([]);
  const [planList, setPlanList] = useState<any[]>([]);
  const [allClientsList, setAllClientsList] = useState<any[]>([]);

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentPreselectedClient, setPaymentPreselectedClient] = useState<any>(null);

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderClient, setReminderClient] = useState<any>(null);
  const [reminderType, setReminderType] = useState<any>('DUE_TODAY');

  const [isAddPGOpen, setIsAddPGOpen] = useState(false);
  const [networkUrl, setNetworkUrl] = useState('http://192.168.1.128:3000');
  const [timeGreeting, setTimeGreeting] = useState<TimeGreetingInfo>(() => getTimeGreeting());

  useEffect(() => {
    setTimeGreeting(getTimeGreeting());
    const interval = setInterval(() => {
      setTimeGreeting(getTimeGreeting());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 1. Session verification on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('speedway_isp_user') || sessionStorage.getItem('speedway_isp_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved session:', e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // 2. Fetch network IP
  useEffect(() => {
    fetch('/api/network')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.networkUrl) setNetworkUrl(json.networkUrl);
      })
      .catch(() => {});
  }, []);

  // 3. Reactive fetch when authenticated and PG changes
  useEffect(() => {
    if (!currentUser) return;
    fetchDashboardStats();
    fetchPGs();
    fetchPlans();
    fetchClientsForOptions();
  }, [selectedPG, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('speedway_isp_user');
    sessionStorage.removeItem('speedway_isp_user');
    setCurrentUser(null);
  };

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?pgId=${selectedPG}`);
      const json = await res.json();
      if (json.success) {
        setDashboardData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPGs = async () => {
    try {
      const res = await fetch('/api/pgs');
      const json = await res.json();
      if (json.success) {
        setPgList(json.pgs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const json = await res.json();
      if (json.success) {
        setPlanList(json.plans);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClientsForOptions = async () => {
    try {
      const res = await fetch('/api/clients');
      const json = await res.json();
      if (json.success) {
        setAllClientsList(json.clients);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action Handlers
  const handleOpenRecordPayment = (client?: any) => {
    setPaymentPreselectedClient(client || null);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenReminder = (client: any, type: any = 'DUE_TODAY') => {
    setReminderClient(client);
    setReminderType(type);
    setIsReminderOpen(true);
  };

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsClientDetailsOpen(true);
  };

  const handlePrintInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsPrintInvoiceOpen(true);
  };

  const handlePaymentSuccess = (res: any) => {
    fetchDashboardStats();
    fetchClientsForOptions();
    fetchPGs();
  };

  const metrics = dashboardData?.metrics || {
    totalActiveClients: 0,
    totalInactiveClients: 0,
    totalSuspendedClients: 0,
    totalClientsDueToday: 0,
    totalOverdueClients: 0,
    totalPaidClientsThisMonth: 0,
    totalUnpaidClients: 0,
    totalMonthlyBillingAmount: 0,
    totalAmountCollectedThisMonth: 0,
    totalOutstandingAmount: 0,
    clientsExpiringSoon: 0,
    plansExpiringToday: 0,
  };

  // 1. Loading state while checking session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center mb-4 shadow-xl shadow-sky-600/30 animate-pulse">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-bold tracking-tight text-slate-200">Speedway Broadband Services</p>
        <p className="text-xs text-slate-500 mt-1">Verifying secure operations session...</p>
      </div>
    );
  }

  // 2. If not signed in, show secure LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        networkUrl={networkUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        selectedPG={selectedPG}
        onSelectPG={setSelectedPG}
        pgList={pgList}
        searchQuery={globalSearch}
        onSearchChange={(q) => {
          setGlobalSearch(q);
          if (q && activeTab !== 'clients') {
            setActiveTab('clients');
          }
        }}
        onOpenRecordPayment={() => handleOpenRecordPayment()}
        onOpenAddClient={() => setIsAddClientOpen(true)}
        onOpenBatchInvoice={() => setActiveTab('invoices')}
        onRefresh={() => {
          fetchDashboardStats();
          fetchPGs();
          fetchClientsForOptions();
        }}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueTodayCount={metrics.totalClientsDueToday}
        overdueCount={metrics.totalOverdueClients}
        networkUrl={networkUrl}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Body (Omitted when printing modal invoices) */}
      <div className="flex-1 flex no-print">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueTodayCount={metrics.totalClientsDueToday}
          overdueCount={metrics.totalOverdueClients}
          networkUrl={networkUrl}
          currentUser={currentUser}
          onLogout={handleLogout}
          pulseLabel={timeGreeting.pulseLabel}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* Main Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Time-Adaptive Greeting Banner */}
              <div className={`p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all duration-500 text-white ${
                timeGreeting.period === 'morning'
                  ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-slate-800'
                  : timeGreeting.period === 'afternoon'
                  ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-blue-900/60'
                  : timeGreeting.period === 'evening'
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/60'
                  : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Speedway Broadband Operations Control
                    </span>
                    {timeGreeting.timeString && (
                      <span className="text-[10px] font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                        {timeGreeting.timeString} • {timeGreeting.period.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                    {timeGreeting.fullGreeting}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                    You have <strong className="text-amber-300 underline font-extrabold">{metrics.totalClientsDueToday} clients due today</strong> and{' '}
                    <strong className="text-rose-300 underline font-extrabold">{metrics.totalOverdueClients} overdue clients</strong> requiring collection across {pgList.length} Payment Groups.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Send Due Reminders</span>
                  </button>

                  <button
                    onClick={() => handleOpenRecordPayment()}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Record Collection</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Notice */}
              {selectedPG !== 'ALL' && (
                <div className="p-3 sm:p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-sky-900 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                    <span>
                      Dashboard metrics currently filtered for: <strong>{pgList.find(p => p.id === selectedPG)?.name || selectedPG}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPG('ALL')}
                    className="font-bold text-sky-700 hover:text-sky-900 bg-white px-3 py-1.5 rounded-lg border border-sky-200 shadow-sm self-start sm:self-auto transition-colors"
                  >
                    ✕ Clear Filter (Show All Branches)
                  </button>
                </div>
              )}

              {/* 1. Summary Cards */}
              <section>
                <SummaryCards
                  metrics={metrics}
                  onFilterClick={(filterKey, targetTab, label) => {
                    if (targetTab === 'invoices') {
                      setActiveTab('invoices');
                    } else if (targetTab === 'payments') {
                      setActiveTab('payments');
                    } else {
                      setClientFilter({
                        filterType: filterKey,
                        label: label || filterKey,
                      });
                      setActiveTab('clients');
                    }
                  }}
                />
              </section>

              {/* 2. Overdue Attention Table */}
              <section>
                <OverdueTable
                  overdueBuckets={dashboardData?.overdueBuckets || { overdue1to7: [], overdue8to15: [], overdue15Plus: [] }}
                  onOpenPayment={handleOpenRecordPayment}
                  onOpenReminder={handleOpenReminder}
                  onViewClient={handleViewClient}
                  onViewAllOverdue={(bucket) => {
                    const label =
                      bucket === 'OVERDUE_1_7'
                        ? 'Overdue 1–7 Days'
                        : bucket === 'OVERDUE_8_15'
                        ? 'Overdue 8–15 Days'
                        : bucket === 'OVERDUE_15_PLUS'
                        ? 'Critical Overdue >15 Days'
                        : 'Overdue Clients';
                    setClientFilter({
                      filterType: bucket || 'OVERDUE',
                      label,
                    });
                    setActiveTab('clients');
                  }}
                />
              </section>

              {/* 3. Grid: Due Today & PG Comparison */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DueTodayWidget
                  dueTodayList={dashboardData?.dueTodayList || []}
                  upcomingList={dashboardData?.upcomingList || []}
                  onOpenPayment={handleOpenRecordPayment}
                  onOpenReminder={handleOpenReminder}
                  onViewClient={handleViewClient}
                  onViewAllDueToday={() => {
                    setClientFilter({
                      filterType: 'DUE_TODAY',
                      label: 'Due Today',
                    });
                    setActiveTab('clients');
                  }}
                />

                <PGComparisonWidget
                  pgStats={dashboardData?.pgCollectionStats || []}
                  onSelectPG={(pgId) => setSelectedPG(pgId)}
                  onViewClients={(pgId) => {
                    setSelectedPG(pgId);
                    const pgObj = pgList.find((p) => p.id === pgId);
                    setClientFilter({
                      filterType: 'ALL',
                      label: pgObj ? `Branch: ${pgObj.name}` : 'All Statuses',
                    });
                    setActiveTab('clients');
                  }}
                  selectedPG={selectedPG}
                />
              </section>

              {/* 4. Grid: Calendar Heatmap & Revenue Trend */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DueCalendarWidget
                  dueTodayList={dashboardData?.dueTodayList || []}
                  allClients={allClientsList}
                  onDayClick={(day) => {
                    setClientFilter({
                      filterType: 'DUE_DATE',
                      dueDate: day,
                      label: `Due on ${day}`,
                    });
                    setActiveTab('clients');
                  }}
                />

                <RevenueChartWidget
                  trendData={dashboardData?.monthlyTrend || []}
                />
              </section>

              {/* 5. Live Receipts Feed */}
              <section>
                <RecentPaymentsWidget
                  payments={dashboardData?.recentPayments || []}
                  onViewCustomer={handleViewClient}
                />
              </section>

            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <ClientsView
              onOpenAddClient={() => setIsAddClientOpen(true)}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenReminder={handleOpenReminder}
              onViewClient={handleViewClient}
              pgList={pgList}
              globalSearch={globalSearch}
              initialPG={selectedPG}
              initialFilterType={clientFilter.filterType}
              initialDueDate={clientFilter.dueDate}
              initialFilterLabel={clientFilter.label}
              onSelectPG={(pgId) => setSelectedPG(pgId)}
              currentUser={currentUser}
            />
          )}

          {/* Payment Groups Tab */}
          {activeTab === 'pgs' && (
            <PGsView
              onOpenAddPG={() => setIsAddPGOpen(true)}
              onFilterDashboard={(pgId) => {
                setSelectedPG(pgId);
                setActiveTab('dashboard');
              }}
              onViewClients={(pgId) => {
                setSelectedPG(pgId);
                const pgObj = pgList.find((p) => p.id === pgId);
                setClientFilter({
                  filterType: 'ALL',
                  label: pgObj ? `Branch: ${pgObj.name}` : 'All Statuses',
                });
                setActiveTab('clients');
              }}
              selectedPG={selectedPG}
              onSelectPG={(pgId) => setSelectedPG(pgId)}
            />
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <InvoicesView
              onPrintInvoice={handlePrintInvoice}
              onOpenRecordPayment={handleOpenRecordPayment}
              pgList={pgList}
            />
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <PaymentsView
              onOpenRecordPayment={() => handleOpenRecordPayment()}
              pgList={pgList}
            />
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <RemindersView
              onOpenReminderModal={handleOpenReminder}
              onOpenRecordPayment={handleOpenRecordPayment}
              pgList={pgList}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportsView pgList={pgList} />
          )}

          {/* Customize & Settings Tab */}
          {activeTab === 'customize' && (
            <CustomizeView
              onOpenAddPG={() => setIsAddPGOpen(true)}
              onRefreshGlobalData={() => {
                fetchDashboardStats();
                fetchPGs();
                fetchPlans();
                fetchClientsForOptions();
              }}
              currentUser={currentUser}
            />
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <BackupView currentUser={currentUser} />
          )}

        </main>
      </div>

      {/* Global Interactive Modals */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setPaymentPreselectedClient(null);
        }}
        preselectedClient={paymentPreselectedClient}
        clientsList={allClientsList}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        pgList={pgList}
        planList={planList}
        onClientCreated={() => {
          fetchDashboardStats();
          fetchClientsForOptions();
          fetchPGs();
        }}
      />

      <ClientDetailsModal
        isOpen={isClientDetailsOpen}
        onClose={() => {
          setIsClientDetailsOpen(false);
          setSelectedClientId(null);
        }}
        clientId={selectedClientId}
        onOpenPayment={handleOpenRecordPayment}
        onOpenReminder={handleOpenReminder}
        onPrintInvoice={handlePrintInvoice}
        currentUser={currentUser}
        onClientStatusChanged={() => {
          fetchDashboardStats();
          fetchClientsForOptions();
        }}
      />

      <PrintInvoiceModal
        isOpen={isPrintInvoiceOpen}
        onClose={() => {
          setIsPrintInvoiceOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => {
          setIsReminderOpen(false);
          setReminderClient(null);
        }}
        client={reminderClient}
        initialType={reminderType}
        onReminderLogged={() => {
          fetchDashboardStats();
        }}
      />

      <PGModal
        isOpen={isAddPGOpen}
        onClose={() => setIsAddPGOpen(false)}
        onSuccess={() => {
          fetchPGs();
          fetchDashboardStats();
        }}
      />
    </div>
  );
}
