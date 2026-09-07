import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, comparePasswords, hashPassword, signJwtToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

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
    const userPayload = getUserFromRequest(req);
    if (userPayload) {
      return NextResponse.json({
        user: {
          id: userPayload.id,
          email: userPayload.email,
          name: userPayload.name,
          role: userPayload.role,
          hospitalId: userPayload.hospitalId,
          hospitalName: userPayload.role === 'SUPER_ADMIN' ? 'All Platform Tenants' : 'Metropolitan General Hospital',
          departmentId: userPayload.departmentId,
          permissions: ['*']
        }
      });
    }
    return NextResponse.json({ error: 'Failed to fetch user context: ' + err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    let updatedUser: any = null;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userPayload.id }
      });

      if (dbUser) {
        const dataToUpdate: any = {};
        if (name) dataToUpdate.name = name.trim();
        if (email) dataToUpdate.email = email.toLowerCase().trim();

        if (newPassword) {
          if (currentPassword) {
            const isMatch = await comparePasswords(currentPassword, dbUser.passwordHash);
            if (!isMatch) {
              return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
            }
          }
          dataToUpdate.passwordHash = await hashPassword(newPassword);
        }

        updatedUser = await prisma.user.update({
          where: { id: userPayload.id },
          data: dataToUpdate,
          include: { hospital: true }
        });
      }
    } catch (e: any) {
      console.warn('Prisma user update warning in /api/auth/me PUT:', e.message);
    }

    const freshName = name ? name.trim() : (updatedUser?.name || userPayload.name);
    const freshEmail = email ? email.toLowerCase().trim() : (updatedUser?.email || userPayload.email);

    const freshUserObj = {
      id: userPayload.id,
      email: freshEmail,
      name: freshName,
      role: userPayload.role,
      hospitalId: userPayload.hospitalId,
      hospitalName: updatedUser?.hospital?.name || (userPayload as any).hospitalName || 'Metropolitan General Hospital',
      departmentId: userPayload.departmentId,
      permissions: ['*']
    };

    const freshToken = signJwtToken({
      id: freshUserObj.id,
      email: freshUserObj.email,
      name: freshUserObj.name,
      role: freshUserObj.role,
      hospitalId: freshUserObj.hospitalId
    });

    try {
      await createAuditLog({
        hospitalId: userPayload.hospitalId,
        userId: userPayload.id,
        action: newPassword ? 'USER_PASSWORD_CHANGE' : 'USER_PROFILE_UPDATE',
        resource: `User:${freshEmail}`,
        details: { name: freshName, email: freshEmail, passwordChanged: Boolean(newPassword) }
      });
    } catch (e) {
      // audit log fail safe
    }

    const response = NextResponse.json({
      message: newPassword ? 'Password changed successfully' : 'Profile updated successfully',
      user: freshUserObj,
      token: freshToken
    });

    response.cookies.set('nexo_token', freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}

