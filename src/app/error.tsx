'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white rounded-2xl border shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Something went wrong!</h2>
      <p className="text-xs text-slate-500">{error?.message || 'An error occurred while loading this page.'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl shadow"
      >
        Try Again
      </button>
    </div>
  );
}
