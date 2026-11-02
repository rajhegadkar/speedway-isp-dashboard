import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/backup - Export full database dump
export async function GET() {
  try {
    const db = getDb();

    const data = {
      backupTimestamp: new Date().toISOString(),
      ispName: 'Speedway Broadband Services',
      version: '1.0.0',
      tables: {
        payment_groups: db.prepare('SELECT * FROM payment_groups').all(),
        internet_plans: db.prepare('SELECT * FROM internet_plans').all(),
        customers: db.prepare('SELECT * FROM customers').all(),
        invoices: db.prepare('SELECT * FROM invoices').all(),
        payments: db.prepare('SELECT * FROM payments').all(),
        expenses: db.prepare('SELECT * FROM expenses').all(),
        audit_logs: db.prepare('SELECT * FROM audit_logs').all(),
      }
    };

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="Speedway_Broadband_Backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating backup:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/backup - Reset or restore sample data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = getDb();

    if (action === 'reset_demo') {
      db.exec(`
        DELETE FROM payments;
        DELETE FROM invoices;
        DELETE FROM customers;
        DELETE FROM internet_plans;
        DELETE FROM payment_groups;
        DELETE FROM expenses;
        DELETE FROM audit_logs;
        DELETE FROM users;
      `);

      // Trigger re-seed
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'DATABASE_RESET', 'DATABASE', 'MAIN', 'Database reset to clean state.', ?)
      `).run(`AUD-${Date.now()}`, now);

      return NextResponse.json({ success: true, message: 'Database reset successfully' });
    }

    return NextResponse.json({ success: false, error: 'Unsupported backup action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing backup action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
