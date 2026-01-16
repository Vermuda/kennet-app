// 検査項目の評価タイプ
export type StandardEvaluation = 'a' | 'b1' | 'b2' | 'c' | 'na'; // 通常の劣化評価
export type ManagementEvaluation = 'S' | 'A' | 'B' | 'C'; // 管理状況評価
export type LegalEvaluation = 'none' | 'concern'; // 違法性関係評価

// 検査項目の評価データ
export interface InspectionEvaluation {
  id: string;
  eval: StandardEvaluation | ManagementEvaluation | LegalEvaluation;
  memo: string; // 場所メモ
  concernDetail?: string; // 違法性関係の懸念内容
  rebarPitch?: number; // No.95 配筋のピッチ(cm)
  schmidtValues?: number[]; // No.96 シュミットハンマー測定値(9回)
  schmidtResult?: number; // No.96 算定結果
  hasPhoto?: boolean; // 写真有無
  timestamp: number;
}

// 検査項目
export interface InspectionItem {
  id: string;
  num: number; // 番号 1-101
  name: string; // 項目名
  desc: string; // 調査内容（劣化度合）
  sub?: string; // 補足情報（仕様選択等）
  evalType: 'standard' | 'management' | 'legal' | 'rebar' | 'schmidt';
  options?: { // 付随する選択肢（有無、形式など）
    label: string;
    choices: string[];
    multiple?: boolean;
  }[];
}

// 検査カテゴリ
export interface InspectionCategory {
  id: string;
  name: string; // フルネーム
  shortName: string; // 短縮名
  color: string; // Tailwind グラデーションクラス
  emoji: string;
  items: InspectionItem[];
}

// 物件ごとの検査結果
export interface PropertyInspectionData {
  propertyId: string;
  evaluations: {
    [itemId: string]: InspectionEvaluation[];
  };
  options: {
    [itemId: string]: { [optionLabel: string]: string | string[] };
  };
  surveyInfo: {
    conducted: boolean; // 調査実施
    notConductedReason?: string; // 不可理由
  };
  updatedAt: string;
}

// 評価ラベル
export const standardEvalLabels: Record<StandardEvaluation, { label: string; detail: string }> = {
  a: { label: 'a', detail: '概ね良好 - 劣化等の事象がほとんどなく、補修・改修の必要がない程度' },
  b1: { label: 'b1', detail: '進行（軽度）- 建物の使用には支障がなく、美観を損ねる劣化の程度' },
  b2: { label: 'b2', detail: '進行（中度）- 建物の使用に支障はないが、放置すると構造躯体への影響が懸念される劣化の程度' },
  c: { label: 'c', detail: '著しく進行（重度）- 構造部材の耐久性を懸念する劣化事象に対し、早急に補修等を要する劣化の程度' },
  na: { label: '−', detail: '対象外 - 調査対象の該当が無い、または何らかの理由で実施出来なかった' },
};

export const managementEvalLabels: Record<ManagementEvaluation, { label: string; detail: string }> = {
  S: { label: 'S', detail: '概ね良好 - 日常の清掃や点検の管理がされており、良好な美観' },
  A: { label: 'A', detail: '通常 - 清掃、点検はされていると思われる' },
  B: { label: 'B', detail: '通常（少ない）- 清掃、点検の定期実施の頻度が少ないと思われる' },
  C: { label: 'C', detail: '管理・清掃がされていない - 清掃、点検の実施が明らかにされていない' },
};

export const legalEvalLabels: Record<LegalEvaluation, { label: string; detail: string }> = {
  none: { label: '無', detail: '懸念なし' },
  concern: { label: '有', detail: '懸念あり - 内容を記載' },
};
