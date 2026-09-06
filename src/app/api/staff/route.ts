import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const staffMembers = await prisma.user.findMany({
      where: {
        hospitalId: user.hospitalId,
        role: { not: 'PATIENT' }
      },
      include: {
        staffProfile: { include: { department: true } },
        doctorProfile: { include: { department: true } },
        nurseProfile: true,
        userPermissions: { include: { permission: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ staffMembers });
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

    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      departmentId,
      designation,
      employeeId,
      qualification,
      specialization,
      registrationNo,
      experienceYears,
      consultationFee,
      shift,
      permissions
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const empCode = employeeId || `EMP-${role.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

    const newStaffUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        hospitalId: user.hospitalId,
        departmentId: departmentId || null,
        status: 'ACTIVE'
      }
    });

    if (role === 'DOCTOR') {
      await prisma.doctorProfile.create({
        data: {
          userId: newStaffUser.id,
          hospitalId: user.hospitalId,
          employeeId: empCode,
          qualification: qualification || 'MD / MBBS',
          specialization: specialization || 'General Medicine',
          registrationNo: registrationNo || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
          experienceYears: parseInt(experienceYears || '0'),
          consultationFee: parseFloat(consultationFee || '100.0'),
          departmentId: departmentId || null,
          status: 'ACTIVE'
        }
      });
    } else if (role === 'NURSE') {
      await prisma.nurseProfile.create({
        data: {
          userId: newStaffUser.id,
          hospitalId: user.hospitalId,
          employeeId: empCode,
          shift: shift || 'DAY',
          status: 'ACTIVE'
        }
      });
    } else {
      await prisma.staffProfile.create({
        data: {
          userId: newStaffUser.id,
          hospitalId: user.hospitalId,
          employeeId: empCode,
          designation: designation || role,
          departmentId: departmentId || null,
          status: 'ACTIVE'
        }
      });
    }

    // Assign custom permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const pCode of permissions) {
        const perm = await prisma.permission.findUnique({ where: { code: pCode } });
        if (perm) {
          await prisma.userPermission.create({
            data: {
              userId: newStaffUser.id,
              permissionId: perm.id,
              granted: true
            }
          });
        }
      }
    }

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'STAFF_CREATE',
      resource: `User:${newStaffUser.id}`,
      details: { role, email: newStaffUser.email, employeeId: empCode }
    });

    return NextResponse.json({ message: 'Staff member added successfully', staff: newStaffUser }, { status: 201 });
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

    const { staffUserId, status, departmentId, permissions } = await req.json();

    if (!staffUserId) {
      return NextResponse.json({ error: 'staffUserId is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: staffUserId, hospitalId: user.hospitalId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Staff member not found in tenant' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: staffUserId },
      data: {
        ...(status ? { status } : {}),
        ...(departmentId !== undefined ? { departmentId } : {})
      }
    });

    if (permissions && Array.isArray(permissions)) {
      await prisma.userPermission.deleteMany({ where: { userId: staffUserId } });
      for (const pCode of permissions) {
        const perm = await prisma.permission.findUnique({ where: { code: pCode } });
        if (perm) {
          await prisma.userPermission.create({
            data: {
              userId: staffUserId,
              permissionId: perm.id,
              granted: true
            }
          });
        }
      }
    }

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'STAFF_UPDATE',
      resource: `User:${staffUserId}`,
      details: { status, departmentId }
    });

    return NextResponse.json({ message: 'Staff updated successfully', user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
