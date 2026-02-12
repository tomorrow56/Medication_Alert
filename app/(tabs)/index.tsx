import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import type { MedicationTime, MedicationRecord } from "@/lib/types";
import { getMedicationTimes, getMedicationRecordsByDate, saveMedicationRecord, deleteMedicationRecord } from "@/lib/storage";
import { formatTime, getTodayString, isTimePassed, getMinutesUntil } from "@/lib/date-utils";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function HomeScreen() {
  const colors = useColors();
  const [medicationTimes, setMedicationTimes] = useState<MedicationTime[]>([]);
  const [todayRecords, setTodayRecords] = useState<MedicationRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // データを読み込む
  const loadData = async () => {
    const times = await getMedicationTimes();
    const records = await getMedicationRecordsByDate(getTodayString());
    setMedicationTimes(times.filter((t) => t.enabled));
    setTodayRecords(records);
  };

  useEffect(() => {
    loadData();

    // 1分ごとに現在時刻を更新
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // リフレッシュ
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 服薬記録を追加
  const handleTakeMedication = async (time: MedicationTime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const today = getTodayString();
    const recordId = `${today}-${time.id}`;
    const scheduledTime = new Date();
    scheduledTime.setHours(time.hour, time.minute, 0, 0);

    const newRecord: MedicationRecord = {
      id: recordId,
      timeId: time.id,
      scheduledTime: scheduledTime.toISOString(),
      takenAt: new Date().toISOString(),
      date: today,
    };

    await saveMedicationRecord(newRecord);
    await loadData();
  };

  // 服薬記録を削除
  const handleDeleteRecord = async (timeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = getTodayString();
    const recordId = `${today}-${timeId}`;
    await deleteMedicationRecord(recordId);
    await loadData();
  };

  // 服薬済みかチェック
  const isTaken = (timeId: string): boolean => {
    return todayRecords.some((r) => r.timeId === timeId && r.takenAt !== null);
  };

  // 飲み忘れ状態かチェック（1時間以上経過）
  const isMissed = (time: MedicationTime): boolean => {
    if (isTaken(time.id)) return false;
    const minutesPassed = -getMinutesUntil(time.hour, time.minute);
    return minutesPassed >= 60;
  };

  // 次の服薬時刻を取得
  const getNextMedication = (): MedicationTime | null => {
    const upcoming = medicationTimes.filter((t) => !isTaken(t.id) && !isTimePassed(t.hour, t.minute));
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const nextMed = getNextMedication();
  const completedCount = medicationTimes.filter((t) => isTaken(t.id)).length;
  const totalCount = medicationTimes.length;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">服薬管理</Text>
            <Text className="text-base text-muted">
              今日の服薬: {completedCount}/{totalCount}
            </Text>
          </View>

          {/* 次の服薬時刻 */}
          {nextMed && (
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-sm text-muted mb-2">次の服薬</Text>
              <Text className="text-2xl font-bold text-foreground mb-1">
                {formatTime(nextMed.hour, nextMed.minute)}
              </Text>
              <Text className="text-base text-muted">
                あと {getMinutesUntil(nextMed.hour, nextMed.minute)} 分
              </Text>
            </View>
          )}

          {/* 今日の服薬スケジュール */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">今日のスケジュール</Text>

            {medicationTimes.length === 0 && (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-muted text-center">
                  服薬時刻が設定されていません。{"\n"}設定画面から追加してください。
                </Text>
              </View>
            )}

            {medicationTimes.map((time) => {
              const taken = isTaken(time.id);
              const missed = isMissed(time);

              return (
                <View
                  key={time.id}
                  className="bg-surface rounded-2xl p-5 border border-border"
                  style={{
                    borderColor: missed ? colors.error : taken ? colors.success : colors.border,
                    borderWidth: missed || taken ? 2 : 1,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-foreground">
                        {formatTime(time.hour, time.minute)}
                      </Text>
                      {time.label && <Text className="text-sm text-muted mt-1">{time.label}</Text>}
                    </View>

                    {taken && (
                      <View className="bg-success rounded-full px-3 py-1">
                        <Text className="text-white text-xs font-semibold">完了</Text>
                      </View>
                    )}

                    {missed && (
                      <View className="bg-error rounded-full px-3 py-1">
                        <Text className="text-white text-xs font-semibold">飲み忘れ</Text>
                      </View>
                    )}
                  </View>

                  {!taken && (
                    <Pressable
                      onPress={() => handleTakeMedication(time)}
                      style={({ pressed }) => [
                        {
                          backgroundColor: missed ? colors.error : colors.primary,
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                        },
                      ]}
                      className="rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-semibold text-base">服薬完了</Text>
                    </Pressable>
                  )}

                  {taken && todayRecords.find((r) => r.timeId === time.id)?.takenAt && (
                    <View className="gap-2 mt-2">
                      <View className="items-center">
                        <Text className="text-xs text-muted">
                          服薬時刻:{" "}
                          {new Date(
                            todayRecords.find((r) => r.timeId === time.id)!.takenAt!
                          ).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteRecord(time.id)}
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
                  )}
                </View>
              );
            })}
          </View>

          {/* 完了メッセージ */}
          {totalCount > 0 && completedCount === totalCount && (
            <View className="bg-success/10 rounded-2xl p-6 border-2 border-success items-center">
              <Text className="text-success text-lg font-bold mb-1">🎉 本日の服薬完了！</Text>
              <Text className="text-success text-sm">お疲れ様でした</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
