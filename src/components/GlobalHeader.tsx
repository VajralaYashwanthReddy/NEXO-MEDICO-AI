'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, User, X, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GlobalHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, notifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
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

  return (
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
        {/* User Account Profile Badge (Replaced Role Dropdown) */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-800">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-extrabold text-slate-900 block leading-tight">{user.name}</span>
            <span className="text-[9px] font-extrabold text-cyan-700 uppercase tracking-widest block">
              {user.role === 'SUPER_ADMIN' ? 'PLATFORM ADMIN' : user.role === 'HOSPITAL_ADMIN' ? 'HOSPITAL ADMIN' : user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Live SSE Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold">Real-time Notifications</span>
                <span className="text-[10px] bg-cyan-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {notifications.length} New
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-slate-400">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="font-semibold text-slate-800">{n.event.replace('_', ' ')}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
  );
};
