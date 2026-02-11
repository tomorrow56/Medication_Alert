/**
 * 服薬管理アプリのデータ型定義
 */

/**
 * 服薬時刻の設定
 */
export interface MedicationTime {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  label?: string; // 例: "朝", "昼", "夜"
}

/**
 * 服薬記録
 */
export interface MedicationRecord {
  id: string;
  timeId: string; // MedicationTime.id
  scheduledTime: string; // ISO 8601形式の予定時刻
  takenAt: string | null; // ISO 8601形式の実際の服薬時刻（null = 未服薬）
  date: string; // YYYY-MM-DD形式
}

/**
 * 通知スケジュール
 */
export interface NotificationSchedule {
  timeId: string;
  notificationId: string;
  reminderNotificationIds: string[]; // 飲み忘れアラートの通知ID配列
}

/**
 * 日別の服薬統計
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD形式
  total: number; // その日の総服薬回数
  completed: number; // 完了した回数
  missed: number; // 飲み忘れた回数
}
