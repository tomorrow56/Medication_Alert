/**
 * AsyncStorageを使用したデータ永続化ユーティリティ
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MedicationTime, MedicationRecord } from "./types";

const STORAGE_KEYS = {
  MEDICATION_TIMES: "medication_times",
  MEDICATION_RECORDS: "medication_records",
} as const;

/**
 * 服薬時刻設定を保存
 */
export async function saveMedicationTimes(times: MedicationTime[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_TIMES, JSON.stringify(times));
  } catch (error) {
    console.error("Failed to save medication times:", error);
    throw error;
  }
}

/**
 * 服薬時刻設定を取得
 */
export async function getMedicationTimes(): Promise<MedicationTime[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_TIMES);
    if (!data) {
      // デフォルトの設定を返す（朝8時、昼12時、夜8時）
      return [
        { id: "1", hour: 8, minute: 0, enabled: true, label: "朝" },
        { id: "2", hour: 12, minute: 0, enabled: false, label: "昼" },
        { id: "3", hour: 20, minute: 0, enabled: false, label: "夜" },
      ];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get medication times:", error);
    return [];
  }
}

/**
 * 服薬記録を保存
 */
export async function saveMedicationRecord(record: MedicationRecord): Promise<void> {
  try {
    const records = await getMedicationRecords();
    const existingIndex = records.findIndex((r) => r.id === record.id);

    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_RECORDS, JSON.stringify(records));
  } catch (error) {
    console.error("Failed to save medication record:", error);
    throw error;
  }
}

/**
 * 服薬記録を取得
 */
export async function getMedicationRecords(): Promise<MedicationRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_RECORDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get medication records:", error);
    return [];
  }
}

/**
 * 特定の日付の服薬記録を取得
 */
export async function getMedicationRecordsByDate(date: string): Promise<MedicationRecord[]> {
  const records = await getMedicationRecords();
  return records.filter((r) => r.date === date);
}

/**
 * 特定の期間の服薬記録を取得
 */
export async function getMedicationRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<MedicationRecord[]> {
  const records = await getMedicationRecords();
  return records.filter((r) => r.date >= startDate && r.date <= endDate);
}

/**
 * 服薬記録を削除
 */
export async function deleteMedicationRecord(recordId: string): Promise<void> {
  try {
    const records = await getMedicationRecords();
    const filteredRecords = records.filter((r) => r.id !== recordId);
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_RECORDS, JSON.stringify(filteredRecords));
  } catch (error) {
    console.error("Failed to delete medication record:", error);
    throw error;
  }
}

/**
 * 全データをクリア（開発用）
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.MEDICATION_TIMES, STORAGE_KEYS.MEDICATION_RECORDS]);
  } catch (error) {
    console.error("Failed to clear all data:", error);
    throw error;
  }
}
