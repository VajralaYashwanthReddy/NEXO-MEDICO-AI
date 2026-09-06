'use client';

import React, { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

export default function SupportIssuesAdminPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Action Modal State
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [actionStatus, setActionStatus] = useState('RESOLVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchIssues = () => {
    setLoading(true);
    let url = `/api/admin/support-issues?q=${encodeURIComponent(search)}`;
    if (statusFilter) {
      url += `&status=${statusFilter}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setIssues(data.issues || []);
        setSummary(data.summaryCards || { total: 0, open: 0, inProgress: 0, resolved: 0 });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter]);

  const handleTakeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/support-issues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedIssue.id,
          status: actionStatus,
          adminResponse: adminNotes
        })
      });
      if (res.ok) {
        setSelectedIssue(null);
        setAdminNotes('');
        fetchIssues();
      } else {
        alert('Failed to update ticket action');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
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
            Review user-submitted support inquiries, technical bug reports, onboarding requests, and screenshot evidence. Take live resolution actions.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Support Issues</span>
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">{summary.total} Tickets</h3>
          <span className="text-[10px] text-slate-500 font-bold">Submitted Across Network</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Open Tickets</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-amber-600">{summary.open} Pending</h3>
          <span className="text-[10px] text-amber-600 font-extrabold">Requires Admin Action</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">In Progress</span>
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-purple-600">{summary.inProgress} Tickets</h3>
          <span className="text-[10px] text-purple-600 font-extrabold">Currently Under Review</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Resolved & Closed</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{summary.resolved} Resolved</h3>
          <span className="text-[10px] text-emerald-600 font-extrabold">Action Completed</span>
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
            placeholder="Search by ticket code, user name, email, phone, subject..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-black text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-2xl shadow-2xs text-xs font-extrabold">
          <span className="text-slate-400 font-bold">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="">All Ticket Statuses</option>
            <option value="OPEN">Open (Pending Action)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
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
                <th className="p-4">Ticket Code & Category</th>
                <th className="p-4">Registered Contact</th>
                <th className="p-4">Issue Subject & Description</th>
                <th className="p-4">Evidence</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-black">
                    No support issues matching filter.
                  </td>
                </tr>
              ) : (
                issues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-black text-blue-900 text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 block w-fit">
                        {item.ticketCode}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider block mt-1 text-slate-600">
                        {item.issueType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-slate-900 text-sm block">{item.registeredName}</span>
                      <span className="text-slate-600 text-[11px] font-bold block">📱 {item.mobile}</span>
                      <span className="text-blue-700 text-[11px] font-mono font-bold block">✉️ {item.email}</span>
                    </td>
                    <td className="p-4 max-w-md">
                      <span className="font-black text-slate-900 text-sm block">{item.subject}</span>
                      <p className="text-slate-700 text-[11px] font-semibold mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        "{item.description}"
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block mt-1">
                        Submitted: {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.attachmentUrl ? (
                        <button
                          onClick={() => setPreviewImage(item.attachmentUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl border border-purple-200 font-black text-[11px] transition-all"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> View Evidence
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-semibold italic">No image</span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.status === 'OPEN' ? (
                        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px]">
                          OPEN
                        </span>
                      ) : item.status === 'IN_PROGRESS' ? (
                        <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 font-black text-[10px]">
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px]">
                          RESOLVED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIssue(item);
                          setActionStatus(item.status === 'OPEN' ? 'RESOLVED' : item.status);
                          setAdminNotes(item.adminResponse || '');
                        }}
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

      {/* 5. TAKE ACTION & RESOLVE ISSUE MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border text-xs space-y-4 animate-in fade-in select-none text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {selectedIssue.ticketCode}
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">{selectedIssue.subject}</h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registered User Contact Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-900">
              <div className="flex justify-between text-xs">
                <span>User: <strong className="text-slate-900 font-black">{selectedIssue.registeredName}</strong></span>
                <span>Mobile: <strong className="text-slate-900 font-black">{selectedIssue.mobile}</strong></span>
              </div>
              <div className="text-xs">
                <span>Email: <strong className="text-blue-700 font-black">{selectedIssue.email}</strong></span>
              </div>
            </div>

            {/* Full Issue Description */}
            <div className="space-y-1">
              <label className="font-black text-slate-900 block text-xs">Exact Issue Description:</label>
              <div className="p-4 bg-slate-100 rounded-2xl text-slate-900 font-bold text-xs leading-relaxed whitespace-pre-wrap border border-slate-200">
                {selectedIssue.description}
              </div>
            </div>

            {/* Action Form */}
            <form onSubmit={handleTakeAction} className="space-y-3 pt-2 border-t text-slate-900">
              <div>
                <label className="font-black text-slate-900 block mb-1">Update Ticket Status *</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black bg-white text-slate-900 shadow-2xs"
                >
                  <option value="IN_PROGRESS">IN PROGRESS (Reviewing Issue)</option>
                  <option value="RESOLVED">RESOLVED (Issue Fixed & Solved)</option>
                  <option value="CLOSED">CLOSED (Archived Ticket)</option>
                </select>
              </div>

              <div>
                <label className="font-black text-slate-900 block mb-1">Admin Action & Resolution Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter resolution notes, bug fix details or user instructions..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setSelectedIssue(null)} className="px-4 py-2 text-slate-500 font-black">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" /> {updating ? 'Saving Action...' : 'Save Resolution & Take Action'}
                </button>
              </div>
            </form>
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
