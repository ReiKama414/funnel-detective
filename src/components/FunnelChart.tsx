import React, { useState } from 'react';
import {
  Users,
  Clock,
  TrendingDown,
  UserX,
  UserCheck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { FunnelResult, StepResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';
import { EChartsFunnel } from './echarts/EChartsFunnel';

interface FunnelChartProps {
  funnel: FunnelResult;
  onInspectCohort: (step: StepResult, type: 'dropped' | 'reached') => void;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  funnel,
  onInspectCohort,
}) => {
  const steps = funnel.stepResults;
  const baseCount = steps[0]?.userCount || 1;
  const [viewMode, setViewMode] = useState<'both' | 'chart' | 'cards'>('both');

  if (steps.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
        請在上方新增至少一個漏斗步驟。
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 sm:space-y-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide m-0">
            有序漏斗轉換與流失路徑
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0">
            ECharts 圖表 • 獨立用戶計量 • 點擊流失節點調閱名單並匯出
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs self-start sm:self-center shrink-0">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2 py-0.5 rounded text-xs transition ${
              viewMode === 'both'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-2 py-0.5 rounded text-xs transition ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            圖表
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2 py-0.5 rounded text-xs transition ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            步驟
          </button>
        </div>
      </div>

      {/* ECharts Funnel Visualization */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 space-y-2">
          <div data-testid="echarts-funnel-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 pb-1">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>ECharts 階段留存量規</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                各步驟獨立留存人數與累計轉化率長條量規
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-center shrink-0">
              單位：人 (留存 %)
            </span>
          </div>
          <div data-testid="echarts-funnel-chart">
            <EChartsFunnel funnel={funnel} />
          </div>
        </div>
      )}

      {/* Step by Step Breakdown Cards */}
      {(viewMode === 'both' || viewMode === 'cards') && (
        <div className="space-y-3 pt-1">
          {steps.map((step, idx) => {
            const isFirst = idx === 0;
            const isBottleneck = funnel.bottleneckStepIndex === idx;
            const ratioFromStart = baseCount > 0 ? step.userCount / baseCount : 0;
            const barWidthPercent = Math.max(18, ratioFromStart * 100);

            return (
              <React.Fragment key={step.stepId}>
                {/* Transition Drop-off connector before this step (for idx > 0) */}
                {!isFirst && (
                  <div className="my-1 py-1 px-3 sm:px-4 ml-4 sm:ml-8 border-l-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-r-lg">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-medium">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          流失 {step.dropOffCount} 人 ({formatPercentage(step.dropOffRate)})
                        </span>
                      </div>

                      {step.stepTimeMetrics && (
                        <div className="hidden sm:flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>中位耗時：{formatDuration(step.stepTimeMetrics.medianMs)}</span>
                        </div>
                      )}
                    </div>

                    {step.dropOffCount > 0 && (
                      <button
                        onClick={() => onInspectCohort(step, 'dropped')}
                        className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] font-medium flex items-center space-x-1 transition"
                      >
                        <UserX className="w-3 h-3" />
                        <span>查看流失名單 ({step.dropOffCount})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Step Card */}
                <div
                  className={`p-3 sm:p-3.5 rounded-lg border transition ${
                    isBottleneck
                      ? 'bg-white dark:bg-slate-950 border-rose-300 dark:border-rose-500/50 shadow-xs'
                      : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-start sm:items-center space-x-2 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words m-0">
                            {step.stepName}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            {step.eventName}
                          </span>
                          {isBottleneck && (
                            <span className="bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-1.5 py-0.2 rounded text-[10px] font-bold text-rose-600 dark:text-rose-300 flex items-center space-x-1 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>最大流失瓶頸</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {isFirst
                            ? '漏斗起點'
                            : `前步轉換率：${formatPercentage(step.conversionRateFromPrev)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 justify-end">
                          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {step.userCount.toLocaleString()} 人
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                          總體轉換：{formatPercentage(step.conversionRateFromStart)}
                        </span>
                      </div>

                      <button
                        onClick={() => onInspectCohort(step, 'reached')}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center space-x-1 transition"
                        title="檢視抵達名單"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>名單</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar gauge */}
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded h-3.5 sm:h-4 overflow-hidden relative border border-slate-200 dark:border-slate-800">
                    <div
                      className="h-full rounded-r bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 flex items-center justify-end pr-1.5 text-[9px] sm:text-[10px] font-mono font-bold text-white"
                      style={{ width: `${barWidthPercent}%` }}
                    >
                      <span>{formatPercentage(step.conversionRateFromStart)}</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
