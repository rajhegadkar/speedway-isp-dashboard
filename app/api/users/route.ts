import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/users - List all users (admin and staff)
export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role'); // e.g. 'staff' or 'admin'

    let query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.phone,
        u.is_active,
        u.created_at
      FROM users u
    `;
    const params: any[] = [];
    if (roleFilter) {
      query += ` WHERE u.role = ?`;
      params.push(roleFilter);
    }
    query += ` ORDER BY u.role ASC, u.full_name ASC`;

    const users = db.prepare(query).all(...params) as any[];

    // Fetch assigned PGs for each user
    const pgs = db.prepare(`SELECT id, name, code, collector_user_id, collector_name, collector_phone FROM payment_groups`).all() as any[];

    const enrichedUsers = users.map((user) => {
      const assigned = pgs.filter(
        (pg) =>
          pg.collector_user_id === user.id ||
          (pg.collector_name && user.full_name && pg.collector_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
      );
      return {
        ...user,
        assignedPGs: assigned.map((p) => ({ id: p.id, name: p.name, code: p.code })),
        assignedCount: assigned.length,
      };
    });

    return NextResponse.json({ success: true, count: enrichedUsers.length, users: enrichedUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/users - Create new staff/admin account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    const username = body.username?.trim().toLowerCase();
    const password = body.password?.trim();
    const fullName = body.full_name?.trim();
    const phone = body.phone?.trim() || '';
    const role = body.role?.trim().toLowerCase() === 'admin' ? 'admin' : 'staff';

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Login Username, and Password are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    // Check unique username
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username) as any;
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username "${username}" is already taken. Please choose another username.` },
        { status: 400 }
      );
    }

    const countRow = db.prepare('SELECT count(*) as count FROM users').get() as any;
    const nextNum = (countRow?.count || 0) + 1;
    const userId = `USR-${String(nextNum).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO users (id, username, password, full_name, role, phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(userId, username, password, fullName, role, phone, now);

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'USER_CREATED', 'USER', ?, ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        userId,
        `Created ${role.toUpperCase()} account for ${fullName} (@${username})`,
        now
      );
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Staff account created successfully for ${fullName}`,
      user: {
        id: userId,
        username,
        full_name: fullName,
        role,
        phone,
        is_active: 1,
        created_at: now,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/users - Update user details or reset password
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(body.id) as any;
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const fullName = body.full_name?.trim() || user.full_name;
    const phone = body.phone !== undefined ? body.phone.trim() : user.phone;
    const role = body.role ? (body.role.trim().toLowerCase() === 'admin' ? 'admin' : 'staff') : user.role;
    const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : user.is_active;
    const newPassword = body.password?.trim();

    if (newPassword && newPassword.length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    if (newPassword) {
      db.prepare(`
        UPDATE users 
        SET full_name = ?, phone = ?, role = ?, is_active = ?, password = ?
        WHERE id = ?
      `).run(fullName, phone, role, isActive, newPassword, body.id);
    } else {
      db.prepare(`
        UPDATE users 
        SET full_name = ?, phone = ?, role = ?, is_active = ?
        WHERE id = ?
      `).run(fullName, phone, role, isActive, body.id);
    }

    // Sync collector_name and collector_phone in payment_groups where collector_user_id = user.id
    try {
      db.prepare(`
        UPDATE payment_groups 
        SET collector_name = ?, collector_phone = ?
        WHERE collector_user_id = ?
      `).run(fullName, phone, body.id);
    } catch (_) {}

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'USER_UPDATED', 'USER', ?, ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        body.id,
        `Updated account details for ${fullName} (@${user.username})`,
        now
      );
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/users?id=... - Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const db = getDb();
    const now = new Date().toISOString();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Safety guard: cannot delete primary admin USR-001 or last admin
    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin'").get() as any;
      if ((adminCount?.count || 0) <= 1) {
        return NextResponse.json({ success: false, error: 'Cannot delete the only administrator account' }, { status: 400 });
      }
    }

    // Unlink any payment groups assigned to this user
    try {
      db.prepare(`UPDATE payment_groups SET collector_user_id = NULL WHERE collector_user_id = ?`).run(id);
    } catch (_) {}

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
        VALUES (?, 'Speedway Admin', 'USER_DELETED', 'USER', ?, ?, ?)
      `).run(
        `AUD-${Date.now()}`,
        id,
        `Removed user account ${user.full_name} (@${user.username})`,
        now
      );
    } catch (_) {}

    return NextResponse.json({ success: true, message: `Account for ${user.full_name} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
