'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { GlobalHeader } from '@/components/GlobalHeader';
import { FloatingAiChatbot } from '@/components/FloatingAiChatbot';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/patient/register' || pathname === '/hospitals' || pathname === '/doctors';

  if (!user || isPublicPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-screen">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
        <GlobalHeader />
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {children}
        </main>
        <FloatingAiChatbot />
      </div>
    </div>
  );
}
