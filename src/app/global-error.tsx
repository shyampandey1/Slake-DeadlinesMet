"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                 <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-headline font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                We encountered an unexpected error. This can happen during sign out or due to a network disruption. 
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push('/')}>
                    Go to Home
                </Button>
                <Button onClick={() => window.location.reload()}>
                    Try again
                </Button>
            </div>
        </div>
      </body>
    </html>
  );
}
