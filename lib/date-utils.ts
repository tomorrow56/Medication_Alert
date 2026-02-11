/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * 時刻をHH:MM形式にフォーマット
 */
export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * 指定した日付と時刻からDateオブジェクトを生成
 */
export function createDateTime(dateString: string, hour: number, minute: number): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * 2つの日付の差分（日数）を計算
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 指定した月の日数を取得
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 指定した月の1日が何曜日か取得（0=日曜日）
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * 月の名前を取得
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  return monthNames[month - 1];
}

/**
 * 曜日の名前を取得
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return dayNames[dayOfWeek];
}

/**
 * 現在時刻が指定した時刻を過ぎているか判定
 */
export function isTimePassed(hour: number, minute: number): boolean {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(hour, minute, 0, 0);
  return now > targetTime;
}

/**
 * 指定した時刻までの残り時間（分）を計算
 */
export function getMinutesUntil(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // 既に過ぎている場合は翌日の時刻として計算
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
}
