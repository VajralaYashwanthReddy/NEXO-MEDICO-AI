'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  User,
  Activity,
  AlertCircle,
  Settings,
  Sparkles,
  Phone,
  Video,
  MapPin,
  CalendarDays,
  ListFilter,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  FileText,
  Pill,
  Printer,
  Eye,
  UserX
} from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'agenda' | 'day' | 'week' | 'month' | 'settings';
type DatePreset = 'TODAY' | 'TOMORROW' | 'NEXT_7_DAYS' | 'CUSTOM';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY');

  // Selected date anchor (defaults to today's YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Action Modals State
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<'reschedule' | 'cancel' | 'no_show' | 'summary' | 'follow_up' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Follow-up Booking Modal State
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [followUpSlot, setFollowUpSlot] = useState('10:00 AM');
  const [followUpReason, setFollowUpReason] = useState('');

  // Doctor Schedule Config State (for Settings tab)
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Fetch appointments for this doctor
  const fetchAppointments = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error('Failed to fetch doctor appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch doctor schedule config
  const fetchScheduleConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/schedule');
      const data = await res.json();
      if (res.ok) {
        setScheduleConfig(data.schedule);
      }
    } catch (e) {
      console.error('Failed to fetch schedule config:', e);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchScheduleConfig();
  }, [fetchAppointments, fetchScheduleConfig]);

  // Real-time synchronization
  const { isConnected, lastEventTime } = useRealtimeAppointments({
    hospitalId: user?.hospitalId,
    onRefreshNeeded: fetchAppointments
  });

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const newStr = d.toISOString().split('T')[0];
    setSelectedDate(newStr);
    setDatePreset(newStr === todayStr ? 'TODAY' : newStr === tomorrowStr ? 'TOMORROW' : 'CUSTOM');
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const newStr = d.toISOString().split('T')[0];
    setSelectedDate(newStr);
    setDatePreset(newStr === todayStr ? 'TODAY' : newStr === tomorrowStr ? 'TOMORROW' : 'CUSTOM');
  };

  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'TODAY') {
      setSelectedDate(todayStr);
    } else if (preset === 'TOMORROW') {
      setSelectedDate(tomorrowStr);
    } else if (preset === 'NEXT_7_DAYS') {
      setSelectedDate(todayStr);
    }
  };

  // Status Action Handler
  const handleTransition = async (aptId: string, action: string, note?: string) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update appointment');
      setFeedbackMsg({ type: 'success', text: `Appointment ${action} successfully` });
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Load available slots when rescheduling
  const loadRescheduleSlots = async (date: string) => {
    if (!date || !selectedAppointment) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?doctorId=${selectedAppointment.doctorId}&date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableRescheduleSlots((data.slots || []).filter((s: any) => s.available));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleExecuteReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTimeSlot) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          newDate: rescheduleDate,
          newTimeSlot: rescheduleTimeSlot,
          reason: actionReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment');
      setFeedbackMsg({ type: 'success', text: 'Appointment rescheduled successfully' });
      setActionModal(null);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: actionReason || 'Cancelled by Physician'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment');
      setFeedbackMsg({ type: 'success', text: 'Appointment cancelled and time slot released' });
      setActionModal(null);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteNoShow = async () => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'no_show',
          reason: actionReason || 'Patient did not arrive for scheduled consultation'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark no-show');
      setFeedbackMsg({ type: 'success', text: 'Appointment marked as No-Show' });
      setActionModal(null);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Follow-up Appointment from Modal
  const handleExecuteFollowUp = async () => {
    if (!selectedAppointment || !followUpDate) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedAppointment.patientId,
          doctorId: selectedAppointment.doctorId,
          date: followUpDate,
          timeSlot: followUpSlot,
          type: 'FOLLOW_UP',
          visitType: selectedAppointment.visitType || 'IN_PERSON',
          reason: followUpReason || `Follow-up appointment for ${selectedAppointment.diagnosisNotes || selectedAppointment.reason}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book follow-up appointment');
      setFeedbackMsg({ type: 'success', text: `Follow-up appointment ${data.appointment?.appointmentCode} booked for ${followUpDate}` });
      setActionModal(null);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Save Doctor Schedule Changes
  const handleSaveSchedule = async () => {
    if (!scheduleConfig) return;
    setSavingSchedule(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/doctor/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleConfig })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule');
      setFeedbackMsg({ type: 'success', text: 'Doctor consultation schedule saved successfully' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setSavingSchedule(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    const next7DaysEnd = new Date();
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    const next7DaysEndStr = next7DaysEnd.toISOString().split('T')[0];

    return appointments.filter(apt => {
      // Date filter based on preset & viewMode
      if (viewMode === 'day') {
        if (apt.date !== selectedDate) return false;
      } else if (viewMode === 'agenda') {
        if (datePreset === 'TODAY' && apt.date !== todayStr) return false;
        if (datePreset === 'TOMORROW' && apt.date !== tomorrowStr) return false;
        if (datePreset === 'NEXT_7_DAYS' && (apt.date < todayStr || apt.date > next7DaysEndStr)) return false;
        if (datePreset === 'CUSTOM' && apt.date !== selectedDate) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'ALL' && apt.type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = apt.patient?.fullName?.toLowerCase().includes(q);
        const matchCode = apt.patient?.patientCode?.toLowerCase().includes(q);
        const matchRef = apt.appointmentCode?.toLowerCase().includes(q);
        const matchReason = apt.reason?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRef && !matchReason) return false;
      }

      return true;
    });
  }, [appointments, viewMode, datePreset, selectedDate, todayStr, tomorrowStr, statusFilter, typeFilter, searchQuery]);

  // Split appointments into Today's vs Upcoming for Agenda view
  const { todayAppointments, upcomingAppointments } = useMemo(() => {
    const todayList = filteredAppointments.filter(a => a.date === todayStr);
    const upcomingList = filteredAppointments.filter(a => a.date > todayStr);
    return { todayAppointments: todayList, upcomingAppointments: upcomingList };
  }, [filteredAppointments, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    const todayApts = appointments.filter(a => a.date === todayStr);
    const completed = todayApts.filter(a => a.status === 'COMPLETED').length;
    const upcoming = todayApts.filter(a => ['BOOKED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)).length;
    const inConsult = todayApts.filter(a => a.status === 'IN_CONSULTATION').length;
    const cancelled = todayApts.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length;
    return {
      todayCount: todayApts.length,
      completed,
      upcoming,
      inConsult,
      cancelled
    };
  }, [appointments, todayStr]);

  // Next Upcoming Appointment Card
  const nextAppointment = useMemo(() => {
    const active = appointments.filter(
      a => a.date >= todayStr && ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(a.status)
    );
    return active[0] || null;
  }, [appointments, todayStr]);

  // Week View 7-Day Range Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    // Find Monday of the current week
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  }, [selectedDate]);

  // Month View Calendar Matrix Calculation
  const monthCalendar = useMemo(() => {
    const curr = new Date(selectedDate);
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0 = Mon
    const daysInMonth = lastDay.getDate();

    const matrix: { dateStr: string; dayNum: number; isCurrentMonth: boolean; count: number }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDay - i);
      const pStr = pDate.toISOString().split('T')[0];
      const count = appointments.filter(a => a.date === pStr).length;
      matrix.push({ dateStr: pStr, dayNum: prevMonthLastDay - i, isCurrentMonth: false, count });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const cDate = new Date(year, month, i);
      const cStr = cDate.toISOString().split('T')[0];
      const count = appointments.filter(a => a.date === cStr).length;
      matrix.push({ dateStr: cStr, dayNum: i, isCurrentMonth: true, count });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nDate = new Date(year, month + 1, i);
      const nStr = nDate.toISOString().split('T')[0];
      const count = appointments.filter(a => a.date === nStr).length;
      matrix.push({ dateStr: nStr, dayNum: i, isCurrentMonth: false, count });
    }

    return {
      monthTitle: curr.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      days: matrix
    };
  }, [selectedDate, appointments]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Physician Consultation Suite
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isConnected ? 'Real-Time Connected' : 'Auto-Syncing'}</span>
              {lastEventTime && (
                <span className="text-[10px] text-slate-400 font-mono">
                  (updated {lastEventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" /> Physician Schedule & Appointment Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily consultations, launch clinical encounters, prescribe treatments, and track patient follow-up schedules.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'agenda' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'day' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'settings' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Working Schedule
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs hover:opacity-75 font-mono">✕</button>
        </div>
      )}

      {/* Quick Metrics & Next Appointment Card */}
      {viewMode !== 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Prominent Next Appointment Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Next Patient Appointment
              </span>
              {nextAppointment && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-200 font-mono">
                  {nextAppointment.timeSlot} • {nextAppointment.date}
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">{nextAppointment.patient?.fullName}</h3>
                    <p className="text-xs text-blue-200 font-mono">
                      {nextAppointment.patient?.patientCode} • {nextAppointment.patient?.gender}, {nextAppointment.patient?.bloodGroup}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    nextAppointment.status === 'IN_CONSULTATION' ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-blue-600 text-white'
                  }`}>
                    {nextAppointment.status}
                  </span>
                </div>
                <p className="text-xs text-blue-100 line-clamp-1">
                  <strong>Reason:</strong> {nextAppointment.reason}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/doctor/patient/${nextAppointment.patientId}?appointmentId=${nextAppointment.id}`}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                  >
                    Open Clinical Encounter <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  {nextAppointment.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleTransition(nextAppointment.id, 'start_consultation')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Start Consultation
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-blue-200 text-xs">
                <CheckCircle2 className="w-6 h-6 text-cyan-400 mx-auto mb-1 opacity-70" />
                No pending consultations active for today. You are all caught up!
              </div>
            )}
          </div>

          {/* Today's Metrics Counters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Schedule</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-slate-900">{stats.todayCount}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Encounters</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Upcoming: <strong>{stats.upcoming}</strong></span>
              <span>In Progress: <strong>{stats.inConsult}</strong></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Consultations</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-emerald-600">{stats.completed}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">Done</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Cancelled / Missed: <strong>{stats.cancelled}</strong></span>
              <span className="text-emerald-600 font-bold">Documented in EMR</span>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation & Controls Bar */}
      {viewMode !== 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Date Presets & Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleSelectPreset('TODAY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  datePreset === 'TODAY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleSelectPreset('TOMORROW')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  datePreset === 'TOMORROW' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleSelectPreset('NEXT_7_DAYS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  datePreset === 'NEXT_7_DAYS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Next 7 Days
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-blue-500"
              />
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, code, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-blue-500 w-48 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-Show</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL">General</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="ROUTINE">Routine</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            <button
              onClick={() => fetchAppointments()}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Schedule"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RENDER APPOINTMENT CARD HELPER                                            */}
      {/* ========================================================================= */}
      {(() => {
        const renderAppointmentCard = (apt: any) => {
          const isCompleted = apt.status === 'COMPLETED';
          const isCancelled = apt.status === 'CANCELLED' || apt.status === 'NO_SHOW';

          return (
            <div
              key={apt.id}
              className={`p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-b-0 ${
                isCompleted ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Time & Duration Badge */}
                <div className={`rounded-2xl px-3.5 py-2.5 text-center min-w-[85px] border ${
                  isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <span className="text-xs font-black block font-mono">{apt.timeSlot}</span>
                  <span className="text-[10px] font-semibold block opacity-75">{apt.durationMinutes || 30} mins</span>
                </div>

                {/* Patient and Consultation Details */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {apt.patient?.patientCode}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Ref: {apt.appointmentCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      apt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      apt.status === 'CHECKED_IN' ? 'bg-cyan-100 text-cyan-800' :
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                      apt.status === 'NO_SHOW' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.date !== todayStr && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {apt.date}
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-slate-900 text-base">{apt.patient?.fullName}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Reason:</strong> {apt.reason}
                  </p>

                  {/* If completed, display diagnosis summary */}
                  {apt.diagnosisNotes && (
                    <p className="text-xs text-emerald-800 font-bold mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block">
                      Diagnosis: {apt.diagnosisNotes}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>Type: <strong className="text-slate-600">{apt.type}</strong></span>
                    <span>Modality: <strong className="text-slate-600">{apt.visitType}</strong></span>
                    {apt.patient?.phone && <span>Phone: {apt.patient.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                {/* ACTIVE ENCOUNTER ACTIONS */}
                {!isCompleted && !isCancelled && (
                  <>
                    <Link
                      href={`/doctor/patient/${apt.patientId}?appointmentId=${apt.id}`}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
                    >
                      Open Encounter <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {apt.status === 'BOOKED' && (
                      <button
                        onClick={() => handleTransition(apt.id, 'confirm')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors"
                      >
                        Confirm
                      </button>
                    )}

                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleTransition(apt.id, 'check_in')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-200 transition-colors"
                      >
                        Check In
                      </button>
                    )}

                    {apt.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleTransition(apt.id, 'start_consultation')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Start Consultation
                      </button>
                    )}

                    {/* Reschedule */}
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setRescheduleDate(apt.date);
                        setRescheduleTimeSlot('');
                        loadRescheduleSlots(apt.date);
                        setActionModal('reschedule');
                      }}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                    >
                      Reschedule
                    </button>

                    {/* Cancel */}
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setActionReason('');
                        setActionModal('cancel');
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                    >
                      Cancel
                    </button>

                    {/* Mark No-Show */}
                    {['BOOKED', 'CONFIRMED'].includes(apt.status) && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setActionReason('');
                          setActionModal('no_show');
                        }}
                        className="px-2.5 py-2 text-slate-500 hover:text-purple-700 text-xs font-semibold transition-colors"
                        title="Mark No-Show"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {/* COMPLETED ACTIONS (Never empty or inactive!) */}
                {isCompleted && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setActionModal('summary');
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> Encounter Summary
                    </button>

                    <Link
                      href={`/doctor/prescriptions?patientId=${apt.patientId}`}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1 transition-all"
                    >
                      <Pill className="w-3.5 h-3.5" /> Prescriptions
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setFollowUpReason(`Follow-up consultation for ${apt.diagnosisNotes || apt.reason}`);
                        setActionModal('follow_up');
                      }}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1 transition-all"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Book Follow-up
                    </button>
                  </>
                )}

                {/* CANCELLED / NO SHOW ACTIONS */}
                {isCancelled && (
                  <button
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setRescheduleDate(todayStr);
                      setRescheduleTimeSlot('');
                      loadRescheduleSlots(todayStr);
                      setActionModal('reschedule');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-book Slot
                  </button>
                )}
              </div>
            </div>
          );
        };

        return null;
      })()}

      {/* ========================================================================= */}
      {/* VIEW: DAILY AGENDA (Separates Today's from Upcoming)                      */}
      {/* ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="space-y-6">
          {/* SECTION 1: TODAY'S APPOINTMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" /> Today's Consultations Queue ({todayAppointments.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                Loading today's consultations...
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-bold text-slate-600 text-xs">No appointments scheduled for today.</p>
                <p className="text-[11px] text-slate-400">New patient bookings will appear here instantly.</p>
              </div>
            ) : (
              <div>
                {todayAppointments.map(apt => (
                  <div key={apt.id} className="p-4 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl px-3.5 py-2.5 text-center min-w-[85px] border ${
                        apt.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}>
                        <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${apt.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'}`} />
                        <span className="text-xs font-black block font-mono">{apt.timeSlot}</span>
                        <span className="text-[10px] font-semibold block opacity-75">{apt.durationMinutes || 30} mins</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {apt.patient?.patientCode}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">Ref: {apt.appointmentCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            apt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            apt.status === 'CHECKED_IN' ? 'bg-cyan-100 text-cyan-800' :
                            apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        <h4 className="font-black text-slate-900 text-base">{apt.patient?.fullName}</h4>
                        <p className="text-xs text-slate-600 mt-0.5"><strong>Reason:</strong> {apt.reason}</p>
                        {apt.diagnosisNotes && (
                          <p className="text-xs text-emerald-800 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                            Diagnosis: {apt.diagnosisNotes}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>Type: <strong className="text-slate-600">{apt.type}</strong></span>
                          <span>Mode: <strong className="text-slate-600">{apt.visitType}</strong></span>
                          {apt.patient?.phone && <span>Phone: {apt.patient.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW' && (
                        <>
                          <Link
                            href={`/doctor/patient/${apt.patientId}?appointmentId=${apt.id}`}
                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                          >
                            Open Encounter <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {apt.status === 'BOOKED' && (
                            <button
                              onClick={() => handleTransition(apt.id, 'confirm')}
                              disabled={actionLoading}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200"
                            >
                              Confirm
                            </button>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleTransition(apt.id, 'check_in')}
                              disabled={actionLoading}
                              className="px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-200"
                            >
                              Check In
                            </button>
                          )}
                          {apt.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleTransition(apt.id, 'start_consultation')}
                              disabled={actionLoading}
                              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Start Consultation
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleTimeSlot('');
                              loadRescheduleSlots(apt.date);
                              setActionModal('reschedule');
                            }}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setActionReason('');
                              setActionModal('cancel');
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {apt.status === 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setActionModal('summary');
                            }}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> Encounter Summary
                          </button>
                          <Link
                            href={`/doctor/prescriptions?patientId=${apt.patientId}`}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1"
                          >
                            <Pill className="w-3.5 h-3.5" /> Prescriptions
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setFollowUpReason(`Follow-up for ${apt.diagnosisNotes || apt.reason}`);
                              setActionModal('follow_up');
                            }}
                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1"
                          >
                            <CalendarDays className="w-3.5 h-3.5" /> Book Follow-up
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: UPCOMING APPOINTMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" /> Upcoming Consultations ({upcomingAppointments.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Future booked consultations</span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming consultations beyond today matching current filter.
              </div>
            ) : (
              <div>
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="p-4 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl px-3.5 py-2.5 text-center min-w-[85px]">
                        <CalendarIcon className="w-3.5 h-3.5 text-purple-600 mx-auto mb-1" />
                        <span className="text-xs font-black text-purple-900 block font-mono">{apt.date}</span>
                        <span className="text-[10px] text-purple-700 font-semibold block">{apt.timeSlot}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {apt.patient?.patientCode}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">Ref: {apt.appointmentCode}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                            {apt.status}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-base">{apt.patient?.fullName}</h4>
                        <p className="text-xs text-slate-600 mt-0.5"><strong>Reason:</strong> {apt.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link
                        href={`/doctor/patient/${apt.patientId}?appointmentId=${apt.id}`}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1"
                      >
                        Patient Profile <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setRescheduleDate(apt.date);
                          setRescheduleTimeSlot('');
                          loadRescheduleSlots(apt.date);
                          setActionModal('reschedule');
                        }}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setActionReason('');
                          setActionModal('cancel');
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: DAY VIEW                                                            */}
      {/* ========================================================================= */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" /> Schedule for {selectedDate} ({filteredAppointments.length} consultations)
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-1">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="font-bold text-slate-700 text-sm">No consultations scheduled for {selectedDate}.</p>
            </div>
          ) : (
            <div>
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="p-4 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-3.5 py-2.5 text-center min-w-[85px]">
                      <Clock className="w-3.5 h-3.5 text-blue-600 mx-auto mb-1" />
                      <span className="text-xs font-black text-blue-900 block font-mono">{apt.timeSlot}</span>
                      <span className="text-[10px] text-blue-600 font-semibold block">{apt.durationMinutes || 30} mins</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {apt.patient?.patientCode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">Ref: {apt.appointmentCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          apt.status === 'CHECKED_IN' ? 'bg-cyan-100 text-cyan-800' :
                          apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base">{apt.patient?.fullName}</h4>
                      <p className="text-xs text-slate-600 mt-0.5"><strong>Reason:</strong> {apt.reason}</p>
                      {apt.diagnosisNotes && (
                        <p className="text-xs text-emerald-800 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                          Diagnosis: {apt.diagnosisNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Link
                      href={`/doctor/patient/${apt.patientId}?appointmentId=${apt.id}`}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      {apt.status === 'COMPLETED' ? 'Review Encounter' : 'Open Encounter'} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {apt.status === 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setActionModal('summary');
                        }}
                        className="px-3 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200"
                      >
                        Summary
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: WEEK VIEW                                                           */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" /> 7-Day Weekly Consultation Roster
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Week of {weekDays[0].monthName} {weekDays[0].dayNumber} - {weekDays[6].monthName} {weekDays[6].dayNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const dayApts = appointments.filter(a => a.date === day.dateStr);
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border p-3 min-h-[380px] flex flex-col justify-between transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' :
                    isToday ? 'border-emerald-300 bg-emerald-50/20' :
                    'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                      <div>
                        <span className="text-[11px] font-black uppercase text-slate-500 block">{day.dayName}</span>
                        <span className={`text-base font-black ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                          {day.dayNumber} {day.monthName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        {dayApts.length}
                      </span>
                    </div>

                    {/* Day Appointments List */}
                    <div className="space-y-2">
                      {dayApts.map(apt => (
                        <div
                          key={apt.id}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 shadow-2xs ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-50/90 border-emerald-200' :
                            apt.status === 'IN_CONSULTATION' ? 'bg-amber-50 border-amber-200' :
                            'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-slate-900 text-[11px]">{apt.timeSlot}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              apt.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900' :
                              apt.status === 'IN_CONSULTATION' ? 'bg-amber-200 text-amber-900' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 line-clamp-1">{apt.patient?.fullName}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{apt.reason}</p>
                          <div className="pt-1 flex justify-end">
                            <Link
                              href={`/doctor/patient/${apt.patientId}?appointmentId=${apt.id}`}
                              className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                            >
                              Encounter <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}

                      {dayApts.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic text-center py-8">No bookings</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setViewMode('day');
                    }}
                    className="w-full mt-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-colors"
                  >
                    View Day Schedule
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: MONTH VIEW                                                          */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" /> {monthCalendar.monthTitle}
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Click any calendar day to switch to that day's consultation schedule.
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => (
              <div key={name} className="py-1 text-xs font-black text-slate-400 uppercase tracking-wider">
                {name}
              </div>
            ))}

            {monthCalendar.days.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    setViewMode('day');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all min-h-[75px] flex flex-col justify-between ${
                    isSelected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' :
                    isToday ? 'border-emerald-400 bg-emerald-50/30' :
                    cell.isCurrentMonth ? 'bg-white hover:bg-slate-50 border-slate-200' :
                    'bg-slate-50/50 text-slate-300 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'}`}>
                      {cell.dayNum}
                    </span>
                    {cell.count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-xs">
                        {cell.count}
                      </span>
                    )}
                  </div>
                  {cell.count > 0 ? (
                    <span className="text-[10px] font-extrabold text-blue-700 block mt-1">
                      {cell.count} {cell.count === 1 ? 'consult' : 'consults'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 block mt-1">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SETTINGS TAB (Working Hours, Slots, Breaks)                         */}
      {/* ========================================================================= */}
      {viewMode === 'settings' && scheduleConfig && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Physician Availability & Consultation Settings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your weekly consulting days, start & end times, appointment duration, lunch breaks, and consultation venues.
              </p>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {savingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savingSchedule ? 'Saving Schedule...' : 'Save Schedule Settings'}
            </button>
          </div>

          {/* Consultation Location & Modality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Consultation Location / Chamber</label>
              <input
                type="text"
                value={scheduleConfig.consultationLocation || ''}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, consultationLocation: e.target.value })}
                placeholder="e.g. OPD Suite 204, Block B"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:bg-white bg-white"
              />
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleConfig.allowInPerson}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, allowInPerson: e.target.checked })}
                  className="rounded text-blue-600"
                />
                In-Person Consultations
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleConfig.allowTeleconsultation}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, allowTeleconsultation: e.target.checked })}
                  className="rounded text-blue-600"
                />
                Teleconsultations
              </label>
            </div>
          </div>

          {/* Weekly Days Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">Weekly Consultation Timetable</h3>
            <div className="space-y-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const daySched = scheduleConfig.workingDays?.[day] || {
                  enabled: false,
                  startTime: '09:00',
                  endTime: '17:00',
                  slotDurationMinutes: 30,
                  breaks: []
                };

                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      daySched.enabled ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-36">
                      <input
                        type="checkbox"
                        checked={daySched.enabled}
                        onChange={(e) => {
                          const updated = { ...scheduleConfig.workingDays, [day]: { ...daySched, enabled: e.target.checked } };
                          setScheduleConfig({ ...scheduleConfig, workingDays: updated });
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="font-extrabold text-xs uppercase text-slate-800">{day}</span>
                    </div>

                    {daySched.enabled && (
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Start:</span>
                          <input
                            type="time"
                            value={daySched.startTime}
                            onChange={(e) => {
                              const updated = { ...scheduleConfig.workingDays, [day]: { ...daySched, startTime: e.target.value } };
                              setScheduleConfig({ ...scheduleConfig, workingDays: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">End:</span>
                          <input
                            type="time"
                            value={daySched.endTime}
                            onChange={(e) => {
                              const updated = { ...scheduleConfig.workingDays, [day]: { ...daySched, endTime: e.target.value } };
                              setScheduleConfig({ ...scheduleConfig, workingDays: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Slot:</span>
                          <select
                            value={daySched.slotDurationMinutes}
                            onChange={(e) => {
                              const updated = { ...scheduleConfig.workingDays, [day]: { ...daySched, slotDurationMinutes: parseInt(e.target.value) } };
                              setScheduleConfig({ ...scheduleConfig, workingDays: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold"
                          >
                            <option value="15">15 mins</option>
                            <option value="20">20 mins</option>
                            <option value="30">30 mins</option>
                            <option value="45">45 mins</option>
                            <option value="60">60 mins</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESCHEDULE                                                         */}
      {/* ========================================================================= */}
      {actionModal === 'reschedule' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Reschedule Appointment {selectedAppointment.appointmentCode}
            </h3>
            <p className="text-xs text-slate-500">
              Select a new date and open consultation slot for <strong>{selectedAppointment.patient?.fullName}</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Date</label>
              <input
                type="date"
                min={todayStr}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadRescheduleSlots(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Available Slots</label>
              {loadingSlots ? (
                <p className="text-xs text-slate-400 py-2">Loading available slots...</p>
              ) : availableRescheduleSlots.length === 0 ? (
                <p className="text-xs text-amber-600 font-bold py-2">No open slots available on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                  {availableRescheduleSlots.map((s) => (
                    <button
                      key={s.timeSlot}
                      type="button"
                      onClick={() => setRescheduleTimeSlot(s.timeSlot)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        rescheduleTimeSlot === s.timeSlot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {s.timeSlot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Rescheduling</label>
              <input
                type="text"
                placeholder="e.g. Schedule adjustment or patient request"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteReschedule}
                disabled={actionLoading || !rescheduleDate || !rescheduleTimeSlot}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL                                                             */}
      {/* ========================================================================= */}
      {actionModal === 'cancel' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" /> Cancel Appointment
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel appointment <strong>{selectedAppointment.appointmentCode}</strong> for{' '}
              <strong>{selectedAppointment.patient?.fullName}</strong>? The time slot will immediately be released.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cancellation Reason *</label>
              <textarea
                rows={2}
                placeholder="Reason for cancellation..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK NO-SHOW                                                       */}
      {/* ========================================================================= */}
      {actionModal === 'no_show' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 text-purple-700">
              <UserX className="w-5 h-5" /> Mark Patient No-Show
            </h3>
            <p className="text-xs text-slate-600">
              Confirm that patient <strong>{selectedAppointment.patient?.fullName}</strong> did not appear for consultation{' '}
              <strong>{selectedAppointment.appointmentCode}</strong> scheduled on {selectedAppointment.date} at {selectedAppointment.timeSlot}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteNoShow}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Confirm No-Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPLETED ENCOUNTER SUMMARY                                        */}
      {/* ========================================================================= */}
      {actionModal === 'summary' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Encounter Summary #{selectedAppointment.appointmentCode}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600 font-mono text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] block">Patient Information</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">{selectedAppointment.patient?.fullName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{selectedAppointment.patient?.patientCode} • {selectedAppointment.patient?.gender}, {selectedAppointment.patient?.bloodGroup}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-extrabold text-emerald-800 uppercase text-[10px] block">Confirmed Clinical Diagnosis</span>
                <p className="font-black text-emerald-950 text-sm mt-0.5">
                  {selectedAppointment.diagnosisNotes || 'No specific diagnosis notes recorded'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] block">Consultation History & Timestamps</span>
                <p className="text-slate-700 mt-0.5">Reason: {selectedAppointment.reason}</p>
                {selectedAppointment.completedAt && (
                  <p className="text-slate-500 mt-1 font-mono text-[11px]">
                    Completed At: {new Date(selectedAppointment.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Link
                href={`/doctor/patient/${selectedAppointment.patientId}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View Full Patient Timeline <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK FOLLOW-UP APPOINTMENT                                         */}
      {/* ========================================================================= */}
      {actionModal === 'follow_up' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" /> Book Follow-up Consultation
              </h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600 font-mono text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Schedule follow-up visit for patient <strong>{selectedAppointment.patient?.fullName}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Slot</label>
                <select
                  value={followUpSlot}
                  onChange={(e) => setFollowUpSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Follow-up Notes / Reason</label>
                <input
                  type="text"
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !followUpDate}
                onClick={handleExecuteFollowUp}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Booking...' : 'Book Follow-up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
