/**
 * @file RemarksSection.tsx
 * @description 備考セクションコンポーネント
 *
 * 検査チェックシートの遵法性関係（cat8）の下に表示する備考入力エリア。
 * 現地調査時の状況やその他調査における懸念・留意事項等を自由記述で入力できる。
 */

const DEFAULT_REMARKS_KEY = 'remarks';
const DEFAULT_REMARKS_LABEL = '備考';
const DEFAULT_DESCRIPTION = '現地調査時の状況・その他調査における懸念や留意事項等（鉄筋探査(検査済証の交付を受けていない場合)、シュミットハンマー(旧耐震の場合のみ)の結果等）';

interface RemarksSectionProps {
  /** 指定IDのオプション値を取得する */
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  /** 指定IDのオプション値を更新する */
  updateItemOption: (itemId: string, label: string, value: string | string[]) => void;
  /** オプション: 備考データのキー（デフォルト: 'remarks'） */
  remarksKey?: string;
  /** オプション: 備考セクションのラベル（デフォルト: '備考'） */
  remarksLabel?: string;
  /** オプション: 説明文（デフォルト: 遵法性関係の説明） */
  description?: string;
}

/**
 * 備考セクション
 *
 * 検査チェックシートの備考入力エリア。
 * デフォルトでは遵法性関係（cat8）の下に表示される自由記述エリアとして機能する。
 * remarksKey / remarksLabel / description を指定することで、他のカテゴリにも再利用可能。
 */
function RemarksSection({
  getItemOption,
  updateItemOption,
  remarksKey = DEFAULT_REMARKS_KEY,
  remarksLabel = DEFAULT_REMARKS_LABEL,
  description = DEFAULT_DESCRIPTION,
}: RemarksSectionProps) {
  // データ保存キーは英字を使用（VBA-JSONパーサーが日本語キーでパースエラーになるため）
  // VBAマッピングのremarks_generalと一致させる
  // 既存データの'備考'キーもフォールバックで読み取り
  const value = (getItemOption(remarksKey, 'remarks_general') as string)
    || (getItemOption(remarksKey, remarksLabel) as string)
    || '';

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3">
        <h3 className="font-bold text-lg">{remarksLabel}</h3>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          {description}
        </p>
        <textarea
          value={value}
          onChange={(e) => updateItemOption(remarksKey, 'remarks_general', e.target.value)}
          placeholder={`${remarksLabel}を入力してください`}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y min-h-[120px]"
          rows={5}
        />
      </div>
    </div>
  );
}

export default RemarksSection;
