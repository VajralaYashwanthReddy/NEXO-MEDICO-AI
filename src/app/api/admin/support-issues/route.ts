import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('q') || '';

    const issues = await prisma.supportIssue.findMany({
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

    const summaryCards = {
      total: issues.length,
      open: issues.filter(i => i.status === 'OPEN').length,
      inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    };

    return NextResponse.json({ issues, summaryCards });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { registeredName, email, mobile, subject, description, issueType, attachmentUrl, hospitalId } = body;

    const count = await prisma.supportIssue.count();
    const ticketCode = `TICKET-2026-${String(count + 1).padStart(4, '0')}`;

    const newIssue = await prisma.supportIssue.create({
      data: {
        ticketCode,
        registeredName: registeredName || user?.name || 'Registered User',
        email: email || user?.email || 'user@nexomedico.ai',
        mobile: mobile || '+1 (555) 012-3456',
        subject: subject || 'Platform Inquiry / Ticket Request',
        description: description || 'User raised a support ticket via Nexo AI Assistant.',
        issueType: issueType || 'TECHNICAL',
        attachmentUrl: attachmentUrl || null,
        status: 'OPEN',
        hospitalId: hospitalId || user?.hospitalId || null
      }
    });

    if (user) {
      await createAuditLog({
        hospitalId: newIssue.hospitalId,
        userId: user.id,
        action: 'SUPPORT_TICKET_CREATED',
        resource: `SupportTicket:${newIssue.ticketCode}`,
        details: { ticketCode: newIssue.ticketCode, subject: newIssue.subject }
      });
    }

    return NextResponse.json({
      message: `Support Ticket ${newIssue.ticketCode} created successfully!`,
      ticket: newIssue
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const issue = await prisma.supportIssue.update({
      where: { id: ticketId },
      data: {
        status,
        adminResponse: adminResponse || null,
        resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : null
      }
    });

    await createAuditLog({
      hospitalId: issue.hospitalId,
      userId: user.id,
      action: 'SUPPORT_TICKET_RESOLVED',
      resource: `SupportTicket:${issue.ticketCode}`,
      details: { ticketCode: issue.ticketCode, newStatus: status, adminResponse }
    });

    return NextResponse.json({ message: `Ticket ${issue.ticketCode} updated to ${status}`, issue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
