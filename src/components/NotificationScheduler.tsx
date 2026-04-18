
"use client";

import { useEffect } from "react";
import { useCalendarEvents } from "@/hooks/useFirestore";
import { isToday, parseISO, isAfter } from "date-fns";

export default function NotificationScheduler() {
  const { events } = useCalendarEvents();

  useEffect(() => {
    const scheduleEvents = async () => {
      // 1. Check if the browser supports notifications and service workers
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }

      // 2. Check if the user has enabled offline reminders
      const offlineEnabled = localStorage.getItem("deadlinesmet_offline_notifications") === "true";
      if (!offlineEnabled || Notification.permission !== "granted") {
        return;
      }

      // 3. Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // 4. Check for Notification Triggers support
      // @ts-ignore
      if (!("showTrigger" in Notification.prototype)) {
        return;
      }

      const now = new Date();

      // 5. Schedule each upcoming event for today
      for (const event of events) {
        if (!event.date) continue;

        const eventDate = parseISO(event.date);

        // Only schedule for today and only if it's in the future
        if (isToday(eventDate) && isAfter(eventDate, now)) {
          try {
            const notificationOptions: any = {
              body: `Your scheduled task "${event.name}" starts now!`,
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: `event-${event.id}`,
              timestamp: eventDate.getTime(),
              // @ts-ignore
              showTrigger: new TimestampTrigger(eventDate.getTime()),
              data: {
                 url: "/calendar",
                 type: "CALENDAR",
              }
            };

            await registration.showNotification(`Upcoming Task: ${event.name}`, notificationOptions);
          } catch (e) {
            console.error("Failed to schedule event notification:", e);
          }
        }
      }
    };

    scheduleEvents();
  }, [events]);

  return null;
}
