import { prisma } from './prisma';

export interface AuditLogItem {
  id: string;
  hospitalId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  detailsJson?: string | null;
  ipAddress?: string | null;
  timestamp: string | Date;
  user?: { name: string; email: string; role: string } | null;
}

let inMemoryAuditLogs: AuditLogItem[] = [
  {
    id: 'audit-001',
    hospitalId: 'hosp-metro-01',
    userId: 'usr-admin-01',
    action: 'PATIENT_REGISTER_GLOBAL',
    resource: 'Patient:NEXO-PAT-000003 (Yashu)',
    ipAddress: '192.168.1.45',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    user: { name: 'Master Platform Super Admin', email: 'supradmin@nexomedico.ai', role: 'SUPER_ADMIN' }
  },
  {
    id: 'audit-002',
    hospitalId: 'hosp-metro-01',
    userId: 'usr-admin-01',
    action: 'BROADCAST_NOTIFICATION_DISPATCH',
    resource: 'Notification:NOTIF-2026-001 (Global Announcement)',
    ipAddress: '192.168.1.45',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    user: { name: 'Master Platform Super Admin', email: 'supradmin@nexomedico.ai', role: 'SUPER_ADMIN' }
  },
  {
    id: 'audit-003',
    hospitalId: 'hosp-metro-01',
    userId: 'usr-doc-01',
    action: 'PATIENT_EMERGENCY_QR_SCAN',
    resource: 'EmergencyPassport:NEXO-PAT-000002 (John Doe)',
    ipAddress: '10.0.4.12',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: { name: 'Dr. Sarah Jenkins MD', email: 's.jenkins@metrohospital.com', role: 'DOCTOR' }
  },
  {
    id: 'audit-004',
    hospitalId: 'hosp-apollo-02',
    userId: 'usr-doc-02',
    action: 'PRESCRIPTION_ISSUED',
    resource: 'Prescription:RX-90812 (Amoxicillin 500mg)',
    ipAddress: '10.0.8.99',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: { name: 'Dr. Alexander Vance MD', email: 'a.vance@apollocity.com', role: 'DOCTOR' }
  },
  {
    id: 'audit-005',
    hospitalId: 'hosp-metro-01',
    userId: 'usr-admin-01',
    action: 'USER_ACCOUNT_STATUS_TOGGLE',
    resource: 'User:usr-pat-03 (Activated)',
    ipAddress: '192.168.1.45',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    user: { name: 'Master Platform Super Admin', email: 'supradmin@nexomedico.ai', role: 'SUPER_ADMIN' }
  }
];

export function getGlobalAuditLogs(): AuditLogItem[] {
  return inMemoryAuditLogs;
}

export async function createAuditLog({
  hospitalId,
  userId,
  action,
  resource,
  details,
  ipAddress
}: {
  hospitalId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  const newLog: AuditLogItem = {
    id: `audit-${Date.now()}`,
    hospitalId: hospitalId || null,
    userId: userId || null,
    action,
    resource,
    detailsJson: details ? JSON.stringify(details) : null,
    ipAddress: ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
    user: { name: 'Platform Admin', email: 'admin@nexomedico.ai', role: 'SUPER_ADMIN' }
  };

  inMemoryAuditLogs = [newLog, ...inMemoryAuditLogs.slice(0, 99)];

  try {
    await prisma.auditLog.create({
      data: {
        hospitalId: hospitalId || null,
        userId: userId || null,
        action,
        resource,
        detailsJson: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || '127.0.0.1'
      }
    });
  } catch (err: any) {
    console.warn('Prisma Audit Log recording skipped (using in-memory log):', err.message);
  }
}
