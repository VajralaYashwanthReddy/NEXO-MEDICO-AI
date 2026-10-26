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
  Plus,
  RefreshCw,
  Building2,
  Stethoscope,
  ShieldAlert,
  SlidersHorizontal,
  History,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function HospitalAdminAppointmentsPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);

  // Actions
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<'create' | 'reschedule' | 'cancel' | 'history' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Appointment Staff Form State
  const [newPatientId, setNewPatientId] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newVisitType, setNewVisitType] = useState('IN_PERSON');
  const [newType, setNewType] = useState('GENERAL');
  const [patientsList, setPatientsList] = useState<any[]>([]);

  // Fetch Hospital Appointments (Strictly isolated by authenticated hospitalId)
  const fetchAppointments = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch hospital doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch hospital patients for staff creation modal
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (res.ok) {
        setPatientsList(data.patients || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, [fetchAppointments, fetchDoctors, fetchPatients]);

  // Real-Time SSE with fallback polling
  const { isConnected, lastEventTime } = useRealtimeAppointments({
    hospitalId: user?.hospitalId,
    onRefreshNeeded: fetchAppointments
  });

  // Load available slots
  const loadSlotsForDoctor = async (docId: string, date: string) => {
    if (!docId || !date) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?doctorId=${docId}&date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots((data.slots || []).filter((s: any) => s.available));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Staff creation handler
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newDoctorId || !newDate || !newTimeSlot) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newPatientId,
          doctorId: newDoctorId,
          date: newDate,
          timeSlot: newTimeSlot,
          visitType: newVisitType,
          type: newType,
          reason: newReason || 'Outpatient Consultation'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment');
      setFeedbackMsg({ type: 'success', text: `Appointment ${data.appointment?.appointmentCode} scheduled successfully` });
      setActionModal(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Status transition handler
  const handleTransition = async (aptId: string, action: string) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update appointment');
      setFeedbackMsg({ type: 'success', text: `Appointment status updated to ${data.appointment?.status}` });
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule execution
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
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
      setFeedbackMsg({ type: 'success', text: `Appointment rescheduled to ${rescheduleDate} at ${rescheduleTimeSlot}` });
      setActionModal(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel execution
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
          reason: actionReason || 'Cancelled by Hospital Administration'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      setFeedbackMsg({ type: 'success', text: 'Appointment cancelled and slot released' });
      setActionModal(null);
      fetchAppointments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (dateFilter && apt.date !== dateFilter) return false;
      if (selectedDoctorId !== 'ALL' && apt.doctorId !== selectedDoctorId) return false;
      if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && apt.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mPatient = apt.patient?.fullName?.toLowerCase().includes(q);
        const mCode = apt.patient?.patientCode?.toLowerCase().includes(q);
        const mDoc = apt.doctor?.name?.toLowerCase().includes(q);
        const mRef = apt.appointmentCode?.toLowerCase().includes(q);
        const mReason = apt.reason?.toLowerCase().includes(q);
        if (!mPatient && !mCode && !mDoc && !mRef && !mReason) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, selectedDoctorId, statusFilter, typeFilter, searchQuery]);

  // Hospital-wide Metrics
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const upcoming = appointments.filter(a => ['BOOKED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)).length;
    const inConsult = appointments.filter(a => a.status === 'IN_CONSULTATION').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    return { total, completed, upcoming, inConsult, cancelled };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800">
              Hospital Tenant Administration
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isConnected ? 'Real-Time Connected' : 'Auto-Syncing'}</span>
              {lastEventTime && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({lastEventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-cyan-600" /> Hospital Central Appointment Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and coordinate appointments for all physicians and departments across your hospital.
          </p>
        </div>

        <button
          onClick={() => {
            setNewPatientId(patientsList[0]?.id || '');
            setNewDoctorId(doctors[0]?.user?.id || '');
            setNewTimeSlot('');
            if (doctors[0]?.user?.id) loadSlotsForDoctor(doctors[0].user.id, newDate);
            setActionModal('create');
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Book Appointment for Staff
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-mono">✕</button>
        </div>
      )}

      {/* Hospital Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Encounters</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded mt-1 inline-block">Hospital-Wide</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Queued</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{stats.upcoming}</span>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">Booked / Checked-In</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Consultation</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.inConsult}</span>
          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">Active With Physician</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.completed}</span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Finalized Encounters</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled / Released</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{stats.cancelled}</span>
          <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded mt-1 inline-block">Freed Slots</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-bold underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Physician:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value="ALL">All Hospital Physicians</option>
              {doctors.map(d => (
                <option key={d.user?.id || d.id} value={d.user?.id || d.userId}>
                  {d.user?.name || d.name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, doctor, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-64"
          />
        </div>
      </div>

      {/* Appointments Master Table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Hospital Encounters List ({filteredAppointments.length})</span>
          <button
            onClick={() => fetchAppointments()}
            className="text-cyan-700 hover:text-cyan-900 flex items-center gap-1 font-bold text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading appointments data...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-1">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="font-bold text-slate-600">No appointments found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Ref & Date</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Assigned Physician</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Type & Reason</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 block w-fit mb-1">
                        {apt.appointmentCode}
                      </span>
                      <span className="font-bold text-slate-700 block">{apt.date}</span>
                      <span className="font-mono text-[11px] text-slate-400 font-bold">{apt.timeSlot}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block text-sm">{apt.patient?.fullName}</span>
                      <span className="font-mono text-[11px] text-slate-400 block">{apt.patient?.patientCode}</span>
                      {apt.patient?.phone && <span className="text-[10px] text-slate-400">{apt.patient.phone}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block">{apt.doctor?.name}</span>
                      <span className="text-[11px] text-slate-400">{apt.doctor?.email}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {apt.department?.name || 'General Medicine'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 block line-clamp-1">{apt.reason}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{apt.type} • {apt.visitType}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        apt.status === 'CHECKED_IN' ? 'bg-cyan-100 text-cyan-800' :
                        apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'BOOKED' && (
                          <button
                            onClick={() => handleTransition(apt.id, 'confirm')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-xs"
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleTransition(apt.id, 'check_in')}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] rounded-lg shadow-xs"
                          >
                            Check In
                          </button>
                        )}
                        {['BOOKED', 'CONFIRMED'].includes(apt.status) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setRescheduleDate(apt.date);
                                setRescheduleTimeSlot('');
                                loadSlotsForDoctor(apt.doctorId, apt.date);
                                setActionModal('reschedule');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setActionReason('');
                                setActionModal('cancel');
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setActionModal('history');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="View Audit Trail"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE APPOINTMENT MODAL (For Staff / Receptionist Booking) */}
      {actionModal === 'create' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateAppointment} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600" /> Book Hospital Patient Consultation
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Patient *</label>
                <select
                  required
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  {patientsList.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Doctor *</label>
                <select
                  required
                  value={newDoctorId}
                  onChange={(e) => {
                    setNewDoctorId(e.target.value);
                    loadSlotsForDoctor(e.target.value, newDate);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  {doctors.map(d => (
                    <option key={d.user?.id || d.id} value={d.user?.id || d.userId}>
                      {d.user?.name || d.name} — {d.specialization} ({d.department?.name || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      loadSlotsForDoctor(newDoctorId, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Available Slot *</label>
                  <select
                    required
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="">-- Choose Slot --</option>
                    {availableSlots.map(s => (
                      <option key={s.timeSlot} value={s.timeSlot}>{s.timeSlot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Consultation Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regular cardiac evaluation or acute fever"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Encounter Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="GENERAL">General</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="ROUTINE">Routine</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modality</label>
                  <select
                    value={newVisitType}
                    onChange={(e) => setNewVisitType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="IN_PERSON">In-Person</option>
                    <option value="TELECONSULTATION">Teleconsultation</option>
                  </select>
                </div>
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
                type="submit"
                disabled={actionLoading || !newTimeSlot}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Booking Slot...' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {actionModal === 'reschedule' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Reschedule Appointment {selectedAppointment.appointmentCode}
            </h3>
            <p className="text-xs text-slate-500">
              Select a new date and available slot for <strong>{selectedAppointment.patient?.fullName}</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  loadSlotsForDoctor(selectedAppointment.doctorId, e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Available Slots</label>
              {loadingSlots ? (
                <p className="text-xs text-slate-400 py-2">Loading slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-amber-600 font-bold py-2">No open slots on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                  {availableSlots.map((s) => (
                    <button
                      key={s.timeSlot}
                      type="button"
                      onClick={() => setRescheduleTimeSlot(s.timeSlot)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        rescheduleTimeSlot === s.timeSlot
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
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
                placeholder="Reason..."
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
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {actionModal === 'cancel' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Cancel Appointment
            </h3>
            <p className="text-xs text-slate-600">
              Confirm cancellation for <strong>{selectedAppointment.appointmentCode}</strong>? The reserved slot will immediately be released for other patients.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason *</label>
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
                Keep
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {actionModal === 'history' && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-600" /> Audit Trail • {selectedAppointment.appointmentCode}
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {(() => {
                let events: any[] = [];
                try {
                  if (selectedAppointment.historyJson) events = JSON.parse(selectedAppointment.historyJson);
                } catch (e) {}

                if (events.length === 0) {
                  return <p className="text-xs text-slate-400 py-4 text-center">No lifecycle event logs found.</p>;
                }

                return events.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-cyan-800 uppercase">{ev.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {ev.byName && <p className="text-[11px] text-slate-500">By: <strong>{ev.byName}</strong></p>}
                    {ev.reason && <p className="text-[11px] text-slate-600">Note: {ev.reason}</p>}
                    {ev.previousDate && (
                      <p className="text-[10px] text-amber-700">
                        Shifted from {ev.previousDate} {ev.previousTimeSlot} ➔ {ev.newDate} {ev.newTimeSlot}
                      </p>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
