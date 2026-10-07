import * as Haptics from 'expo-haptics';

export class HapticService {
  static async light() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }

  static async medium() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }

  static async heavy() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }

  static async success() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  static async warning() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }

  // Master Agent DM haptic patterns
  static async listening() {
    await this.light();
  }

  static async thinking() {
    await this.light();
    setTimeout(async () => {
      await this.light();
    }, 80);
  }

  static async executing() {
    await this.medium();
  }
}
