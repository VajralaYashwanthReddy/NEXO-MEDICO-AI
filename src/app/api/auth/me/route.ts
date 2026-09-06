import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.id },
      include: {
        hospital: true,
        userPermissions: {
          include: { permission: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get role permissions
    const roleObj = await prisma.role.findUnique({
      where: { code: user.role },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    const rolePerms = roleObj?.permissions.map(rp => rp.permission.code) || [];
    const grantedCustomPerms = user.userPermissions.filter(up => up.granted).map(up => up.permission.code);
    const revokedCustomPerms = user.userPermissions.filter(up => !up.granted).map(up => up.permission.code);

    const effectivePermissions = Array.from(
      new Set([...rolePerms, ...grantedCustomPerms].filter(p => !revokedCustomPerms.includes(p)))
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital?.name || null,
        departmentId: user.departmentId,
        permissions: user.role === 'SUPER_ADMIN' || user.role === 'HOSPITAL_ADMIN' ? ['*'] : effectivePermissions
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch user context: ' + err.message }, { status: 500 });
  }
}
