# Vercelデプロイメント手順書

このドキュメントは、Basic認証付きでVercelにデプロイする詳細な手順を説明します。

## 前提条件

- Node.js v18以上がインストールされていること
- npmまたはyarnがインストールされていること
- Vercelアカウントを持っていること（https://vercel.com）

## デプロイ手順

### 1. Vercel CLIのインストール

```bash
npm install -g vercel
```

### 2. Vercelにログイン

```bash
vercel login
```

ブラウザが開き、Vercelアカウントでログインします。

### 3. プロジェクトのセットアップ

web-appディレクトリに移動します：

```bash
cd /path/to/kennet-app/web-app
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. ビルドテスト

デプロイ前にローカルでビルドが成功することを確認します：

```bash
npm run build
```

### 6. 初回デプロイ

```bash
vercel
```

以下の質問に答えます：
- **Set up and deploy**: `Y`
- **Which scope**: 自分のアカウントを選択
- **Link to existing project**: `N`
- **What's your project's name**: `kennet-app` (または任意の名前)
- **In which directory is your code located**: `./` (そのまま)
- **Want to override the settings**: `N`

デプロイが完了すると、プレビューURLが表示されます。

### 7. 環境変数の設定

#### Vercelダッシュボードから設定

1. https://vercel.com/dashboard にアクセス
2. デプロイしたプロジェクトを選択
3. **Settings** タブをクリック
4. 左メニューから **Environment Variables** を選択
5. 以下の変数を追加：

   **BASIC_AUTH_USER**
   - Value: `admin` (または任意のユーザー名)
   - Environment: Production, Preview, Development すべてにチェック

   **BASIC_AUTH_PASSWORD**
   - Value: 強力なパスワードを設定（例: `Kennet@2025!SecurePass`）
   - Environment: Production, Preview, Development すべてにチェック

6. **Save** をクリック

#### CLIから設定（オプション）

```bash
# 本番環境の環境変数を設定
vercel env add BASIC_AUTH_USER production
# プロンプトでユーザー名を入力

vercel env add BASIC_AUTH_PASSWORD production
# プロンプトでパスワードを入力
```

### 8. 本番環境へのデプロイ

環境変数を設定したら、本番環境にデプロイします：

```bash
vercel --prod
```

本番環境のURLが表示されます（例: `https://kennet-app.vercel.app`）。

### 9. デプロイの確認

1. 本番環境のURLにアクセス
2. Basic認証のダイアログが表示されることを確認
3. 設定したユーザー名とパスワードでログイン
4. アプリケーションが正常に動作することを確認

## Basic認証の動作

### 認証フロー

1. ユーザーがサイトにアクセス
2. Vercel Serverless FunctionがBasic認証をチェック
3. 認証情報が正しければ、Reactアプリ（静的ファイル）を表示
4. 認証に失敗すると、401エラーとBasic認証ダイアログを再表示

### 技術的な実装

- **`api/proxy.ts`**: すべてのリクエストを処理し、Basic認証をチェック
- **`api/auth.ts`**: 認証失敗時のフォールバック
- **`vercel.json`**: ルーティング設定

## トラブルシューティング

### Basic認証が機能しない

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercelダッシュボードで環境変数を確認
2. 環境変数を追加後、再デプロイが必要：
   ```bash
   vercel --prod
   ```

### ビルドエラーが発生する

**原因**: TypeScriptエラーまたは依存関係の問題

**解決策**:
1. ローカルでビルドを確認：
   ```bash
   npm run build
   ```
2. エラーを修正後、再デプロイ

### 404エラーが発生する

**原因**: ルーティング設定の問題

**解決策**:
1. `vercel.json`の設定を確認
2. すべてのパスが`/api/proxy`にリダイレクトされていることを確認

### カメラ機能が動作しない

**原因**: HTTPSが必要

**解決策**:
- VercelのURLは自動的にHTTPSなので、通常は問題ありません
- カスタムドメインを使用する場合も、VercelがHTTPSを自動設定します

## 更新とデプロイ

コードを更新した後：

```bash
# 変更をコミット
git add .
git commit -m "Update: 機能追加"

# Vercelに再デプロイ
vercel --prod
```

または、GitHubと連携している場合：
1. GitHubにpush
2. Vercelが自動的にデプロイ

## カスタムドメインの設定

1. Vercelダッシュボードでプロジェクトを選択
2. **Settings** > **Domains**
3. カスタムドメインを追加
4. DNSレコードを設定（Vercelが指示を表示）

## セキュリティのベストプラクティス

1. **強力なパスワードを使用**
   - 最低12文字以上
   - 大文字、小文字、数字、記号を含む

2. **定期的なパスワード変更**
   - 3〜6ヶ月ごとにパスワードを変更

3. **環境変数の管理**
   - `.env`ファイルをGitにコミットしない
   - Vercelダッシュボードでのみ管理

4. **アクセスログの確認**
   - Vercelダッシュボードでアクセスログを定期的に確認

## サポート

問題が発生した場合：
1. Vercelのドキュメントを参照: https://vercel.com/docs
2. プロジェクトのissuesを確認
3. 開発チームに連絡

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)

