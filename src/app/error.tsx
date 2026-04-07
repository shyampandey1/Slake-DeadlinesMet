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
        <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
                Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
                Try again
            </Button>
        </div>
    </div>
  );
}
