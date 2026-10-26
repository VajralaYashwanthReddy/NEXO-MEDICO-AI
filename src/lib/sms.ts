export function isSmsServiceConfigured(): boolean {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    return true;
  }
  if (process.env.ENABLE_DEV_SMS === 'true') {
    return true;
  }
  return false;
}

export async function sendSmsVerificationCode({
  toPhone,
  otpCode
}: {
  toPhone: string;
  otpCode: string;
}): Promise<{ success: boolean; devMode?: boolean; error?: string }> {
  if (!isSmsServiceConfigured()) {
    return {
      success: false,
      error: 'SMS service is not currently configured for phone-based recovery. Please use your registered email address or contact support.'
    };
  }

  // 1. Production Twilio Integration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const body = new URLSearchParams({
        To: toPhone,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `Nexo Medico AI Security: Your verification code is ${otpCode}. It expires in 5 minutes. Never share this code with anyone.`
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        console.warn('Twilio SMS error:', errData);
        return { success: false, error: errData.message || 'SMS delivery failed' };
      }

      return { success: true };
    } catch (e: any) {
      console.warn('Twilio SMS delivery exception:', e);
      return { success: false, error: e.message || 'SMS delivery error' };
    }
  }

  // 2. Local Development Explicit Simulator (only if ENABLE_DEV_SMS=true)
  if (process.env.ENABLE_DEV_SMS === 'true' && process.env.NODE_ENV !== 'production') {
    console.log(`[DEV SMS SIMULATOR] SMS verification OTP for ${toPhone}: ${otpCode}`);
    return { success: true, devMode: true };
  }

  return {
    success: false,
    error: 'SMS service is not currently configured for phone-based recovery. Please use your registered email address or contact support.'
  };
}
