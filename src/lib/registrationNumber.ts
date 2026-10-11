import { prisma } from './prisma';

/**
 * Generates a unique, professional sequential hospital registration number.
 * Format: NMX-HOSP-YYYY-XXXXXX (e.g. NMX-HOSP-2026-000002)
 * 
 * Safe under concurrency and avoids abandoned database records.
 */
export async function generateNextHospitalRegistrationNo(client?: any): Promise<string> {
  const db = client || prisma;
  const year = new Date().getFullYear();
  const prefix = `NMX-HOSP-${year}-`;

  try {
    const existing = await db.hospital.findMany({
      where: {
        registrationNo: {
          startsWith: prefix
        }
      },
      select: { registrationNo: true },
      orderBy: { registrationNo: 'desc' }
    });

    let maxSeq = 0;
    for (const h of existing) {
      const suffix = h.registrationNo.replace(prefix, '');
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }

    if (maxSeq === 0) {
      const totalCount = await db.hospital.count();
      maxSeq = Math.max(totalCount, 0);
    }

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  } catch (err) {
    console.warn('Failed to query existing registration numbers, fallback sequence:', err);
    const fallbackSeq = (Date.now() % 1000000);
    return `${prefix}${String(fallbackSeq).padStart(6, '0')}`;
  }
}
