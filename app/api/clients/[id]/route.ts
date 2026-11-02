import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString, getDaysDifference } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/clients/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDb();
    const today = getTodayDateString();

    const client = db.prepare(`
      SELECT 
        c.*, 
        pg.name as pg_name, 
        pg.code as pg_code,
        pg.area_location,
        pg.collector_name,
        pg.collector_phone,
        pl.name as plan_name, 
        pl.speed_mbps,
        pl.price as plan_base_price
      FROM customers c
      JOIN payment_groups pg ON c.pg_id = pg.id
      JOIN internet_plans pl ON c.plan_id = pl.id
      WHERE c.id = ?
    `).get(id) as any;

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Invoices for this customer
    const invoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE customer_id = ? 
      ORDER BY invoice_date DESC, created_at DESC
    `).all(id) as any[];

    // Payments for this customer
    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE customer_id = ? 
      ORDER BY payment_date DESC, created_at DESC
    `).all(id) as any[];

    // Reminders log
    const reminders = db.prepare(`
      SELECT * FROM reminders 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(id) as any[];

    const daysDiff = getDaysDifference(client.payment_due_date, today);

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        daysDiff,
        daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0,
      },
      invoices,
      payments,
      reminders,
    });
  } catch (error: any) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update client details
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE customers SET
        name = ?,
        mobile = ?,
        whatsapp = ?,
        email = ?,
        address = ?,
        pg_id = ?,
        plan_id = ?,
        monthly_price = ?,
        billing_start_date = ?,
        billing_cycle = ?,
        custom_cycle_days = ?,
        payment_due_date = ?,
        next_due_date = ?,
        payment_status = ?,
        connection_status = ?,
        router_ont_details = ?,
        pppoe_username = ?,
        pppoe_password = ?,
        static_ip = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name?.trim() || existing.name,
      body.mobile?.trim() || existing.mobile,
      body.whatsapp?.trim() || existing.whatsapp,
      body.email?.trim() || existing.email,
      body.address?.trim() || existing.address,
      body.pg_id || existing.pg_id,
      body.plan_id || existing.plan_id,
      body.monthly_price !== undefined ? body.monthly_price : existing.monthly_price,
      body.billing_start_date || existing.billing_start_date,
      body.billing_cycle || existing.billing_cycle,
      body.custom_cycle_days !== undefined ? body.custom_cycle_days : existing.custom_cycle_days,
      body.payment_due_date || existing.payment_due_date,
      body.next_due_date || existing.next_due_date,
      body.payment_status || existing.payment_status,
      body.connection_status || existing.connection_status,
      body.router_ont_details?.trim() || existing.router_ont_details,
      body.pppoe_username?.trim() || existing.pppoe_username,
      body.pppoe_password?.trim() || existing.pppoe_password,
      body.static_ip?.trim() || existing.static_ip,
      body.notes?.trim() || existing.notes,
      now,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'CLIENT_UPDATED', 'CUSTOMER', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      `Updated details for customer ${body.name || existing.name} (${id})`,
      now
    );

    return NextResponse.json({ success: true, message: 'Client updated successfully' });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/clients/[id] - Toggle Connection Status (Suspend, Reconnect, Disconnect)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { connection_status, reason } = body;
    const db = getDb();
    const now = new Date().toISOString();

    const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE customers 
      SET connection_status = ?, updated_at = ?
      WHERE id = ?
    `).run(connection_status, now, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'CONNECTION_STATUS_CHANGED', 'CUSTOMER', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      `Changed connection status from ${existing.connection_status} to ${connection_status}. Reason: ${reason || 'Manual Admin action'}`,
      now
    );

    return NextResponse.json({
      success: true,
      message: `Connection status updated to ${connection_status}`,
      connection_status,
    });
  } catch (error: any) {
    console.error('Error changing connection status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDb();
    const now = new Date().toISOString();

    const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Check outstanding balance
    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(balance_due), 0) as balance 
      FROM invoices 
      WHERE customer_id = ?
    `).get(id) as any;

    if (outstanding?.balance > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete client with pending unpaid balance of ₹${outstanding.balance}. Please settle balance or mark inactive.`,
      }, { status: 400 });
    }

    db.prepare(`DELETE FROM customers WHERE id = ?`).run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'CLIENT_DELETED', 'CUSTOMER', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      `Deleted customer ${existing.name} (${id})`,
      now
    );

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
