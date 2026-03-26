/**
 * 定型写真マスタデータ
 *
 * 物件登録後に必ず撮影する16種類の定型写真の定義
 * 1-14: 必須
 * 15-16: 任意（条件付き）
 */

export interface StandardPhotoType {
  id: number;
  name: string;
  required: boolean;
}

export const STANDARD_PHOTO_TYPES: StandardPhotoType[] = [
  {
    id: 1,
    name: '調査員自身撮影',
    required: true,
  },
  {
    id: 2,
    name: '建物全景',
    required: true,
  },
  {
    id: 3,
    name: '建物館銘板等',
    required: true,
  },
  {
    id: 4,
    name: '敷地及び地盤（地盤）',
    required: true,
  },
  {
    id: 5,
    name: '各点検口内（床下点検口内）',
    required: true,
  },
  {
    id: 6,
    name: '各点検口内（小屋裏・天井点検口内）',
    required: true,
  },
  {
    id: 7,
    name: '建築物外部（基礎）',
    required: true,
  },
  {
    id: 8,
    name: '建築物外部（外壁）',
    required: true,
  },
  {
    id: 9,
    name: '建築物外部（外壁）',
    required: true,
  },
  {
    id: 10,
    name: '建築物外部（共用廊下・階段・エントランス）',
    required: true,
  },
  {
    id: 11,
    name: '建築物外部（共用廊下・階段・エントランス）',
    required: true,
  },
  {
    id: 12,
    name: '建築物外部（屋外階段）',
    required: true,
  },
  {
    id: 13,
    name: '屋根及び屋上（屋根又は屋上）',
    required: true,
  },
  {
    id: 14,
    name: '共用部（郵便受・ごみ置場・駐輪駐車場）',
    required: true,
  },
  {
    id: 15,
    name: '鉄筋の有無（基礎又は耐力壁等）',
    required: false,
  },
  {
    id: 16,
    name: '非破壊圧縮強度（耐力壁等のコンクリート部）',
    required: false,
  },
];

/**
 * 必須の定型写真の数を取得
 */
export const getRequiredPhotoCount = (): number => {
  return STANDARD_PHOTO_TYPES.filter(type => type.required).length;
};

/**
 * 任意の定型写真の数を取得
 */
export const getOptionalPhotoCount = (): number => {
  return STANDARD_PHOTO_TYPES.filter(type => !type.required).length;
};

/**
 * IDから定型写真タイプを取得
 */
export const getStandardPhotoTypeById = (id: number): StandardPhotoType | undefined => {
  return STANDARD_PHOTO_TYPES.find(type => type.id === id);
};
