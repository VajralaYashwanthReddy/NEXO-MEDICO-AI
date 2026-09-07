import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getGlobalDoctors } from '@/lib/doctorStore';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const hospitalId = searchParams.get('hospitalId') || user?.hospitalId || '';

    let dbDoctors: any[] = [];
    try {
      dbDoctors = await prisma.doctorProfile.findMany({
        where: {
          ...(hospitalId ? { hospitalId } : {})
        },
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          hospital: { select: { id: true, name: true, city: true, phone: true } },
          department: { select: { id: true, name: true, code: true } }
        },
        orderBy: { id: 'desc' }
      });
    } catch (dbErr: any) {
      console.warn('Prisma doctors query skipped in GET /api/doctors:', dbErr.message);
    }

    const storeDoctors = getGlobalDoctors();
    const map = new Map<string, any>();

    for (const d of storeDoctors) {
      map.set(d.id, d);
      if (d.registrationNo) map.set(d.registrationNo, d);
    }

    for (const d of dbDoctors) {
      map.set(d.id, d);
    }

    let allDoctors = Array.from(new Set(map.values()));

    if (hospitalId) {
      allDoctors = allDoctors.filter(d => d.hospitalId === hospitalId);
    }

    if (search) {
      allDoctors = allDoctors.filter(d =>
        (d.specialization && d.specialization.toLowerCase().includes(search)) ||
        (d.user?.name && d.user.name.toLowerCase().includes(search)) ||
        (d.user?.email && d.user.email.toLowerCase().includes(search)) ||
        (d.hospital?.name && d.hospital.name.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ doctors: allDoctors });
  } catch (err: any) {
    return NextResponse.json({ doctors: getGlobalDoctors() });
  }
}

