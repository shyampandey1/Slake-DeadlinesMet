
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
              showTrigger: (typeof TimestampTrigger !== 'undefined') ? new TimestampTrigger(eventDate.getTime()) : null,
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
      
      // 6. Schedule Hydration Reminders (Fallback)
      if (offlineEnabled) {
        const hydrationTimes = [10, 13, 16, 19]; // 10 AM, 1 PM, 4 PM, 7 PM
        for (const hour of hydrationTimes) {
          const reminderTime = new Date();
          reminderTime.setHours(hour, 0, 0, 0);
          
          if (isAfter(reminderTime, now)) {
             try {
                // @ts-ignore
                const trigger = (typeof TimestampTrigger !== 'undefined') ? new TimestampTrigger(reminderTime.getTime()) : null;
                
                await registration.showNotification("💧 Hydration Break", {
                    body: "Time for glass #8! Keep your daily discipline.",
                    icon: "/icon.svg",
                    tag: `hydration-${hour}`,
                    // @ts-ignore
                    showTrigger: trigger,
                    data: { url: "/", type: "HYDRATION" }
                });
             } catch(e) {}
          }
        }
      }

      // 7. Schedule MOVERS Protocol (Local)
      if (offlineEnabled) {
        const morningMovers = new Date();
        morningMovers.setHours(7, 0, 0, 0);
        if (isAfter(morningMovers, now)) {
           try {
             // @ts-ignore
             const trigger = (typeof TimestampTrigger !== 'undefined') ? new TimestampTrigger(morningMovers.getTime()) : null;

             await registration.showNotification("🌅 MOVERS: Morning Primer", {
               body: "Time for your M-O-V-E sequence. Get ready to win the day!",
               icon: "/icon.svg",
               // @ts-ignore
               showTrigger: trigger,
               data: { url: "/routine", type: "MOVERS_MORNING" }
             });
           } catch(e) {}
        }

        const eveningMovers = new Date();
        eveningMovers.setHours(21, 0, 0, 0);
        if (isAfter(eveningMovers, now)) {
           try {
             // @ts-ignore
             const trigger = (typeof TimestampTrigger !== 'undefined') ? new TimestampTrigger(eveningMovers.getTime()) : null;

             await registration.showNotification("🌙 MOVERS: Evening Protocol", {
               body: "Time for your R+S wind down. Reflect and restore.",
               icon: "/icon.svg",
               // @ts-ignore
               showTrigger: trigger,
               data: { url: "/routine", type: "MOVERS_EVENING" }
             });
           } catch(e) {}
        }
      }
    };

    scheduleEvents();
  }, [events]);

  return null;
}
