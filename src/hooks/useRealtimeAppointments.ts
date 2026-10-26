'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseRealtimeOptions {
  hospitalId?: string | null;
  onAppointmentBooked?: (payload: any) => void;
  onAppointmentUpdated?: (payload: any) => void;
  onRefreshNeeded?: () => void;
  pollingFallbackMs?: number; // default 8000ms
}

export function useRealtimeAppointments({
  hospitalId,
  onAppointmentBooked,
  onAppointmentUpdated,
  onRefreshNeeded,
  pollingFallbackMs = 8000
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const callbacksRef = useRef({ onAppointmentBooked, onAppointmentUpdated, onRefreshNeeded });
  useEffect(() => {
    callbacksRef.current = { onAppointmentBooked, onAppointmentUpdated, onRefreshNeeded };
  });

  const handleRefresh = useCallback(() => {
    setLastEventTime(new Date());
    if (callbacksRef.current.onRefreshNeeded) {
      callbacksRef.current.onRefreshNeeded();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Establish SSE Connection
    try {
      const sse = new EventSource('/api/events');
      eventSourceRef.current = sse;

      sse.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
      };

      sse.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          // Check hospital isolation if hospitalId is specified
          if (hospitalId && data.hospitalId && data.hospitalId !== hospitalId) {
            return;
          }

          if (data.event === 'APPOINTMENT_BOOKED') {
            if (callbacksRef.current.onAppointmentBooked) {
              callbacksRef.current.onAppointmentBooked(data.payload);
            }
            handleRefresh();
          } else if (data.event === 'APPOINTMENT_UPDATED') {
            if (callbacksRef.current.onAppointmentUpdated) {
              callbacksRef.current.onAppointmentUpdated(data.payload);
            }
            handleRefresh();
          } else if (data.event === 'CONNECTED') {
            setIsConnected(true);
          }
        } catch (e) {
          // parse safe
        }
      };

      sse.onerror = () => {
        if (!isMounted) return;
        setIsConnected(false);
        // Fallback polling will handle updates while SSE reconnects
      };
    } catch (err) {
      console.warn('SSE not supported or failed to initialize, relying on fallback polling.');
    }

    // 2. Intelligent Polling Fallback (ensures freshness even if browser sleeps or SSE closes)
    if (pollingFallbackMs > 0) {
      pollingTimerRef.current = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) {
          // Pause polling when tab is hidden to conserve bandwidth and CPU
          return;
        }
        handleRefresh();
      }, pollingFallbackMs);
    }

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [hospitalId, handleRefresh, pollingFallbackMs]);

  return {
    isConnected,
    lastEventTime
  };
}
