'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Headphones,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Send,
  MessageSquare,
  Lock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Phone
} from 'lucide-react';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();

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

  const [formData, setFormData] = useState({
    issueType: 'TECHNICAL',
    subject: '',
    description: '',
    attachmentUrl: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/support/user-contact')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setContactInfo(data);
        })
        .catch(err => console.warn('Could not load user contact details:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Attachment exceeds maximum permitted size of 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData(prev => ({ ...prev, attachmentUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Please fill out Subject and Description');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          issueType: formData.issueType,
          priority: 'MEDIUM',
          attachmentUrl: formData.attachmentUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedTicket(data.ticket);
      } else {
        alert(data.error || 'Failed to submit support issue');
      }
    } catch (err) {
      console.error('Support submission failed:', err);
      alert('Network or server error while submitting support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!submittedTicket?.ticketCode) return;
    navigator.clipboard.writeText(submittedTicket.ticketCode);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setImagePreview(null);
    setFormData({
      issueType: 'TECHNICAL',
      subject: '',
      description: '',
      attachmentUrl: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest block">
                24/7 Platform Support &amp; Help Desk
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">Contact Us &amp; Raise a Ticket</h3>
            </div>
          </div>
          <button onClick={handleResetAndClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedTicket ? (
          /* Confirmation View */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-base">Support Ticket Created Successfully!</h4>
              <p className="text-slate-500 text-xs">
                Our team aims to respond within 24 hours. A confirmation email was sent to your registered email.
              </p>
            </div>

            <div className="p-4 bg-white border border-cyan-200 rounded-xl space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Ticket Token:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 text-xs">
                    {submittedTicket.ticketCode}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-1 text-cyan-600 hover:bg-cyan-50 rounded"
                    title="Copy Ticket Token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[11px] font-bold text-slate-500">Registered Email:</span>
                <span className="font-semibold text-slate-800">{submittedTicket.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[11px] font-bold text-slate-500">Status:</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[10px]">
                  {submittedTicket.status} (Awaiting Review)
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  handleResetAndClose();
                  router.push(`/support/tickets/${submittedTicket.ticketCode || submittedTicket.id}`);
                }}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
              >
                <MessageSquare className="w-4 h-4" /> Track Ticket &amp; Open Chat
              </button>
              <button
                onClick={handleResetAndClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all text-xs"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-3 text-slate-900">
            {/* Registered Account Contact Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
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
                        onClose();
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

            {/* Issue Category & Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Issue Category *</label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                >
                  <option value="TECHNICAL">Technical Issue / Bug</option>
                  <option value="HOSPITAL_ONBOARDING">Hospital Onboarding &amp; Access</option>
                  <option value="BILLING">Billing &amp; Subscription</option>
                  <option value="CLINICAL">Clinical / Prescription</option>
                  <option value="GENERAL">General Support Query</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Issue Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Bed allocation module error"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Detailed Description of Issue *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened, step-by-step details or error messages..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Optional Image Attachment Screenshot */}
            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Attach Optional Image / Screenshot</label>
              <div className="flex items-center gap-3">
                <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-extrabold text-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                  <Upload className="w-4 h-4 text-cyan-600" /> Upload Screenshot
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img src={imagePreview} alt="Screenshot Attachment" className="w-9 h-9 rounded-lg object-cover border" />
                    <span className="text-[10px] text-emerald-600 font-extrabold">Screenshot Attached!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={handleResetAndClose} className="px-4 py-2 text-slate-500 font-extrabold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 fill-white" /> {submitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
