import { NextResponse } from 'next/server';
import { admin, ensureFirebaseAdmin } from '@/lib/firebase-admin';
import { UserProfile } from '@/types';
import { decryptText } from '@/lib/crypto';
import {
  defaultRoutines,
  profileToRoutineMap,
  categoryConfig,
  getCategoryTimeBlock,
} from '@/lib/routines';

export const dynamic = 'force-dynamic';

interface ScheduledRoutineTask {
  id?: string;
  name: string;
  category: string;
  duration: number;
  startTime: string; // HH:mm
  startMinutes: number; // minutes from midnight (0..1439)
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
  type: string;
  tag: string;
  extraData?: Record<string, string>;
}

function getUserTokens(userData: Partial<UserProfile> & { fcmToken?: string }): string[] {
  return Array.from(
    new Set([
      ...(Array.isArray(userData.fcmTokens) ? userData.fcmTokens : []),
      ...(typeof userData.fcmToken === 'string' && userData.fcmToken ? [userData.fcmToken] : []),
    ])
  ).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}

function resolveUserLocalTime(
  now: Date,
  userData: { timeZone?: string; region?: string }
) {
  const candidates = [
    userData.timeZone,
    typeof userData.region === 'string' && userData.region.includes('/')
      ? userData.region
      : undefined,
    'UTC',
  ];

  let validTz = 'UTC';
  for (const tz of candidates) {
    if (!tz) continue;
    try {
      Intl.DateTimeFormat('en-US', { timeZone: tz });
      validTz = tz;
      break;
    } catch {
      // Ignore city names like 'Mumbai' and try next fallback
    }
  }

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: validTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);

  const hourRaw = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const hour = hourRaw === 24 ? 0 : hourRaw;

  return {
    timeZone: validTz,
    todayStr,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
  };
}

function formatDateInTimeZone(dateInput: any, timeZone: string): string | null {
  try {
    const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    if (!d || isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return null;
  }
}

async function sendWebPush(
  userDocRef: admin.firestore.DocumentReference,
  tokens: string[],
  payload: PushPayload
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, errors: [] };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    data: {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      type: payload.type,
      tag: payload.tag,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      requireInteraction: 'true',
      ...(payload.extraData || {}),
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
        },
      },
    },
    webpush: {
      headers: {
        Urgency: 'high',
        TTL: '900',
      },
      fcmOptions: {
        link: payload.url,
      },
    },
  };

  const sendResult = await admin.messaging().sendEachForMulticast(message);
  const errors: string[] = [];

  if (sendResult.failureCount > 0) {
    const badTokens: string[] = [];
    sendResult.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code || 'unknown_error';
        errors.push(`${errCode}: ${resp.error?.message || 'Send failed'}`);
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          badTokens.push(tokens[idx]);
        }
      }
    });

    if (badTokens.length > 0) {
      await userDocRef
        .update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...badTokens),
        })
        .catch(() => {});
    }
  }

  return {
    successCount: sendResult.successCount,
    failureCount: sendResult.failureCount,
    errors,
  };
}

function buildCategorizedSchedule(
  flatTasks: Array<{
    id?: string;
    name: string;
    category: string;
    duration: number;
    startTime?: string;
    order?: number;
  }>
): ScheduledRoutineTask[] {
  const result: ScheduledRoutineTask[] = [];
  const grouped: Record<string, typeof flatTasks> = {};

  flatTasks.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  const categories = Object.keys(grouped).sort(
    (a, b) => (categoryConfig[a]?.order ?? 99) - (categoryConfig[b]?.order ?? 99)
  );

  for (const cat of categories) {
    const catTasks = grouped[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
    const block = getCategoryTimeBlock(cat);
    let currentMins = Math.round(block.start * 60);

    for (const t of catTasks) {
      let taskMins = currentMins;
      let startTimeStr = '';
      if (t.startTime && t.startTime.includes(':')) {
        const [h, m] = t.startTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          taskMins = h * 60 + m;
          startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
      if (!startTimeStr) {
        const h = Math.floor(taskMins / 60) % 24;
        const m = taskMins % 60;
        startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      currentMins = taskMins + t.duration;
      result.push({
        id: t.id,
        name: t.name,
        category: cat,
        duration: t.duration,
        startTime: startTimeStr,
        startMinutes: taskMins,
      });
    }
  }

  return result;
}

async function resolveUserRoutineTasks(
  uid: string,
  userData: UserProfile & { activeRoutineProfileId?: string },
  db: admin.firestore.Firestore
): Promise<ScheduledRoutineTask[]> {
  // 1. Check customRoutines only if user hasn't explicitly switched to 'default'
  if (userData.activeRoutineProfileId !== 'default') {
    try {
      let customProfileDoc: admin.firestore.DocumentSnapshot | null = null;
      if (userData.activeRoutineProfileId) {
        const docSnap = await db
          .collection('users')
          .doc(uid)
          .collection('customRoutines')
          .doc(userData.activeRoutineProfileId)
          .get();
        if (docSnap.exists) {
          customProfileDoc = docSnap;
        }
      } else {
        const latestSnap = await db
          .collection('users')
          .doc(uid)
          .collection('customRoutines')
          .orderBy('updatedAt', 'desc')
          .limit(1)
          .get();
        if (!latestSnap.empty) {
          customProfileDoc = latestSnap.docs[0];
        }
      }

      if (customProfileDoc && customProfileDoc.exists) {
        const data = customProfileDoc.data() || {};
        const tasks = (data.tasks || []) as Array<{
          id?: string;
          title?: string;
          name?: string;
          startTime?: string;
          durationMinutes?: number;
          duration?: number;
          category?: string;
        }>;

        if (tasks.length > 0) {
          const result: ScheduledRoutineTask[] = [];
          let currentPointerMinutes = 6 * 60;

          for (const t of tasks) {
            const rawTitle = t.title || t.name || 'Routine Task';
            const taskName = (await decryptText(rawTitle, uid)) || rawTitle;
            const duration = Math.max(1, Number(t.durationMinutes || t.duration) || 15);
            let startMinutes = currentPointerMinutes;
            let startTimeStr = '';

            if (t.startTime && t.startTime.includes(':')) {
              const [h, m] = t.startTime.split(':').map(Number);
              if (!isNaN(h) && !isNaN(m)) {
                startMinutes = h * 60 + m;
                startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              }
            }

            if (!startTimeStr) {
              const h = Math.floor(startMinutes / 60) % 24;
              const m = startMinutes % 60;
              startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }

            currentPointerMinutes = startMinutes + duration;

            result.push({
              id: t.id,
              name: taskName,
              category: t.category || 'General',
              duration,
              startTime: startTimeStr,
              startMinutes,
            });
          }
          return result;
        }
      }
    } catch (err) {
      console.warn(`Failed to read customRoutines for user ${uid}:`, err);
    }
  }

  // 2. Check userPresetTasks filtered by user's active profession
  try {
    const activeProfession = userData.profile || 'General';
    let presetSnap = await db
      .collection('users')
      .doc(uid)
      .collection('userPresetTasks')
      .where('profession', '==', activeProfession)
      .get();

    if (presetSnap.empty) {
      // Fallback for legacy preset docs without a profession field
      presetSnap = await db
        .collection('users')
        .doc(uid)
        .collection('userPresetTasks')
        .get();
    }

    if (!presetSnap.empty) {
      const rawTasks = await Promise.all(
        presetSnap.docs.map(async (doc) => {
          const d = doc.data();
          const plainName = await decryptText(d.name, uid);
          return {
            id: doc.id,
            name: plainName || d.name || 'Routine Task',
            category: d.category || 'General',
            duration: Math.max(1, Number(d.duration) || 15),
            startTime: d.startTime,
            order: d.order || 0,
          };
        })
      );
      return buildCategorizedSchedule(rawTasks);
    }
  } catch (err) {
    console.warn(`Failed to read userPresetTasks for user ${uid}:`, err);
  }

  // 3. Fallback to default profession routines
  const profileKey = (profileToRoutineMap as any)[userData.profile || 'General'] || 'General';
  const template =
    defaultRoutines.routines[profileKey as keyof typeof defaultRoutines.routines] ||
    defaultRoutines.routines['General'] ||
    [];

  return buildCategorizedSchedule(
    template.map((t, idx) => ({
      name: t.name,
      category: t.category || 'General',
      duration: Math.max(1, Number(t.duration) || 15),
      startTime: t.startTime,
      order: idx,
    }))
  );
}

function isAuthorizedCronRequest(req: Request): { ok: boolean; status?: number; reason?: string } {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (!configuredSecret) {
    if (isProd) {
      return {
        ok: false,
        status: 500,
        reason: 'CRON_SECRET is not configured on the server.',
      };
    }
    return { ok: true };
  }

  const authHeader = req.headers.get('authorization')?.trim();
  const customHeader = req.headers.get('x-cron-secret')?.trim();
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret')?.trim();

  if (
    authHeader === `Bearer ${configuredSecret}` ||
    customHeader === configuredSecret ||
    querySecret === configuredSecret
  ) {
    return { ok: true };
  }

  return { ok: false, status: 401, reason: 'Unauthorized' };
}

export async function GET(req: Request) {
  const authCheck = isAuthorizedCronRequest(req);
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.reason || 'Unauthorized' },
      { status: authCheck.status || 401 }
    );
  }

  try {
    const adminStatus = ensureFirebaseAdmin();
    if (!adminStatus.ok) {
      return NextResponse.json(
        { error: adminStatus.error || 'Firebase admin not configured' },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const now = new Date();
    const results: any[] = [];
    const errorsSample: string[] = [];
    let usersScanned = 0;
    let usersWithTokens = 0;
    let activeSessionsScanned = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // =========================================================================
    // 1. ACTIVE FOCUS TIMER SESSIONS: NOTIFY COMPLETED SESSIONS (APP CLOSED)
    // =========================================================================
    try {
      const activeSessionsSnap = await db.collection('active_sessions').get();
      activeSessionsScanned = activeSessionsSnap.size;

      for (const sessionDoc of activeSessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const uid = sessionDoc.id;
        const status = sessionData.status;
        const notified = sessionData.notified === true;

        if (status === 'running' && !notified) {
          const startedAtMillis = sessionData.startedAt?.toMillis
            ? sessionData.startedAt.toMillis()
            : sessionData.startedAt
              ? new Date(sessionData.startedAt).getTime()
              : 0;
          const durationMillis = sessionData.durationMillis || 25 * 60 * 1000;
          const expectedEndTime =
            typeof sessionData.expectedEndTime === 'number'
              ? sessionData.expectedEndTime
              : startedAtMillis + durationMillis;

          if (expectedEndTime > 0 && now.getTime() >= expectedEndTime) {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
              const uData = userDoc.data() as UserProfile & { fcmToken?: string };
              const userTokens = getUserTokens(uData);

              if (userTokens.length > 0) {
                const plainTaskName = await decryptText(sessionData.currentTaskId, uid);
                const taskTitle = plainTaskName || 'Focus Session';

                const sendRes = await sendWebPush(userDoc.ref, userTokens, {
                  title: '🎉 Session Complete!',
                  body: `Time's up! You've finished: ${taskTitle}. Great work!`,
                  url: '/timer?from_notification=true',
                  type: 'TIMER',
                  tag: 'timer-done',
                  extraData: { taskName: taskTitle },
                });

                totalSent += sendRes.successCount;
                totalFailed += sendRes.failureCount;
                if (sendRes.errors.length > 0 && errorsSample.length < 10) {
                  errorsSample.push(...sendRes.errors.slice(0, 2));
                }

                if (sendRes.successCount > 0) {
                  await sessionDoc.ref.update({
                    notified: true,
                    status: 'finished',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  });
                  results.push({ uid, type: 'timer_complete', taskName: taskTitle });
                }
              }
            }
          }
        }
      }
    } catch (sessionErr: any) {
      console.error('Failed to process active_sessions timer notifications:', sessionErr);
      errorsSample.push(`active_sessions: ${sessionErr?.message || String(sessionErr)}`);
    }

    // =========================================================================
    // 2. USER ROUTINE & SCHEDULED TASKS NOTIFICATIONS
    // =========================================================================
    const usersSnap = await db.collection('users').get();
    usersScanned = usersSnap.size;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data() as UserProfile & {
        fcmToken?: string;
        lastRoutineNudge?: any;
        activeRoutineProfileId?: string;
      };
      const { notificationSettings, reformerPreference } = userData;

      const userTokens = getUserTokens(userData);
      if (userTokens.length === 0) continue;
      usersWithTokens++;

      const localTime = resolveUserLocalTime(now, userData);
      const { timeZone, todayStr, hour: userLocalHour, minute: userLocalMinute, minutesOfDay: currentMinutesOfDay } = localTime;
      const notifiedTodayMap = { ...((userData as any).notifiedRoutineTasks?.[todayStr] || {}) };
      const notifiedSystemMap = { ...((userData as any).notifiedSystemNudges?.[todayStr] || {}) };

      // -----------------------------------------------------------------------
      // 2A. PROACTIVE ROUTINE TASK & TIMER LAUNCH NUDGES (SCHEDULE-BASED)
      // -----------------------------------------------------------------------
      const routineNudgesEnabled =
        notificationSettings?.routineNudges !== false &&
        notificationSettings?.taskReminders !== false;

      if (routineNudgesEnabled) {
        try {
          const userActiveSessionSnap = await db.collection('active_sessions').doc(uid).get();
          const activeSessionData = userActiveSessionSnap.data();
          const isCurrentlyFocusing =
            userActiveSessionSnap.exists && activeSessionData?.status === 'running';

          if (!isCurrentlyFocusing) {
            const routineTasks = await resolveUserRoutineTasks(uid, userData, db);

            const completedSnap = await db
              .collection('users')
              .doc(uid)
              .collection('tasks')
              .where('completed', '==', true)
              .get();

            const completedNames = new Set<string>();
            for (const tDoc of completedSnap.docs) {
              const tData = tDoc.data();
              const tDate = formatDateInTimeZone(tData.createdAt, timeZone);
              if (tDate === todayStr) {
                const plainName = await decryptText(tData.name, uid);
                completedNames.add(plainName.toLowerCase().trim());
              }
            }

            for (const task of routineTasks) {
              const diffMinutes = task.startMinutes - currentMinutesOfDay;
              // Match 15m ahead up to 15m past scheduled start (absorbs cron jitter)
              const isTimeForTask = diffMinutes >= -15 && diffMinutes <= 15;
              if (!isTimeForTask) continue;

              const taskSlug = task.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              if (notifiedTodayMap[taskSlug] === true) continue;
              if (completedNames.has(task.name.toLowerCase().trim())) continue;

              const launchUrl = `/timer?task=${encodeURIComponent(task.name)}&duration=${task.duration}&category=${encodeURIComponent(task.category)}&autoStart=true`;

              const sendRes = await sendWebPush(userDoc.ref, userTokens, {
                title: `⏰ Scheduled Task: ${task.name}`,
                body: `Ready for "${task.name}" (${task.duration}m)? Scheduled for ${task.startTime}. Tap to start focusing!`,
                url: launchUrl,
                type: 'ROUTINE_TASK',
                tag: `routine-${taskSlug}`,
                extraData: {
                  category: task.category,
                  taskName: task.name,
                  startTime: task.startTime,
                  duration: task.duration.toString(),
                },
              });

              totalSent += sendRes.successCount;
              totalFailed += sendRes.failureCount;
              if (sendRes.errors.length > 0 && errorsSample.length < 10) {
                errorsSample.push(...sendRes.errors.slice(0, 2));
              }

              if (sendRes.successCount > 0) {
                await userDoc.ref.update({
                  [`notifiedRoutineTasks.${todayStr}.${taskSlug}`]: true,
                  lastRoutineNudge: {
                    block: task.category,
                    taskName: task.name,
                    date: todayStr,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                  },
                });

                results.push({
                  uid,
                  type: 'routine_task_nudge',
                  taskName: task.name,
                  startTime: task.startTime,
                  category: task.category,
                });
                notifiedTodayMap[taskSlug] = true;
              }
            }
          }
        } catch (routineErr: any) {
          console.error(`Failed to process routine nudges for user ${uid}:`, routineErr);
          if (errorsSample.length < 10) {
            errorsSample.push(`routine(${uid}): ${routineErr?.message || String(routineErr)}`);
          }
        }
      }

      // -----------------------------------------------------------------------
      // 2B. SCHEDULED CALENDAR TASKS & DEADLINES
      // -----------------------------------------------------------------------
      if (notificationSettings?.taskReminders !== false) {
        try {
          const eventsSnap = await db.collection('users').doc(uid).collection('userEvents').get();
          for (const eventDoc of eventsSnap.docs) {
            const eventData = eventDoc.data();
            if (!eventData.date) continue;

            const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
            if (isNaN(eventDate.getTime())) continue;

            const diffMinutes = (eventDate.getTime() - now.getTime()) / (1000 * 60);
            const isUpcoming = diffMinutes >= -15 && diffMinutes <= 30;

            const lastNotified = eventData.lastNotifiedAt?.toDate
              ? eventData.lastNotifiedAt.toDate().getTime()
              : eventData.lastNotifiedAt
                ? new Date(eventData.lastNotifiedAt).getTime()
                : 0;
            const alreadyNotifiedRecently = now.getTime() - lastNotified < 1000 * 60 * 60;

            if (isUpcoming && !alreadyNotifiedRecently) {
              const plainTaskName = await decryptText(eventData.name, uid);
              const taskDuration = eventData.duration || 25;
              const launchUrl = `/timer?task=${encodeURIComponent(plainTaskName)}&duration=${taskDuration}&category=Calendar&autoStart=true`;

              const sendRes = await sendWebPush(userDoc.ref, userTokens, {
                title: `📅 Upcoming Task: ${plainTaskName}`,
                body: `Your scheduled task "${plainTaskName}" (${taskDuration} min) starts now! Tap to launch timer.`,
                url: launchUrl,
                type: 'CALENDAR',
                tag: `event-${eventDoc.id}`,
                extraData: { eventId: eventDoc.id },
              });

              totalSent += sendRes.successCount;
              totalFailed += sendRes.failureCount;

              if (sendRes.successCount > 0) {
                await eventDoc.ref.update({
                  lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                results.push({ uid, type: 'task_reminder', taskName: plainTaskName });
              }
            }
          }
        } catch (taskErr: any) {
          console.error(`Failed to process task notifications for user ${uid}:`, taskErr);
          if (errorsSample.length < 10) {
            errorsSample.push(`calendar(${uid}): ${taskErr?.message || String(taskErr)}`);
          }
        }
      }

      // -----------------------------------------------------------------------
      // 2C. HYDRATION REMINDERS (Deduped per glass slot/day)
      // -----------------------------------------------------------------------
      if (notificationSettings?.hydrationReminders) {
        if (userLocalHour >= 9 && userLocalHour <= 21 && (userLocalHour - 9) % 3 === 0 && userLocalMinute < 20) {
          const glassNumber = Math.floor((userLocalHour - 9) / 3) + 1;
          const slotKey = `hydration_${glassNumber}`;
          if (!notifiedSystemMap[slotKey]) {
            const sendRes = await sendWebPush(userDoc.ref, userTokens, {
              title: '💧 Hydration Goal: 8 Glasses',
              body: `Time for glass #${glassNumber}! Staying hydrated is key to your 8-glass daily discipline.`,
              url: '/',
              type: 'HYDRATION',
              tag: 'hydration-reminder',
            });
            totalSent += sendRes.successCount;
            totalFailed += sendRes.failureCount;
            if (sendRes.successCount > 0) {
              await userDoc.ref.update({ [`notifiedSystemNudges.${todayStr}.${slotKey}`]: true });
              notifiedSystemMap[slotKey] = true;
              results.push({ uid, type: 'hydration', glassNumber });
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // 2D. MOVERS PROTOCOL REMINDERS (Deduped per day)
      // -----------------------------------------------------------------------
      if (userLocalHour === 7 && userLocalMinute < 20 && !notifiedSystemMap['movers_morning']) {
        const sendRes = await sendWebPush(userDoc.ref, userTokens, {
          title: '🌅 MOVERS: Morning Primer',
          body: 'Start your M-O-V-E sequence: Meditation, Oxygenation, Visualization, and Exercise.',
          url: '/routine',
          type: 'MOVERS_MORNING',
          tag: 'movers-morning',
        });
        totalSent += sendRes.successCount;
        totalFailed += sendRes.failureCount;
        if (sendRes.successCount > 0) {
          await userDoc.ref.update({ [`notifiedSystemNudges.${todayStr}.movers_morning`]: true });
          results.push({ uid, type: 'movers_morning' });
        }
      }

      if (userLocalHour === 21 && userLocalMinute < 20 && !notifiedSystemMap['movers_evening']) {
        const bodyText =
          reformerPreference === 'evening_restorer'
            ? 'Time for your Evening Restorer: Meditation, Oxygenation, Visualization, Reading, and Scribing.'
            : 'Wind down with your Reading (R) and Scribing (S) protocol.';

        const sendRes = await sendWebPush(userDoc.ref, userTokens, {
          title: '🌙 MOVERS: Evening Protocol',
          body: bodyText,
          url: '/routine',
          type: 'MOVERS_EVENING',
          tag: 'movers-evening',
        });
        totalSent += sendRes.successCount;
        totalFailed += sendRes.failureCount;
        if (sendRes.successCount > 0) {
          await userDoc.ref.update({ [`notifiedSystemNudges.${todayStr}.movers_evening`]: true });
          results.push({ uid, type: 'movers_evening' });
        }
      }

      // -----------------------------------------------------------------------
      // 2E. STREAK EXPIRY WARNING (Deduped per day)
      // -----------------------------------------------------------------------
      if (
        notificationSettings?.streakExpiryWarning &&
        userLocalHour === 20 &&
        userLocalMinute < 20 &&
        !notifiedSystemMap['streak_warning']
      ) {
        const tasksSnap = await db
          .collection('users')
          .doc(uid)
          .collection('tasks')
          .where('completed', '==', true)
          .get();

        let hasCompletedToday = false;
        tasksSnap.forEach((tDoc) => {
          const tData = tDoc.data();
          const tDate = formatDateInTimeZone(tData.createdAt, timeZone);
          if (tDate === todayStr) hasCompletedToday = true;
        });

        if (!hasCompletedToday) {
          const sendRes = await sendWebPush(userDoc.ref, userTokens, {
            title: '🔥 Streak at Risk!',
            body: "You haven't completed any tasks today. Complete one now to save your streak!",
            url: '/',
            type: 'STREAK_WARNING',
            tag: 'streak-warning',
          });
          totalSent += sendRes.successCount;
          totalFailed += sendRes.failureCount;
          if (sendRes.successCount > 0) {
            await userDoc.ref.update({ [`notifiedSystemNudges.${todayStr}.streak_warning`]: true });
            results.push({ uid, type: 'streak_warning' });
          }
        }
      }

      // -----------------------------------------------------------------------
      // 2F. DAILY SUMMARY (Deduped per day)
      // -----------------------------------------------------------------------
      if (
        notificationSettings?.dailySummary &&
        userLocalHour === 8 &&
        userLocalMinute < 20 &&
        !notifiedSystemMap['daily_summary']
      ) {
        const sendRes = await sendWebPush(userDoc.ref, userTokens, {
          title: '📊 Your Morning Briefing',
          body: 'Ready for a productive day? Your routine is waiting for you in DeadlinesMet.',
          url: '/',
          type: 'DAILY_SUMMARY',
          tag: 'daily-summary',
        });
        totalSent += sendRes.successCount;
        totalFailed += sendRes.failureCount;
        if (sendRes.successCount > 0) {
          await userDoc.ref.update({ [`notifiedSystemNudges.${todayStr}.daily_summary`]: true });
          results.push({ uid, type: 'daily_summary' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      usersScanned,
      usersWithTokens,
      activeSessionsScanned,
      processed: results.length,
      totalSent,
      totalFailed,
      details: results,
      ...(errorsSample.length > 0 ? { errorsSample } : {}),
    });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
