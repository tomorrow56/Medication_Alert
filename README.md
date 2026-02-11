# 服薬管理アプリ

毎日の服薬を簡単に記録・管理できるモバイルアプリです。

## 主な機能

- **服薬時刻の設定**: 1日最大3回（朝・昼・夜）の服薬時刻を設定可能
- **自動通知**: 設定した時刻に通知を送信
- **飲み忘れアラート**: 1時間経過後、30分間隔で繰り返し通知
- **ワンタップ記録**: 服薬完了ボタンで簡単に記録
- **カレンダー表示**: 過去の服薬履歴をカレンダー形式で確認
- **達成率の可視化**: 日付ごとの服薬完了率を色分けで表示

## 技術スタック

- **フレームワーク**: React Native (Expo SDK 54)
- **UI**: NativeWind 4 (Tailwind CSS)
- **通知**: expo-notifications
- **ストレージ**: AsyncStorage
- **言語**: TypeScript

## 開発環境のセットアップ

```bash
# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev

# Expo Goアプリでスキャン（通知機能は動作しません）
```

## Development Build（推奨）

通知機能を使用するには、Development Buildが必要です。

詳細は [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) を参照してください。

## プロジェクト構造

```
medication-reminder/
├── app/                    # アプリケーション画面
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # ホーム画面
│   │   ├── calendar.tsx   # カレンダー画面
│   │   └── settings.tsx   # 設定画面
│   └── _layout.tsx        # ルートレイアウト
├── components/            # 再利用可能なコンポーネント
├── lib/                   # ユーティリティとロジック
│   ├── types.ts          # 型定義
│   ├── storage.ts        # データ永続化
│   ├── notifications.ts  # 通知管理
│   └── date-utils.ts     # 日付ユーティリティ
├── assets/               # 画像とフォント
├── eas.json             # EAS Build設定
└── app.config.ts        # Expo設定
```

## 使い方

1. **初回起動時**: 通知権限を許可
2. **設定画面**: 服薬時刻を設定（最大3回）
3. **ホーム画面**: 今日のスケジュールを確認、服薬完了ボタンをタップ
4. **カレンダー画面**: 過去の服薬履歴を確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、[BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) のトラブルシューティングセクションを参照してください。
