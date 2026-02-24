/**
 * @file useInspectionChecklist.ts
 * @description 検査チェックシートのビジネスロジックを集約したカスタムフック
 *
 * @remarks
 * InspectionChecklistPage から state 管理・データ操作ロジックを抽出。
 * UI描画に関わらない全てのロジック（評価操作、カテゴリ管理、進捗計算、デバッグ機能等）を含む。
 *
 * @example
 * ```tsx
 * const { inspectionData, openModal, handleAddEvaluation, ... } = useInspectionChecklist(propertyId);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '../../utils/helpers';
import { inspectionMaster, getItemById } from '../../utils/inspectionMaster';
import { loadData, saveData } from '../../storage/indexedDB';
import { loadInspectionData, saveInspectionData, generateDummyDefectImage } from './inspectionDataUtils';
import { DEBUG_MODE, EVAL_PRIORITY, CATEGORIES_WITHOUT_SURVEY_TOGGLE, ITEMS_WITH_SURVEY_TOGGLE } from './inspectionConstants';
import type { Marker, Inspection, DefectInfo, Blueprint } from '../../types';
import type {
  InspectionEvaluation,
  StandardEvaluation,
  ManagementEvaluation,
  LegalEvaluation,
  PropertyInspectionData,
  InspectionCategory,
  InspectionItem,
  CategorySurveyStatus,
  GroupExistenceStatus,
  CategoryMaintenanceStatus,
  SurveyMethod,
} from '../../types/inspectionData';

// ─── 戻り値の型定義 ──────────────────────────────────────

/** useInspectionChecklist の戻り値型 */
export interface UseInspectionChecklistReturn {
  // --- state ---
  inspectionData: PropertyInspectionData | null;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  modalItemId: string | null;
  selectedEval: string | null;
  setSelectedEval: (e: string | null) => void;
  locationMemo: string;
  setLocationMemo: (v: string) => void;
  concernDetail: string;
  setConcernDetail: (v: string) => void;
  freetextContent: string;
  setFreetextContent: (v: string) => void;
  selectedSurveyMethods: SurveyMethod[];
  setSelectedSurveyMethods: React.Dispatch<React.SetStateAction<SurveyMethod[]>>;
  rebarPitch: string;
  setRebarPitch: (v: string) => void;
  schmidtValues: string[];
  setSchmidtValues: (v: string[]) => void;
  surveyMethodError: boolean;
  setSurveyMethodError: (v: boolean) => void;
  isTablet: boolean;
  showToast: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  editingCategoryReason: { catId: string; reason: string } | null;
  setEditingCategoryReason: (v: { catId: string; reason: string } | null) => void;
  isFillingDebug: boolean;
  showDebugPanel: boolean;
  setShowDebugPanel: (v: boolean) => void;

  // --- 計算値 ---
  /** 現在選択中のカテゴリ */
  currentCategory: InspectionCategory | undefined;
  /** モーダルで開いている項目情報 */
  modalItem: ReturnType<typeof getItemById>;
  /** 選択中の評価がb2 or cか */
  isDefectEval: boolean;
  /** 標準評価で調査方法が未選択 */
  isStandardMissingSurvey: boolean;

  // --- カテゴリ調査状態 ---
  getCategorySurveyStatus: (categoryId: string) => CategorySurveyStatus;
  updateCategorySurveyStatus: (categoryId: string, status: CategorySurveyStatus) => void;
  needsSurveyToggle: (categoryId: string) => boolean;
  isCategoryDisabled: (categoryId: string) => boolean;

  // --- 項目単位の調査状態 ---
  getItemSurveyStatus: (itemId: string) => CategorySurveyStatus;
  updateItemSurveyStatus: (itemId: string, status: CategorySurveyStatus) => void;
  needsItemSurveyToggle: (itemId: string) => boolean;
  isItemDisabledBySurvey: (itemId: string) => boolean;

  // --- グループ有無 ---
  getGroupExistence: (groupId: string) => GroupExistenceStatus | null;
  updateGroupExistence: (groupId: string, exists: boolean) => void;

  // --- 項目オプション ---
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  updateItemOption: (itemId: string, label: string, value: string | string[]) => void;

  // --- 無効化判定 ---
  isItemDisabledByGroupExistence: (item: InspectionItem) => boolean;
  isItemDisabledByItemOption: (item: InspectionItem) => boolean;
  isItemDisabledByFinishMaterial: (item: InspectionItem) => boolean;

  // --- 仕上げ材 ---
  getFinishMaterials: (groupId: string) => string[];
  toggleFinishMaterial: (groupId: string, material: string) => void;

  // --- メンテナンス ---
  getMaintenanceStatus: (id: string) => CategoryMaintenanceStatus;
  updateMaintenanceStatus: (id: string, updates: Partial<CategoryMaintenanceStatus>) => void;

  // --- 進捗 ---
  getCategoryProgress: (category: InspectionCategory) => { done: number; total: number; skipped?: boolean };
  getTotalProgress: () => { done: number; total: number; percent: number; skippedCategories: number };

  // --- 評価操作 ---
  getWorstEvaluation: (itemId: string) => string | null;
  getDisabledEvals: (itemId: string) => Set<string>;
  handleAddEvaluation: (goToDefectCapture?: boolean) => void;
  handleRemoveEvaluation: (itemId: string, evalIndex: number) => void;

  // --- モーダル ---
  openModal: (itemId: string) => void;
  closeModal: () => void;

  // --- ナビゲーション ---
  handleBack: () => void;
  jumpToCategory: (catId: string) => void;
  toast: (msg: string) => void;

  // --- デバッグ ---
  handleDebugFillAll: () => Promise<void>;
  handleDebugClearAll: () => Promise<void>;
}

// ─── フック本体 ──────────────────────────────────────

/**
 * 検査チェックシートの全ロジックを管理するカスタムフック
 * @param propertyId - 物件ID（URLパラメータから渡す）
 * @returns 検査チェックシートの状態と操作関数一式
 */
export function useInspectionChecklist(propertyId: string | undefined): UseInspectionChecklistReturn {
  const navigate = useNavigate();

  // ─── State ──────────────────────────────────────
  const [inspectionData, setInspectionData] = useState<PropertyInspectionData | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [selectedEval, setSelectedEval] = useState<string | null>(null);
  const [locationMemo, setLocationMemo] = useState('');
  const [concernDetail, setConcernDetail] = useState('');
  const [freetextContent, setFreetextContent] = useState('');
  const [selectedSurveyMethods, setSelectedSurveyMethods] = useState<SurveyMethod[]>([]);
  const [rebarPitch, setRebarPitch] = useState('');
  const [schmidtValues, setSchmidtValues] = useState<string[]>(Array(9).fill(''));
  const [surveyMethodError, setSurveyMethodError] = useState(false);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768);
  const [showToast, setShowToast] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingCategoryReason, setEditingCategoryReason] = useState<{ catId: string; reason: string } | null>(null);
  const [isFillingDebug, setIsFillingDebug] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // ─── Effects ──────────────────────────────────────

  /** 画面サイズ監視 */
  useEffect(() => {
    const handleResize = () => setIsTablet(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** データ読み込み（非同期） */
  useEffect(() => {
    const fetchData = async () => {
      if (propertyId) {
        const data = await loadInspectionData(propertyId);
        setInspectionData(data);
      }
    };
    fetchData();
  }, [propertyId]);

  // ─── カテゴリ調査状態 ──────────────────────────────

  /** カテゴリの調査実施状況を取得 */
  const getCategorySurveyStatus = useCallback((categoryId: string): CategorySurveyStatus => {
    if (!inspectionData?.categorySurveyStatus?.[categoryId]) {
      return { conducted: true };
    }
    return inspectionData.categorySurveyStatus[categoryId];
  }, [inspectionData]);

  /** カテゴリの調査実施状況を更新 */
  const updateCategorySurveyStatus = useCallback((categoryId: string, status: CategorySurveyStatus) => {
    if (!inspectionData) return;
    const newData = {
      ...inspectionData,
      categorySurveyStatus: {
        ...inspectionData.categorySurveyStatus,
        [categoryId]: status,
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData]);

  /** カテゴリに調査実施/不可の切り替えが必要かどうか */
  const needsSurveyToggle = useCallback((categoryId: string): boolean => {
    return !CATEGORIES_WITHOUT_SURVEY_TOGGLE.includes(categoryId);
  }, []);

  /** カテゴリが調査実施不可かどうか */
  const isCategoryDisabled = useCallback((categoryId: string): boolean => {
    if (!needsSurveyToggle(categoryId)) return false;
    const status = getCategorySurveyStatus(categoryId);
    return !status.conducted;
  }, [getCategorySurveyStatus, needsSurveyToggle]);

  // ─── 項目単位の調査状態 ──────────────────────────────

  /** 項目の調査実施状況を取得 */
  const getItemSurveyStatus = useCallback((itemId: string): CategorySurveyStatus => {
    if (!inspectionData?.itemSurveyStatus?.[itemId]) {
      return { conducted: true };
    }
    return inspectionData.itemSurveyStatus[itemId];
  }, [inspectionData]);

  /** 項目の調査実施状況を更新 */
  const updateItemSurveyStatus = useCallback((itemId: string, status: CategorySurveyStatus) => {
    if (!inspectionData) return;
    const newData = {
      ...inspectionData,
      itemSurveyStatus: {
        ...inspectionData.itemSurveyStatus,
        [itemId]: status,
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData]);

  /** 項目に調査実施/不可の切り替えが必要かどうか */
  const needsItemSurveyToggle = useCallback((itemId: string): boolean => {
    return ITEMS_WITH_SURVEY_TOGGLE.includes(itemId);
  }, []);

  /** 項目が調査実施不可かどうか */
  const isItemDisabledBySurvey = useCallback((itemId: string): boolean => {
    if (!needsItemSurveyToggle(itemId)) return false;
    const status = getItemSurveyStatus(itemId);
    return !status.conducted;
  }, [getItemSurveyStatus, needsItemSurveyToggle]);

  // ─── グループ有無 ──────────────────────────────────

  /** グループの有無選択状態を取得 */
  const getGroupExistence = useCallback((groupId: string): GroupExistenceStatus | null => {
    return inspectionData?.groupExistence?.[groupId] || null;
  }, [inspectionData]);

  /** グループの有無選択状態を更新 */
  const updateGroupExistence = useCallback((groupId: string, exists: boolean) => {
    if (!inspectionData) return;
    const newData = {
      ...inspectionData,
      groupExistence: {
        ...inspectionData.groupExistence,
        [groupId]: { exists },
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData]);

  // ─── 項目オプション ──────────────────────────────────

  /** 項目オプション値を取得（例: 屋外階段の設置有無） */
  const getItemOption = useCallback((itemId: string, label: string): string | string[] | null => {
    return inspectionData?.options?.[itemId]?.[label] || null;
  }, [inspectionData]);

  /** 項目オプション値を更新 */
  const updateItemOption = useCallback((itemId: string, label: string, value: string | string[]) => {
    if (!inspectionData) return;
    const newData = {
      ...inspectionData,
      options: {
        ...inspectionData.options,
        [itemId]: {
          ...inspectionData.options?.[itemId],
          [label]: value,
        },
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData]);

  // ─── 無効化判定 ──────────────────────────────────

  /** グループの「無」選択により無効化されているかチェック */
  const isItemDisabledByGroupExistence = useCallback((item: InspectionItem): boolean => {
    if (!item.groupId) return false;
    // 基礎・外壁グループは有/無選択を廃止したため除外
    if (item.groupId === 'group_kiso' || item.groupId === 'group_gaiheki' || item.groupId === 'group_yane' || item.groupId === 'group_okujou') return false;
    const groupExistence = getGroupExistence(item.groupId);
    return groupExistence?.exists === false;
  }, [getGroupExistence]);

  /** オプション選択（屋外階段の設置有無）により無効化されているかチェック */
  const isItemDisabledByItemOption = useCallback((item: InspectionItem): boolean => {
    if (item.groupId !== 'group_okugai_kaidan') return false;
    const val = getItemOption('item72', '設置');
    return val === '該当無';
  }, [getItemOption]);

  // ─── 仕上げ材 ──────────────────────────────────

  /** 仕上げ材選択状態を取得 */
  const getFinishMaterials = useCallback((groupId: string): string[] => {
    return inspectionData?.finishMaterials?.[groupId] || [];
  }, [inspectionData]);

  /** 仕上げ材選択状態を更新 */
  const updateFinishMaterials = useCallback((groupId: string, materials: string[]) => {
    if (!inspectionData) return;
    const newData = {
      ...inspectionData,
      finishMaterials: {
        ...inspectionData.finishMaterials,
        [groupId]: materials,
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData]);

  /** 仕上げ材の未選択により無効化されているかチェック */
  const isItemDisabledByFinishMaterial = useCallback((item: InspectionItem): boolean => {
    if (!item.finishMaterialKey || !item.groupId) return false;
    const selected = getFinishMaterials(item.groupId);
    if (selected.length === 0) return false;
    return !selected.includes(item.finishMaterialKey);
  }, [getFinishMaterials]);

  /** 仕上げ材選択のトグル */
  const toggleFinishMaterial = useCallback((groupId: string, material: string) => {
    const current = getFinishMaterials(groupId);
    const updated = current.includes(material)
      ? current.filter(m => m !== material)
      : [...current, material];
    updateFinishMaterials(groupId, updated);
  }, [getFinishMaterials, updateFinishMaterials]);

  // ─── メンテナンス ──────────────────────────────────

  /** メンテナンス状況を取得 */
  const getMaintenanceStatus = useCallback((id: string): CategoryMaintenanceStatus => {
    return inspectionData?.maintenanceStatus?.[id] || { need: null, condition: null };
  }, [inspectionData]);

  /** メンテナンス状況を更新 */
  const updateMaintenanceStatus = useCallback((id: string, updates: Partial<CategoryMaintenanceStatus>) => {
    if (!inspectionData) return;
    const current = getMaintenanceStatus(id);
    const newData = {
      ...inspectionData,
      maintenanceStatus: {
        ...inspectionData.maintenanceStatus,
        [id]: { ...current, ...updates },
      },
    };
    setInspectionData(newData);
    saveInspectionData(newData);
  }, [inspectionData, getMaintenanceStatus]);

  // ─── 進捗計算 ──────────────────────────────────

  /** カテゴリの進捗を計算 */
  const getCategoryProgress = useCallback((category: InspectionCategory) => {
    if (!inspectionData) return { done: 0, total: category.items.length };
    if (isCategoryDisabled(category.id)) {
      return { done: 0, total: 0, skipped: true };
    }
    let done = 0;
    let total = 0;
    category.items.forEach(item => {
      if (isItemDisabledByGroupExistence(item)) return;
      if (isItemDisabledByFinishMaterial(item)) return;
      if (isItemDisabledBySurvey(item.id)) return;
      total++;
      const evals = inspectionData.evaluations[item.id];
      if (evals && evals.length > 0) done++;
    });
    return { done, total, skipped: false };
  }, [inspectionData, isCategoryDisabled, isItemDisabledByGroupExistence, isItemDisabledByFinishMaterial, isItemDisabledBySurvey]);

  /** 全体の進捗を計算 */
  const getTotalProgress = useCallback(() => {
    let done = 0;
    let total = 0;
    let skippedCategories = 0;
    inspectionMaster.forEach(cat => {
      const p = getCategoryProgress(cat);
      if (p.skipped) {
        skippedCategories++;
      } else {
        done += p.done;
        total += p.total;
      }
    });
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent, skippedCategories };
  }, [getCategoryProgress]);

  // ─── 評価ロジック ──────────────────────────────────

  /** 既存の標準評価から最も重度の評価を取得 */
  const getWorstEvaluation = useCallback((itemId: string): string | null => {
    if (!inspectionData) return null;
    const evals = inspectionData.evaluations[itemId];
    if (!evals || evals.length === 0) return null;
    let worstEval: string | null = null;
    let worstPriority = 0;
    for (const e of evals) {
      const priority = EVAL_PRIORITY[e.eval] || 0;
      if (priority > worstPriority) {
        worstPriority = priority;
        worstEval = e.eval;
      }
    }
    return worstEval;
  }, [inspectionData]);

  /** 最も重度の評価に基づいて無効化すべき評価のセットを返す */
  const getDisabledEvals = useCallback((itemId: string): Set<string> => {
    const worst = getWorstEvaluation(itemId);
    if (!worst) return new Set();
    const worstPriority = EVAL_PRIORITY[worst] || 0;
    const disabled = new Set<string>();
    for (const [evalKey, priority] of Object.entries(EVAL_PRIORITY)) {
      if (priority < worstPriority) {
        disabled.add(evalKey);
      }
    }
    return disabled;
  }, [getWorstEvaluation]);

  // ─── 評価操作 ──────────────────────────────────

  /** トースト表示 */
  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2000);
  };

  /** 評価を追加する */
  const handleAddEvaluation = (goToDefectCapture = false) => {
    if (!modalItemId || !inspectionData) return;
    const itemInfo = getItemById(modalItemId);
    if (!itemInfo) return;

    if (itemInfo.item.evalType !== 'freetext' && !selectedEval) return;

    if (itemInfo.item.evalType === 'standard' && selectedSurveyMethods.length === 0) {
      setSurveyMethodError(true);
      return;
    }

    const evalValue = itemInfo.item.evalType === 'freetext'
      ? 'freetext'
      : selectedEval as StandardEvaluation | ManagementEvaluation | LegalEvaluation;

    const newEval: InspectionEvaluation = {
      id: generateId(),
      eval: evalValue,
      memo: locationMemo,
      timestamp: Date.now(),
    };

    // 類似事象フラグ
    if (selectedEval === 'b2' || selectedEval === 'c') {
      const existingEvals = inspectionData.evaluations[modalItemId] || [];
      const hasExistingDefect = existingEvals.some(e => e.eval === 'b2' || e.eval === 'c');
      if (hasExistingDefect) {
        newEval.isSimilar = true;
      }
    }

    // 調査方法
    if (itemInfo.item.evalType === 'standard' && selectedSurveyMethods.length > 0) {
      newEval.surveyMethods = selectedSurveyMethods;
    }

    // 特殊入力
    if (itemInfo.item.evalType === 'legal' && selectedEval === 'concern') {
      newEval.concernDetail = concernDetail;
    }
    if (itemInfo.item.evalType === 'freetext') {
      newEval.freetextContent = freetextContent || '';
    }
    if (itemInfo.item.evalType === 'rebar' && rebarPitch) {
      newEval.rebarPitch = parseFloat(rebarPitch);
    }
    if (itemInfo.item.evalType === 'schmidt') {
      const values = schmidtValues.map(v => parseFloat(v) || 0).filter(v => v > 0);
      if (values.length > 0) {
        newEval.schmidtValues = values;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        newEval.schmidtResult = Math.round((1.27 * avg - 18) * 100) / 100;
      }
    }

    // シュミットハンマーの場合は既存の評価を更新（編集モード）
    let updatedEvaluations;
    if (itemInfo.item.evalType === 'schmidt') {
      const existingEvals = inspectionData.evaluations[modalItemId];
      if (existingEvals && existingEvals.length > 0) {
        updatedEvaluations = [{ ...existingEvals[0], ...newEval, id: existingEvals[0].id }];
      } else {
        updatedEvaluations = [newEval];
      }
    } else {
      updatedEvaluations = [...(inspectionData.evaluations[modalItemId] || []), newEval];
    }

    const newData = {
      ...inspectionData,
      evaluations: {
        ...inspectionData.evaluations,
        [modalItemId]: updatedEvaluations,
      },
    };

    setInspectionData(newData);
    saveInspectionData(newData);
    closeModal();

    // b2/cの場合、図面位置選択画面へ遷移
    if (goToDefectCapture && (selectedEval === 'b2' || selectedEval === 'c')) {
      navigate(`/properties/${propertyId}/select-position`, {
        state: {
          propertyId,
          inspectionItemId: modalItemId,
          inspectionItemName: itemInfo.item.name,
          evaluationId: newEval.id,
          evaluationType: selectedEval,
          isSimilar: newEval.isSimilar || false,
          returnPath: `/properties/${propertyId}/inspection-checklist`,
        },
      });
      toast(`${selectedEval === 'b2' ? '経年変化' : '不具合'}を追加 → 位置選択へ`);
    } else {
      toast('評価を追加しました');
    }
  };

  /** 評価を削除する */
  const handleRemoveEvaluation = (itemId: string, evalIndex: number) => {
    if (!inspectionData) return;
    const newEvals = [...(inspectionData.evaluations[itemId] || [])];
    newEvals.splice(evalIndex, 1);

    const newData = {
      ...inspectionData,
      evaluations: {
        ...inspectionData.evaluations,
        [itemId]: newEvals.length > 0 ? newEvals : undefined as any,
      },
    };
    if (newEvals.length === 0) delete newData.evaluations[itemId];

    setInspectionData(newData);
    saveInspectionData(newData);
    toast('削除しました');
  };

  // ─── モーダル ──────────────────────────────────

  /** モーダルを開く */
  const openModal = (itemId: string) => {
    setModalItemId(itemId);
    setSelectedEval(null);
    setLocationMemo('');
    setConcernDetail('');
    setFreetextContent('');
    setSelectedSurveyMethods([]);
    setSurveyMethodError(false);
    setRebarPitch('');

    // シュミットハンマーの場合は既存の値を読み込む
    const itemInfo = getItemById(itemId);
    if (itemInfo?.item.evalType === 'schmidt' && inspectionData) {
      const existingEvals = inspectionData.evaluations[itemId];
      if (existingEvals && existingEvals.length > 0 && existingEvals[0].schmidtValues) {
        const existingValues = existingEvals[0].schmidtValues;
        const values = Array(9).fill('').map((_, i) =>
          existingValues[i] !== undefined ? String(existingValues[i]) : ''
        );
        setSchmidtValues(values);
      } else {
        setSchmidtValues(Array(9).fill(''));
      }
    } else {
      setSchmidtValues(Array(9).fill(''));
    }
  };

  /** モーダルを閉じる */
  const closeModal = () => {
    setModalItemId(null);
    setSelectedEval(null);
    setSurveyMethodError(false);
  };

  // ─── ナビゲーション ──────────────────────────────

  /** 戻る */
  const handleBack = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate(-1);
    }
  };

  /** カテゴリへジャンプ */
  const jumpToCategory = (catId: string) => {
    if (isTablet) {
      setSelectedCategoryId(catId);
    } else {
      const el = document.getElementById(catId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── デバッグ機能 ──────────────────────────────────

  /** 全評価を一括でダミーデータ入力 */
  const handleDebugFillAll = async () => {
    if (!propertyId || !inspectionData || !DEBUG_MODE) return;

    setIsFillingDebug(true);
    try {
      const data = await loadData();
      const floors = data.floors.filter(f => f.propertyId === propertyId);
      const floorIds = floors.map(f => f.id);
      const blueprints = data.blueprints.filter((b: Blueprint) => floorIds.includes(b.floorId));

      if (blueprints.length === 0) {
        alert('デバッグ: 図面が登録されていません。先に図面を登録してください。');
        setIsFillingDebug(false);
        return;
      }

      let blueprintIndex = 0;
      const getNextBlueprint = (): Blueprint => {
        const bp = blueprints[blueprintIndex % blueprints.length];
        blueprintIndex++;
        return bp;
      };

      let newMarkers: Marker[] = [...data.markers];
      let newInspections: Inspection[] = [...data.inspections];
      let newDefects: DefectInfo[] = [...data.defects];
      const newEvaluations = { ...inspectionData.evaluations };

      let filledCount = 0;
      let defectCount = 0;

      // ─── 追加入力項目のダミーデータ生成 ───

      const newInspectionDataFields = { ...inspectionData };

      // 基礎グループ: 仕上材ランダム選択
      const kisoMaterials = ['コンクリート直仕上げ', 'モルタル仕上げ・その他塗り仕上げ', 'その他仕上げ'];
      const selectedKisoMaterials = kisoMaterials.filter(() => Math.random() > 0.5);
      if (selectedKisoMaterials.length > 0) {
        newInspectionDataFields.finishMaterials = {
          ...newInspectionDataFields.finishMaterials,
          group_kiso: selectedKisoMaterials
        };
      }

      // 外壁グループ: 構造種別と関連項目をランダム設定
      const gaihekiStructureTypes = ['木造', 'RC', '鉄骨'];
      const selectedStructure = gaihekiStructureTypes[Math.floor(Math.random() * 3)];

      const gaihekiOptions: { [key: string]: string | string[] } = {
        constructionType: selectedStructure
      };

      if (selectedStructure === '木造') {
        const wallTypeChoices = ['サイディング', 'モルタル', 'ALC', 'タイル', 'その他'];
        gaihekiOptions.wallTypes = wallTypeChoices.filter(() => Math.random() > 0.5).slice(0, 2);
        if ((gaihekiOptions.wallTypes as string[]).length === 0) gaihekiOptions.wallTypes = ['サイディング'];
        gaihekiOptions.pillarSize = ['105mm', '120mm', '150mm'][Math.floor(Math.random() * 3)];
        gaihekiOptions.wallMethod = ['通気構法', '直張り工法'][Math.floor(Math.random() * 2)];
      } else if (selectedStructure === 'RC') {
        const concreteFinishChoices = ['吹付タイル', 'タイル', 'モルタル', 'その他'];
        gaihekiOptions.concreteFinish = concreteFinishChoices.filter(() => Math.random() > 0.5).slice(0, 2);
        if ((gaihekiOptions.concreteFinish as string[]).length === 0) gaihekiOptions.concreteFinish = ['吹付タイル'];
      } else {
        const wallTypeChoices = ['ALC', 'サイディング', 'その他'];
        gaihekiOptions.wallTypes = wallTypeChoices.filter(() => Math.random() > 0.5).slice(0, 2);
        if ((gaihekiOptions.wallTypes as string[]).length === 0) gaihekiOptions.wallTypes = ['ALC'];
      }

      gaihekiOptions.eavesProjection = ['30cm', '45cm', '60cm', '90cm', '120cm', '無'][Math.floor(Math.random() * 6)];
      gaihekiOptions.soffit = ['30cm', '45cm', '60cm', '90cm', '無'][Math.floor(Math.random() * 5)];

      newInspectionDataFields.options = {
        ...newInspectionDataFields.options,
        group_gaiheki: gaihekiOptions
      };

      // 屋根グループ: 屋根仕様と撮影棒確認
      const yaneSpecs = ['化粧スレート', '粘土瓦', 'セメント瓦・コンクリート瓦', '金属板', 'アスファルトシングル', 'その他'];
      const poleCheckValue = Math.random() > 0.3 ? '実施可' : '実施不可';
      newInspectionDataFields.options = {
        ...newInspectionDataFields.options,
        group_yane: {
          roofSpec: yaneSpecs[Math.floor(Math.random() * yaneSpecs.length)],
          poleCheck: poleCheckValue,
          poleCheckReason: poleCheckValue === '実施不可' && Math.random() > 0.5 ? ['高所のため', '危険のため', 'その他'][Math.floor(Math.random() * 3)] as string : ''
        }
      };

      // 屋上グループ: 防水工法と確認方法
      const okujouMethods = ['アスファルト防水', 'シート防水', '塗膜防水', 'FRP防水', 'その他'];
      const okujouCheckMethods = ['目視', '撮影棒', '実施不可'];
      const selectedCheckMethod = okujouCheckMethods[Math.floor(Math.random() * 3)];

      newInspectionDataFields.options = {
        ...newInspectionDataFields.options,
        group_okujou: {
          waterproofMethod: okujouMethods[Math.floor(Math.random() * okujouMethods.length)],
          checkMethod: selectedCheckMethod,
          checkMethodReason: selectedCheckMethod === '実施不可' && Math.random() > 0.5 ? ['立入禁止', '高所のため', 'その他'][Math.floor(Math.random() * 3)] as string : ''
        }
      };

      // メンテナンス状況: 5つのグループにランダム設定
      const maintenanceIds = ['maint_cat1', 'maint_cat2', 'maint_cat3', 'maint_cat4', 'maint_cat5'];
      maintenanceIds.forEach(maintId => {
        const needRand = Math.random();
        const conditionRand = Math.random();
        newInspectionDataFields.maintenanceStatus = {
          ...newInspectionDataFields.maintenanceStatus,
          [maintId]: {
            need: needRand > 0.5 ? 'required' : 'not_required',
            condition: conditionRand > 0.5 ? 'good' : 'no_issue'
          }
        };
      });

      for (const category of inspectionMaster) {
        if (isCategoryDisabled(category.id)) continue;

        for (const item of category.items) {
          if (newEvaluations[item.id] && newEvaluations[item.id].length > 0) continue;
          if (isItemDisabledByGroupExistence(item)) continue;

          let evalValue: string;
          const surveyMethods: SurveyMethod[] = ['visual'];

          switch (item.evalType) {
            case 'standard': {
              const rand = Math.random();
              if (rand < 0.5) evalValue = 'a';
              else if (rand < 0.75) evalValue = 'b1';
              else if (rand < 0.9) evalValue = 'b2';
              else evalValue = 'c';
              break;
            }
            case 'management':
              evalValue = Math.random() < 0.7 ? 'A' : (Math.random() < 0.5 ? 'B' : 'C');
              break;
            case 'legal':
              evalValue = Math.random() < 0.9 ? 'none' : 'concern';
              break;
            case 'freetext':
              evalValue = 'freetext';
              break;
            case 'rebar':
              evalValue = 'a';
              break;
            case 'schmidt':
              evalValue = 'a';
              break;
            default:
              evalValue = 'a';
          }

          const newEval: InspectionEvaluation = {
            id: generateId(),
            eval: evalValue as any,
            memo: `[DEBUG] 自動入力`,
            timestamp: Date.now(),
          };

          if (item.evalType === 'standard') {
            newEval.surveyMethods = surveyMethods;
          }
          if (item.evalType === 'freetext') {
            newEval.freetextContent = Math.random() < 0.8 ? '' : '[DEBUG] 懸念事項あり';
          }

          if (evalValue === 'b2' || evalValue === 'c') {
            const targetBlueprint = getNextBlueprint();
            const posX = 20 + Math.random() * 60;
            const posY = 20 + Math.random() * 60;

            const newMarker: Marker = {
              id: generateId(),
              blueprintId: targetBlueprint.id,
              x: posX,
              y: posY,
              createdAt: new Date().toISOString(),
            };

            const newInspection: Inspection = {
              id: generateId(),
              markerId: newMarker.id,
              blueprintId: targetBlueprint.id,
              majorCategory: item.name,
              middleCategory: evalValue === 'c' ? '不具合' : '経年変化',
              minorCategory: '[DEBUG]',
              result: evalValue as 'b2' | 'c',
              createdAt: new Date().toISOString(),
            };

            newMarker.inspectionId = newInspection.id;

            const dummyImage = generateDummyDefectImage(item.num, item.name, evalValue);

            const newDefect: DefectInfo = {
              id: generateId(),
              inspectionId: newInspection.id,
              location: `[DEBUG] ${item.name}`,
              component: '[DEBUG] 自動生成',
              deterioration: evalValue === 'c' ? '[DEBUG] 不具合状況の説明' : '[DEBUG] 経年変化の説明',
              repairMethod: '[DEBUG] 補修方法の説明',
              imageData: dummyImage,
              inspectionItemId: item.id,
              evaluationType: evalValue,
              positionX: posX,
              positionY: posY,
              blueprintId: targetBlueprint.id,
              createdAt: new Date().toISOString(),
            };

            newMarkers.push(newMarker);
            newInspections.push(newInspection);
            newDefects.push(newDefect);
            newEval.hasPhoto = true;
            defectCount++;
          }

          newEvaluations[item.id] = [newEval];
          filledCount++;
        }
      }

      const updatedData = {
        ...data,
        markers: newMarkers,
        inspections: newInspections,
        defects: newDefects,
      };
      await saveData(updatedData);

      const newInspectionData = {
        ...newInspectionDataFields,
        evaluations: newEvaluations,
        updatedAt: new Date().toISOString(),
      };
      setInspectionData(newInspectionData);
      await saveInspectionData(newInspectionData);

      alert(`デバッグ: ${filledCount}項目を入力しました（不具合/経年変化: ${defectCount}件）`);
    } catch (error) {
      console.error('Debug fill failed:', error);
      alert('デバッグ入力に失敗しました: ' + error);
    } finally {
      setIsFillingDebug(false);
    }
  };

  /** 全評価をクリア */
  const handleDebugClearAll = async () => {
    if (!propertyId || !inspectionData || !DEBUG_MODE) return;

    if (!confirm('全ての評価データを削除しますか？（マーカー・不具合情報も削除されます）')) return;

    try {
      const data = await loadData();
      const floors = data.floors.filter(f => f.propertyId === propertyId);
      const floorIds = floors.map(f => f.id);
      const blueprintIds = data.blueprints
        .filter((b: Blueprint) => floorIds.includes(b.floorId))
        .map((b: Blueprint) => b.id);

      const updatedData = {
        ...data,
        markers: data.markers.filter((m: Marker) => !blueprintIds.includes(m.blueprintId)),
        inspections: data.inspections.filter((i: Inspection) => !blueprintIds.includes(i.blueprintId)),
        defects: data.defects.filter((d: DefectInfo) => !blueprintIds.includes(d.blueprintId || '')),
      };
      await saveData(updatedData);

      const newInspectionData = {
        ...inspectionData,
        evaluations: {},
        updatedAt: new Date().toISOString(),
      };
      setInspectionData(newInspectionData);
      await saveInspectionData(newInspectionData);

      alert('デバッグ: 全データをクリアしました');
    } catch (error) {
      console.error('Debug clear failed:', error);
      alert('クリアに失敗しました');
    }
  };

  // ─── 計算値 ──────────────────────────────────

  const currentCategory = selectedCategoryId
    ? inspectionMaster.find(c => c.id === selectedCategoryId)
    : undefined;
  const modalItem = modalItemId ? getItemById(modalItemId) : null;
  const isDefectEval = selectedEval === 'b2' || selectedEval === 'c';
  const isStandardMissingSurvey = modalItem?.item.evalType === 'standard' && selectedSurveyMethods.length === 0;

  // ─── Return ──────────────────────────────────

  return {
    inspectionData,
    selectedCategoryId,
    setSelectedCategoryId,
    modalItemId,
    selectedEval,
    setSelectedEval,
    locationMemo,
    setLocationMemo,
    concernDetail,
    setConcernDetail,
    freetextContent,
    setFreetextContent,
    selectedSurveyMethods,
    setSelectedSurveyMethods,
    rebarPitch,
    setRebarPitch,
    schmidtValues,
    setSchmidtValues,
    surveyMethodError,
    setSurveyMethodError,
    isTablet,
    showToast,
    contentRef,
    editingCategoryReason,
    setEditingCategoryReason,
    isFillingDebug,
    showDebugPanel,
    setShowDebugPanel,

    currentCategory,
    modalItem,
    isDefectEval,
    isStandardMissingSurvey,

    getCategorySurveyStatus,
    updateCategorySurveyStatus,
    needsSurveyToggle,
    isCategoryDisabled,

    getItemSurveyStatus,
    updateItemSurveyStatus,
    needsItemSurveyToggle,
    isItemDisabledBySurvey,

    getGroupExistence,
    updateGroupExistence,

    getItemOption,
    updateItemOption,

    isItemDisabledByGroupExistence,
    isItemDisabledByItemOption,
    isItemDisabledByFinishMaterial,

    getFinishMaterials,
    toggleFinishMaterial,

    getMaintenanceStatus,
    updateMaintenanceStatus,

    getCategoryProgress,
    getTotalProgress,

    getWorstEvaluation,
    getDisabledEvals,
    handleAddEvaluation,
    handleRemoveEvaluation,

    openModal,
    closeModal,

    handleBack,
    jumpToCategory,
    toast,

    handleDebugFillAll,
    handleDebugClearAll,
  };
}
