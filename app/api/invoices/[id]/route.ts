import { NextResponse } from 'next/server';
import { getDb, getSystemSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/invoices/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getDb();

    const invoice = db.prepare(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        c.whatsapp as customer_whatsapp,
        c.email as customer_email,
        c.address as customer_address,
        c.pppoe_username,
        c.static_ip,
        pg.name as pg_name,
        pg.code as pg_code,
        pg.area_location as pg_location,
        pg.collector_name,
        pg.collector_phone
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN payment_groups pg ON i.pg_id = pg.id
      WHERE i.id = ?
    `).get(id) as any;

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Payments recorded for this invoice
    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE invoice_id = ? 
      ORDER BY payment_date DESC, created_at DESC
    `).all(id) as any[];

    const sysSettings = getSystemSettings(db);

    return NextResponse.json({
      success: true,
      invoice,
      payments,
      company: {
        name: sysSettings.company_name || 'Speedway Broadband Services',
        tagline: sysSettings.company_tagline || 'High-Speed Fiber Optical Internet Provider',
        gstin: sysSettings.gstin || '07AAAAA0000A1Z5',
        cin: 'U72900DL2024PTC123456',
        supportPhone: sysSettings.support_phone || '+91 98765 43210',
        supportEmail: sysSettings.support_email || 'billing@speedwaybroadband.in',
        officeAddress: sysSettings.office_address || 'Main Operations Hub, Sector 4, Central Tower, Delhi NCR - 110092',
        upiId: sysSettings.upi_id || 'speedwaybroadband@icici',
      }
    });
  } catch (error: any) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
