import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('deadlinesmet-timer', {
        name: 'Focus Timer & Intervals',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  static async sendTimerCompletionNotification(taskName: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Focus Session Conquered!',
          body: `You've completed "${taskName}". Take a deep breath and log your progress.`,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }

  static async sendIntervalAlert(intervalMinutes: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏱️ ${intervalMinutes}m Interval Check`,
          body: 'Check your posture, blink your eyes, and stay locked in.',
          sound: true,
        },
        trigger: null,
      });
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }
}
