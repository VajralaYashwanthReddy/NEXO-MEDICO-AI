import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const KNOWN_ACTIVE_NEON_PASSWORD = 'npg_3brQoIn5sYwT';
const DEFAULT_DATABASE_URL = `postgresql://neondb_owner:${KNOWN_ACTIVE_NEON_PASSWORD}@ep-weathered-shadow-aemn0usb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30`;

function getRuntimeDatabaseUrl(): string {
  let rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!rawUrl) return DEFAULT_DATABASE_URL;

  // If Vercel environment has a stale/invalid password for this Neon database, ensure active credentials
  if (rawUrl.includes('ep-weathered-shadow-aemn0usb') && !rawUrl.includes(KNOWN_ACTIVE_NEON_PASSWORD)) {
    rawUrl = rawUrl.replace(/neondb_owner:[^@]+@/, `neondb_owner:${KNOWN_ACTIVE_NEON_PASSWORD}@`);
  }

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '30');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '30');
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const runtimeDbUrl = getRuntimeDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: runtimeDbUrl
      ? {
          db: {
            url: runtimeDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


