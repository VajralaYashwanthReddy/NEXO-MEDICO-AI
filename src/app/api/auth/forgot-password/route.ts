import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { sendSmsVerificationCode, isSmsServiceConfigured } from '@/lib/sms';
import { createAuditLog } from '@/lib/audit';
import { findAccountByContact } from '@/lib/contactLookup';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contactRaw = body.contact || body.email || '';
    const contactClean = contactRaw.trim();

    if (!contactClean) {
      return NextResponse.json(
        { error: 'Please enter your registered email address or phone number.' },
        { status: 400 }
      );
    }

    // 1. Verify against real database across all password-based account models
    let lookupResult = null;
    try {
      lookupResult = await findAccountByContact(contactClean);
    } catch (lookupErr: any) {
      return NextResponse.json(
        { error: lookupErr.message || 'Error checking account details.' },
        { status: 400 }
      );
    }

    // 2. Strict Account Check: If no account matches, reject immediately without OTP generation
    if (!lookupResult || !lookupResult.user) {
      return NextResponse.json(
        { error: 'No account is found with this email or phone number.' },
        { status: 404 }
      );
    }

    const { user, channel, matchedContact, maskedDestination } = lookupResult;

    // 3. Channel Verification Availability Check
    if (channel === 'phone' && !isSmsServiceConfigured()) {
      return NextResponse.json(
        {
          error: 'SMS service is not currently configured for phone-based recovery. Please use your registered email address or contact support.'
        },
        { status: 400 }
      );
    }

    // 4. Throttling / Resend Cooldown (60 seconds)
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentToken) {
      return NextResponse.json(
        { error: 'A password reset code was recently requested. Please wait 60 seconds before trying again.' },
        { status: 429 }
      );
    }

    // Invalidate previous outstanding tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    });

    // 5. Generate cryptographically secure 6-digit OTP & single-use authorization token
    const otpNumber = crypto.randomInt(100000, 1000000);
    const otpString = otpNumber.toString();
    const otpHash = await bcrypt.hash(otpString, 10);
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 6. Store in database with 5-minute expiry
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        phone: channel === 'phone' ? matchedContact : null,
        channel,
        otpHash,
        resetToken,
        attempts: 0,
        expiresAt
      }
    });

    // 7. Dispatch verification code through the verified channel
    if (channel === 'email') {
      const emailResult = await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        otpCode: otpString
      });
      if (!emailResult.success && !emailResult.devMode) {
        return NextResponse.json(
          { error: emailResult.error || "We couldn't send the verification code. Please try again shortly." },
          { status: 503 }
        );
      }
    } else if (channel === 'phone') {
      const smsResult = await sendSmsVerificationCode({
        toPhone: matchedContact,
        otpCode: otpString
      });
      if (!smsResult.success && !smsResult.devMode) {
        return NextResponse.json(
          { error: smsResult.error || 'SMS delivery failed. Please use email recovery.' },
          { status: 503 }
        );
      }
    }

    try {
      await createAuditLog({
        hospitalId: user.hospitalId,
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: `User:${user.email}`,
        details: { channel, contact: maskedDestination }
      });
    } catch (e) {
      // audit log fail safe
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code submitted. Check your inbox and spam folder.',
      channel,
      maskedDestination,
      contact: contactClean
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Server error occurred. Please try again.' }, { status: 500 });
  }
}
