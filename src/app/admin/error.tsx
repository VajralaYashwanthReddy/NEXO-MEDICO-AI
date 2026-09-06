'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Module Error:', error);
  }, [error]);

  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white rounded-2xl border shadow-sm text-xs">
      <h2 className="text-base font-bold text-slate-800">Admin Section Error</h2>
      <p className="text-slate-500">{error?.message || 'An error occurred in this module.'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl shadow"
      >
        Reload Module
      </button>
    </div>
  );
}
