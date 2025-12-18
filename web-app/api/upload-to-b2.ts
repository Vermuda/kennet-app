/**
 * Vercel Serverless Function
 * ブラウザからのリクエストを受け取り、Backblaze B2にアップロードするプロキシ
 * CORS問題を解決し、クレデンシャルをサーバーサイドで安全に管理
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface B2Config {
  keyId: string;
  applicationKey: string;
  bucketName: string;
  bucketId: string;
  region: string;
  endpoint: string;
}

interface UploadRequest {
  propertyId: string;
  floorId: string;
  imageType: 'blueprints' | 'defects' | 'references';
  imageId: string;
  imageData: string; // Base64データ
  metadata?: Record<string, string>;
}

/**
 * Base64データをBufferに変換
 */
const base64ToBuffer = (base64: string): { buffer: Buffer; contentType: string } => {
  const parts = base64.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const base64Data = parts[1];
  const buffer = Buffer.from(base64Data, 'base64');

  return { buffer, contentType };
};

/**
 * 環境変数からB2設定を取得
 */
const getB2Config = (): B2Config | null => {
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
const authorizeB2Account = async (keyId: string, applicationKey: string) => {
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
const getB2UploadUrl = async (authToken: string, apiUrl: string, bucketId: string) => {
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
const uploadToB2 = async (
  config: B2Config,
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string; size?: number }> => {
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
 * Vercel Serverless Function エントリーポイント
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定（必要に応じて制限）
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエスト対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // B2設定を取得
    const config = getB2Config();
    if (!config) {
      res.status(500).json({
        success: false,
        error: 'Backblaze B2 is not configured on server'
      });
      return;
    }

    // リクエストボディをパース
    const uploadRequest: UploadRequest = req.body;
    const { propertyId, floorId, imageType, imageId, imageData, metadata = {} } = uploadRequest;

    if (!propertyId || !floorId || !imageType || !imageId || !imageData) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
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
}
