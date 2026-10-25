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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        請在上方新增至少一個漏斗步驟。
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide m-0">
            有序漏斗轉換與流失路徑
          </h2>
          <p className="text-xs text-slate-400 m-0">
            ECharts 視覺圖表 • 獨立用戶去重計量 • 點擊流失節點調閱名單並匯出
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'both' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全部顯示
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'chart' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            僅 ECharts 圖表
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'cards' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            僅步驟細節
          </button>
        </div>
      </div>

      {/* ECharts Funnel Visualization */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>ECharts 階段轉換率量規</span>
            </span>
            <span className="text-[11px] text-slate-500">單位：人 (相對於第 1 步留存 %)</span>
          </div>
          <EChartsFunnel funnel={funnel} />
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
                  <div className="my-1 py-1 px-4 ml-6 sm:ml-10 border-l-2 border-dashed border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40 rounded-r-xl">
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

                {/* Step Card */}
                <div
                  className={`p-3.5 rounded-xl border transition relative overflow-hidden ${
                    isBottleneck
                      ? 'bg-slate-950 border-rose-500/50 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isBottleneck && (
                    <div className="absolute top-0 right-0 bg-rose-500/20 border-b border-l border-rose-500/30 px-2 py-0.5 rounded-bl text-[10px] font-bold text-rose-300 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>最大流失瓶頸</span>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs font-bold text-slate-100 m-0">
                            {step.stepName}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {step.eventName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isFirst
                            ? '漏斗起點'
                            : `前步轉換率：${formatPercentage(step.conversionRateFromPrev)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 justify-end">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-sm font-bold text-slate-100 font-mono">
                            {step.userCount.toLocaleString()} 人
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-indigo-400">
                          總體轉換：{formatPercentage(step.conversionRateFromStart)}
                        </span>
                      </div>

                      <button
                        onClick={() => onInspectCohort(step, 'reached')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1 transition"
                        title="檢視抵達名單"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">名單</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar gauge */}
                  <div className="w-full bg-slate-900 rounded h-4 overflow-hidden relative border border-slate-800">
                    <div
                      className="h-full rounded-r bg-indigo-600 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-white"
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
