/**
 * 定形写真マスタデータ
 *
 * 物件登録後に必ず撮影する16種類の定形写真の定義
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
    name: '基礎',
    required: true,
  },
  {
    id: 4,
    name: '外壁',
    required: true,
  },
  {
    id: 5,
    name: '屋根',
    required: true,
  },
  {
    id: 6,
    name: '共用部分（共同住宅のみ）',
    required: true,
  },
  {
    id: 7,
    name: '点検口（天井裏）',
    required: true,
  },
  {
    id: 8,
    name: '天井裏',
    required: true,
  },
  {
    id: 9,
    name: '点検口（床下）',
    required: true,
  },
  {
    id: 10,
    name: '床下',
    required: true,
  },
  {
    id: 11,
    name: '台所',
    required: true,
  },
  {
    id: 12,
    name: '浴室',
    required: true,
  },
  {
    id: 13,
    name: '洗面所',
    required: true,
  },
  {
    id: 14,
    name: 'トイレ',
    required: true,
  },
  {
    id: 15,
    name: '鉄筋の有無（基礎又は耐力壁等）※完了検査済証の交付を受けていない場合のみ',
    required: false,
  },
  {
    id: 16,
    name: '非破壊圧縮強度（耐力壁等のコンクリート部）※旧耐震の場合のみ',
    required: false,
  },
];

/**
 * 必須の定形写真の数を取得
 */
export const getRequiredPhotoCount = (): number => {
  return STANDARD_PHOTO_TYPES.filter(type => type.required).length;
};

/**
 * 任意の定形写真の数を取得
 */
export const getOptionalPhotoCount = (): number => {
  return STANDARD_PHOTO_TYPES.filter(type => !type.required).length;
};

/**
 * IDから定形写真タイプを取得
 */
export const getStandardPhotoTypeById = (id: number): StandardPhotoType | undefined => {
  return STANDARD_PHOTO_TYPES.find(type => type.id === id);
};
