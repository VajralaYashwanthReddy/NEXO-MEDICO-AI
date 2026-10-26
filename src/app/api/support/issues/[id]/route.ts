import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import {
  getGlobalSupportTickets,
  updateGlobalSupportTicket
} from '@/lib/supportStore';
import { sendSupportTicketUpdateEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { id } = params;

    let ticket: any = null;
    try {
      ticket = await prisma.supportIssue.findFirst({
        where: {
          OR: [
            { id },
            { ticketCode: id }
          ]
        },
        include: {
          hospital: { select: { id: true, name: true, city: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          timelineEvents: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } catch (err) {
      console.warn('Prisma findFirst support issue warning:', err);
    }

    // Fallback to global store
    if (!ticket) {
      const globalTickets = getGlobalSupportTickets();
      ticket = globalTickets.find(t => t.id === id || t.ticketCode === id);
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Support ticket not found.' }, { status: 404 });
    }

    // Tenant & Ownership Authorization Check
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isHospitalAdmin = user.role === 'HOSPITAL_ADMIN' && user.hospitalId && ticket.hospitalId === user.hospitalId;
    const isOwner = ticket.userId === user.id || (ticket.email && ticket.email.toLowerCase() === user.email.toLowerCase());

    if (!isSuperAdmin && !isHospitalAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You are not authorized to view this ticket.' },
        { status: 403 }
      );
    }

    // Hide internal staff notes from regular users
    const isStaff = isSuperAdmin || isHospitalAdmin;
    const sanitizedTicket = {
      ...ticket,
      messages: (ticket.messages || []).filter((m: any) => isStaff || !m.isInternal)
    };

    return NextResponse.json({ ticket: sanitizedTicket });
  } catch (err: any) {
    console.error('Error fetching support ticket details:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status, priority, adminResponse, assignedToId } = body;

    // Retrieve current ticket first
    let currentTicket: any = null;
    try {
      currentTicket = await prisma.supportIssue.findFirst({
        where: {
          OR: [{ id }, { ticketCode: id }]
        }
      });
    } catch (e) {
      console.warn('Prisma lookup warning:', e);
    }

    if (!currentTicket) {
      const store = getGlobalSupportTickets();
      currentTicket = store.find(t => t.id === id || t.ticketCode === id);
    }

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isHospitalAdmin = user.role === 'HOSPITAL_ADMIN' && user.hospitalId && currentTicket.hospitalId === user.hospitalId;
    const isOwner = currentTicket.userId === user.id || (currentTicket.email && currentTicket.email.toLowerCase() === user.email.toLowerCase());

    if (!isSuperAdmin && !isHospitalAdmin && !isOwner) {
      return NextResponse.json({ error: 'You are not authorized to modify this ticket.' }, { status: 403 });
    }

    // STRICT REOPEN RESTRICTION: Only platform administrator can reopen a CLOSED ticket
    if (currentTicket.status === 'CLOSED' && status && status !== 'CLOSED') {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Only platform administrators can reopen a closed ticket.' },
          { status: 403 }
        );
      }
    }

    // Non-admins cannot modify adminResponse or assignedToId
    if ((adminResponse !== undefined || assignedToId !== undefined) && !isSuperAdmin && !isHospitalAdmin) {
      return NextResponse.json({ error: 'Admin privileges required to update response or assignment.' }, { status: 403 });
    }

    const newStatus = status || currentTicket.status;
    const oldStatus = currentTicket.status;
    const isClosing = newStatus === 'CLOSED' && oldStatus !== 'CLOSED';
    const isReopening = oldStatus === 'CLOSED' && newStatus !== 'CLOSED';

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminResponse !== undefined) updateData.adminResponse = adminResponse;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (newStatus === 'CLOSED') {
      updateData.closedAt = new Date();
      if (!currentTicket.resolvedAt) updateData.resolvedAt = new Date();
    } else if (isReopening) {
      updateData.closedAt = null;
    }

    let validUserId: string | null = null;
    if (user.id) {
      try {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
        if (u) validUserId = u.id;
      } catch (e) {}
    }

    let updatedTicket: any = null;
    try {
      updatedTicket = await prisma.supportIssue.update({
        where: { id: currentTicket.id },
        data: {
          ...updateData,
          timelineEvents: {
            create: [
              {
                actorId: validUserId,
                actorRole: user.role,
                actorName: user.name || 'User',
                type: isClosing ? 'CLOSED' : (isReopening ? 'REOPENED' : (status ? 'STATUS_CHANGED' : 'UPDATED')),
                oldStatus,
                newStatus,
                description: isClosing
                  ? `Ticket closed by ${user.name || user.role}`
                  : (isReopening
                      ? `Ticket reopened by platform administrator ${user.name || 'Super Admin'}`
                      : (status ? `Status changed from ${oldStatus} to ${newStatus}` : `Ticket updated by ${user.name}`))
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
    } catch (err) {
      console.warn('Prisma update support issue warning:', err);
    }

    // Keep global store updated
    const globalUpdated = updateGlobalSupportTicket(currentTicket.id, newStatus, adminResponse, {
      id: user.id,
      name: user.name,
      role: user.role
    });

    try {
      await createAuditLog({
        hospitalId: currentTicket.hospitalId || null,
        userId: user.id,
        action: isClosing ? 'SUPPORT_TICKET_CLOSED' : (isReopening ? 'SUPPORT_TICKET_REOPENED' : 'SUPPORT_TICKET_STATUS_UPDATED'),
        resource: `SupportTicket:${currentTicket.ticketCode}`,
        details: { ticketCode: currentTicket.ticketCode, oldStatus, newStatus, actor: user.email }
      });
    } catch (e) {
      // audit log fail safe
    }

    // Send email notification to ticket owner if status changed
    if (status && status !== oldStatus && currentTicket.email) {
      try {
        await sendSupportTicketUpdateEmail({
          toEmail: currentTicket.email,
          userName: currentTicket.registeredName,
          ticketCode: currentTicket.ticketCode,
          subject: currentTicket.subject,
          updateType: isClosing ? 'CLOSED' : (isReopening ? 'REOPENED' : (newStatus === 'RESOLVED' ? 'RESOLVED' : 'STATUS_CHANGED')),
          updateSummary: isClosing
            ? `Your ticket has been marked as CLOSED by ${user.name || user.role}.`
            : (isReopening
                ? `Your ticket has been reopened by platform administrator ${user.name}.`
                : `Your ticket status was changed from ${oldStatus} to ${newStatus}.`),
          newStatus,
          actorName: user.name || user.role
        });
      } catch (emailErr) {
        console.error('Status update notification email failed:', emailErr);
      }
    }

    const finalResult = updatedTicket || globalUpdated || { ...currentTicket, ...updateData };

    // Sanitize internal notes for non-staff
    const isStaff = isSuperAdmin || isHospitalAdmin;
    const sanitizedResult = {
      ...finalResult,
      messages: (finalResult.messages || []).filter((m: any) => isStaff || !m.isInternal)
    };

    return NextResponse.json({
      message: `Ticket ${currentTicket.ticketCode} status updated to ${newStatus}`,
      ticket: sanitizedResult
    });
  } catch (err: any) {
    console.error('Error updating support ticket:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
