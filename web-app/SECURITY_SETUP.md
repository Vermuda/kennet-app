# セキュリティ設定ガイド

このドキュメントでは、本番環境のセキュリティ設定手順を説明します。

---

## 🔒 1. Vercel Basic認証の設定

### 方法A: Vercel Deployment Protection（推奨）

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com にログイン
   - プロジェクト `web-app` を選択

2. **Deployment Protectionを有効化**
   - **Settings** → **Deployment Protection** を開く
   - **Protection Method** で **Password Protection** を選択
   - パスワードを設定:
     ```
     Kennet@2025!Secure
     ```
   - **Save** をクリック

3. **適用範囲**
   - Production環境とPreview環境の両方に適用されます
   - 全ページが自動的に保護されます

---

### 方法B: Vercel Middleware（カスタム実装）

より細かい制御が必要な場合は、Middlewareを使用します。

1. **middleware.ts を作成**（既に作成済みの場合はスキップ）

```typescript
// web-app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');
  const url = request.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === 'kennet2025' && pwd === 'Kennet@2025!Secure') {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return NextResponse.rewrite(url);
}
```

2. **vercel.json を更新**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "WWW-Authenticate",
          "value": "Basic realm=\"Secure Area\""
        }
      ]
    }
  ]
}
```

---

## 👤 2. アプリケーション内ログイン認証情報

### 新しい強力なパスワード

Basic認証突破後、アプリ内でログインする際の認証情報：

**ユーザー1**:
- ユーザー名: `user1`
- パスワード: `KennetInspect2025!User1`

**ユーザー2**:
- ユーザー名: `user2`
- パスワード: `KennetInspect2025!User2`

> ⚠️ **重要**: これらのパスワードは従来の`password1`、`password2`から変更されています。

---

## 🔐 3. Backblaze B2 環境変数（既に設定済み）

Vercel環境変数は既に設定されています：

- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `B2_BUCKET_ID`
- `B2_REGION`
- `B2_ENDPOINT`

---

## 📝 4. Git履歴のクリーンアップ（必須）

セキュリティ上、機密情報を含むファイルをGit履歴から削除します。

### 実行コマンド

```bash
cd web-app

# 1. _headersファイルをGitから削除
git rm --cached _headers
git rm --cached LOGIN_INFO.md

# 2. コミット
git commit -m "chore: Remove credentials files from Git tracking

- Remove _headers with Basic Auth credentials
- Remove LOGIN_INFO.md with login information
- These files are now in .gitignore"

# 3. リモートにプッシュ
git push origin main
```

### 確認

```bash
# _headersがGit管理外であることを確認
git check-ignore _headers
# → _headers と表示されればOK

git check-ignore LOGIN_INFO.md
# → LOGIN_INFO.md と表示されればOK
```

---

## ✅ 5. セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] `.gitignore`に`_headers`と`LOGIN_INFO.md`が追加されている
- [ ] `_headers`ファイルがGit管理から削除されている
- [ ] Vercel Deployment Protectionが有効になっている
- [ ] B2環境変数がVercelに設定されている
- [ ] アプリ内ログインパスワードが強力なものに変更されている
- [ ] `.env.local`がGit管理外であることを確認

---

## 🚀 6. デプロイ

セキュリティ設定が完了したら、デプロイします：

```bash
# ローカルでビルドテスト
npm run build

# 本番デプロイ
vercel --prod
```

---

## 📞 7. トラブルシューティング

### Basic認証が表示されない

- Vercel Deployment Protectionの設定を確認
- ブラウザのキャッシュをクリア
- シークレットモードで再度アクセス

### アプリ内ログインができない

- パスワードが正しいか確認（大文字小文字を区別）
- ブラウザのLocalStorageをクリア
- DevToolsのConsoleでエラーを確認

### B2アップロードが失敗する

- Vercel環境変数が正しく設定されているか確認
- Vercel Function Logsでエラー詳細を確認

---

## 📌 重要な注意事項

1. **_headersファイルは絶対にGitにコミットしない**
   - Basic認証情報が含まれているため
   - `.gitignore`で除外されていることを確認

2. **パスワードは定期的に変更する**
   - 3ヶ月に1回程度の変更を推奨

3. **環境変数はブラウザに露出しない**
   - `VITE_`プレフィックスは使用しない
   - サーバーサイドでのみ使用

4. **本番環境のログを定期的に確認**
   - 不審なアクセスがないかチェック
   - Vercel Analytics/Logsを活用

---

## 🔗 参考リンク

- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Backblaze B2 Security Best Practices](https://www.backblaze.com/b2/docs/security.html)
