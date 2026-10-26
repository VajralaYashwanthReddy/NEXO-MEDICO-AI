import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getRuntimeDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not defined. Please configure DATABASE_URL in your .env file or deployment environment settings.'
    );
  }

  try {
    const url = new URL(rawUrl);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isLocal) {
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '30');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30');
      }
    } else {
      // Local PostgreSQL typically runs without SSL requirement
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'disable');
      }
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
    datasources: {
      db: {
        url: runtimeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
