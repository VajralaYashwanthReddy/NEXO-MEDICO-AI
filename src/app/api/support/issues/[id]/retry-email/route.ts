import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { sendSupportTicketConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const ticket = await prisma.supportIssue.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }]
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    // Access control: only owner or staff can retry email notification
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isHospitalAdmin = user.role === 'HOSPITAL_ADMIN' && user.hospitalId && ticket.hospitalId === user.hospitalId;
    const isOwner = ticket.userId === user.id || (ticket.email && ticket.email.toLowerCase() === user.email.toLowerCase());

    if (!isSuperAdmin && !isHospitalAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to retry notification for this ticket' }, { status: 403 });
    }

    const emailResult = await sendSupportTicketConfirmationEmail({
      toEmail: ticket.email,
      userName: ticket.registeredName,
      ticketCode: ticket.ticketCode,
      subject: ticket.subject,
      category: ticket.issueType,
      description: ticket.description,
      statusText: `${ticket.status} — Awaiting Support Review`,
      submittedAt: ticket.createdAt,
      expectedResponseHours: 24
    });

    if (emailResult.success) {
      await prisma.supportIssue.update({
        where: { id: ticket.id },
        data: {
          emailStatus: 'SENT',
          emailSentAt: new Date(),
          emailFailureReason: null
        }
      });

      return NextResponse.json({
        success: true,
        emailStatus: 'SENT',
        message: 'Confirmation email successfully accepted by mail server and dispatched.'
      });
    } else {
      await prisma.supportIssue.update({
        where: { id: ticket.id },
        data: {
          emailStatus: 'FAILED',
          emailFailureReason: emailResult.error || 'Retry submission failed'
        }
      });

      return NextResponse.json({
        success: false,
        emailStatus: 'FAILED',
        error: "We couldn't send the confirmation email at this time. Please try again shortly."
      }, { status: 502 });
    }

  } catch (err: any) {
    console.error('Email retry error:', err);
    return NextResponse.json({ error: 'Internal server error while retrying email' }, { status: 500 });
  }
}
