import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getGlobalAuditLogs } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges for security audit logs' }, { status: 403 });
    }

    let dbLogs: any[] = [];
    try {
      dbLogs = await prisma.auditLog.findMany({
        where: user.role === 'SUPER_ADMIN' ? {} : (user.hospitalId ? { hospitalId: user.hospitalId } : {}),
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { timestamp: 'desc' },
        take: 100
      });
    } catch (dbErr: any) {
      console.warn('Prisma DB query skipped in /api/audit-logs, serving fallback audit store:', dbErr.message);
    }

    const fallbackLogs = getGlobalAuditLogs().filter(log => {
      if (user.role === 'SUPER_ADMIN') return true;
      if (user.hospitalId && log.hospitalId && log.hospitalId !== user.hospitalId) return false;
      return true;
    });

    const combinedMap = new Map();
    dbLogs.forEach(l => combinedMap.set(l.id, l));
    fallbackLogs.forEach(l => {
      if (!combinedMap.has(l.id)) {
        combinedMap.set(l.id, l);
      }
    });

    const combinedLogs = Array.from(combinedMap.values());

    return NextResponse.json({ auditLogs: combinedLogs });
  } catch (err: any) {
    console.warn('Audit logs API error fallback:', err.message);
    return NextResponse.json({ auditLogs: getGlobalAuditLogs() });
  }
}
