import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        user: true,
        department: true
      },
      orderBy: { employeeId: 'asc' }
    });

    return NextResponse.json({ doctors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
