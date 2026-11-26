import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { HabitView } from './habits';
import { supabase } from './supabase';

// Uygulama açıkken gelen bildirim de gösterilsin.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const REMINDER_CHANNEL = 'reminders';

async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Hatırlatmalar',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Alışkanlık hatırlatmalarını telefonda zamanlar (sunucu gerekmez).
 * Önceki alışkanlık hatırlatmaları silinip güncel listeyle yeniden kurulur.
 */
export async function syncHabitReminders(habits: HabitView[]) {
  try {
    if (Platform.OS === 'web') return;
    const withReminder = habits.filter((h) => h.reminder_time);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === 'habit')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!withReminder.length || !(await ensurePermission())) return;

    for (const h of withReminder) {
      const [hour, minute] = h.reminder_time!.split(':').map(Number);
      const content = {
        title: h.title,
        body: h.target ? `Bugünkü hedefin: ${h.target}${h.unit ? ' ' + h.unit : ''}` : 'Bugün yapmayı unutma.',
        data: { kind: 'habit', habitId: h.id },
      };
      if (h.frequency === 'weekdays') {
        // weekday: 1 = Pazar, 2 = Pazartesi … 6 = Cuma
        for (const weekday of [2, 3, 4, 5, 6]) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId: REMINDER_CHANNEL },
          });
        }
      } else {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: REMINDER_CHANNEL },
        });
      }
    }
  } catch (e) {
    // Bildirimler desteklenmiyorsa (ör. bazı Expo Go sürümleri) uygulama çalışmaya devam etsin.
    console.warn('Hatırlatmalar zamanlanamadı', e);
  }
}

/**
 * Bu cihazın Expo push kaydını alır ve kullanıcıya bağlar. Simülatörde, web'de ya da
 * izin verilmediyse sessizce vazgeçer.
 */
export async function registerPushToken(userId: string) {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    if (!(await ensurePermission())) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').upsert(
      { token, user_id: userId, platform: Platform.OS === 'ios' ? 'ios' : 'android', updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );
  } catch (e) {
    console.warn('Bildirim kaydı alınamadı', e);
  }
}

/** Çıkışta bu cihazın kaydını sil (başka kullanıcıya bildirim gitmesin). */
export async function unregisterPushToken() {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // önemsiz
  }
}
