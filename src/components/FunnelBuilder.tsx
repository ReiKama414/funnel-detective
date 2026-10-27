import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  Filter,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  ConversionWindow,
  DeduplicationMode,
  FilterOperator,
  FunnelConfig,
  FunnelStepDefinition,
  PropertyFilter,
  TimeUnit,
  WindowAnchorType,
} from '../types/funnel';

interface FunnelBuilderProps {
  config: FunnelConfig;
  onChange: (newConfig: FunnelConfig) => void;
  availableEvents: string[];
  availableProperties: string[];
}

export const FunnelBuilder: React.FC<FunnelBuilderProps> = ({
  config,
  onChange,
  availableEvents,
  availableProperties,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Update step
  const handleUpdateStep = (index: number, updated: Partial<FunnelStepDefinition>) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], ...updated };
    onChange({ ...config, steps: newSteps });
  };

  // Add step
  const handleAddStep = () => {
    const nextIdx = config.steps.length + 1;
    const defaultEvent =
      availableEvents.find((e) => !config.steps.some((s) => s.eventName === e)) ||
      availableEvents[0] ||
      '';
    const newStep: FunnelStepDefinition = {
      id: `step-${Date.now()}`,
      name: `步驟 ${nextIdx}`,
      eventName: defaultEvent,
      filters: [],
    };
    onChange({ ...config, steps: [...config.steps, newStep] });
  };

  // Remove step
  const handleRemoveStep = (index: number) => {
    if (config.steps.length <= 1) return;
    const newSteps = config.steps.filter((_, i) => i !== index);
    onChange({ ...config, steps: newSteps });
  };

  // Move step up / down
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.steps.length) return;
    const newSteps = [...config.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    onChange({ ...config, steps: newSteps });
  };

  // Add step filter
  const handleAddStepFilter = (stepIndex: number) => {
    const step = config.steps[stepIndex];
    const defaultProp = availableProperties[0] || 'device';
    const newFilter: PropertyFilter = {
      id: `filter-${Date.now()}`,
      property: defaultProp,
      operator: 'equals',
      value: '',
    };
    handleUpdateStep(stepIndex, { filters: [...step.filters, newFilter] });
  };

  // Update step filter
  const handleUpdateStepFilter = (
    stepIndex: number,
    filterIndex: number,
    updated: Partial<PropertyFilter>
  ) => {
    const step = config.steps[stepIndex];
    const newFilters = [...step.filters];
    newFilters[filterIndex] = { ...newFilters[filterIndex], ...updated };
    handleUpdateStep(stepIndex, { filters: newFilters });
  };

  // Remove step filter
  const handleRemoveStepFilter = (stepIndex: number, filterIndex: number) => {
    const step = config.steps[stepIndex];
    const newFilters = step.filters.filter((_, i) => i !== filterIndex);
    handleUpdateStep(stepIndex, { filters: newFilters });
  };

  // Window settings
  const handleWindowChange = (updated: Partial<ConversionWindow>) => {
    onChange({
      ...config,
      conversionWindow: { ...config.conversionWindow, ...updated },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 sm:space-y-5 transition-colors">
      {/* Funnel Title & Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            漏斗分析名稱
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            placeholder="例如：電商核心購買漏斗"
          />
        </div>

        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded border transition self-start sm:self-end shrink-0 ${
            showAdvancedSettings
              ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>時間窗與去重設定</span>
          {showAdvancedSettings ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Advanced Settings Drawer */}
      {showAdvancedSettings && (
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Conversion Window */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>轉換時間窗 (Window)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={config.conversionWindow.value}
                  onChange={(e) =>
                    handleWindowChange({ value: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={config.conversionWindow.unit}
                  onChange={(e) =>
                    handleWindowChange({ unit: e.target.value as TimeUnit })
                  }
                  className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="minutes">分鐘 (Minutes)</option>
                  <option value="hours">小時 (Hours)</option>
                  <option value="days">天 (Days)</option>
                </select>
              </div>
              <div className="pt-1">
                <select
                  value={config.conversionWindow.type}
                  onChange={(e) =>
                    handleWindowChange({ type: e.target.value as WindowAnchorType })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  <option value="from_first_step">以第 1 步起算全部總時間</option>
                  <option value="step_to_step">相鄰步驟間隔時間</option>
                </select>
              </div>
            </div>

            {/* Deduplication Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>去重與計算規則</span>
              </label>
              <select
                value={config.deduplicationMode}
                onChange={(e) =>
                  onChange({
                    ...config,
                    deduplicationMode: e.target.value as DeduplicationMode,
                  })
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="unique_user_first_touch">
                  首次觸發 (First Touch) - 嚴格去重防重算
                </option>
                <option value="unique_user_last_touch">
                  最佳路徑 (Best/Last Touch) - 取最深旅程
                </option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight m-0">
                每位獨立使用者在各步驟最多被計入 1 次，嚴格杜絕重複計算。
              </p>
            </div>

            {/* Breakdown Property */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>屬性分群條件 (Breakdown)</span>
              </label>
              <select
                value={config.breakdownProperty || ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    breakdownProperty: e.target.value || undefined,
                  })
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- 不進行分群 (全體分析) --</option>
                {availableProperties.map((prop) => (
                  <option key={prop} value={prop}>
                    依「{prop}」分群比較
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight m-0">
                將漏斗依指定維度拆解並進行多組並行比較。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ordered Steps Sequence */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <span>有序步驟 ({config.steps.length} 步)</span>
          </span>
          <button
            onClick={handleAddStep}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增步驟</span>
          </button>
        </div>

        <div className="space-y-2">
          {config.steps.map((step, idx) => (
            <div
              key={step.id}
              className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2.5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Step badge & Order */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {idx + 1}
                  </div>

                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleUpdateStep(idx, { name: e.target.value })}
                    placeholder={`步驟 ${idx + 1} 名稱`}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-full min-[380px]:w-36 sm:w-44 shrink-0"
                  />

                  <div className="flex items-center space-x-1 flex-1 min-w-[130px]">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">事件:</span>
                    <select
                      value={step.eventName}
                      onChange={(e) => handleUpdateStep(idx, { eventName: e.target.value })}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-indigo-500 w-full min-w-0 truncate"
                    >
                      {availableEvents.map((ev) => (
                        <option key={ev} value={ev}>
                          {ev}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step Actions: Add Filter, Move Up, Move Down, Delete */}
                <div className="flex items-center space-x-1 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleAddStepFilter(idx)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                    title="新增步驟過濾條件"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveStep(idx, 'up')}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded transition"
                    title="上移"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === config.steps.length - 1}
                    onClick={() => handleMoveStep(idx, 'down')}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded transition"
                    title="下移"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={config.steps.length <= 1}
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-30 rounded transition"
                    title="刪除步驟"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step Filters */}
              {step.filters.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                    步驟附加過濾條件：
                  </span>
                  <div className="space-y-1.5">
                    {step.filters.map((fil, fIdx) => (
                      <div key={fil.id} className="flex flex-wrap items-center gap-1.5 text-xs">
                        <select
                          value={fil.property}
                          onChange={(e) =>
                            handleUpdateStepFilter(idx, fIdx, { property: e.target.value })
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200 text-xs"
                        >
                          {availableProperties.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>

                        <select
                          value={fil.operator}
                          onChange={(e) =>
                            handleUpdateStepFilter(idx, fIdx, {
                              operator: e.target.value as FilterOperator,
                            })
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200 text-xs"
                        >
                          <option value="equals">等於 (=)</option>
                          <option value="not_equals">不等於 (≠)</option>
                          <option value="contains">包含 (contains)</option>
                          <option value="greater_than">大於 (&gt;)</option>
                          <option value="less_than">小於 (&lt;)</option>
                          <option value="in">包含於列表 (in)</option>
                        </select>

                        <input
                          type="text"
                          value={String(fil.value)}
                          onChange={(e) =>
                            handleUpdateStepFilter(idx, fIdx, { value: e.target.value })
                          }
                          placeholder="比對值"
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-slate-900 dark:text-slate-100 text-xs flex-1 min-w-[70px]"
                        />

                        <button
                          onClick={() => handleRemoveStepFilter(idx, fIdx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
