import React from 'react';
import {
  Clock,
  BarChart2,
  Hourglass,
} from 'lucide-react';
import { FunnelResult } from '../types/funnel';
import { formatDuration } from '../utils/time';
import { EChartsTimeHistogram } from './echarts/EChartsTimeHistogram';

interface TimeDistributionProps {
  funnel: FunnelResult;
}

export const TimeDistribution: React.FC<TimeDistributionProps> = ({ funnel }) => {
  const overallMetrics = funnel.overallTimeMetrics;
  const bins = funnel.overallTimeBins || [];
  const steps = funnel.stepResults;

  // Prepare step-by-step transition times for comparison
  const stepDurationsData = steps
    .slice(1)
    .map((s, idx) => ({
      name: `${steps[idx].stepName} → ${s.stepName}`,
      medianMs: s.stepTimeMetrics?.medianMs || 0,
      meanMs: s.stepTimeMetrics?.meanMs || 0,
      formattedMedian: formatDuration(s.stepTimeMetrics?.medianMs),
      formattedMean: formatDuration(s.stepTimeMetrics?.meanMs),
    }))
    .filter((d) => d.medianMs > 0);

  if (!overallMetrics || bins.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
        <Clock className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0">尚無足夠的完整完成時間數據</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto m-0">
          當有使用者完整通過此漏斗的所有有序步驟時，系統將在此呈現精確的分位數與 ECharts 時間直方圖。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Quantile / Percentile Summary Cards */}
      <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">最快完成 (Min)</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatDuration(overallMetrics.minMs)}
          </span>
        </div>

        <div className="bg-indigo-50/50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/40 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block mb-1 break-words">中位數 (P50)</span>
          <span className="text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
            {formatDuration(overallMetrics.medianMs)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">平均耗時 (Mean)</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {formatDuration(overallMetrics.meanMs)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">P75 分位數</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {formatDuration(overallMetrics.p75Ms)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">P90 分位數</span>
          <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
            {formatDuration(overallMetrics.p90Ms)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">P95 分位數</span>
          <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
            {formatDuration(overallMetrics.p95Ms)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center flex flex-col justify-between min-h-[64px]">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mb-1 break-words">最慢完成 (Max)</span>
          <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatDuration(overallMetrics.maxMs)}
          </span>
        </div>
      </div>

      {/* 2. Completion Time Histogram via ECharts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <div data-testid="echarts-histo-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center space-x-2 m-0">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>全漏斗完成時間分佈直方圖 (ECharts Histogram)</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0">
              各耗時區間內的完成人數分佈，直觀辨識快速決策群體與長尾猶豫群體
            </p>
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-center shrink-0">
            有效樣本數：{funnel.totalCompletedUsers} 人
          </span>
        </div>

        <div data-testid="echarts-histo-chart">
          <EChartsTimeHistogram
            bins={bins}
            metrics={overallMetrics}
            completedCount={funnel.totalCompletedUsers}
          />
        </div>
      </div>

      {/* 3. Step-by-Step Transition Duration */}
      {stepDurationsData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center space-x-2 m-0">
              <Hourglass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>步驟間轉換耗時對比 (Step Transition Durations)</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0">
              檢視使用者在各步驟間的停留中位數，精確鎖定卡關與猶豫瓶頸
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stepDurationsData.map((trans, i) => (
              <div
                key={i}
                className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-start space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="break-words min-w-0 flex-1">{trans.name}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">中位停留：</span>
                  <span className="text-xs sm:text-sm font-bold text-cyan-700 dark:text-cyan-400 font-mono">
                    {trans.formattedMedian}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">平均停留：</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                    {trans.formattedMean}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
