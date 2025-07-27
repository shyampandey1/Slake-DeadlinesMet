"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TimerDisplay from './TimerDisplay';

export default function TimerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const taskName = searchParams.get('task');
  const durationStr = searchParams.get('duration');
  const duration = durationStr ? parseInt(durationStr, 10) : null;

  useEffect(() => {
    if (!taskName || duration === null || isNaN(duration)) {
      router.replace('/');
    }
  }, [taskName, duration, router]);

  if (!taskName || duration === null || isNaN(duration)) {
    return null; // or a loading state, though router.replace should be fast
  }

  return <TimerDisplay taskName={taskName} initialDuration={duration} />;
}
