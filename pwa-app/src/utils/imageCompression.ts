/**
 * 画像圧縮ユーティリティ
 * WebP形式での圧縮、リサイズ、サムネイル生成機能を提供
 */

export interface CompressionResult {
  dataUrl: string;
  format: 'webp' | 'jpeg';
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  quality?: number; // 0.0 - 1.0
  maxWidth?: number;
  maxHeight?: number;
  /**
   * 長辺の上限（px）。指定時は maxWidth/maxHeight より優先し、向きに依存せず
   * 長辺をこの値に収める。縦持ち撮影で解像度が落ちるのを防ぐ。
   */
  maxLongSide?: number;
  format?: 'webp' | 'jpeg';
}

/**
 * Base64文字列のサイズを計算（バイト）
 */
export const getBase64Size = (base64: string): number => {
  const base64Length = base64.split(',')[1]?.length || 0;
  // Base64は3バイトを4文字で表現するため、実際のバイト数は (length * 3/4)
  const padding = (base64.match(/=/g) || []).length;
  return (base64Length * 3) / 4 - padding;
};

/**
 * バイトサイズを人間が読みやすい形式に変換
 */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * 画像をWebP形式で圧縮
 * 
 * @param imageDataUrl - Base64エンコードされた画像データ
 * @param options - 圧縮オプション
 * @returns 圧縮結果
 */
export const compressImage = async (
  imageDataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    quality = 0.8, // デフォルト80%
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // 元のサイズを計算
        const originalSize = getBase64Size(imageDataUrl);
        
        // リサイズ比率を計算
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        // Canvas で描画
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // 高品質な描画設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // WebPまたはJPEGに変換
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        
        // 圧縮後のサイズを計算
        const compressedSize = getBase64Size(compressedDataUrl);
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
        
        console.log('[ImageCompression] Compression complete:', {
          format,
          quality,
          originalSize: formatSize(originalSize),
          compressedSize: formatSize(compressedSize),
          compressionRatio: `${compressionRatio.toFixed(1)}%`,
          dimensions: `${width}x${height}`,
        });
        
        resolve({
          dataUrl: compressedDataUrl,
          format,
          originalSize,
          compressedSize,
          compressionRatio,
          width,
          height,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Canvas から直接圧縮（中間エンコードを挟まない）
 *
 * 撮影直後の canvas を JPEG 化してから再圧縮すると二重エンコードで画質が劣化するため、
 * canvas のピクセルをそのまま目的フォーマットへエンコードする。
 *
 * @param sourceCanvas - 描画済みの Canvas
 * @param options - 圧縮オプション
 * @returns 圧縮結果
 */
export const compressCanvas = (
  sourceCanvas: HTMLCanvasElement,
  options: CompressionOptions = {}
): CompressionResult => {
  const {
    quality = 0.9,
    maxWidth = 1920,
    maxHeight = 1080,
    maxLongSide,
    format = 'webp',
  } = options;

  // 元のピクセル数から非圧縮サイズを概算（RGBA 4バイト）
  const originalSize = sourceCanvas.width * sourceCanvas.height * 4;

  let width = sourceCanvas.width;
  let height = sourceCanvas.height;
  const aspectRatio = width / height;

  if (maxLongSide) {
    // 長辺基準（向き非依存）
    const longSide = Math.max(width, height);
    if (longSide > maxLongSide) {
      const scale = maxLongSide / longSide;
      width *= scale;
      height *= scale;
    }
  } else {
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  width = Math.round(width);
  height = Math.round(height);

  let target = sourceCanvas;

  // 縮小が必要な場合のみ再描画
  if (width !== sourceCanvas.width || height !== sourceCanvas.height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    target = canvas;
  }

  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  const dataUrl = target.toDataURL(mimeType, quality);
  const compressedSize = getBase64Size(dataUrl);

  console.log('[ImageCompression] Canvas compression complete:', {
    format,
    quality,
    compressedSize: formatSize(compressedSize),
    dimensions: `${width}x${height}`,
  });

  return {
    dataUrl,
    format,
    originalSize,
    compressedSize,
    compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
    width,
    height,
  };
};

/**
 * サムネイル画像を生成
 * 
 * @param imageDataUrl - Base64エンコードされた画像データ
 * @param size - サムネイルのサイズ（正方形）
 * @returns サムネイル画像のBase64データ
 */
export const generateThumbnail = async (
  imageDataUrl: string,
  size: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // アスペクト比を保持してクロップ
        const { width, height } = img;
        const aspectRatio = width / height;
        
        let drawWidth = size;
        let drawHeight = size;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > 1) {
          // 横長の画像
          drawWidth = size * aspectRatio;
          offsetX = -(drawWidth - size) / 2;
        } else {
          // 縦長の画像
          drawHeight = size / aspectRatio;
          offsetY = -(drawHeight - size) / 2;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // サムネイルはWebP 60%で保存
        const thumbnailDataUrl = canvas.toDataURL('image/webp', 0.6);
        
        console.log('[ImageCompression] Thumbnail generated:', {
          size: `${size}x${size}`,
          thumbnailSize: formatSize(getBase64Size(thumbnailDataUrl)),
        });
        
        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * WebPフォーマットがサポートされているかチェック
 */
export const isWebPSupported = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // WebPが使えるかテスト
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * 画像を圧縮してサムネイルも生成
 * 
 * @param imageDataUrl - Base64エンコードされた画像データ
 * @param options - 圧縮オプション
 * @returns 圧縮された画像とサムネイル
 */
export const compressImageWithThumbnail = async (
  imageDataUrl: string,
  options: CompressionOptions = {}
): Promise<{
  compressed: CompressionResult;
  thumbnail: string;
}> => {
  const [compressed, thumbnail] = await Promise.all([
    compressImage(imageDataUrl, options),
    generateThumbnail(imageDataUrl),
  ]);
  
  return { compressed, thumbnail };
};
