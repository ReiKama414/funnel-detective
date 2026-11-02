import React, { useState } from 'react';
import {
  GitCompare,
  Sparkles,
} from 'lucide-react';
import { FunnelConfig, FunnelResult, RawEvent } from '../types/funnel';
import { calculateFunnel } from '../engine/funnelEngine';
import { compareFunnels } from '../engine/comparator';
import { formatDuration, formatPercentage } from '../utils/time';
import { EChartsFunnelComparison } from './echarts/EChartsFunnelComparison';

interface FunnelComparisonProps {
  currentFunnel: FunnelResult;
  allEvents: RawEvent[];
}

export const FunnelComparison: React.FC<FunnelComparisonProps> = ({
  currentFunnel,
  allEvents,
}) => {
  const [comparisonType, setComparisonType] = useState<
    'window_variant' | 'device_variant' | 'dedup_variant'
  >('window_variant');

  // The device scenario only makes sense when the dataset actually has a `device` property
  const hasDeviceProperty = React.useMemo(
    () => allEvents.some((e) => e.properties && 'device' in e.properties),
    [allEvents]
  );
  const effectiveComparisonType =
    comparisonType === 'device_variant' && !hasDeviceProperty ? 'window_variant' : comparisonType;

  // Build Funnel B configuration based on comparison type
  const funnelBConfig: FunnelConfig = React.useMemo(() => {
    const base = { ...currentFunnel.config };

    if (effectiveComparisonType === 'window_variant') {
      const currentVal = base.conversionWindow.value;
      const isHours = base.conversionWindow.unit === 'hours';
      const newVal = isHours && currentVal <= 24 ? 7 : 24;
      const newUnit = isHours && currentVal <= 24 ? 'days' : 'hours';

      return {
        ...base,
        id: 'funnel-b-window',
        name: `${base.name} (${newVal} ${newUnit === 'days' ? '天' : '小時'}窗口)`,
        conversionWindow: {
          ...base.conversionWindow,
          value: newVal,
          unit: newUnit,
        },
      };
    } else if (effectiveComparisonType === 'device_variant') {
      return {
        ...base,
        id: 'funnel-b-device',
        name: `${base.name} (限行動裝置 Mobile)`,
        globalFilters: [
          ...base.globalFilters,
          { id: 'f-mobile', property: 'device', operator: 'contains', value: 'Mobile' },
        ],
      };
    } else {
      return {
        ...base,
        id: 'funnel-b-dedup',
        name: `${base.name} (最佳/最近路徑 Last Touch)`,
        deduplicationMode: 'unique_user_last_touch',
      };
    }
  }, [currentFunnel.config, effectiveComparisonType]);

  const funnelB = React.useMemo(() => {
    return calculateFunnel(allEvents, funnelBConfig);
  }, [allEvents, funnelBConfig]);

  const comparison = React.useMemo(() => {
    return compareFunnels(currentFunnel, funnelB);
  }, [currentFunnel, funnelB]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Selector of Comparison Modes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 flex items-center space-x-2 m-0">
              <GitCompare className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>多漏斗平行對比 (Funnel Comparison)</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 m-0">
              對比不同時間窗、客群篩選條件或去重規則下的轉換表現與流失差異
            </p>
          </div>

          <div className="flex items-center space-x-2 min-w-0 sm:shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">對比情境：</span>
            <select
              value={effectiveComparisonType}
              onChange={(e) =>
                setComparisonType(
                  e.target.value as 'window_variant' | 'device_variant' | 'dedup_variant'
                )
              }
              className="min-w-0 flex-1 sm:flex-none max-w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500 font-medium"
            >
              <option value="window_variant">不同轉換時間窗 (長短窗口對比)</option>
              <option value="device_variant" disabled={!hasDeviceProperty}>
                裝置群組篩選 (全體 vs 行動裝置){hasDeviceProperty ? '' : '：資料無 device 屬性'}
              </option>
              <option value="dedup_variant">去重規則 (首次觸發 vs 最佳路徑)</option>
            </select>
          </div>
        </div>

        {/* Funnel A vs Funnel B Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Funnel A Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                基準漏斗 A
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                窗口: {currentFunnel.config.conversionWindow.value} {currentFunnel.config.conversionWindow.unit}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words m-0">
              {currentFunnel.funnelName}
            </h3>
            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">總轉換率</span>
                <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatPercentage(currentFunnel.overallConversionRate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">完成人數</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                  {currentFunnel.totalCompletedUsers} 人
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">中位耗時</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                  {formatDuration(currentFunnel.overallTimeMetrics?.medianMs)}
                </span>
              </div>
            </div>
          </div>

          {/* Funnel B Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                對比漏斗 B
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                窗口: {funnelB.config.conversionWindow.value} {funnelB.config.conversionWindow.unit}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words m-0">
              {funnelB.funnelName}
            </h3>
            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">總轉換率</span>
                <span className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  {formatPercentage(funnelB.overallConversionRate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">完成人數</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                  {funnelB.totalCompletedUsers} 人
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">中位耗時</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                  {formatDuration(funnelB.overallTimeMetrics?.medianMs)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Natural Language Comparative Insight */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed m-0">
            {comparison.summaryNote}
          </p>
        </div>
      </div>

      {/* Comparison Chart via ECharts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 m-0">
            步驟轉換率平行對比 (ECharts Bars)
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 m-0">各步驟相對於起點的總體留存率對照 (%)</p>
        </div>

        <EChartsFunnelComparison comparison={comparison} />
      </div>

      {/* Side-by-side Diffs Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
        <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 m-0">步驟指標差異詳表</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs min-w-[540px]">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-medium">
              <tr>
                <th className="px-3 sm:px-4 py-2.5">步驟名稱</th>
                <th className="px-3 sm:px-4 py-2.5">漏斗 A 人數</th>
                <th className="px-3 sm:px-4 py-2.5">漏斗 B 人數</th>
                <th className="px-3 sm:px-4 py-2.5">人數差異 (B - A)</th>
                <th className="px-3 sm:px-4 py-2.5">漏斗 A 轉換率</th>
                <th className="px-3 sm:px-4 py-2.5">漏斗 B 轉換率</th>
                <th className="px-3 sm:px-4 py-2.5">轉換率差值 (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {comparison.diffs.map((diff) => {
                const isPosRate = diff.conversionRateDelta >= 0;
                return (
                  <tr key={diff.stepIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                    <td className="px-3 sm:px-4 py-2.5 font-semibold text-zinc-800 dark:text-zinc-200">
                      {diff.stepName}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {diff.funnelAUserCount.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {diff.funnelBUserCount.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-mono">
                      <span
                        className={
                          diff.userCountDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {diff.userCountDelta >= 0 ? '+' : ''}
                        {diff.userCountDelta}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {formatPercentage(diff.funnelAConversionRate)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {formatPercentage(diff.funnelBConversionRate)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-mono">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-semibold ${
                          isPosRate
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        {isPosRate ? '+' : ''}
                        {formatPercentage(diff.conversionRateDelta)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
