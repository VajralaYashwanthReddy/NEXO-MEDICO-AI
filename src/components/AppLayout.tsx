'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { GlobalHeader } from '@/components/GlobalHeader';
import { FloatingAiChatbot } from '@/components/FloatingAiChatbot';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/patient/register' || pathname === '/hospitals' || pathname === '/doctors';

  if (!user || isPublicPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-100 relative overflow-x-hidden">
      {/* Navigation Sidebar (Drawer on mobile, fixed on desktop) */}
      <NavigationSidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 relative md:pl-64">
        <GlobalHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </main>
        <FloatingAiChatbot />
      </div>
    </div>
  );
}
