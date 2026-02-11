/**
 * 通知管理ユーティリティ
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { MedicationTime } from "./types";

/**
 * 通知ハンドラーを設定
 * アプリがフォアグラウンドにある場合でも通知を表示
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 通知権限をリクエスト
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Androidの場合、通知チャンネルを設定
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("medication-reminder", {
        name: "服薬リマインダー",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
        lightColor: "#4CAF50",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Failed to request notification permissions:", error);
    return false;
  }
}

/**
 * 服薬時刻の通知をスケジュール
 */
export async function scheduleMedicationNotification(
  time: MedicationTime
): Promise<string | null> {
  try {
    if (!time.enabled) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "服薬の時間です",
        body: `${time.label || "服薬"}の時間です。お薬を飲んでください。`,
        sound: "default",
        data: { timeId: time.id, type: "medication" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Failed to schedule medication notification:", error);
    return null;
  }
}

/**
 * 飲み忘れアラートをスケジュール
 * 指定時刻の1時間後から30分間隔で繰り返し通知
 */
export async function scheduleReminderNotifications(
  time: MedicationTime
): Promise<string[]> {
  try {
    if (!time.enabled) {
      return [];
    }

    const notificationIds: string[] = [];

    // 1時間後、1時間30分後、2時間後、2時間30分後、3時間後の5回分をスケジュール
    for (let i = 1; i <= 5; i++) {
      const delayMinutes = 60 + (i - 1) * 30; // 60, 90, 120, 150, 180分後
      const triggerHour = (time.hour + Math.floor((time.minute + delayMinutes) / 60)) % 24;
      const triggerMinute = (time.minute + delayMinutes) % 60;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ 服薬の確認",
          body: `${time.label || "服薬"}のお薬を飲みましたか？まだの場合は今すぐ飲んでください。`,
          sound: "default",
          data: { timeId: time.id, type: "reminder" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: triggerHour,
          minute: triggerMinute,
          repeats: true,
        },
      });

      notificationIds.push(notificationId);
    }

    return notificationIds;
  } catch (error) {
    console.error("Failed to schedule reminder notifications:", error);
    return [];
  }
}

/**
 * 全ての通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Failed to cancel all notifications:", error);
  }
}

/**
 * 特定の通知をキャンセル
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Failed to cancel notification:", error);
  }
}

/**
 * 全ての服薬時刻の通知を再スケジュール
 */
export async function rescheduleAllNotifications(times: MedicationTime[]): Promise<void> {
  try {
    // 既存の通知を全てキャンセル
    await cancelAllNotifications();

    // 有効な時刻のみ通知をスケジュール
    for (const time of times) {
      if (time.enabled) {
        await scheduleMedicationNotification(time);
        await scheduleReminderNotifications(time);
      }
    }
  } catch (error) {
    console.error("Failed to reschedule all notifications:", error);
  }
}
