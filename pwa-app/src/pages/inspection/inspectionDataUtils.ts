/**
 * @file inspectionDataUtils.ts
 * @description 検査データのCRUD操作と初期化、ダミー画像生成などのユーティリティ関数
 */

import { getPropertyInspectionData, savePropertyInspectionData } from '../../storage/indexedDB';
import type { PropertyInspectionData } from '../../types/inspectionData';

/**
 * 検査データの初期値を生成する
 * @param propertyId - 物件ID
 * @returns 初期状態の PropertyInspectionData
 */
export const createInitialInspectionData = (propertyId: string): PropertyInspectionData => ({
  propertyId,
  evaluations: {},
  options: {},
  surveyInfo: { conducted: true },
  categorySurveyStatus: {},
  groupExistence: {
    group_youheki: { exists: true },
    group_parking: { exists: true },
    group_bicycle: { exists: true },
    group_yukashita: { exists: true },
    group_koyaura: { exists: true },
  },
  maintenanceStatus: {},
  updatedAt: new Date().toISOString(),
});

/**
 * IndexedDBから検査データを読み込む（非同期）
 * @param propertyId - 物件ID
 * @returns 既存データ or 初期値
 */
export const loadInspectionData = async (propertyId: string): Promise<PropertyInspectionData> => {
  try {
    const data = await getPropertyInspectionData(propertyId);
    if (data) return data;
  } catch (e) {
    console.error('Failed to load inspection data:', e);
  }
  return createInitialInspectionData(propertyId);
};

/**
 * IndexedDBに検査データを保存する（非同期）
 * @param data - 保存する PropertyInspectionData
 */
export const saveInspectionData = async (data: PropertyInspectionData): Promise<void> => {
  try {
    const dataToSave = { ...data, updatedAt: new Date().toISOString() };
    await savePropertyInspectionData(dataToSave);
  } catch (e) {
    console.error('Failed to save inspection data:', e);
  }
};

/**
 * ダミーの不具合画像を生成する（Canvas APIで描画）
 * @param itemNum - 検査項目番号
 * @param itemName - 検査項目名
 * @param evalType - 評価タイプ ('b2' | 'c')
 * @returns Base64エンコードされたJPEG画像データURL
 *
 * @description デバッグモードでの一括ダミーデータ入力時に使用。
 * b2は青背景、cは赤背景のダミー画像を生成する。
 */
export const generateDummyDefectImage = (itemNum: number, itemName: string, evalType: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景色（評価タイプで色分け）
  if (evalType === 'c') {
    ctx.fillStyle = '#fee2e2'; // red-100
  } else {
    ctx.fillStyle = '#dbeafe'; // blue-100
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = evalType === 'c' ? '#ef4444' : '#3b82f6';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // テキスト
  ctx.fillStyle = '#333';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`[DEBUG] No.${itemNum}`, canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '20px sans-serif';
  const shortName = itemName.length > 20 ? itemName.substring(0, 20) + '...' : itemName;
  ctx.fillText(shortName, canvas.width / 2, canvas.height / 2);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = evalType === 'c' ? '#dc2626' : '#2563eb';
  ctx.fillText(`評価: ${evalType.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 40);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(new Date().toLocaleString('ja-JP'), canvas.width / 2, canvas.height / 2 + 80);

  return canvas.toDataURL('image/jpeg', 0.7);
};
