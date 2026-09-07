import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { getGlobalSupportTickets, addGlobalSupportTicket, updateGlobalSupportTicket } from '@/lib/supportStore';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const search = (searchParams.get('q') || '').toLowerCase().trim();

    let dbIssues: any[] = [];
    try {
      dbIssues = await prisma.supportIssue.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? {
            OR: [
              { ticketCode: { contains: search } },
              { registeredName: { contains: search } },
              { email: { contains: search } },
              { mobile: { contains: search } },
              { subject: { contains: search } }
            ]
          } : {})
        },
        include: {
          hospital: { select: { id: true, name: true, city: true } }
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
      inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: allIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
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
        inProgress: globalTickets.filter(i => i.status === 'IN_PROGRESS').length,
        resolved: globalTickets.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { registeredName, email, mobile, subject, description, issueType, attachmentUrl, hospitalId } = body;

    let dbCount = 0;
    try {
      dbCount = await prisma.supportIssue.count();
    } catch (e) {
      console.warn('Prisma supportIssue count warning:', e);
    }
    const ticketCode = `TICKET-2026-${String(dbCount + 1).padStart(4, '0')}`;

    let newIssue: any = null;
    try {
      newIssue = await prisma.supportIssue.create({
        data: {
          ticketCode,
          registeredName: registeredName || user?.name || 'Registered User',
          email: (email || user?.email || 'user@nexomedico.ai').toLowerCase().trim(),
          mobile: mobile || '+1 (555) 012-3456',
          subject: subject || 'Platform Inquiry / Ticket Request',
          description: description || 'User raised a support ticket via Nexo AI Assistant.',
          issueType: issueType || 'TECHNICAL',
          attachmentUrl: attachmentUrl || null,
          status: 'OPEN',
          hospitalId: hospitalId || user?.hospitalId || null
        }
      });
    } catch (e) {
      console.warn('Prisma supportIssue create warning:', e);
    }

    const ticket = addGlobalSupportTicket({
      id: newIssue?.id,
      ticketCode: newIssue?.ticketCode || ticketCode,
      registeredName: registeredName || user?.name || 'Registered User',
      email: (email || user?.email || 'user@nexomedico.ai').toLowerCase().trim(),
      mobile: mobile || '+1 (555) 012-3456',
      subject: subject || 'Platform Inquiry / Ticket Request',
      description: description || 'User raised a support ticket via Nexo AI Assistant.',
      issueType: issueType || 'TECHNICAL',
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
          details: { ticketCode: ticket.ticketCode, subject: ticket.subject }
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

    const { ticketId, status, adminResponse } = await req.json();

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'Ticket ID and new status are required' }, { status: 400 });
    }

    let updatedIssue: any = null;
    try {
      updatedIssue = await prisma.supportIssue.update({
        where: { id: ticketId },
        data: {
          status,
          adminResponse: adminResponse || null,
          resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : null
        }
      });
    } catch (e) {
      console.warn('Prisma supportIssue update warning:', e);
    }

    const globalTicket = updateGlobalSupportTicket(ticketId, status, adminResponse);

    const issueObj = updatedIssue || globalTicket || { id: ticketId, status, adminResponse };

    try {
      await createAuditLog({
        hospitalId: issueObj.hospitalId || null,
        userId: user.id,
        action: 'SUPPORT_TICKET_RESOLVED',
        resource: `SupportTicket:${issueObj.ticketCode || ticketId}`,
        details: { ticketCode: issueObj.ticketCode || ticketId, newStatus: status, adminResponse }
      });
    } catch (e) {
      // Audit log fail safe
    }

    return NextResponse.json({
      message: `Ticket ${issueObj.ticketCode || ticketId} updated to ${status}`,
      issue: issueObj
    });
  } catch (err: any) {
    console.error('Support ticket update error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

