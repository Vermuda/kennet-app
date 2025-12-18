/**
 * Backblaze B2 ストレージクライアント
 * S3互換APIを使用してBackblaze B2にアップロード/ダウンロードを行う
 */

export interface B2Config {
  keyId: string;
  applicationKey: string;
  bucketName: string;
  bucketId: string;
  region: string;
  endpoint: string;
}

export interface UploadOptions {
  propertyId: string;
  floorId: string;
  imageType: 'blueprints' | 'defects' | 'references';
  imageId: string;
  imageData: string; // Base64データ
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  size?: number;
}

export interface DownloadResult {
  success: boolean;
  data?: string; // Base64データ
  error?: string;
}

/**
 * B2が設定されているかチェック（サーバーサイドで管理）
 */
export const isB2Configured = (): boolean => {
  // Vercel Serverless Functionが環境変数を管理するため、常にtrueを返す
  // 実際の設定チェックはサーバーサイドで行われる
  return true;
};

/**
 * S3互換APIを使用してBackblaze B2にアップロード
 */
export const uploadToB2 = async (options: UploadOptions): Promise<UploadResult> => {
  try {
    const { propertyId, floorId, imageType, imageId, imageData, metadata = {} } = options;
    
    console.log('[B2Storage] Uploading via API:', {
      propertyId,
      floorId,
      imageType,
      imageId,
    });

    // Vercel Serverless Functionを経由してアップロード（CORS問題を回避）
    const response = await fetch('/api/upload-to-b2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyId,
        floorId,
        imageType,
        imageId,
        imageData,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[B2Storage] Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      return {
        success: false,
        error: errorData.error || `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    
    console.log('[B2Storage] Upload successful:', {
      key: result.key,
      url: result.url,
      size: result.size ? `${(result.size / 1024).toFixed(2)} KB` : 'unknown',
    });

    return {
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
    };
  } catch (error) {
    console.error('[B2Storage] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Backblaze B2から画像をダウンロード
 * TODO: API経由でのダウンロード機能を実装（必要に応じて）
 */
export const downloadFromB2 = async (_key: string): Promise<DownloadResult> => {
  console.warn('[B2Storage] Download function not implemented yet');
  return {
    success: false,
    error: 'Download function not implemented. Use direct URL access instead.',
  };
};

/**
 * Backblaze B2から画像を削除
 * TODO: API経由での削除機能を実装（必要に応じて）
 */
export const deleteFromB2 = async (_key: string): Promise<{ success: boolean; error?: string }> => {
  console.warn('[B2Storage] Delete function not implemented yet');
  return {
    success: false,
    error: 'Delete function not implemented yet.',
  };
};
