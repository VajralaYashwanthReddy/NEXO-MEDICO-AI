import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { findAccountByContact } from '@/lib/contactLookup';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contactRaw = (body.contact || body.email || body.phone || '').toString().trim();
    const otp = (body.otp || '').toString().trim();

    if (!contactRaw || !otp) {
      return NextResponse.json(
        { error: 'Registered contact and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Verification code must be exactly 6 digits.' }, { status: 400 });
    }

    // Lookup latest active unconsumed reset token
    let tokenRecord = null;
    try {
      const lookupResult = await findAccountByContact(contactRaw);
      if (lookupResult && lookupResult.user) {
        tokenRecord = await prisma.passwordResetToken.findFirst({
          where: {
            userId: lookupResult.user.id,
            usedAt: null
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } catch (lookupErr: any) {
      return NextResponse.json(
        { error: lookupErr.message || 'Account lookup error during verification.' },
        { status: 400 }
      );
    }

    // Fallback: direct match by email or phone in passwordResetToken
    if (!tokenRecord) {
      tokenRecord = await prisma.passwordResetToken.findFirst({
        where: {
          OR: [
            { email: contactRaw.toLowerCase() },
            { phone: contactRaw }
          ],
          usedAt: null
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'No active password reset request found. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Throttling: Max 5 failed attempts
    if (tokenRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum attempts exceeded. This verification code has been locked. Please request a new code.' },
        { status: 429 }
      );
    }

    // Compare hashed OTP
    const isMatch = await bcrypt.compare(otp, tokenRecord.otpHash);

    if (!isMatch) {
      const nextAttempts = tokenRecord.attempts + 1;
      await prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: nextAttempts }
      });

      const remaining = Math.max(0, 5 - nextAttempts);
      return NextResponse.json(
        {
          error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Code locked.'}`,
          remainingAttempts: remaining
        },
        { status: 400 }
      );
    }

    // OTP Verified! Return single-use authorization resetToken
    return NextResponse.json({
      success: true,
      message: 'Verification code verified successfully.',
      resetToken: tokenRecord.resetToken
    });
  } catch (err: any) {
    console.error('Verify reset OTP error:', err);
    return NextResponse.json({ error: 'Server error occurred during verification.' }, { status: 500 });
  }
}
