"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("App Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-2 text-white">Something went wrong</h2>
        <p className="text-white/60 mb-8 max-w-sm">
            We encountered a temporary sync issue. Don't worry, your data is safe!
        </p>
        <div className="bg-zinc-900/50 p-4 rounded-lg mb-8 text-left max-w-md w-full overflow-hidden">
          <p className="text-xs font-code text-rose-400 break-all mb-2">
            Error: {error.message || "Unknown error"}
          </p>
          {error.digest && (
            <p className="text-[10px] font-code text-zinc-500">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          <Button
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full border-white/10 hover:bg-white/5 text-zinc-400"
          >
            Back to Dashboard
          </Button>
        </div>
    </div>
  );
}
