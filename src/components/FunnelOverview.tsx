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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 1. Total Entered */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">進入漏斗人數</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-slate-100 tracking-tight m-0">
            {step0Count.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500">
            佔整體資料 {funnel.totalUniqueUsersInput > 0 ? formatPercentage(step0Count / funnel.totalUniqueUsersInput) : '0%'}
          </span>
        </div>
      </div>

      {/* 2. Completed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">完整通關人數</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-emerald-400 tracking-tight m-0">
            {completedCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500">
            全程 {funnel.stepResults.length} 個步驟無流失
          </span>
        </div>
      </div>

      {/* 3. Overall Conversion Rate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">總體轉換率</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-cyan-400 tracking-tight m-0">
            {formatPercentage(conversionRate)}
          </p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, conversionRate * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Median Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">中位數轉換耗時</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-slate-100 tracking-tight m-0">
            {formatDuration(medianTime)}
          </p>
          <span className="text-[11px] text-slate-500">
            P50 通關完成速度
          </span>
        </div>
      </div>

      {/* 5. Biggest Bottleneck */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">最大流失瓶頸</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          {bottleneckStep ? (
            <>
              <p className="text-sm font-bold text-rose-400 truncate m-0">
                {bottleneckStep.stepName}
              </p>
              <span className="text-[11px] text-rose-300/80">
                流失率 {formatPercentage(bottleneckStep.dropOffRate)} ({bottleneckStep.dropOffCount} 人)
              </span>
            </>
          ) : (
            <p className="text-xs text-slate-400 m-0">無顯著流失瓶頸</p>
          )}
        </div>
      </div>
    </div>
  );
};
