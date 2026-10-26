import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';

interface SendOtpEmailParams {
  toEmail: string;
  userName?: string;
  otpCode: string;
  purpose: OtpPurpose;
}

interface SendPasswordResetEmailParams {
  toEmail: string;
  userName?: string;
  otpCode: string;
}

// Singleton transporter instance
let transporter: Transporter | null = null;

export function getSmtpTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_APP_PASSWORD ? process.env.SMTP_APP_PASSWORD.replace(/\s+/g, '') : '';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      connectionTimeout: 10000, // 10s connection timeout
      greetingTimeout: 5000,
      socketTimeout: 15000
    });
  }
  return transporter;
}

export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const t = getSmtpTransporter();
    await t.verify();
    return { success: true };
  } catch (err: any) {
    console.error('SMTP Connection Verification Failed:', err.message);
    return { success: false, error: err.message || 'SMTP connection failed' };
  }
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

export async function sendOtpEmail({
  toEmail,
  userName = 'Healthcare User',
  otpCode,
  purpose
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  const emailClean = (toEmail || '').trim().toLowerCase();
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailClean || !EMAIL_REGEX.test(emailClean)) {
    return {
      success: false,
      error: 'Please enter a valid email address.'
    };
  }

  const cleanOtp = (otpCode || '').trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return {
      success: false,
      error: 'Valid 6-digit OTP code is required.'
    };
  }

  const rawFrom = (process.env.EMAIL_FROM || '').trim();
  const smtpUser = process.env.SMTP_USER || 'nexomedicoai@gmail.com';
  const fromAddress = rawFrom.includes('<') && rawFrom.includes('>')
    ? rawFrom
    : `"Nexo Medico AI" <${smtpUser}>`;

  let subject = `${otpCode} is your Nexo Medico AI verification code`;
  let title = 'Security Verification Code';
  let description = 'Please use the 6-digit one-time code below to complete your verification.';
  let badgeText = 'Identity Verification';
  let badgeColor = '#0d9488';

  if (purpose === 'REGISTRATION') {
    subject = `${otpCode} is your Nexo Medico AI registration verification code`;
    title = 'Confirm Your Registration';
    description = 'Thank you for registering with Nexo Medico AI. Please verify your email address to activate your healthcare portal account.';
    badgeText = 'Account Registration';
    badgeColor = '#0284c7';
  } else if (purpose === 'LOGIN') {
    subject = `${otpCode} is your Nexo Medico AI login verification code`;
    title = 'Two-Factor Authentication';
    description = 'A login attempt was made for your Nexo Medico AI account. Use this one-time code to authenticate and access your clinical dashboard.';
    badgeText = 'Two-Step Sign In';
    badgeColor = '#6366f1';
  } else if (purpose === 'PASSWORD_RESET') {
    subject = `${otpCode} is your Nexo Medico AI password reset code`;
    title = 'Password Reset Authorization';
    description = 'We received a request to reset the password for your account. Use the code below to authorize your password update.';
    badgeText = 'Password Recovery';
    badgeColor = '#e11d48';
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 32px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
              
              <!-- Header Gradient Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); padding: 32px 36px; text-align: left;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="vertical-align: middle;">
                        <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px; color: #ffffff;">
                          🏥
                        </span>
                      </td>
                      <td style="padding-left: 14px; vertical-align: middle;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">NEXO MEDICO AI</h1>
                        <p style="margin: 2px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Enterprise Healthcare Cloud</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 36px 36px 28px 36px;">
                  <div style="display: inline-block; background-color: ${badgeColor}15; color: ${badgeColor}; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; border: 1px solid ${badgeColor}30;">
                    ${badgeText}
                  </div>

                  <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 800; line-height: 1.3;">${title}</h2>

                  <p style="margin: 0 0 16px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                    Hello <strong>${userName}</strong>,
                  </p>
                  <p style="margin: 0 0 28px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                    ${description}
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px;">
                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">Your One-Time Passcode</span>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0f172a; margin: 8px 0;">
                      ${otpCode}
                    </div>
                    <span style="display: inline-block; margin-top: 6px; font-size: 12px; font-weight: 700; color: #0d9488;">
                      ⏱️ Valid for 5 minutes only
                    </span>
                  </div>

                  <!-- Security Warning -->
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #991b1b; font-size: 12px; line-height: 1.5; font-weight: 500;">
                      <strong>Security Notice:</strong> Nexo Medico AI staff will never ask for your verification code. If you did not initiate this request, please change your password and notify your hospital administrator immediately.
                    </p>
                  </div>

                  <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                    This is an automated security transmission. Please do not reply directly to this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
                  <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 500;">
                    © 2026 Nexo Medico AI Healthcare Platform • ISO 27001 & HIPAA Compliant Cloud
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const t = getSmtpTransporter();
    console.log(`[SMTP] Dispatching ${purpose} verification email to ${maskEmail(toEmail)}...`);

    const info = await t.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: `${title}\n\nHello ${userName},\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nNever share this code with anyone.`,
      html,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });

    console.log(`[SMTP] Accepted by Gmail. Message-ID: ${info.messageId}, Recipient: ${maskEmail(toEmail)}, Status: ${info.response || '250 OK'}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (err: any) {
    const rawMsg = err.message || '';
    const sanitizedError = rawMsg.replace(/:.*@/, ':***@');
    let userFacingMessage = "We couldn't send the verification code. Please try again shortly.";

    if (err.code === 'EAUTH' || rawMsg.includes('Invalid login') || rawMsg.includes('Username and Password not accepted')) {
      userFacingMessage = "Email delivery service authentication error. Please verify server SMTP configuration.";
    } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      userFacingMessage = "Connection to the email server timed out. Please try again shortly.";
    } else if (err.responseCode === 550 || rawMsg.includes('550') || rawMsg.includes('5.1.1')) {
      userFacingMessage = "Recipient address was rejected by the mail server (550 5.1.1). Please verify the recipient email.";
    }

    console.error(`[SMTP ERROR] Delivery failed to ${maskEmail(toEmail)}: [${err.code || err.responseCode || 'UNKNOWN'}] ${sanitizedError}`);
    return { success: false, error: userFacingMessage };
  }
}

// Backward-compatible wrapper for existing forgot-password route
export async function sendPasswordResetEmail({
  toEmail,
  userName = 'Healthcare User',
  otpCode
}: SendPasswordResetEmailParams): Promise<{ success: boolean; devMode?: boolean; error?: string }> {
  const result = await sendOtpEmail({
    toEmail,
    userName,
    otpCode,
    purpose: 'PASSWORD_RESET'
  });
  return { success: result.success, error: result.error };
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
  return 'http://localhost:3000';
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface SendSupportConfirmationParams {
  toEmail: string;
  userName: string;
  ticketCode: string;
  subject: string;
  category: string;
  description: string;
  statusText?: string;
  submittedAt?: Date | string;
  expectedResponseHours?: number;
}

export async function sendSupportTicketConfirmationEmail({
  toEmail,
  userName = 'Healthcare User',
  ticketCode,
  subject,
  category,
  description,
  statusText = 'Open — Awaiting Support Review',
  submittedAt = new Date(),
  expectedResponseHours = 24
}: SendSupportConfirmationParams): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const rawFrom = (process.env.EMAIL_FROM || '').trim();
  const defaultSender = process.env.SMTP_USER || 'nexomedicoai@gmail.com';
  const fromAddress = rawFrom.includes('<') && rawFrom.includes('>')
    ? rawFrom
    : `"Nexo Medico AI Support" <${defaultSender}>`;

  const dateObj = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const formattedDate = dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const trackingUrl = `${getAppBaseUrl()}/support/tickets/${encodeURIComponent(ticketCode)}`;
  const emailSubject = `[Nexo Medico AI] Support Ticket Received — ${ticketCode}`;

  const safeSubject = escapeHtml(subject);
  const safeCategory = escapeHtml(category);
  const safeSummary = escapeHtml(description.length > 300 ? description.slice(0, 297) + '...' : description);
  const safeName = escapeHtml(userName);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeSubject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%); padding: 32px; text-align: left;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                          NEXO <span style="color: #38bdf8;">MEDICO</span> AI
                        </span>
                        <div style="display: inline-block; margin-left: 10px; background-color: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 9999px; padding: 3px 10px; vertical-align: middle;">
                          <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Help Desk</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 8px;">
                        <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-weight: 500;">
                          Support Ticket Confirmation & Tracking
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                    Hello ${safeName},
                  </p>

                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                    Thank you for contacting Nexo Medico AI Support. Your request has been successfully registered. Our support team aims to provide an initial response within ${expectedResponseHours} hours. You can follow your ticket status and communicate with our team through the Support Tickets section of your account.
                  </p>

                  <!-- Ticket Snapshot Card -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                    <table width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="36%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Ticket Token</td>
                        <td style="font-size: 13px; font-weight: 900; color: #0284c7; font-family: monospace;">${ticketCode}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Subject</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0f172a;">${safeSubject}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Category</td>
                        <td style="font-size: 12px; font-weight: 600; color: #334155;">${safeCategory}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Status</td>
                        <td style="font-size: 12px; font-weight: 800; color: #d97706;">${escapeHtml(statusText)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Submitted At</td>
                        <td style="font-size: 12px; font-weight: 500; color: #475569;">${formattedDate}</td>
                      </tr>
                    </table>

                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                      <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Summary:</span>
                      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #475569;">${safeSummary}</p>
                    </div>
                  </div>

                  <!-- Tracking Button -->
                  <div style="text-align: center; margin: 28px 0 24px 0;">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
                      Track Ticket &amp; View Conversation &rarr;
                    </a>
                  </div>

                  <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                    If the button does not work, copy and paste this URL into your browser:<br>
                    <a href="${trackingUrl}" style="color: #0284c7; word-break: break-all; font-weight: 500;">${trackingUrl}</a>
                  </p>

                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-top: 20px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #166534; font-weight: 500;">
                      <strong>How to Reply:</strong> Please communicate with our team directly through the secure ticket conversation link above. Replies sent to this automated email address are not monitored.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 11px; font-weight: 500;">
                    This is an automated notification from Nexo Medico AI Support Services.
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 500;">
                    &copy; 2026 Nexo Medico AI Healthcare Platform &bull; ISO 27001 &amp; HIPAA Compliant
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textFallback = `[Nexo Medico AI Support Ticket Confirmation]\n\nHello ${userName},\n\nThank you for contacting Nexo Medico AI Support. Your request has been successfully registered. Our support team aims to provide an initial response within ${expectedResponseHours} hours. You can follow your ticket status and communicate with our team through the Support Tickets section of your account.\n\nTicket Token: ${ticketCode}\nSubject: ${subject}\nCategory: ${category}\nStatus: ${statusText}\nSubmitted At: ${formattedDate}\n\nSummary:\n${description}\n\nTrack your ticket and reply online:\n${trackingUrl}\n\nNote: This is an automated email. Replies sent directly to this email address are not monitored. Please use the tracking link above to post messages.\n\n---\nNexo Medico AI Support Team`;

  try {
    const t = getSmtpTransporter();
    console.log(`[SMTP] Dispatching support confirmation email for ticket ${ticketCode} to ${maskEmail(cleanEmail)}...`);

    const info = await t.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: emailSubject,
      text: textFallback,
      html,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });

    console.log(`[SMTP] Support confirmation email accepted by Gmail. Message-ID: ${info.messageId}, Status: ${info.response || '250 OK'}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (err: any) {
    const rawMsg = err.message || '';
    const sanitizedError = rawMsg.replace(/:.*@/, ':***@');
    console.error(`[SMTP ERROR] Ticket confirmation email failed to ${maskEmail(cleanEmail)}: [${err.code || err.responseCode || 'UNKNOWN'}] ${sanitizedError}`);
    return { success: false, error: sanitizedError };
  }
}

export interface SendSupportUpdateParams {
  toEmail: string;
  userName: string;
  ticketCode: string;
  subject: string;
  updateType: 'STAFF_REPLY' | 'STATUS_CHANGED' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'ASSIGNED';
  updateSummary: string;
  newStatus?: string;
  actorName?: string;
}

export async function sendSupportTicketUpdateEmail({
  toEmail,
  userName = 'Healthcare User',
  ticketCode,
  subject,
  updateType,
  updateSummary,
  newStatus,
  actorName = 'Support Specialist'
}: SendSupportUpdateParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { success: false, error: 'Invalid recipient email.' };
  }

  const rawFrom = (process.env.EMAIL_FROM || '').trim();
  const defaultSender = process.env.SMTP_USER || 'nexomedicoai@gmail.com';
  const fromAddress = rawFrom.includes('<') && rawFrom.includes('>')
    ? rawFrom
    : `"Nexo Medico AI Support" <${defaultSender}>`;

  const trackingUrl = `${getAppBaseUrl()}/support/tickets/${encodeURIComponent(ticketCode)}`;
  const emailSubject = `[Nexo Medico AI] Support Ticket Update — ${ticketCode}`;

  let actionTitle = 'Ticket Activity Update';
  if (updateType === 'STAFF_REPLY') actionTitle = 'New Response from Support Specialist';
  else if (updateType === 'RESOLVED') actionTitle = 'Ticket Marked as Resolved';
  else if (updateType === 'CLOSED') actionTitle = 'Ticket Closed';
  else if (updateType === 'REOPENED') actionTitle = 'Ticket Reopened';
  else if (updateType === 'STATUS_CHANGED') actionTitle = `Ticket Status Updated to ${newStatus || 'Updated'}`;

  const safeSubject = escapeHtml(subject);
  const safeSummary = escapeHtml(updateSummary);
  const safeName = escapeHtml(userName);
  const safeActor = escapeHtml(actorName);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(actionTitle)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr>
                <td style="background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%); padding: 28px 32px;">
                  <span style="font-size: 20px; font-weight: 900; color: #ffffff;">
                    NEXO <span style="color: #38bdf8;">MEDICO</span> AI
                  </span>
                  <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">${escapeHtml(actionTitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 32px;">
                  <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; color: #0f172a;">Hello ${safeName},</p>
                  <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                    There is an update on your support ticket <strong>${ticketCode}</strong> (${safeSubject}).
                  </p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px;">Update by ${safeActor}:</div>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e293b;">${safeSummary}</p>
                  </div>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 24px; border-radius: 10px;">
                      Open Ticket Tracking &rarr;
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                    Replies to this automated email address are not monitored. Please post responses on the ticket page.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textFallback = `[Nexo Medico AI Support Update]\n\nHello ${userName},\n\nThere is an update on your support ticket ${ticketCode} (${subject}).\n\n${actionTitle} by ${actorName}:\n${updateSummary}\n\nView details & reply:\n${trackingUrl}\n\n---\nNexo Medico AI Support Team`;

  try {
    const t = getSmtpTransporter();
    const info = await t.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: emailSubject,
      text: textFallback,
      html,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    const sanitizedError = (err.message || '').replace(/:.*@/, ':***@');
    console.error(`[SMTP ERROR] Ticket update notification failed:`, sanitizedError);
    return { success: false, error: sanitizedError };
  }
}

