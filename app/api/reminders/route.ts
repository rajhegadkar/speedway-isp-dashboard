import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString, getDaysDifference, composeReminderMessage } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/reminders - Generate actionable ready-to-send reminders for all clients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type') || 'ALL'; // ALL, DUE_TODAY, UPCOMING_3D, UPCOMING_7D, OVERDUE, RENEWAL
    const pgFilter = searchParams.get('pgId') || 'ALL';

    const db = getDb();
    const today = getTodayDateString();

    let sql = `
      SELECT 
        c.*,
        pg.name as pg_name,
        pl.name as plan_name,
        (
          SELECT COALESCE(SUM(balance_due), c.monthly_price) 
          FROM invoices 
          WHERE customer_id = c.id AND balance_due > 0
        ) as pending_amount,
        (
          SELECT id 
          FROM invoices 
          WHERE customer_id = c.id 
          ORDER BY invoice_date DESC LIMIT 1
        ) as latest_invoice_no
      FROM customers c
      JOIN payment_groups pg ON c.pg_id = pg.id
      JOIN internet_plans pl ON c.plan_id = pl.id
      WHERE c.connection_status != 'DISCONNECTED'
    `;
    const params: any[] = [];

    if (pgFilter !== 'ALL') {
      sql += ` AND c.pg_id = ?`;
      params.push(pgFilter);
    }

    const clients = db.prepare(sql).all(...params) as any[];

    const dueTodayReminders: any[] = [];
    const upcoming3dReminders: any[] = [];
    const upcoming7dReminders: any[] = [];
    const overdueReminders: any[] = [];
    const renewalReminders: any[] = [];

    for (const c of clients) {
      const daysDiff = getDaysDifference(c.payment_due_date, today);
      const amount = c.pending_amount > 0 ? c.pending_amount : c.monthly_price;
      const cleanPhone = (c.whatsapp || c.mobile || '').replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      if (c.payment_status !== 'PAID') {
        if (daysDiff === 0) {
          const reminder = composeReminderMessage('DUE_TODAY', {
            customerName: c.name,
            amount,
            dueDate: c.payment_due_date,
            invoiceNo: c.latest_invoice_no,
            pgName: c.pg_name,
            planName: c.plan_name,
          });
          const waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(reminder.message)}`;
          const smsUrl = `sms:${c.mobile}?body=${encodeURIComponent(reminder.message)}`;

          dueTodayReminders.push({
            id: `REM-${c.id}-TODAY`,
            customer: c,
            type: 'DUE_TODAY',
            category: 'Due Today',
            amount,
            dueDate: c.payment_due_date,
            daysDiff: 0,
            message: reminder.message,
            whatsappUrl: waUrl,
            smsUrl,
          });
        } else if (daysDiff < 0) {
          const overdueDays = Math.abs(daysDiff);
          let urgency = '1–7 Days Overdue';
          if (overdueDays > 15) urgency = 'Critical (>15 Days Overdue)';
          else if (overdueDays > 7) urgency = '8–15 Days Overdue';

          const reminder = composeReminderMessage('OVERDUE', {
            customerName: c.name,
            amount,
            dueDate: c.payment_due_date,
            invoiceNo: c.latest_invoice_no,
            pgName: c.pg_name,
            planName: c.plan_name,
          });
          const waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(reminder.message)}`;
          const smsUrl = `sms:${c.mobile}?body=${encodeURIComponent(reminder.message)}`;

          overdueReminders.push({
            id: `REM-${c.id}-OVERDUE`,
            customer: c,
            type: 'OVERDUE',
            category: urgency,
            amount,
            dueDate: c.payment_due_date,
            daysDiff,
            daysOverdue: overdueDays,
            message: reminder.message,
            whatsappUrl: waUrl,
            smsUrl,
          });
        } else if (daysDiff <= 3) {
          const reminder = composeReminderMessage('UPCOMING', {
            customerName: c.name,
            amount,
            dueDate: c.payment_due_date,
            invoiceNo: c.latest_invoice_no,
            pgName: c.pg_name,
            planName: c.plan_name,
          });
          const waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(reminder.message)}`;
          const smsUrl = `sms:${c.mobile}?body=${encodeURIComponent(reminder.message)}`;

          upcoming3dReminders.push({
            id: `REM-${c.id}-3D`,
            customer: c,
            type: 'UPCOMING_3D',
            category: `Due in ${daysDiff} Days`,
            amount,
            dueDate: c.payment_due_date,
            daysDiff,
            message: reminder.message,
            whatsappUrl: waUrl,
            smsUrl,
          });
        } else if (daysDiff <= 7) {
          const reminder = composeReminderMessage('UPCOMING', {
            customerName: c.name,
            amount,
            dueDate: c.payment_due_date,
            invoiceNo: c.latest_invoice_no,
            pgName: c.pg_name,
            planName: c.plan_name,
          });
          const waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(reminder.message)}`;
          const smsUrl = `sms:${c.mobile}?body=${encodeURIComponent(reminder.message)}`;

          upcoming7dReminders.push({
            id: `REM-${c.id}-7D`,
            customer: c,
            type: 'UPCOMING_7D',
            category: `Due in ${daysDiff} Days`,
            amount,
            dueDate: c.payment_due_date,
            daysDiff,
            message: reminder.message,
            whatsappUrl: waUrl,
            smsUrl,
          });
        }
      }

      // Renewal notice
      if (daysDiff === 0) {
        const renewal = composeReminderMessage('RENEWAL', {
          customerName: c.name,
          amount,
          dueDate: c.payment_due_date,
          planName: c.plan_name,
        });
        const waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(renewal.message)}`;
        renewalReminders.push({
          id: `REM-${c.id}-RENEWAL`,
          customer: c,
          type: 'RENEWAL',
          category: 'Plan Renewal Today',
          amount,
          dueDate: c.payment_due_date,
          daysDiff: 0,
          message: renewal.message,
          whatsappUrl: waUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        dueTodayCount: dueTodayReminders.length,
        upcoming3dCount: upcoming3dReminders.length,
        upcoming7dCount: upcoming7dReminders.length,
        overdueCount: overdueReminders.length,
        renewalCount: renewalReminders.length,
        totalActionable: dueTodayReminders.length + upcoming3dReminders.length + overdueReminders.length,
      },
      dueTodayReminders,
      upcoming3dReminders,
      upcoming7dReminders,
      overdueReminders,
      renewalReminders,
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/reminders/log - Track reminder dispatch
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, reminder_type, channel, recipient_phone, message_text } = body;
    const db = getDb();
    const now = new Date().toISOString();

    const id = `REM-LOG-${Date.now()}`;
    db.prepare(`
      INSERT INTO reminders (id, customer_id, reminder_type, channel, recipient_phone, message_text, status, sent_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'SENT', ?, ?)
    `).run(
      id,
      customer_id,
      reminder_type || 'MANUAL',
      channel || 'WhatsApp',
      recipient_phone,
      message_text,
      now,
      now
    );

    return NextResponse.json({ success: true, message: 'Reminder logged successfully', id });
  } catch (error: any) {
    console.error('Error logging reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
