import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { UserProfile } from '@/types';
import { decryptText } from '@/lib/crypto';

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export async function GET(req: Request) {
  // Check for authorization (Vercel Cron uses a secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    initAdmin();
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    
    const now = new Date();
    const results: any[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data() as UserProfile & { fcmToken?: string };
      const { notificationSettings, region, userId } = userData;
      
      // Harmonize tokens: support both fcmTokens (array) and fcmToken (legacy string)
      const userTokens: string[] = Array.from(
        new Set([...(userData.fcmTokens || []), ...(userData.fcmToken ? [userData.fcmToken] : [])])
      ).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

      if (userTokens.length === 0) continue;

      // 1. Determine local time for user
      const userTimeZone = region || 'UTC';
      let userLocalTime = now;
      try {
        userLocalTime = new Date(now.toLocaleString('en-US', { timeZone: userTimeZone }));
      } catch (e) {
        userLocalTime = now;
      }
      const userLocalHour = userLocalTime.getHours();
      const todayStr = userLocalTime.toISOString().split('T')[0];

      // --- SCHEDULED TASKS & CALENDAR DEADLINES ---
      const taskRemindersEnabled = notificationSettings?.taskReminders !== false;
      if (taskRemindersEnabled) {
        try {
          const eventsSnap = await db.collection('users').doc(userId).collection('userEvents').get();
          for (const eventDoc of eventsSnap.docs) {
            const eventData = eventDoc.data();
            if (!eventData.date) continue;

            const eventDate = new Date(eventData.date);
            if (isNaN(eventDate.getTime())) continue;

            // Check if event is scheduled for around now (e.g. starting within next 60m or started within past 15m)
            const diffMinutes = (eventDate.getTime() - now.getTime()) / (1000 * 60);
            const isUpcoming = diffMinutes >= -15 && diffMinutes <= 60;

            // Deduplicate: check lastNotifiedAt
            const lastNotified = eventData.lastNotifiedAt?.toDate 
              ? eventData.lastNotifiedAt.toDate().getTime() 
              : (eventData.lastNotifiedAt ? new Date(eventData.lastNotifiedAt).getTime() : 0);
            const alreadyNotifiedRecently = (now.getTime() - lastNotified) < 1000 * 60 * 90; // within 90 mins

            if (isUpcoming && !alreadyNotifiedRecently) {
              const plainTaskName = await decryptText(eventData.name, userId);
              const taskDuration = eventData.duration || 25;
              const message = {
                notification: {
                  title: `Upcoming Task: ${plainTaskName}`,
                  body: `Your scheduled task "${plainTaskName}" (${taskDuration} min) starts soon! Time to conquer your deadline.`,
                },
                tokens: userTokens,
                data: {
                  url: "/calendar?from_notification=true",
                  type: "CALENDAR",
                  eventId: eventDoc.id
                }
              };

              await admin.messaging().sendEachForMulticast(message);
              await eventDoc.ref.update({
                lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              results.push({ userId, type: 'task_reminder', taskName: plainTaskName });
            }
          }
        } catch (taskErr) {
          console.error(`Failed to process task notifications for user ${userId}:`, taskErr);
        }
      }

      // --- HYDRATION REMINDERS ---
      if (notificationSettings?.hydrationReminders) {
        // Reminders every 3 hours between 9 AM and 9 PM
        if (userLocalHour >= 9 && userLocalHour <= 21 && (userLocalHour - 9) % 3 === 0) {
          const glassNumber = Math.floor((userLocalHour - 9) / 3) + 1;
          const message = {
            notification: {
              title: "💧 Hydration Goal: 8 Glasses",
              body: `Time for glass #${glassNumber}! Staying hydrated is key to your 8-glass daily discipline.`,
            },
            tokens: userTokens,
            data: { url: "/", type: "HYDRATION" }
          };
          await admin.messaging().sendEachForMulticast(message);
          results.push({ userId, type: 'hydration' });
        }
      }

      // --- MOVERS PROTOCOL REMINDERS ---
      const { reformerPreference } = userData;
      
      // Morning MOVERS (M+O+V+E)
      if (userLocalHour === 7) {
        const message = {
          notification: {
            title: "🌅 MOVERS: Morning Primer",
            body: "Start your M-O-V-E sequence: Meditation, Oxygenation, Visualization, and Exercise.",
          },
          tokens: userTokens,
          data: { url: "/routine", type: "MOVERS_MORNING" }
        };
        await admin.messaging().sendEachForMulticast(message);
        results.push({ userId, type: 'movers_morning' });
      }

      // Evening MOVERS (R+S or M+O+V+R+S)
      if (userLocalHour === 21) {
        const body = reformerPreference === 'evening_restorer' 
          ? "Time for your Evening Restorer: Meditation, Oxygenation, Visualization, Reading, and Scribing."
          : "Wind down with your Reading (R) and Scribing (S) protocol.";
        
        const message = {
          notification: {
            title: "🌙 MOVERS: Evening Protocol",
            body: body,
          },
          tokens: userTokens,
          data: { url: "/routine", type: "MOVERS_EVENING" }
        };
        await admin.messaging().sendEachForMulticast(message);
        results.push({ userId, type: 'movers_evening' });
      }

      // --- STREAK EXPIRY WARNING ---
      if (notificationSettings?.streakExpiryWarning) {
        // Only warn after 8 PM
        if (userLocalHour >= 20) {
          // Check if user has completed any tasks today
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
              data: { url: "/", type: "STREAK_WARNING" }
            };
            await admin.messaging().sendEachForMulticast(message);
            results.push({ userId, type: 'streak_warning' });
          }
        }
      }

      // --- DAILY SUMMARY ---
      if (notificationSettings?.dailySummary) {
        // Send at 8 AM
        if (userLocalHour === 8) {
          const message = {
            notification: {
              title: "📊 Your Morning Briefing",
              body: "Ready for a productive day? Your routine is waiting for you in Slake.",
            },
            tokens: userTokens,
            data: { url: "/", type: "DAILY_SUMMARY" }
          };
          await admin.messaging().sendEachForMulticast(message);
          results.push({ userId, type: 'daily_summary' });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
