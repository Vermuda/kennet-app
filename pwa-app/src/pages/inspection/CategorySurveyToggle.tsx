/**
 * @file CategorySurveyToggle.tsx
 *
 * Renders the survey conducted/not-conducted toggle UI for an inspection
 * category. Supports two display modes:
 *   - compact: inline buttons used in mobile category headers
 *   - full: radio-button panel used in the tablet right pane
 *
 * The parent component is responsible for determining whether the toggle
 * should be rendered (i.e. checking `needsSurveyToggle`). This component
 * only handles presentation and user interaction.
 */

import React from 'react';
import type { InspectionCategory, CategorySurveyStatus } from '../../types/inspectionData';

/**
 * Props for the CategorySurveyToggle component.
 */
interface CategorySurveyToggleProps {
  /** The inspection category this toggle controls. */
  category: InspectionCategory;
  /** When true, renders the compact inline button style (mobile category header). */
  compact?: boolean;
  /** Current survey status for this category. */
  status: CategorySurveyStatus;
  /** Whether this category is marked as not-conducted (disabled). */
  isDisabled: boolean;
  /** Called when the user toggles the conducted state. */
  onToggleConducted: (conducted: boolean) => void;
  /** Opens the reason editing modal for the given category. */
  onEditReason: (catId: string, currentReason: string) => void;
  /** Displays a toast notification message. */
  toast: (msg: string) => void;
}

/**
 * CategorySurveyToggle - Toggle UI for marking an inspection category as
 * conducted or not-conducted.
 *
 * @param props - See {@link CategorySurveyToggleProps}
 * @returns The toggle UI element in either compact or full layout.
 */
const CategorySurveyToggle: React.FC<CategorySurveyToggleProps> = ({
  category,
  compact = false,
  status,
  isDisabled,
  onToggleConducted,
  onEditReason,
  toast,
}) => {
  /**
   * Handles the toggle action. When switching to "conducted", calls
   * onToggleConducted directly with a toast notification. When switching
   * to "not conducted", opens the reason editor instead so the user can
   * provide or confirm a reason.
   *
   * @param conducted - true if the user selected "conducted"
   */
  const handleToggle = (conducted: boolean) => {
    if (conducted) {
      if (isDisabled) {
        if (!window.confirm('調査実施に変更しますか？')) return;
      }
      onToggleConducted(true);
      toast(`${category.shortName}: 調査実施に変更`);
    } else {
      onEditReason(category.id, status.notConductedReason || '');
    }
  };

  // -- Compact mode: inline buttons for mobile category headers --
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={() => handleToggle(true)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition ${
            !isDisabled
              ? 'bg-emerald-400 text-white font-bold'
              : 'bg-white/20 text-white/70'
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            !isDisabled
              ? 'border-white bg-white'
              : 'border-white/50'
          }`}>
            {!isDisabled && <span className="text-emerald-500 text-xs font-bold">✓</span>}
          </span>
          <span>実施</span>
        </button>
        <button
          onClick={() => handleToggle(false)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition ${
            isDisabled
              ? 'bg-red-400 text-white font-bold'
              : 'bg-white/20 text-white/70'
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            isDisabled
              ? 'border-white bg-white'
              : 'border-white/50'
          }`}>
            {isDisabled && <span className="text-red-500 text-xs font-bold">✓</span>}
          </span>
          <span>不可</span>
        </button>
        {isDisabled && status.notConductedReason && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditReason(category.id, status.notConductedReason || ''); }}
            className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded truncate max-w-[80px]"
            title={status.notConductedReason}
          >
            {status.notConductedReason}
          </button>
        )}
      </div>
    );
  }

  // -- Full mode: radio-button panel for tablet right pane --
  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="font-bold text-slate-700 text-sm">調査実施状況</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`survey-full-${category.id}`}
              checked={!isDisabled}
              onChange={() => handleToggle(true)}
              className="w-4 h-4 text-emerald-600"
            />
            <span className={`text-sm ${!isDisabled ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>
              調査実施
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`survey-full-${category.id}`}
              checked={isDisabled}
              onChange={() => handleToggle(false)}
              className="w-4 h-4 text-red-600"
            />
            <span className={`text-sm ${isDisabled ? 'font-bold text-red-600' : 'text-slate-500'}`}>
              調査実施不可
            </span>
          </label>
        </div>
      </div>
      {isDisabled && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-red-700 font-medium">不可理由:</span>
            <button
              onClick={() => onEditReason(category.id, status.notConductedReason || '')}
              className="text-xs text-red-600 underline"
            >
              編集
            </button>
          </div>
          <p className="text-sm text-red-800 mt-1">
            {status.notConductedReason || '（理由を入力してください）'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySurveyToggle;
