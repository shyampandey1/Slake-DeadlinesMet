import { Suspense } from 'react';
import TimerPageContent from '@/components/TimerPageContent';
import { Skeleton } from '@/components/ui/skeleton';
import AuthWrapper from '@/components/AuthWrapper';
import { TimerUIProvider } from '@/hooks/useTimerUI';

function TimerPage() {
  return (
    // Suspense boundary is crucial for useSearchParams to work correctly
    <Suspense fallback={<TimerSkeleton />}>
        <TimerUIProvider>
            <TimerPageContent />
        </TimerUIProvider>
    </Suspense>
  );
}

function TimerSkeleton() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
       <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <Skeleton className="mb-2 h-8 w-1/2" />
        <Skeleton className="mb-8 h-12 w-3/4" />
        <Skeleton className="mb-12 h-[400px] w-[400px] rounded-full" />
        <div className="flex gap-4">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-14 w-32" />
        </div>
      </div>
    </main>
  );
}

export default function WrappedTimerPage() {
    return (
        <AuthWrapper>
            <TimerPage />
        </AuthWrapper>
    );
}
