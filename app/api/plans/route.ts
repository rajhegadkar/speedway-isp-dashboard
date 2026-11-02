import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/plans - List all plans with subscriber count
export async function GET() {
  try {
    const db = getDb();
    const plans = db.prepare(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM customers c WHERE c.plan_id = p.id) as subscriber_count,
        (SELECT COUNT(*) FROM customers c WHERE c.plan_id = p.id AND c.connection_status = 'ACTIVE') as active_subscriber_count
      FROM internet_plans p
      ORDER BY p.price ASC
    `).all() as any[];

    return NextResponse.json({ success: true, count: plans.length, plans });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/plans - Create new plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (!body.name || !body.speed_mbps || body.price === undefined) {
      return NextResponse.json({ success: false, error: 'Plan name, speed, and price are required' }, { status: 400 });
    }

    const planCount = db.prepare(`SELECT count(*) as count FROM internet_plans`).get() as any;
    const planId = body.id?.trim() || `PLAN-${String((planCount?.count || 0) + 1).padStart(2, '0')}`;

    db.prepare(`
      INSERT INTO internet_plans (id, name, speed_mbps, price, tax_rate, billing_cycle, description, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      planId,
      body.name.trim(),
      Number(body.speed_mbps),
      Number(body.price),
      body.tax_rate !== undefined ? Number(body.tax_rate) : 18.0,
      body.billing_cycle || 'Monthly',
      body.description?.trim() || '',
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PLAN_CREATED', 'PLAN', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      planId,
      `Created Internet Plan "${body.name}" (${body.speed_mbps} Mbps @ ₹${body.price}/mo)`,
      now
    );

    return NextResponse.json({ success: true, message: 'Plan created successfully', planId });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/plans - Update existing plan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE internet_plans 
      SET 
        name = ?,
        speed_mbps = ?,
        price = ?,
        tax_rate = ?,
        billing_cycle = ?,
        description = ?,
        is_active = ?
      WHERE id = ?
    `).run(
      body.name.trim(),
      Number(body.speed_mbps),
      Number(body.price),
      body.tax_rate !== undefined ? Number(body.tax_rate) : 18.0,
      body.billing_cycle || 'Monthly',
      body.description?.trim() || '',
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PLAN_UPDATED', 'PLAN', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      body.id,
      `Updated Internet Plan "${body.name}" (${body.speed_mbps} Mbps @ ₹${body.price}/mo, Active: ${body.is_active ? 'Yes' : 'No'})`,
      now
    );

    return NextResponse.json({ success: true, message: 'Plan updated successfully' });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/plans - Delete or deactivate a plan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    const db = getDb();

    // Check if any clients are assigned to this plan
    const assigned = db.prepare(`SELECT COUNT(*) as count FROM customers WHERE plan_id = ?`).get(planId) as { count: number };

    if (assigned.count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete plan "${planId}" because it is currently assigned to ${assigned.count} subscriber(s). You can toggle it to "Inactive" instead to prevent new subscribers from choosing it.`,
      }, { status: 400 });
    }

    db.prepare(`DELETE FROM internet_plans WHERE id = ?`).run(planId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'PLAN_DELETED', 'PLAN', ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      planId,
      `Deleted unused Internet Plan ${planId}`,
      new Date().toISOString()
    );

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
