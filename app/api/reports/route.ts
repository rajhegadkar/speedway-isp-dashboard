import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayDateString } from '@/lib/billing-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/reports - Financial analytics & reporting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pgFilter = searchParams.get('pgId') || 'ALL';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const db = getDb();
    const today = getTodayDateString();

    const pgConditionPay = pgFilter !== 'ALL' ? 'AND p.pg_id = ?' : '';
    const payParams = pgFilter !== 'ALL' ? [pgFilter] : [];

    // 1. Daily Collections (last 14 days)
    const dailyCollections = db.prepare(`
      SELECT payment_date, COUNT(*) as count, SUM(amount_received) as total
      FROM payments p
      WHERE 1=1 ${pgConditionPay}
      GROUP BY payment_date
      ORDER BY payment_date DESC
      LIMIT 14
    `).all(...payParams) as any[];

    // 2. Monthly Collections (grouped by YYYY-MM)
    const monthlyCollections = db.prepare(`
      SELECT SUBSTR(payment_date, 1, 7) as month, COUNT(*) as count, SUM(amount_received) as total
      FROM payments p
      WHERE 1=1 ${pgConditionPay}
      GROUP BY SUBSTR(payment_date, 1, 7)
      ORDER BY month DESC
      LIMIT 12
    `).all(...payParams) as any[];

    // 3. PG-wise Collections and Outstanding
    const pgReport = db.prepare(`
      SELECT 
        pg.id, pg.name, pg.code, pg.area_location, pg.collector_name,
        (
          SELECT COALESCE(SUM(amount_received), 0)
          FROM payments 
          WHERE pg_id = pg.id
        ) as total_collected,
        (
          SELECT COALESCE(SUM(balance_due), 0)
          FROM invoices 
          WHERE pg_id = pg.id AND balance_due > 0
        ) as total_outstanding,
        (
          SELECT COUNT(*) 
          FROM customers 
          WHERE pg_id = pg.id
        ) as customer_count,
        (
          SELECT COUNT(*) 
          FROM customers 
          WHERE pg_id = pg.id AND connection_status = 'ACTIVE'
        ) as active_count
      FROM payment_groups pg
      ORDER BY pg.name ASC
    `).all() as any[];

    // 4. Client-wise Outstanding Balances
    const clientOutstandingReport = db.prepare(`
      SELECT 
        c.id, c.name, c.mobile, c.payment_due_date, c.payment_status, c.connection_status,
        pg.name as pg_name,
        COALESCE(SUM(i.balance_due), 0) as balance_due,
        COUNT(i.id) as unpaid_invoices_count
      FROM customers c
      JOIN payment_groups pg ON c.pg_id = pg.id
      JOIN invoices i ON c.id = i.customer_id
      WHERE i.balance_due > 0
      ${pgFilter !== 'ALL' ? 'AND c.pg_id = ?' : ''}
      GROUP BY c.id
      ORDER BY balance_due DESC
    `).all(...(pgFilter !== 'ALL' ? [pgFilter] : [])) as any[];

    // 5. Payment Methods Breakdown
    const methodReport = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(amount_received) as total
      FROM payments p
      WHERE 1=1 ${pgConditionPay}
      GROUP BY payment_method
      ORDER BY total DESC
    `).all(...payParams) as any[];

    // 6. Plan-wise revenue & subscriber counts
    const planReport = db.prepare(`
      SELECT 
        pl.id, pl.name, pl.speed_mbps, pl.price,
        COUNT(c.id) as subscriber_count,
        COALESCE(SUM(c.monthly_price), 0) as monthly_recurring_revenue
      FROM internet_plans pl
      LEFT JOIN customers c ON pl.id = c.plan_id AND c.connection_status = 'ACTIVE'
      GROUP BY pl.id
      ORDER BY monthly_recurring_revenue DESC
    `).all() as any[];

    // 7. Expenses & Net Collections
    const expenses = db.prepare(`
      SELECT * FROM expenses ORDER BY expense_date DESC
    `).all() as any[];

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCollectedAllTime = db.prepare(`
      SELECT COALESCE(SUM(amount_received), 0) as total FROM payments
    `).get() as any;
    const netCollection = (totalCollectedAllTime?.total || 0) - totalExpense;

    return NextResponse.json({
      success: true,
      dailyCollections,
      monthlyCollections,
      pgReport,
      clientOutstandingReport,
      methodReport,
      planReport,
      expenses,
      financialSummary: {
        totalRevenueCollected: totalCollectedAllTime?.total || 0,
        totalExpenses: totalExpense,
        netCashFlow: netCollection,
      }
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
