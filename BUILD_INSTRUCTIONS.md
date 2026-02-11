# 服薬管理アプリ - Development Build 手順書

このドキュメントでは、ローカル環境でDevelopment Buildを作成し、実機にインストールする手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- pnpmがインストールされていること（`npm install -g pnpm`）
- Expoアカウントを持っていること（https://expo.dev/signup で無料登録）
- Android実機またはiOS実機

## 手順

### 1. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd medication-reminder

# 依存関係をインストール
pnpm install

# EAS CLIをグローバルにインストール
npm install -g eas-cli

# Expoアカウントにログイン
eas login
```

### 2. EASプロジェクトの初期化

```bash
# EASプロジェクトを初期化（初回のみ）
eas build:configure
```

### 3. Development Buildの作成

#### Androidの場合:

```bash
# Android Development Buildを作成
eas build --profile development --platform android

# ビルドが完了するまで10〜20分待ちます
# 完了後、QRコードまたはダウンロードリンクが表示されます
```

#### iOSの場合:

```bash
# iOS Development Buildを作成
eas build --profile development --platform ios

# ビルドが完了するまで10〜20分待ちます
# 完了後、QRコードまたはダウンロードリンクが表示されます
```

### 4. 実機へのインストール

#### Androidの場合:

1. ビルド完了後に表示されるQRコードをスキャン、またはダウンロードリンクをタップ
2. APKファイルをダウンロード
3. 「提供元不明のアプリ」のインストールを許可
4. APKファイルをインストール

#### iOSの場合:

1. ビルド完了後に表示されるリンクをSafariで開く
2. プロファイルをインストール
3. 設定 > 一般 > VPNとデバイス管理 から開発者を信頼
4. アプリをインストール

### 5. アプリの起動

1. インストールしたアプリを起動
2. 開発サーバーに接続（自動的に接続されます）
3. 通知権限を許可
4. 設定画面から服薬時刻を設定

## トラブルシューティング

### ビルドが失敗する場合

```bash
# キャッシュをクリアして再試行
eas build --profile development --platform android --clear-cache
```

### 通知が届かない場合

- Android: 設定 > アプリ > 服薬管理 > 通知 で通知が有効になっているか確認
- iOS: 設定 > 通知 > 服薬管理 で通知が有効になっているか確認

### 開発サーバーに接続できない場合

```bash
# ローカルで開発サーバーを起動
pnpm dev

# 同じWi-Fiネットワークに接続していることを確認
```

## プレビュー版ビルド（テスト配布用）

より安定したビルドを作成する場合:

```bash
# プレビュー版をビルド
eas build --profile preview --platform android
```

## 本番ビルド（Google Play / App Store用）

アプリストアに公開する場合:

```bash
# 本番ビルドを作成
eas build --profile production --platform android
eas build --profile production --platform ios
```

## 参考リンク

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## サポート

問題が発生した場合は、以下を確認してください:

1. Node.jsのバージョンが18以上か
2. pnpmが正しくインストールされているか
3. Expoアカウントにログインしているか
4. インターネット接続が安定しているか

それでも解決しない場合は、Expoの公式ドキュメントを参照してください。
