'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId: string | null;
  hospitalName?: string | null;
  departmentId?: string | null;
  permissions: string[];
}

interface NotificationItem {
  id: string;
  event: string;
  message: string;
  timestamp: string;
}

interface AuthContextType {
  user: UserContext | null;
  loading: boolean;
  token: string | null;
  login: (token: string, user: UserContext) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<UserContext>, newToken?: string) => void;
  notifications: NotificationItem[];
  clearNotifications: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  notifications: [],
  clearNotifications: () => {},
  hasPermission: () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check saved session in client
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
      if (savedToken) {
        setToken(savedToken);
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setUser(data.user);
            } else {
              logout();
            }
          })
          .catch(() => logout())
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  // Listen to SSE & real-time broadcast notifications
  useEffect(() => {
    if (!user) return;

    // Fetch initial & periodic broadcast notifications
    const syncNotifications = () => {
      const clearedSet = typeof window !== 'undefined'
        ? new Set(JSON.parse(localStorage.getItem('nexo_cleared_notifs') || '[]'))
        : new Set();

      fetch(`/api/admin/broadcast-notifications?role=${user.role}&hospitalId=${user.hospitalId || ''}`)
        .then(res => res.json())
        .then(data => {
          if (data?.notifications && Array.isArray(data.notifications)) {
            const mapped: NotificationItem[] = data.notifications
              .filter((n: any) => !clearedSet.has(n.id))
              .map((n: any) => ({
                id: n.id,
                event: n.title,
                message: `[${n.severity || 'INFO'}] ${n.message} (From: ${n.senderName || 'Platform Admin'})`,
                timestamp: n.timestamp
              }));

            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = mapped.filter(m => !existingIds.has(m.id));
              return [...newItems, ...prev].slice(0, 30);
            });
          }
        })
        .catch(err => console.error('Failed to sync broadcast notifications:', err));
    };

    syncNotifications();
    const interval = setInterval(syncNotifications, 4000);

    try {
      const eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const clearedSet = typeof window !== 'undefined'
            ? new Set(JSON.parse(localStorage.getItem('nexo_cleared_notifs') || '[]'))
            : new Set();

          if (data.event === 'BROADCAST_NOTIFICATION' && data.payload) {
            const n = data.payload;
            const isTargetRole = n.targetRole === 'ALL' || n.targetRole === user.role || user.role === 'SUPER_ADMIN';
            const isTargetHospital = !n.hospitalId || !user.hospitalId || n.hospitalId === user.hospitalId || user.role === 'SUPER_ADMIN';

            if (isTargetRole && isTargetHospital && !clearedSet.has(n.id)) {
              setNotifications(prev => [
                {
                  id: n.id || Math.random().toString(),
                  event: n.title || 'Broadcast Notification',
                  message: `[${n.severity || 'INFO'}] ${n.message} (From: ${n.senderName || 'Platform Admin'})`,
                  timestamp: n.timestamp || new Date().toISOString()
                },
                ...prev.filter(item => item.id !== n.id).slice(0, 29)
              ]);
            }
          } else if (data.event !== 'CONNECTED') {
            if (!data.hospitalId || data.hospitalId === user.hospitalId) {
              setNotifications(prev => [
                {
                  id: Math.random().toString(),
                  event: data.event,
                  message: getEventMessage(data.event, data.payload),
                  timestamp: data.timestamp || new Date().toISOString()
                },
                ...prev.slice(0, 29)
              ]);
            }
          }
        } catch (err) {
          console.error('SSE JSON error:', err);
        }
      };

      return () => {
        clearInterval(interval);
        eventSource.close();
      };
    } catch (e) {
      return () => clearInterval(interval);
    }
  }, [user]);

  const clearNotifications = () => {
    if (typeof window !== 'undefined') {
      try {
        const currentIds = notifications.map(n => n.id);
        const existing: string[] = JSON.parse(localStorage.getItem('nexo_cleared_notifs') || '[]');
        const updated = Array.from(new Set([...existing, ...currentIds]));
        localStorage.setItem('nexo_cleared_notifs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setNotifications([]);
  };

  const login = (newToken: string, newUser: UserContext) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexo_jwt', newToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexo_jwt');
    }
    setToken(null);
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const updateUser = (updatedData: Partial<UserContext>, newToken?: string) => {
    if (newToken && typeof window !== 'undefined') {
      localStorage.setItem('nexo_jwt', newToken);
      setToken(newToken);
    }
    setUser(prev => (prev ? { ...prev, ...updatedData } : null));
  };

  const hasPermission = (code: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'HOSPITAL_ADMIN') return true;
    return user.permissions.includes('*') || user.permissions.includes(code);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, updateUser, notifications, clearNotifications, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

function getEventMessage(event: string, payload: any): string {
  switch (event) {
    case 'APPOINTMENT_BOOKED':
      return `New Appointment booked for ${payload?.patient?.fullName || 'Patient'}`;
    case 'PRESCRIPTION_ISSUED':
      return `New Prescription issued #${payload?.prescriptionCode}`;
    case 'PRESCRIPTION_DISPENSED':
      return `Prescription #${payload?.prescriptionCode} dispensed by pharmacy`;
    case 'LAB_ORDER_CREATED':
      return `New Lab Order #${payload?.orderCode} requested for ${payload?.testName}`;
    case 'LAB_REPORT_READY':
      return `Laboratory Report ready for ${payload?.order?.testName}`;
    case 'PATIENT_ADMITTED':
      return `Inpatient Admitted: ${payload?.patient?.fullName} in Bed ${payload?.bed?.bedNumber || 'N/A'}`;
    case 'PATIENT_DISCHARGED':
      return `Inpatient Discharged: ${payload?.admission?.patient?.fullName}`;
    default:
      return `System Event: ${event}`;
  }
}
