import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        doctorProfiles: {
          include: { user: true }
        },
        _count: {
          select: {
            doctorProfiles: true,
            staffProfiles: true,
            appointments: true,
            admissions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ departments });
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

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient administrative privileges' }, { status: 403 });
    }

    const { code, name, description, location, contact, headDoctorId } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ error: 'Department code and name are required' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        hospitalId: user.hospitalId,
        code: code.toUpperCase().trim(),
        name,
        description,
        location,
        contact,
        headDoctorId,
        status: 'ACTIVE'
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'DEPARTMENT_CREATE',
      resource: `Department:${department.id}`,
      details: { code: department.code, name: department.name }
    });

    return NextResponse.json({ message: 'Department created successfully', department }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
