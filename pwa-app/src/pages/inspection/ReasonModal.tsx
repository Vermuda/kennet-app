/**
 * @file ReasonModal.tsx
 *
 * Modal component for entering the reason why a category's survey was not conducted.
 * Displays a centered overlay with a textarea input, validation, and save/cancel actions.
 */

import React from 'react';

/**
 * Props for the ReasonModal component.
 */
interface ReasonModalProps {
  /** Category name to display as context for the user */
  categoryName: string;
  /** Current editing state containing the category ID and the reason text */
  editingReason: { catId: string; reason: string };
  /** Called when the reason text changes */
  onReasonChange: (reason: string) => void;
  /** Called when the user confirms and saves the reason */
  onSave: () => void;
  /** Called when the user cancels and dismisses the modal */
  onCancel: () => void;
}

/**
 * ReasonModal - A modal dialog for entering the reason a category's survey
 * could not be conducted (調査実施不可の理由).
 *
 * The save button is disabled until the user enters a non-empty reason.
 * Setting a category as not-conducted will lock all items within that category.
 *
 * @param props - {@link ReasonModalProps}
 */
const ReasonModal: React.FC<ReasonModalProps> = ({
  categoryName,
  editingReason,
  onReasonChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-2">調査実施不可の理由</h3>
        <p className="text-sm text-slate-500 mb-4">{categoryName}</p>
        <textarea
          value={editingReason.reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="不可理由を入力してください（必須）"
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-red-500 focus:outline-none h-32 resize-none"
          autoFocus
        />
        <p className="text-xs text-slate-400 mt-2 mb-4">
          ※調査実施不可に設定すると、このカテゴリ内の項目は入力できなくなります
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-slate-300 text-slate-600 py-3 rounded-xl font-bold"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            disabled={!editingReason.reason.trim()}
            className={`flex-1 py-3 rounded-xl font-bold transition ${
              editingReason.reason.trim()
                ? 'bg-red-600 text-white'
                : 'bg-slate-300 text-white'
            }`}
          >
            設定する
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
