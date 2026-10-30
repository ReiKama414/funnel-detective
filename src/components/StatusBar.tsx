import React from 'react';
import { ShieldCheck, HardDrive } from 'lucide-react';
import { FunnelResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';

interface StatusBarProps {
  totalEventsCount: number;
  uniqueUsersCount: number;
  funnelResult?: FunnelResult;
  datasetName: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalEventsCount,
  uniqueUsersCount,
  funnelResult,
  datasetName,
}) => {
  const step0Count = funnelResult?.stepResults[0]?.userCount || 0;
  const completedCount = funnelResult?.totalCompletedUsers || 0;
  const overallCR = funnelResult?.overallConversionRate || 0;
  const medianTime = funnelResult?.overallTimeMetrics?.medianMs;
  const stepCount = funnelResult?.stepResults.length || 0;

  return (
    <footer className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left Stats: Events, Users, Funnel metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="text-zinc-400">事件總量:</span>
            <span className="font-mono font-semibold">{totalEventsCount.toLocaleString()} 筆</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">獨立用戶:</span>
            <span className="font-mono text-zinc-300 font-semibold">{uniqueUsersCount.toLocaleString()} 人</span>
          </div>

          {funnelResult && (
            <>
              <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
                <span className="text-zinc-400">漏斗通關:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {completedCount.toLocaleString()} / {step0Count.toLocaleString()} 人
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ({formatPercentage(overallCR)})
                </span>
              </div>

              {medianTime !== undefined && (
                <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
                  <span className="text-zinc-400">P50 耗時:</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {formatDuration(medianTime)}
                  </span>
                </div>
              )}

              <div className="hidden xl:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
                <span className="text-zinc-400">步驟:</span>
                <span className="font-mono text-zinc-300 font-semibold">{stepCount} 步</span>
              </div>
            </>
          )}

          <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <span>IndexedDB 已連線:</span>
            <span className="font-mono text-zinc-300 truncate max-w-[140px]">{datasetName}</span>
          </div>
        </div>

        {/* Right Status: Privacy Sandbox Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px] hidden sm:inline">
              本地 Sandbox 零傳輸 · 嚴格防重算
            </span>
            <span className="font-mono font-medium text-[10px] sm:hidden">
              本地沙盒
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
