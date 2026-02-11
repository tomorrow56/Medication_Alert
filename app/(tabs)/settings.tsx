import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, Switch, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import type { MedicationTime } from "@/lib/types";
import { getMedicationTimes, saveMedicationTimes } from "@/lib/storage";
import { formatTime } from "@/lib/date-utils";
import { rescheduleAllNotifications, requestNotificationPermissions } from "@/lib/notifications";

export default function SettingsScreen() {
  const colors = useColors();
  const [medicationTimes, setMedicationTimes] = useState<MedicationTime[]>([]);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // データを読み込む
  const loadData = async () => {
    const times = await getMedicationTimes();
    setMedicationTimes(times);

    // 通知権限を確認
    const hasPermission = await requestNotificationPermissions();
    setNotificationPermission(hasPermission);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 時刻の有効/無効を切り替え
  const toggleTimeEnabled = async (timeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedTimes = medicationTimes.map((t) =>
      t.id === timeId ? { ...t, enabled: !t.enabled } : t
    );

    setMedicationTimes(updatedTimes);
    await saveMedicationTimes(updatedTimes);
    await rescheduleAllNotifications(updatedTimes);
  };

  // 時刻編集を開始
  const startEditingTime = (time: MedicationTime) => {
    const date = new Date();
    date.setHours(time.hour, time.minute, 0, 0);
    setTempTime(date);
    setEditingTimeId(time.id);
    setShowPicker(true);
  };

  // 時刻を保存
  const saveTime = async () => {
    if (!editingTimeId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedTimes = medicationTimes.map((t) =>
      t.id === editingTimeId
        ? { ...t, hour: tempTime.getHours(), minute: tempTime.getMinutes() }
        : t
    );

    setMedicationTimes(updatedTimes);
    await saveMedicationTimes(updatedTimes);
    await rescheduleAllNotifications(updatedTimes);

    setEditingTimeId(null);
    setShowPicker(false);
  };

  // 時刻変更をキャンセル
  const cancelEditing = () => {
    setEditingTimeId(null);
    setShowPicker(false);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="flex-1 gap-6">
          {/* ヘッダー */}
          <View className="items-center">
            <Text className="text-3xl font-bold text-foreground">設定</Text>
          </View>

          {/* 通知権限の確認 */}
          {!notificationPermission && (
            <View className="bg-warning/10 rounded-2xl p-4 border-2 border-warning">
              <Text className="text-warning font-semibold mb-2">⚠️ 通知が無効です</Text>
              <Text className="text-warning text-sm">
                服薬リマインダーを受け取るには、端末の設定から通知を有効にしてください。
              </Text>
            </View>
          )}

          {/* 服薬時刻設定 */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">服薬時刻</Text>

            {medicationTimes.map((time, index) => (
              <View key={time.id} className="bg-surface rounded-2xl p-5 border border-border">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base text-muted mb-1">服薬時刻 {index + 1}</Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {formatTime(time.hour, time.minute)}
                    </Text>
                    {time.label && <Text className="text-sm text-muted mt-1">{time.label}</Text>}
                  </View>

                  <Switch
                    value={time.enabled}
                    onValueChange={() => toggleTimeEnabled(time.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {time.enabled && (
                  <Pressable
                    onPress={() => startEditingTime(time)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.primary,
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                    className="rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold text-base">時刻を変更</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* 説明 */}
          <View className="bg-surface rounded-2xl p-5 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">通知について</Text>
            <View className="gap-2">
              <Text className="text-sm text-muted">
                • 設定した時刻に服薬リマインダーが届きます
              </Text>
              <Text className="text-sm text-muted">
                • 1時間経過後、30分間隔で飲み忘れアラートが届きます
              </Text>
              <Text className="text-sm text-muted">
                • 服薬完了ボタンを押すとアラートが止まります
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 時刻ピッカーモーダル */}
      {showPicker && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-background rounded-2xl p-6 mx-6 w-full max-w-sm border border-border">
            <Text className="text-lg font-bold text-foreground mb-4 text-center">
              時刻を選択
            </Text>

            <View className="items-center mb-6">
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: any, selectedDate?: Date) => {
                  if (selectedDate) {
                    setTempTime(selectedDate);
                  }
                }}
                textColor={colors.foreground}
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={cancelEditing}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="flex-1 rounded-xl py-3 items-center border border-border"
              >
                <Text className="text-foreground font-semibold">キャンセル</Text>
              </Pressable>

              <Pressable
                onPress={saveTime}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                className="flex-1 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">保存</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
