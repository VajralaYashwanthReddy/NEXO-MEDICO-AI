import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { eventBroadcaster } from '@/lib/events';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const wards = await prisma.ward.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        beds: {
          include: {
            admissions: {
              where: { status: 'ADMITTED' },
              include: { patient: true }
            }
          },
          orderBy: { bedNumber: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Also fetch doctors for assignment modal
    const doctors = await prisma.doctorProfile.findMany({
      where: { hospitalId: user.hospitalId },
      include: { user: true }
    });

    // Also fetch patients for assignment modal
    const patients = await prisma.patient.findMany({
      where: { hospitalId: user.hospitalId },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({ wards, doctors, patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { wardId, bedNumber } = await req.json();

    if (!wardId || !bedNumber) {
      return NextResponse.json({ error: 'wardId and bedNumber are required' }, { status: 400 });
    }

    const existingBed = await prisma.bed.findFirst({
      where: { wardId, bedNumber: bedNumber.trim().toUpperCase() }
    });

    if (existingBed) {
      return NextResponse.json({ error: `Bed number '${bedNumber}' already exists in this ward` }, { status: 400 });
    }

    const bed = await prisma.bed.create({
      data: {
        wardId,
        hospitalId: user.hospitalId,
        bedNumber: bedNumber.trim().toUpperCase(),
        status: 'AVAILABLE'
      }
    });

    // Increment ward total beds count
    await prisma.ward.update({
      where: { id: wardId },
      data: { totalBeds: { increment: 1 } }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'BED_CREATE',
      resource: `Bed:${bed.bedNumber}`,
      details: { wardId, bedNumber: bed.bedNumber }
    });

    eventBroadcaster.broadcast('BED_CREATED', bed, user.hospitalId);

    return NextResponse.json({ message: 'New bed added successfully', bed }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { bedId, status } = await req.json();

    if (!bedId || !status) {
      return NextResponse.json({ error: 'bedId and status are required' }, { status: 400 });
    }

    const bed = await prisma.bed.update({
      where: { id: bedId },
      data: { status }
    });

    eventBroadcaster.broadcast('BED_STATUS_CHANGED', bed, user.hospitalId);

    return NextResponse.json({ message: 'Bed status updated', bed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get('bedId');

    if (!bedId) {
      return NextResponse.json({ error: 'bedId parameter is required' }, { status: 400 });
    }

    const bed = await prisma.bed.findFirst({
      where: { id: bedId, hospitalId: user.hospitalId },
      include: { admissions: { where: { status: 'ADMITTED' } } }
    });

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    if (bed.status === 'OCCUPIED' || bed.admissions.length > 0) {
      return NextResponse.json({ error: 'Cannot delete an occupied bed with an active patient' }, { status: 400 });
    }

    await prisma.bed.delete({ where: { id: bedId } });

    await prisma.ward.update({
      where: { id: bed.wardId },
      data: { totalBeds: { decrement: 1 } }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'BED_DELETE',
      resource: `Bed:${bed.bedNumber}`,
      details: { bedNumber: bed.bedNumber }
    });

    eventBroadcaster.broadcast('BED_DELETED', { bedId, bedNumber: bed.bedNumber }, user.hospitalId);

    return NextResponse.json({ message: 'Bed deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
