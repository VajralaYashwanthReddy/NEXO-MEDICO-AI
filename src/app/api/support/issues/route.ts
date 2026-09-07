import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { addGlobalSupportTicket } from '@/lib/supportStore';

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

    let dbCount = 0;
    try {
      dbCount = await prisma.supportIssue.count();
    } catch (e) {
      console.warn('Database supportIssue count warning:', e);
    }
    const ticketCode = `TICKET-2026-${String(dbCount + 1).padStart(4, '0')}`;

    let issue: any = null;
    try {
      issue = await prisma.supportIssue.create({
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
    } catch (err) {
      console.warn('Prisma supportIssue create error, using global store:', err);
    }

    const ticket = addGlobalSupportTicket({
      id: issue?.id,
      ticketCode: issue?.ticketCode || ticketCode,
      hospitalId: user?.hospitalId || null,
      registeredName,
      mobile,
      email: email.toLowerCase().trim(),
      issueType: issueType || 'TECHNICAL',
      subject,
      description,
      attachmentUrl: attachmentUrl || null,
      status: 'OPEN',
      createdAt: issue?.createdAt ? String(issue.createdAt) : new Date().toISOString()
    });

    try {
      await createAuditLog({
        hospitalId: user?.hospitalId || null,
        userId: user?.id || null,
        action: 'SUPPORT_TICKET_SUBMITTED',
        resource: `SupportTicket:${ticket.ticketCode}`,
        details: { subject, email, ticketCode: ticket.ticketCode }
      });
    } catch (e) {
      // audit log fail safe
    }

    return NextResponse.json({
      message: 'Support ticket submitted successfully. Platform Admin team notified.',
      issue: issue || ticket,
      ticket
    }, { status: 201 });
  } catch (err: any) {
    console.error('Support submission error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

