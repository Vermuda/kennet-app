import type { AppState, User } from '../types';

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

// 固定アカウント
export const FIXED_USERS: User[] = [
  { id: '1', username: 'user1', password: 'password1' },
  { id: '2', username: 'user2', password: 'password2' },
];

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

// ユーザー認証
export const authenticateUser = (username: string, password: string): User | null => {
  const user = FIXED_USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
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

