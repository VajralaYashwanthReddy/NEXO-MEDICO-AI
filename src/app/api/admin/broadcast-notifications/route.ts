import { NextRequest, NextResponse } from 'next/server';
import { eventBroadcaster } from '@/lib/events';

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ANNOUNCEMENT';
  targetRole: 'ALL' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECH' | 'PATIENT';
  senderName: string;
  hospitalId?: string;
  timestamp: string;
}

// Global in-memory broadcast store initialized with realistic system notifications
let broadcastNotificationsStore: BroadcastNotification[] = [
  {
    id: 'NOTIF-2026-001',
    title: 'Platform System Upgrade Completed',
    message: 'Nexo Medico AI v2.4 Universal Healthcare Intelligence suite is live across all hospital departments.',
    severity: 'ANNOUNCEMENT',
    targetRole: 'ALL',
    senderName: 'Platform Super Admin',
    timestamp: new Date().toISOString()
  },
  {
    id: 'NOTIF-2026-002',
    title: '2FA & Profile Management Active',
    message: 'All healthcare providers and patients can now update profile details and change passwords directly in the top-right menu.',
    severity: 'INFO',
    targetRole: 'ALL',
    senderName: 'Platform System Operations',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role') || 'ALL';
  const hospitalId = req.nextUrl.searchParams.get('hospitalId');

  // Filter notifications relevant to target role & hospital
  const filtered = broadcastNotificationsStore.filter(n => {
    const roleMatches = n.targetRole === 'ALL' || n.targetRole === role;
    const hospitalMatches = !n.hospitalId || !hospitalId || n.hospitalId === hospitalId;
    return roleMatches && hospitalMatches;
  });

  return NextResponse.json({
    success: true,
    notifications: filtered
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, severity, targetRole, senderName, hospitalId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and Message are required' }, { status: 400 });
    }

    const newNotification: BroadcastNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      message: message.trim(),
      severity: severity || 'ANNOUNCEMENT',
      targetRole: targetRole || 'ALL',
      senderName: senderName || 'Platform Administrator',
      hospitalId: hospitalId || undefined,
      timestamp: new Date().toISOString()
    };

    // Prepend to central store
    broadcastNotificationsStore = [newNotification, ...broadcastNotificationsStore.slice(0, 49)];

    // Broadcast SSE live event to active clients
    eventBroadcaster.broadcast('BROADCAST_NOTIFICATION', newNotification, hospitalId);

    return NextResponse.json({
      success: true,
      notification: newNotification,
      notifications: broadcastNotificationsStore
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Broadcast notification API error' }, { status: 500 });
  }
}
