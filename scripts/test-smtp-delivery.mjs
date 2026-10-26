/**
 * Development-only CLI diagnostic script for Gmail SMTP email delivery.
 * Tests connection handshake and dispatches a test email.
 * Usage: node scripts/test-smtp-delivery.mjs [recipient_email]
 */

import { verifySmtpConnection, sendOtpEmail } from '../src/lib/email.ts';

if (process.loadEnvFile) {
  process.loadEnvFile('.env.local');
}

const targetRecipient = process.argv[2] || process.env.SMTP_USER || 'nexomedicoai@gmail.com';

function mask(e) {
  if (!e || !e.includes('@')) return e;
  const [l, d] = e.split('@');
  return `${l[0]}***${l.slice(-1)}@${d}`;
}

async function runDiagnostic() {
  console.log('===============================================================');
  console.log('🔍 Nexo Medico AI: Gmail SMTP Service Diagnostic');
  console.log('===============================================================\n');

  console.log('1. Checking Server-Side Environment Variables...');
  console.log('   SMTP_HOST          :', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('   SMTP_PORT          :', process.env.SMTP_PORT || '465');
  console.log('   SMTP_SECURE        :', process.env.SMTP_SECURE || 'true');
  console.log('   SMTP_USER          :', mask(process.env.SMTP_USER));
  console.log('   SMTP_APP_PASSWORD  :', process.env.SMTP_APP_PASSWORD ? '[Configured - 16 characters]' : '[MISSING]');
  console.log('   EMAIL_FROM         :', process.env.EMAIL_FROM || '[Default]');

  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    console.error('\n❌ FATAL: SMTP_USER or SMTP_APP_PASSWORD is not configured in .env.local');
    process.exit(1);
  }

  console.log('\n2. Verifying SMTP Handshake with smtp.gmail.com:465 (SSL)...');
  const handshake = await verifySmtpConnection();
  if (!handshake.success) {
    console.error(`❌ Connection failed: ${handshake.error}`);
    process.exit(1);
  }
  console.log('   ✅ SMTP handshake verified! Credentials accepted by Gmail.');

  console.log(`\n3. Sending Test Verification Email to: ${mask(targetRecipient)}...`);
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const sendRes = await sendOtpEmail({
    toEmail: targetRecipient,
    userName: 'Diagnostic Recipient',
    otpCode: testOtp,
    purpose: 'REGISTRATION'
  });

  if (!sendRes.success) {
    console.error(`❌ Send failed: ${sendRes.error}`);
    process.exit(1);
  }

  console.log('   ✅ Gmail Accepted the email!');
  console.log(`   Message-ID : ${sendRes.messageId}`);
  console.log(`   SMTP Status: ${sendRes.response}`);

  console.log('\n===============================================================');
  console.log('🎉 DIAGNOSTIC TEST PASSED');
  console.log('📬 Check the recipient inbox and Spam/Junk folder for the OTP email.');
  console.log('===============================================================');
}

runDiagnostic();
