'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Headphones,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  RefreshCw,
  X,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Send,
  Building2,
  Ticket,
  AlertTriangle,
  History,
  Lock,
  RotateCcw,
  Paperclip,
  CheckCircle,
  Hourglass,
  Tag
} from 'lucide-react';

export default function SupportIssuesAdminPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Detailed Modal State
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'details' | 'timeline'>('chat');
  const [actionStatus, setActionStatus] = useState('RESOLVED');
  const [actionPriority, setActionPriority] = useState('MEDIUM');
  const [adminNotes, setAdminNotes] = useState('');
  const [newReplyMessage, setNewReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchIssues = () => {
    setLoading(true);
    let url = `/api/admin/support-issues?q=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (priorityFilter) url += `&priority=${priorityFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setIssues(data.issues || []);
        setSummary(data.summaryCards || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
        if (selectedIssue) {
          const fresh = (data.issues || []).find((i: any) => i.id === selectedIssue.id || i.ticketCode === selectedIssue.ticketCode);
          if (fresh) setSelectedIssue(fresh);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
    const handleCreated = () => fetchIssues();
    if (typeof window !== 'undefined') {
      window.addEventListener('support-ticket-created', handleCreated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('support-ticket-created', handleCreated);
      }
    };
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedIssue?.messages, activeTab]);

  const openTicketModal = (item: any) => {
    setSelectedIssue(item);
    setActionStatus(item.status);
    setActionPriority(item.priority || 'MEDIUM');
    setAdminNotes(item.adminResponse || '');
    setActiveTab('chat');
  };

  const handleUpdateStatus = async (targetStatus?: string) => {
    if (!selectedIssue) return;
    const finalStatus = targetStatus || actionStatus;

    setUpdating(true);
    try {
      const res = await fetch(`/api/support/issues/${selectedIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: finalStatus,
          priority: actionPriority,
          adminResponse: adminNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIssue(data.ticket);
        fetchIssues();
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with server');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newReplyMessage.trim()) return;

    if (selectedIssue.status === 'CLOSED') {
      alert('This ticket is closed. Messaging and tracking updates are no longer available.');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/support/issues/${selectedIssue.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newReplyMessage.trim(),
          isInternal: isInternalNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewReplyMessage('');
        setIsInternalNote(false);
        // Re-fetch ticket details
        const refreshedRes = await fetch(`/api/support/issues/${selectedIssue.id}`);
        if (refreshedRes.ok) {
          const freshData = await refreshedRes.json();
          setSelectedIssue(freshData.ticket);
        }
        fetchIssues();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
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
            <Hourglass className="w-3 h-3 text-blue-700" /> AWAITING USER
          </span>
        );
      case 'WAITING_FOR_SUPPORT':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 font-black text-[10px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-700" /> AWAITING SUPPORT
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
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
            🛡️ Platform Governance & Live Customer Care
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Headphones className="w-8 h-8 text-blue-600" /> Platform Support Issues & Ticket Center
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 font-medium">
            Review user-submitted support inquiries, technical bug reports, token-tracked requests, and live multi-party chat.
          </p>
        </div>

        <button
          onClick={fetchIssues}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2 text-xs font-black"
          title="Refresh Support Tickets"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Tickets
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Tickets</span>
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">{summary.total}</h3>
          <span className="text-[10px] text-slate-500 font-bold">All Network Inquiries</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Open Tickets</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-amber-600">{summary.open}</h3>
          <span className="text-[10px] text-amber-600 font-extrabold">Requires Attention</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">In Progress</span>
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-purple-600">{summary.inProgress}</h3>
          <span className="text-[10px] text-purple-600 font-extrabold">Under Review</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Resolved</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{summary.resolved}</h3>
          <span className="text-[10px] text-emerald-600 font-extrabold">Action Taken</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Closed</span>
            <Lock className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-700">{summary.closed || 0}</h3>
          <span className="text-[10px] text-slate-500 font-extrabold">Archived / Locked</span>
        </div>
      </div>

      {/* 3. Search and Status Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchIssues();
            }}
            placeholder="Search by token (e.g. NMX-TKT-2026-000123), user, email, subject..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-black text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2.5 rounded-2xl shadow-2xs text-xs font-extrabold">
            <span className="text-slate-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2.5 rounded-2xl shadow-2xs text-xs font-extrabold">
            <span className="text-slate-400 font-bold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Support Issues Table */}
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading support tickets...</p>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                <th className="p-4">Tracking Token & Info</th>
                <th className="p-4">Registered Contact</th>
                <th className="p-4">Subject & Description</th>
                <th className="p-4">Chat / Activity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action Console</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-black">
                    No support issues matching search/filter.
                  </td>
                </tr>
              ) : (
                issues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-blue-900 text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 block w-fit">
                          {item.ticketCode}
                        </span>
                        {getPriorityBadge(item.priority || 'MEDIUM')}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider block mt-1 text-slate-600">
                        {item.issueType?.replace('_', ' ') || 'TECHNICAL'}
                      </span>
                      {item.hospital?.name && (
                        <span className="text-[10px] text-slate-500 font-bold block truncate max-w-[160px]">
                          🏥 {item.hospital.name}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">{item.registeredName}</span>
                        {item.userRole && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.userRole}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600 text-[11px] font-bold block">📱 {item.mobile}</span>
                      <span className="text-blue-700 text-[11px] font-mono font-bold block">✉️ {item.email}</span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <span className="font-black text-slate-900 text-sm block">{item.subject}</span>
                      <p className="text-slate-700 text-[11px] font-semibold mt-1 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200/80 line-clamp-2">
                        "{item.description}"
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block mt-1">
                        Created: {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.messages?.length || 0} messages</span>
                        </div>
                        {item.attachmentUrl && (
                          <button
                            onClick={() => setPreviewImage(item.attachmentUrl)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-lg border border-purple-200 font-black text-[10px]"
                          >
                            <ImageIcon className="w-3 h-3" /> Screenshot
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openTicketModal(item)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md inline-flex items-center gap-1 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" /> Take Action <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. INTERACTIVE TICKET ACTION & CONVERSATION CONSOLE MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border text-xs flex flex-col overflow-hidden animate-in fade-in select-none text-slate-900">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border border-blue-200">
                    {selectedIssue.ticketCode}
                  </span>
                  {getStatusBadge(selectedIssue.status)}
                  {getPriorityBadge(selectedIssue.priority || 'MEDIUM')}
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    {selectedIssue.issueType?.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-tight mt-1">{selectedIssue.subject}</h3>
                <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium pt-0.5">
                  <span>User: <strong className="text-slate-800">{selectedIssue.registeredName}</strong> ({selectedIssue.userRole || 'User'})</span>
                  <span>•</span>
                  <span>Email: <strong className="text-blue-700">{selectedIssue.email}</strong></span>
                  <span>•</span>
                  <span>Tel: <strong className="text-slate-800">{selectedIssue.mobile}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-3 px-4 font-black text-xs border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Conversation & Chat ({selectedIssue.messages?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 font-black text-xs border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Ticket className="w-4 h-4" /> Issue Overview & Quick Status
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3 px-4 font-black text-xs border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" /> Audit Timeline Events ({selectedIssue.timelineEvents?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: CONVERSATION & CHAT */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {/* Messages Feed */}
                  <div className="space-y-3 min-h-[220px] max-h-[360px] overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    {(!selectedIssue.messages || selectedIssue.messages.length === 0) ? (
                      <div className="p-8 text-center text-slate-400 font-bold">
                        No messages recorded yet. Send a response to begin the conversation thread.
                      </div>
                    ) : (
                      selectedIssue.messages.map((msg: any) => {
                        const isAdmin = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'ADMIN';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-bold">
                              <span>{msg.senderName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] uppercase font-black">
                                {msg.senderRole}
                              </span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {msg.isInternal && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] rounded">
                                  INTERNAL STAFF NOTE
                                </span>
                              )}
                            </div>
                            <div
                              className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                                msg.isInternal
                                  ? 'bg-amber-50 border border-amber-300 text-amber-950'
                                  : isAdmin
                                  ? 'bg-blue-600 text-white rounded-tr-none'
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
                                    alt="Evidence"
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

                  {/* CLOSED TICKET LOCKDOWN BANNER OR MESSAGE INPUT */}
                  {selectedIssue.status === 'CLOSED' ? (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-900">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                        <div>
                          <p className="font-black text-xs">
                            This ticket is closed. Messaging and tracking updates are no longer available.
                          </p>
                          <p className="text-[11px] text-amber-800 font-medium">
                            Platform administrators may reopen this ticket below if further investigation is required.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus('OPEN')}
                        disabled={updating}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="space-y-2">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={newReplyMessage}
                          onChange={(e) => setNewReplyMessage(e.target.value)}
                          placeholder={isInternalNote ? "Write private internal note (visible only to support staff)..." : "Type an official support reply to the user (sent via email)..."}
                          className={`w-full pl-3 pr-24 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none shadow-2xs ${
                            isInternalNote
                              ? 'bg-amber-50/50 border-amber-300 text-amber-950 placeholder:text-amber-700/60 focus:ring-2 focus:ring-amber-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500'
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newReplyMessage.trim()}
                          className={`absolute right-2.5 bottom-2.5 px-4 py-1.5 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                            isInternalNote ? 'bg-amber-700 hover:bg-amber-800' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" /> {sendingMessage ? 'Saving...' : (isInternalNote ? 'Save Note' : 'Reply')}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer text-amber-900 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[10px]">Private Staff Note (Hidden from User)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus('WAITING_FOR_USER')}
                            disabled={updating}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            Mark "Waiting for User"
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: ISSUE DETAILS & QUICK STATUS CHANGE */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {/* Original Description */}
                  <div className="space-y-1">
                    <label className="font-black text-slate-900 block text-xs">Original Issue Description:</label>
                    <div className="p-4 bg-slate-100 rounded-2xl text-slate-900 font-bold text-xs leading-relaxed whitespace-pre-wrap border border-slate-200">
                      {selectedIssue.description}
                    </div>
                  </div>

                  {/* Attachment Preview if exists */}
                  {selectedIssue.attachmentUrl && (
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-700" />
                        <span className="font-black text-purple-900 text-xs">Screenshot Evidence Attached</span>
                      </div>
                      <button
                        onClick={() => setPreviewImage(selectedIssue.attachmentUrl)}
                        className="px-3 py-1 bg-purple-700 text-white rounded-xl font-bold text-xs hover:bg-purple-800 transition-colors"
                      >
                        View Full Screenshot
                      </button>
                    </div>
                  )}

                  {/* Status & Priority Controls */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Lifecycle Status & Priority Controls</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Update Status</label>
                        <select
                          value={actionStatus}
                          onChange={(e) => setActionStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black bg-white text-slate-900 shadow-2xs"
                        >
                          <option value="OPEN">OPEN (Pending Investigation)</option>
                          <option value="IN_PROGRESS">IN PROGRESS (Work underway)</option>
                          <option value="WAITING_FOR_USER">WAITING FOR USER (Response requested)</option>
                          <option value="WAITING_FOR_SUPPORT">WAITING FOR SUPPORT</option>
                          <option value="RESOLVED">RESOLVED (Solution provided)</option>
                          <option value="CLOSED">CLOSED (Archived & locked)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Ticket Priority</label>
                        <select
                          value={actionPriority}
                          onChange={(e) => setActionPriority(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black bg-white text-slate-900 shadow-2xs"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">Resolution Summary / Internal Notes</label>
                      <textarea
                        rows={2}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Resolution summary or admin internal notes..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {selectedIssue.status !== 'CLOSED' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus('CLOSED')}
                            disabled={updating}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" /> Close & Archive Ticket
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus('OPEN')}
                            disabled={updating}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus()}
                        disabled={updating}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" /> {updating ? 'Saving...' : 'Apply Status Change'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE & AUDIT TRAIL */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Ticket Lifecycle History & Events</h4>
                  {(!selectedIssue.timelineEvents || selectedIssue.timelineEvents.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                      No timeline events logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedIssue.timelineEvents.map((evt: any) => (
                        <div
                          key={evt.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs"
                        >
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                            {evt.type === 'CLOSED' ? <Lock className="w-3.5 h-3.5 text-slate-600" /> :
                             evt.type === 'REOPENED' ? <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> :
                             evt.type === 'CREATED' ? <Ticket className="w-3.5 h-3.5 text-emerald-600" /> :
                             evt.type === 'MESSAGE_POSTED' ? <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> :
                             <History className="w-3.5 h-3.5 text-purple-600" />}
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900">{evt.description}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(evt.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span>Actor: <strong>{evt.actorName}</strong></span>
                              <span>•</span>
                              <span className="uppercase font-extrabold text-slate-600">{evt.actorRole}</span>
                              {evt.oldStatus && evt.newStatus && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-purple-700 font-black">{evt.oldStatus} ➔ {evt.newStatus}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500 font-bold">
                Ticket ID: {selectedIssue.id}
              </span>
              <button
                onClick={() => setSelectedIssue(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULL RESOLUTION IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full p-2 bg-white rounded-3xl shadow-2xl">
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-slate-900 text-white rounded-full font-bold z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Full attachment evidence" className="w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
