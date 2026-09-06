'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Headphones, X, Upload, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Send } from 'lucide-react';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    registeredName: user?.name || '',
    mobile: '+1 (555) 012-3456',
    email: user?.email || '',
    issueType: 'TECHNICAL',
    subject: '',
    description: '',
    attachmentUrl: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setSubmitting(true);

    try {
      const res = await fetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedTicket(data.issue);
      } else {
        alert(data.error || 'Failed to submit support issue');
      }
    } catch (err) {
      console.error('Support submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setImagePreview(null);
    setFormData({
      registeredName: user?.name || '',
      mobile: '+1 (555) 012-3456',
      email: user?.email || '',
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
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                24/7 Platform Support & Help Desk
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">Contact Us & Report an Issue</h3>
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
              <h4 className="font-black text-slate-900 text-base">Issue Ticket Submitted Successfully!</h4>
              <p className="text-slate-500 text-xs">Platform Admin team has received your ticket and will take action shortly.</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-left space-y-1 text-xs">
              <div><span className="text-slate-400 font-bold">Ticket Code:</span> <strong className="text-cyan-800 font-extrabold bg-cyan-50 px-2 py-0.5 rounded">{submittedTicket.ticketCode}</strong></div>
              <div><span className="text-slate-400 font-bold">Registered Name:</span> <strong className="text-slate-800">{submittedTicket.registeredName}</strong></div>
              <div><span className="text-slate-400 font-bold">Mobile Number:</span> <strong className="text-slate-800">{submittedTicket.mobile}</strong></div>
              <div><span className="text-slate-400 font-bold">Email:</span> <strong className="text-slate-800">{submittedTicket.email}</strong></div>
              <div><span className="text-slate-400 font-bold">Issue Subject:</span> <strong className="text-slate-800">{submittedTicket.subject}</strong></div>
              <div><span className="text-slate-400 font-bold">Ticket Status:</span> <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">OPEN (Pending Admin Review)</span></div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-3 text-slate-900">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Registered Name *</label>
                <input
                  type="text"
                  required
                  value={formData.registeredName}
                  onChange={(e) => setFormData({ ...formData, registeredName: e.target.value })}
                  placeholder="e.g. Dr. Sarah Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@hospital.org"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Issue Category *</label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                >
                  <option value="TECHNICAL">Technical Issue / Bug</option>
                  <option value="HOSPITAL_ONBOARDING">Hospital Onboarding & Access</option>
                  <option value="BILLING">Billing & Subscription</option>
                  <option value="GENERAL">General Support Query</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Issue Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the issue..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Detailed Description of Issue *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened, step-by-step details or error messages..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Optional Image Attachment Screenshot */}
            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Attach Optional Image / Screenshot</label>
              <div className="flex items-center gap-3">
                <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-extrabold text-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                  <Upload className="w-4 h-4 text-blue-600" /> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img src={imagePreview} alt="Screenshot Attachment" className="w-9 h-9 rounded-lg object-cover border" />
                    <span className="text-[10px] text-emerald-600 font-extrabold">Image Attached!</span>
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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5 fill-white" /> {submitting ? 'Submitting Issue...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
