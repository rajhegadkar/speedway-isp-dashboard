# 🌐 Speedway Broadband Services — ISP Operations & Billing Management Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-ACID_Database-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Release](https://img.shields.io/badge/Release-v1.0.0-emerald?style=for-the-badge)](https://github.com/rajhegadkar/speedway-isp-dashboard/releases/tag/v1)

An enterprise-grade, modern ISP operations, billing, and subscriber lifecycle management platform custom-built for **Speedway Broadband Services**. Designed specifically for high-velocity daily internet service provider operations—eliminating forgotten due dates, tracking uncollected arrears across field hubs, generating compliant tax invoices with auto-filled NPCI UPI payment QR codes, dispatching 1-click WhatsApp payment reminders, and delivering 100% financial reconciliation.

---

## ⚡ Key Highlights & Core Capabilities

### 🌅 1. Time-Adaptive Executive Briefing & Live Shift Monitor
- **Dynamic Time-Based Greetings**: Automatically transitions between **Good Morning**, **Good Afternoon**, **Good Evening**, and **Good Night** based on the operator's current local time.
- **Shift & Action Pulse**: Displays a live shift monitor pill (e.g., `07:45 PM • EVENING SHIFT`) and synchronizes with the navigation sidebar pulse (`Morning Action Pulse`, `Afternoon Action Pulse`, `Evening Action Pulse`, `Night Action Pulse`).
- **12 Real-Time KPI Cards**: Strict color-coded operational cards with 100% live synchronization to the subscriber database:
  - 🟢 **Paid This Month** (Realized revenue)
  - 🟠 **Clients Due Today & Due Soon** (Immediate follow-up queue)
  - 🔴 **Overdue Clients & Critical Arrears** (Aged receivables)
  - 🔵 **Active Operational Lines** (Provisioned bandwidth)
  - ⚪ **Inactive / Disconnected Subscribers**
  - 🟣 **Suspended Lines** (Blocked optical links)
  - 💰 **Total Monthly Invoiced, Realized Collections, and Pending Arrears**

### 🔐 2. Role-Based Access Control (RBAC) & Secure Login
- Built-in session security with operator identity tracking across all administrative and collection operations.
- **Admin Role**: Full system configuration, plan creation/editing/deletion, payment group branch setup, company branding adjustments, and database re-seeding.
- **Staff / Collector Role**: Dedicated collection view, spot receipt creation, subscriber status inspection, and WhatsApp reminder dispatching with security guards on destructive settings.
- **One-Click Quick Sign-In**: Embedded developer/demo login shortcuts for immediate evaluation.

### 🏢 3. Multi-Branch Payment Groups (PGs) Management
- Segment operations across independent collection points, residential societies, commercial plazas, and field collectors.
- Real-time hub metrics: Total Subscribers, Active Lines, Total Monthly Billed, Realized Cash Collection, Pending Arrears, and Collection Efficiency Percentage (`%`).
- One-click global PG filter allows isolating the entire dashboard, client directory, and billing reports by any selected branch hub.

### 👥 4. Subscriber 360° Directory & Masked Credential Vault
- Full subscriber lifecycle profile: Customer ID (`SBS-2026-XXX`), Name, Mobile, WhatsApp, Email, Installation Address, PG Assignment, Plan, and Anchor Due Date.
- **Sensitive Credential Protection**: Encrypted/masked vault for PPPoE Username, PPPoE Password (with interactive reveal toggle), Static IP, and ONT/Router hardware information.
- Instant connection state toggles: Switch lines seamlessly between `ACTIVE`, `SUSPENDED`, and `DISCONNECTED`.
- Comprehensive search across subscriber name, customer ID, phone, PPPoE username, IP, or physical address.

### 🧾 5. Compliant Invoicing & Dynamic NPCI UPI 2.0 QR Code
- **Tax Invoices & Non-GST Invoices**: One-click toggle between official GST Tax Invoices (GSTIN, HSN/SAC `998422`, 18% CGST/SGST split, late fees) and clean non-tax bills.
- **Dynamic NPCI UPI 2.0 Payment QR**: Invoices automatically render a scannable QR code encoded with the merchant VPA (`speedwaybroadband@icici`), payee name, and the **exact balance due amount**. Subscribers scan with GPay, PhonePe, Paytm, or BHIM and pay immediately without manual amount entry.
- **Zero Drift Balance Math**: Invoices track original billing amount, payments applied, late charges, and outstanding balances with atomic integrity.
- **Zero Credential Leaks**: Subscriber PPPoE authentication passwords and network IDs are strictly omitted from printable bills for subscriber privacy.

### 📲 6. Multi-Channel Reminder Center (WhatsApp & SMS)
- Automated queues organized into:
  - ⏰ **Due Today**
  - ⚠️ **Overdue Follow-ups** (1–7 days, 8–15 days, and >15 days critical)
  - 📅 **Upcoming in 3 Days & 7 Days**
  - 🔄 **Plan Renewal Today**
- Pre-composed personalized messages with customer name, amount, due date, invoice ID, and direct payment details.
- 1-Click WhatsApp launch (`https://api.whatsapp.com/send?...`), 1-Click SMS, and quick clipboard copy.

### 📱 7. Adaptive Multi-Device Responsive Architecture
- **Dual-View Design**:
  - **Smartphones (< 768px)**: Touch-optimized subscriber cards, invoice summary cards, and arrears list with 1-tap call, payment, and WhatsApp reminder actions.
  - **Desktops & Tablets (≥ 768px)**: High-density 7-to-10 column enterprise data tables with sortable headers and multi-filter drawers.
- **Hardware-Keyboard & Mobile Screen Protection**: All system modals feature pinned headers, pinned action footers, and scrollable bodies (`max-h-[92vh] flex flex-col`) to prevent virtual keyboard button clipping.

### 🛡️ 8. Financial Analytics, Audit Trail & Database Safety
- Daily collections ledger, 6-month comparative trend charts, PG efficiency progress bars, and payment method breakdowns (UPI, Cash, Bank Transfer, Card).
- **Net Cash Flow Ledger**: Realized customer collections minus operational expenses (upstream fiber transit, maintenance, hardware).
- **Immutable Financial Audit Log**: Automatically captures operator ID, action timestamp, entity modified, and financial amounts for compliance and auditability.
- **1-Click Relational Backup**: Export an instantaneous JSON snapshot of all tables for zero data-loss disaster recovery.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14.2 (App Router) | Server-rendered pages & API route handlers |
| **User Interface** | React 18 + Tailwind CSS 3.4 | Adaptive responsive design system |
| **Icons** | Lucide React | High-clarity operational iconography |
| **QR Code Engine** | node-qrcode | Dynamic client/server NPCI UPI 2.0 QR generation |
| **Database** | Node.js Built-in SQLite (`node:sqlite`) | ACID transactional relational storage |
| **Language** | TypeScript 5 | End-to-end type safety & business validation |
| **Timezone & Locale** | `Asia/Kolkata` & `₹ INR` | Standard Indian telecom billing standards |

---

## 📋 Default Credentials (Quick Access)

The platform comes pre-configured with two default operator roles:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full access to all operations, plans, PGs, branding, and database reset |
| **Staff Collector** | `staff1` | `staff123` | Operational access to clients, payment collection, invoicing, and reminders |

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v9.x` or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/rajhegadkar/speedway-isp-dashboard.git
cd speedway-isp-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Launch Production Server
```bash
npm run start
```
By default, the server binds to `0.0.0.0:3000`, allowing local machines and mobile devices on the same Wi-Fi network to connect simultaneously.

---

## 📁 Project Architecture & File Structure

```
speedway-isp-dashboard/
├── app/
│   ├── api/
│   │   ├── audit/route.ts          # Immutable operator audit trail API
│   │   ├── auth/route.ts           # Authentication & session token verification
│   │   ├── backup/route.ts         # JSON snapshot database export & restore
│   │   ├── clients/route.ts        # Client listing, multi-filter search, creation
│   │   ├── clients/[id]/route.ts   # Customer 360 details, update, status patch
│   │   ├── dashboard/stats/route.ts# Real-time briefing KPIs & reconciliation metrics
│   │   ├── invoices/route.ts       # Master invoice list & batch generation
│   │   ├── invoices/[id]/route.ts  # Tax invoice view with company branding & GST
│   │   ├── network/route.ts        # Host Wi-Fi / LAN IP discovery for mobile devices
│   │   ├── payments/route.ts       # Payment recording & automatic due date rollover
│   │   ├── pgs/route.ts            # Payment Groups (PGs) CRUD & collection stats
│   │   ├── plans/route.ts          # Internet plans catalog & speed tiers
│   │   ├── reminders/route.ts      # Automated WhatsApp & SMS message queues
│   │   ├── reports/route.ts        # Revenue collections, expenses, and arrears aging
│   │   └── settings/route.ts       # System settings, branding & UPI VPA configuration
│   ├── invoices/[id]/print/        # Standalone clean-tab invoice print view
│   ├── globals.css                 # Tailwind directives, print media rules & touch styles
│   ├── layout.tsx                  # Root layout with responsive mobile viewport config
│   └── page.tsx                    # Main Speedway Dashboard Controller & Time Greeting
├── components/
│   ├── modals/
│   │   ├── AddClientModal.tsx      # Provision new subscriber with PPPoE vault
│   │   ├── ClientDetailsModal.tsx  # Customer 360 overview, history, and status toggles
│   │   ├── PGModal.tsx             # Create & configure branch payment groups
│   │   ├── PlanModal.tsx           # Configure speed tiers, price, and GST
│   │   ├── PrintInvoiceModal.tsx   # Modal invoice viewer with UPI QR & print controls
│   │   ├── RecordPaymentModal.tsx  # Spot collection modal with multi-mode payment entry
│   │   └── ReminderModal.tsx       # 1-click WhatsApp/SMS notification preview modal
│   ├── views/
│   │   ├── BackupView.tsx          # Database health, JSON backups, and audit trail
│   │   ├── ClientsView.tsx         # Responsive subscriber directory (cards + table)
│   │   ├── CustomizeView.tsx       # Plans, PGs, company branding, and reminder rules
│   │   ├── InvoicesView.tsx        # Responsive invoice registry (cards + table)
│   │   ├── PaymentsView.tsx        # Responsive payment receipts audit (cards + table)
│   │   ├── PGsView.tsx             # Payment Groups operational cards & efficiency bars
│   │   ├── RemindersView.tsx       # Categorized communication dispatcher
│   │   └── ReportsView.tsx         # Financial analytics, cash flow, and arrears CSV export
│   ├── DueCalendarWidget.tsx       # Monthly collection density heatmap
│   ├── DueTodayWidget.tsx          # Priority collection queue for today & tomorrow
│   ├── LoginPage.tsx               # Secure role-based login screen with quick-access demo
│   ├── Navbar.tsx                  # Global search, PG selector, Wi-Fi LAN access dialog
│   ├── OverdueTable.tsx            # Overdue arrears segmented into 1-7d, 8-15d, 15+d
│   ├── PGComparisonWidget.tsx      # Comparative hub collection efficiency widget
│   ├── RecentPaymentsWidget.tsx    # Live receipts audit feed
│   ├── RevenueChartWidget.tsx      # 6-Month billed vs collected revenue trend
│   ├── Sidebar.tsx                 # Navigation sidebar with time-adaptive Action Pulse
│   └── SummaryCards.tsx            # 12 Primary KPI summary metric cards
├── data/
│   ├── .gitkeep                    # Preserves database directory in Git
│   └── speedway.db                 # SQLite relational database (auto-created on start)
├── lib/
│   ├── billing-engine.ts           # Time-based greetings, due date engine, NPCI UPI URL
│   └── db.ts                       # Schema migrations, foreign keys & default seed data
├── types/
│   └── index.ts                    # TypeScript domain interfaces
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🧪 Comprehensive System Verification

The platform features an automated audit verification suite covering all core operations:

```bash
node scratch/run_full_audit.js
```

### Verified Audit Checklist:
- [x] **Authentication**: Role isolation (`admin` vs `staff`), case insensitivity, unauthorized route protection.
- [x] **Reconciliation**: 100% exact parity between dashboard KPI cards and subscriber directory counts.
- [x] **Branch Isolation**: Payment group filtering strictly isolates subscriber registries and collection metrics.
- [x] **Dynamic UPI 2.0**: Validated NPCI URI generation with exact auto-filled balances.
- [x] **Print Bill Privacy**: PPPoE authentication passwords and credentials completely omitted from invoices.
- [x] **Adaptive Responsive UI**: Validated mobile card views (< 768px) and desktop enterprise tables (≥ 768px).

---

## 📄 License & Credits

Developed for **Speedway Broadband Services** • High-Speed Optical Fiber Internet Operations.  
Built and maintained with ❤️ by [rajhegadkar](https://github.com/rajhegadkar).
