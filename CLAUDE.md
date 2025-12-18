# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

不動産物件の不具合検査を行うWebアプリケーションのプロトタイプです。
お客様とのすり合わせ後、Androidアプリとして実装予定です。

**作業ディレクトリ**: `web-app/` ディレクトリ内で開発を行います。

## 開発コマンド

### 基本コマンド
```bash
cd web-app

# 依存パッケージのインストール
npm install

# 開発サーバーの起動（http://localhost:5173）
npm run dev

# ビルド
npm run build

# Lintチェック
npm run lint

# ビルドしたアプリのプレビュー
npm run preview
```

### テスト実行
現時点ではテストは実装されていません。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルドツール**: Vite 7
- **ルーティング**: React Router v7
- **スタイリング**: TailwindCSS
- **データ保存**: LocalStorage（ブラウザローカル）
- **カメラ機能**: WebカメラAPI（navigator.mediaDevices.getUserMedia）
- **図面機能**: Canvas API

## アーキテクチャ

### データフロー
このアプリはLocalStorageベースの完全クライアントサイドアプリケーションです。
すべてのデータは `localStorage` に保存され、サーバーとの通信はありません。

**重要な設計原則**:
- データの永続化は `src/storage/localStorage.ts` で集中管理
- 認証は固定アカウント（user1/password1, user2/password2）
- 画像はBase64形式でLocalStorageに保存（容量制限に注意）

### ディレクトリ構造

```
web-app/
├── src/
│   ├── pages/          # ページコンポーネント（画面単位）
│   ├── storage/        # LocalStorage管理
│   ├── types/          # TypeScript型定義
│   ├── utils/          # ユーティリティ関数
│   ├── App.tsx         # ルーティング定義
│   └── main.tsx        # エントリーポイント
├── api/                # Vercel Serverless Functions（Basic認証用）
└── public/             # 静的アセット
```

### 型システム（src/types/index.ts）

主要な型定義:
- **User**: ユーザー情報
- **Property**: 物件
- **Floor**: 階層（1F、2F等）
- **Blueprint**: 図面画像
- **Marker**: 図面上の撮影箇所マーカー
- **Inspection**: 検査情報（大分類/中分類/小分類/結果）
- **InspectionResult**: 検査結果（'a' | 'b1' | 'b2' | 'c'）
- **DefectInfo**: 不具合情報（撮影画像含む）
- **ReferenceImage**: 参考画像
- **AppState**: アプリケーション全体の状態

### データ管理（src/storage/localStorage.ts）

**重要な関数**:
- `loadData()`: LocalStorageから全データを読み込み
- `saveData(data)`: 全データをLocalStorageに保存
- `getData<K>(key)`: 特定のキーのデータを取得
- `updateData<K>(key, value)`: 特定のキーのデータを更新
- `authenticateUser(username, password)`: 認証処理
- `getCurrentUser()`: 現在ログイン中のユーザーを取得

### ページ構成とルーティング

画面遷移フロー:
```
LoginPage (/)
  ↓
PropertiesPage (/properties)
  ↓
PropertyDetailPage (/properties/:id)
  ↓
FloorBlueprintPage (/properties/:propertyId/floors/:floorId/blueprints)
  ↓
BlueprintViewPage (/properties/:propertyId/blueprints/:blueprintId)
  ↓ （図面タップ）
InspectionInputPage (/properties/:propertyId/blueprints/:blueprintId/markers/:markerId/inspection)
  ↓ （b2/c選択時）
CameraPage (/properties/:propertyId/blueprints/:blueprintId/markers/:markerId/camera)
  ↓
DefectInputPage (/properties/:propertyId/blueprints/:blueprintId/markers/:markerId/defect)
  ↓
BlueprintViewPage（戻る）
```

サイドフロー:
- **不具合一覧**: `DefectListPage` - 図面表示画面から不具合一覧を表示
- **不具合編集**: `DefectEditPage` - 不具合の編集・削除・画像再撮影
- **参考画像撮影**: `CameraPage` → `ReferenceImageInputPage`
- **参考画像一覧**: `ReferenceImagesPage` - 物件詳細画面から表示

### 検査ロジック

検査結果による分岐処理:
- **a/b1**: 撮影不要 → マーカーのみ保存して完了
- **b2/c**: 撮影必須 → カメラ撮影 → 不具合情報記入

## 開発時の重要な注意点

### カメラ機能
- カメラ機能はHTTPSまたはlocalhostでのみ動作
- モバイルデバイスでテストする場合はHTTPSでホスト必須
- カメラAPIエラーは適切にハンドリングすること

### データ永続化
- LocalStorageの容量制限（通常5-10MB）に注意
- 画像が大量になると容量オーバーの可能性あり
- 重要なデータは定期的にエクスポート機能を使用

### 座標管理
- マーカーの座標は図面画像に対するパーセンテージ（0-100）で保存
- レスポンシブ対応のため、絶対座標ではなく相対座標を使用

### 画像処理
- すべての画像はBase64形式でLocalStorageに保存
- カメラで撮影した画像は適切にリサイズすることを推奨

## デプロイ

### Vercelデプロイ（Basic認証付き）

1. Vercelプロジェクトのセットアップ:
```bash
vercel login
vercel
```

2. 環境変数の設定（Vercelダッシュボード）:
- `BASIC_AUTH_USER`: Basic認証のユーザー名（例: kennet）
- `BASIC_AUTH_PASSWORD`: Basic認証のパスワード（例: kennet2025）

3. 本番デプロイ:
```bash
vercel --prod
```

**認証フロー**:
1. Basic認証（サイトアクセス時）
2. アプリケーションログイン（user1/password1 または user2/password2）

## コーディング規約

### TypeScript
- すべてのコンポーネントはTypeScriptで記述
- 型定義は `src/types/index.ts` に集約
- `any` の使用は避け、適切な型を定義

### React
- 関数コンポーネントを使用
- Hooksを積極的に活用
- State管理はReact標準のuseStateで十分（外部ライブラリ不要）

### スタイリング
- TailwindCSSのユーティリティクラスを使用
- カスタムCSSは最小限に抑える

## 既知の制限事項

1. **LocalStorage容量**: 大量の画像保存は非推奨
2. **オフライン対応**: 未実装（将来のAndroidアプリで対応予定）
3. **マルチユーザー**: LocalStorageのため、ブラウザごとに独立したデータ
4. **データ同期**: サーバーとの同期機能なし

## 画像ストレージ戦略

Androidアプリ化に向けた画像管理の最適化戦略については、[docs/IMAGE_STORAGE_STRATEGY.md](docs/IMAGE_STORAGE_STRATEGY.md) を参照してください。

**要点**:
- **推奨ストレージ**: Backblaze B2（年間$18〜$25で3TB管理可能）
- **画像圧縮**: WebP形式、品質80%で500KB/枚（元3MBから83%削減）
- **ハイブリッドアーキテクチャ**: ローカル（検査中）+ クラウド（長期保管）
- **オフライン対応**: Androidローカルストレージに一時保存後、Wi-Fi接続時にアップロード

## 今後の展開

このWebプロトタイプは以下を目的としています:
- お客様とのUI/UX確認
- 機能要件のすり合わせ
- 実装可能性の検証

最終的にはAndroidアプリとして実装予定で、以下が追加される見込み:
- オフライン完全対応
- USB経由でのデータ取り出し
- より高度なカメラ機能
- パフォーマンス最適化
