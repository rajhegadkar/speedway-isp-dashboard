// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'speedway.db');

// Singleton instance
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'staff'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      area_location TEXT NOT NULL,
      collector_name TEXT NOT NULL,
      collector_phone TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS internet_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      speed_mbps INTEGER NOT NULL,
      price REAL NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 18.0, -- GST %
      billing_cycle TEXT NOT NULL DEFAULT 'Monthly',
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      address TEXT NOT NULL,
      pg_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      monthly_price REAL NOT NULL,
      installation_date TEXT NOT NULL,
      billing_start_date TEXT NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'Monthly', -- 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Custom'
      custom_cycle_days INTEGER,
      invoice_date TEXT,
      payment_due_date TEXT NOT NULL,
      last_payment_date TEXT,
      next_due_date TEXT NOT NULL,
      payment_status TEXT NOT NULL, -- 'PAID', 'DUE_SOON', 'DUE_TODAY', 'OVERDUE'
      connection_status TEXT NOT NULL, -- 'ACTIVE', 'PAYMENT_DUE', 'OVERDUE', 'SUSPENDED', 'DISCONNECTED', 'INACTIVE'
      router_ont_details TEXT,
      pppoe_username TEXT,
      pppoe_password TEXT,
      static_ip TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pg_id) REFERENCES payment_groups(id) ON DELETE RESTRICT,
      FOREIGN KEY (plan_id) REFERENCES internet_plans(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      pg_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      base_amount REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 18.0,
      tax_amount REAL NOT NULL DEFAULT 0,
      late_fee REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL,
      payment_status TEXT NOT NULL, -- 'PAID', 'PARTIAL', 'UNPAID', 'OVERDUE'
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (pg_id) REFERENCES payment_groups(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      customer_id TEXT NOT NULL,
      pg_id TEXT NOT NULL,
      amount_received REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL, -- 'Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'
      transaction_ref TEXT,
      collected_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (pg_id) REFERENCES payment_groups(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      channel TEXT NOT NULL, -- 'WhatsApp', 'SMS'
      recipient_phone TEXT NOT NULL,
      message_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PREPARED', -- 'PREPARED', 'SENT'
      sent_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      pg_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (pg_id) REFERENCES payment_groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE invoices ADD COLUMN is_gst INTEGER NOT NULL DEFAULT 1;');
  } catch (_) {
    // Column already exists
  }

  // Seed default settings if empty
  seedDefaultSettings(db);

  // Seed default data if empty
  seedInitialData(db);
}

export function getSystemSettings(db?: DatabaseSync): Record<string, string> {
  const database = db || getDb();
  try {
    const rows = database.prepare('SELECT key, value FROM system_settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return settings;
  } catch (e) {
    return {};
  }
}

export function updateSystemSetting(key: string, value: string, db?: DatabaseSync) {
  const database = db || getDb();
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

function seedDefaultSettings(db: DatabaseSync) {
  const now = new Date().toISOString();
  const defaults: Array<[string, string]> = [
    ['company_name', 'Speedway Broadband Services'],
    ['company_tagline', 'High-Speed Fiber Optical Internet Provider'],
    ['gstin', '07AAAAA0000A1Z5'],
    ['support_phone', '+91 98765 43210'],
    ['support_email', 'billing@speedwaybroadband.in'],
    ['office_address', 'Main Operations Hub, Sector 4, Central Tower, Delhi NCR - 110092'],
    ['upi_id', 'speedwaybroadband@icici'],
    ['default_bill_type', 'WITH_GST'],
    ['late_fee_amount', '50'],
    ['grace_period_days', '3'],
    ['whatsapp_upcoming_template', 'Hello {name}, your internet bill of {amount} for plan {plan} is due on {due_date}. Please pay on time to avoid service interruption. Thank you, {company}.'],
    ['whatsapp_today_template', 'URGENT: Hello {name}, your broadband bill of {amount} is due TODAY ({due_date}). Please pay before 9 PM to avoid interruption. Thank you, {company}.'],
    ['whatsapp_overdue_template', 'OVERDUE ALERT: Hello {name}, your internet bill of {amount} is OVERDUE ({due_date}). Please clear dues immediately to avoid disconnection. Thank you, {company}.'],
    ['whatsapp_confirmation_template', 'Payment Received: Thank you {name}, we received {amount} for invoice #{invoice}. Next due date: {next_due}. Thank you, {company}.'],
  ];

  for (const [k, v] of defaults) {
    try {
      db.prepare(`INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)`).run(k, v, now);
    } catch (_) {}
  }
}

function seedInitialData(db: DatabaseSync) {
  const userCheck = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCheck.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  // 1. Default Admin & Staff
  db.prepare(`
    INSERT INTO users (id, username, password, full_name, role, created_at)
    VALUES 
      ('USR-001', 'admin', 'admin123', 'Speedway Admin', 'admin', ?),
      ('USR-002', 'staff1', 'staff123', 'Rajesh Collector', 'staff', ?)
  `).run(now, now);

  // 2. Default Payment Groups (PGs)
  db.prepare(`
    INSERT INTO payment_groups (id, name, code, area_location, collector_name, collector_phone, is_active, created_at)
    VALUES
      ('PG-001', 'Sector 4 Main Hub', 'PG-SEC4', 'Sector 4, Central Area', 'Rajesh Verma', '+91 98765 43210', 1, ?),
      ('PG-002', 'North Enclave Collection', 'PG-NORT', 'North Enclave & Phase 2', 'Amit Kumar', '+91 98111 22334', 1, ?),
      ('PG-003', 'Market Complex Hub', 'PG-MKT', 'Central Commercial Plaza', 'Sunita Sharma', '+91 98222 33445', 1, ?),
      ('PG-004', 'Green Valley Residency', 'PG-GVR', 'Green Valley Towers A-G', 'Vikram Singh', '+91 98333 44556', 1, ?)
  `).run(now, now, now, now);

  // 3. Internet Plans
  db.prepare(`
    INSERT INTO internet_plans (id, name, speed_mbps, price, tax_rate, billing_cycle, description, is_active, created_at)
    VALUES
      ('PLAN-01', 'Fiber Starter 50M', 50, 499.0, 18.0, 'Monthly', 'Affordable unlimited 50 Mbps fiber broadband for home users', 1, ?),
      ('PLAN-02', 'Fiber Prime 100M', 100, 799.0, 18.0, 'Monthly', 'High-speed 100 Mbps fiber broadband with low ping', 1, ?),
      ('PLAN-03', 'Fiber Ultra 200M', 200, 1199.0, 18.0, 'Monthly', 'Ultra fast 200 Mbps for streaming 4K & heavy gaming', 1, ?),
      ('PLAN-04', 'Fiber GigaBiz 500M', 500, 2499.0, 18.0, 'Monthly', 'Commercial 500 Mbps fiber with static IP & 99.9% uptime SLA', 1, ?),
      ('PLAN-05', 'Quarterly Prime 100M', 100, 2249.0, 18.0, 'Quarterly', '3-Month bundle with 6% special savings discount', 1, ?)
  `).run(now, now, now, now, now);

  // Seed sample customers spanning:
  // Today's date reference: 2026-10-18
  const clientsData = [
    {
      id: 'SBS-2026-001',
      name: 'Rohan Sharma',
      mobile: '9876543210',
      whatsapp: '9876543210',
      email: 'rohan.sharma@gmail.com',
      address: 'Flat 402, Block B, Krishna Heights, Sector 4',
      pg_id: 'PG-001',
      plan_id: 'PLAN-02',
      monthly_price: 942.82,
      installation_date: '2025-04-10',
      billing_start_date: '2025-04-15',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-10',
      payment_due_date: '2026-10-18', // DUE TODAY
      last_payment_date: '2026-09-18',
      next_due_date: '2026-10-18',
      payment_status: 'DUE_TODAY',
      connection_status: 'ACTIVE',
      router_ont_details: 'Syrotech GPON ONT 2GE+WiFi (MAC: E0:CC:7B:44:11:01)',
      pppoe_username: 'sbs_rohan',
      pppoe_password: 'Password@987',
      static_ip: '10.20.4.112',
      notes: 'Customer prefers payment via GPay on the exact due date.',
    },
    {
      id: 'SBS-2026-002',
      name: 'Pooja Verma',
      mobile: '9811122334',
      whatsapp: '9811122334',
      email: 'pooja.verma@outlook.com',
      address: 'House 12B, North Enclave Phase 1',
      pg_id: 'PG-002',
      plan_id: 'PLAN-03',
      monthly_price: 1414.82,
      installation_date: '2025-06-12',
      billing_start_date: '2025-06-15',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-10',
      payment_due_date: '2026-10-18', // DUE TODAY
      last_payment_date: '2026-09-16',
      next_due_date: '2026-10-18',
      payment_status: 'DUE_TODAY',
      connection_status: 'ACTIVE',
      router_ont_details: 'Netlink Dual Band HG (MAC: 48:8D:36:12:33:9A)',
      pppoe_username: 'sbs_pooja',
      pppoe_password: 'Secret#442',
      static_ip: '10.20.2.45',
      notes: 'Send WhatsApp reminder in morning 10 AM.',
    },
    {
      id: 'SBS-2026-003',
      name: 'Aditya Infotech Pvt Ltd',
      mobile: '9822233445',
      whatsapp: '9822233445',
      email: 'accounts@adityainfotech.com',
      address: 'Shop 104-106, 1st Floor, Central Market Plaza',
      pg_id: 'PG-003',
      plan_id: 'PLAN-04',
      monthly_price: 2948.82,
      installation_date: '2024-11-01',
      billing_start_date: '2024-11-05',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-01',
      payment_due_date: '2026-10-12', // OVERDUE 6 DAYS (1-7 days)
      last_payment_date: '2026-09-10',
      next_due_date: '2026-10-12',
      payment_status: 'OVERDUE',
      connection_status: 'PAYMENT_DUE',
      router_ont_details: 'TP-Link Archer C6 + D-Link ONT',
      pppoe_username: 'aditya_commercial',
      pppoe_password: 'BizPass@2026',
      static_ip: '103.140.88.42',
      notes: 'Accounts department requires GST invoice in PDF.',
    },
    {
      id: 'SBS-2026-004',
      name: 'Vikas Malhotra',
      mobile: '9833344556',
      whatsapp: '9833344556',
      email: 'vikas.m@yahoo.com',
      address: 'Villa 28, Green Valley Residency',
      pg_id: 'PG-004',
      plan_id: 'PLAN-02',
      monthly_price: 942.82,
      installation_date: '2025-01-20',
      billing_start_date: '2025-01-25',
      billing_cycle: 'Monthly',
      invoice_date: '2026-09-25',
      payment_due_date: '2026-10-05', // OVERDUE 13 DAYS (8-15 days)
      last_payment_date: '2026-08-28',
      next_due_date: '2026-10-05',
      payment_status: 'OVERDUE',
      connection_status: 'OVERDUE',
      router_ont_details: 'Nokia G-140W-F Dual Band ONT',
      pppoe_username: 'sbs_vikas28',
      pppoe_password: 'Pass#9981',
      static_ip: '',
      notes: 'Call before visiting for cash pickup.',
    },
    {
      id: 'SBS-2026-005',
      name: 'Sunil Choudhary',
      mobile: '9844455667',
      whatsapp: '9844455667',
      email: 'sunil.c@gmail.com',
      address: 'Plot 77, Street 4, Sector 4',
      pg_id: 'PG-001',
      plan_id: 'PLAN-01',
      monthly_price: 588.82,
      installation_date: '2024-08-15',
      billing_start_date: '2024-09-01',
      billing_cycle: 'Monthly',
      invoice_date: '2026-09-15',
      payment_due_date: '2026-09-28', // OVERDUE > 15 DAYS (20 days late)
      last_payment_date: '2026-08-25',
      next_due_date: '2026-09-28',
      payment_status: 'OVERDUE',
      connection_status: 'SUSPENDED',
      router_ont_details: 'Digisol Single Port XPON ONT',
      pppoe_username: 'sbs_sunil77',
      pppoe_password: 'User@2025',
      static_ip: '',
      notes: 'Line suspended on Oct 10 due to prolonged non-payment.',
    },
    {
      id: 'SBS-2026-006',
      name: 'Dr. Meenakshi Joshi',
      mobile: '9855566778',
      whatsapp: '9855566778',
      email: 'meenakshi.clinic@gmail.com',
      address: 'Joshi Clinic, Market Complex 2nd Floor',
      pg_id: 'PG-003',
      plan_id: 'PLAN-02',
      monthly_price: 942.82,
      installation_date: '2025-03-01',
      billing_start_date: '2025-03-05',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-10',
      payment_due_date: '2026-10-19', // DUE TOMORROW
      last_payment_date: '2026-09-18',
      next_due_date: '2026-10-19',
      payment_status: 'DUE_SOON',
      connection_status: 'ACTIVE',
      router_ont_details: 'Syrotech 4-Port Dual Band ONT',
      pppoe_username: 'sbs_meenakshi',
      pppoe_password: 'Clinic#3321',
      static_ip: '',
      notes: 'Regular on-time client.',
    },
    {
      id: 'SBS-2026-007',
      name: 'Karan Mehra',
      mobile: '9866677889',
      whatsapp: '9866677889',
      email: 'karan.m@gmail.com',
      address: 'Flat 1102, Tower D, Green Valley Residency',
      pg_id: 'PG-004',
      plan_id: 'PLAN-03',
      monthly_price: 1414.82,
      installation_date: '2025-05-18',
      billing_start_date: '2025-05-20',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-11',
      payment_due_date: '2026-10-21', // DUE IN 3 DAYS
      last_payment_date: '2026-09-20',
      next_due_date: '2026-10-21',
      payment_status: 'DUE_SOON',
      connection_status: 'ACTIVE',
      router_ont_details: 'Huawei EchoLife HG8145V5',
      pppoe_username: 'sbs_karan1102',
      pppoe_password: 'Pass#0011',
      static_ip: '',
      notes: 'Requested automated reminder SMS.',
    },
    {
      id: 'SBS-2026-008',
      name: 'Ananya Deshmukh',
      mobile: '9877788990',
      whatsapp: '9877788990',
      email: 'ananya.d@gmail.com',
      address: 'House 44, North Enclave Phase 2',
      pg_id: 'PG-002',
      plan_id: 'PLAN-01',
      monthly_price: 588.82,
      installation_date: '2025-02-14',
      billing_start_date: '2025-02-15',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-15',
      payment_due_date: '2026-10-25', // DUE IN 7 DAYS
      last_payment_date: '2026-09-23',
      next_due_date: '2026-10-25',
      payment_status: 'DUE_SOON',
      connection_status: 'ACTIVE',
      router_ont_details: 'ZTE F670L Dual Band ONT',
      pppoe_username: 'sbs_ananya44',
      pppoe_password: 'Ananya@123',
      static_ip: '',
      notes: 'Online student, high priority support.',
    },
    {
      id: 'SBS-2026-009',
      name: 'Deepak Singhania',
      mobile: '9888899001',
      whatsapp: '9888899001',
      email: 'deepak.singhania@gmail.com',
      address: 'Shop 12, Ground Floor, Sector 4 Main Market',
      pg_id: 'PG-001',
      plan_id: 'PLAN-02',
      monthly_price: 942.82,
      installation_date: '2024-09-01',
      billing_start_date: '2024-09-05',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-01',
      payment_due_date: '2026-10-10',
      last_payment_date: '2026-10-08', // PAID THIS MONTH
      next_due_date: '2026-11-10',
      payment_status: 'PAID',
      connection_status: 'ACTIVE',
      router_ont_details: 'Syrotech GPON ONT',
      pppoe_username: 'sbs_deepak12',
      pppoe_password: 'ShopPass@12',
      static_ip: '',
      notes: 'Paid ₹943 via UPI on Oct 8.',
    },
    {
      id: 'SBS-2026-010',
      name: 'Simran Walia',
      mobile: '9899900112',
      whatsapp: '9899900112',
      email: 'simran.w@gmail.com',
      address: 'Apartment 5A, North Enclave',
      pg_id: 'PG-002',
      plan_id: 'PLAN-03',
      monthly_price: 1414.82,
      installation_date: '2025-01-10',
      billing_start_date: '2025-01-15',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-01',
      payment_due_date: '2026-10-10',
      last_payment_date: '2026-10-05', // PAID THIS MONTH
      next_due_date: '2026-11-10',
      payment_status: 'PAID',
      connection_status: 'ACTIVE',
      router_ont_details: 'Netlink HG524 ONT',
      pppoe_username: 'sbs_simran5a',
      pppoe_password: 'Walia@9911',
      static_ip: '',
      notes: 'Advance payer.',
    },
    {
      id: 'SBS-2026-011',
      name: 'Rameshwar Cables & Hardware',
      mobile: '9800011223',
      whatsapp: '9800011223',
      email: 'rameshwar.hw@yahoo.com',
      address: 'Shop 208, Central Market Plaza',
      pg_id: 'PG-003',
      plan_id: 'PLAN-01',
      monthly_price: 588.82,
      installation_date: '2024-05-15',
      billing_start_date: '2024-06-01',
      billing_cycle: 'Monthly',
      invoice_date: '2026-10-01',
      payment_due_date: '2026-10-12',
      last_payment_date: '2026-10-09', // PAID THIS MONTH
      next_due_date: '2026-11-12',
      payment_status: 'PAID',
      connection_status: 'ACTIVE',
      router_ont_details: 'Syrotech 2-Port ONT',
      pppoe_username: 'sbs_rameshwar',
      pppoe_password: 'Hard@4411',
      static_ip: '',
      notes: 'Paid cash to collector Sunita Sharma.',
    },
    {
      id: 'SBS-2026-012',
      name: 'Naveen Goswami',
      mobile: '9812345678',
      whatsapp: '9812345678',
      email: 'naveen.g@gmail.com',
      address: 'Villa 14, Green Valley Residency',
      pg_id: 'PG-004',
      plan_id: 'PLAN-05', // Quarterly plan
      monthly_price: 2653.82, // 2249 + 18% GST
      installation_date: '2025-07-18',
      billing_start_date: '2025-07-18',
      billing_cycle: 'Quarterly',
      invoice_date: '2026-10-18', // PLAN EXPIRING TODAY
      payment_due_date: '2026-10-18', // DUE TODAY
      last_payment_date: '2026-07-18',
      next_due_date: '2026-10-18',
      payment_status: 'DUE_TODAY',
      connection_status: 'ACTIVE',
      router_ont_details: 'TP-Link Archer AX1500 + D-Link ONT',
      pppoe_username: 'sbs_naveen_q',
      pppoe_password: 'QPass@7788',
      static_ip: '',
      notes: 'Quarterly cycle renews today. Call for renewal discount.',
    },
    {
      id: 'SBS-2026-013',
      name: 'Pankaj Tiwari',
      mobile: '9823456789',
      whatsapp: '9823456789',
      email: 'pankaj.t@gmail.com',
      address: 'Flat 204, Tower C, Green Valley Residency',
      pg_id: 'PG-004',
      plan_id: 'PLAN-02',
      monthly_price: 942.82,
      installation_date: '2024-03-10',
      billing_start_date: '2024-03-15',
      billing_cycle: 'Monthly',
      invoice_date: '2026-08-10',
      payment_due_date: '2026-08-20',
      last_payment_date: '2026-07-15',
      next_due_date: '2026-08-20',
      payment_status: 'OVERDUE',
      connection_status: 'DISCONNECTED', // DISCONNECTED / INACTIVE
      router_ont_details: 'ONT recovered by field staff',
      pppoe_username: 'sbs_pankaj_disc',
      pppoe_password: 'Pass#disc',
      static_ip: '',
      notes: 'Customer relocated out of state. Line permanently disconnected.',
    }
  ];

  const insertCustStmt = db.prepare(`
    INSERT INTO customers (
      id, name, mobile, whatsapp, email, address, pg_id, plan_id,
      monthly_price, installation_date, billing_start_date, billing_cycle,
      invoice_date, payment_due_date, last_payment_date, next_due_date,
      payment_status, connection_status, router_ont_details, pppoe_username,
      pppoe_password, static_ip, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  for (const c of clientsData) {
    insertCustStmt.run(
      c.id, c.name, c.mobile, c.whatsapp, c.email, c.address, c.pg_id, c.plan_id,
      c.monthly_price, c.installation_date, c.billing_start_date, c.billing_cycle,
      c.invoice_date, c.payment_due_date, c.last_payment_date, c.next_due_date,
      c.payment_status, c.connection_status, c.router_ont_details, c.pppoe_username,
      c.pppoe_password, c.static_ip, c.notes, now, now
    );
  }

  // 4. Invoices
  const invoicesData = [
    {
      id: 'INV-2026-1001',
      customer_id: 'SBS-2026-001',
      pg_id: 'PG-001',
      plan_name: 'Fiber Prime 100M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-10',
      due_date: '2026-10-18',
      base_amount: 799.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 143.82,
      late_fee: 0,
      total_amount: 942.82,
      amount_paid: 0,
      balance_due: 942.82,
      payment_status: 'UNPAID',
      notes: 'October billing cycle invoice'
    },
    {
      id: 'INV-2026-1002',
      customer_id: 'SBS-2026-002',
      pg_id: 'PG-002',
      plan_name: 'Fiber Ultra 200M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-10',
      due_date: '2026-10-18',
      base_amount: 1199.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 215.82,
      late_fee: 0,
      total_amount: 1414.82,
      amount_paid: 0,
      balance_due: 1414.82,
      payment_status: 'UNPAID',
      notes: 'October monthly bill'
    },
    {
      id: 'INV-2026-1003',
      customer_id: 'SBS-2026-003',
      pg_id: 'PG-003',
      plan_name: 'Fiber GigaBiz 500M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-01',
      due_date: '2026-10-12',
      base_amount: 2499.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 449.82,
      late_fee: 100.0,
      total_amount: 3048.82,
      amount_paid: 1000.0,
      balance_due: 2048.82,
      payment_status: 'PARTIAL',
      notes: 'Late fee ₹100 added. Partial payment ₹1000 received.'
    },
    {
      id: 'INV-2026-1004',
      customer_id: 'SBS-2026-004',
      pg_id: 'PG-004',
      plan_name: 'Fiber Prime 100M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-09-25',
      due_date: '2026-10-05',
      base_amount: 799.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 143.82,
      late_fee: 50.0,
      total_amount: 992.82,
      amount_paid: 0,
      balance_due: 992.82,
      payment_status: 'OVERDUE',
      notes: 'Overdue 13 days'
    },
    {
      id: 'INV-2026-1005',
      customer_id: 'SBS-2026-005',
      pg_id: 'PG-001',
      plan_name: 'Fiber Starter 50M',
      billing_period: 'Sep-Oct 2026',
      invoice_date: '2026-09-15',
      due_date: '2026-09-28',
      base_amount: 588.82,
      discount: 0,
      tax_rate: 0,
      tax_amount: 0,
      late_fee: 100.0,
      total_amount: 688.82,
      amount_paid: 0,
      balance_due: 688.82,
      payment_status: 'OVERDUE',
      notes: 'Overdue > 15 days, line suspended'
    },
    {
      id: 'INV-2026-1006',
      customer_id: 'SBS-2026-006',
      pg_id: 'PG-003',
      plan_name: 'Fiber Prime 100M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-10',
      due_date: '2026-10-19',
      base_amount: 799.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 143.82,
      late_fee: 0,
      total_amount: 942.82,
      amount_paid: 0,
      balance_due: 942.82,
      payment_status: 'UNPAID',
      notes: 'Due tomorrow'
    },
    {
      id: 'INV-2026-1007',
      customer_id: 'SBS-2026-007',
      pg_id: 'PG-004',
      plan_name: 'Fiber Ultra 200M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-11',
      due_date: '2026-10-21',
      base_amount: 1199.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 215.82,
      late_fee: 0,
      total_amount: 1414.82,
      amount_paid: 0,
      balance_due: 1414.82,
      payment_status: 'UNPAID',
      notes: 'Due in 3 days'
    },
    {
      id: 'INV-2026-1008',
      customer_id: 'SBS-2026-008',
      pg_id: 'PG-002',
      plan_name: 'Fiber Starter 50M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-15',
      due_date: '2026-10-25',
      base_amount: 499.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 89.82,
      late_fee: 0,
      total_amount: 588.82,
      amount_paid: 0,
      balance_due: 588.82,
      payment_status: 'UNPAID',
      notes: 'Due in 7 days'
    },
    {
      id: 'INV-2026-1009',
      customer_id: 'SBS-2026-009',
      pg_id: 'PG-001',
      plan_name: 'Fiber Prime 100M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-01',
      due_date: '2026-10-10',
      base_amount: 799.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 143.82,
      late_fee: 0,
      total_amount: 942.82,
      amount_paid: 942.82,
      balance_due: 0,
      payment_status: 'PAID',
      notes: 'Paid fully via UPI'
    },
    {
      id: 'INV-2026-1010',
      customer_id: 'SBS-2026-010',
      pg_id: 'PG-002',
      plan_name: 'Fiber Ultra 200M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-01',
      due_date: '2026-10-10',
      base_amount: 1199.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 215.82,
      late_fee: 0,
      total_amount: 1414.82,
      amount_paid: 1414.82,
      balance_due: 0,
      payment_status: 'PAID',
      notes: 'Paid in advance'
    },
    {
      id: 'INV-2026-1011',
      customer_id: 'SBS-2026-011',
      pg_id: 'PG-003',
      plan_name: 'Fiber Starter 50M',
      billing_period: 'Oct 2026',
      invoice_date: '2026-10-01',
      due_date: '2026-10-12',
      base_amount: 499.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 89.82,
      late_fee: 0,
      total_amount: 588.82,
      amount_paid: 588.82,
      balance_due: 0,
      payment_status: 'PAID',
      notes: 'Paid cash to collector'
    },
    {
      id: 'INV-2026-1012',
      customer_id: 'SBS-2026-012',
      pg_id: 'PG-004',
      plan_name: 'Quarterly Prime 100M',
      billing_period: 'Oct 2026 - Jan 2027',
      invoice_date: '2026-10-18',
      due_date: '2026-10-18',
      base_amount: 2249.0,
      discount: 0,
      tax_rate: 18.0,
      tax_amount: 404.82,
      late_fee: 0,
      total_amount: 2653.82,
      amount_paid: 0,
      balance_due: 2653.82,
      payment_status: 'UNPAID',
      notes: 'Quarterly cycle renewal due today'
    }
  ];

  const insertInvStmt = db.prepare(`
    INSERT INTO invoices (
      id, customer_id, pg_id, plan_name, billing_period, invoice_date, due_date,
      base_amount, discount, tax_rate, tax_amount, late_fee, total_amount,
      amount_paid, balance_due, payment_status, notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  for (const inv of invoicesData) {
    insertInvStmt.run(
      inv.id, inv.customer_id, inv.pg_id, inv.plan_name, inv.billing_period, inv.invoice_date, inv.due_date,
      inv.base_amount, inv.discount, inv.tax_rate, inv.tax_amount, inv.late_fee, inv.total_amount,
      inv.amount_paid, inv.balance_due, inv.payment_status, inv.notes, now
    );
  }

  // 5. Payment Records
  const paymentsData = [
    {
      id: 'RCP-2026-001',
      invoice_id: 'INV-2026-1009',
      customer_id: 'SBS-2026-009',
      pg_id: 'PG-001',
      amount_received: 942.82,
      payment_date: '2026-10-08',
      payment_method: 'UPI',
      transaction_ref: 'UPI/20261008/78219482',
      collected_by: 'Speedway Admin',
      notes: 'Google Pay transaction'
    },
    {
      id: 'RCP-2026-002',
      invoice_id: 'INV-2026-1010',
      customer_id: 'SBS-2026-010',
      pg_id: 'PG-002',
      amount_received: 1414.82,
      payment_date: '2026-10-05',
      payment_method: 'Bank Transfer',
      transaction_ref: 'NEFT/HDFC/99214710',
      collected_by: 'Amit Kumar',
      notes: 'Advance netbanking transfer'
    },
    {
      id: 'RCP-2026-003',
      invoice_id: 'INV-2026-1011',
      customer_id: 'SBS-2026-011',
      pg_id: 'PG-003',
      amount_received: 588.82,
      payment_date: '2026-10-09',
      payment_method: 'Cash',
      transaction_ref: 'CASH-REC-0419',
      collected_by: 'Sunita Sharma',
      notes: 'Hand cash collection at store'
    },
    {
      id: 'RCP-2026-004',
      invoice_id: 'INV-2026-1003',
      customer_id: 'SBS-2026-003',
      pg_id: 'PG-003',
      amount_received: 1000.0,
      payment_date: '2026-10-15',
      payment_method: 'UPI',
      transaction_ref: 'UPI/20261015/3349182',
      collected_by: 'Speedway Admin',
      notes: 'Part-payment on account'
    }
  ];

  const insertPayStmt = db.prepare(`
    INSERT INTO payments (
      id, invoice_id, customer_id, pg_id, amount_received, payment_date,
      payment_method, transaction_ref, collected_by, notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  for (const p of paymentsData) {
    insertPayStmt.run(
      p.id, p.invoice_id, p.customer_id, p.pg_id, p.amount_received, p.payment_date,
      p.payment_method, p.transaction_ref, p.collected_by, p.notes, now
    );
  }

  // 6. Expenses
  db.prepare(`
    INSERT INTO expenses (id, category, amount, expense_date, pg_id, notes, created_at)
    VALUES
      ('EXP-001', 'Bandwidth Upstream', 15000.0, '2026-10-01', NULL, 'Tata Tele Lease Line monthly transit bandwidth', ?),
      ('EXP-002', 'Fiber Maintenance', 3500.0, '2026-10-06', 'PG-001', 'Sector 4 fiber cut splicing & 2 joint closures', ?),
      ('EXP-003', 'Hardware & Patch Cords', 4200.0, '2026-10-12', 'PG-004', 'Batch of 10 GPON ONTs and 50 fiber patch cords', ?)
  `).run(now, now, now);

  // 7. Initial Audit Log
  db.prepare(`
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
    VALUES
      ('AUD-001', 'System', 'SYSTEM_INITIALIZED', 'DATABASE', 'SPEEDWAY_MAIN', 'Initialized database schema and initial active customer records.', ?)
  `).run(now);
}
