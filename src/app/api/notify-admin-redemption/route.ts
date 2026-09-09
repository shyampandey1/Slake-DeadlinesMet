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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, rewardName, amount, creditsRedeemed, upiId } = body;

    initAdmin();

    const formattedCredits = creditsRedeemed ? Number(creditsRedeemed).toLocaleString() : '0';
    const upiStr = upiId && upiId.trim() ? upiId.trim() : 'N/A';
    const title = `🎁 Reward Redemption: ${rewardName}`;
    const notificationMessage = `${userName || 'A user'} (${userEmail || 'No email'}) redeemed ${rewardName} for ${formattedCredits} DM Coins. UPI ID: ${upiStr}`;

    let fcmSentCount = 0;

    // Check if firebase admin is initialized
    if (admin.apps.length) {
      const db = admin.firestore();

      // Store in admin_notifications collection
      await db.collection('admin_notifications').add({
        type: 'REDEMPTION_REQUEST',
        title,
        message: notificationMessage,
        userId: userId || null,
        userName: userName || 'Anonymous',
        userEmail: userEmail || null,
        rewardName: rewardName || 'Unknown Reward',
        creditsRedeemed: creditsRedeemed || 0,
        amount: amount || 0,
        upiId: upiStr,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });

      // Find admin user(s) (Shyam Pandey / shyamp028@gmail.com / isReformersAdmin)
      const usersSnap = await db.collection('users').get();
      const adminDocs: { id: string; fcmTokens?: string[] }[] = [];

      usersSnap.forEach(doc => {
        const data = doc.data();
        const emailMatch = data.email && data.email.toLowerCase() === 'shyamp028@gmail.com';
        const nameMatch = data.displayName && data.displayName.toLowerCase().includes('shyam pandey');
        const isAdminFlag = data.isReformersAdmin === true;

        if (emailMatch || nameMatch || isAdminFlag) {
          adminDocs.push({
            id: doc.id,
            fcmTokens: data.fcmTokens || (data.fcmToken ? [data.fcmToken] : [])
          });
        }
      });

      // Send direct message and FCM push to each admin
      for (const adminUser of adminDocs) {
        // Direct chat message to admin
        await db.collection('messages').add({
          senderId: userId || 'system',
          receiverId: adminUser.id,
          text: notificationMessage,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // FCM push notification
        if (adminUser.fcmTokens && adminUser.fcmTokens.length > 0) {
          try {
            const message = {
              notification: {
                title: title,
                body: `${userName || 'User'} redeemed ${rewardName} (${formattedCredits} DM Coins). UPI: ${upiStr}`,
              },
              tokens: adminUser.fcmTokens,
              data: {
                url: '/reformers',
                type: 'REDEMPTION_ALERT',
                rewardName: rewardName || '',
                userName: userName || '',
                upiId: upiStr
              }
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            fcmSentCount += response.successCount;
          } catch (fcmErr) {
            console.error('Failed to send FCM push to admin:', fcmErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin notification processed',
      fcmSentCount
    });

  } catch (error: any) {
    console.error('Error in notify-admin-redemption route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
