# Cloudflare Pagesデプロイ手順（Basic認証付き・無料）

Cloudflare Pagesは無料プランでもBasic認証が利用できます。

## デプロイ手順

### 1. Cloudflareアカウントの作成

1. https://dash.cloudflare.com/sign-up にアクセス
2. メールアドレスとパスワードを入力してアカウント作成

### 2. GitHubリポジトリと連携

1. Cloudflareダッシュボードにログイン
2. 左メニューから **Workers & Pages** を選択
3. **Create application** をクリック
4. **Pages** タブを選択
5. **Connect to Git** をクリック
6. GitHubアカウントを連携
7. リポジトリを選択

### 3. ビルド設定

以下の設定を入力：

- **Project name**: `kennet-app` (または任意の名前)
- **Production branch**: `main`
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `web-app`

### 4. 環境変数の設定（不要）

Cloudflare Pagesの場合、`_headers`ファイルで直接Basic認証を設定できるため、環境変数は不要です。

### 5. デプロイ実行

**Save and Deploy** をクリックしてデプロイを開始します。

## Basic認証の設定

### `_headers`ファイルを使用（既に作成済み）

プロジェクトのルートディレクトリ（`web-app/`）に`_headers`ファイルを配置します：

```
/*
  Basic-Auth: kennet2025:Kennet@2025!Secure
```

このファイルはすべてのパスに対してBasic認証を適用します。

### 認証情報の変更

`_headers`ファイルの形式：
```
Basic-Auth: ユーザー名:パスワード
```

複数のユーザーを許可する場合：
```
/*
  Basic-Auth: user1:StrongPassword1!
  Basic-Auth: user2:StrongPassword2!
```

**注意**: 上記は例です。実際のパスワードは必ず強力なものを設定してください。

## デプロイ後のアクセス

1. デプロイが完了すると、URLが表示されます（例: `https://kennet-app.pages.dev`）
2. URLにアクセスすると、Basic認証ダイアログが表示されます
3. 設定したユーザー名とパスワードでログイン
4. アプリのログイン画面が表示されます

## カスタムドメインの設定

1. Cloudflareダッシュボードでプロジェクトを選択
2. **Custom domains** をクリック
3. ドメインを追加

## メリット

- 完全無料でBasic認証が使える
- 高速なCDN
- 無制限のリクエスト
- 自動HTTPS
- GitHubへのpushで自動デプロイ

## トラブルシューティング

### Basic認証が表示されない

1. `_headers`ファイルがプロジェクトのルートにあるか確認
2. ファイル名が正確に`_headers`（アンダースコア付き）か確認
3. 再デプロイを実行

### ビルドエラー

1. ローカルで`npm run build`が成功するか確認
2. `package.json`の依存関係を確認
3. Node.jsのバージョンを確認（18.x以上推奨）

## 参考リンク

- [Cloudflare Pages公式ドキュメント](https://developers.cloudflare.com/pages/)
- [Basic認証の設定方法](https://developers.cloudflare.com/pages/platform/headers/#attach-headers)

