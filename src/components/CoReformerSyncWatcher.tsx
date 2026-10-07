"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import type { UserProfile } from "@/types";

export default function CoReformerSyncWatcher() {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const { activeTimer, startTimer } = useActiveTimer();
  const router = useRouter();
  const pathname = usePathname();
  const lastHandledCoOpSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !profileData?.coWorkerId || !db) return;

    const coWorkerId = profileData.coWorkerId;
    const unsub = onSnapshot(
      doc(db, "users", coWorkerId),
      (snap) => {
        if (!snap.exists()) return;
        const peer = snap.data() as UserProfile;
        const active = peer?.activeSession;

        if (!active || !active.taskName) return;

        const now = Date.now();
        const expectedEndTime = active.expectedEndTime || 0;
        const isRunning = !active.isPaused && expectedEndTime > now;
        const isPausedWithTime = active.isPaused && (active.timeLeftWhenPaused ?? 0) > 0;

        // Session must be active (either running or actively paused)
        if (!isRunning && !isPausedWithTime) return;

        const sessionId = active.coOpSessionId || `${coWorkerId}_${active.taskName}`;

        // If user is already on the timer page with this exact session/task, do nothing
        if (pathname?.startsWith("/timer")) {
          if (activeTimer?.taskName === active.taskName || activeTimer?.coOpSessionId === sessionId) {
            return;
          }
        }

        // Avoid re-triggering for the same peer session once synced
        if (lastHandledCoOpSessionIdRef.current === sessionId && activeTimer?.taskName === active.taskName) {
          return;
        }

        lastHandledCoOpSessionIdRef.current = sessionId;

        const duration = active.duration || 25;
        const effectiveEndTime = expectedEndTime > now ? expectedEndTime : now + duration * 60 * 1000;

        // Sync local active timer state immediately
        startTimer({
          taskName: active.taskName,
          initialDuration: duration,
          category: active.category || "Co-op Session",
          color: active.color || "#10b981",
          expectedEndTime: effectiveEndTime,
          coOpSessionId: sessionId,
        });

        // Seamlessly direct both users to the exact live timer screen
        const params = new URLSearchParams({
          task: active.taskName,
          duration: duration.toString(),
          category: active.category || "Co-op Session",
          color: active.color || "#10b981",
          expectedEndTime: effectiveEndTime.toString(),
          coOpSessionId: sessionId,
        });

        router.push(`/timer?${params.toString()}`);
      },
      (err) => {
        console.warn("CoReformerSyncWatcher listener error:", err);
      }
    );

    return () => unsub();
  }, [user?.uid, profileData?.coWorkerId, activeTimer, pathname, router, startTimer]);

  return null;
}
