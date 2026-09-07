export interface SupportTicket {
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
  adminResponse?: string | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  hospital?: { id: string; name: string; city: string } | null;
}

const defaultTickets: SupportTicket[] = [
  {
    id: 'ticket-sup-default-01',
    ticketCode: 'TICKET-2026-0001',
    hospitalId: 'hosp-metro-01',
    registeredName: 'Dr. Sarah Jenkins',
    mobile: '+1 (555) 234-5678',
    email: 'sarah.jenkins@metrohospital.com',
    issueType: 'LOGIN_ISSUE',
    subject: 'Unable to access ICU bed allocation module after system update',
    description: 'Received 403 authorization error when opening ICU ward management page.',
    attachmentUrl: null,
    status: 'OPEN',
    adminResponse: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis' }
  },
  {
    id: 'ticket-sup-default-02',
    ticketCode: 'TICKET-2026-0002',
    hospitalId: 'hosp-apollo-02',
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
    hospital: { id: 'hosp-apollo-02', name: 'Apollo City Hospital', city: 'Metropolis' }
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
  const ts = Date.now().toString().slice(-4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  const candidate = `TICKET-2026-${ts}-${rand}`;
  return candidate;
}

export function addGlobalSupportTicket(ticket: Partial<SupportTicket>): SupportTicket {
  let ticketCode = ticket.ticketCode;
  const store = globalForSupport.globalSupportStore;

  // If no ticket code provided or if ticket code collides with existing ticket, auto generate a unique candidate
  if (!ticketCode || store.some(t => t.ticketCode === ticketCode)) {
    ticketCode = generateUniqueTicketCode();
  }

  const id = ticket.id || `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newTicket: SupportTicket = {
    id,
    ticketCode,
    hospitalId: ticket.hospitalId || null,
    registeredName: ticket.registeredName || 'Registered User',
    mobile: ticket.mobile || '+1 (555) 000-0000',
    email: (ticket.email || 'user@nexomedico.ai').toLowerCase().trim(),
    issueType: ticket.issueType || 'TECHNICAL',
    subject: ticket.subject || 'Platform Support Request',
    description: ticket.description || 'Support ticket submitted.',
    attachmentUrl: ticket.attachmentUrl || null,
    status: ticket.status || 'OPEN',
    adminResponse: ticket.adminResponse || null,
    createdAt: ticket.createdAt ? String(ticket.createdAt) : new Date().toISOString(),
    hospital: ticket.hospital || null
  };

  const existingIdx = store.findIndex(t => t.id === newTicket.id);
  if (existingIdx >= 0) {
    store[existingIdx] = newTicket;
  } else {
    store.unshift(newTicket);
  }

  return newTicket;
}

export function updateGlobalSupportTicket(ticketId: string, status: string, adminResponse?: string): SupportTicket | null {
  const ticket = globalForSupport.globalSupportStore.find(t => t.id === ticketId || t.ticketCode === ticketId);
  if (ticket) {
    ticket.status = status;
    if (adminResponse !== undefined) {
      ticket.adminResponse = adminResponse;
    }
    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.resolvedAt = new Date().toISOString();
    }
    ticket.updatedAt = new Date().toISOString();
    return ticket;
  }
  return null;
}
