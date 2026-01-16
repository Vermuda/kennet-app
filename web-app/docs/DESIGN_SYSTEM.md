# デザインシステム - 現地チェックシートアプリ

## 概要

このデザインシステムは、**個性的で没個性的でない**デザインを実現するために設計されています。
AI生成とわかるような汎用的なパターンを避け、各ページが独自の美しさと個性を持つことを目指しています。

---

## デザイン原則

### ❌ 禁止事項

以下のデザインパターンは**絶対に使用しません**:

- **汎用フォント**: Inter, Roboto, Open Sans, Arial
- **テンプレート的な配色**: 白背景に薄い紫グラデーション
- **予測可能なレイアウト**: 均等なカードグリッド、対称的な配置
- **意図のない要素**: 文脈に合わない装飾
- **統一感のない方向性**: 各ページがバラバラ

### ✅ 重視すること

- **タイポグラフィのコントラスト**: 見出しと本文で異なるフォントファミリー
- **編集的なデザイン**: 雑誌やポスターのような大胆な表現
- **文脈に応じた配色**: ページの目的に応じた独自のカラーパレット
- **意図的な非対称性**: デザインに動きと個性を与える
- **マイクロインタラクション**: 300ms以内のスムーズなアニメーション

---

## タイポグラフィ

### フォントファミリー

```css
/* 見出し・UI要素 - モダンなサンセリフ */
font-family: 'Space Grotesk', 'DM Sans', 'system-ui', sans-serif;

/* 本文 - 読みやすいモノスペース */
font-family: 'JetBrains Mono', 'Source Code Pro', 'Monaco', monospace;
```

### 使用例

```tsx
// 見出し
<h1 className="font-sans text-4xl font-bold tracking-tight">
  物件一覧
</h1>

// 本文
<p className="font-mono text-sm leading-relaxed">
  住所: 東京都渋谷区...
</p>

// UIラベル
<label className="font-sans text-xs uppercase tracking-widest">
  ユーザーID
</label>
```

### タイポグラフィ階層

| 要素 | フォント | サイズ | ウェイト | 用途 |
|------|---------|-------|---------|------|
| H1 | sans | text-4xl (36px) | bold (700) | ページタイトル |
| H2 | sans | text-3xl (30px) | bold (700) | セクション見出し |
| H3 | sans | text-2xl (24px) | bold (700) | カード見出し |
| Body | mono | text-sm (14px) | normal (400) | 本文テキスト |
| Label | sans | text-xs (12px) | medium (500) | フォームラベル |
| Button | sans | text-xs (12px) | bold (700) | ボタンテキスト |

---

## カラーパレット

### 業務向けカラー制約

**重要**: このアプリケーションは**業務用途**のため、以下の制約を厳守してください。

#### 1. 色数の制限

- **基本は3色まで**: ベース色 + プライマリアクセント + セカンダリアクセント
- **最大5色まで**: エラー・警告・成功などの状態表示を含む場合のみ

**例（3色）:**
```css
背景: slate-50
プライマリ: emerald-600
セカンダリ: teal-600
```

**例（5色）:**
```css
背景: slate-50
プライマリ: emerald-600
セカンダリ: teal-600
警告: amber-600
エラー: red-600
```

#### 2. 過度なグラデーション禁止

- ❌ **3色以上のグラデーション**: `from-purple-500 via-pink-400 via-red-400 to-orange-500`
- ✅ **2色グラデーション（控えめに）**: `from-emerald-600 to-teal-600`
- ✅ **単色（最も推奨）**: `bg-emerald-600`

グラデーションは必要最小限に抑え、単色を優先してください。

#### 3. 目立ちすぎる色を避ける

- ❌ **蛍光色**: `lime-400`, `pink-500`, `yellow-400`, `fuchsia-500`
- ❌ **高彩度の明るい色**: `-400`, `-500`系を大面積に使用
- ✅ **落ち着いた色**: `-600`, `-700`, `-800`系を使用

業務アプリケーションでは、視覚的な疲労を避けるため、落ち着いたトーンを使用します。

### ページごとの配色（制約適用済み）

各ページは独自のカラーパレットを持ちますが、**3-5色以内**に収めています。

#### LoginPage - ダーク＆プロフェッショナル（3色）
```css
背景: slate-900
プライマリ: emerald-500
アクセント: teal-500
```

#### PropertiesPage - 明るく信頼感（3色）
```css
背景: slate-50
プライマリ: emerald-500
ボーダー: emerald-500
```

#### PropertyDetailPage - テクニカル（3色）
```css
背景: slate-50
カード: slate-800
アクセント: cyan-400
```

#### 共通ボタン（3色）
```css
プライマリ: emerald-600
セカンダリ: slate-600
テキスト: white
```

#### エラー・警告表示（5色）
```css
背景: slate-50
プライマリ: emerald-600
警告: amber-600
エラー: red-600
成功: green-600
```

---

## モーションガイドライン

### アニメーション原則

1. **マイクロインタラクション**: 200-300ms
2. **ページロード**: 段階的に400-500ms
3. **タイミング関数**: `ease-out` を優先
4. **最大時間**: 500msを超えない

### 実装パターン

#### ページロード時の段階的表示

```tsx
<div className="animate-fade-in-up delay-[0ms]">
  {/* 最初の要素 */}
</div>
<div className="animate-fade-in-up delay-[100ms]">
  {/* 2番目の要素 */}
</div>
<div className="animate-fade-in-up delay-[200ms]">
  {/* 3番目の要素 */}
</div>
```

#### ボタンのホバー効果

```tsx
<button className="
  transition-all duration-300 ease-out
  hover:scale-105
  active:scale-95
">
  クリック
</button>
```

#### カードのホバー

```tsx
<div className="
  transition-all duration-300 ease-out
  hover:shadow-2xl
  hover:-translate-y-2
">
  {/* カード内容 */}
</div>
```

### カスタムアニメーション

```javascript
// tailwind.config.js
animation: {
  'fade-in-up': 'fadeInUp 0.5s ease-out',
  'fade-in': 'fadeIn 0.4s ease-out',
  'slide-in-right': 'slideInRight 0.4s ease-out',
},
keyframes: {
  fadeInUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideInRight: {
    '0%': { opacity: '0', transform: 'translateX(-16px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
}
```

### ❌ 避けるべきアニメーション

- `animate-bounce` (過度なバウンス)
- `duration-700` 以上 (遅すぎる)
- transitionなしの状態変化

---

## コンポーネントパターン

### ボタン

#### プライマリボタン

```tsx
<button className="
  bg-gradient-to-r from-emerald-500 to-teal-500 text-white
  px-6 py-3.5 rounded-xl
  font-sans font-bold uppercase tracking-wider text-xs
  hover:from-emerald-600 hover:to-teal-600
  transition-all duration-300 ease-out
  shadow-lg hover:shadow-xl
  transform hover:scale-105 active:scale-95
  border-2 border-emerald-300/50
">
  アクション
</button>
```

#### セカンダリボタン

```tsx
<button className="
  border-2 border-slate-300 text-slate-600
  px-5 py-2.5 rounded-lg
  font-sans font-medium text-sm
  hover:bg-slate-700 hover:text-white hover:border-slate-700
  transition-all duration-300 ease-out
  transform hover:scale-105
">
  キャンセル
</button>
```

### カード

#### 基本カード

```tsx
<div className="
  bg-white rounded-2xl shadow-lg
  border-l-4 border-emerald-500
  p-6
  transition-all duration-300 ease-out
  hover:shadow-2xl hover:-translate-y-2
">
  <h3 className="font-serif text-2xl font-bold text-slate-800 mb-3">
    タイトル
  </h3>
  <p className="font-mono text-sm text-slate-600 leading-relaxed">
    説明文
  </p>
</div>
```

#### ダークカード

```tsx
<div className="
  bg-gradient-to-br from-slate-800 to-slate-900
  rounded-3xl shadow-2xl
  border-l-8 border-cyan-400
  p-8
">
  <h2 className="
    font-serif text-3xl font-bold
    text-transparent bg-clip-text
    bg-gradient-to-r from-cyan-300 to-emerald-300
  ">
    タイトル
  </h2>
</div>
```

### インプット

```tsx
<input className="
  w-full px-5 py-4
  border-2 border-slate-200 rounded-xl
  font-mono text-sm text-slate-700
  focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
  hover:border-slate-300
  transition-all duration-300 ease-out
" />
```

### フローティングアクションボタン

```tsx
<button className="
  fixed bottom-8 right-8
  bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500
  text-white p-5 rounded-2xl
  shadow-2xl shadow-purple-500/50
  hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]
  transition-all duration-300 ease-out
  hover:scale-110 active:scale-95
  ring-4 ring-purple-200/50
  border-2 border-white/20
">
  {/* アイコン */}
</button>
```

---

## レイアウト原則

### スマートフォンでの改行ポリシー

**重要原則**: 文字の長さで改行が必要な場合、**意味を途中で途切れさせない**

#### ❌ 悪い例

```tsx
// 単語の途中で改行される
<button>
  データエクス
  ポート
</button>

// 「現地チェッ\nクシート」のように意味が途切れる
<h1>現地チェッ<br />クシート</h1>
```

#### ✅ 良い例

```tsx
// 意味の切れ目で改行
<button>
  データ<br className="sm:hidden" />
  エクスポート
</button>

// whitespace-pre-lineで改行制御
<button className="whitespace-pre-line">
  {'データ\nエクスポート'}
</button>

// 日本語の自然な改行
<p className="break-normal word-break-keep-all">
  物件情報を確認してください
</p>
```

#### 実装方法

1. **レスポンシブな改行タグ**
   ```tsx
   <button>
     現地<br className="sm:hidden" />チェックシート
   </button>
   ```
   スマートフォンのみで改行、デスクトップでは1行表示

2. **明示的な改行位置指定**
   ```tsx
   <button className="whitespace-pre-line">
     {'新規\n物件追加'}
   </button>
   ```

3. **Tailwind CSSクラス**
   ```tsx
   className="break-normal word-break-keep-all"
   ```
   日本語の自然な改行を許可

#### 推奨される改行位置

| テキスト | 改行位置 | 理由 |
|---------|---------|------|
| 新規物件追加 | 新規\n物件追加 | 「新規」と「物件追加」で意味が分かれる |
| データエクスポート | データ\nエクスポート | 「データ」と「エクスポート」で意味が分かれる |
| 定形写真管理 | 定形写真\n管理 | 「定形写真」と「管理」で意味が分かれる |
| 現地チェックシート | 現地\nチェックシート | 「現地」と「チェックシート」で意味が分かれる |
| 通常撮影を開始 | 通常撮影を\n開始 | 助詞「を」の後で改行 |

#### チェックポイント

- [ ] モバイルビュー (375px幅) で確認
- [ ] 意味の途中で改行されていないか
- [ ] 助詞 (「の」「を」「に」「が」) で改行されていないか
- [ ] ボタン内のテキストが読みやすいか
- [ ] カタカナ語が途中で切れていないか

#### 対象要素

このポリシーは**すべてのUI要素**に適用:
- ボタンテキスト
- 見出し (h1, h2, h3)
- ラベル
- リンクテキスト
- メッセージ
- エラー表示

### 非対称性の活用

```tsx
// ❌ 対称的で退屈
<div className="border rounded-lg">

// ✅ 非対称で個性的
<div className="border-l-4 border-r-8 border-b-4 border-emerald-500 rounded-2xl">
```

### 意図的な余白

```tsx
// メインコンテンツ
<main className="max-w-7xl mx-auto px-6 py-10">

// カード内の余白
<div className="p-8">

// グリッドギャップ
<div className="grid grid-cols-3 gap-8">
```

### グリッドレイアウト

```tsx
// レスポンシブグリッド
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map((item, index) => (
    <div
      key={item.id}
      className="animate-fade-in-up"
      style={{ animationDelay: `${300 + index * 100}ms` }}
    >
      {/* カード */}
    </div>
  ))}
</div>
```

---

## アクセシビリティ

### フォーカススタイル

```css
/* グローバルフォーカス設定 (index.css) */
*:focus-visible {
  @apply outline-none ring-2 ring-offset-2 ring-emerald-500;
}
```

### ARIAラベル

```tsx
<button
  aria-label="通常撮影を開始"
  title="通常撮影"
>
  {/* アイコン */}
</button>
```

### キーボードナビゲーション

- すべてのインタラクティブ要素にフォーカススタイル適用
- Tab順序が論理的
- Enterキーでボタン操作可能

---

## ベストプラクティス

### DO ✅

1. **フォントの組み合わせ**: serif見出し + mono本文 + sans UI
2. **300ms以内のトランジション**: スムーズで快適
3. **色数制限を守る**: 基本3色、最大5色
4. **落ち着いた配色**: -600, -700系の落ち着いた色
5. **単色を優先**: グラデーションは控えめに
6. **段階的なアニメーション**: ページロード時の要素表示
7. **ホバー効果**: scale-105, shadow-xl, -translate-y-1

### DON'T ❌

1. **汎用フォントの使用**: Inter, Roboto, Arial
2. **6色以上の使用**: 色が多すぎる
3. **過度なグラデーション**: 3色以上のグラデーション
4. **蛍光色・高彩度色**: lime-400, pink-500など
5. **500ms超のアニメーション**: 遅くてストレス
6. **バウンスエフェクト**: 過度でうるさい
7. **transitionなし**: 突然の変化は不快

---

## 実装チェックリスト

新しいページやコンポーネントを作成する際のチェックリスト:

- [ ] **タイポグラフィ**: serif/mono/sansを適切に使い分け
- [ ] **カラーパレット（業務向け制約）**:
  - [ ] 使用色は3色以内（基本）、最大5色まで
  - [ ] グラデーションは2色まで、または単色を使用
  - [ ] 蛍光色・高彩度色を避ける（-600, -700系を使用）
  - [ ] 既存ページと異なる独自の配色
- [ ] **アニメーション**: fade-in-upなど段階的表示
- [ ] **ホバー効果**: 300ms、scale-105、shadow-xl
- [ ] **非対称要素**: border-l-4など意図的な非対称性
- [ ] **フォーカススタイル**: アクセシビリティ確保
- [ ] **レスポンシブ**: モバイル対応
- [ ] **改行ポリシー**: 意味を途中で途切れさせない改行
  - [ ] モバイルビュー(375px)で確認
  - [ ] ボタンテキストが自然な位置で改行
  - [ ] 助詞で改行されていない
  - [ ] カタカナ語が途中で切れていない

---

## まとめ

このデザインシステムは**個性的で人間的なデザイン**を目指しています。

- 各ページが独自の美しさを持つ
- タイポグラフィのコントラストで視覚階層を作る
- 300ms以内のスムーズなアニメーション
- 文脈に応じた配色とレイアウト

**AI生成とわかるような没個性的なデザインではなく、思わず触りたくなるような魅力的なUIを作りましょう。**
