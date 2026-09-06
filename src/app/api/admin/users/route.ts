import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || '';
    const hospitalId = searchParams.get('hospitalId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(hospitalId ? { hospitalId } : {}),
        ...(status ? { status } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        } : {})
      },
      include: {
        hospital: { select: { id: true, name: true, registrationNo: true } },
        doctorProfile: true,
        nurseProfile: true,
        patientProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const hospitals = await prisma.hospital.findMany({
      select: { id: true, name: true, registrationNo: true }
    });

    return NextResponse.json({ users, hospitals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = getUserFromRequest(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { name, email, password, role, hospitalId } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: `User with email '${email}' already exists` }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        hospitalId: hospitalId || null,
        status: 'ACTIVE'
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: adminUser.id,
      action: 'PLATFORM_SUPER_ADMIN_CREATE_USER',
      resource: `User:${user.email}`,
      details: { name: user.name, role: user.role, hospitalId: user.hospitalId }
    });

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminUser = getUserFromRequest(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { userId, role, status, hospitalId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(hospitalId !== undefined ? { hospitalId: hospitalId || null } : {})
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: adminUser.id,
      action: 'PLATFORM_SUPER_ADMIN_UPDATE_USER',
      resource: `User:${user.email}`,
      details: { role: user.role, status: user.status }
    });

    return NextResponse.json({ message: 'User updated successfully', user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
