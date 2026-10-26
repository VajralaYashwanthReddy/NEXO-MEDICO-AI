'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Headphones,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Send,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  ShieldCheck,
  Paperclip,
  X,
  History,
  MessageSquare,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Mail,
  User,
  Phone,
  Tag
} from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Messaging & Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Email retry state
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [emailRetryMsg, setEmailRetryMsg] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'conversation' | 'timeline'>('conversation');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/support/issues/${encodeURIComponent(ticketId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load support ticket');
      }

      setTicket(data.ticket);
    } catch (err: any) {
      console.error('Fetch ticket error:', err);
      setError(err.message || 'Error loading support ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  useEffect(() => {
    if (activeTab === 'conversation' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages, activeTab]);

  const handleCopyToken = () => {
    if (!ticket?.ticketCode) return;
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Attachment exceeds maximum permitted size of 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReplyAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyMessage.trim()) return;

    if (ticket.status === 'CLOSED') {
      alert('This ticket is closed. Messaging and tracking updates are locked.');
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/issues/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          attachmentUrl: replyAttachment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReplyMessage('');
        setReplyAttachment(null);
        setTicket(data.ticket);
      } else {
        alert(data.error || 'Failed to send reply');
      }
    } catch (err: any) {
      console.error('Send reply error:', err);
      alert('Network or server error while posting reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleRetryEmail = async () => {
    if (!ticket) return;
    setRetryingEmail(true);
    setEmailRetryMsg('');

    try {
      const res = await fetch(`/api/support/issues/${ticket.id}/retry-email`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setEmailRetryMsg('Confirmation email was successfully dispatched via Gmail SMTP.');
        fetchTicket();
      } else {
        setEmailRetryMsg(data.error || 'Email retry failed.');
      }
    } catch (err: any) {
      setEmailRetryMsg('Network error while retrying email delivery.');
    } finally {
      setRetryingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> OPEN — Awaiting Support Review
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 font-black text-xs inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-700" /> IN PROGRESS
          </span>
        );
      case 'WAITING_FOR_USER':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 font-black text-xs inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-700" /> ACTION NEEDED — Specialist Replied
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 border border-slate-300 font-black text-xs inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-700" /> CLOSED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 font-black text-xs">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-black text-[10px]">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 border border-orange-300 font-black text-[10px]">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 font-black text-[10px]">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 font-black text-[10px]">LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
            Loading Support Ticket Details...
          </span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Support Ticket Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'The requested ticket could not be found or you do not have permission to view it.'}
          </p>
          <button
            onClick={() => router.push('/support')}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Support Center
          </button>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';
  const hasPhone = ticket.mobile && ticket.mobile !== 'Not Provided' && ticket.mobile.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/support')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              title="Back to Tickets"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200 text-sm">
                  {ticket.ticketCode}
                </span>
                <button
                  onClick={handleCopyToken}
                  className="p-1 text-slate-400 hover:text-cyan-700 rounded transition-colors"
                  title="Copy Token"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                {getStatusBadge(ticket.status)}
              </div>
              <h1 className="text-sm font-black text-slate-900 truncate max-w-xl mt-0.5">
                {ticket.subject}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Initial Response Target
              </span>
              <span className="text-xs font-black text-cyan-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Within 24 Hours
              </span>
            </div>
            <button
              onClick={() => fetchTicket()}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh Ticket"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Conversation & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Email Notification Status Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${ticket.emailStatus === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      Email Notification Delivery:
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${ticket.emailStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {ticket.emailStatus === 'SENT' ? 'DISPATCHED' : (ticket.emailStatus === 'FAILED' ? 'SUBMISSION FAILED' : 'PENDING')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ticket.emailStatus === 'SENT'
                      ? `Confirmation email accepted by Gmail SMTP and dispatched to registered address (${ticket.email}).`
                      : `The ticket is securely registered in PostgreSQL, but confirmation email could not be delivered.`}
                  </p>
                  {emailRetryMsg && (
                    <p className="text-[11px] text-cyan-700 font-bold mt-1">{emailRetryMsg}</p>
                  )}
                </div>
              </div>

              {ticket.emailStatus !== 'SENT' && (
                <button
                  onClick={handleRetryEmail}
                  disabled={retryingEmail}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${retryingEmail ? 'animate-spin' : ''}`} />
                  {retryingEmail ? 'Retrying...' : 'Retry Email'}
                </button>
              )}
            </div>
          </div>

          {/* Conversation & Timeline Card */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[650px]">
            {/* Tab Selector */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('conversation')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'conversation'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Support Conversation ({ticket.messages?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'timeline'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Status Timeline ({ticket.timelineEvents?.length || 0})
                </button>
              </div>

              {isClosed && (
                <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1">
                  <Lock className="w-3 h-3" /> TICKET CLOSED
                </span>
              )}
            </div>

            {/* Tab 1: Messages Conversation */}
            {activeTab === 'conversation' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Original Ticket Description Callout */}
                  <div className="p-4 bg-cyan-50/50 border border-cyan-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-cyan-800 font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-cyan-600" /> Original Inquiry: {ticket.issueType}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {ticket.description}
                    </p>
                    {ticket.attachmentUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold text-cyan-700 block mb-1">Attached Evidence:</span>
                        <img
                          src={ticket.attachmentUrl}
                          alt="Ticket Evidence"
                          onClick={() => setPreviewImage(ticket.attachmentUrl)}
                          className="w-24 h-24 rounded-xl object-cover border border-cyan-200 shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>

                  {/* Message Thread */}
                  {ticket.messages?.map((msg: any) => {
                    const isCurrentUser = msg.senderId === user?.id;
                    const isStaffSender = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'HOSPITAL_ADMIN';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-bold">
                          <span>{msg.senderName}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-extrabold">
                            {msg.senderRole}
                          </span>
                          <span>&bull;</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isInternal && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] rounded">
                              INTERNAL STAFF NOTE
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                            msg.isInternal
                              ? 'bg-amber-50 border border-amber-200 text-amber-950'
                              : isCurrentUser
                              ? 'bg-cyan-600 text-white font-medium rounded-br-xs'
                              : isStaffSender
                              ? 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-xs'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-slate-200/40">
                              <img
                                src={msg.attachmentUrl}
                                alt="Attachment"
                                onClick={() => setPreviewImage(msg.attachmentUrl)}
                                className="w-20 h-20 rounded-lg object-cover border cursor-pointer hover:opacity-90"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Bar */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  {isClosed ? (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500" />
                      This ticket is marked as CLOSED. Further replies are locked.
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="space-y-2">
                      {replyAttachment && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl w-fit">
                          <img src={replyAttachment} alt="Preview" className="w-6 h-6 rounded object-cover" />
                          <span className="text-[11px] font-bold text-slate-600">Attachment ready</span>
                          <button
                            type="button"
                            onClick={() => setReplyAttachment(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <label className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl cursor-pointer transition-colors" title="Attach Image">
                          <Upload className="w-5 h-5" />
                          <input type="file" accept="image/*" onChange={handleImageAttachment} className="hidden" />
                        </label>
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your response to support specialists..."
                          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" /> {sendingReply ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Status Timeline & Audit Trail */}
            {activeTab === 'timeline' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="border-l-2 border-cyan-200 ml-4 space-y-6">
                  {ticket.timelineEvents?.map((evt: any) => (
                    <div key={evt.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-600 border-4 border-white shadow-xs" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{evt.description}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold">
                            {evt.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <span>By {evt.actorName} ({evt.actorRole})</span>
                          <span>&bull;</span>
                          <span>{new Date(evt.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Ground-Truth Contact & Metadata Card */}
        <div className="space-y-4">
          {/* Registered Contact Snapshot */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Registered Contact Snapshot</h3>
                <p className="text-[11px] text-slate-500">Database ground-truth identity at ticket creation.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Registered Name
                </span>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800">
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>{ticket.registeredName}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Registered Email
                </span>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 truncate">
                  <Mail className="w-4 h-4 text-cyan-600" />
                  <span className="truncate">{ticket.email}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Registered Mobile Number
                </span>
                {hasPhone ? (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 font-mono">
                    <Phone className="w-4 h-4 text-cyan-600" />
                    <span>{ticket.mobile}</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> No mobile number registered
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push('/patient/dashboard')}
                      className="text-[10px] text-cyan-700 underline font-black"
                    >
                      Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Information & SLA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-black text-slate-900 text-sm border-b pb-2">Ticket Specifications</h3>
            
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-bold">Category:</span>
              <span className="font-extrabold text-slate-800">{ticket.issueType}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-bold">Priority:</span>
              {getPriorityBadge(ticket.priority)}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-bold">Created At:</span>
              <span className="font-semibold text-slate-700">
                {new Date(ticket.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
              </span>
            </div>

            {ticket.hospital && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Hospital Tenant:</span>
                <span className="font-extrabold text-slate-800">{ticket.hospital.name}</span>
              </div>
            )}

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl mt-3">
              <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block mb-1">
                Support Service Target
              </span>
              <p className="text-[11px] text-cyan-900 leading-relaxed font-medium">
                Our support engineering team aims to review and provide an initial response within 24 hours of submission.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Full Image Preview Modal */}
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
