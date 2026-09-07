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

  // Listen to SSE live notifications
  useEffect(() => {
    if (!user) return;

    try {
      const eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event !== 'CONNECTED') {
            if (!data.hospitalId || data.hospitalId === user.hospitalId) {
              setNotifications(prev => [
                {
                  id: Math.random().toString(),
                  event: data.event,
                  message: getEventMessage(data.event, data.payload),
                  timestamp: data.timestamp || new Date().toISOString()
                },
                ...prev.slice(0, 19)
              ]);
            }
          }
        } catch (err) {
          console.error('SSE JSON error:', err);
        }
      };

      return () => {
        eventSource.close();
      };
    } catch (e) {
      console.error('EventSource failed:', e);
    }
  }, [user]);

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
    <AuthContext.Provider value={{ user, loading, token, login, logout, updateUser, notifications, hasPermission }}>
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
