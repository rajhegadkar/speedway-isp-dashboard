import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString, calculateNextDueDate } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/payments - List payments with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pgId = searchParams.get('pgId') || 'ALL';
    const method = searchParams.get('method') || 'ALL';
    const customerId = searchParams.get('customerId') || '';
    const query = searchParams.get('q') || '';

    const db = getDb();
    let sql = `
      SELECT 
        p.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        pg.name as pg_name,
        pg.code as pg_code,
        i.billing_period,
        i.total_amount as invoice_total
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      JOIN payment_groups pg ON p.pg_id = pg.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (pgId !== 'ALL') {
      sql += ` AND p.pg_id = ?`;
      params.push(pgId);
    }

    if (method !== 'ALL') {
      sql += ` AND p.payment_method = ?`;
      params.push(method);
    }

    if (customerId) {
      sql += ` AND p.customer_id = ?`;
      params.push(customerId);
    }

    if (query) {
      sql += ` AND (p.id LIKE ? OR p.transaction_ref LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY p.payment_date DESC, p.created_at DESC`;

    const payments = db.prepare(sql).all(...params) as any[];

    return NextResponse.json({ success: true, count: payments.length, payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/payments - Record Payment with complete billing balance update & due date rollover
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_id,
      invoice_id,
      amount_received,
      payment_date,
      payment_method,
      transaction_ref,
      collected_by,
      notes,
    } = body;

    if (!customer_id || !amount_received || amount_received <= 0) {
      return NextResponse.json({ success: false, error: 'Customer and valid payment amount are required' }, { status: 400 });
    }

    const db = getDb();
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const payDate = payment_date || today;

    // Fetch customer
    const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customer_id) as any;
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Determine invoice to apply payment
    let targetInvoice: any = null;
    if (invoice_id) {
      targetInvoice = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(invoice_id) as any;
    } else {
      // Find oldest unpaid or partial invoice for customer
      targetInvoice = db.prepare(`
        SELECT * FROM invoices 
        WHERE customer_id = ? AND balance_due > 0 
        ORDER BY due_date ASC LIMIT 1
      `).get(customer_id) as any;
    }

    const payCount = db.prepare(`SELECT count(*) as count FROM payments`).get() as any;
    const paymentId = `RCP-2026-${String((payCount?.count || 0) + 1).padStart(4, '0')}`;
    const pgId = customer.pg_id;

    // Begin atomic transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      // 1. Insert Payment
      db.prepare(`
        INSERT INTO payments (
          id, invoice_id, customer_id, pg_id, amount_received, payment_date,
          payment_method, transaction_ref, collected_by, notes, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `).run(
        paymentId,
        targetInvoice?.id || null,
        customer_id,
        pgId,
        parseFloat(amount_received),
        payDate,
        payment_method || 'UPI',
        transaction_ref?.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        collected_by?.trim() || 'Speedway Admin',
        notes?.trim() || '',
        now
      );

      // 2. Update Invoice Balance if attached
      let newBalance = 0;
      let newInvoiceStatus = 'PAID';
      if (targetInvoice) {
        const curPaid = targetInvoice.amount_paid || 0;
        const total = targetInvoice.total_amount;
        const updatedPaid = curPaid + parseFloat(amount_received);
        newBalance = Math.max(0, total - updatedPaid);

        if (newBalance === 0) {
          newInvoiceStatus = 'PAID';
        } else if (newBalance > 0 && updatedPaid > 0) {
          newInvoiceStatus = 'PARTIAL';
        } else {
          newInvoiceStatus = 'UNPAID';
        }

        db.prepare(`
          UPDATE invoices 
          SET amount_paid = ?, balance_due = ?, payment_status = ?
          WHERE id = ?
        `).run(updatedPaid, newBalance, newInvoiceStatus, targetInvoice.id);
      }

      // 3. Check customer remaining unpaid invoices
      const remainingUnpaid = db.prepare(`
        SELECT count(*) as count, COALESCE(SUM(balance_due), 0) as totalBal 
        FROM invoices 
        WHERE customer_id = ? AND balance_due > 0
      `).get(customer_id) as any;

      let newCustPaymentStatus = 'PAID';
      let nextDueDate = customer.next_due_date;

      if (remainingUnpaid && remainingUnpaid.totalBal > 0) {
        newCustPaymentStatus = 'PARTIAL';
      } else {
        // Customer has fully paid off their dues!
        // Advance next due date according to their billing cycle
        newCustPaymentStatus = 'PAID';
        nextDueDate = calculateNextDueDate(
          customer.payment_due_date || customer.next_due_date || today,
          customer.billing_cycle,
          customer.custom_cycle_days
        );
      }

      // If connection was suspended due to overdue, re-activate upon payment
      let newConnectionStatus = customer.connection_status;
      if (customer.connection_status === 'SUSPENDED' || customer.connection_status === 'PAYMENT_DUE' || customer.connection_status === 'OVERDUE') {
        newConnectionStatus = 'ACTIVE';
      }

      db.prepare(`
        UPDATE customers 
        SET 
          payment_status = ?, 
          connection_status = ?,
          last_payment_date = ?,
          next_due_date = ?,
          payment_due_date = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        newCustPaymentStatus,
        newConnectionStatus,
        payDate,
        nextDueDate,
        nextDueDate,
        now,
        customer_id
      );

      // 4. Record Audit Log
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, 'PAYMENT_RECORDED', 'PAYMENT', ?, ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        collected_by || 'Speedway Admin',
        paymentId,
        `Recorded ₹${amount_received} via ${payment_method} for client ${customer.name} (${customer_id}). Invoice: ${targetInvoice?.id || 'Advance/Direct'}. Next due date rolled to: ${nextDueDate}`,
        now
      );

      db.exec('COMMIT;');

      return NextResponse.json({
        success: true,
        message: `Payment of ₹${amount_received} recorded successfully. Receipt #${paymentId}`,
        paymentId,
        invoiceId: targetInvoice?.id,
        invoiceStatus: newInvoiceStatus,
        nextDueDate,
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
