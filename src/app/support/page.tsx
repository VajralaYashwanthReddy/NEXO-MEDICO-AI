'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  RotateCcw,
  Send,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Paperclip,
  X,
  History,
  Ticket,
  ExternalLink,
  LifeBuoy,
  Phone,
  Mail,
  User as UserIcon
} from 'lucide-react';

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Ground-Truth Authenticated Contact Details
  const [contactInfo, setContactInfo] = useState<{
    name: string;
    email: string;
    phone: string | null;
    displayMobile: string | null;
    hasPhone: boolean;
    role: string;
    profileUrl: string;
  }>({
    name: user?.name || 'Registered User',
    email: user?.email || '',
    phone: user?.phone || null,
    displayMobile: user?.phone || null,
    hasPhone: Boolean(user?.phone),
    role: user?.role || 'USER',
    profileUrl: '/patient/dashboard'
  });

  // Selected Ticket in Active Chat
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Email Notification Retry
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [emailRetryMsg, setEmailRetryMsg] = useState('');

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFormData, setNewFormData] = useState({
    subject: '',
    issueType: 'TECHNICAL',
    priority: 'MEDIUM',
    description: '',
    attachmentUrl: ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [newTicketCreated, setNewTicketCreated] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Full Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async (selectedIdToMaintain?: string) => {
    try {
      setLoading(true);
      let url = `/api/support/issues?q=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        const list = data.issues || [];
        setTickets(list);
        setSummary(data.summaryCards || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });

        const targetId = selectedIdToMaintain || selectedTicket?.id;
        if (targetId) {
          const fresh = list.find((t: any) => t.id === targetId || t.ticketCode === targetId);
          if (fresh) loadTicketDetails(fresh.id);
        } else if (list.length > 0 && !selectedTicket) {
          loadTicketDetails(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (idOrCode: string) => {
    try {
      setTicketDetailsLoading(true);
      const res = await fetch(`/api/support/issues/${idOrCode}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetch('/api/support/user-contact')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setContactInfo(data); })
      .catch(e => console.warn('Could not load user contact details:', e));
  }, [statusFilter]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRetryEmail = async (ticketId: string) => {
    setRetryingEmail(true);
    setEmailRetryMsg('');
    try {
      const res = await fetch(`/api/support/issues/${ticketId}/retry-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEmailRetryMsg('Confirmation email was dispatched successfully.');
        loadTicketDetails(ticketId);
        fetchTickets(ticketId);
      } else {
        setEmailRetryMsg(data.error || 'Email retry failed.');
      }
    } catch {
      setEmailRetryMsg('Network error retrying email.');
    } finally {
      setRetryingEmail(false);
    }
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>, isModal: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Attachment exceeds maximum permitted size of 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (isModal) {
        setNewFormData(prev => ({ ...prev, attachmentUrl: base64 }));
      } else {
        setChatAttachment(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.subject.trim() || !newFormData.description.trim()) {
      alert('Please fill out Subject and Description');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newFormData.subject.trim(),
          description: newFormData.description.trim(),
          issueType: newFormData.issueType,
          priority: newFormData.priority,
          attachmentUrl: newFormData.attachmentUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewTicketCreated(data.ticket);
        fetchTickets(data.ticket.id);
      } else {
        alert(data.error || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Create ticket error:', err);
      alert('Network or server error while submitting ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !chatMessage.trim()) return;

    if (selectedTicket.status === 'CLOSED') {
      alert('This ticket is closed. Messaging and tracking updates are no longer available.');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/support/issues/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage.trim(),
          attachmentUrl: chatAttachment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessage('');
        setChatAttachment(null);
        loadTicketDetails(selectedTicket.id);
        fetchTickets(selectedTicket.id);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm(`Are you sure you want to mark ticket ${selectedTicket.ticketCode} as CLOSED? Once closed, messaging is locked.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/support/issues/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data.ticket);
        fetchTickets(data.ticket.id);
      } else {
        alert(data.error || 'Failed to close ticket');
      }
    } catch (err) {
      console.error('Close ticket error:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-700" /> OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 font-black text-[10px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-700" /> IN PROGRESS
          </span>
        );
      case 'WAITING_FOR_USER':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 font-black text-[10px] inline-flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-700" /> ACTION NEEDED
          </span>
        );
      case 'WAITING_FOR_SUPPORT':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 font-black text-[10px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-700" /> UNDER REVIEW
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 border border-slate-300 font-black text-[10px] inline-flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-700" /> CLOSED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 font-black text-[10px]">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">MEDIUM</span>;
      default:
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-cyan-600 uppercase tracking-widest mb-1">
            🎧 24/7 Live Assistance & Issue Tracking
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Headphones className="w-8 h-8 text-cyan-600" /> Help Desk & Support Ticket Center
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 font-medium">
            Track your support tickets with unique tracking tokens, converse directly with platform engineers, and monitor real-time resolution updates.
          </p>
        </div>

        <button
          onClick={() => {
            setNewFormData({
              subject: '',
              issueType: 'TECHNICAL',
              priority: 'MEDIUM',
              description: '',
              attachmentUrl: ''
            });
            setNewTicketCreated(null);
            setShowNewModal(true);
          }}
          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg shadow-cyan-600/20 font-black text-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Raise New Support Ticket
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Tickets</span>
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">{summary.total}</h3>
          <span className="text-[10px] text-slate-500 font-bold">Your Submitted Inquiries</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Open & In Progress</span>
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-amber-600">{(summary.open || 0) + (summary.inProgress || 0)}</h3>
          <span className="text-[10px] text-amber-600 font-extrabold">Active Investigations</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Resolved</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{summary.resolved}</h3>
          <span className="text-[10px] text-emerald-600 font-extrabold">Completed Resolutions</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Closed</span>
            <Lock className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-700">{summary.closed || 0}</h3>
          <span className="text-[10px] text-slate-500 font-extrabold">Archived Records</span>
        </div>
      </div>

      {/* 3. Search and Status Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchTickets();
            }}
            placeholder="Search by ticket token (e.g. NMX-TKT-2026-000123) or keyword..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-black text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2.5 rounded-2xl shadow-2xs text-xs font-extrabold">
          <span className="text-slate-400 font-bold">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Awaiting Your Reply</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* 4. Split View: Ticket List + Live Chat & Tracking Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Ticket Cards List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-10">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <LifeBuoy className="w-10 h-10 text-cyan-600 mx-auto" />
              <h3 className="font-black text-slate-900 text-sm">No Support Tickets Found</h3>
              <p className="text-xs text-slate-500">
                You have not submitted any support tickets yet or none matched your filter.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Raise Your First Ticket
              </button>
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetails(t.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-400 ring-2 ring-cyan-400/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-black text-cyan-900 text-xs bg-cyan-100/70 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                      {t.ticketCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(t.priority || 'MEDIUM')}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <h4 className="font-black text-slate-900 text-xs line-clamp-1">{t.subject}</h4>
                  <p className="text-slate-600 text-[11px] font-medium line-clamp-2 mt-1">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                    <span className="font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 text-slate-600">
                      <MessageSquare className="w-3 h-3 text-cyan-600" />
                      <span>{t.messages?.length || 0} messages</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Ticket Details & Live Chat Drawer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[580px]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs bg-cyan-100 text-cyan-900 px-2.5 py-1 rounded-lg border border-cyan-200 inline-flex items-center gap-1.5">
                      {selectedTicket.ticketCode}
                      <button
                        onClick={() => handleCopyToken(selectedTicket.ticketCode)}
                        title="Copy tracking token"
                        className="text-cyan-700 hover:text-cyan-900"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority || 'MEDIUM')}
                  </div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                    <span>Category: <strong>{selectedTicket.issueType?.replace('_', ' ')}</strong></span>
                    <span>•</span>
                    <span>Created: <strong>{new Date(selectedTicket.createdAt).toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/support/tickets/${selectedTicket.ticketCode || selectedTicket.id}`)}
                    className="p-2 bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                    title="Open Dedicated Full-Page Tracking & Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="hidden sm:inline">Track Page</span>
                  </button>
                  <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs"
                    title="Toggle timeline events"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-600" />
                  </button>
                  {selectedTicket.status !== 'CLOSED' && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-[11px] flex items-center gap-1 transition-all"
                      title="Close ticket"
                    >
                      <Lock className="w-3 h-3 text-slate-400" /> Close Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Email Notification & SLA Target Bar */}
              <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-500 text-[11px]">Email Notification:</span>
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                    selectedTicket.emailStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedTicket.emailStatus === 'SENT' ? 'DISPATCHED' : (selectedTicket.emailStatus === 'FAILED' ? 'DELIVERY FAILED' : 'PENDING')}
                  </span>
                  {selectedTicket.emailStatus !== 'SENT' && (
                    <button
                      onClick={() => handleRetryEmail(selectedTicket.id)}
                      disabled={retryingEmail}
                      className="text-[10px] text-cyan-700 font-extrabold hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${retryingEmail ? 'animate-spin' : ''}`} />
                      {retryingEmail ? 'Retrying...' : 'Retry Email'}
                    </button>
                  )}
                  {emailRetryMsg && (
                    <span className="text-[10px] text-cyan-700 font-bold ml-1">{emailRetryMsg}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Response target: within 24 hours</span>
                </div>
              </div>

              {/* Optional Collapsible Timeline Events */}
              {showTimeline && (
                <div className="p-4 bg-slate-100/80 border-b border-slate-200 text-xs space-y-2 animate-in fade-in">
                  <h5 className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Ticket Tracking Timeline</h5>
                  {(!selectedTicket.timelineEvents || selectedTicket.timelineEvents.length === 0) ? (
                    <p className="text-slate-400 text-xs italic">No timeline events logged.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedTicket.timelineEvents.map((evt: any) => (
                        <div key={evt.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{evt.description}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/50">
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="p-10 text-center text-slate-400 font-bold">
                    No messages yet in this ticket conversation.
                  </div>
                ) : (
                  selectedTicket.messages.map((msg: any) => {
                    const isUserSender = msg.senderRole !== 'SUPER_ADMIN' && msg.senderRole !== 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUserSender ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-bold">
                          <span>{msg.senderName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-black ${
                            isUserSender ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {msg.senderRole}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                            isUserSender
                              ? 'bg-cyan-700 text-white rounded-tr-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.attachmentUrl && (
                            <button
                              onClick={() => setPreviewImage(msg.attachmentUrl)}
                              className="mt-2 block"
                            >
                              <img
                                src={msg.attachmentUrl}
                                alt="Attachment"
                                className="max-h-40 rounded-xl border border-white/20 object-cover"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer / Message Input OR Closed Ticket Lockdown Banner */}
              <div className="p-4 border-t border-slate-200 bg-white">
                {selectedTicket.status === 'CLOSED' ? (
                  /* CRITICAL LOCKDOWN BANNER */
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900">
                    <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="font-black text-xs">
                        This ticket is closed. Messaging and tracking updates are no longer available.
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        If you are still experiencing difficulties, please raise a new support ticket using the button above.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Active Message Input Form */
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    {chatAttachment && (
                      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200 w-fit">
                        <img src={chatAttachment} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-[11px] font-bold text-slate-700">Image attached</span>
                        <button
                          type="button"
                          onClick={() => setChatAttachment(null)}
                          className="text-slate-400 hover:text-slate-600 ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-colors shrink-0" title="Attach screenshot">
                        <Paperclip className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageAttachment(e, false)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Write a reply or provide additional details..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || (!chatMessage.trim() && !chatAttachment)}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <Headphones className="w-12 h-12 text-slate-300" />
              <p className="font-black text-slate-700 text-sm">Select a support ticket</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Choose a ticket from the left column to view the tracking events and continue the conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. RAISE NEW TICKET MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border text-xs space-y-4 animate-in fade-in select-none text-slate-900">
            {newTicketCreated ? (
              /* Success confirmation view displaying the tracking token */
              <div className="p-4 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg">Support Ticket Created Successfully!</h3>
                  <p className="text-slate-500 text-xs">
                    Your request has been registered in the database. Our support team aims to respond within 24 hours.
                  </p>
                </div>

                {/* Token Card */}
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-cyan-700 tracking-wider block">
                    Permanent Ticket Token
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-black text-lg text-cyan-950">
                      {newTicketCreated.ticketCode}
                    </span>
                    <button
                      onClick={() => handleCopyToken(newTicketCreated.ticketCode)}
                      className="p-1.5 bg-white border border-cyan-300 rounded-lg text-cyan-700 hover:bg-cyan-100 transition-colors"
                      title="Copy Token"
                    >
                      {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-cyan-800 font-medium">
                    Please keep this token for future tracking reference.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Registered Email:</span>
                    <span className="font-semibold text-slate-800">{newTicketCreated.email || contactInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Confirmation Status:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      {newTicketCreated.emailStatus === 'SENT' ? 'Email Dispatched' : 'Registered in PostgreSQL'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      setShowNewModal(false);
                      router.push(`/support/tickets/${newTicketCreated.ticketCode || newTicketCreated.id}`);
                    }}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Go to Dedicated Tracking Page
                  </button>
                  <button
                    onClick={() => {
                      setShowNewModal(false);
                      loadTicketDetails(newTicketCreated.id);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-all"
                  >
                    Open in Split Chat View
                  </button>
                </div>
              </div>
            ) : (
              /* Ticket Creation Form */
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Raise New Support Ticket</h3>
                      <p className="text-[11px] text-slate-500">Submit an inquiry, bug report, or assistance request.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-3">
                  {/* Ground-Truth Authenticated Contact Snapshot */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" /> Authenticated Account Contacts
                      </span>
                      <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                        {contactInfo.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                          <Lock className="w-2.5 h-2.5 text-slate-400" /> Registered Name
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={contactInfo.name}
                          className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-not-allowed text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                          <Lock className="w-2.5 h-2.5 text-slate-400" /> Registered Email
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={contactInfo.email}
                          className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-not-allowed text-xs truncate"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
                        <Lock className="w-2.5 h-2.5 text-slate-400" /> Registered Mobile Number
                      </label>
                      {contactInfo.hasPhone ? (
                        <input
                          type="text"
                          readOnly
                          value={contactInfo.displayMobile || contactInfo.phone || ''}
                          className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-not-allowed text-xs font-mono"
                        />
                      ) : (
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-amber-800 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> No mobile number is registered
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewModal(false);
                              router.push(contactInfo.profileUrl);
                            }}
                            className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900 underline flex items-center gap-0.5"
                          >
                            Update Profile <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-black text-slate-900 block mb-1">Issue Subject *</label>
                    <input
                      type="text"
                      required
                      value={newFormData.subject}
                      onChange={(e) => setNewFormData({ ...newFormData, subject: e.target.value })}
                      placeholder="e.g. Bed allocation module throwing error 403"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-black text-slate-900 block mb-1">Issue Category *</label>
                      <select
                        value={newFormData.issueType}
                        onChange={(e) => setNewFormData({ ...newFormData, issueType: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="TECHNICAL">Technical Issue / Bug</option>
                        <option value="HOSPITAL_ONBOARDING">Hospital Onboarding</option>
                        <option value="BILLING">Billing & Subscription</option>
                        <option value="CLINICAL">Clinical / Prescription</option>
                        <option value="GENERAL">General Query</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-black text-slate-900 block mb-1">Priority Level *</label>
                      <select
                        value={newFormData.priority}
                        onChange={(e) => setNewFormData({ ...newFormData, priority: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-black text-slate-900 block mb-1">Detailed Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={newFormData.description}
                      onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                      placeholder="Provide step-by-step reproduction details or explanation..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-black text-slate-900 block mb-1">Screenshot / Evidence (Optional)</label>
                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-extrabold text-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                        <Upload className="w-4 h-4 text-cyan-600" /> Upload Image
                        <input type="file" accept="image/*" onChange={(e) => handleImageAttachment(e, true)} className="hidden" />
                      </label>
                      {newFormData.attachmentUrl && (
                        <div className="flex items-center gap-2">
                          <img src={newFormData.attachmentUrl} alt="Attached" className="w-8 h-8 rounded-lg object-cover border" />
                          <span className="text-[10px] text-emerald-600 font-extrabold">Attached!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-4 py-2 text-slate-500 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> {submittingTicket ? 'Generating Token...' : 'Create Support Ticket'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 6. FULL SCREENSHOT PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full p-2 bg-white rounded-3xl shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900 text-white rounded-full font-bold z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Evidence preview"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
