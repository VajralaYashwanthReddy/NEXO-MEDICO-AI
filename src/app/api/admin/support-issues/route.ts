import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export interface SupportIssueItem {
  id: string;
  ticketCode: string;
  hospitalId: string | null;
  registeredName: string;
  mobile: string;
  email: string;
  issueType: string;
  subject: string;
  description: string;
  attachmentUrl: string | null;
  status: string;
  adminResponse: string | null;
  resolvedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const initialSupportIssues: SupportIssueItem[] = [
  {
    id: 'ticket-001',
    ticketCode: 'TICKET-2026-0001',
    hospitalId: 'hosp-metro-01',
    registeredName: 'Dr. Sarah Jenkins',
    mobile: '+1 (555) 234-5678',
    email: 'sarah.jenkins@metrohealth.org',
    issueType: 'TECHNICAL',
    subject: 'AI Diabetes Prediction Model Latency',
    description: 'The AI Diabetes risk score calculation takes > 5 seconds during peak outpatient hours. Requesting optimization.',
    attachmentUrl: null,
    status: 'IN_PROGRESS',
    adminResponse: 'Engineers dispatched model caching update.',
    resolvedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'ticket-002',
    ticketCode: 'TICKET-2026-0002',
    hospitalId: 'hosp-metro-01',
    registeredName: 'John Doe (Patient)',
    mobile: '+1 (555) 987-6543',
    email: 'john.doe@gmail.com',
    issueType: 'LOGIN_ISSUE',
    subject: 'Cannot access patient portal via mobile browser',
    description: 'Receiving invalid session state when attempting to view lab results from my iPhone.',
    attachmentUrl: null,
    status: 'OPEN',
    adminResponse: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const globalForSupport = globalThis as unknown as { globalSupportIssuesStore: SupportIssueItem[] };

if (!globalForSupport.globalSupportIssuesStore) {
  globalForSupport.globalSupportIssuesStore = [...initialSupportIssues];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const search = (searchParams.get('q') || '').toLowerCase();

    let dbIssues: any[] = [];
    try {
      dbIssues = await prisma.supportIssue.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr: any) {
      console.warn('Prisma support issues GET skipped, serving global store:', dbErr.message);
    }

    const mergedMap = new Map<string, any>();
    for (const item of globalForSupport.globalSupportIssuesStore) {
      mergedMap.set(item.ticketCode, item);
    }
    for (const item of dbIssues) {
      mergedMap.set(item.ticketCode, item);
    }

    let allIssues = Array.from(mergedMap.values());

    if (statusFilter) {
      allIssues = allIssues.filter(i => i.status === statusFilter);
    }

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

    allIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summaryCards = {
      total: allIssues.length,
      open: allIssues.filter(i => i.status === 'OPEN').length,
      inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: allIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    };

    return NextResponse.json({ issues: allIssues, summaryCards });
  } catch (err: any) {
    return NextResponse.json({
      issues: globalForSupport.globalSupportIssuesStore,
      summaryCards: {
        total: globalForSupport.globalSupportIssuesStore.length,
        open: globalForSupport.globalSupportIssuesStore.filter(i => i.status === 'OPEN').length,
        inProgress: globalForSupport.globalSupportIssuesStore.filter(i => i.status === 'IN_PROGRESS').length,
        resolved: globalForSupport.globalSupportIssuesStore.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { registeredName, email, mobile, subject, description, issueType, attachmentUrl, hospitalId } = body;

    const count = globalForSupport.globalSupportIssuesStore.length + 1;
    const ticketCode = `TICKET-2026-${String(count).padStart(4, '0')}`;

    let newIssue: any = null;

    try {
      newIssue = await prisma.supportIssue.create({
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
    } catch (dbErr: any) {
      console.warn('Prisma support issue POST skipped, storing in global store:', dbErr.message);
    }

    const ticketItem: SupportIssueItem = {
      id: newIssue?.id || `ticket-mem-${Date.now()}`,
      ticketCode: newIssue?.ticketCode || ticketCode,
      hospitalId: hospitalId || user?.hospitalId || 'hosp-metro-01',
      registeredName: registeredName || user?.name || 'Registered User',
      email: email || user?.email || 'user@nexomedico.ai',
      mobile: mobile || '+1 (555) 012-3456',
      issueType: issueType || 'TECHNICAL',
      subject: subject || 'Platform Inquiry / Ticket Request',
      description: description || 'User raised a support ticket via Nexo AI Assistant.',
      attachmentUrl: attachmentUrl || null,
      status: 'OPEN',
      adminResponse: null,
      resolvedAt: null,
      createdAt: newIssue?.createdAt || new Date().toISOString(),
      updatedAt: newIssue?.updatedAt || new Date().toISOString()
    };

    globalForSupport.globalSupportIssuesStore.unshift(ticketItem);

    if (user) {
      try {
        await createAuditLog({
          hospitalId: ticketItem.hospitalId,
          userId: user.id,
          action: 'SUPPORT_TICKET_CREATED',
          resource: `SupportTicket:${ticketItem.ticketCode}`,
          details: { ticketCode: ticketItem.ticketCode, subject: ticketItem.subject }
        });
      } catch (aErr) {
        // ignore
      }
    }

    return NextResponse.json({
      message: `Support Ticket ${ticketItem.ticketCode} created successfully!`,
      ticket: ticketItem
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    const { ticketId, status, adminResponse } = await req.json();

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'Ticket ID and new status are required' }, { status: 400 });
    }

    let updatedDbIssue: any = null;
    try {
      updatedDbIssue = await prisma.supportIssue.update({
        where: { id: ticketId },
        data: {
          status,
          adminResponse: adminResponse || null,
          resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : null
        }
      });
    } catch (dbErr: any) {
      console.warn('Prisma support issue PUT skipped, updating global store:', dbErr.message);
    }

    const storeIdx = globalForSupport.globalSupportIssuesStore.findIndex(i => i.id === ticketId || i.ticketCode === ticketId);
    if (storeIdx >= 0) {
      globalForSupport.globalSupportIssuesStore[storeIdx] = {
        ...globalForSupport.globalSupportIssuesStore[storeIdx],
        status,
        adminResponse: adminResponse || null,
        resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
    }

    if (user) {
      try {
        await createAuditLog({
          hospitalId: updatedDbIssue?.hospitalId || null,
          userId: user.id,
          action: 'SUPPORT_TICKET_RESOLVED',
          resource: `SupportTicket:${ticketId}`,
          details: { ticketId, newStatus: status, adminResponse }
        });
      } catch (aErr) {
        // ignore
      }
    }

    return NextResponse.json({
      message: `Ticket updated to ${status}`,
      issue: updatedDbIssue || (storeIdx >= 0 ? globalForSupport.globalSupportIssuesStore[storeIdx] : null)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
