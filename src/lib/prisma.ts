import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getRuntimeDatabaseUrl(): string | undefined {
  // Always prioritize the pooled DATABASE_URL for runtime / serverless execution
  const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    // Ensure sslmode is require for Neon
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    // Allow up to 30s for Neon serverless compute wake-up
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '30');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '30');
    }
    if (url.hostname.includes('-pooler') && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }
    return url.toString();
  } catch {
    let u = rawUrl;
    if (!u.includes('connect_timeout=')) {
      u += (u.includes('?') ? '&' : '?') + 'connect_timeout=30';
    }
    if (!u.includes('pool_timeout=')) {
      u += '&pool_timeout=30';
    }
    if (u.includes('-pooler') && !u.includes('pgbouncer=')) {
      u += '&pgbouncer=true';
    }
    return u;
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

