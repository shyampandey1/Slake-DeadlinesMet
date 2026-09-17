"use client";

import { useEffect, useRef } from "react";
import { useCalendarEvents } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { isToday, parseISO, isAfter } from "date-fns";
import { decryptText } from "@/lib/crypto";

export default function NotificationScheduler() {
  const { events } = useCalendarEvents();
  const { user } = useAuth();
  const { activeTimer } = useActiveTimer();
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Helper to trigger system notification with service worker and native fallbacks
  const triggerNotification = async (title: string, options: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return;
        }
      }
    } catch (e) {
      console.warn("ServiceWorker notification failed, falling back to Notification API", e);
    }

    try {
      new Notification(title, options);
    } catch (fallbackErr) {
      console.warn("Notification constructor fallback failed", fallbackErr);
    }
  };

  // 1. SCHEDULE UPCOMING CALENDAR TASKS
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const scheduleTasks = async () => {
      for (const event of events) {
        if (!event.date) continue;

        let eventDate: Date;
        try {
          eventDate = parseISO(event.date);
        } catch (e) {
          continue;
        }

        const eventTime = eventDate.getTime();
        const diffMs = eventTime - now.getTime();
        const dedupeKey = `notified_task_${event.id}_${todayStr}`;

        // Check if already notified
        if (notifiedIdsRef.current.has(dedupeKey) || sessionStorage.getItem(dedupeKey) === "true") {
          continue;
        }

        // Only schedule for today and if within the next 24 hours
        if (isToday(eventDate) && isAfter(eventDate, now)) {
          const plainName = await decryptText(event.name, user?.uid || "");
          const duration = event.duration || 25;

          // Dispatch background registration to Service Worker
          if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "SCHEDULE_TASK",
              id: event.id,
              name: plainName,
              time: eventTime,
              duration: duration,
            });
          }

          // Active in-app timeout scheduler
          const timer = setTimeout(async () => {
            if (sessionStorage.getItem(dedupeKey) === "true") return;

            notifiedIdsRef.current.add(dedupeKey);
            sessionStorage.setItem(dedupeKey, "true");

            await triggerNotification(`Upcoming Task: ${plainName}`, {
              body: `Your scheduled task "${plainName}" (${duration} min) starts now!`,
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: `event-${event.id}`,
              vibrate: [200, 100, 200],
              data: {
                url: "/calendar?from_notification=true",
                type: "CALENDAR",
              },
              requireInteraction: true,
            });
          }, diffMs);

          timeouts.push(timer);
        }
      }
    };

    scheduleTasks();

    // Periodic sweep every 30 seconds to catch tasks entering start window
    const interval = setInterval(async () => {
      const currentNow = Date.now();
      for (const event of events) {
        if (!event.date) continue;
        const eventTime = new Date(event.date).getTime();
        if (isNaN(eventTime)) continue;

        const diff = eventTime - currentNow;
        const dedupeKey = `notified_task_${event.id}_${todayStr}`;

        // If event start time has arrived (within past 10 minutes) and not notified
        if (diff <= 60000 && diff >= -10 * 60000) {
          if (!notifiedIdsRef.current.has(dedupeKey) && sessionStorage.getItem(dedupeKey) !== "true") {
            notifiedIdsRef.current.add(dedupeKey);
            sessionStorage.setItem(dedupeKey, "true");

            const plainName = await decryptText(event.name, user?.uid || "");
            await triggerNotification(`Upcoming Task: ${plainName}`, {
              body: `Your scheduled task "${plainName}" (${event.duration || 25} min) starts now!`,
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: `event-${event.id}`,
              vibrate: [200, 100, 200],
              data: {
                url: "/calendar?from_notification=true",
                type: "CALENDAR",
              },
              requireInteraction: true,
            });
          }
        }
      }
    }, 30000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [events, user]);

  // 2. ACTIVE FOCUS TIMER NOTIFICATION WATCHER (across all pages)
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused || !activeTimer.expectedEndTime) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    const remainingMs = activeTimer.expectedEndTime - Date.now();
    const timerDedupeKey = `notified_timer_${activeTimer.expectedEndTime}`;

    // Register with service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      decryptText(activeTimer.taskName, user?.uid || "").then((plainName) => {
        navigator.serviceWorker.controller?.postMessage({
          type: "SCHEDULE_TIMER",
          taskName: plainName,
          endTime: activeTimer.expectedEndTime,
        });
      });
    }

    if (remainingMs > 0) {
      const timer = setTimeout(async () => {
        if (sessionStorage.getItem(timerDedupeKey) === "true") return;
        sessionStorage.setItem(timerDedupeKey, "true");

        const plainName = await decryptText(activeTimer.taskName, user?.uid || "");
        await triggerNotification("Session Complete!", {
          body: `Time's up! You've finished: ${plainName}`,
          icon: "/icon.svg",
          badge: "/icon.svg",
          tag: "timer-done",
          vibrate: [300, 100, 300],
          data: {
            url: "/timer?from_notification=true",
            type: "TIMER",
          },
          requireInteraction: true,
        });
      }, remainingMs);

      return () => clearTimeout(timer);
    }
  }, [activeTimer, user]);

  return null;
}
