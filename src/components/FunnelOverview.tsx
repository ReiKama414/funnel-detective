import React from 'react';
import {
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import { FunnelResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';

interface FunnelOverviewProps {
  funnel: FunnelResult;
}

export const FunnelOverview: React.FC<FunnelOverviewProps> = ({ funnel }) => {
  const step0Count = funnel.stepResults[0]?.userCount || 0;
  const completedCount = funnel.totalCompletedUsers;
  const conversionRate = funnel.overallConversionRate;
  const medianTime = funnel.overallTimeMetrics?.medianMs;

  const bottleneckStep =
    funnel.bottleneckStepIndex !== undefined
      ? funnel.stepResults[funnel.bottleneckStepIndex]
      : undefined;

  return (
    <div data-testid="funnel-overview" className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      {/* 1. Total Entered */}
      <div data-testid="kpi-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-h-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words min-w-0">
            進入漏斗人數
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight m-0">
            {step0Count.toLocaleString()}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 break-words block mt-0.5">
            佔整體 {funnel.totalUniqueUsersInput > 0 ? formatPercentage(step0Count / funnel.totalUniqueUsersInput) : '0%'}
          </span>
        </div>
      </div>

      {/* 2. Completed */}
      <div data-testid="kpi-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-h-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words min-w-0">
            完整通關人數
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight m-0">
            {completedCount.toLocaleString()}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 break-words block mt-0.5">
            全程 {funnel.stepResults.length} 步無流失
          </span>
        </div>
      </div>

      {/* 3. Overall Conversion Rate */}
      <div data-testid="kpi-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-h-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words min-w-0">
            總體轉換率
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tracking-tight m-0">
            {formatPercentage(conversionRate)}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, conversionRate * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Median Time */}
      <div data-testid="kpi-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-h-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words min-w-0">
            中位數轉換耗時
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight m-0">
            {formatDuration(medianTime)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 break-words block mt-0.5">
            P50 通關完成速度
          </span>
        </div>
      </div>

      {/* 5. Biggest Bottleneck */}
      <div data-testid="kpi-card" className="col-span-1 min-[480px]:col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-h-[90px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words min-w-0">
            最大流失瓶頸
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2">
          {bottleneckStep ? (
            <>
              <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 break-words m-0">
                {bottleneckStep.stepName}
              </p>
              <span className="text-[10px] sm:text-[11px] text-rose-600/80 dark:text-rose-300/80 break-words block mt-0.5 font-mono">
                流失率 {formatPercentage(bottleneckStep.dropOffRate)} ({bottleneckStep.dropOffCount} 人)
              </span>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">無顯著流失瓶頸</p>
          )}
        </div>
      </div>
    </div>
  );
};
