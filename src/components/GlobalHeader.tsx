'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, User, X, Menu, Edit3, KeyRound, LogOut, CheckCircle2, ShieldCheck, Building2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmergencyCodeRedBanner } from '@/components/EmergencyCodeRedBanner';

interface GlobalHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, notifications, logout, updateUser, clearNotifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Profile Card & Modals State
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  const router = useRouter();

  if (!user) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchModal(true);

    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenEditModal = () => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
    }
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setShowEditModal(true);
    setShowProfileCard(false);
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassSuccessMsg('');
    setPassErrorMsg('');
    setShowPasswordModal(true);
    setShowProfileCard(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setSavingProfile(true);

    try {
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify({ name: editName, email: editEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      updateUser({ name: data.user.name, email: data.user.email }, data.token);
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setShowEditModal(false), 1200);
    } catch (err: any) {
      setProfileErrorMsg(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);

    try {
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      if (data.token) {
        updateUser({}, data.token);
      }
      setPassSuccessMsg('Account password changed successfully!');
      setTimeout(() => setShowPasswordModal(false), 1200);
    } catch (err: any) {
      setPassErrorMsg(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <EmergencyCodeRedBanner />
      <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs select-none gap-2">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        {/* Mobile Hamburger Toggle Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-all shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Hospital Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-xs sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients, Universal ID..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Right Controls: User Profile Badge & Notifications */}
      <div className="flex items-center gap-4">
        {/* User Account Profile Badge & Dropdown Card */}
        <div className="relative">
          <button
            onClick={() => setShowProfileCard(!showProfileCard)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-extrabold text-slate-900 block leading-tight">{user.name}</span>
              <span className="text-[9px] font-extrabold text-cyan-700 uppercase tracking-widest block">
                {user.role === 'SUPER_ADMIN' ? 'PLATFORM ADMIN' : user.role === 'HOSPITAL_ADMIN' ? 'HOSPITAL ADMIN' : user.role.replace('_', ' ')}
              </span>
            </div>
          </button>

          {/* Small Profile Card Popover */}
          {showProfileCard && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in select-none text-xs space-y-3">
              {/* Account Details Box */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="truncate">
                    <p className="font-extrabold text-slate-900 text-xs truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase">ROLE:</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-extrabold">
                    {user.role === 'SUPER_ADMIN' ? 'PLATFORM ADMIN' : user.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold truncate">
                  <span className="text-slate-400 uppercase">ORGANIZATION:</span>
                  <span className="text-slate-700 truncate max-w-[130px]">{user.hospitalName || 'Metropolitan Hospital'}</span>
                </div>
              </div>

              {/* Account Management Actions */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={handleOpenEditModal}
                  className="w-full px-3 py-2 bg-slate-100 hover:bg-cyan-50 text-slate-800 hover:text-cyan-900 font-extrabold rounded-xl border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-cyan-600" /> Edit Profile Details
                </button>

                <button
                  onClick={handleOpenPasswordModal}
                  className="w-full px-3 py-2 bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-extrabold rounded-xl border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-purple-600" /> Change Password
                </button>

                <button
                  onClick={logout}
                  className="w-full px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold rounded-xl border border-rose-200 flex items-center gap-2 transition-all mt-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" /> Sign Out of Portal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live SSE Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Real-time Platform Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-cyan-500 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                    {notifications.length} Active
                  </span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="text-[10px] bg-rose-600/80 hover:bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer shadow-xs"
                      title="Clear & Mark All as Read"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-slate-400 font-medium">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 text-xs">{n.event.replace('_', ' ')}</p>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4 animate-in fade-in select-none text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Edit Account Profile</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold">
                {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="font-extrabold text-slate-900 block text-xs mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block text-xs mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@nexomedico.ai"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-500 font-extrabold hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4 animate-in fade-in select-none text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Change Account Password</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
            )}

            {passErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold">
                {passErrorMsg}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="font-extrabold text-slate-900 block text-xs mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block text-xs mb-1">New Password (Min 6 chars) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block text-xs mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-slate-500 font-extrabold hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> {savingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Search Results Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-600" />
                Hospital Search Results for "{searchQuery}"
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSearching ? (
              <p className="py-6 text-center text-slate-500">Searching hospital records...</p>
            ) : searchResults.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No matching patient records found.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setShowSearchModal(false);
                      router.push(`/doctor/patient/${p.id}`);
                    }}
                    className="p-3 border rounded-xl hover:border-cyan-500 hover:bg-cyan-50/50 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div>
                      <span className="font-extrabold text-cyan-700 mr-2">{p.patientCode}</span>
                      <span className="font-bold text-slate-900">{p.fullName}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {p.gender}, {p.dob} | Phone: {p.phone} | Blood: {p.bloodGroup}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
};
