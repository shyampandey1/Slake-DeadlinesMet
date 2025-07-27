import { Suspense } from 'react';
import TimerPageContent from '@/components/TimerPageContent';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimerPage() {
  return (
    <Suspense fallback={<TimerSkeleton />}>
      <TimerPageContent />
    </Suspense>
  );
}

function TimerSkeleton() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <Skeleton className="mb-4 h-12 w-3/4" />
        <Skeleton className="mb-8 h-8 w-1/2" />
        <Skeleton className="mb-12 h-48 w-full font-code md:h-64" />
        <div className="flex gap-4">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-14 w-32" />
        </div>
      </div>
    </main>
  );
}
