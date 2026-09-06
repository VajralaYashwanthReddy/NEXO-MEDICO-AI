import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges for security audit logs' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { hospitalId: user.hospitalId },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return NextResponse.json({ auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
