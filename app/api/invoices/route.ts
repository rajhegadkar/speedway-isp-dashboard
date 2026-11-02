import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/invoices - List invoices with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pgId = searchParams.get('pgId') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const customerId = searchParams.get('customerId') || '';
    const query = searchParams.get('q') || '';

    const db = getDb();
    let sql = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        c.address as customer_address,
        pg.name as pg_name,
        pg.code as pg_code
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN payment_groups pg ON i.pg_id = pg.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (pgId !== 'ALL') {
      sql += ` AND i.pg_id = ?`;
      params.push(pgId);
    }

    if (status !== 'ALL') {
      sql += ` AND i.payment_status = ?`;
      params.push(status);
    }

    if (customerId) {
      sql += ` AND i.customer_id = ?`;
      params.push(customerId);
    }

    if (query) {
      sql += ` AND (i.id LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY i.invoice_date DESC, i.created_at DESC`;

    const invoices = db.prepare(sql).all(...params) as any[];

    return NextResponse.json({ success: true, count: invoices.length, invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/invoices - Generate Single or Batch Invoices with GST & Without GST options
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, customer_id, billing_period, pg_id, include_gst, bill_type } = body;
    const db = getDb();
    const today = getTodayDateString();
    const now = new Date().toISOString();

    const period = billing_period || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    // Determine GST flag: default true unless explicitly specified false or 'WITHOUT_GST'
    const isGst = (include_gst === false || bill_type === 'WITHOUT_GST') ? 0 : 1;

    if (mode === 'single') {
      if (!customer_id) {
        return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 });
      }

      // Check duplicate invoice for same client and billing period!
      const duplicate = db.prepare(`
        SELECT id FROM invoices WHERE customer_id = ? AND billing_period = ?
      `).get(customer_id, period) as any;

      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: `Invoice ${duplicate.id} already exists for client ${customer_id} for period "${period}". Duplicate invoices prevented!`,
        }, { status: 400 });
      }

      const client = db.prepare(`
        SELECT c.*, pl.name as plan_name, pl.price as base_price, pl.tax_rate
        FROM customers c
        JOIN internet_plans pl ON c.plan_id = pl.id
        WHERE c.id = ?
      `).get(customer_id) as any;

      if (!client) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
      }

      const invoiceCount = db.prepare(`SELECT count(*) as count FROM invoices`).get() as any;
      const invoiceId = `INV-2026-${String((invoiceCount?.count || 0) + 1001).padStart(4, '0')}`;
      const baseAmount = client.base_price;
      const discount = body.discount || 0;
      const lateFee = body.late_fee || 0;
      const taxable = Math.max(0, baseAmount - discount);

      // Tax calculation based on isGst
      const taxRate = isGst === 1 ? (client.tax_rate || 18.0) : 0;
      const taxAmount = isGst === 1 ? (taxable * taxRate) / 100 : 0;
      const totalAmount = taxable + taxAmount + lateFee;

      db.prepare(`
        INSERT INTO invoices (
          id, customer_id, pg_id, plan_name, billing_period, invoice_date, due_date,
          base_amount, discount, tax_rate, tax_amount, late_fee, total_amount,
          amount_paid, balance_due, payment_status, notes, is_gst, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          0, ?, 'UNPAID', ?, ?, ?
        )
      `).run(
        invoiceId,
        customer_id,
        client.pg_id,
        client.plan_name,
        period,
        body.invoice_date || today,
        body.due_date || client.payment_due_date || today,
        baseAmount,
        discount,
        taxRate,
        taxAmount,
        lateFee,
        totalAmount,
        totalAmount,
        body.notes || `Generated bill for ${period}`,
        isGst,
        now
      );

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'INVOICE_GENERATED', 'INVOICE', ?, ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        invoiceId,
        `Generated invoice ${invoiceId} for ${client.name} (${period}) total ₹${totalAmount} (Type: ${isGst ? 'With GST' : 'Without GST'})`,
        now
      );

      return NextResponse.json({
        success: true,
        message: `Invoice generated successfully (${isGst ? 'With GST' : 'Without GST'})`,
        invoiceId,
        isGst,
      });
    }

    if (mode === 'batch') {
      // Generate for all active clients who don't have an invoice for this period
      let query = `
        SELECT c.*, pl.name as plan_name, pl.price as base_price, pl.tax_rate
        FROM customers c
        JOIN internet_plans pl ON c.plan_id = pl.id
        WHERE c.connection_status = 'ACTIVE'
      `;
      const queryParams: any[] = [];
      if (pg_id && pg_id !== 'ALL') {
        query += ` AND c.pg_id = ?`;
        queryParams.push(pg_id);
      }

      const activeClients = db.prepare(query).all(...queryParams) as any[];

      let generatedCount = 0;
      let skippedCount = 0;

      for (const client of activeClients) {
        // Check if invoice exists
        const exists = db.prepare(`
          SELECT id FROM invoices WHERE customer_id = ? AND billing_period = ?
        `).get(client.id, period);

        if (exists) {
          skippedCount++;
          continue;
        }

        const invoiceCount = db.prepare(`SELECT count(*) as count FROM invoices`).get() as any;
        const invoiceId = `INV-2026-${String((invoiceCount?.count || 0) + 1001).padStart(4, '0')}`;
        const baseAmount = client.base_price;
        const taxRate = isGst === 1 ? (client.tax_rate || 18.0) : 0;
        const taxAmount = isGst === 1 ? (baseAmount * taxRate) / 100 : 0;
        const totalAmount = baseAmount + taxAmount;

        db.prepare(`
          INSERT INTO invoices (
            id, customer_id, pg_id, plan_name, billing_period, invoice_date, due_date,
            base_amount, discount, tax_rate, tax_amount, late_fee, total_amount,
            amount_paid, balance_due, payment_status, notes, is_gst, created_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, 0, ?, ?, 0, ?,
            0, ?, 'UNPAID', ?, ?, ?
          )
        `).run(
          invoiceId,
          client.id,
          client.pg_id,
          client.plan_name,
          period,
          today,
          client.payment_due_date,
          baseAmount,
          taxRate,
          taxAmount,
          totalAmount,
          totalAmount,
          `Batch billing cycle invoice for ${period}`,
          isGst,
          now
        );

        generatedCount++;
      }

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'BATCH_INVOICE_RUN', 'INVOICES', 'BATCH', ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        `Batch generated ${generatedCount} invoices (${isGst ? 'With GST' : 'Without GST'}) for period ${period}. Skipped ${skippedCount} existing.`,
        now
      );

      return NextResponse.json({
        success: true,
        message: `Batch generation complete: ${generatedCount} invoices generated (${isGst ? 'With GST' : 'Without GST'}), ${skippedCount} skipped (already billed).`,
        generatedCount,
        skippedCount,
        isGst,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid generation mode' }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
