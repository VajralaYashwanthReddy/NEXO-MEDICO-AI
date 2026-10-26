import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resetToken, newPassword, confirmPassword } = body;

    if (!resetToken) {
      return NextResponse.json({ error: 'Reset authorization token is required.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match. Please re-enter carefully.' }, { status: 400 });
    }

    // 1. Locate valid unconsumed resetToken
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { resetToken }
    });

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      return NextResponse.json(
        { error: 'This reset authorization token has already been used or is invalid. Please request a new code.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      return NextResponse.json(
        { error: 'This reset authorization session has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // 2. Locate user and verify permissions
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      include: { hospital: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Account associated with this reset request was not found.' }, { status: 404 });
    }

    // Check account status and hospital suspension
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This user account is suspended or inactive. Password reset cannot be completed.' },
        { status: 403 }
      );
    }

    if (user.role !== 'SUPER_ADMIN' && user.hospital && user.hospital.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your hospital account is suspended. Password reset cannot be completed.' },
        { status: 403 }
      );
    }

    // 3. Hash new password securely
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Update password and invalidate all tokens atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null
        },
        data: {
          usedAt: new Date()
        }
      })
    ]);

    try {
      await createAuditLog({
        hospitalId: user.hospitalId,
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: `User:${user.email}`,
        details: { email: user.email }
      });
    } catch (e) {
      // audit log fail safe
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. Please sign in with your new password.'
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Server error occurred during password reset.' }, { status: 500 });
  }
}
