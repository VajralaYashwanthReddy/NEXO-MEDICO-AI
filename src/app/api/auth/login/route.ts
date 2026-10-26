import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, signJwtToken, formatNameFromEmail } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { createOtpChallenge, verifyOtpChallenge } from '@/lib/otpService';

export async function POST(req: NextRequest) {
  let body: any = {};

  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // --------------------------------------------------------------------------
  // STEP 2: VERIFY LOGIN OTP (Mint Authenticated Session Only After OTP)
  // --------------------------------------------------------------------------
  if (body.action === 'verify_login_otp' || (body.challengeToken && body.otpCode)) {
    const { challengeToken, otpCode } = body;

    if (!challengeToken || !otpCode) {
      return NextResponse.json({ error: 'Challenge token and 6-digit OTP code are required.' }, { status: 400 });
    }

    const verification = await verifyOtpChallenge({
      challengeToken,
      otpCode,
      purpose: 'LOGIN'
    });

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Invalid or expired OTP code.' }, { status: 400 });
    }

    // Retrieve verified user from database
    const user = await prisma.user.findUnique({
      where: { id: verification.userId || undefined, email: verification.email },
      include: { hospital: true, patientProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Authenticated account could not be found.' }, { status: 404 });
    }

    // Re-verify hospital suspension and account status
    if (user.role !== 'SUPER_ADMIN' && user.hospitalId) {
      if (user.hospital?.status === 'SUSPENDED') {
        return NextResponse.json({
          error: 'Your hospital account has been suspended. Please contact the platform administrator.',
          code: 'HOSPITAL_SUSPENDED'
        }, { status: 403 });
      }
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Your account is inactive/suspended. Please contact the platform administrator.'
      }, { status: 403 });
    }

    const sanitizedName = (user.name && user.name !== 'Patient Account' && user.name !== 'Registered Patient')
      ? user.name
      : formatNameFromEmail(user.email);

    const payload = {
      id: user.id,
      email: user.email,
      name: sanitizedName,
      role: user.role, // Always use database role, never trust client
      hospitalId: user.hospitalId,
      departmentId: user.departmentId,
      patientCode: user.patientProfile?.patientCode,
      gender: user.patientProfile?.gender,
      dob: user.patientProfile?.dob,
      phone: user.patientProfile?.phone,
      bloodGroup: user.patientProfile?.bloodGroup
    };

    const token = signJwtToken(payload);

    try {
      await createAuditLog({
        hospitalId: user.hospitalId,
        userId: user.id,
        action: 'USER_LOGIN',
        resource: `User:${user.email}`,
        details: { role: user.role, method: '2FA_GMAIL_SMTP_OTP' }
      });
    } catch (auditErr) {
      console.warn('Audit log skipped:', auditErr);
    }

    const response = NextResponse.json({
      message: 'Login successful and 2FA verified',
      user: {
        id: user.id,
        email: user.email,
        name: sanitizedName,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital?.name || 'Metropolitan General Hospital',
        patientCode: user.patientProfile?.patientCode,
        gender: user.patientProfile?.gender,
        dob: user.patientProfile?.dob,
        phone: user.patientProfile?.phone,
        bloodGroup: user.patientProfile?.bloodGroup
      },
      token
    });

    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      secure: isHttps || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;
  }

  // --------------------------------------------------------------------------
  // STEP 1: VALIDATE CREDENTIALS & ISSUE LOGIN OTP VIA GMAIL SMTP
  // --------------------------------------------------------------------------
  const emailRaw = body.email || '';
  const password = body.password || '';
  const captchaInput = body.captchaInput;
  const expectedCaptcha = body.expectedCaptcha;

  if (!emailRaw || !password) {
    return NextResponse.json({ error: 'Email or Universal Patient ID and password are required' }, { status: 400 });
  }

  // Verify visual CAPTCHA if provided
  if (captchaInput !== undefined && expectedCaptcha !== undefined) {
    if (!captchaInput || captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Invalid CAPTCHA code. Please check characters & try again.' }, { status: 400 });
    }
  }

  const inputClean = emailRaw.trim();

  try {
    let user: any = null;

    // Check if input is a Universal Patient ID (NEXO-PAT-xxxxxx)
    if (inputClean.toUpperCase().startsWith('NEXO-PAT-')) {
      const patient = await prisma.patient.findUnique({
        where: { patientCode: inputClean.toUpperCase() },
        include: { user: { include: { hospital: true, patientProfile: true } } }
      });
      if (patient && patient.user) {
        user = patient.user;
      }
    } else {
      // Find user by Email
      user = await prisma.user.findUnique({
        where: { email: inputClean.toLowerCase() },
        include: { hospital: true, patientProfile: true }
      });
    }

    if (!user) {
      return NextResponse.json({
        error: 'No account is found with this email address.'
      }, { status: 404 });
    }

    // Check hospital suspension
    if (user.role !== 'SUPER_ADMIN' && user.hospitalId) {
      if (user.hospital?.status === 'SUSPENDED') {
        return NextResponse.json({
          error: 'Your hospital account has been suspended. Please contact the platform administrator.',
          code: 'HOSPITAL_SUSPENDED'
        }, { status: 403 });
      }
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Your account is inactive/suspended. Please contact the platform administrator.'
      }, { status: 403 });
    }

    // Validate password (bcrypt comparison)
    const passwordMatch = await comparePasswords(password, user.passwordHash);
    if (!passwordMatch) {
      // An invalid password MUST NEVER trigger an OTP email
      return NextResponse.json({ error: 'Invalid password. Please check your credentials.' }, { status: 401 });
    }

    // Credentials are valid! Generate 2FA Login Challenge & send via Gmail SMTP to database email
    const challengeResult = await createOtpChallenge({
      email: user.email,
      purpose: 'LOGIN',
      userId: user.id,
      userName: user.name,
      metadata: { role: user.role }
    });

    if (!challengeResult.success) {
      const status = challengeResult.code === 'RESEND_COOLDOWN' ? 429 : 500;
      const errorMessage = challengeResult.code === 'RESEND_COOLDOWN'
        ? challengeResult.error
        : "We couldn't send the verification code. Please try again shortly.";
      return NextResponse.json({
        error: errorMessage,
        code: challengeResult.code
      }, { status });
    }

    // Return 2FA challenge response (DO NOT MINT JWT SESSION TOKEN YET!)
    return NextResponse.json({
      success: true,
      requiresOtp: true,
      challengeToken: challengeResult.challengeToken,
      maskedEmail: challengeResult.maskedEmail,
      destinationText: challengeResult.maskedEmail,
      expiresInSeconds: challengeResult.expiresInSeconds,
      message: 'Verification code submitted. Check your inbox and spam folder.',
      detail: `Credentials verified. Verification code submitted via Gmail SMTP to ${challengeResult.maskedEmail}.`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: "We couldn't send the verification code. Please try again shortly." }, { status: 500 });
  }
}
