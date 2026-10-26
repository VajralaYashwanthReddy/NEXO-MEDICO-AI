import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import {
  addGlobalSupportTicket,
  getGlobalSupportTickets
} from '@/lib/supportStore';
import { sendSupportTicketConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function generateUniqueTicketTokenSafe(prismaClient: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `NMX-TKT-${year}-`;

  try {
    const issues = await prismaClient.supportIssue.findMany({
      where: { ticketCode: { startsWith: prefix } },
      select: { ticketCode: true }
    });

    let maxNum = 0;
    for (const item of issues) {
      const match = item.ticketCode.match(new RegExp(`^NMX-TKT-${year}-(\\d+)$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }

    const nextSeq = maxNum + 1;
    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  } catch (err) {
    console.warn('Fallback token generation lookup:', err);
    return `${prefix}${String(Date.now()).slice(-6)}`;
  }
}

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

    const isStaff = user.role === 'SUPER_ADMIN' || user.role === 'HOSPITAL_ADMIN';

    // Role-based visibility scoping
    let whereClause: any = {};

    if (user.role === 'SUPER_ADMIN') {
      whereClause = {};
    } else if (user.role === 'HOSPITAL_ADMIN' && user.hospitalId) {
      whereClause = {
        OR: [
          { hospitalId: user.hospitalId },
          { userId: user.id },
          { email: user.email.toLowerCase() }
        ]
      };
    } else {
      whereClause = {
        OR: [
          { userId: user.id },
          { email: user.email.toLowerCase() }
        ]
      };
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (priorityFilter) {
      whereClause.priority = priorityFilter;
    }

    if (search) {
      const searchConditions = [
        { ticketCode: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { registeredName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];

      if (whereClause.OR) {
        whereClause = {
          AND: [
            { OR: whereClause.OR },
            { OR: searchConditions }
          ]
        };
      } else {
        whereClause.OR = searchConditions;
      }
    }

    let dbIssues: any[] = [];
    try {
      dbIssues = await prisma.supportIssue.findMany({
        where: whereClause,
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
      console.warn('Prisma findMany support issues error, falling back:', err);
    }

    // Merge with in-memory tickets if any
    const globalTickets = getGlobalSupportTickets();
    const map = new Map<string, any>();

    for (const item of dbIssues) {
      map.set(item.id, item);
      if (item.ticketCode) map.set(item.ticketCode, item);
    }

    for (const item of globalTickets) {
      const isOwner = item.userId === user.id || item.email?.toLowerCase() === user.email.toLowerCase();
      const isHospitalOwner = user.role === 'HOSPITAL_ADMIN' && item.hospitalId === user.hospitalId;
      const isSuperAdmin = user.role === 'SUPER_ADMIN';

      if (isSuperAdmin || isHospitalOwner || isOwner) {
        if (!map.has(item.id) && !map.has(item.ticketCode)) {
          map.set(item.id, item);
        }
      }
    }

    let allIssues = Array.from(new Set(map.values()));

    if (statusFilter) {
      allIssues = allIssues.filter(i => i.status === statusFilter);
    }

    if (priorityFilter) {
      allIssues = allIssues.filter(i => i.priority === priorityFilter);
    }

    if (search) {
      allIssues = allIssues.filter(i =>
        (i.ticketCode && i.ticketCode.toLowerCase().includes(search)) ||
        (i.subject && i.subject.toLowerCase().includes(search)) ||
        (i.registeredName && i.registeredName.toLowerCase().includes(search)) ||
        (i.email && i.email.toLowerCase().includes(search)) ||
        (i.description && i.description.toLowerCase().includes(search))
      );
    }

    // Sanitize internal staff notes from regular user visibility
    const sanitizedIssues = allIssues.map(issue => ({
      ...issue,
      messages: (issue.messages || []).filter((m: any) => isStaff || !m.isInternal)
    }));

    sanitizedIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summaryCards = {
      total: sanitizedIssues.length,
      open: sanitizedIssues.filter(i => i.status === 'OPEN').length,
      inProgress: sanitizedIssues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'WAITING_FOR_USER' || i.status === 'WAITING_FOR_SUPPORT').length,
      resolved: sanitizedIssues.filter(i => i.status === 'RESOLVED').length,
      closed: sanitizedIssues.filter(i => i.status === 'CLOSED').length
    };

    return NextResponse.json({
      issues: sanitizedIssues,
      summaryCards
    });
  } catch (err: any) {
    console.error('Error fetching support issues:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from session
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to submit a support ticket.' }, { status: 401 });
    }

    // 2. Fetch ground-truth authenticated record directly from PostgreSQL
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        patientProfile: true,
        hospital: true,
        doctorProfile: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Authenticated account not found in database.' }, { status: 401 });
    }

    // 3. Ground-truth contact resolution (never trust client payload for identity/contacts)
    const registeredName = dbUser.patientProfile?.fullName || dbUser.name || 'Registered User';
    const registeredEmail = dbUser.email.toLowerCase().trim();
    // Resolve mobile: check User.phone or Patient.phone (never hospital switchboard). If none, keep empty (do not invent fake phone numbers!)
    const rawMobile = (dbUser.phone && dbUser.phone.trim()) || 
                      (dbUser.patientProfile?.phone && dbUser.patientProfile.phone.trim()) || 
                      '';
    const registeredMobile = rawMobile ? rawMobile.trim() : '';

    const body = await req.json();
    const {
      issueType,
      category,
      priority,
      subject,
      title,
      description,
      attachmentUrl
    } = body;

    const resolvedCategory = issueType || category || 'TECHNICAL';
    const ticketSubject = (subject || title || '').trim();
    const ticketDesc = (description || '').trim();

    if (!ticketSubject || ticketSubject.length < 3) {
      return NextResponse.json({ error: 'Please enter a descriptive issue subject (at least 3 characters).' }, { status: 400 });
    }

    if (!ticketDesc || ticketDesc.length < 10) {
      return NextResponse.json({ error: 'Please provide detailed description of the issue (at least 10 characters).' }, { status: 400 });
    }

    // Validate optional screenshot/attachments if provided
    let safeAttachment: string | null = null;
    const rawAttachments = body.attachmentUrl || body.attachments;
    if (rawAttachments) {
      const list = Array.isArray(rawAttachments) ? rawAttachments : [rawAttachments];
      for (const item of list) {
        if (typeof item === 'string' && item.trim()) {
          if (item.startsWith('data:image/')) {
            // Enforce max 5MB base64 size
            const approximateBytes = Math.ceil((item.length * 3) / 4);
            if (approximateBytes > 5 * 1024 * 1024) {
              return NextResponse.json({ error: 'Attachment exceeds maximum permitted size of 5 MB.' }, { status: 400 });
            }
            if (!safeAttachment) safeAttachment = item;
          } else if (item.startsWith('/uploads/')) {
            if (!safeAttachment) safeAttachment = item;
          }
        }
      }
    }

    const assignedHospitalId = dbUser.hospitalId || null;
    const ticketPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? priority : 'MEDIUM';
    const ticketCategory = ['TECHNICAL', 'HOSPITAL_ONBOARDING', 'BILLING', 'CLINICAL', 'GENERAL'].includes(resolvedCategory)
      ? resolvedCategory
      : 'TECHNICAL';

    // 4. Concurrency-Safe Transactional Persistence in PostgreSQL
    let dbIssue: any = null;
    let finalToken = '';

    for (let attempt = 0; attempt < 5; attempt++) {
      const generatedCode = await generateUniqueTicketTokenSafe(prisma);
      try {
        dbIssue = await prisma.$transaction(async (tx) => {
          return await tx.supportIssue.create({
            data: {
              ticketCode: generatedCode,
              hospitalId: assignedHospitalId,
              userId: dbUser.id,
              userRole: dbUser.role || 'USER',
              registeredName,
              mobile: registeredMobile || 'Not Provided',
              email: registeredEmail,
              issueType: ticketCategory,
              priority: ticketPriority,
              subject: ticketSubject,
              description: ticketDesc,
              attachmentUrl: safeAttachment,
              status: 'OPEN',
              emailStatus: 'PENDING',
              messages: {
                create: [
                  {
                    senderId: dbUser.id,
                    senderRole: dbUser.role || 'USER',
                    senderName: registeredName,
                    message: ticketDesc,
                    attachmentUrl: safeAttachment,
                    isInternal: false
                  }
                ]
              },
              timelineEvents: {
                create: [
                  {
                    actorId: dbUser.id,
                    actorRole: dbUser.role || 'USER',
                    actorName: registeredName,
                    type: 'CREATED',
                    newStatus: 'OPEN',
                    description: `Ticket created with ${ticketPriority} priority: "${ticketSubject}"`
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
        });

        finalToken = generatedCode;
        break; // Successfully committed transaction
      } catch (txErr: any) {
        if (txErr.code === 'P2002' && txErr.meta?.target?.includes('ticketCode')) {
          // Token collision under concurrent requests, retry with incremented seq
          console.warn(`[CONCURRENCY] Ticket token collision for ${generatedCode}, retrying (attempt ${attempt + 1})...`);
          continue;
        }
        throw txErr;
      }
    }

    if (!dbIssue) {
      return NextResponse.json({ error: 'Failed to generate unique ticket token. Please try again.' }, { status: 500 });
    }

    // Keep global in-memory store synchronized
    addGlobalSupportTicket({
      id: dbIssue.id,
      ticketCode: dbIssue.ticketCode,
      hospitalId: assignedHospitalId,
      userId: dbUser.id,
      userRole: dbUser.role,
      registeredName,
      mobile: registeredMobile || 'Not Provided',
      email: registeredEmail,
      issueType: ticketCategory,
      priority: ticketPriority,
      subject: ticketSubject,
      description: ticketDesc,
      attachmentUrl: safeAttachment,
      status: 'OPEN',
      emailStatus: 'PENDING',
      createdAt: String(dbIssue.createdAt)
    });

    // 5. Audit Logging
    try {
      await createAuditLog({
        hospitalId: assignedHospitalId,
        userId: dbUser.id,
        action: 'SUPPORT_TICKET_CREATED',
        resource: `SupportTicket:${finalToken}`,
        details: { ticketCode: finalToken, subject: ticketSubject, email: registeredEmail, priority: ticketPriority }
      });
    } catch (e) {
      // Non-blocking audit log
    }

    // 6. Automatic Confirmation Email Dispatch via Gmail SMTP
    let emailDispatched = false;
    let emailError: string | null = null;

    try {
      const emailResult = await sendSupportTicketConfirmationEmail({
        toEmail: registeredEmail,
        userName: registeredName,
        ticketCode: finalToken,
        subject: ticketSubject,
        category: ticketCategory,
        description: ticketDesc,
        statusText: 'Open — Awaiting Support Review',
        submittedAt: dbIssue.createdAt,
        expectedResponseHours: 24
      });

      if (emailResult.success) {
        emailDispatched = true;
        await prisma.supportIssue.update({
          where: { id: dbIssue.id },
          data: {
            emailStatus: 'SENT',
            emailSentAt: new Date(),
            emailFailureReason: null
          }
        });
        dbIssue.emailStatus = 'SENT';
        dbIssue.emailSentAt = new Date();
      } else {
        emailError = emailResult.error || 'SMTP delivery rejected';
        await prisma.supportIssue.update({
          where: { id: dbIssue.id },
          data: {
            emailStatus: 'FAILED',
            emailFailureReason: emailError
          }
        });
        dbIssue.emailStatus = 'FAILED';
        dbIssue.emailFailureReason = emailError;
      }
    } catch (emailEx: any) {
      console.error('[SMTP] Confirmation dispatch error:', emailEx);
      emailError = emailEx.message || 'SMTP transmission error';
      await prisma.supportIssue.update({
        where: { id: dbIssue.id },
        data: {
          emailStatus: 'FAILED',
          emailFailureReason: emailError
        }
      });
      dbIssue.emailStatus = 'FAILED';
      dbIssue.emailFailureReason = emailError;
    }

    return NextResponse.json({
      message: `Support Ticket ${finalToken} created successfully!`,
      ticket: dbIssue,
      ticketToken: finalToken,
      emailNotification: {
        sent: emailDispatched,
        status: dbIssue.emailStatus,
        recipient: registeredEmail,
        message: emailDispatched
          ? 'Confirmation email dispatched. Check your inbox and spam folder.'
          : 'Ticket created successfully in database, but confirmation email could not be sent. You can retry from the ticket details page.'
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error('Support ticket creation error:', err);
    return NextResponse.json({ error: err.message || 'Server error occurred while creating support ticket.' }, { status: 500 });
  }
}
