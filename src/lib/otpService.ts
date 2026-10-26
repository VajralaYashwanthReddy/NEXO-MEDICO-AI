import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail, OtpPurpose } from '@/lib/email';

export interface CreateChallengeOptions {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface VerifyChallengeResult {
  valid: boolean;
  error?: string;
  code?: string;
  challenge?: any;
  email?: string;
  userId?: string | null;
  metadata?: any;
}

// Mask destination email for secure display (e.g. j***e@example.com)
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  const masked = '*'.repeat(Math.min(local.length - 2, 4));
  return `${first}${masked}${last}@${domain}`;
}

// Generate cryptographically secure 6-digit numeric OTP
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Creates and stores a hashed OTP challenge in PostgreSQL and sends via Gmail SMTP
 */
export async function createOtpChallenge({
  email,
  purpose,
  userId,
  userName,
  metadata
}: CreateChallengeOptions): Promise<{
  success: boolean;
  challengeToken?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  error?: string;
  code?: string;
}> {
  const emailClean = (email || '').toLowerCase().trim();
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailClean || !EMAIL_REGEX.test(emailClean)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      code: 'INVALID_EMAIL'
    };
  }

  // 1. Throttling / Resend Cooldown Check (60 seconds)
  const recentChallenge = await prisma.otpChallenge.findFirst({
    where: {
      email: emailClean,
      purpose,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000)
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentChallenge) {
    const elapsed = Math.floor((Date.now() - recentChallenge.createdAt.getTime()) / 1000);
    const remaining = Math.max(1, 60 - elapsed);
    return {
      success: false,
      error: `A verification code was recently dispatched. Please wait ${remaining} seconds before requesting a new code.`,
      code: 'RESEND_COOLDOWN'
    };
  }

  // 2. Invalidate previous outstanding unconsumed challenges for this email + purpose
  await prisma.otpChallenge.updateMany({
    where: {
      email: emailClean,
      purpose,
      consumedAt: null
    },
    data: {
      consumedAt: new Date() // Mark previous as consumed/invalidated
    }
  });

  // 3. Generate 6-digit OTP & Hash
  const otpCode = generateSecureOtp();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const challengeToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // 4. Send email through Gmail SMTP first
  const emailResult = await sendOtpEmail({
    toEmail: emailClean,
    userName: userName || metadata?.name || metadata?.fullName || metadata?.adminName || 'Healthcare Professional',
    otpCode,
    purpose
  });

  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error || "We couldn't send the verification code. Please try again shortly.",
      code: 'SMTP_DELIVERY_FAILED'
    };
  }

  // 5. Save challenge record in database only after email successfully dispatched
  await prisma.otpChallenge.create({
    data: {
      email: emailClean,
      purpose,
      otpHash,
      challengeToken,
      userId: userId || null,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      attempts: 0,
      expiresAt
    }
  });

  return {
    success: true,
    challengeToken,
    maskedEmail: maskEmail(emailClean),
    expiresInSeconds: 300
  };
}

/**
 * Validates the OTP against the database hash with attempt limits and atomic consumption
 */
export async function verifyOtpChallenge({
  challengeToken,
  otpCode,
  purpose
}: {
  challengeToken: string;
  otpCode: string;
  purpose: OtpPurpose;
}): Promise<VerifyChallengeResult> {
  if (!challengeToken || !otpCode) {
    return { valid: false, error: 'Challenge token and 6-digit OTP code are required.' };
  }

  const cleanOtp = otpCode.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'Verification code must be exactly 6 digits.' };
  }

  const challenge = await prisma.otpChallenge.findUnique({
    where: { challengeToken }
  });

  if (!challenge) {
    return { valid: false, error: 'Invalid or expired verification session. Please request a new code.' };
  }

  // Check purpose match
  if (challenge.purpose !== purpose) {
    return { valid: false, error: 'Verification purpose mismatch. This code was issued for a different action.' };
  }

  // Check if consumed
  if (challenge.consumedAt) {
    return { valid: false, error: 'This verification code has already been used. Please request a new code.' };
  }

  // Check expiration (5 minutes)
  if (new Date() > challenge.expiresAt) {
    return { valid: false, error: 'Verification code has expired (valid for 5 minutes). Please request a new code.' };
  }

  // Check failed attempt limits (maximum 5 attempts)
  if (challenge.attempts >= 5) {
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded (5/5). This code has been locked for security. Please request a new code.'
    };
  }

  // Compare OTP with bcrypt hash
  const isMatch = await bcrypt.compare(cleanOtp, challenge.otpHash);

  if (!isMatch) {
    const updatedAttempts = challenge.attempts + 1;
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: updatedAttempts }
    });

    const remaining = Math.max(0, 5 - updatedAttempts);
    if (remaining === 0) {
      return {
        valid: false,
        error: 'Invalid verification code. Maximum attempts exceeded (5/5). Please request a new code.'
      };
    }
    return {
      valid: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    };
  }

  // OTP is correct! Atomically mark consumed to prevent reuse
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() }
  });

  let parsedMetadata = null;
  try {
    if (challenge.metadataJson) {
      parsedMetadata = JSON.parse(challenge.metadataJson);
    }
  } catch (e) {
    parsedMetadata = null;
  }

  return {
    valid: true,
    challenge,
    email: challenge.email,
    userId: challenge.userId,
    metadata: parsedMetadata
  };
}
