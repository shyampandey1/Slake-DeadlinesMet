'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TimerDisplay from './TimerDisplay';
import { Skeleton } from './ui/skeleton';

export default function TimerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const taskName = searchParams.get('task');
  const durationStr = searchParams.get('duration');
  const duration = durationStr ? parseInt(durationStr, 10) : null;
  const color = searchParams.get('color') ?? undefined;
  const expectedEndTimeStr = searchParams.get('expectedEndTime');
  const expectedEndTime = expectedEndTimeStr ? parseInt(expectedEndTimeStr, 10) : undefined;
  const coOpSessionId = searchParams.get('coOpSessionId') ?? undefined;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!taskName || duration === null || isNaN(duration)) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [taskName, duration, router]);

  if (!isReady) {
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

  return (
    <TimerDisplay
      taskName={taskName!}
      initialDuration={duration!}
      category={category}
      color={color}
      expectedEndTime={expectedEndTime}
      coOpSessionId={coOpSessionId}
    />
  );
}
