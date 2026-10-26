import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import {
  getGlobalSupportTickets,
  addGlobalSupportMessage
} from '@/lib/supportStore';
import { sendSupportTicketUpdateEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { message, attachmentUrl, isInternal } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (attachmentUrl && typeof attachmentUrl === 'string' && attachmentUrl.startsWith('data:image/')) {
      const approximateBytes = Math.ceil((attachmentUrl.length * 3) / 4);
      if (approximateBytes > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Attachment exceeds maximum permitted size of 5 MB.' }, { status: 400 });
      }
    }

    // 1. Fetch ticket to check status and permissions
    let ticket: any = null;
    try {
      ticket = await prisma.supportIssue.findFirst({
        where: {
          OR: [{ id }, { ticketCode: id }]
        }
      });
    } catch (err) {
      console.warn('Prisma find ticket for message warning:', err);
    }

    if (!ticket) {
      const store = getGlobalSupportTickets();
      ticket = store.find(t => t.id === id || t.ticketCode === id);
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Support ticket not found.' }, { status: 404 });
    }

    // 2. CRITICAL LOCKDOWN CHECK: Closed ticket messaging must be strictly rejected
    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        {
          error: 'This ticket is closed. Messaging and tracking updates are no longer available.',
          closed: true
        },
        { status: 403 }
      );
    }

    // 3. Authorization check
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isHospitalAdmin = user.role === 'HOSPITAL_ADMIN' && Boolean(user.hospitalId && ticket.hospitalId === user.hospitalId);
    const isOwner = Boolean(ticket.userId === user.id || (ticket.email && ticket.email.toLowerCase() === user.email.toLowerCase()));

    if (!isSuperAdmin && !isHospitalAdmin && !isOwner) {
      return NextResponse.json({ error: 'You are not authorized to send messages on this ticket.' }, { status: 403 });
    }

    // Only staff can author internal notes
    const staffNote: boolean = Boolean(isInternal && (isSuperAdmin || isHospitalAdmin));

    const senderName = user.name || user.email.split('@')[0] || 'User';
    const senderRole = user.role || 'USER';

    let validUserId: string | null = null;
    if (user.id) {
      try {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
        if (u) validUserId = u.id;
      } catch (e) {}
    }

    // 4. Save message and timeline event in DB
    let newMsg: any = null;
    let updatedTicket: any = null;

    try {
      newMsg = await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: validUserId,
          senderRole,
          senderName,
          message: message.trim(),
          attachmentUrl: attachmentUrl || null,
          isInternal: staffNote
        }
      });

      // Smart status transition
      let nextStatus = ticket.status;
      if (!staffNote) {
        if (isOwner && ticket.status === 'WAITING_FOR_USER') {
          nextStatus = 'IN_PROGRESS';
        } else if (!isOwner && (isSuperAdmin || isHospitalAdmin)) {
          // Staff answered user
          nextStatus = 'WAITING_FOR_USER';
        }
      }

      updatedTicket = await prisma.supportIssue.update({
        where: { id: ticket.id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
          timelineEvents: {
            create: [
              {
                actorId: validUserId,
                actorRole: senderRole,
                actorName: senderName,
                type: 'MESSAGE_POSTED',
                description: staffNote
                  ? `Internal staff note added by ${senderName}`
                  : `Message sent by ${senderName} (${senderRole})`
              }
            ]
          }
        },
        include: {
          hospital: { select: { id: true, name: true, city: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: 'asc' } },
          timelineEvents: { orderBy: { createdAt: 'asc' } }
        }
      });
    } catch (dbErr) {
      console.warn('Prisma support message create error, falling back:', dbErr);
    }

    // Keep global store in sync
    let globalMsg: any = null;
    try {
      globalMsg = addGlobalSupportMessage(
        ticket.id,
        { id: user.id, name: senderName, role: senderRole },
        message.trim(),
        attachmentUrl || null,
        staffNote
      );
    } catch (e: any) {
      if (e.message.includes('closed')) {
        return NextResponse.json(
          { error: 'This ticket is closed. Messaging and tracking updates are no longer available.' },
          { status: 403 }
        );
      }
    }

    // 5. Send notification email to ticket owner if staff sent a user-facing reply
    if (!staffNote && !isOwner && (isSuperAdmin || isHospitalAdmin) && ticket.email) {
      try {
        await sendSupportTicketUpdateEmail({
          toEmail: ticket.email,
          userName: ticket.registeredName,
          ticketCode: ticket.ticketCode,
          subject: ticket.subject,
          updateType: 'STAFF_REPLY',
          updateSummary: message.trim().length > 300 ? message.trim().slice(0, 297) + '...' : message.trim(),
          actorName: senderName
        });
      } catch (mailErr) {
        console.error('Support reply email notification failed:', mailErr);
      }
    }

    const currentMessages = updatedTicket?.messages || (ticket.messages ? [...ticket.messages, newMsg || globalMsg] : [newMsg || globalMsg]);
    const isStaff = isSuperAdmin || isHospitalAdmin;
    const sanitizedMessages = currentMessages.filter((m: any) => isStaff || !m.isInternal);

    const finalTicket = updatedTicket ? { ...updatedTicket, messages: sanitizedMessages } : ticket;

    return NextResponse.json({
      message: 'Message posted successfully',
      data: newMsg || globalMsg,
      ticket: finalTicket
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error posting support message:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
