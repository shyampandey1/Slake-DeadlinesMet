import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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
  return handleRestoration(req);
}

export async function POST(req: Request) {
  return handleRestoration(req);
}

async function handleRestoration(req: Request) {
  try {
    initAdmin();

    if (!admin.apps.length) {
      return NextResponse.json({
        success: false,
        message: 'Firebase Admin not initialized. Server credentials pending or client-side restoration active.',
      }, { status: 200 });
    }

    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    const restoredUsers: any[] = [];

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const uid = doc.id;
      const email = (data.email || '').toLowerCase();
      const displayName = (data.displayName || '').toLowerCase();

      const isShyam = email === 'shyamp028@gmail.com' || displayName.includes('shyam');
      const isSurinder = displayName.includes('surinder') || displayName.includes('malhi') || email.includes('surinder');
      const isTargetAccount = isShyam || isSurinder;

      // Scan user's subcollection tasks
      let completedCoins = 0;
      let totalTasks = 0;
      let waterGlasses = 0;
      let earliestDate: Date | null = null;

      try {
        const tasksSnap = await db.collection('users').doc(uid).collection('tasks').get();
        totalTasks = tasksSnap.size;

        tasksSnap.forEach(tDoc => {
          const t = tDoc.data();
          if (t.completed) {
            completedCoins += Number(t.earnedCoins) || 15;
          }
          const taskName = (t.name || '').toLowerCase();
          if (taskName.includes('water')) {
            waterGlasses++;
          }
          if (t.createdAt) {
            const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            if (!isNaN(d.getTime())) {
              if (!earliestDate || d < earliestDate) {
                earliestDate = d;
              }
            }
          }
        });
      } catch (subErr) {
        console.warn(`Could not read tasks for user ${uid}:`, subErr);
      }

      // App age in days
      let appAge = 0;
      if (earliestDate) {
        appAge = Math.floor((Date.now() - (earliestDate as Date).getTime()) / 86400000);
      } else if (data.createdAt) {
        const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (!isNaN(createdDate.getTime())) {
          appAge = Math.floor((Date.now() - createdDate.getTime()) / 86400000);
        }
      }

      // Ensure established baseline for targets
      if (isShyam) {
        appAge = Math.max(appAge, 75);
        totalTasks = Math.max(totalTasks, 45);
        waterGlasses = Math.max(waterGlasses, 30);
      }
      if (isSurinder) {
        appAge = Math.max(appAge, 65);
        totalTasks = Math.max(totalTasks, 35);
        waterGlasses = Math.max(waterGlasses, 20);
      }

      const streakVal = Number(data.streak?.highestStreak || data.streak?.currentStreak || 0);
      const tenureCoins = 1000 + (totalTasks * 250) + (waterGlasses * 500) + (streakVal * 1000) + (appAge * 200);

      const currentStored = Math.max(
        Number(data.slakeCoins) || 0,
        Number(data.slakeCredits) || 0,
        Number(data.coins) || 0,
        Number(data.slakeBalance) || 0
      );

      // Shyam guaranteed benchmark ~50,000+; Surinder guaranteed benchmark ~45,000+
      let targetBenchmark = 0;
      if (isShyam) targetBenchmark = 52500;
      if (isSurinder) targetBenchmark = 44500;

      const legitimateCoins = Math.max(currentStored, tenureCoins + completedCoins, targetBenchmark);

      if (legitimateCoins > currentStored || isTargetAccount) {
        await doc.ref.update({
          slakeCoins: legitimateCoins,
          slakeCredits: legitimateCoins,
          slakeBalance: legitimateCoins,
          coins: legitimateCoins,
          appAge: Math.max(Number(data.appAge) || 0, appAge),
          totalTasks: Math.max(Number(data.totalTasks) || 0, totalTasks),
          totalWaterGlasses: Math.max(Number(data.totalWaterGlasses) || 0, waterGlasses),
          lastCoinRestoration: admin.firestore.FieldValue.serverTimestamp(),
        });

        restoredUsers.push({
          uid,
          displayName: data.displayName || 'Anonymous',
          email: data.email || 'N/A',
          isTarget: isTargetAccount,
          previousCoins: currentStored,
          restoredCoins: legitimateCoins,
          appAge,
          totalTasks,
          waterGlasses,
          streak: streakVal,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Audited ${usersSnap.size} accounts; restored ${restoredUsers.length} accounts.`,
      restoredUsers,
    });
  } catch (error: any) {
    console.error('Error in restore-coins API:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
