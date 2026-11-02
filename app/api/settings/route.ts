import { NextResponse } from 'next/server';
import { getDb, getSystemSettings, updateSystemSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/settings - Fetch all system and company settings
export async function GET() {
  try {
    const settings = getSystemSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/settings - Update system settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' || typeof value === 'number') {
        updateSystemSetting(key, String(value), db);
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, 'Speedway Admin', 'SETTINGS_UPDATED', 'SETTINGS', 'SYSTEM_SETTINGS', ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      `Updated system settings: ${Object.keys(body).join(', ')}`,
      now
    );

    const updatedSettings = getSystemSettings(db);
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
