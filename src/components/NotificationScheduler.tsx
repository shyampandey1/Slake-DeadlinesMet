"use client";

import { useEffect, useRef } from "react";
import { useCalendarEvents, useTasks } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { useRoutineStore } from "@/hooks/useRoutineStore";
import { isToday, parseISO, isAfter } from "date-fns";
import { decryptText } from "@/lib/crypto";

export default function NotificationScheduler() {
  const { events } = useCalendarEvents();
  const { user } = useAuth();
  const { activeTimer } = useActiveTimer();
  const { presetTasks, categoryTimeRanges } = useRoutineStore();
  const { tasks: loggedTasks } = useTasks();
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
              ...({ vibrate: [200, 100, 200] } as any),
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
              ...({ vibrate: [200, 100, 200] } as any),
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

  // 2. SCHEDULE ROUTINE TASKS ACCORDING TO USER'S CIRCADIAN SCHEDULE
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    if (!presetTasks || Object.keys(presetTasks).length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Compute completed task names for today
    const completedToday = new Set<string>();
    loggedTasks.forEach((t) => {
      if (t.completed) {
        const createdDate = t.createdAt ? new Date(t.createdAt) : null;
        if (createdDate && isToday(createdDate)) {
          completedToday.add(t.name.toLowerCase().trim());
        }
      }
    });

    // Schedule each routine task
    Object.entries(presetTasks).forEach(([category, { tasks }]) => {
      const timeRange = categoryTimeRanges[category];
      let categoryPointer = timeRange?.start ? new Date(timeRange.start) : new Date(now);

      (tasks || []).forEach((task) => {
        const taskName = task.name;
        const taskDuration = task.duration || 15;
        let scheduledDate: Date;

        if (typeof task.startTime === 'string' && task.startTime.includes(':')) {
          const [h, m] = task.startTime.split(':').map((v) => parseInt(v, 10));
          scheduledDate = new Date(now);
          scheduledDate.setHours(h || 0, m || 0, 0, 0);
        } else {
          scheduledDate = new Date(categoryPointer);
          categoryPointer = new Date(categoryPointer.getTime() + taskDuration * 60000);
        }

        const scheduledTime = scheduledDate.getTime();
        const diffMs = scheduledTime - now.getTime();
        const dedupeKey = `notified_routine_${task.id || taskName}_${todayStr}`;

        // Skip if already notified or completed today
        if (notifiedIdsRef.current.has(dedupeKey) || sessionStorage.getItem(dedupeKey) === "true") {
          return;
        }
        if (completedToday.has(taskName.toLowerCase().trim())) {
          return;
        }

        const launchUrl = `/timer?task=${encodeURIComponent(taskName)}&duration=${taskDuration}&category=${encodeURIComponent(category)}&autoStart=true`;

        // Register with Service Worker for background wakeups
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller && diffMs > 0) {
          navigator.serviceWorker.controller.postMessage({
            type: "SCHEDULE_ROUTINE_TASK",
            id: task.id || taskName,
            name: taskName,
            time: scheduledTime,
            duration: taskDuration,
            category: category,
          });
        }

        // Active in-app timeout scheduler
        if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
          const timer = setTimeout(async () => {
            if (sessionStorage.getItem(dedupeKey) === "true") return;
            // Check if user is currently running a timer
            if (activeTimer && !activeTimer.isPaused) return;

            notifiedIdsRef.current.add(dedupeKey);
            sessionStorage.setItem(dedupeKey, "true");

            await triggerNotification(`⏰ Scheduled Task: ${taskName}`, {
              body: `Ready for "${taskName}" (${taskDuration} min)? Tap to launch your timer and start now!`,
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: `routine-${taskName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              ...({ vibrate: [200, 100, 200] } as any),
              data: {
                url: launchUrl,
                type: "ROUTINE_TASK",
                taskName: taskName,
                category: category,
              },
              requireInteraction: true,
            });
          }, diffMs);

          timeouts.push(timer);
        }
      });
    });

    // Periodic sweep every 30 seconds for routine tasks
    const interval = setInterval(async () => {
      const currentNow = Date.now();
      if (activeTimer && !activeTimer.isPaused) return;

      Object.entries(presetTasks).forEach(([category, { tasks }]) => {
        const timeRange = categoryTimeRanges[category];
        let categoryPointer = timeRange?.start ? new Date(timeRange.start) : new Date(currentNow);

        (tasks || []).forEach(async (task) => {
          const taskName = task.name;
          const taskDuration = task.duration || 15;
          let scheduledDate: Date;

          if (typeof task.startTime === 'string' && task.startTime.includes(':')) {
            const [h, m] = task.startTime.split(':').map((v) => parseInt(v, 10));
            scheduledDate = new Date(currentNow);
            scheduledDate.setHours(h || 0, m || 0, 0, 0);
          } else {
            scheduledDate = new Date(categoryPointer);
            categoryPointer = new Date(categoryPointer.getTime() + taskDuration * 60000);
          }

          const diff = scheduledDate.getTime() - currentNow;
          const dedupeKey = `notified_routine_${task.id || taskName}_${todayStr}`;

          // Trigger if within 1 minute before start or up to 5 minutes after start
          if (diff <= 60000 && diff >= -5 * 60000) {
            if (!notifiedIdsRef.current.has(dedupeKey) && sessionStorage.getItem(dedupeKey) !== "true") {
              if (completedToday.has(taskName.toLowerCase().trim())) return;

              notifiedIdsRef.current.add(dedupeKey);
              sessionStorage.setItem(dedupeKey, "true");

              const launchUrl = `/timer?task=${encodeURIComponent(taskName)}&duration=${taskDuration}&category=${encodeURIComponent(category)}&autoStart=true`;
              await triggerNotification(`⏰ Scheduled Task: ${taskName}`, {
                body: `Ready for "${taskName}" (${taskDuration} min)? Tap to launch your timer and start now!`,
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: `routine-${taskName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                ...({ vibrate: [200, 100, 200] } as any),
                data: {
                  url: launchUrl,
                  type: "ROUTINE_TASK",
                  taskName: taskName,
                  category: category,
                },
                requireInteraction: true,
              });
            }
          }
        });
      });
    }, 30000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [presetTasks, categoryTimeRanges, loggedTasks, activeTimer]);

  // 3. ACTIVE FOCUS TIMER NOTIFICATION WATCHER (across all pages)
  useEffect(() => {
    if (!activeTimer && user?.uid) {
      fetch('/api/timer/schedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          clear: true,
        }),
      }).catch(() => {});
      return;
    }

    if (!activeTimer || activeTimer.isPaused || !activeTimer.expectedEndTime) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    const remainingMs = activeTimer.expectedEndTime - Date.now();
    const timerDedupeKey = `notified_timer_${activeTimer.expectedEndTime}`;

    // Register with service worker and server background scheduler
    decryptText(activeTimer.taskName, user?.uid || "").then((plainName) => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller?.postMessage({
          type: "SCHEDULE_TIMER",
          taskName: plainName,
          endTime: activeTimer.expectedEndTime,
        });
      }

      if (user?.uid) {
        fetch('/api/timer/schedule-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            taskName: plainName,
            endTime: activeTimer.expectedEndTime,
          }),
        }).catch(() => {});
      }
    });

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
          ...({ vibrate: [300, 100, 300] } as any),
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
