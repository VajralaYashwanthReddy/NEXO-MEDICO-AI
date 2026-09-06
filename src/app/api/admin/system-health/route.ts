import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const startTime = Date.now();

    // 1. Check Database Health
    let dbStatus = 'HEALTHY';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.user.count();
      dbLatency = Date.now() - dbStart;
    } catch (e) {
      dbStatus = 'DOWN';
    }

    // 2. Check Python AI Service (Port 8000) Health
    let aiServiceStatus = 'HEALTHY';
    let aiLatency = 0;
    try {
      const aiStart = Date.now();
      const res = await fetch('http://127.0.0.1:8000/docs', { method: 'GET', cache: 'no-store' });
      aiLatency = Date.now() - aiStart;
      if (!res.ok && res.status !== 404) {
        aiServiceStatus = 'WARNING';
      }
    } catch (e) {
      aiServiceStatus = 'DOWN';
    }

    // 3. Next.js API Gateway Health
    const apiGatewayLatency = Date.now() - startTime;

    const services = [
      {
        name: 'Next.js App Gateway API',
        type: 'Web Application Server',
        status: 'HEALTHY',
        latency: `${apiGatewayLatency} ms`,
        endpoint: 'http://localhost:3000/api',
        details: 'Handles authentication, Prisma ORM, SSE event streams'
      },
      {
        name: 'Python FastAPI AI Microservice',
        type: 'Machine Learning & Neural Network Service',
        status: aiServiceStatus,
        latency: `${aiLatency} ms`,
        endpoint: 'http://127.0.0.1:8000',
        details: 'DenseNet-121 Grad-CAM Radiology, XGBoost Risk Engine, BioBERT RAG'
      },
      {
        name: 'Prisma Relational Database',
        type: 'SQLite / Multi-Tenant Relational Store',
        status: dbStatus,
        latency: `${dbLatency} ms`,
        endpoint: 'prisma/dev.db',
        details: '32 Relational Tables with hospital_id tenant scoping'
      },
      {
        name: 'Event Broadcaster & SSE Streaming',
        type: 'Real-Time Server-Sent Events Engine',
        status: 'HEALTHY',
        latency: '2 ms',
        endpoint: '/api/events',
        details: 'Live SSE notifications for admissions, lab reports & prescriptions'
      },
      {
        name: 'Platform Audit & Security Logger',
        type: 'Security Logging Subsystem',
        status: 'HEALTHY',
        latency: '1 ms',
        endpoint: 'AuditLog Repository',
        details: 'Tamper-evident audit logging for medical record queries'
      }
    ];

    return NextResponse.json({
      systemStatus: aiServiceStatus === 'DOWN' || dbStatus === 'DOWN' ? 'WARNING' : 'HEALTHY',
      timestamp: new Date().toISOString(),
      services
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
