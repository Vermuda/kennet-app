import Dexie, { type Table } from 'dexie';
import type {
  AppState,
  User,
  Property,
  Floor,
  Blueprint,
  Marker,
  Inspection,
  DefectInfo,
  ReferenceImage,
  StandardPhoto,
} from '../types';
import type { PropertyInspectionData } from '../types/inspectionData';
import { verifyPassword } from '../utils/auth';

// IndexedDBデータベースクラス
class KennetInspectionDB extends Dexie {
  // テーブル定義
  appState!: Table<{ key: string; value: any }, string>;
  properties!: Table<Property, string>;
  floors!: Table<Floor, string>;
  blueprints!: Table<Blueprint, string>;
  markers!: Table<Marker, string>;
  inspections!: Table<Inspection, string>;
  defects!: Table<DefectInfo, string>;
  referenceImages!: Table<ReferenceImage, string>;
  standardPhotos!: Table<StandardPhoto, string>;
  propertyInspections!: Table<PropertyInspectionData, string>;

  constructor() {
    super('KennetInspectionDB');

    // Version 1: 初期スキーマ
    this.version(1).stores({
      // アプリ状態（currentUserなど）
      appState: 'key',

      // マスターデータ
      properties: 'id, createdAt',
      floors: 'id, propertyId',
      blueprints: 'id, floorId',

      // 検査データ
      markers: 'id, blueprintId',
      inspections: 'id, markerId, blueprintId',
      defects: 'id, inspectionId, blueprintId',

      // 画像データ
      referenceImages: 'id, propertyId, floorId',
      standardPhotos: 'id, propertyId, photoType',
    });

    // Version 2: 検査チェックリストデータ用テーブル追加
    this.version(2).stores({
      // アプリ状態（currentUserなど）
      appState: 'key',

      // マスターデータ
      properties: 'id, createdAt',
      floors: 'id, propertyId',
      blueprints: 'id, floorId',

      // 検査データ
      markers: 'id, blueprintId',
      inspections: 'id, markerId, blueprintId',
      defects: 'id, inspectionId, blueprintId',

      // 画像データ
      referenceImages: 'id, propertyId, floorId',
      standardPhotos: 'id, propertyId, photoType',

      // 検査チェックリストデータ（物件ごと）
      propertyInspections: 'propertyId',
    });
  }
}

// データベースインスタンス
export const db = new KennetInspectionDB();

// 初期データ
const initialData: AppState = {
  currentUser: null,
  properties: [],
  floors: [],
  blueprints: [],
  markers: [],
  inspections: [],
  defects: [],
  referenceImages: [],
};

// 固定アカウント（SHA-256ハッシュ化されたパスワード）
// パスワード:
// user1: KennetInspect2025!User1
// user2: KennetInspect2025!User2
interface UserWithHash {
  id: string;
  username: string;
  passwordHash: string;
}

const FIXED_USERS_HASHED: UserWithHash[] = [
  {
    id: '1',
    username: 'user1',
    passwordHash: '7d219bfd21773bfd9b451265ba92ca32d9dc5c105e182a784aab3a20745aa1de',
  },
  {
    id: '2',
    username: 'user2',
    passwordHash: '1a16b848bd5f8ff580455e19fadebd08efbcdfd79db72202ab76c1c4d40bedc7',
  },
];

// User型への変換（パスワードハッシュを含まない）
const convertToUser = (userWithHash: UserWithHash): User => ({
  id: userWithHash.id,
  username: userWithHash.username,
  password: '', // セキュリティのため空文字
});

// =========================================
// データの読み込み（非同期）
// =========================================

/**
 * 全データをIndexedDBから読み込み
 */
export const loadData = async (): Promise<AppState> => {
  try {
    console.log('[IndexedDB] loadData() called');
    const [
      currentUserRecord,
      properties,
      floors,
      blueprints,
      markers,
      inspections,
      defects,
      referenceImages,
    ] = await Promise.all([
      db.appState.get('currentUser'),
      db.properties.toArray(),
      db.floors.toArray(),
      db.blueprints.toArray(),
      db.markers.toArray(),
      db.inspections.toArray(),
      db.defects.toArray(),
      db.referenceImages.toArray(),
    ]);
    console.log('[IndexedDB] Raw data from IndexedDB:', {
      currentUser: currentUserRecord?.value,
      properties: properties.length,
      floors: floors.length,
      blueprints: blueprints.length,
      markers: markers.length,
      inspections: inspections.length,
      defects: defects.length,
      referenceImages: referenceImages.length,
    });

    // 物件ごとの定形写真を取得して結合
    const propertiesWithPhotos = await Promise.all(
      properties.map(async (property) => {
        const photos = await db.standardPhotos
          .where('propertyId')
          .equals(property.id)
          .toArray();
        return {
          ...property,
          standardPhotos: photos,
        };
      })
    );

    // データマイグレーション: 既存データに新しいフィールドを追加
    const migratedProperties = propertiesWithPhotos.map((p) => ({
      ...p,
      inspectionDate: p.inspectionDate || undefined,
      weather: p.weather || undefined,
      standardPhotos: p.standardPhotos || [],
    }));

    const migratedBlueprints = blueprints.map((b) => ({
      ...b,
      orientation: b.orientation !== undefined ? b.orientation : undefined,
      orientationIconX: b.orientationIconX ?? 50,
      orientationIconY: b.orientationIconY ?? 10,
      orientationIconScale: b.orientationIconScale ?? 1.0,
    }));

    return {
      currentUser: currentUserRecord?.value || null,
      properties: migratedProperties,
      floors,
      blueprints: migratedBlueprints,
      markers,
      inspections,
      defects,
      referenceImages,
    };
  } catch (error) {
    console.error('Failed to load data from IndexedDB:', error);
    return initialData;
  }
};

/**
 * 全データをIndexedDBに保存
 */
export const saveData = async (data: AppState): Promise<void> => {
  try {
    console.log('[IndexedDB] saveData() called with:', {
      currentUser: data.currentUser,
      properties: data.properties.length,
      floors: data.floors.length,
      blueprints: data.blueprints.length,
      markers: data.markers.length,
      inspections: data.inspections.length,
      defects: data.defects.length,
      referenceImages: data.referenceImages.length,
    });

    // 容量チェック（概算）
    const estimatedSize = JSON.stringify(data).length;
    const storageInfo = await getStorageUsage();
    
    if (storageInfo.available < estimatedSize) {
      const error: any = new Error('ストレージ容量が不足しています。');
      error.code = 'QUOTA_EXCEEDED';
      error.required = estimatedSize;
      error.available = storageInfo.available;
      throw error;
    }
    
    await db.transaction('rw', [
      db.appState,
      db.properties,
      db.floors,
      db.blueprints,
      db.markers,
      db.inspections,
      db.defects,
      db.referenceImages,
      db.standardPhotos,
    ], async () => {
      // currentUserを保存
      await db.appState.put({ key: 'currentUser', value: data.currentUser });

      // 各テーブルをクリアして再保存
      await db.properties.clear();
      await db.floors.clear();
      await db.blueprints.clear();
      await db.markers.clear();
      await db.inspections.clear();
      await db.defects.clear();
      await db.referenceImages.clear();
      await db.standardPhotos.clear();

      // データを一括保存
      if (data.properties.length > 0) {
        // 物件と定形写真を分離して保存
        const propertiesWithoutPhotos = data.properties.map(({ standardPhotos, ...rest }) => rest);
        const allStandardPhotos = data.properties.flatMap((p) => p.standardPhotos || []);

        await db.properties.bulkAdd(propertiesWithoutPhotos);
        if (allStandardPhotos.length > 0) {
          await db.standardPhotos.bulkAdd(allStandardPhotos);
        }
      }
      if (data.floors.length > 0) await db.floors.bulkAdd(data.floors);
      if (data.blueprints.length > 0) await db.blueprints.bulkAdd(data.blueprints);
      if (data.markers.length > 0) await db.markers.bulkAdd(data.markers);
      if (data.inspections.length > 0) await db.inspections.bulkAdd(data.inspections);
      if (data.defects.length > 0) await db.defects.bulkAdd(data.defects);
      if (data.referenceImages.length > 0) await db.referenceImages.bulkAdd(data.referenceImages);
    });
    console.log('[IndexedDB] saveData() completed successfully');
  } catch (error: any) {
    console.error('[IndexedDB] Failed to save data to IndexedDB:', error);
    
    // QuotaExceededErrorの明示的なハンドリング
    if (error.name === 'QuotaExceededError' || error.code === 'QUOTA_EXCEEDED') {
      const storageInfo = await getStorageUsage();
      console.error('[IndexedDB] Storage quota exceeded:', {
        used: formatStorageSize(storageInfo.used),
        total: formatStorageSize(storageInfo.total),
        available: formatStorageSize(storageInfo.available),
      });
      
      // 詳細なエラーメッセージ
      const enhancedError: any = new Error(
        `ストレージ容量が不足しています。\n` +
        `使用中: ${formatStorageSize(storageInfo.used)} / ${formatStorageSize(storageInfo.total)}\n` +
        `残り: ${formatStorageSize(storageInfo.available)}\n\n` +
        `古いデータを削除するか、データをエクスポートしてください。`
      );
      enhancedError.code = 'QUOTA_EXCEEDED';
      enhancedError.storageInfo = storageInfo;
      throw enhancedError;
    }
    
    throw error;
  }
};

/**
 * データのクリア
 */
export const clearData = async (): Promise<void> => {
  try {
    await db.transaction('rw', [
      db.appState,
      db.properties,
      db.floors,
      db.blueprints,
      db.markers,
      db.inspections,
      db.defects,
      db.referenceImages,
      db.standardPhotos,
    ], async () => {
      await db.appState.clear();
      await db.properties.clear();
      await db.floors.clear();
      await db.blueprints.clear();
      await db.markers.clear();
      await db.inspections.clear();
      await db.defects.clear();
      await db.referenceImages.clear();
      await db.standardPhotos.clear();
    });
  } catch (error) {
    console.error('Failed to clear data from IndexedDB:', error);
    throw error;
  }
};

/**
 * 特定のキーでデータを取得
 */
export const getData = async <K extends keyof AppState>(key: K): Promise<AppState[K]> => {
  const data = await loadData();
  return data[key];
};

/**
 * 特定のキーでデータを更新
 */
export const updateData = async <K extends keyof AppState>(
  key: K,
  value: AppState[K]
): Promise<void> => {
  const data = await loadData();
  data[key] = value;
  await saveData(data);
};

/**
 * ユーザー認証（非同期）
 */
export const authenticateUser = async (
  username: string,
  password: string
): Promise<User | null> => {
  const userWithHash = FIXED_USERS_HASHED.find((u) => u.username === username);

  if (!userWithHash) {
    return null;
  }

  // パスワードハッシュを検証
  const isValid = await verifyPassword(password, userWithHash.passwordHash);

  if (isValid) {
    const user = convertToUser(userWithHash);
    await db.appState.put({ key: 'currentUser', value: user });
    return user;
  }

  return null;
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  await db.appState.put({ key: 'currentUser', value: null });
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return await getData('currentUser');
};

// =========================================
// ストレージ使用状況取得（IndexedDB対応）
// =========================================

/**
 * IndexedDBの使用状況を取得
 */
export const getStorageUsage = async (): Promise<{
  used: number;
  total: number;
  available: number;
  usagePercentage: number;
  itemCount: number;
}> => {
  try {
    // StorageManager APIで正確な使用量を取得
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = quota - used;
      const usagePercentage = quota > 0 ? (used / quota) * 100 : 0;

      // アイテム数をカウント
      const [
        propertiesCount,
        floorsCount,
        blueprintsCount,
        markersCount,
        inspectionsCount,
        defectsCount,
        referenceImagesCount,
        standardPhotosCount,
      ] = await Promise.all([
        db.properties.count(),
        db.floors.count(),
        db.blueprints.count(),
        db.markers.count(),
        db.inspections.count(),
        db.defects.count(),
        db.referenceImages.count(),
        db.standardPhotos.count(),
      ]);

      const itemCount =
        propertiesCount +
        floorsCount +
        blueprintsCount +
        markersCount +
        inspectionsCount +
        defectsCount +
        referenceImagesCount +
        standardPhotosCount;

      return {
        used,
        total: quota,
        available,
        usagePercentage,
        itemCount,
      };
    }

    // StorageManager APIが利用できない場合のフォールバック
    const itemCount = await db.properties.count();
    return {
      used: 0,
      total: 0,
      available: 0,
      usagePercentage: 0,
      itemCount,
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return {
      used: 0,
      total: 0,
      available: 0,
      usagePercentage: 0,
      itemCount: 0,
    };
  }
};

/**
 * バイトサイズを人間が読みやすい形式に変換
 */
export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * IndexedDBの容量が十分かチェック
 * @param requiredBytes - 必要なバイト数
 * @returns 容量が十分な場合はtrue
 */
export const hasEnoughStorage = async (requiredBytes: number): Promise<boolean> => {
  const usage = await getStorageUsage();
  return usage.available >= requiredBytes;
};

/**
 * IndexedDBの使用状況を警告レベルで判定
 * @returns 'safe' | 'warning' | 'critical'
 */
export const getStorageWarningLevel = async (): Promise<'safe' | 'warning' | 'critical'> => {
  const usage = await getStorageUsage();

  if (usage.usagePercentage >= 90) return 'critical';
  if (usage.usagePercentage >= 80) return 'warning';
  return 'safe';
};

/**
 * IndexedDBの使用状況をログ出力
 */
export const logStorageUsage = async (): Promise<void> => {
  const usage = await getStorageUsage();
  const level = await getStorageWarningLevel();

  console.log('[IndexedDB] Usage:', {
    used: formatStorageSize(usage.used),
    total: formatStorageSize(usage.total),
    available: formatStorageSize(usage.available),
    usagePercentage: `${usage.usagePercentage.toFixed(1)}%`,
    itemCount: usage.itemCount,
    warningLevel: level,
  });
};

/**
 * 永続化ストレージを要求（削除を防ぐ）
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[IndexedDB] Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
      return isPersisted;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }
  return false;
};

/**
 * 永続化ストレージが有効かチェック
 */
export const isPersisted = async (): Promise<boolean> => {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('Failed to check persistence:', error);
      return false;
    }
  }
  return false;
};

// =========================================
// アプリ設定の読み書き（appStateテーブル利用）
// =========================================

/**
 * 設定値を取得
 */
export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const record = await db.appState.get(key);
    return record ? (record.value as T) : defaultValue;
  } catch (error) {
    console.error(`[IndexedDB] Failed to get setting "${key}":`, error);
    return defaultValue;
  }
};

/**
 * 設定値を保存
 */
export const setSetting = async <T>(key: string, value: T): Promise<void> => {
  try {
    await db.appState.put({ key, value });
  } catch (error) {
    console.error(`[IndexedDB] Failed to set setting "${key}":`, error);
    throw error;
  }
};

// =========================================
// 検査チェックリストデータ用ヘルパー関数
// =========================================

/**
 * 物件の検査チェックリストデータを取得
 */
export const getPropertyInspectionData = async (propertyId: string): Promise<PropertyInspectionData | null> => {
  try {
    const data = await db.propertyInspections.get(propertyId);
    return data || null;
  } catch (error) {
    console.error('[IndexedDB] Failed to get property inspection data:', error);
    return null;
  }
};

/**
 * 物件の検査チェックリストデータを保存
 */
export const savePropertyInspectionData = async (data: PropertyInspectionData): Promise<void> => {
  try {
    await db.propertyInspections.put(data);
    console.log('[IndexedDB] Property inspection data saved:', data.propertyId);
  } catch (error) {
    console.error('[IndexedDB] Failed to save property inspection data:', error);
    throw error;
  }
};

/**
 * 物件の検査チェックリストデータを削除
 */
export const deletePropertyInspectionData = async (propertyId: string): Promise<void> => {
  try {
    await db.propertyInspections.delete(propertyId);
    console.log('[IndexedDB] Property inspection data deleted:', propertyId);
  } catch (error) {
    console.error('[IndexedDB] Failed to delete property inspection data:', error);
    throw error;
  }
};

/**
 * 全ての検査チェックリストデータを取得
 */
export const getAllPropertyInspectionData = async (): Promise<PropertyInspectionData[]> => {
  try {
    return await db.propertyInspections.toArray();
  } catch (error) {
    console.error('[IndexedDB] Failed to get all property inspection data:', error);
    return [];
  }
};
