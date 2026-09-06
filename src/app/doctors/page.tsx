'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Search,
  Building2,
  Phone,
  Mail,
  Heart,
  CheckCircle2,
  ArrowRight,
  Headphones,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  UserCheck,
  Award,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import { ContactUsModal } from '@/components/ContactUsModal';

export default function PublicDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState<any>(null);

  const fetchDoctors = (q = search) => {
    fetch(`/api/admin/doctors?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => setDoctors(data.doctors || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors(search);
    const interval = setInterval(() => {
      fetchDoctors(search);
    }, 5000);
    return () => clearInterval(interval);
  }, [search]);

  const specializations = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  const filteredDoctors = specFilter
    ? doctors.filter(d => d.specialization === specFilter)
    : doctors;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans w-full select-none selection:bg-blue-500 selection:text-white">
      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 md:px-12 py-3.5 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Heart className="w-6 h-6 fill-white text-blue-600" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-slate-900 leading-tight block">
              NEXO MEDICO AI
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
              Healthcare Intelligence Platform
            </span>
          </div>
        </Link>

        {/* Center Header Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">Overview</Link>
          <Link href="/hospitals" className="hover:text-blue-600 transition-colors">Hospitals</Link>
          <Link href="/doctors" className="text-blue-600 font-extrabold">Doctors</Link>
          <Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link>
          <Link href="/#workflow" className="hover:text-blue-600 transition-colors">Workflow</Link>
          <Link href="/#ecosystem" className="hover:text-blue-600 transition-colors">Ecosystem</Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            onClick={() => setShowContactModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5 text-blue-600" />
            <span>Contact Support</span>
          </button>

          <Link
            href="/login"
            className="px-4 py-2 text-slate-700 hover:text-blue-600 font-bold rounded-xl transition-all"
          >
            Login
          </Link>

          <button
            onClick={() => setShowGetStartedModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. PAGE HEADER BANNER */}
      <div className="bg-white border-b border-slate-200/80 px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-widest">
              🩺 Registered Medical Specialists ({filteredDoctors.length} Active Doctors)
            </div>
            <button
              onClick={() => fetchDoctors(search)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Directory
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Registered Doctors & Attending Physicians Directory
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Browse verified attending physicians, medical specialists, hospital affiliations, and clinical qualifications across the Nexo Medico AI national healthcare network.
          </p>

          {/* Search & Specialization Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 max-w-3xl">
            <div className="relative w-full flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search physician by name, specialization, or hospital..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none shadow-2xs"
              />
            </div>

            {specializations.length > 0 && (
              <select
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-extrabold text-slate-900 focus:outline-none"
              >
                <option value="">All Specializations</option>
                {specializations.map((s: any) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 3. DOCTOR CARDS GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
        {loading && doctors.length === 0 ? (
          <p className="text-center py-16 text-xs text-slate-500 font-semibold">Loading registered physician directory...</p>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">No Matching Doctors Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search keywords or specialization filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xl transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-extrabold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active Physician
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-snug">
                      {doc.user?.name || 'Dr. Attending Physician'}
                    </h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-extrabold">
                      {doc.specialization || 'General Medicine'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <p className="flex items-center gap-2 font-semibold">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{doc.hospital?.name || 'Affiliated Hospital Network'}</span>
                    </p>
                    {doc.department && (
                      <p className="flex items-center gap-2 font-medium text-slate-500">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Department: {doc.department.name}</span>
                      </p>
                    )}
                    {doc.hospital?.city && (
                      <p className="flex items-center gap-2 font-medium text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{doc.hospital.city}</span>
                      </p>
                    )}
                    {doc.user?.email && (
                      <p className="flex items-center gap-2 font-medium text-slate-500">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{doc.user.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Resource Badges & Action */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-600" /> Verified License
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      ID: {doc.employeeId || 'EMP-DOC'}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedDoctorDetail(doc)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    View Doctor Profile <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 4. DOCTOR DETAIL MODAL */}
      {selectedDoctorDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedDoctorDetail.user?.name || 'Dr. Physician'}</h3>
                  <span className="text-[10px] font-extrabold text-emerald-600">{selectedDoctorDetail.specialization}</span>
                </div>
              </div>
              <button onClick={() => setSelectedDoctorDetail(null)} className="text-slate-400 hover:text-slate-600 font-extrabold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div><span className="text-slate-400 font-bold block text-[10px]">SPECIALIZATION:</span> <strong className="text-slate-800 text-xs">{selectedDoctorDetail.specialization || 'General Practitioner'}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">HOSPITAL TENANT:</span> <strong className="text-blue-700">{selectedDoctorDetail.hospital?.name}</strong></div>
              {selectedDoctorDetail.department && (
                <div><span className="text-slate-400 font-bold block text-[10px]">DEPARTMENT:</span> <strong className="text-slate-800">{selectedDoctorDetail.department.name}</strong></div>
              )}
              {selectedDoctorDetail.user?.email && (
                <div><span className="text-slate-400 font-bold block text-[10px]">OFFICIAL EMAIL:</span> <strong className="text-slate-800">{selectedDoctorDetail.user.email}</strong></div>
              )}
              {selectedDoctorDetail.hospital?.phone && (
                <div><span className="text-slate-400 font-bold block text-[10px]">HOSPITAL CONTACT:</span> <strong className="text-slate-800">{selectedDoctorDetail.hospital.phone}</strong></div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified licensed attending physician on the Nexo Medico AI network.</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow"
              >
                Sign In to Book Appointment
              </Link>

              <button
                onClick={() => setSelectedDoctorDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white font-extrabold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GET STARTED REGISTRATION CHOICE MODAL */}
      {showGetStartedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                  Registration Portal
                </span>
                <h3 className="font-black text-slate-900 text-lg">Get Started with Nexo Medico AI</h3>
              </div>
              <button onClick={() => setShowGetStartedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-500 text-xs">
              Select your registration type below to initialize your account or onboard your organization:
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/register"
                onClick={() => setShowGetStartedModal(false)}
                className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-700 group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500 text-white rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-white">Hospital & Organization Onboarding</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed max-w-xs pt-1">
                    Register a new hospital or medical center. Set up departments, bed grid, staff, and hospital admin credentials.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              <Link
                href="/patient/register"
                onClick={() => setShowGetStartedModal(false)}
                className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all border border-blue-200 group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">Patient Universal Account Registration</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed max-w-xs pt-1">
                    Register a patient account with Universal Patient ID (`NEXO-PAT-xxxxxx`) to access prescriptions & reports across hospitals.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      <ContactUsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
}
