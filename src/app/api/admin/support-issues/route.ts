import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import {
  getGlobalSupportTickets,
  addGlobalSupportTicket,
  updateGlobalSupportTicket,
  generateUniqueTicketToken
} from '@/lib/supportStore';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');
    const search = (searchParams.get('q') || '').toLowerCase().trim();

    let dbIssues: any[] = [];
    try {
      dbIssues = await prisma.supportIssue.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(priorityFilter ? { priority: priorityFilter } : {}),
          ...(search ? {
            OR: [
              { ticketCode: { contains: search, mode: 'insensitive' } },
              { registeredName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
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
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      console.warn('Prisma supportIssue findMany warning:', err);
    }

    const globalTickets = getGlobalSupportTickets();
    const map = new Map<string, any>();

    // Put DB issues first
    for (const item of dbIssues) {
      map.set(item.id, item);
      if (item.ticketCode) map.set(item.ticketCode, item);
    }

    // Merge in global tickets if not present
    for (const item of globalTickets) {
      if (!map.has(item.id) && !map.has(item.ticketCode)) {
        map.set(item.id, item);
      }
    }

    let allIssues = Array.from(new Set(map.values()));

    // Filter by status if requested
    if (statusFilter) {
      allIssues = allIssues.filter(i => i.status === statusFilter);
    }

    // Filter by priority if requested
    if (priorityFilter) {
      allIssues = allIssues.filter(i => i.priority === priorityFilter);
    }

    // Filter by search query if requested
    if (search) {
      allIssues = allIssues.filter(i =>
        (i.ticketCode && i.ticketCode.toLowerCase().includes(search)) ||
        (i.registeredName && i.registeredName.toLowerCase().includes(search)) ||
        (i.email && i.email.toLowerCase().includes(search)) ||
        (i.mobile && i.mobile.toLowerCase().includes(search)) ||
        (i.subject && i.subject.toLowerCase().includes(search)) ||
        (i.description && i.description.toLowerCase().includes(search))
      );
    }

    // Sort by createdAt descending
    allIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summaryCards = {
      total: allIssues.length,
      open: allIssues.filter(i => i.status === 'OPEN').length,
      inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'WAITING_FOR_USER' || i.status === 'WAITING_FOR_SUPPORT').length,
      resolved: allIssues.filter(i => i.status === 'RESOLVED').length,
      closed: allIssues.filter(i => i.status === 'CLOSED').length
    };

    return NextResponse.json({ issues: allIssues, summaryCards });
  } catch (err: any) {
    console.error('Error fetching admin support issues:', err);
    const globalTickets = getGlobalSupportTickets();
    return NextResponse.json({
      issues: globalTickets,
      summaryCards: {
        total: globalTickets.length,
        open: globalTickets.filter(i => i.status === 'OPEN').length,
        inProgress: globalTickets.filter(i => i.status === 'IN_PROGRESS' || i.status === 'WAITING_FOR_USER').length,
        resolved: globalTickets.filter(i => i.status === 'RESOLVED').length,
        closed: globalTickets.filter(i => i.status === 'CLOSED').length
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { registeredName, email, mobile, subject, description, issueType, priority, attachmentUrl, hospitalId } = body;

    const ticketCode = await generateUniqueTicketToken(prisma);
    const contactName = registeredName || user?.name || 'Platform Administrator';
    const contactEmail = (email || user?.email || 'admin@nexomedico.ai').toLowerCase().trim();
    const contactMobile = mobile ? mobile.trim() : (user as any)?.phone || 'Not Provided';
    const ticketSubject = subject || 'Platform Inquiry / Ticket Request';
    const ticketDesc = description || 'Admin raised support ticket.';
    const ticketPriority = priority || 'MEDIUM';

    let newIssue: any = null;
    try {
      newIssue = await prisma.supportIssue.create({
        data: {
          ticketCode,
          userId: user?.id || null,
          userRole: user?.role || 'SUPER_ADMIN',
          registeredName: contactName,
          email: contactEmail,
          mobile: contactMobile,
          subject: ticketSubject,
          description: ticketDesc,
          issueType: issueType || 'TECHNICAL',
          priority: ticketPriority,
          attachmentUrl: attachmentUrl || null,
          status: 'OPEN',
          hospitalId: hospitalId || user?.hospitalId || null,
          messages: {
            create: [
              {
                senderId: user?.id || null,
                senderRole: user?.role || 'SUPER_ADMIN',
                senderName: contactName,
                message: ticketDesc,
                attachmentUrl: attachmentUrl || null
              }
            ]
          },
          timelineEvents: {
            create: [
              {
                actorId: user?.id || null,
                actorRole: user?.role || 'SUPER_ADMIN',
                actorName: contactName,
                type: 'CREATED',
                newStatus: 'OPEN',
                description: `Ticket created with ${ticketPriority} priority`
              }
            ]
          }
        },
        include: {
          hospital: { select: { id: true, name: true, city: true } },
          messages: true,
          timelineEvents: true
        }
      });
    } catch (e) {
      console.warn('Prisma supportIssue create warning:', e);
    }

    const ticket = addGlobalSupportTicket({
      id: newIssue?.id,
      ticketCode: newIssue?.ticketCode || ticketCode,
      registeredName: contactName,
      email: contactEmail,
      mobile: contactMobile,
      subject: ticketSubject,
      description: ticketDesc,
      issueType: issueType || 'TECHNICAL',
      priority: ticketPriority,
      attachmentUrl: attachmentUrl || null,
      status: 'OPEN',
      hospitalId: hospitalId || user?.hospitalId || null,
      createdAt: newIssue?.createdAt ? String(newIssue.createdAt) : new Date().toISOString()
    });

    if (user) {
      try {
        await createAuditLog({
          hospitalId: ticket.hospitalId,
          userId: user.id,
          action: 'SUPPORT_TICKET_CREATED',
          resource: `SupportTicket:${ticket.ticketCode}`,
          details: { ticketCode: ticket.ticketCode, subject: ticket.subject, priority: ticketPriority }
        });
      } catch (e) {
        // Audit log fail safe
      }
    }

    return NextResponse.json({
      message: `Support Ticket ${ticket.ticketCode} created successfully!`,
      ticket: newIssue || ticket
    });
  } catch (err: any) {
    console.error('Support ticket creation error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Platform Admin role required' }, { status: 403 });
    }

    const { ticketId, status, priority, adminResponse, assignedToId } = await req.json();

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'Ticket ID and new status are required' }, { status: 400 });
    }

    // Lookup existing ticket
    let existingTicket: any = null;
    try {
      existingTicket = await prisma.supportIssue.findFirst({
        where: { OR: [{ id: ticketId }, { ticketCode: ticketId }] }
      });
    } catch (e) {
      console.warn('Prisma lookup warning:', e);
    }

    const oldStatus = existingTicket?.status || 'OPEN';
    const isClosing = status === 'CLOSED' && oldStatus !== 'CLOSED';
    const isReopening = oldStatus === 'CLOSED' && status !== 'CLOSED';

    let updatedIssue: any = null;
    try {
      const updateData: any = {
        status,
        ...(priority ? { priority } : {}),
        ...(adminResponse !== undefined ? { adminResponse } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : null,
        closedAt: status === 'CLOSED' ? new Date() : (isReopening ? null : undefined)
      };

      updatedIssue = await prisma.supportIssue.update({
        where: { id: existingTicket?.id || ticketId },
        data: {
          ...updateData,
          // If admin provided a resolution/reply note, also create a message
          ...(adminResponse?.trim() ? {
            messages: {
              create: [
                {
                  senderId: user.id,
                  senderRole: 'SUPER_ADMIN',
                  senderName: user.name || 'Platform Support Team',
                  message: adminResponse.trim()
                }
              ]
            }
          } : {}),
          timelineEvents: {
            create: [
              {
                actorId: user.id,
                actorRole: 'SUPER_ADMIN',
                actorName: user.name || 'Platform Administrator',
                type: isClosing ? 'CLOSED' : (isReopening ? 'REOPENED' : 'STATUS_CHANGED'),
                oldStatus,
                newStatus: status,
                description: isClosing
                  ? `Ticket closed by ${user.name || 'Platform Administrator'}`
                  : (isReopening
                      ? `Ticket reopened by ${user.name || 'Platform Administrator'}`
                      : `Status updated from ${oldStatus} to ${status}${adminResponse ? ': ' + adminResponse.slice(0, 50) : ''}`)
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
    } catch (e) {
      console.warn('Prisma supportIssue update warning:', e);
    }

    const globalTicket = updateGlobalSupportTicket(ticketId, status, adminResponse, {
      id: user.id,
      name: user.name || 'Platform Administrator',
      role: 'SUPER_ADMIN'
    });

    const issueObj = updatedIssue || globalTicket || { id: ticketId, status, adminResponse };

    try {
      await createAuditLog({
        hospitalId: issueObj.hospitalId || null,
        userId: user.id,
        action: isClosing ? 'SUPPORT_TICKET_CLOSED' : (isReopening ? 'SUPPORT_TICKET_REOPENED' : 'SUPPORT_TICKET_RESOLVED'),
        resource: `SupportTicket:${issueObj.ticketCode || ticketId}`,
        details: { ticketCode: issueObj.ticketCode || ticketId, oldStatus, newStatus: status, adminResponse }
      });
    } catch (e) {
      // Audit log fail safe
    }

    return NextResponse.json({
      message: `Ticket ${issueObj.ticketCode || ticketId} updated to ${status}`,
      issue: issueObj,
      ticket: issueObj
    });
  } catch (err: any) {
    console.error('Support ticket update error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
