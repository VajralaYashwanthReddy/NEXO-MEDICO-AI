import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import net from 'net';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function testTcp(host: string, port: number, timeout = 4000): Promise<{ ok: boolean; timeMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const timeMs = Date.now() - start;
      socket.destroy();
      resolve({ ok: true, timeMs });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, timeMs: Date.now() - start, error: 'Socket timeout' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ ok: false, timeMs: Date.now() - start, error: err.message });
    });
  });
}

function maskUrl(u?: string) {
  if (!u) return undefined;
  return u.replace(/:[^:@]+@/, ':***@');
}

export async function GET(req: NextRequest) {
  const poolerHost = 'ep-weathered-shadow-aemn0usb-pooler.c-2.us-east-2.aws.neon.tech';
  const directHost = 'ep-weathered-shadow-aemn0usb.c-2.us-east-2.aws.neon.tech';

  const rawDbUrl = process.env.DATABASE_URL;
  const rawDirectUrl = process.env.DIRECT_URL;

  const results: any = {
    commitVersion: 'v2-adapter',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    maskedUrls: {
      DATABASE_URL: maskUrl(rawDbUrl),
      DIRECT_URL: maskUrl(rawDirectUrl),
    },
    tcpPooler: await testTcp(poolerHost, 5432),
    tcpDirect: await testTcp(directHost, 5432),
    prismaTests: {}
  };

  // Test 1: Prisma with raw DIRECT_URL (Direct Compute)
  if (rawDirectUrl) {
    const p = new (require('@prisma/client').PrismaClient)({
      datasources: { db: { url: rawDirectUrl + (rawDirectUrl.includes('?') ? '&' : '?') + 'connect_timeout=15' } }
    });
    try {
      const c = await p.hospital.count();
      results.prismaTests.directUrl = { ok: true, count: c };
    } catch (e: any) {
      results.prismaTests.directUrl = { ok: false, error: e.message };
    } finally {
      await p.$disconnect();
    }
  }

  // Test 2: Prisma with raw DATABASE_URL (Pooler)
  if (rawDbUrl) {
    const p = new (require('@prisma/client').PrismaClient)({
      datasources: { db: { url: rawDbUrl + (rawDbUrl.includes('?') ? '&' : '?') + 'connect_timeout=15' } }
    });
    try {
      const c = await p.hospital.count();
      results.prismaTests.poolerRaw = { ok: true, count: c };
    } catch (e: any) {
      results.prismaTests.poolerRaw = { ok: false, error: e.message };
    } finally {
      await p.$disconnect();
    }
  }

  // Test 3: Existing prisma instance from @/lib/prisma
  try {
    const c = await prisma.hospital.count();
    results.prismaTests.sharedPrisma = { ok: true, count: c };
  } catch (e: any) {
    results.prismaTests.sharedPrisma = { ok: false, error: e.message };
  }

  return NextResponse.json(results);
}
