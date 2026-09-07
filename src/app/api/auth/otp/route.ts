import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, emailOrPhone, otpCode, captchaInput, expectedCaptcha } = await req.json();

    if (action === 'verify_captcha') {
      if (!captchaInput || !expectedCaptcha) {
        return NextResponse.json({ success: false, error: 'Captcha input required' }, { status: 400 });
      }
      if (captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
        return NextResponse.json({ success: false, error: 'Invalid CAPTCHA code' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'CAPTCHA verified successfully' });
    }

    if (action === 'generate_otp') {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      return NextResponse.json({
        success: true,
        mockOtp,
        destination: emailOrPhone || 'user',
        expiresInSeconds: 60
      });
    }

    if (action === 'verify_otp') {
      if (!otpCode || otpCode.length !== 6) {
        return NextResponse.json({ success: false, error: '6-digit OTP code required' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OTP server error' }, { status: 500 });
  }
}
