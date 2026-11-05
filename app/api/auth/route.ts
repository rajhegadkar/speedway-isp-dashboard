import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, full_name, role, phone 
      FROM users 
      WHERE LOWER(username) = LOWER(?) AND password = ?
    `).get(username?.trim(), password?.trim()) as any;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    // Log successful sign-in
    try {
      const now = new Date().toISOString();
      const auditId = 'AUDIT-' + Date.now();
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, 'LOGIN', 'USER_SESSION', ?, 'Operator successfully signed in via secure login', ?)
      `).run(auditId, user.full_name || user.username, user.id, now);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: user.role,
        phone: user.phone || '',
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
