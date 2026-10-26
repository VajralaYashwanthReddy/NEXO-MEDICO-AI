import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOtpChallenge, verifyOtpChallenge } from '@/lib/otpService';
import { validateIndianAddress, validateIndianPhoneNumber } from '@/lib/indiaGeoData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, emailOrPhone, otpCode, challengeToken, purpose, name, captchaInput, expectedCaptcha } = body;

    // 1. CAPTCHA Verification
    if (action === 'verify_captcha') {
      if (!captchaInput || !expectedCaptcha) {
        return NextResponse.json({ success: false, error: 'Captcha input required' }, { status: 400 });
      }
      if (captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
        return NextResponse.json({ success: false, error: 'Invalid CAPTCHA code' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'CAPTCHA verified successfully' });
    }

    // 2. Send Registration OTP
    if (action === 'send_registration_otp' || action === 'generate_otp') {
      const targetEmail = (email || emailOrPhone || '').trim().toLowerCase();
      const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
        return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
      }

      // Check for duplicate registered accounts across User, Patient, and Hospital
      const existingUser = await prisma.user.findUnique({
        where: { email: targetEmail }
      });
      const existingPatient = await prisma.patient.findFirst({
        where: { email: targetEmail }
      });
      const existingHospital = await prisma.hospital.findUnique({
        where: { email: targetEmail }
      });

      if (existingUser || existingPatient || existingHospital) {
        return NextResponse.json({
          success: false,
          error: 'Email already exists. Please use a different email address.'
        }, { status: 409 });
      }

      // Check duplicate phone if provided
      if (body.phone) {
        const phoneValidation = validateIndianPhoneNumber(body.phone, true);
        if (!phoneValidation.valid) {
          return NextResponse.json({
            success: false,
            error: phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.'
          }, { status: 400 });
        }

        const phoneClean = body.phone.trim();
        const phoneDigits = phoneClean.replace(/\D/g, '');
        const allPatients = await prisma.patient.findMany({ select: { id: true, phone: true } });
        const duplicatePhone = allPatients.find(p => {
          if (!p.phone) return false;
          const pDigits = p.phone.replace(/\D/g, '');
          if (p.phone.trim() === phoneClean) return true;
          if (phoneDigits.length >= 10 && pDigits.length >= 10 && phoneDigits.slice(-10) === pDigits.slice(-10)) return true;
          return false;
        });

        if (duplicatePhone) {
          return NextResponse.json({
            success: false,
            error: 'Phone number already exists. Please use a different phone number.'
          }, { status: 409 });
        }
      }

      // Validate address fields if provided
      if (body.houseFlat !== undefined || body.streetArea !== undefined || body.pinCode !== undefined) {
        const addrValidation = validateIndianAddress({
          houseFlat: body.houseFlat,
          streetArea: body.streetArea,
          landmark: body.landmark,
          city: body.city,
          district: body.district,
          state: body.state,
          pinCode: body.pinCode
        });

        if (!addrValidation.valid) {
          const firstErr = Object.values(addrValidation.errors)[0];
          return NextResponse.json({
            success: false,
            error: firstErr || 'Please check your address fields.'
          }, { status: 400 });
        }
      }

      const challengeResult = await createOtpChallenge({
        email: targetEmail,
        purpose: 'REGISTRATION',
        userName: name || body.fullName || 'Registered Patient'
      });

      if (!challengeResult.success) {
        return NextResponse.json({
          success: false,
          error: challengeResult.error,
          code: challengeResult.code
        }, { status: challengeResult.code === 'RESEND_COOLDOWN' ? 429 : 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code submitted. Check your inbox and spam folder.',
        challengeToken: challengeResult.challengeToken,
        maskedEmail: challengeResult.maskedEmail,
        destination: challengeResult.maskedEmail,
        expiresInSeconds: challengeResult.expiresInSeconds
      });
    }

    // 3. Verify Registration OTP
    if (action === 'verify_registration_otp' || action === 'verify_otp') {
      if (!otpCode || otpCode.trim().length !== 6) {
        return NextResponse.json({ success: false, error: '6-digit OTP code required' }, { status: 400 });
      }

      if (!challengeToken) {
        return NextResponse.json({ success: false, error: 'Challenge session token is required.' }, { status: 400 });
      }

      const verifyResult = await verifyOtpChallenge({
        challengeToken,
        otpCode,
        purpose: (purpose as any) || 'REGISTRATION'
      });

      if (!verifyResult.valid) {
        return NextResponse.json({
          success: false,
          error: verifyResult.error
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully.',
        verified: true,
        challengeToken,
        email: verifyResult.email
      });
    }

    // 4. Resend OTP
    if (action === 'resend_otp') {
      if (!challengeToken) {
        return NextResponse.json({ success: false, error: 'Challenge token is required to resend code.' }, { status: 400 });
      }

      const existingChallenge = await prisma.otpChallenge.findUnique({
        where: { challengeToken }
      });

      if (!existingChallenge) {
        return NextResponse.json({ success: false, error: 'Verification session not found. Please restart.' }, { status: 404 });
      }

      let parsedMeta = undefined;
      try {
        if (existingChallenge.metadataJson) parsedMeta = JSON.parse(existingChallenge.metadataJson);
      } catch (e) {
        parsedMeta = undefined;
      }

      const resendResult = await createOtpChallenge({
        email: existingChallenge.email,
        purpose: existingChallenge.purpose as any,
        userId: existingChallenge.userId || undefined,
        metadata: parsedMeta
      });

      if (!resendResult.success) {
        return NextResponse.json({
          success: false,
          error: resendResult.error,
          code: resendResult.code
        }, { status: resendResult.code === 'RESEND_COOLDOWN' ? 429 : 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code submitted. Check your inbox and spam folder.',
        challengeToken: resendResult.challengeToken,
        maskedEmail: resendResult.maskedEmail,
        expiresInSeconds: resendResult.expiresInSeconds
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('OTP Route Error:', err);
    return NextResponse.json({ error: err.message || 'OTP server error' }, { status: 500 });
  }
}
