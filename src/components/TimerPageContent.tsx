"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TimerDisplay from './TimerDisplay';
import { getMusicForTask, GetMusicForTaskOutput } from '@/ai/flows/get-music-vibe';
import { Skeleton } from './ui/skeleton';

export default function TimerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [musicInfo, setMusicInfo] = useState<GetMusicForTaskOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const taskName = searchParams.get('task');
  const durationStr = searchParams.get('duration');
  const duration = durationStr ? parseInt(durationStr, 10) : null;

  useEffect(() => {
    if (!taskName || duration === null || isNaN(duration)) {
      router.replace('/');
      return;
    }

    async function fetchMusic() {
        try {
            const music = await getMusicForTask({ taskName: taskName! });
            setMusicInfo(music);
        } catch (error) {
            console.error("Failed to get music for task:", error);
            // You could set a default track here if you want
            setMusicInfo(null);
        } finally {
            setIsLoading(false);
        }
    }

    fetchMusic();

  }, [taskName, duration, router]);

  if (isLoading) {
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

  if (!taskName || duration === null || isNaN(duration)) {
    return null; // or a loading state, though router.replace should be fast
  }

  return <TimerDisplay taskName={taskName} initialDuration={duration} musicInfo={musicInfo} />;
}
