export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId?: string | null;
  senderRole: string;
  senderName: string;
  message: string;
  attachmentUrl?: string | null;
  isInternal?: boolean;
  createdAt: string;
}

export interface SupportTicketTimelineEvent {
  id: string;
  ticketId: string;
  actorId?: string | null;
  actorRole: string;
  actorName: string;
  type: string; // CREATED, STATUS_CHANGED, MESSAGE_POSTED, ASSIGNED, REOPENED, CLOSED
  oldStatus?: string | null;
  newStatus?: string | null;
  description: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. NMX-TKT-2026-000123
  hospitalId: string | null;
  userId?: string | null;
  userRole?: string | null;
  registeredName: string;
  mobile: string;
  email: string;
  issueType: string; // TECHNICAL, HOSPITAL_ONBOARDING, BILLING, GENERAL, CLINICAL
  priority: string; // LOW, MEDIUM, HIGH, URGENT
  subject: string;
  description: string;
  attachmentUrl: string | null;
  status: string; // OPEN, IN_PROGRESS, WAITING_FOR_USER, WAITING_FOR_SUPPORT, RESOLVED, CLOSED
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  adminResponse?: string | null;
  emailStatus?: string | null;
  emailSentAt?: string | null;
  emailFailureReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  hospital?: { id: string; name: string; city: string } | null;
  messages?: SupportTicketMessage[];
  timelineEvents?: SupportTicketTimelineEvent[];
}

const defaultTickets: SupportTicket[] = [
  {
    id: 'ticket-sup-default-01',
    ticketCode: 'NMX-TKT-2026-000001',
    hospitalId: 'hosp-metro-01',
    userRole: 'DOCTOR',
    priority: 'HIGH',
    registeredName: 'Dr. Sarah Jenkins',
    mobile: '+1 (555) 234-5678',
    email: 'sarah.jenkins@metrohospital.com',
    issueType: 'TECHNICAL',
    subject: 'Unable to access ICU bed allocation module after system update',
    description: 'Received 403 authorization error when opening ICU ward management page.',
    attachmentUrl: null,
    status: 'OPEN',
    adminResponse: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis' },
    messages: [
      {
        id: 'msg-def-01',
        ticketId: 'ticket-sup-default-01',
        senderRole: 'DOCTOR',
        senderName: 'Dr. Sarah Jenkins',
        message: 'Initial report: 403 authorization error prevents bed reassignment.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    timelineEvents: [
      {
        id: 'evt-def-01',
        ticketId: 'ticket-sup-default-01',
        actorRole: 'DOCTOR',
        actorName: 'Dr. Sarah Jenkins',
        type: 'CREATED',
        newStatus: 'OPEN',
        description: 'Ticket created with priority HIGH',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]
  },
  {
    id: 'ticket-sup-default-02',
    ticketCode: 'NMX-TKT-2026-000002',
    hospitalId: 'hosp-apollo-02',
    userRole: 'HOSPITAL_ADMIN',
    priority: 'MEDIUM',
    registeredName: 'James Wilson',
    mobile: '+1 (555) 123-4567',
    email: 'jwilson@apollocity.com',
    issueType: 'TECHNICAL',
    subject: 'Lab test results sync delay with AI Diagnostic Assistant',
    description: 'CBC reports uploaded via PDF parser are taking over 2 minutes to populate in patient chart.',
    attachmentUrl: null,
    status: 'IN_PROGRESS',
    adminResponse: 'Engineering team is optimizing the PDF OCR parsing queue.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    hospital: { id: 'hosp-apollo-02', name: 'Apollo City Hospital', city: 'Metropolis' },
    messages: [
      {
        id: 'msg-def-02',
        ticketId: 'ticket-sup-default-02',
        senderRole: 'HOSPITAL_ADMIN',
        senderName: 'James Wilson',
        message: 'CBC reports are queued for several minutes.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'msg-def-03',
        ticketId: 'ticket-sup-default-02',
        senderRole: 'SUPER_ADMIN',
        senderName: 'Platform Support Team',
        message: 'Engineering team is optimizing the PDF OCR parsing queue.',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ],
    timelineEvents: [
      {
        id: 'evt-def-02',
        ticketId: 'ticket-sup-default-02',
        actorRole: 'HOSPITAL_ADMIN',
        actorName: 'James Wilson',
        type: 'CREATED',
        newStatus: 'OPEN',
        description: 'Ticket created',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'evt-def-03',
        ticketId: 'ticket-sup-default-02',
        actorRole: 'SUPER_ADMIN',
        actorName: 'Platform Support Team',
        type: 'STATUS_CHANGED',
        oldStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        description: 'Status changed from OPEN to IN_PROGRESS',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]
  }
];

const globalForSupport = globalThis as unknown as { globalSupportStore: SupportTicket[] };

if (!globalForSupport.globalSupportStore) {
  globalForSupport.globalSupportStore = [...defaultTickets];
}

export function getGlobalSupportTickets(): SupportTicket[] {
  return globalForSupport.globalSupportStore;
}

export function generateUniqueTicketCode(): string {
  const year = new Date().getFullYear();
  const store = getGlobalSupportTickets();
  let maxNum = 0;
  for (const item of store) {
    const match = item.ticketCode?.match(new RegExp(`^NMX-TKT-${year}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const nextSeq = maxNum + 1;
  return `NMX-TKT-${year}-${String(nextSeq).padStart(6, '0')}`;
}

export async function generateUniqueTicketToken(prismaClient?: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `NMX-TKT-${year}-`;
  try {
    if (prismaClient) {
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
      const store = getGlobalSupportTickets();
      for (const item of store) {
        const match = item.ticketCode?.match(new RegExp(`^NMX-TKT-${year}-(\\d+)$`));
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      const nextSeq = maxNum + 1;
      return `${prefix}${String(nextSeq).padStart(6, '0')}`;
    }
  } catch (err) {
    console.warn('Prisma token generation lookup failed, falling back:', err);
  }
  return generateUniqueTicketCode();
}

export function addGlobalSupportTicket(ticket: Partial<SupportTicket>): SupportTicket {
  let ticketCode = ticket.ticketCode;
  const store = globalForSupport.globalSupportStore;

  if (!ticketCode || store.some(t => t.ticketCode === ticketCode)) {
    ticketCode = generateUniqueTicketCode();
  }

  const id = ticket.id || `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newTicket: SupportTicket = {
    id,
    ticketCode,
    hospitalId: ticket.hospitalId || null,
    userId: ticket.userId || null,
    userRole: ticket.userRole || 'USER',
    registeredName: ticket.registeredName || 'Registered User',
    mobile: ticket.mobile || '',
    email: (ticket.email || 'user@nexomedico.ai').toLowerCase().trim(),
    issueType: ticket.issueType || 'TECHNICAL',
    priority: ticket.priority || 'MEDIUM',
    subject: ticket.subject || 'Platform Support Request',
    description: ticket.description || 'Support ticket submitted.',
    attachmentUrl: ticket.attachmentUrl || null,
    status: ticket.status || 'OPEN',
    assignedToId: ticket.assignedToId || null,
    adminResponse: ticket.adminResponse || null,
    createdAt: ticket.createdAt ? String(ticket.createdAt) : new Date().toISOString(),
    updatedAt: ticket.updatedAt || new Date().toISOString(),
    resolvedAt: ticket.resolvedAt || null,
    closedAt: ticket.closedAt || null,
    hospital: ticket.hospital || null,
    messages: ticket.messages || [],
    timelineEvents: ticket.timelineEvents || [
      {
        id: `evt-${Date.now()}`,
        ticketId: id,
        actorRole: ticket.userRole || 'USER',
        actorName: ticket.registeredName || 'User',
        type: 'CREATED',
        newStatus: 'OPEN',
        description: `Ticket created with ${ticket.priority || 'MEDIUM'} priority`,
        createdAt: new Date().toISOString()
      }
    ]
  };

  const existingIdx = store.findIndex(t => t.id === newTicket.id);
  if (existingIdx >= 0) {
    store[existingIdx] = newTicket;
  } else {
    store.unshift(newTicket);
  }

  return newTicket;
}

export function updateGlobalSupportTicket(
  ticketId: string,
  status: string,
  adminResponse?: string,
  actor?: { name: string; role: string; id?: string }
): SupportTicket | null {
  const ticket = globalForSupport.globalSupportStore.find(t => t.id === ticketId || t.ticketCode === ticketId);
  if (ticket) {
    const oldStatus = ticket.status;
    ticket.status = status;
    if (adminResponse !== undefined) {
      ticket.adminResponse = adminResponse;
    }
    if (status === 'RESOLVED') {
      ticket.resolvedAt = new Date().toISOString();
    } else if (status === 'CLOSED') {
      ticket.closedAt = new Date().toISOString();
      if (!ticket.resolvedAt) ticket.resolvedAt = new Date().toISOString();
    } else if (status === 'OPEN' || status === 'IN_PROGRESS') {
      ticket.closedAt = null;
    }
    ticket.updatedAt = new Date().toISOString();

    if (!ticket.timelineEvents) ticket.timelineEvents = [];
    ticket.timelineEvents.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ticketId: ticket.id,
      actorId: actor?.id || null,
      actorRole: actor?.role || 'SUPER_ADMIN',
      actorName: actor?.name || 'Platform Administrator',
      type: status === 'CLOSED' ? 'CLOSED' : (oldStatus === 'CLOSED' ? 'REOPENED' : 'STATUS_CHANGED'),
      oldStatus,
      newStatus: status,
      description: status === 'CLOSED'
        ? `Ticket closed by ${actor?.name || 'Administrator'}`
        : (oldStatus === 'CLOSED' ? `Ticket reopened by ${actor?.name || 'Administrator'}` : `Status changed from ${oldStatus} to ${status}`),
      createdAt: new Date().toISOString()
    });

    return ticket;
  }
  return null;
}

export function addGlobalSupportMessage(
  ticketId: string,
  sender: { id?: string | null; name: string; role: string },
  message: string,
  attachmentUrl?: string | null,
  isInternal?: boolean
): SupportTicketMessage | null {
  const ticket = globalForSupport.globalSupportStore.find(t => t.id === ticketId || t.ticketCode === ticketId);
  if (!ticket) return null;

  // CLOSED lockdown check
  if (ticket.status === 'CLOSED') {
    throw new Error('This ticket is closed. Messaging and tracking updates are no longer available.');
  }

  const newMsg: SupportTicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketId: ticket.id,
    senderId: sender.id || null,
    senderRole: sender.role,
    senderName: sender.name,
    message,
    attachmentUrl: attachmentUrl || null,
    isInternal: !!isInternal,
    createdAt: new Date().toISOString()
  };

  if (!ticket.messages) ticket.messages = [];
  ticket.messages.push(newMsg);

  if (!ticket.timelineEvents) ticket.timelineEvents = [];
  ticket.timelineEvents.push({
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    ticketId: ticket.id,
    actorId: sender.id || null,
    actorRole: sender.role,
    actorName: sender.name,
    type: 'MESSAGE_POSTED',
    description: `New message from ${sender.name} (${sender.role})`,
    createdAt: new Date().toISOString()
  });

  ticket.updatedAt = new Date().toISOString();
  return newMsg;
}
