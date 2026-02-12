import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import type { MedicationTime, MedicationRecord } from "@/lib/types";
import { getMedicationTimes, getMedicationRecordsByDateRange, deleteMedicationRecord } from "@/lib/storage";
import {
  formatDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  getTodayString,
  formatTime,
} from "@/lib/date-utils";

export default function CalendarScreen() {
  const colors = useColors();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [medicationTimes, setMedicationTimes] = useState<MedicationTime[]>([]);
  const [records, setRecords] = useState<MedicationRecord[]>([]);

  // データを読み込む
  const loadData = async () => {
    const times = await getMedicationTimes();
    setMedicationTimes(times.filter((t) => t.enabled));

    // 選択中の月の全記録を取得
    const firstDay = formatDate(new Date(selectedYear, selectedMonth - 1, 1));
    const lastDay = formatDate(new Date(selectedYear, selectedMonth, 0));
    const monthRecords = await getMedicationRecordsByDateRange(firstDay, lastDay);
    setRecords(monthRecords);
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  // タブがフォーカスされたときにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedYear, selectedMonth])
  );

  // 前月へ
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDate(null);
  };

  // 次月へ
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDate(null);
  };

  // 指定日の服薬完了率を計算
  const getCompletionRate = (dateString: string): { completed: number; total: number } => {
    const dayRecords = records.filter((r) => r.date === dateString);
    const completed = dayRecords.filter((r) => r.takenAt !== null).length;
    const total = medicationTimes.length;
    return { completed, total };
  };

  // 服薬記録を削除
  const handleDeleteRecord = async (recordId: string) => {
    await deleteMedicationRecord(recordId);
    await loadData();
  };

  // カレンダーの日付配列を生成
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfWeek = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days: (number | null)[] = [];

    // 月初の空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // 日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedDateRecords = selectedDate
    ? records.filter((r) => r.date === selectedDate && r.takenAt !== null)
    : [];

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center">
            <Text className="text-3xl font-bold text-foreground">服薬カレンダー</Text>
          </View>

          {/* 月選択 */}
          <View className="flex-row items-center justify-between bg-surface rounded-2xl p-4 border border-border">
            <Pressable
              onPress={goToPreviousMonth}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              className="p-2"
            >
              <Text className="text-2xl text-foreground">←</Text>
            </Pressable>

            <Text className="text-xl font-bold text-foreground">
              {selectedYear}年 {getMonthName(selectedMonth)}
            </Text>

            <Pressable
              onPress={goToNextMonth}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              className="p-2"
            >
              <Text className="text-2xl text-foreground">→</Text>
            </Pressable>
          </View>

          {/* 曜日ヘッダー */}
          <View className="flex-row">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
              <View key={index} className="flex-1 items-center py-2">
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: index === 0 ? colors.error : index === 6 ? "#2196F3" : colors.muted,
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
              }

              const dateString = formatDate(new Date(selectedYear, selectedMonth - 1, day));
              const { completed, total } = getCompletionRate(dateString);
              const isToday = dateString === getTodayString();
              const isSelected = dateString === selectedDate;

              let bgColor = colors.surface;
              if (total > 0) {
                if (completed === total) {
                  bgColor = colors.success;
                } else if (completed > 0) {
                  bgColor = colors.warning;
                } else {
                  bgColor = colors.error;
                }
              }

              return (
                <View key={day} className="w-[14.28%] aspect-square p-1">
                  <Pressable
                    onPress={() => setSelectedDate(dateString)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: total > 0 ? bgColor : colors.surface,
                        opacity: pressed ? 0.7 : 1,
                        borderWidth: isSelected ? 2 : isToday ? 1 : 0,
                        borderColor: isSelected ? colors.primary : colors.foreground,
                      },
                    ]}
                    className="flex-1 rounded-lg items-center justify-center"
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: total > 0 ? "#FFFFFF" : colors.foreground,
                      }}
                    >
                      {day}
                    </Text>
                    {total > 0 && (
                      <Text className="text-xs" style={{ color: "#FFFFFF" }}>
                        {completed}/{total}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* 選択日の詳細 */}
          {selectedDate && (
            <View className="bg-surface rounded-2xl p-6 border border-border gap-4">
              <Text className="text-lg font-bold text-foreground">{selectedDate}の記録</Text>

              {selectedDateRecords.length === 0 && (
                <Text className="text-muted text-center py-4">この日の服薬記録はありません</Text>
              )}

              {selectedDateRecords.map((record) => {
                const time = medicationTimes.find((t) => t.id === record.timeId);
                if (!time) return null;

                return (
                  <View key={record.id} className="bg-background rounded-xl p-4 gap-3">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-base font-semibold text-foreground">
                          {formatTime(time.hour, time.minute)}
                        </Text>
                        {time.label && <Text className="text-sm text-muted">{time.label}</Text>}
                      </View>
                      <View className="items-end">
                        <Text className="text-sm text-success font-semibold">✓ 完了</Text>
                        {record.takenAt && (
                          <Text className="text-xs text-muted">
                            {new Date(record.takenAt).toLocaleTimeString("ja-JP", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteRecord(record.id)}
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.error,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      className="rounded-lg py-2 items-center"
                    >
                      <Text className="text-white text-xs font-semibold">記録を削除</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
