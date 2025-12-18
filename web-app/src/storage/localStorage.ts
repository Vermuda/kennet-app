import type { AppState, User } from '../types';
import { verifyPassword } from '../utils/auth';

const STORAGE_KEY = 'inspection_app_data';

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
    passwordHash: 'f8c3bf62a9aa3e6fc1619c250e48ede3f80221c72208c96f4a7c88f4e3f14c7a'
  },
  {
    id: '2',
    username: 'user2',
    passwordHash: '86c4b0e9f2e8c1e5e9a2f3f8c0c8e5c9e5e1f2e4c9c1f3e7c8f5e2e1f4c9c2f3'
  },
];

// User型への変換（パスワードハッシュを含まない）
const convertToUser = (userWithHash: UserWithHash): User => ({
  id: userWithHash.id,
  username: userWithHash.username,
  password: '', // セキュリティのため空文字
});

// データの読み込み
export const loadData = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
  }
  return initialData;
};

// データの保存
export const saveData = (data: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
};

// データのクリア
export const clearData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data from localStorage:', error);
  }
};

// 特定のキーでデータを取得
export const getData = <K extends keyof AppState>(key: K): AppState[K] => {
  const data = loadData();
  return data[key];
};

// 特定のキーでデータを更新
export const updateData = <K extends keyof AppState>(
  key: K,
  value: AppState[K]
): void => {
  const data = loadData();
  data[key] = value;
  saveData(data);
};

// ユーザー認証（非同期）
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  const userWithHash = FIXED_USERS_HASHED.find(
    (u) => u.username === username
  );

  if (!userWithHash) {
    return null;
  }

  // パスワードハッシュを検証
  const isValid = await verifyPassword(password, userWithHash.passwordHash);

  if (isValid) {
    const user = convertToUser(userWithHash);
    const data = loadData();
    data.currentUser = user;
    saveData(data);
    return user;
  }

  return null;
};

// ログアウト
export const logout = (): void => {
  const data = loadData();
  data.currentUser = null;
  saveData(data);
};

// 現在のユーザーを取得
export const getCurrentUser = (): User | null => {
  return getData('currentUser');
};

/**
 * LocalStorageの使用状況を取得
 */
export const getStorageUsage = (): {
  used: number;
  total: number;
  available: number;
  usagePercentage: number;
  itemCount: number;
} => {
  let used = 0;
  let itemCount = 0;
  
  // LocalStorage内の全データサイズを計算
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // キーと値の両方のサイズを計算
        used += new Blob([key]).size + new Blob([value]).size;
        itemCount++;
      }
    }
  }
  
  // LocalStorageの推定総容量（ブラウザによって異なるが、通常5-10MB）
  const total = 10 * 1024 * 1024; // 10MB を想定
  const available = total - used;
  const usagePercentage = (used / total) * 100;
  
  return {
    used,
    total,
    available,
    usagePercentage,
    itemCount,
  };
};

/**
 * バイトサイズを人間が読みやすい形式に変換
 */
export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * LocalStorageの容量が十分かチェック
 * @param requiredBytes - 必要なバイト数
 * @returns 容量が十分な場合はtrue
 */
export const hasEnoughStorage = (requiredBytes: number): boolean => {
  const usage = getStorageUsage();
  return usage.available >= requiredBytes;
};

/**
 * LocalStorageの使用状況を警告レベルで判定
 * @returns 'safe' | 'warning' | 'critical'
 */
export const getStorageWarningLevel = (): 'safe' | 'warning' | 'critical' => {
  const usage = getStorageUsage();
  
  if (usage.usagePercentage >= 90) return 'critical';
  if (usage.usagePercentage >= 70) return 'warning';
  return 'safe';
};

/**
 * LocalStorageの使用状況をログ出力
 */
export const logStorageUsage = (): void => {
  const usage = getStorageUsage();
  const level = getStorageWarningLevel();
  
  console.log('[LocalStorage] Usage:', {
    used: formatStorageSize(usage.used),
    total: formatStorageSize(usage.total),
    available: formatStorageSize(usage.available),
    usagePercentage: `${usage.usagePercentage.toFixed(1)}%`,
    itemCount: usage.itemCount,
    warningLevel: level,
  });
};

