import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';

    // Find first non-internal IPv4 address (prefer Wi-Fi or Ethernet)
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // If Wi-Fi or Ethernet, prioritize it
          if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') || name.toLowerCase().includes('ethernet')) {
            localIp = iface.address;
            break;
          } else if (localIp === '127.0.0.1') {
            localIp = iface.address;
          }
        }
      }
      if (name.toLowerCase().includes('wi-fi') && localIp !== '127.0.0.1') {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      localIp,
      port: 3000,
      networkUrl: `http://${localIp}:3000`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
