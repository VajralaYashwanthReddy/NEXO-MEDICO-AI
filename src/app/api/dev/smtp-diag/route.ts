import { NextRequest, NextResponse } from 'next/server';
import { getSmtpTransporter, verifySmtpConnection } from '@/lib/email';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

export async function GET(req: NextRequest) {
  // Disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Diagnostic endpoint disabled in production mode.' }, { status: 403 });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const userConfigured = !!process.env.SMTP_USER;
  const passConfigured = !!process.env.SMTP_APP_PASSWORD;
  const emailFromConfigured = !!process.env.EMAIL_FROM;

  const connectionCheck = await verifySmtpConnection();

  return NextResponse.json({
    status: connectionCheck.success ? 'READY' : 'CONNECTION_FAILED',
    smtpHost: host,
    smtpPort: port,
    sslSecure: secure,
    hasUserConfigured: userConfigured,
    hasPasswordConfigured: passConfigured,
    hasFromConfigured: emailFromConfigured,
    authenticatedUser: process.env.SMTP_USER ? maskEmail(process.env.SMTP_USER) : null,
    transporterVerified: connectionCheck.success,
    error: connectionCheck.error ? String(connectionCheck.error).replace(/:.*@/, ':***@') : null
  });
}

export async function POST(req: NextRequest) {
  // Disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Diagnostic endpoint disabled in production mode.' }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const requestedRecipient = (body.recipient || '').trim().toLowerCase();

  if (!requestedRecipient || !EMAIL_REGEX.test(requestedRecipient)) {
    return NextResponse.json({
      success: false,
      error: 'Please enter a valid email address.'
    }, { status: 400 });
  }

  const targetRecipient = requestedRecipient;

  try {
    const t = getSmtpTransporter();
    const rawFrom = (process.env.EMAIL_FROM || '').trim();
    const defaultSender = process.env.SMTP_USER || 'nexomedicoai@gmail.com';
    const fromAddress = rawFrom.includes('<') && rawFrom.includes('>')
      ? rawFrom
      : `"Nexo Medico AI" <${defaultSender}>`;

    const info = await t.sendMail({
      from: fromAddress,
      to: targetRecipient,
      subject: 'Nexo Medico AI — Safe Diagnostic SMTP Verification',
      text: `Nexo Medico AI Gmail SMTP Service Diagnostic.\nSent at: ${new Date().toISOString()}\nHost: ${process.env.SMTP_HOST || 'smtp.gmail.com'}\nPort: 465\nRecipient: ${targetRecipient}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 28px; color: #1e293b; max-width: 520px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="display: inline-block; background-color: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; margin-bottom: 12px;">
            SMTP DIAGNOSTIC TEST
          </div>
          <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 18px;">Nexo Medico AI — Email Delivery Verified</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
            This email confirms that your Gmail SMTP server configuration is operational and email dispatch was accepted by Google Mail Exchangers.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #334155;">
            <div><strong>Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'} (Port 465 SSL)</div>
            <div><strong>Recipient:</strong> ${maskEmail(targetRecipient)}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
          </div>
        </div>
      `,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });

    console.log(`[SMTP DIAGNOSTIC] Test email submitted to ${maskEmail(targetRecipient)}. Message-ID: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      message: 'Diagnostic test email successfully accepted by Gmail SMTP server.',
      messageId: info.messageId,
      response: info.response,
      recipient: maskEmail(targetRecipient)
    });
  } catch (err: any) {
    const sanitizedError = err.message ? err.message.replace(/:.*@/, ':***@') : 'SMTP delivery error';
    console.error('[SMTP DIAGNOSTIC ERROR]:', sanitizedError);
    return NextResponse.json({
      success: false,
      error: sanitizedError,
      code: err.code || 'SMTP_ERROR'
    }, { status: 500 });
  }
}
