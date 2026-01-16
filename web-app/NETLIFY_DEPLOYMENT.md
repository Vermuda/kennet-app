# Netlifyデプロイ手順（Basic認証付き・無料）

Netlifyも無料プランでBasic認証を利用できます。

## デプロイ方法（GitHubから）

### 1. Netlifyアカウント作成

1. https://app.netlify.com/signup にアクセス
2. GitHubアカウントで登録

### 2. サイトのデプロイ

1. **Add new site** > **Import an existing project** をクリック
2. **Deploy with GitHub** を選択
3. リポジトリを選択
4. 以下の設定を入力：
   - **Base directory**: `web-app`
   - **Build command**: `npm run build`
   - **Publish directory**: `web-app/dist`

5. **Deploy site** をクリック

### 3. Basic認証の設定

`netlify.toml`ファイル（既に作成済み）に以下が含まれています：

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Basic-Auth = "kennet2025:Kennet@2025!Secure"
```

## デプロイ後のアクセス

1. デプロイ完了後、URLが表示されます（例: `https://kennet-app.netlify.app`）
2. アクセスするとBasic認証ダイアログが表示されます

## CLIでデプロイする方法

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
cd /Users/kobayashi/develop/03_kennet/kennet-app/web-app
netlify deploy --prod
```

## カスタムドメイン

1. Site settings > Domain management
2. Add custom domain

## 参考リンク

- [Netlify公式ドキュメント](https://docs.netlify.com/)
- [Basic認証設定](https://docs.netlify.com/visitor-access/password-protection/)

