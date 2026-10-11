import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGlobalHospitals } from '@/lib/hospitalStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    let dbHospitals: any[] = [];
    try {
      dbHospitals = await prisma.hospital.findMany({
        where: {
          status: 'ACTIVE',
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { type: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
        },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          state: true,
          country: true,
          status: true,
          deptCount: true,
          bedCount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr: any) {
      console.warn('DB query in /api/hospitals GET failed:', dbErr.message);
    }

    // Merge with in-memory store active hospitals for zero-loss sync
    const storeHospitals = getGlobalHospitals().filter(h => h.status === 'ACTIVE');
    const mergedMap = new Map<string, any>();

    for (const h of storeHospitals) {
      mergedMap.set(h.id, {
        id: h.id,
        name: h.name,
        type: h.type,
        city: h.city,
        state: h.state,
        country: h.country,
        status: h.status,
        deptCount: h.deptCount || h._count?.wards || 5,
        bedCount: h.bedCount || h._count?.beds || 50,
        createdAt: h.createdAt
      });
    }

    for (const h of dbHospitals) {
      mergedMap.set(h.id, {
        id: h.id,
        name: h.name,
        type: h.type,
        city: h.city,
        state: h.state,
        country: h.country,
        status: h.status,
        deptCount: h.deptCount,
        bedCount: h.bedCount,
        createdAt: h.createdAt
      });
    }

    let publicHospitals = Array.from(mergedMap.values());
    if (search) {
      publicHospitals = publicHospitals.filter(
        h =>
          h.name?.toLowerCase().includes(search) ||
          h.city?.toLowerCase().includes(search) ||
          h.type?.toLowerCase().includes(search)
      );
    }
    return NextResponse.json({ hospitals: publicHospitals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch public hospitals' }, { status: 500 });
  }
}
