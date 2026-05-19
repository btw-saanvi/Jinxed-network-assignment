'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-50">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-red-950/30 rounded-full border border-red-900/50">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-zinc-400 text-sm">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Button
            onClick={() => reset()}
            className="bg-white text-zinc-950 hover:bg-zinc-200 font-semibold gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
