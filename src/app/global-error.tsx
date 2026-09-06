'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-100 min-h-screen flex items-center justify-center p-6">
        <div className="p-8 text-center space-y-4 max-w-md bg-white rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Application Error</h2>
          <p className="text-xs text-slate-500">{error?.message || 'A global error occurred.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl shadow"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
