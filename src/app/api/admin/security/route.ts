import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const auditEvents = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
        hospital: { select: { name: true } }
      }
    });

    const failedLogins = [
      { id: 'fl-101', ip: '192.168.1.45', email: 'unknown.user@external.com', timestamp: '2026-09-03 12:45:10', reason: 'Invalid Password Attempt', status: 'BLOCKED_IP' },
      { id: 'fl-102', ip: '10.0.0.12', email: 'test.admin@metrohospital.org', timestamp: '2026-09-03 09:12:00', reason: 'Expired Authorization Session', status: 'RESOLVED' }
    ];

    const activeSessions = [
      { id: 'sess-01', user: 'Dr. Arthur Vance', role: 'SUPER_ADMIN', ip: '127.0.0.1', loginTime: '2026-09-03 08:30:00', device: 'Windows Edge / Antigravity' },
      { id: 'sess-02', user: 'Dr. Sarah Smith', role: 'DOCTOR', ip: '192.168.1.10', loginTime: '2026-09-03 09:00:00', device: 'Windows Chrome' },
      { id: 'sess-03', user: 'Alex Rivera', role: 'PHARMACIST', ip: '192.168.1.18', loginTime: '2026-09-03 09:15:00', device: 'Windows Firefox' }
    ];

    const suspiciousActivity = [
      { id: 'sa-01', type: 'RAPID_TIMELINE_LOOKUP', description: 'Multiple cross-hospital patient timeline requests in 60s', severity: 'MEDIUM', status: 'AUDITED' }
    ];

    return NextResponse.json({
      failedLogins,
      activeSessions,
      suspiciousActivity,
      auditEvents
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
