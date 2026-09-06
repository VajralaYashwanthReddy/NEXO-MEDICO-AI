import { prisma } from './prisma';

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
  } catch (err) {
    console.error('Audit Log recording failed:', err);
  }
}
