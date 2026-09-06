import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();

    const {
      registeredName,
      mobile,
      email,
      issueType,
      subject,
      description,
      attachmentUrl
    } = body;

    if (!registeredName || !mobile || !email || !subject || !description) {
      return NextResponse.json({ error: 'Registered Name, Mobile, Email, Subject, and Description are required' }, { status: 400 });
    }

    const count = await prisma.supportIssue.count();
    const ticketCode = `TICKET-2026-${String(count + 1).padStart(4, '0')}`;

    const issue = await prisma.supportIssue.create({
      data: {
        ticketCode,
        hospitalId: user?.hospitalId || null,
        registeredName,
        mobile,
        email: email.toLowerCase().trim(),
        issueType: issueType || 'TECHNICAL',
        subject,
        description,
        attachmentUrl: attachmentUrl || null,
        status: 'OPEN'
      }
    });

    await createAuditLog({
      hospitalId: user?.hospitalId || null,
      userId: user?.id || null,
      action: 'SUPPORT_TICKET_SUBMITTED',
      resource: `SupportTicket:${ticketCode}`,
      details: { subject, email, ticketCode }
    });

    return NextResponse.json({
      message: 'Support ticket submitted successfully. Platform Admin team notified.',
      issue
    }, { status: 201 });
  } catch (err: any) {
    console.error('Support submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
