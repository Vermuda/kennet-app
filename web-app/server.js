/**
 * ローカル開発用 Express API サーバー
 * /api/upload-to-b2 エンドポイントを提供
 * 本番環境ではVercel Serverless Functionが使用される
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// CORS設定
app.use(cors({
  origin: 'http://localhost:5173', // Viteのデフォルトポート
  credentials: true,
}));

// JSONボディパーサー
app.use(express.json({ limit: '50mb' })); // 大きな画像データを受け入れるためにlimitを設定

/**
 * Base64データをBufferに変換
 */
const base64ToBuffer = (base64) => {
  const parts = base64.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const base64Data = parts[1];
  const buffer = Buffer.from(base64Data, 'base64');

  return { buffer, contentType };
};

/**
 * 環境変数からB2設定を取得
 */
const getB2Config = () => {
  const keyId = process.env.B2_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;
  const bucketId = process.env.B2_BUCKET_ID;
  const region = process.env.B2_REGION || 'us-west-004';
  const endpoint = process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;

  if (!keyId || !applicationKey || !bucketName || !bucketId) {
    console.error('[B2 API] Missing configuration');
    return null;
  }

  return {
    keyId,
    applicationKey,
    bucketName,
    bucketId,
    region,
    endpoint,
  };
};

/**
 * B2アカウントを認証してAPIトークンを取得
 */
const authorizeB2Account = async (keyId, applicationKey) => {
  const authUrl = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
  const credentials = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');

  const response = await fetch(authUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`B2 Authorization failed: ${response.status} ${errorText}`);
  }

  return await response.json();
};

/**
 * B2アップロードURLを取得
 */
const getB2UploadUrl = async (authToken, apiUrl, bucketId) => {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
  }

  return await response.json();
};

/**
 * B2にアップロード（ネイティブAPI使用）
 */
const uploadToB2 = async (config, key, buffer, contentType) => {
  try {
    console.log('[B2 API] Starting upload:', {
      key,
      size: `${(buffer.length / 1024).toFixed(2)} KB`,
      contentType,
    });

    // ステップ1: アカウント認証
    const authData = await authorizeB2Account(config.keyId, config.applicationKey);
    console.log('[B2 API] Authorization successful');

    // ステップ2: アップロードURL取得
    const uploadData = await getB2UploadUrl(
      authData.authorizationToken,
      authData.apiUrl,
      config.bucketId
    );
    console.log('[B2 API] Upload URL obtained');

    // ステップ3: ファイルアップロード
    const crypto = await import('crypto');
    const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');

    const uploadResponse = await fetch(uploadData.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadData.authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(key),
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'X-Bz-Content-Sha1': sha1,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[B2 API] Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });

      return {
        success: false,
        error: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
      };
    }

    const uploadResult = await uploadResponse.json();

    // ダウンロードURL構築
    const downloadUrl = `${authData.downloadUrl}/file/${config.bucketName}/${key}`;

    console.log('[B2 API] Upload successful:', {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      url: downloadUrl,
      size: `${(buffer.length / 1024).toFixed(2)} KB`,
    });

    return {
      success: true,
      url: downloadUrl,
      size: buffer.length,
      fileId: uploadResult.fileId,
    };
  } catch (error) {
    console.error('[B2 API] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * POST /api/upload-to-b2
 * 画像をBackblaze B2にアップロード
 */
app.post('/api/upload-to-b2', async (req, res) => {
  try {
    // B2設定を取得
    const config = getB2Config();
    if (!config) {
      return res.status(500).json({
        success: false,
        error: 'Backblaze B2 is not configured on server'
      });
    }

    // リクエストボディをパース
    const { propertyId, floorId, imageType, imageId, imageData, metadata = {} } = req.body;

    if (!propertyId || !floorId || !imageType || !imageId || !imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // S3キーの構築
    const key = `properties/${propertyId}/floors/${floorId}/${imageType}/${imageId}.webp`;

    // Base64をBufferに変換
    const { buffer, contentType } = base64ToBuffer(imageData);

    // B2にアップロード
    const result = await uploadToB2(config, key, buffer, contentType);

    if (result.success) {
      res.status(200).json({
        success: true,
        url: result.url,
        key,
        size: result.size,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[B2 API] Handler error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  console.log(`[API Server] Upload endpoint: http://localhost:${PORT}/api/upload-to-b2`);
});
