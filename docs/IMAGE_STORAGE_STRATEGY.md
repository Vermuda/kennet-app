# 画像ストレージ戦略

## 概要

不動産物件検査アプリの画像管理を最小コストで実現するための戦略文書です。

### 要件
- **データ量**: 1物件あたり約300MB（圧縮前）
- **物件数**: 年間1,000物件
- **年間総データ量**: 約300GB（圧縮前）

## 推奨ソリューション：Backblaze B2

### 選定理由

1. **最安コスト**: 年間$2〜$15（圧縮率による）
2. **S3互換API**: 実装が容易
3. **エグレス無料枠**: 平均保存量の3倍まで無料
4. **シンプルな料金体系**: 隠れコストなし
5. **日本からの高速アクセス**: レイテンシも良好

### 料金体系（2025年）

- **ストレージ**: $0.006/GB/月
- **ダウンロード（エグレス）**: 平均保存量の3倍まで無料、超過分は$0.01/GB
- **APIコール**: Class B（書き込み）$0.004/1万回、Class C（読み取り）無料

## コスト試算

### シナリオ別年間コスト

| シナリオ | 1物件 | 年間総量 | 月間平均保存量 | 年間コスト |
|---------|------|---------|---------------|-----------|
| 圧縮なし（JPEG 100%） | 300MB | 300GB | 150GB | **$11** |
| JPEG 80%圧縮 | 70MB | 70GB | 35GB | **$3** |
| WebP/AVIF圧縮（推奨） | 50MB | 50GB | 25GB | **$2** |

## ハイブリッドアーキテクチャ

### 基本設計

```
┌──────────────────────────────────────┐
│        Androidアプリ（検査端末）        │
│  ┌────────────────────────────────┐  │
│  │  ローカルストレージ（SQLite）    │  │
│  │  - 検査データ                   │  │
│  │  - 画像（圧縮済み）             │  │
│  │  - サムネイル                   │  │
│  └────────────────────────────────┘  │
└───────────────┬──────────────────────┘
                │ Wi-Fi接続時
                │ 検査完了後にアップロード
                ↓
┌──────────────────────────────────────┐
│       Backblaze B2（クラウド）         │
│  ┌────────────────────────────────┐  │
│  │  バケット構造                   │  │
│  │  /properties/{propertyId}/     │  │
│  │    /floors/{floorId}/          │  │
│  │      /images/{imageId}.webp    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### データフロー

#### 1. 検査中（オフライン対応）

```
撮影
 ↓
WebP圧縮（品質80%、800×600px）
 ↓
ローカルSQLiteに保存
 ↓
サムネイル生成（150×150px）
 ↓
継続して作業
```

#### 2. 検査完了後（アップロード）

```
Wi-Fi接続確認
 ↓
Backblaze B2にアップロード
 ├─ オリジナル画像（WebP）
 └─ メタデータ（JSON）
 ↓
アップロード成功確認
 ↓
ローカルのオリジナル画像削除
 ↓
サムネイルのみ保持
```

#### 3. 画像閲覧時

```
一覧表示
 ↓
ローカルサムネイルを表示
 ↓
ユーザーがタップ
 ↓
B2からオリジナル画像を取得（キャッシュ）
 ↓
フル解像度で表示
```

## 画像圧縮戦略

### 推奨設定

#### 撮影時の設定
- **解像度**: 1920×1080px（Full HD）
- **アスペクト比**: 16:9または4:3
- **フォーマット**: WebP（Androidネイティブサポート）

#### 圧縮設定
```kotlin
// Androidでの実装例
val options = BitmapFactory.Options().apply {
    inJustDecodeBounds = false
    inSampleSize = calculateInSampleSize(this, 1920, 1080)
}

// WebP圧縮
bitmap.compress(
    Bitmap.CompressFormat.WEBP_LOSSY,
    80, // 品質: 80%
    outputStream
)
```

#### サムネイル設定
- **解像度**: 150×150px（正方形）
- **フォーマット**: WebP
- **品質**: 60%
- **用途**: 一覧表示専用

### 圧縮率の実測例

| 設定 | サイズ | 圧縮率 | 品質 |
|-----|-------|--------|------|
| JPEG 100% | 3.0MB | - | 最高 |
| JPEG 80% | 700KB | 77%↓ | 高 |
| WebP 90% | 600KB | 80%↓ | 最高 |
| **WebP 80%（推奨）** | **500KB** | **83%↓** | **高** |
| WebP 70% | 400KB | 87%↓ | 中 |
| サムネイル | 50KB | 98%↓ | 一覧用 |

## Backblaze B2実装ガイド

### 1. バケット構成

```
kennet-inspection-images/
├── properties/
│   ├── {propertyId}/
│   │   ├── floors/
│   │   │   ├── {floorId}/
│   │   │   │   ├── blueprints/
│   │   │   │   │   └── {blueprintId}.webp
│   │   │   │   ├── defects/
│   │   │   │   │   └── {defectId}.webp
│   │   │   │   └── references/
│   │   │   │       └── {referenceId}.webp
│   │   └── metadata.json
```

### 2. アップロード実装（Kotlin例）

```kotlin
// Backblaze B2 SDKまたはS3互換SDK使用
class B2StorageManager(
    private val applicationKeyId: String,
    private val applicationKey: String,
    private val bucketName: String
) {
    private val s3Client = AmazonS3ClientBuilder
        .standard()
        .withCredentials(AWSStaticCredentialsProvider(
            BasicAWSCredentials(applicationKeyId, applicationKey)
        ))
        .withEndpointConfiguration(
            AwsClientBuilder.EndpointConfiguration(
                "s3.us-west-004.backblazeb2.com",
                "us-west-004"
            )
        )
        .build()

    suspend fun uploadImage(
        propertyId: String,
        floorId: String,
        imageType: String, // "blueprints", "defects", "references"
        imageId: String,
        imageData: ByteArray
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val key = "properties/$propertyId/floors/$floorId/$imageType/$imageId.webp"
            
            val metadata = ObjectMetadata().apply {
                contentLength = imageData.size.toLong()
                contentType = "image/webp"
            }
            
            val inputStream = ByteArrayInputStream(imageData)
            
            s3Client.putObject(
                PutObjectRequest(bucketName, key, inputStream, metadata)
            )
            
            Result.success("https://f004.backblazeb2.com/file/$bucketName/$key")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun downloadImage(key: String): Result<ByteArray> = 
        withContext(Dispatchers.IO) {
            try {
                val s3Object = s3Client.getObject(bucketName, key)
                val bytes = s3Object.objectContent.readBytes()
                Result.success(bytes)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
```

### 3. ローカルキャッシュ戦略

```kotlin
class ImageCacheManager(private val context: Context) {
    private val cacheDir = context.cacheDir
    private val maxCacheSize = 100 * 1024 * 1024 // 100MB

    fun getCachedImage(imageId: String): ByteArray? {
        val file = File(cacheDir, "$imageId.webp")
        return if (file.exists()) file.readBytes() else null
    }

    fun cacheImage(imageId: String, data: ByteArray) {
        checkCacheSize()
        File(cacheDir, "$imageId.webp").writeBytes(data)
    }

    private fun checkCacheSize() {
        val currentSize = cacheDir.listFiles()?.sumOf { it.length() } ?: 0
        if (currentSize > maxCacheSize) {
            // 古いファイルから削除（LRUキャッシュ）
            cacheDir.listFiles()
                ?.sortedBy { it.lastModified() }
                ?.take(cacheDir.listFiles()?.size?.div(2) ?: 0)
                ?.forEach { it.delete() }
        }
    }
}
```

## セキュリティ対策

### 1. アクセス制御

```
- Backblaze B2のバケットをプライベートに設定
- アプリケーションキーは読み書き権限を最小限に
- キーは難読化してAndroidアプリに埋め込み
- または、中間サーバー経由で署名付きURLを発行
```

### 2. 署名付きURL（推奨）

```kotlin
// 中間サーバー（Node.js/Express例）
app.post('/api/upload-url', authenticateUser, async (req, res) => {
    const { propertyId, imageType } = req.body;
    
    // Backblaze B2から署名付きURLを生成
    const uploadUrl = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID,
        validDurationInSeconds: 3600 // 1時間有効
    });
    
    res.json({ uploadUrl, authToken: uploadUrl.authorizationToken });
});
```

## 運用とモニタリング

### 1. コスト監視

```
- Backblaze B2ダッシュボードで日次確認
- 予算アラート設定（月間$20超過時に通知）
- ストレージ使用量のトレンド分析
```

### 2. データライフサイクル

```
検査完了 → 即座にアップロード
     ↓
30日間：頻繁アクセス（修正・確認）
     ↓
31日以降：アーカイブ（年1回程度のアクセス）
     ↓
3年後：削除または低頻度ストレージへ移行検討
```

### 3. バックアップ戦略

```
- Backblaze B2自体が11 ninesの耐久性
- 重要物件のみ別バケットにコピー（オプション）
- エクスポート機能でローカルバックアップ可能
```

## 代替案の比較

### 他のストレージサービス

| サービス | 年間コスト（50GB） | メリット | デメリット |
|---------|------------------|---------|----------|
| **Backblaze B2（推奨）** | **$2** | 最安、S3互換 | - |
| Wasabi | $2.5 | エグレス完全無料 | 90日最小保持 |
| Cloudflare R2 | $9 | CDN統合、無料枠あり | - |
| AWS S3 | $14+ | 高機能 | 高コスト |
| Google Drive API | 不明 | 使い慣れている | ビジネス利用制限 |

### オンプレミス案

**USB経由データ取り出し**
- 初期コスト: サーバー/NAS 10〜30万円
- 運用コスト: 電気代、保守費
- メリット: 完全オフライン
- デメリット: 拡張性低、災害リスク

**結論**: 年間$2〜$3のクラウドが圧倒的に低コスト

## 実装チェックリスト

### フェーズ1: Webプロトタイプ改修（現在）
- [x] LocalStorage実装（完了）
- [ ] 画像圧縮機能追加（WebP変換）
- [ ] Backblaze B2アップロード検証
- [ ] コスト試算の実測

### フェーズ2: Androidアプリ開発
- [ ] WebP圧縮実装
- [ ] サムネイル生成機能
- [ ] ローカルSQLite実装
- [ ] Backblaze B2 SDK統合
- [ ] オフライン対応
- [ ] Wi-Fi接続時の自動同期

### フェーズ3: 運用最適化
- [ ] キャッシュ戦略の調整
- [ ] 圧縮品質の最適化
- [ ] コスト監視ダッシュボード
- [ ] バックアップ自動化

## まとめ

### 最終推奨構成

```
📱 Androidアプリ（ローカル）
   ├─ 検査中: 全データをローカル保存
   ├─ 画像: WebP 80%圧縮（500KB/枚）
   └─ サムネイル: 150×150px（50KB/枚）

☁️ Backblaze B2（クラウド）
   ├─ 長期保管: $2/年（50GB）
   ├─ エグレス: 3倍まで無料
   └─ S3互換API: 実装容易

💰 年間総コスト: $2〜$3
   （1,000物件、画像圧縮あり）
```

### 次のステップ

1. Webプロトタイプで画像圧縮を実装してテスト
2. Backblaze B2のトライアルアカウント作成
3. 実際の検査画像でコスト実測
4. Androidアプリ開発時にこの戦略を実装

---

**作成日**: 2025-12-17  
**最終更新**: 2025-12-17  
**バージョン**: 1.1 (年間物件数を1,000に修正)
