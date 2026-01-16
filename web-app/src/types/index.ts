// ユーザー
export interface User {
  id: string;
  username: string;
  password: string;
}

// 定形写真
export interface StandardPhoto {
  id: string;
  propertyId: string;
  photoType: number; // 1-16
  imageData: string; // Base64エンコードされた画像データ
  isRequired: boolean;
  createdAt: string;
}

// 物件
export interface Property {
  id: string;
  name: string;
  address: string;
  inspectionDate?: string; // 検査日（yyyy-mm-dd）
  weather?: string; // 天候
  standardPhotos?: StandardPhoto[];
  createdAt: string;
  updatedAt: string;
}

// 階層
export interface Floor {
  id: string;
  propertyId: string;
  name: string; // 例: "1F", "2F", "屋上"
  order: number;
  createdAt: string;
}

// 図面
export interface Blueprint {
  id: string;
  floorId: string;
  imageData: string; // Base64エンコードされた画像データ
  orientation?: number; // 方位角度（0-355、5度刻み）
  orientationIconX?: number; // 方位アイコンのX座標（パーセンテージ 0-100）
  orientationIconY?: number; // 方位アイコンのY座標（パーセンテージ 0-100）
  orientationIconScale?: number; // 方位アイコンのスケール（0.5-3.0）
  createdAt: string;
}

// 撮影箇所マーカー
export interface Marker {
  id: string;
  blueprintId: string;
  x: number; // 図面上のX座標（パーセンテージ）
  y: number; // 図面上のY座標（パーセンテージ）
  inspectionId?: string; // 関連する検査情報ID
  createdAt: string;
}

// 検査結果の評価
export type InspectionResult = 'a' | 'b1' | 'b2' | 'c';

// 検査情報
export interface Inspection {
  id: string;
  markerId: string;
  blueprintId: string;
  majorCategory: string; // 大分類
  middleCategory: string; // 中分類
  minorCategory: string; // 小分類
  result: InspectionResult; // a/b1/b2/c
  createdAt: string;
}

// 不具合情報
export interface DefectInfo {
  id: string;
  inspectionId: string;
  location: string; // 場所
  component: string; // 部位
  deterioration: string; // 劣化状況
  repairMethod: string; // 補修・改修の範囲・方法
  imageData: string; // Base64エンコードされた画像データ
  createdAt: string;
  // 新フロー用の追加フィールド
  inspectionItemId?: string; // 検査項目ID
  evaluationType?: string; // 評価タイプ (b2/c)
  positionX?: number; // 図面上のX座標（%）
  positionY?: number; // 図面上のY座標（%）
  blueprintId?: string; // 図面ID
}

// 通常撮影
export interface ReferenceImage {
  id: string;
  propertyId: string;
  floorId?: string;
  imageData: string; // Base64エンコードされた画像データ
  memo?: string;
  createdAt: string;
}

// 画像メタデータ
export interface ImageMetadata {
  format: 'webp' | 'jpeg';
  quality: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

// LocalStorageの使用状況
export interface StorageUsage {
  used: number; // 使用中のバイト数
  total: number; // 総容量（推定）
  available: number; // 利用可能なバイト数
  usagePercentage: number; // 使用率（%）
  itemCount: number; // アイテム数
}

// B2アップロード状態
export interface B2UploadStatus {
  isUploading: boolean;
  progress: number; // 0-100
  uploadedCount: number;
  totalCount: number;
  currentFile?: string;
  error?: string;
}

// B2にアップロード済みの画像情報
export interface B2ImageInfo {
  id: string;
  b2Key: string; // B2のキー
  b2Url: string; // B2のURL
  uploadedAt: string;
  size: number;
}

// 検査分類マスタ（将来的にはサーバーから取得することを想定）
export interface InspectionCategory {
  major: string[];
  middle: { [key: string]: string[] };
  minor: { [key: string]: string[] };
}

// アプリケーション全体の状態
export interface AppState {
  currentUser: User | null;
  properties: Property[];
  floors: Floor[];
  blueprints: Blueprint[];
  markers: Marker[];
  inspections: Inspection[];
  defects: DefectInfo[];
  referenceImages: ReferenceImage[];
}

