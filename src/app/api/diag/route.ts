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
    passwordInfo: {
      dbUrlPassLength: rawDbUrl ? (rawDbUrl.match(/:([^@]+)@/)?.[1]?.length || 0) : 0,
      matchesKnownSecret: rawDbUrl?.includes('npg_3brQoIn5sYwT'),
      directPassLength: rawDirectUrl ? (rawDirectUrl.match(/:([^@]+)@/)?.[1]?.length || 0) : 0,
    },
    tcpPooler: await testTcp(poolerHost, 5432),
    tcpDirect: await testTcp(directHost, 5432),
    prismaTests: {}
  };

  const knownGoodUrl = 'postgresql://neondb_owner:npg_3brQoIn5sYwT@ep-weathered-shadow-aemn0usb-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

  // Test 4a: pg.Client with Vercel's process.env.DATABASE_URL
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: rawDbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    const t0 = Date.now();
    await client.connect();
    const pgRes = await client.query('SELECT count(*) as count FROM "Hospital"');
    await client.end();
    results.pgTestEnv = { ok: true, count: pgRes.rows[0]?.count, timeMs: Date.now() - t0 };
  } catch (pgErr: any) {
    results.pgTestEnv = { ok: false, error: pgErr.message, code: pgErr.code };
  }

  // Test 4b: pg.Client with known good credentials
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: knownGoodUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    const t0 = Date.now();
    await client.connect();
    const pgRes = await client.query('SELECT count(*) as count FROM "Hospital"');
    await client.end();
    results.pgTestKnownGood = { ok: true, count: pgRes.rows[0]?.count, timeMs: Date.now() - t0 };
  } catch (pgErr: any) {
    results.pgTestKnownGood = { ok: false, error: pgErr.message, code: pgErr.code };
  }

  // Test 4c: Prisma with known good credentials
  try {
    const p = new (require('@prisma/client').PrismaClient)({
      datasources: { db: { url: knownGoodUrl + '&connect_timeout=15' } }
    });
    const c = await p.hospital.count();
    results.prismaKnownGood = { ok: true, count: c };
    await p.$disconnect();
  } catch (e: any) {
    results.prismaKnownGood = { ok: false, error: e.message };
  }

  // Test 4d: prisma shared instance from @/lib/prisma
  try {
    const c = await prisma.hospital.count();
    results.prismaShared = { ok: true, count: c };
  } catch (e: any) {
    results.prismaShared = { ok: false, error: e.message };
  }

  return NextResponse.json(results);
}
