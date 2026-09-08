'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Ticket, KeyRound, UserPlus, Stethoscope, CheckCircle2, Image as ImageIcon, Phone, Mail, User, Upload, Mic, MicOff, Volume2, VolumeX, GripVertical, Move } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function FloatingAiChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceResponseEnabled, setIsVoiceResponseEnabled] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; isTicket?: boolean; ticketData?: any }>>([
    {
      sender: 'ai',
      text: "Hello! I am your Nexo AI Platform & Medical Intelligence Companion. Ask me about login issues, registration, platform modules, or medical symptoms. You can speak using the microphone or click 'Raise Ticket' anytime to send an official support ticket to our admins.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [thinking, setThinking] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);

  // Draggable Position State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const currentX = position ? position.x : (typeof window !== 'undefined' ? window.innerWidth - (isOpen ? 400 : 180) : 100);
    const currentY = position ? position.y : (typeof window !== 'undefined' ? window.innerHeight - (isOpen ? 600 : 80) : 100);

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY
    };

    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      let newX = dragStartRef.current.initialX + deltaX;
      let newY = dragStartRef.current.initialY + deltaY;

      newX = Math.max(10, Math.min(window.innerWidth - (isOpen ? 340 : 120), newX));
      newY = Math.max(10, Math.min(window.innerHeight - (isOpen ? 540 : 60), newY));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isOpen]);

  // Ticket Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [ticketCategory, setTicketCategory] = useState('LOGIN_ISSUE');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice Dictation (Speech Recognition)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please type your query.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setPrompt(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Recognition error:', e);
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto pre-fill user info when authenticated
  useEffect(() => {
    if (user) {
      if (user.name) setContactName(user.name);
      if (user.email) setContactEmail(user.email);
      setContactMobile('+1 (555) 012-3456');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showTicketForm]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg = queryText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: nowTime }]);
    setPrompt('');

    // Trigger Ticket Form if requested
    if (userMsg.toLowerCase().includes('raise ticket') || userMsg.toLowerCase().includes('create ticket')) {
      setShowTicketForm(true);
      return;
    }

    setThinking(true);

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      const aiReply = data.answer || data.result?.prediction || `Nexo AI Guidance: Stay hydrated and rest adequately. If you experience technical or login problems, click 'Raise Ticket'.`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTicket: Boolean(data.isTicket)
        }
      ]);
      if (isVoiceResponseEnabled) {
        speakText(aiReply);
      }
    } catch (err) {
      const fallbackReply = `Nexo AI Guidance for "${userMsg}": For medical symptoms, take Paracetamol 500mg after meals for mild pain/fever. For login/account issues, click 'Raise Ticket' to send a support ticket directly to our administration team.`;
      setMessages(prev => [...prev, { sender: 'ai', text: fallbackReply, time: nowTime }]);
      if (isVoiceResponseEnabled) {
        speakText(fallbackReply);
      }
    } finally {
      setThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(prompt);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    setSubmittingTicket(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const res = await fetch('/api/admin/support-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registeredName: contactName || user?.name || 'Registered User',
          email: contactEmail || user?.email || 'user@nexomedico.ai',
          mobile: contactMobile || '+1 (555) 012-3456',
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          issueType: ticketCategory,
          attachmentUrl
        })
      });
      const data = await res.json();
      const ticket = data.ticket;

      const ticketReply = `🎫 OFFICIAL SUPPORT TICKET RAISED LIVE:

✅ Ticket Code: ${ticket.ticketCode}
👤 Contact Name: ${ticket.registeredName}
✉️ Email: ${ticket.email}
📱 Mobile Phone: ${ticket.mobile}
📂 Issue Category: ${ticket.issueType}
📌 Subject: "${ticket.subject}"
📝 Description: "${ticket.description}"
${ticket.attachmentUrl ? '🖼️ Screenshot Evidence Attached: Yes' : ''}
🟢 Status: OPEN (Synced live to Platform Support Center)

Our platform super admin team has received your ticket and will process it live at /admin/support-issues.`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: ticketReply,
          time: nowTime,
          isTicket: true,
          ticketData: ticket
        }
      ]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('support-ticket-created'));
      }

      setShowTicketForm(false);
      setTicketSubject('');
      setTicketDescription('');
      setAttachmentUrl(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <>
      {/* ----------------- EXPANDED FLOATING CHATBOT DRAWER ----------------- */}
      {isOpen && (
        <div
          style={position ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' } : {}}
          className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 h-[560px] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 select-none text-slate-900"
        >
          {/* Chatbot Header (Draggable Handle) */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-3.5 text-white flex items-center justify-between border-b border-purple-800/40 shrink-0 cursor-move active:cursor-grabbing"
            title="Click & Drag to reposition AI Chatbot anywhere on screen"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing" title="Drag Handle">
                <GripVertical className="w-5 h-5 text-purple-400" />
              </div>
              <div className="w-8 h-8 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-xs flex items-center gap-1">
                  Nexo AI Platform & Support Bot <Sparkles className="w-3 h-3 text-cyan-400" />
                </h3>
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 24/7 Real-Time Support (Movable)
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Shortcut Pills */}
          <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 text-[10px]">
            <button
              onClick={() => sendQuery("How do I fix login issues or password problems?")}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-900 font-extrabold rounded-lg border border-purple-200 flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <KeyRound className="w-3 h-3 text-purple-600" /> Login Help
            </button>
            <button
              onClick={() => sendQuery("How does patient registration and doctor onboarding work?")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-900 font-extrabold rounded-lg border border-blue-200 flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <UserPlus className="w-3 h-3 text-blue-600" /> Registration
            </button>
            <button
              onClick={() => sendQuery("I have cold and fever, what medication can I take?")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Stethoscope className="w-3 h-3 text-emerald-600" /> Medical Q&A
            </button>
            <button
              onClick={() => setShowTicketForm(true)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg flex items-center gap-1 shrink-0 shadow-xs"
            >
              <Ticket className="w-3 h-3 text-white" /> Raise Ticket
            </button>
          </div>

          {/* Chat Logs Area */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs bg-slate-50/60 custom-scrollbar">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-3.5 rounded-2xl space-y-1.5 ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none shadow-md font-semibold'
                    : m.isTicket
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-bl-none shadow-sm font-semibold'
                    : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-none shadow-xs'
                }`}>
                  {m.sender === 'ai' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">
                        <Bot className="w-3 h-3 text-purple-600" /> Nexo AI Bot
                      </span>
                      {m.isTicket && (
                        <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                          TICKET GENERATED
                        </span>
                      )}
                    </div>
                  )}
                  <p className="leading-relaxed font-semibold text-[11px] whitespace-pre-line text-slate-900">{m.text}</p>

                  {/* Display Image Preview inside Ticket Chat Card if attached */}
                  {m.ticketData?.attachmentUrl && (
                    <div className="pt-2">
                      <span className="text-[9px] font-black text-slate-600 block mb-1">Attached Image Evidence:</span>
                      <img src={m.ticketData.attachmentUrl} alt="Evidence" className="w-full max-h-36 object-contain rounded-xl border bg-white" />
                    </div>
                  )}

                  {/* Add Raise Ticket Button if user has an unsolved issue */}
                  {m.sender === 'ai' && !m.isTicket && idx > 0 && !showTicketForm && (
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setShowTicketForm(true)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Ticket className="w-3 h-3 text-rose-600" /> Raise Support Ticket
                      </button>
                    </div>
                  )}

                  <span className={`text-[8px] block text-right font-mono ${m.sender === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* INTERACTIVE TICKET FORM CARD WITH CONTACT & IMAGE UPLOAD */}
            {showTicketForm && (
              <div className="p-4 bg-white border-2 border-purple-400/80 rounded-2xl shadow-xl space-y-3 animate-in fade-in text-slate-900">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-purple-600" />
                    <span className="font-black text-xs text-purple-900">Raise Support Ticket & Attach Evidence</span>
                  </div>
                  <button onClick={() => setShowTicketForm(false)} className="text-slate-400 hover:text-slate-600 font-black text-xs">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateTicketSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Mobile Phone *</label>
                      <input
                        type="text"
                        required
                        value={contactMobile}
                        onChange={(e) => setContactMobile(e.target.value)}
                        placeholder="+1 (555) 012-3456"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Issue Category *</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs"
                    >
                      <option value="LOGIN_ISSUE">🔐 Login / Password Issue</option>
                      <option value="REGISTRATION_ISSUE">📝 Registration / Onboarding</option>
                      <option value="TECHNICAL">⚙️ Technical / System Bug</option>
                      <option value="BILLING">💳 Billing Inquiry</option>
                      <option value="MEDICAL">🏥 Medical / Clinical Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Issue Subject *</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g. Cannot login with email john@gmail.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Detailed Description *</label>
                    <textarea
                      rows={2}
                      required
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Describe the exact error or problem..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-900 shadow-2xs"
                    />
                  </div>

                  {/* Screenshot / Image Evidence Attachment */}
                  <div>
                    <label className="font-extrabold text-slate-900 block text-[9px] mb-1">Attach Screenshot Evidence (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                    />
                    {attachmentUrl && (
                      <div className="mt-1.5 p-1 bg-slate-100 border rounded-lg flex items-center gap-2">
                        <img src={attachmentUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
                        <span className="text-[9px] text-emerald-700 font-bold">Image evidence attached</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-1 transition-all mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {submittingTicket ? 'Submitting Ticket...' : 'Submit Official Ticket Live'}
                  </button>
                </form>
              </div>
            )}

            {thinking && (
              <div className="flex justify-start">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-2 text-[11px] text-purple-700 font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>Nexo AI running real-time clinical analysis...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer Form */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Listening... Speak now!" : "Click to speak (Voice Recognition)"}
              className={`p-2 rounded-xl border font-bold text-xs transition-all shrink-0 flex items-center gap-1 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-purple-600" />}
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceResponseEnabled(!isVoiceResponseEnabled)}
              title={isVoiceResponseEnabled ? "Voice Response Audio Enabled (Click to Mute)" : "Enable Voice Response Audio Output"}
              className={`p-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                isVoiceResponseEnabled
                  ? 'bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-400'
                  : 'bg-slate-100 text-slate-400 border-slate-300'
              }`}
            >
              {isVoiceResponseEnabled ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : "Ask AI bot (e.g. login issue, fever)..."}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-2xs"
            />
            <button
              type="submit"
              disabled={thinking || !prompt.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ----------------- SMALL FLOATING ROBOT AI BOT BUTTON ----------------- */}
      {!isOpen && (
        <div
          style={position ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' } : {}}
          className="fixed bottom-6 right-6 z-50 flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl ring-4 ring-purple-400/30 select-none animate-in fade-in"
        >
          {/* Drag handle grip */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="pl-2.5 py-3.5 cursor-grab active:cursor-grabbing text-purple-200 hover:text-white flex items-center justify-center"
            title="Click & Drag to reposition AI Bot anywhere"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Toggle Chatbot Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="py-3.5 pr-4 pl-1 text-white flex items-center justify-center gap-2 group transition-all cursor-pointer"
            title="Click to Open Nexo AI Platform & Support Bot"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <span className="text-xs font-black tracking-tight hidden sm:inline">
              Nexo AI Bot
            </span>
          </button>
        </div>
      )}
    </>
  );
}
