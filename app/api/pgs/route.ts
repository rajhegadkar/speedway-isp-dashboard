import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/pgs - List all PGs with live aggregated financial and client statistics
export async function GET() {
  try {
    const db = getDb();
    const today = getTodayDateString();
    const currentYearMonth = today.substring(0, 7);

    const pgs = db.prepare(`SELECT * FROM payment_groups ORDER BY name ASC`).all() as any[];

    const enrichedPGs = pgs.map((pg) => {
      // Client counts
      const clientStats = db.prepare(`
        SELECT 
          COUNT(*) as totalClients,
          SUM(CASE WHEN connection_status = 'ACTIVE' THEN 1 ELSE 0 END) as activeClients,
          SUM(CASE WHEN connection_status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspendedClients,
          SUM(CASE WHEN connection_status IN ('INACTIVE', 'DISCONNECTED') THEN 1 ELSE 0 END) as inactiveClients,
          SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paidClients,
          SUM(CASE WHEN payment_status != 'PAID' THEN 1 ELSE 0 END) as unpaidClients
        FROM customers
        WHERE pg_id = ?
      `).get(pg.id) as any;

      // Billing & collection metrics for this month
      const monthlyInvoiceStats = db.prepare(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as monthlyBillingAmount,
          COALESCE(SUM(balance_due), 0) as pendingAmount
        FROM invoices
        WHERE pg_id = ? AND invoice_date LIKE ?
      `).get(pg.id, `${currentYearMonth}%`) as any;

      // Total all-time collection & this month collection
      const paymentStats = db.prepare(`
        SELECT 
          COALESCE(SUM(amount_received), 0) as allTimeCollected,
          COALESCE(SUM(CASE WHEN payment_date LIKE ? THEN amount_received ELSE 0 END), 0) as monthlyCollected
        FROM payments
        WHERE pg_id = ?
      `).get(`${currentYearMonth}%`, pg.id) as any;

      // All-time outstanding
      const allTimeOutstanding = db.prepare(`
        SELECT COALESCE(SUM(balance_due), 0) as totalOutstanding
        FROM invoices
        WHERE pg_id = ? AND balance_due > 0
      `).get(pg.id) as any;

      const billed = monthlyInvoiceStats?.monthlyBillingAmount || 0;
      const collected = paymentStats?.monthlyCollected || 0;
      const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

      return {
        ...pg,
        totalClients: clientStats?.totalClients || 0,
        activeClients: clientStats?.activeClients || 0,
        suspendedClients: clientStats?.suspendedClients || 0,
        inactiveClients: clientStats?.inactiveClients || 0,
        paidClients: clientStats?.paidClients || 0,
        unpaidClients: clientStats?.unpaidClients || 0,
        monthlyBillingAmount: billed,
        totalAmountCollected: collected,
        allTimeCollected: paymentStats?.allTimeCollected || 0,
        pendingPaymentAmount: monthlyInvoiceStats?.pendingAmount || 0,
        totalOutstandingAmount: allTimeOutstanding?.totalOutstanding || 0,
        collectionRate,
      };
    });

    return NextResponse.json({ success: true, count: enrichedPGs.length, pgs: enrichedPGs });
  } catch (error: any) {
    console.error('Error fetching PGs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/pgs - Create new PG
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (!body.name || !body.area_location) {
      return NextResponse.json({ success: false, error: 'PG Name and Area Location are required' }, { status: 400 });
    }

    const pgCount = db.prepare(`SELECT count(*) as count FROM payment_groups`).get() as any;
    const nextNum = (pgCount?.count || 0) + 1;
    const pgId = body.id?.trim() || `PG-${String(nextNum).padStart(3, '0')}`;
    const code = body.code?.trim() || `PG-${body.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}-${nextNum}`;

    db.prepare(`
      INSERT INTO payment_groups (id, name, code, area_location, collector_name, collector_phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      pgId,
      body.name.trim(),
      code,
      body.area_location.trim(),
      body.collector_name?.trim() || 'Unassigned',
      body.collector_phone?.trim() || '',
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PG_CREATED', 'PAYMENT_GROUP', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      pgId,
      `Created Payment Group ${body.name} (${code}) in ${body.area_location}`,
      now
    );

    return NextResponse.json({ success: true, message: 'Payment Group created successfully', pgId });
  } catch (error: any) {
    console.error('Error creating PG:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/pgs - Update PG
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'PG ID is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE payment_groups 
      SET name = ?, code = ?, area_location = ?, collector_name = ?, collector_phone = ?, is_active = ?
      WHERE id = ?
    `).run(
      body.name.trim(),
      body.code.trim(),
      body.area_location.trim(),
      body.collector_name?.trim() || 'Unassigned',
      body.collector_phone?.trim() || '',
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PG_UPDATED', 'PAYMENT_GROUP', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      body.id,
      `Updated Payment Group ${body.name}`,
      now
    );

    return NextResponse.json({ success: true, message: 'Payment Group updated successfully' });
  } catch (error: any) {
    console.error('Error updating PG:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/pgs - Delete a payment group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pgId = searchParams.get('id');

    if (!pgId) {
      return NextResponse.json({ success: false, error: 'PG ID is required' }, { status: 400 });
    }

    const db = getDb();
    const assigned = db.prepare(`SELECT COUNT(*) as count FROM customers WHERE pg_id = ?`).get(pgId) as { count: number };

    if (assigned.count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete Payment Group "${pgId}" because it has ${assigned.count} assigned subscriber(s). Please reassign them to another PG before deleting.`,
      }, { status: 400 });
    }

    db.prepare(`DELETE FROM payment_groups WHERE id = ?`).run(pgId);

    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PG_DELETED', 'PAYMENT_GROUP', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      pgId,
      `Deleted Payment Group ${pgId}`,
      new Date().toISOString()
    );

    return NextResponse.json({ success: true, message: 'Payment Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting PG:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
