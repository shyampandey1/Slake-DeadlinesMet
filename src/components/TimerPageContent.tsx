'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TimerDisplay from './TimerDisplay';
import { Skeleton } from './ui/skeleton';

export default function TimerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const taskName = searchParams.get('task');
  const taskId = searchParams.get('taskId') ?? undefined;
  const durationStr = searchParams.get('duration');
  const initialDurationStr = searchParams.get('initialDuration');
  const secondsStr = searchParams.get('seconds');
  
  // Planned duration in minutes
  let duration = initialDurationStr ? parseFloat(initialDurationStr) : (durationStr ? parseFloat(durationStr) : null);
  
  // Specific remaining seconds left when resuming
  let remainingSeconds: number | undefined = undefined;
  if (secondsStr && !isNaN(parseFloat(secondsStr))) {
    const parsedSec = Math.round(parseFloat(secondsStr));
    if (parsedSec > 0) {
      remainingSeconds = parsedSec;
    }
  }

  if (duration === null && remainingSeconds !== undefined) {
    duration = Math.max(1, Math.round(remainingSeconds / 60));
  }
  
  const category = searchParams.get('category') ?? undefined;
  const color = searchParams.get('color') ?? undefined;
  const expectedEndTimeStr = searchParams.get('expectedEndTime');
  const expectedEndTime = expectedEndTimeStr ? parseInt(expectedEndTimeStr, 10) : undefined;
  const coOpSessionId = searchParams.get('coOpSessionId') ?? undefined;
  const autoStart = searchParams.get('autoStart') === 'true';
  const forceRestart = searchParams.get('forceRestart') === 'true' || autoStart;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!taskName || duration === null || isNaN(duration) || duration <= 0) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [taskName, duration, router]);

  if (!isReady) {
    return (
      <main className="dark flex min-h-screen w-full flex-col items-center justify-center bg-[#0c0d0e] text-white p-4">
        <div className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
          <Skeleton className="mb-4 h-12 w-3/4 bg-white/10" />
          <Skeleton className="mb-8 h-8 w-1/2 bg-white/10" />
          <Skeleton className="mb-12 h-48 w-full font-code md:h-64 bg-white/5" />
          <div className="flex gap-4">
            <Skeleton className="h-14 w-32 bg-white/10" />
            <Skeleton className="h-14 w-32 bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <TimerDisplay
      taskName={taskName!}
      taskId={taskId}
      initialDuration={duration!}
      remainingSeconds={remainingSeconds}
      category={category}
      color={color}
      expectedEndTime={expectedEndTime}
      coOpSessionId={coOpSessionId}
      forceRestart={forceRestart}
      autoStart={autoStart}
    />
  );
}
