/**
 * @file inspectionConstants.ts
 * @description 検査チェックシートで使用する定数定義
 */

/** デバッグモード: trueにするとダミーデータ一括入力ができる（本番では false にする） */
export const DEBUG_MODE = true;

/**
 * 評価の優先度マッピング
 * @description 数値が大きいほど重度。既存評価より軽度の評価を追加させない判定に使用。
 */
export const EVAL_PRIORITY: Record<string, number> = {
  'a': 1,
  'b1': 2,
  'b2': 3,
  'c': 4,
};

/**
 * 評価ラベルのマッピング
 * @description UIでの表示用ラベル
 */
export const EVAL_LABELS: Record<string, string> = {
  'a': 'a（良好）',
  'b1': 'b1（軽度）',
  'b2': 'b2（中度）',
  'c': 'c（重度）',
};

/**
 * 基礎グループの仕上げ材選択肢
 * @description 基礎（group_kiso）ヘッダーで表示する仕上げ材の種類一覧
 */
export const KISO_FINISH_MATERIALS = [
  'コンクリート直仕上げ',
  'モルタル仕上げ・その他塗り仕上げ',
  'その他仕上げ',
] as const;

/**
 * 評価バッジの背景色マッピング
 * @description 評価値に対応するTailwindCSSの背景色クラス
 */
export const EVAL_BADGE_COLORS: Record<string, string> = {
  'a': 'bg-emerald-500',
  'b1': 'bg-blue-500',
  'b2': 'bg-amber-500',
  'c': 'bg-red-500',
  'na': 'bg-slate-400',
  'S': 'bg-emerald-500',
  'A': 'bg-blue-500',
  'B': 'bg-amber-500',
  'C': 'bg-red-500',
  'none': 'bg-emerald-500',
  'concern': 'bg-red-500',
};

/**
 * 調査実施/不可の切り替えが不要なカテゴリIDリスト
 * @description cat1: 敷地・地盤、cat7: 違法性 は常に調査実施
 */
export const CATEGORIES_WITHOUT_SURVEY_TOGGLE = ['cat1', 'cat6', 'cat7'];

/**
 * 項目単位で調査実施/不可の切り替えが必要な項目IDリスト
 * @description item95: 鉄筋探査、item96: シュミットハンマー
 */
export const ITEMS_WITH_SURVEY_TOGGLE = ['item95', 'item96'];

/**
 * メンテナンス入力項目の定義
 * @description メンテナンスセクションで表示する項目一覧
 */
export const MAINTENANCE_ITEMS: readonly MaintenanceItem[] = [
  { id: 'maint_cat1', label: '外部① 敷地及び地盤', subLabel: '地盤、敷地、擁壁、駐車場、建物周囲の有無' },
  { id: 'maint_cat2', label: '外部② 各点検口内', subGroups: [
    { label: '床下点検口※1', groupId: 'group_yukashita' },
    { label: '小屋裏・天井点検口※1', groupId: 'group_koyaura' },
  ] },
  { id: 'maint_cat3', label: '外部③ 建築物外部', subLabel: '基礎、外壁、屋外階段（鉄骨）、共用部の廊下、バルコニー、エントランスホール、階段' },
  { id: 'maint_cat4', label: '外部④ 屋根及び屋上（目視）', subGroups: [
    { label: '屋根※1', groupId: 'group_yane' },
    { label: '屋上※1', groupId: 'group_okujou' },
  ] },
  { id: 'maint_cat5', label: '外部⑤ 共用部内装', subLabel: '室内部' },
];

/** メンテナンス項目のサブグループ定義 */
export interface MaintenanceSubGroup {
  /** サブグループ表示ラベル */
  label: string;
  /** 連動するグループID */
  groupId: string;
}

/** メンテナンス項目の定義 */
export interface MaintenanceItem {
  /** 項目ID */
  id: string;
  /** 項目ラベル */
  label: string;
  /** 補足ラベル（単一テキスト） */
  subLabel?: string;
  /** サブグループ（チェック連動するサブ項目のリスト） */
  subGroups?: MaintenanceSubGroup[];
}

/**
 * 床下点検口グループ: スコープ調査実施の選択肢
 */
export const YUKASHITA_SCOPE_CHOICES = ['実施可', '実施不可'] as const;

/**
 * 床下点検口グループ: スコープ調査方面の選択肢（複数選択可）
 */
export const YUKASHITA_SCOPE_DIRECTIONS = ['東', '西', '南', '北'] as const;

/**
 * 床下点検口グループ: 基礎形式の選択肢
 */
export const YUKASHITA_FOUNDATION_TYPES = ['ベタ基礎', '布基礎', '独立基礎', '杭基礎', 'その他'] as const;

/**
 * 床下点検口グループ: 換気方法の選択肢
 */
export const YUKASHITA_VENTILATION_METHODS = ['換気口', '基礎パッキン', '無'] as const;

/**
 * 床下点検口グループ: 断熱工法の選択肢
 */
export const YUKASHITA_INSULATION_METHODS = ['床断熱工法', '基礎断熱工法', '無', '不明'] as const;

/**
 * 小屋裏・天井点検口グループ: 換気口設置の選択肢
 */
export const KOYAURA_VENTILATION_CHOICES = ['設置有', '設置無', '不明'] as const;
