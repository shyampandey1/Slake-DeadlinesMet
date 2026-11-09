import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { UserProfile } from '@/types';
import { decryptText } from '@/lib/crypto';
import { defaultRoutines, profileToRoutineMap, CATEGORY_TIME_BLOCKS } from '@/lib/routines';

function initAdmin() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
  }
}

export async function GET(req: Request) {
  // Check for authorization (Vercel Cron / GitHub Actions uses a secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    initAdmin();
    if (!admin.apps.length) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const db = admin.firestore();
    const now = new Date();
    const results: any[] = [];

    // =========================================================================
    // 1. ACTIVE FOCUS TIMER SESSIONS: NOTIFY COMPLETED SESSIONS (APP CLOSED)
    // =========================================================================
    try {
      const activeSessionsSnap = await db.collection('active_sessions').get();
      for (const sessionDoc of activeSessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const userId = sessionDoc.id;
        const status = sessionData.status;
        const notified = sessionData.notified === true;

        if (status === 'running' && !notified) {
          const startedAtMillis = sessionData.startedAt?.toMillis
            ? sessionData.startedAt.toMillis()
            : (sessionData.startedAt ? new Date(sessionData.startedAt).getTime() : 0);
          const durationMillis = sessionData.durationMillis || (25 * 60 * 1000);
          const expectedEndTime = startedAtMillis + durationMillis;

          // If session end time has arrived
          if (now.getTime() >= expectedEndTime) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
              const uData = userDoc.data() as UserProfile & { fcmToken?: string };
              const userTokens: string[] = Array.from(
                new Set([...(uData.fcmTokens || []), ...(uData.fcmToken ? [uData.fcmToken] : [])])
              ).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

              if (userTokens.length > 0) {
                const plainTaskName = await decryptText(sessionData.currentTaskId, userId);
                const taskTitle = plainTaskName || 'Focus Session';

                const message = {
                  notification: {
                    title: '🎉 Session Complete!',
                    body: `Time's up! You've finished: ${taskTitle}. Great work!`,
                  },
                  tokens: userTokens,
                  data: {
                    url: '/timer?from_notification=true',
                    type: 'TIMER',
                    taskName: taskTitle,
                  },
                  webpush: {
                    notification: {
                      title: '🎉 Session Complete!',
                      body: `Time's up! You've finished: ${taskTitle}. Great work!`,
                      icon: '/icon.svg',
                      badge: '/icon.svg',
                      tag: 'timer-done',
                      vibrate: [300, 100, 300],
                      requireInteraction: true,
                    },
                    fcmOptions: {
                      link: '/timer?from_notification=true',
                    },
                  },
                };

                await admin.messaging().sendEachForMulticast(message);
                await sessionDoc.ref.update({
                  notified: true,
                  status: 'finished',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                results.push({ userId, type: 'timer_complete', taskName: taskTitle });
              }
            }
          }
        }
      }
    } catch (sessionErr) {
      console.error('Failed to process active_sessions timer notifications:', sessionErr);
    }

    // =========================================================================
    // 2. USER ROUTINE & SCHEDULED TASKS NOTIFICATIONS
    // =========================================================================
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data() as UserProfile & { fcmToken?: string; lastRoutineNudge?: any };
      const { notificationSettings, region, userId } = userData;

      // Harmonize tokens: support both fcmTokens (array) and fcmToken (legacy string)
      const userTokens: string[] = Array.from(
        new Set([...(userData.fcmTokens || []), ...(userData.fcmToken ? [userData.fcmToken] : [])])
      ).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

      if (userTokens.length === 0) continue;

      // Determine local time for user
      const userTimeZone = region || 'UTC';
      let userLocalTime = now;
      try {
        userLocalTime = new Date(now.toLocaleString('en-US', { timeZone: userTimeZone }));
      } catch (e) {
        userLocalTime = now;
      }
      const userLocalHour = userLocalTime.getHours();
      const userLocalMinute = userLocalTime.getMinutes();
      const currentDecimalHour = userLocalHour + userLocalMinute / 60;
      const todayStr = userLocalTime.toISOString().split('T')[0];

      // -----------------------------------------------------------------------
      // 2A. PROACTIVE ROUTINE TASK & TIMER LAUNCH NUDGES
      // -----------------------------------------------------------------------
      const routineNudgesEnabled = notificationSettings?.routineNudges !== false && notificationSettings?.taskReminders !== false;
      if (routineNudgesEnabled) {
        try {
          // Check if user currently has an active running timer
          const userActiveSessionSnap = await db.collection('active_sessions').doc(userId).get();
          const isCurrentlyFocusing = userActiveSessionSnap.exists && userActiveSessionSnap.data()?.status === 'running';

          if (!isCurrentlyFocusing) {
            // Retrieve user's customized routine tasks or fallback to 18-profession library
            const presetSnap = await db.collection('users').doc(userId).collection('userPresetTasks').get();
            let routineTasks: Array<{ name: string; duration: number; category?: string; startTime?: string }> = [];

            if (!presetSnap.empty) {
              routineTasks = await Promise.all(
                presetSnap.docs.map(async (doc) => {
                  const d = doc.data();
                  const plainName = await decryptText(d.name, userId);
                  return {
                    name: plainName || d.name || 'Routine Task',
                    duration: d.duration || 15,
                    category: d.category || 'General',
                    startTime: d.startTime,
                  };
                })
              );
            } else {
              const profileKey = (profileToRoutineMap as any)[userData.profile || 'General'] || 'General';
              const template = defaultRoutines.routines[profileKey as keyof typeof defaultRoutines.routines] || defaultRoutines.routines['General'] || [];
              routineTasks = template.map(t => ({
                name: t.name,
                duration: t.duration || 15,
                category: t.category || 'General',
                startTime: t.startTime,
              }));
            }

            // Identify active category block for the current local time
            let activeCategory: string | null = null;

            // 1. First priority: tasks with explicit startTime within 45 minutes of now
            for (const t of routineTasks) {
              if (t.startTime && t.startTime.includes(':')) {
                const [h, m] = t.startTime.split(':').map(Number);
                const tDecimal = (h || 0) + (m || 0) / 60;
                if (currentDecimalHour >= tDecimal - 0.25 && currentDecimalHour < tDecimal + 1.25) {
                  activeCategory = t.category || null;
                  break;
                }
              }
            }

            // 2. Second priority: Match against CATEGORY_TIME_BLOCKS
            if (!activeCategory) {
              const categoriesInRoutine = Array.from(new Set(routineTasks.map(t => t.category).filter(Boolean))) as string[];
              for (const cat of categoriesInRoutine) {
                const block = CATEGORY_TIME_BLOCKS[cat];
                if (block && currentDecimalHour >= block.start && currentDecimalHour < block.end) {
                  activeCategory = cat;
                  break;
                }
              }
            }

            if (activeCategory) {
              // Deduplication: at most ONE nudge per routine block per day
              const lastNudge = userData.lastRoutineNudge;
              const alreadyNudgedThisBlockToday = lastNudge?.block === activeCategory && lastNudge?.date === todayStr;

              if (!alreadyNudgedThisBlockToday) {
                // Check completed tasks today to find the first pending task in this block
                const completedSnap = await db.collection('users').doc(userId).collection('tasks')
                  .where('completed', '==', true)
                  .get();

                const completedNames = new Set<string>();
                for (const tDoc of completedSnap.docs) {
                  const tData = tDoc.data();
                  const tDate = tData.createdAt?.toDate ? tData.createdAt.toDate().toISOString().split('T')[0] : tData.createdAt?.split('T')[0];
                  if (tDate === todayStr) {
                    const plainName = await decryptText(tData.name, userId);
                    completedNames.add(plainName.toLowerCase().trim());
                  }
                }

                const tasksInBlock = routineTasks.filter(t => t.category === activeCategory);
                const nextPendingTask = tasksInBlock.find(t => !completedNames.has(t.name.toLowerCase().trim()));

                if (nextPendingTask) {
                  const plainTaskName = nextPendingTask.name;
                  const taskDuration = nextPendingTask.duration || 15;
                  const launchUrl = `/timer?task=${encodeURIComponent(plainTaskName)}&duration=${taskDuration}&category=${encodeURIComponent(activeCategory)}&autoStart=true`;

                  const message = {
                    notification: {
                      title: `⏰ Time for ${activeCategory}`,
                      body: `Ready for "${plainTaskName}" (${taskDuration}m)? Tap to launch your timer and start now!`,
                    },
                    tokens: userTokens,
                    data: {
                      url: launchUrl,
                      type: 'ROUTINE_TASK',
                      category: activeCategory,
                      taskName: plainTaskName,
                      duration: taskDuration.toString(),
                    },
                    webpush: {
                      notification: {
                        title: `⏰ Time for ${activeCategory}`,
                        body: `Ready for "${plainTaskName}" (${taskDuration}m)? Tap to launch your timer and start now!`,
                        icon: '/icon.svg',
                        badge: '/icon.svg',
                        tag: `routine-${activeCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                        vibrate: [200, 100, 200],
                        requireInteraction: true,
                      },
                      fcmOptions: {
                        link: launchUrl,
                      },
                    },
                  };

                  await admin.messaging().sendEachForMulticast(message);
                  await userDoc.ref.update({
                    lastRoutineNudge: {
                      block: activeCategory,
                      taskName: plainTaskName,
                      date: todayStr,
                      timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    },
                  });
                  results.push({ userId, type: 'routine_nudge', block: activeCategory, taskName: plainTaskName });
                }
              }
            }
          }
        } catch (routineErr) {
          console.error(`Failed to process routine nudges for user ${userId}:`, routineErr);
        }
      }

      // -----------------------------------------------------------------------
      // 2B. SCHEDULED CALENDAR TASKS & DEADLINES
      // -----------------------------------------------------------------------
      if (notificationSettings?.taskReminders !== false) {
        try {
          const eventsSnap = await db.collection('users').doc(userId).collection('userEvents').get();
          for (const eventDoc of eventsSnap.docs) {
            const eventData = eventDoc.data();
            if (!eventData.date) continue;

            const eventDate = new Date(eventData.date);
            if (isNaN(eventDate.getTime())) continue;

            // Check if event is scheduled for around now (starting within next 30m or started within past 15m)
            const diffMinutes = (eventDate.getTime() - now.getTime()) / (1000 * 60);
            const isUpcoming = diffMinutes >= -15 && diffMinutes <= 30;

            const lastNotified = eventData.lastNotifiedAt?.toDate
              ? eventData.lastNotifiedAt.toDate().getTime()
              : (eventData.lastNotifiedAt ? new Date(eventData.lastNotifiedAt).getTime() : 0);
            const alreadyNotifiedRecently = (now.getTime() - lastNotified) < 1000 * 60 * 60; // within 60 mins

            if (isUpcoming && !alreadyNotifiedRecently) {
              const plainTaskName = await decryptText(eventData.name, userId);
              const taskDuration = eventData.duration || 25;
              const launchUrl = `/calendar?from_notification=true`;

              const message = {
                notification: {
                  title: `Upcoming Task: ${plainTaskName}`,
                  body: `Your scheduled task "${plainTaskName}" (${taskDuration} min) starts now! Time to conquer your deadline.`,
                },
                tokens: userTokens,
                data: {
                  url: launchUrl,
                  type: 'CALENDAR',
                  eventId: eventDoc.id,
                },
                webpush: {
                  notification: {
                    title: `Upcoming Task: ${plainTaskName}`,
                    body: `Your scheduled task "${plainTaskName}" (${taskDuration} min) starts now!`,
                    icon: '/icon.svg',
                    badge: '/icon.svg',
                    tag: `event-${eventDoc.id}`,
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                  },
                  fcmOptions: {
                    link: launchUrl,
                  },
                },
              };

              await admin.messaging().sendEachForMulticast(message);
              await eventDoc.ref.update({
                lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              results.push({ userId, type: 'task_reminder', taskName: plainTaskName });
            }
          }
        } catch (taskErr) {
          console.error(`Failed to process task notifications for user ${userId}:`, taskErr);
        }
      }

      // -----------------------------------------------------------------------
      // 2C. HYDRATION REMINDERS
      // -----------------------------------------------------------------------
      if (notificationSettings?.hydrationReminders) {
        if (userLocalHour >= 9 && userLocalHour <= 21 && (userLocalHour - 9) % 3 === 0 && userLocalMinute < 15) {
          const glassNumber = Math.floor((userLocalHour - 9) / 3) + 1;
          const message = {
            notification: {
              title: "💧 Hydration Goal: 8 Glasses",
              body: `Time for glass #${glassNumber}! Staying hydrated is key to your 8-glass daily discipline.`,
            },
            tokens: userTokens,
            data: { url: "/", type: "HYDRATION" },
            webpush: {
              notification: {
                title: "💧 Hydration Goal: 8 Glasses",
                body: `Time for glass #${glassNumber}! Staying hydrated is key to your daily discipline.`,
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: "hydration-reminder",
              },
              fcmOptions: { link: "/" }
            }
          };
          await admin.messaging().sendEachForMulticast(message);
          results.push({ userId, type: 'hydration' });
        }
      }

      // -----------------------------------------------------------------------
      // 2D. MOVERS PROTOCOL REMINDERS
      // -----------------------------------------------------------------------
      const { reformerPreference } = userData;

      if (userLocalHour === 7 && userLocalMinute < 15) {
        const message = {
          notification: {
            title: "🌅 MOVERS: Morning Primer",
            body: "Start your M-O-V-E sequence: Meditation, Oxygenation, Visualization, and Exercise.",
          },
          tokens: userTokens,
          data: { url: "/routine", type: "MOVERS_MORNING" },
          webpush: {
            notification: {
              title: "🌅 MOVERS: Morning Primer",
              body: "Start your M-O-V-E sequence: Meditation, Oxygenation, Visualization, and Exercise.",
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: "movers-morning",
            },
            fcmOptions: { link: "/routine" }
          }
        };
        await admin.messaging().sendEachForMulticast(message);
        results.push({ userId, type: 'movers_morning' });
      }

      if (userLocalHour === 21 && userLocalMinute < 15) {
        const bodyText = reformerPreference === 'evening_restorer'
          ? "Time for your Evening Restorer: Meditation, Oxygenation, Visualization, Reading, and Scribing."
          : "Wind down with your Reading (R) and Scribing (S) protocol.";

        const message = {
          notification: {
            title: "🌙 MOVERS: Evening Protocol",
            body: bodyText,
          },
          tokens: userTokens,
          data: { url: "/routine", type: "MOVERS_EVENING" },
          webpush: {
            notification: {
              title: "🌙 MOVERS: Evening Protocol",
              body: bodyText,
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: "movers-evening",
            },
            fcmOptions: { link: "/routine" }
          }
        };
        await admin.messaging().sendEachForMulticast(message);
        results.push({ userId, type: 'movers_evening' });
      }

      // -----------------------------------------------------------------------
      // 2E. STREAK EXPIRY WARNING
      // -----------------------------------------------------------------------
      if (notificationSettings?.streakExpiryWarning && userLocalHour === 20 && userLocalMinute < 15) {
        const tasksSnap = await db.collection('users').doc(userId).collection('tasks')
          .where('completed', '==', true)
          .get();

        let hasCompletedToday = false;
        tasksSnap.forEach(tDoc => {
          const tData = tDoc.data();
          const tDate = tData.createdAt?.toDate ? tData.createdAt.toDate().toISOString().split('T')[0] : tData.createdAt?.split('T')[0];
          if (tDate === todayStr) hasCompletedToday = true;
        });

        if (!hasCompletedToday) {
          const message = {
            notification: {
              title: "🔥 Streak at Risk!",
              body: "You haven't completed any tasks today. Complete one now to save your streak!",
            },
            tokens: userTokens,
            data: { url: "/", type: "STREAK_WARNING" },
            webpush: {
              notification: {
                title: "🔥 Streak at Risk!",
                body: "You haven't completed any tasks today. Complete one now to save your streak!",
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: "streak-warning",
              },
              fcmOptions: { link: "/" }
            }
          };
          await admin.messaging().sendEachForMulticast(message);
          results.push({ userId, type: 'streak_warning' });
        }
      }

      // -----------------------------------------------------------------------
      // 2F. DAILY SUMMARY
      // -----------------------------------------------------------------------
      if (notificationSettings?.dailySummary && userLocalHour === 8 && userLocalMinute < 15) {
        const message = {
          notification: {
            title: "📊 Your Morning Briefing",
            body: "Ready for a productive day? Your routine is waiting for you in Slake.",
          },
          tokens: userTokens,
          data: { url: "/", type: "DAILY_SUMMARY" },
          webpush: {
            notification: {
              title: "📊 Your Morning Briefing",
              body: "Ready for a productive day? Your routine is waiting for you in Slake.",
              icon: "/icon.svg",
              badge: "/icon.svg",
              tag: "daily-summary",
            },
            fcmOptions: { link: "/" }
          }
        };
        await admin.messaging().sendEachForMulticast(message);
        results.push({ userId, type: 'daily_summary' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
