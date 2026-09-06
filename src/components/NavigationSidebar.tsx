'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContactUsModal } from '@/components/ContactUsModal';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  BedDouble,
  HeartPulse,
  BarChart3,
  ShieldCheck,
  LogOut,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Activity,
  Key,
  Layers,
  FileSpreadsheet,
  Globe,
  Headphones,
  LifeBuoy,
  Cpu
} from 'lucide-react';

export const NavigationSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showContactUs, setShowContactUs] = useState(false);

  if (!user) return null;

  const role = user.role;
  const isPlatformSuperAdmin = role === 'SUPER_ADMIN';
  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const isHrAdmin = role === 'HR_ADMIN' || role === 'STAFF' || role === 'RECEPTIONIST';

  // 1. Platform Master Admin Navigation Sections (Super Admin)
  const platformAdminSections = [
    {
      title: 'PLATFORM GOVERNANCE',
      items: [
        { label: 'Platform Master Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Registered Hospitals', href: '/admin/hospitals', icon: Building2 },
        { label: 'Universal Patient Registry', href: '/admin/patients', icon: UserCheck },
        { label: 'Global User Accounts', href: '/admin/users', icon: Users },
        { label: 'Support & Issue Tickets', href: '/admin/support-issues', icon: Headphones },
      ]
    },
    {
      title: 'PLATFORM OPERATIONS',
      items: [
        { label: 'Global Operations Control', href: '/admin/operations', icon: Layers },
        { label: 'AI Platform Engines', href: '/admin/ai-engines', icon: Cpu },
        { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Platform Security Center', href: '/admin/security', icon: ShieldCheck },
        { label: 'System Health Monitor', href: '/admin/system', icon: Activity },
        { label: 'Global Audit Logs', href: '/admin/audit-logs', icon: FileSpreadsheet },
      ]
    }
  ];

  // 2. Hospital Tenant Admin Navigation Sections (Hospital Administrator)
  const hospitalAdminSections = [
    {
      title: 'HOSPITAL MANAGEMENT',
      items: [
        { label: 'Hospital Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Hospital Profile & Settings', href: '/admin/hospitals', icon: Building2 },
        { label: 'Departments', href: '/admin/departments', icon: Layers },
      ]
    },
    {
      title: 'CLINICAL STAFF',
      items: [
        { label: 'Physicians / Doctors', href: '/admin/doctors', icon: Stethoscope },
        { label: 'Nursing Staff', href: '/admin/staff', icon: HeartPulse },
      ]
    },
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        { label: 'Hospital Patients', href: '/admin/patients', icon: UserCheck },
        { label: 'Appointments Schedule', href: '/admin/appointments', icon: Calendar },
        { label: 'Inpatient Wards & Beds', href: '/admin/wards', icon: BedDouble },
        { label: 'ICU Control Center', href: '/admin/icu', icon: HeartPulse },
      ]
    },
    {
      title: 'DIAGNOSTICS & PHARMACY',
      items: [
        { label: 'Laboratory & OCR Reports', href: '/admin/laboratory', icon: FlaskConical },
        { label: 'Pharmacy & Drug Stock', href: '/admin/pharmacy', icon: Pill },
      ]
    }
  ];

  // 3. HR Admin Navigation Sections (Human Resources Administrator)
  const hrAdminSections = [
    {
      title: 'HUMAN RESOURCES MANAGEMENT',
      items: [
        { label: 'HR Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Hospital Staff & Employees', href: '/admin/staff', icon: Users },
        { label: 'Departments & Allocations', href: '/admin/departments', icon: Layers },
      ]
    },
    {
      title: 'CLINICAL & PATIENTS REGISTRY',
      items: [
        { label: 'Attending Doctors', href: '/admin/doctors', icon: Stethoscope },
        { label: 'Hospital Patient Directory', href: '/admin/patients', icon: UserCheck },
      ]
    }
  ];

  // Role-specific navigation lists for Doctors, Nurses, Pharmacists, Lab Techs, Patients
  const doctorNav = [
    { label: 'Doctor Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Patient Appointments Schedule', href: '/doctor/appointments', icon: Calendar },
    { label: 'Patients & Timelines', href: '/doctor/patients', icon: UserCheck },
    { label: 'AI Clinical Engines', href: '/patient/ai-engines', icon: Sparkles },
    { label: 'Prescription Engine', href: '/doctor/prescriptions', icon: Pill },
    { label: 'Lab Reports', href: '/doctor/lab-reports', icon: FlaskConical },
    { label: 'Radiology Workspace', href: '/doctor/radiology', icon: Sparkles },
  ];

  const pharmaNav = [
    { label: 'Pharmacy Dashboard', href: '/pharmacy/dashboard', icon: LayoutDashboard },
    { label: 'Prescriptions Queue', href: '/pharmacy/prescriptions', icon: ClipboardList },
    { label: 'Medicine Inventory', href: '/pharmacy/inventory', icon: Pill },
    { label: 'Drug Interaction Check', href: '/pharmacy/drug-checker', icon: AlertTriangle },
  ];

  const labNav = [
    { label: 'Lab Dashboard', href: '/laboratory/dashboard', icon: LayoutDashboard },
    { label: 'Test Orders', href: '/laboratory/orders', icon: ClipboardList },
    { label: 'OCR Report Upload', href: '/laboratory/ocr-upload', icon: FlaskConical },
  ];

  const nurseNav = [
    { label: 'Nurse Dashboard', href: '/nurse/dashboard', icon: LayoutDashboard },
    { label: 'Inpatient Wards & Beds', href: '/nurse/beds', icon: BedDouble },
    { label: 'ICU Monitoring Logs', href: '/nurse/icu-logs', icon: HeartPulse },
  ];

  const patientNav = [
    { label: 'Patient Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'AI Clinical Engines', href: '/patient/ai-engines', icon: Sparkles },
    { label: 'My Medical Timeline', href: '/patient/timeline', icon: FileText },
    { label: 'My Prescriptions', href: '/patient/prescriptions', icon: Pill },
    { label: 'My Lab Reports', href: '/patient/lab-reports', icon: FlaskConical },
    { label: 'Personalized Health Score', href: '/patient/health-score', icon: HeartPulse },
  ];

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between border-r border-slate-800 shadow-xl select-none">
        <div>
          {/* Hospital Branding Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Nexo Medico AI
              </h1>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                {isPlatformSuperAdmin ? 'Platform Admin Scope' : 'Hospital Management'}
              </p>
            </div>
          </div>

          {/* Tenant Indicator */}
          <div className="mx-4 my-3 px-3 py-2 bg-slate-800/70 rounded-lg border border-slate-700/50 flex items-center gap-2">
            {isPlatformSuperAdmin ? (
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <div className="truncate">
              <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                {isPlatformSuperAdmin ? 'Application Scope' : 'Active Organization'}
              </p>
              <p className="text-xs font-semibold text-slate-200 truncate">
                {isPlatformSuperAdmin ? 'All Platform Tenants' : (user.hospitalName || 'Metropolitan Hospital')}
              </p>
            </div>
          </div>

          {/* User Role Badge */}
          <div className="px-6 py-1 mb-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Navigation</span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
              isPlatformSuperAdmin
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800/50'
                : isHospitalAdmin
                ? 'bg-blue-950 text-blue-300 border-blue-800/50'
                : 'bg-purple-950 text-purple-300 border-purple-800/50'
            }`}>
              {isPlatformSuperAdmin ? 'PLATFORM ADMIN' : isHospitalAdmin ? 'HOSPITAL ADMIN' : role.replace('_', ' ')}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-4 custom-scrollbar max-h-[calc(100vh-290px)] overflow-y-auto pb-4">
            {isPlatformSuperAdmin ? (
              platformAdminSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    {sec.title}
                  </span>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))
            ) : isHospitalAdmin ? (
              hospitalAdminSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    {sec.title}
                  </span>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))
            ) : isHrAdmin ? (
              hrAdminSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    {sec.title}
                  </span>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))
            ) : (
              (role === 'DOCTOR' ? doctorNav : role === 'PHARMACIST' ? pharmaNav : role === 'LAB_TECH' ? labNav : role === 'NURSE' || role === 'ICU_STAFF' ? nurseNav : patientNav).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Contact Us & Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
          {/* Contact Us button ONLY for Hospital Admin, Patient, Doctor, Nurse, Pharmacist, Lab Tech (Hidden for Platform Admin) */}
          {!isPlatformSuperAdmin && (
            <button
              onClick={() => setShowContactUs(true)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-extrabold rounded-xl border border-slate-700/60 flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Headphones className="w-4 h-4 text-cyan-400" /> Contact Us / Report Issue
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Global Contact Us Modal */}
      <ContactUsModal isOpen={showContactUs} onClose={() => setShowContactUs(false)} />
    </>
  );
};
