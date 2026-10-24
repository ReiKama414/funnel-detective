import React from 'react';
import {
  Users,
  Clock,
  TrendingDown,
  UserX,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { FunnelResult, StepResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';

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

  if (steps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        請在上方新增至少一個漏斗步驟。
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-100 m-0">有序漏斗轉換與流失路徑</h2>
          <p className="text-xs text-slate-400 m-0">
            精確獨立用戶計量 • 點擊流失節點可直接調閱使用者清單並匯出名單
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span>通關轉化</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50" />
            <span>流失節點</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          const isBottleneck = funnel.bottleneckStepIndex === idx;
          // Calculate proportional width (at least 20% width for visibility)
          const ratioFromStart = baseCount > 0 ? step.userCount / baseCount : 0;
          const barWidthPercent = Math.max(22, ratioFromStart * 100);

          return (
            <React.Fragment key={step.stepId}>
              {/* Transition Drop-off connector before this step (for idx > 0) */}
              {!isFirst && (
                <div className="my-1 py-1 px-4 ml-6 sm:ml-10 border-l-2 border-dashed border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40 rounded-r-xl">
                  {/* Drop-off stats */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5 text-rose-400 font-medium">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>
                        流失 {step.dropOffCount} 人 ({formatPercentage(step.dropOffRate)})
                      </span>
                    </div>

                    {step.stepTimeMetrics && (
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>中位耗時：{formatDuration(step.stepTimeMetrics.medianMs)}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Drop-off inspection button */}
                  {step.dropOffCount > 0 && (
                    <button
                      onClick={() => onInspectCohort(step, 'dropped')}
                      className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium flex items-center space-x-1 transition"
                    >
                      <UserX className="w-3 h-3" />
                      <span>查看流失名單 ({step.dropOffCount})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Step Card & Visual Funnel Bar */}
              <div
                className={`p-4 rounded-xl border transition relative overflow-hidden ${
                  isBottleneck
                    ? 'bg-slate-950 border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Bottleneck Ribbon */}
                {isBottleneck && (
                  <div className="absolute top-0 right-0 bg-rose-500/20 border-b border-l border-rose-500/40 px-2.5 py-0.5 rounded-bl-lg text-[10px] font-bold text-rose-300 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>最大流失瓶頸</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  {/* Step Title & Event */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-100 m-0">
                          {step.stepName}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {step.eventName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {isFirst
                          ? '漏斗起點'
                          : `從前一步轉換率：${formatPercentage(step.conversionRateFromPrev)}`}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Badges & Cohort Inspect */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-1.5 justify-end">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-base font-bold text-slate-100">
                          {step.userCount.toLocaleString()} 人
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-indigo-400">
                        總體轉換率：{formatPercentage(step.conversionRateFromStart)}
                      </span>
                    </div>

                    <button
                      onClick={() => onInspectCohort(step, 'reached')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1 transition"
                      title="檢視抵達此步驟的使用者名單"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">名單</span>
                    </button>
                  </div>
                </div>

                {/* Funnel Gauge Bar */}
                <div className="w-full bg-slate-900 rounded-lg h-7 p-1 overflow-hidden relative border border-slate-800">
                  <div
                    className="h-full rounded bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 transition-all duration-700 flex items-center justify-end pr-2 text-[11px] font-bold text-white shadow-inner"
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
    </div>
  );
};
