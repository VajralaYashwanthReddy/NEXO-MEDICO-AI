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

export async function GET(req: NextRequest) {
  const poolerHost = 'ep-weathered-shadow-aemn0usb-pooler.c-2.us-east-2.aws.neon.tech';
  const directHost = 'ep-weathered-shadow-aemn0usb.c-2.us-east-2.aws.neon.tech';

  const results: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
    }
  };

  // 1. DNS Lookup default
  try {
    const dnsDefault = await dns.promises.lookup(poolerHost, { all: true });
    results.dnsDefault = dnsDefault;
  } catch (err: any) {
    results.dnsDefault = { error: err.message };
  }

  // 2. TCP test with default host
  results.tcpDefault = await testTcp(poolerHost, 5432);

  // 3. Try with ipv4first
  try {
    dns.setDefaultResultOrder('ipv4first');
    const dnsIpv4 = await dns.promises.lookup(poolerHost, { all: true });
    results.dnsIpv4First = dnsIpv4;
    results.tcpIpv4First = await testTcp(poolerHost, 5432);
  } catch (err: any) {
    results.ipv4FirstError = err.message;
  }

  // 4. Test direct host
  results.tcpDirect = await testTcp(directHost, 5432);

  // 5. Test Prisma query
  try {
    const t0 = Date.now();
    const hospCount = await prisma.hospital.count();
    results.prismaQuery = { ok: true, hospCount, timeMs: Date.now() - t0 };
  } catch (prismaErr: any) {
    results.prismaQuery = { ok: false, error: prismaErr.message, code: prismaErr.code };
  }

  return NextResponse.json(results);
}
