# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

不動産物件の不具合検査を行うPWAアプリケーション（検NET現地調査アプリ）です。

**作業ディレクトリ**: `pwa-app/` ディレクトリ内で開発を行います。（`web-app/` は旧プロトタイプ版のため使用しません）

## 開発コマンド

```bash
cd pwa-app
npm install      # 依存パッケージのインストール
npm run dev      # 開発サーバーの起動（http://localhost:5173）
npm run build    # ビルド
npm run lint     # Lintチェック
```

## ログイン情報

- **user1** / `KennetInspect2025!User1`
- **user2** / `KennetInspect2025!User2`

パスワードはSHA-256ハッシュ化して `pwa-app/src/storage/indexedDB.ts` に保存。
ハッシュ化ロジックは `pwa-app/src/utils/auth.ts`（Web Crypto API使用）。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルドツール**: Vite 7
- **ルーティング**: React Router v7
- **スタイリング**: TailwindCSS
- **データ保存**: IndexedDB（Dexie.js）— **非同期API、必ずawaitすること**
- **カメラ機能**: WebカメラAPI（navigator.mediaDevices.getUserMedia）
- **図面機能**: Canvas API
- **デプロイ**: Vercel + Basic Auth middleware + PWA

## アーキテクチャ

### データフロー
PWAアプリケーションで、IndexedDBにデータを保存。サーバーとの通信はB2アップロードのみ。

**重要な設計原則**:
- データの永続化は `src/storage/indexedDB.ts` で集中管理（async/await必須）
- 認証は固定アカウント（SHA-256ハッシュ化済み）
- 画像はBase64形式でIndexedDBに保存

### ディレクトリ構造（pwa-app）

```
pwa-app/
├── src/
│   ├── pages/                  # ページコンポーネント
│   │   └── inspection/         # 検査チェックリスト関連
│   │       ├── InspectionChecklistPage.tsx  # メインページ
│   │       ├── inspectionConstants.ts       # 定数・DEBUG_MODE
│   │       ├── useInspectionChecklist.ts    # ロジックhook
│   │       ├── MaintenanceSection.tsx       # メンテナンス状況UI
│   │       └── GaihekiGroupInputs.tsx       # 外壁グループ入力（構造種別切替）
│   ├── storage/indexedDB.ts    # IndexedDB管理（Dexie.js）
│   ├── types/
│   │   ├── index.ts            # 基本型定義
│   │   └── inspectionData.ts   # 検査データ型定義
│   ├── utils/
│   │   ├── inspectionMaster.ts # 検査マスターデータ（101項目）
│   │   └── auth.ts             # 認証ユーティリティ
│   ├── App.tsx                 # ルーティング定義
│   └── main.tsx                # エントリーポイント
├── middleware.ts               # Basic Auth + PWA file exclusions
└── vite.config.ts              # Vite + PWA plugin config
```

### 検査データモデル（inspectionData.ts）

- **101検査項目**: 6カテゴリ（cat1〜cat7）に分類
- **評価タイプ**: standard(a/b1/b2/c), management(S/A/B/C), legal(none/concern), rebar, schmidt, freetext
- **グループ**: 擁壁/駐車場/駐輪場/屋外階段 等（有無選択でまとめる）
- **メンテナンス状況**: カテゴリごとの補修・改修 要/不要 + 良好/特に問題無
- **オプション**: 構造種別/外壁種類/柱サイズ/工法等（GaihekiGroupInputsで管理）

### デバッグモード

`pwa-app/src/pages/inspection/inspectionConstants.ts` の `DEBUG_MODE = true` で有効化。
- 定型写真の一括ダミーデータ生成
- 検査チェックリストの一括ダミー評価生成
- **本番では `DEBUG_MODE = false` にすること**

## VBAマクロ（Excel連携）

`hyoka/01_check/src/` にExcelテンプレートへのデータ書き込み用VBAマクロがある。

### ファイル（分割済み）
- **CellAddressCollector.bas**: マッピングシート作成＆セルアドレス収集（CP932, CRLF）
- **DataImport.bas**: メインエントリ + 基盤関数 + Public定数（CP932, CRLF）
- **DataImportMapping.bas**: マッピング取得関数群（CP932, CRLF）
- **DataImportSurvey.bas**: 現地調査シートインポート（CP932, CRLF）
- **DataImportDefects.bas**: 不具合シート作成（CP932, CRLF）
- **DataImportKeyPlan.bas**: キープランシート作成（CP932, CRLF）

### VBAファイル編集時の注意
- **エンコーディング**: 必ずCP932（Shift-JIS）で読み書き
- **改行コード**: 全ファイル CRLF（`\r\n`）で統一。~~ダブルCR(`\r\r\n`)は廃止~~（VBAエディタのインポートで空行挿入・行継続エラーの原因になるため）
- **Python経由での編集推奨**: テキストエディタではなくPythonスクリプトでCP932を正しく扱う
- **行継続 `_` の後に空行を入れない**: VBAコンパイルエラーの原因になる。Pythonで編集後は `_\r\n\r\n` パターンがないことを必ず検証すること
- **関数の重複チェック必須**: VBAモジュール分割・編集後は必ず全モジュール横断でPublic関数名の重複がないか確認すること（VBAは同名Public関数が複数モジュールにあると「あいまいな名前」コンパイルエラーになる）
- **Dim宣言の重複禁止**: 同一Sub/Function内で同名のDim宣言があるとコンパイルエラー。既存の宣言を確認してから追加すること
- **Sub/Functionのネスト禁止**: VBAではSub/Function内に別のSub/Functionを定義できない。End Subの後に新しいSubを定義すること
- **パターンマッチは関数名含めて確実に**: 置換時はSetupTableC→SetupTableA破壊事故の教訓あり

### Mac版Excel対応の注意
- **ファイルパス**: Mac VBAの`Open`ステートメントはMac形式パス（コロン区切り: `Macintosh HD:Users:...`）が必要。POSIXパス（`/Users/...`）は`Open`で使えない
- **日本語パスの変換**: AppleScriptの`POSIX file "..." as text`は日本語パスで失敗する場合がある。フォールバックとして手動変換（`/` → `:`、先頭に`Macintosh HD:`を付加）を実装すること
- **`Application.GetOpenFilename`**: Mac版では動作しない。代わりにAppleScriptの`choose file`を使い、`POSIX path of f`でPOSIXパスを取得する
- **`#If Mac Then` / `#Else` / `#End If`**: Windows/Mac両対応にする場合は条件付きコンパイルを使用

### マッピングテーブル構成
| テーブル | 列 | 内容 |
|---|---|---|
| A (A-I) | 101検査項目の評価セルアドレス |
| B (J-M) | グループ有無セル（擁壁/駐車場/駐輪場/屋外階段） |
| C (N-Q) | オプション選択セル（基礎形式/換気方法/外壁種類等） |
| D (R-W) | メンテナンス状況セル（cat1〜cat5 + サブグループ） |
| E (X-AA) | カテゴリ別調査実施/不可セル |
| F (AC-AH) | 項目調査実施状況セル |
| G (AJ-AM) | 資料値・実測値セル |
| H (AN-AQ) | 物件基本情報セル（物件名/住所/調査日/天候/時間） |
| I (AR-AT) | 備考セル |
| J (AU-AX) | 定型写真セル（16種画像挿入先） |
| K (AY-BF) | 不具合テンプレートセル（c/b2シートの各フィールド） |

## デプロイ

### Git push

SSH経由のpushは権限の問題で失敗する場合がある。その場合は `gh auth token --user m-kobayashi` でHTTPS経由でプッシュすること。

### Vercelデプロイ（Basic認証付き）

環境変数:
- `BASIC_AUTH_USER`: Basic認証のユーザー名
- `BASIC_AUTH_PASSWORD`: Basic認証のパスワード

```bash
cd pwa-app && vercel --prod
```

## コーディング規約

- TypeScript必須、`any`禁止
- 関数コンポーネント + Hooks
- TailwindCSSユーティリティクラス使用
- IndexedDB操作は必ず`await`（非同期）
