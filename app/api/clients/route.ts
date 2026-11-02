import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString, getDaysDifference } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/clients - Search, Filter, Sort
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const pgId = searchParams.get('pgId') || 'ALL';
    const filterType = searchParams.get('filterType') || '';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const connectionStatus = searchParams.get('connectionStatus') || 'ALL';
    const dueDate = searchParams.get('dueDate') || '';
    const billingCycle = searchParams.get('billingCycle') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'name'; // name, dueDate, outstanding, lastPaymentDate
    const sortOrder = searchParams.get('sortOrder') || 'ASC';

    const db = getDb();
    const today = getTodayDateString();

    let sql = `
      SELECT 
        c.*, 
        pg.name as pg_name, 
        pg.area_location,
        pl.name as plan_name, 
        pl.speed_mbps,
        (
          SELECT COALESCE(SUM(balance_due), 0) 
          FROM invoices 
          WHERE customer_id = c.id AND balance_due > 0
        ) as total_outstanding,
        (
          SELECT id 
          FROM invoices 
          WHERE customer_id = c.id 
          ORDER BY invoice_date DESC LIMIT 1
        ) as latest_invoice_id
      FROM customers c
      JOIN payment_groups pg ON c.pg_id = pg.id
      JOIN internet_plans pl ON c.plan_id = pl.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (query) {
      sql += ` AND (
        c.name LIKE ? OR 
        c.id LIKE ? OR 
        c.mobile LIKE ? OR 
        c.whatsapp LIKE ? OR 
        c.pppoe_username LIKE ? OR 
        c.address LIKE ? OR
        c.static_ip LIKE ?
      )`;
      const q = `%${query}%`;
      params.push(q, q, q, q, q, q, q);
    }

    if (pgId !== 'ALL') {
      sql += ` AND c.pg_id = ?`;
      params.push(pgId);
    }

    // Consolidated filter logic matching Dashboard Summary Cards & widgets
    const effectiveFilter = filterType || paymentStatus;

    if (effectiveFilter === 'ACTIVE' || connectionStatus === 'ACTIVE') {
      sql += ` AND c.connection_status = 'ACTIVE'`;
    } else if (effectiveFilter === 'INACTIVE' || connectionStatus === 'INACTIVE') {
      sql += ` AND (c.connection_status = 'INACTIVE' OR c.connection_status = 'DISCONNECTED')`;
    } else if (effectiveFilter === 'SUSPENDED' || connectionStatus === 'SUSPENDED') {
      sql += ` AND c.connection_status = 'SUSPENDED'`;
    } else if (effectiveFilter === 'DISCONNECTED' || connectionStatus === 'DISCONNECTED') {
      sql += ` AND c.connection_status = 'DISCONNECTED'`;
    } else if (effectiveFilter === 'PAID') {
      sql += ` AND c.payment_status = 'PAID'`;
    } else if (effectiveFilter === 'UNPAID') {
      sql += ` AND c.payment_status != 'PAID'`;
    } else if (effectiveFilter === 'DUE_TODAY') {
      sql += ` AND c.payment_status != 'PAID' AND (c.payment_due_date = ? OR c.payment_status = 'DUE_TODAY')`;
      params.push(today);
    } else if (effectiveFilter === 'OVERDUE') {
      sql += ` AND c.payment_status != 'PAID' AND c.payment_status != 'DUE_TODAY' AND c.payment_status != 'DUE_SOON' AND (c.payment_due_date < ? OR c.payment_status = 'OVERDUE')`;
      params.push(today);
    } else if (effectiveFilter === 'OVERDUE_1_7') {
      sql += ` AND c.payment_status != 'PAID' AND c.payment_status != 'DUE_TODAY' AND c.payment_status != 'DUE_SOON' AND c.payment_due_date < ? AND c.payment_due_date >= date(?, '-7 days')`;
      params.push(today, today);
    } else if (effectiveFilter === 'OVERDUE_8_15') {
      sql += ` AND c.payment_status != 'PAID' AND c.payment_status != 'DUE_TODAY' AND c.payment_status != 'DUE_SOON' AND c.payment_due_date < date(?, '-7 days') AND c.payment_due_date >= date(?, '-15 days')`;
      params.push(today, today);
    } else if (effectiveFilter === 'OVERDUE_15_PLUS') {
      sql += ` AND c.payment_status != 'PAID' AND c.payment_status != 'DUE_TODAY' AND c.payment_status != 'DUE_SOON' AND c.payment_due_date < date(?, '-15 days')`;
      params.push(today);
    } else if (effectiveFilter === 'DUE_SOON') {
      sql += ` AND c.payment_status != 'PAID' AND c.payment_status != 'DUE_TODAY' AND ((c.payment_due_date > ? AND c.payment_due_date <= date(?, '+7 days')) OR c.payment_status = 'DUE_SOON')`;
      params.push(today, today);
    } else if (effectiveFilter === 'RENEWAL_TODAY') {
      sql += ` AND c.payment_due_date = ?`;
      params.push(today);
    } else if (effectiveFilter === 'PARTIAL') {
      sql += ` AND c.payment_status = 'PARTIAL'`;
    }

    // Specific Due Date filter (e.g. from calendar heatmap)
    if (dueDate) {
      sql += ` AND c.payment_due_date = ?`;
      params.push(dueDate);
    }

    if (billingCycle !== 'ALL') {
      sql += ` AND c.billing_cycle = ?`;
      params.push(billingCycle);
    }

    // Sorting
    let orderByClause = 'ORDER BY c.name ASC';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (sortBy === 'dueDate') {
      orderByClause = `ORDER BY c.payment_due_date ${direction}`;
    } else if (sortBy === 'outstanding') {
      orderByClause = `ORDER BY total_outstanding ${direction}`;
    } else if (sortBy === 'lastPaymentDate') {
      orderByClause = `ORDER BY c.last_payment_date ${direction} NULLS LAST`;
    } else if (sortBy === 'createdAt') {
      orderByClause = `ORDER BY c.created_at ${direction}`;
    } else {
      orderByClause = `ORDER BY c.name ${direction}`;
    }

    sql += ` ${orderByClause}`;

    const clients = db.prepare(sql).all(...params) as any[];

    // Enrich with dynamic overdue days calculation
    const enrichedClients = clients.map((c) => {
      const daysDiff = getDaysDifference(c.payment_due_date, today);
      return {
        ...c,
        daysDiff,
        daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0,
      };
    });

    // Compute live metric counts for currently selected PG (so directory pills reflect exact counts)
    const pgFilterCond = pgId !== 'ALL' ? 'WHERE pg_id = ?' : '';
    const pgFilterParams = pgId !== 'ALL' ? [pgId] : [];
    const allForPg = db.prepare(`SELECT * FROM customers ${pgFilterCond}`).all(...pgFilterParams) as any[];

    let cAll = allForPg.length;
    let cActive = 0;
    let cInactive = 0;
    let cSuspended = 0;
    let cPaid = 0;
    let cUnpaid = 0;
    let cDueToday = 0;
    let cOverdue = 0;
    let cDueSoon = 0;
    let cPlansToday = 0;

    for (const c of allForPg) {
      if (c.connection_status === 'ACTIVE') cActive++;
      if (c.connection_status === 'INACTIVE' || c.connection_status === 'DISCONNECTED') cInactive++;
      if (c.connection_status === 'SUSPENDED') cSuspended++;
      if (c.payment_status === 'PAID') cPaid++;
      else cUnpaid++;

      const diff = getDaysDifference(c.payment_due_date, today);
      if (c.payment_status !== 'PAID') {
        if (diff === 0 || c.payment_status === 'DUE_TODAY') cDueToday++;
        else if (diff < 0 || c.payment_status === 'OVERDUE') cOverdue++;
        else if (diff <= 7 || c.payment_status === 'DUE_SOON') cDueSoon++;
      }
      if (diff === 0) cPlansToday++;
    }

    return NextResponse.json({
      success: true,
      count: enrichedClients.length,
      clients: enrichedClients,
      counts: {
        all: cAll,
        active: cActive,
        inactive: cInactive,
        suspended: cSuspended,
        paid: cPaid,
        unpaid: cUnpaid,
        dueToday: cDueToday,
        overdue: cOverdue,
        dueSoon: cDueSoon,
        plansToday: cPlansToday,
      },
      currentPG: pgId,
      today,
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Create New Client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();
    const today = getTodayDateString();

    // Auto-generate customer ID if not provided
    let customerId = body.id?.trim();
    if (!customerId) {
      const countRes = db.prepare(`SELECT count(*) as count FROM customers`).get() as any;
      const nextNum = (countRes?.count || 0) + 1;
      customerId = `SBS-2026-${String(nextNum).padStart(3, '0')}`;
    }

    // Check duplicate ID
    const existing = db.prepare(`SELECT id FROM customers WHERE id = ?`).get(customerId);
    if (existing) {
      return NextResponse.json({ success: false, error: `Customer ID ${customerId} already exists` }, { status: 400 });
    }

    // Plan validation
    const plan = db.prepare(`SELECT * FROM internet_plans WHERE id = ?`).get(body.plan_id) as any;
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Selected Internet Plan not found' }, { status: 400 });
    }

    // Calculate price with tax
    const monthlyPrice = body.monthly_price || (plan.price * (1 + plan.tax_rate / 100));
    const billingCycle = body.billing_cycle || 'Monthly';
    const billingStartDate = body.billing_start_date || today;
    const paymentDueDate = body.payment_due_date || today;
    const nextDueDate = body.next_due_date || paymentDueDate;
    const paymentStatus = body.payment_status || 'DUE_TODAY';
    const connectionStatus = body.connection_status || 'ACTIVE';

    db.prepare(`
      INSERT INTO customers (
        id, name, mobile, whatsapp, email, address, pg_id, plan_id,
        monthly_price, installation_date, billing_start_date, billing_cycle,
        custom_cycle_days, invoice_date, payment_due_date, last_payment_date,
        next_due_date, payment_status, connection_status, router_ont_details,
        pppoe_username, pppoe_password, static_ip, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      customerId,
      body.name.trim(),
      body.mobile.trim(),
      body.whatsapp?.trim() || body.mobile.trim(),
      body.email?.trim() || '',
      body.address.trim(),
      body.pg_id,
      body.plan_id,
      monthlyPrice,
      body.installation_date || today,
      billingStartDate,
      billingCycle,
      body.custom_cycle_days || null,
      body.invoice_date || today,
      paymentDueDate,
      null, // last_payment_date
      nextDueDate,
      paymentStatus,
      connectionStatus,
      body.router_ont_details?.trim() || '',
      body.pppoe_username?.trim() || `sbs_${body.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`,
      body.pppoe_password?.trim() || 'Speedway@123',
      body.static_ip?.trim() || '',
      body.notes?.trim() || '',
      now,
      now
    );

    // Automatically generate first invoice for new client
    const isGst = (body.include_gst === false || body.bill_type === 'WITHOUT_GST') ? 0 : 1;
    const invoiceCount = db.prepare(`SELECT count(*) as count FROM invoices`).get() as any;
    const invoiceId = `INV-2026-${String((invoiceCount?.count || 0) + 1001).padStart(4, '0')}`;
    const baseAmount = plan.price;
    const taxRate = isGst === 1 ? (plan.tax_rate || 18.0) : 0;
    const taxAmount = isGst === 1 ? (baseAmount * (taxRate / 100)) : 0;
    const totalAmount = baseAmount + taxAmount;

    db.prepare(`
      INSERT INTO invoices (
        id, customer_id, pg_id, plan_name, billing_period, invoice_date, due_date,
        base_amount, discount, tax_rate, tax_amount, late_fee, total_amount,
        amount_paid, balance_due, payment_status, notes, is_gst, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, 0, ?, ?, 0, ?,
        0, ?, 'UNPAID', 'First initial installation bill', ?, ?
      )
    `).run(
      invoiceId,
      customerId,
      body.pg_id,
      plan.name,
      `${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
      today,
      paymentDueDate,
      baseAmount,
      taxRate,
      taxAmount,
      totalAmount,
      totalAmount,
      isGst,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'CLIENT_CREATED', 'CUSTOMER', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      customerId,
      `Created customer ${body.name} (${customerId}) assigned to PG ${body.pg_id} with plan ${plan.name}`,
      now
    );

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      customerId,
      invoiceId,
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
