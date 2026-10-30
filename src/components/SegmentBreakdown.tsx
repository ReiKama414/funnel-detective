import React from 'react';
import { Layers, Award } from 'lucide-react';
import { SegmentedFunnelResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';
import { EChartsSegmentComparison } from './echarts/EChartsSegmentComparison';

interface SegmentBreakdownProps {
  segmentedResult: SegmentedFunnelResult;
  onSelectProperty: (prop: string) => void;
  availableProperties: string[];
}

const SEGMENT_COLORS = [
  '#18181b',
  '#71717a',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
];

export const SegmentBreakdown: React.FC<SegmentBreakdownProps> = ({
  segmentedResult,
  onSelectProperty,
  availableProperties,
}) => {
  const { property, segments, overallResult } = segmentedResult;

  if (!property || segments.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 sm:p-10 text-center space-y-4">
        <Layers className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 m-0">尚未選擇分群屬性</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
            請選擇一個事件屬性（例如：裝置、國家、行銷管道或方案），即可檢視各客群的漏斗轉換差異。
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto pt-2">
          {availableProperties.map((p) => (
            <button
              key={p}
              onClick={() => onSelectProperty(p)}
              className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition"
            >
              依「{p}」分群
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Find best performing segment
  const sortedSegments = [...segments].sort(
    (a, b) => b.result.overallConversionRate - a.result.overallConversionRate
  );
  const bestSegment = sortedSegments[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Property Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-4 rounded-xl transition-colors">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            目前分群維度：<span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{property}</span>
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">({segments.length} 個分群)</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">切換分群：</span>
          <select
            value={property}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            {availableProperties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Best Segment Champion Card */}
      {bestSegment && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  表現最優客群
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {bestSegment.segmentValue}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0">
                總體轉換率達到{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatPercentage(bestSegment.result.overallConversionRate)}
                </strong>
                ，高出總體平均{' '}
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                  +
                  {formatPercentage(
                    bestSegment.result.overallConversionRate -
                      overallResult.overallConversionRate
                  )}
                </strong>
              </p>
            </div>
          </div>

          <div className="text-right self-end sm:self-center shrink-0">
            <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 block">中位完成時間</span>
            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatDuration(bestSegment.result.overallTimeMetrics?.medianMs)}
            </span>
          </div>
        </div>
      )}

      {/* Grouped Bar Chart via ECharts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 m-0">
            各步驟轉換率跨分群對比 (ECharts Grouped Bars)
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 m-0">
            對照不同客群從起點到各步驟的留存率差異 (%)
          </p>
        </div>

        <EChartsSegmentComparison segmentedResult={segmentedResult} />
      </div>

      {/* Detailed Segment Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
        <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 m-0">分群指標詳表</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-medium">
              <tr>
                <th className="px-3 sm:px-4 py-2.5">分群名稱 ({property})</th>
                <th className="px-3 sm:px-4 py-2.5">進入人數</th>
                <th className="px-3 sm:px-4 py-2.5">完成人數</th>
                <th className="px-3 sm:px-4 py-2.5">總體轉換率</th>
                <th className="px-3 sm:px-4 py-2.5">與平均差異</th>
                <th className="px-3 sm:px-4 py-2.5">中位耗時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
              {sortedSegments.map((seg, idx) => {
                const diff =
                  seg.result.overallConversionRate - overallResult.overallConversionRate;
                const isPositive = diff >= 0;

                return (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                    <td className="px-3 sm:px-4 py-2.5 font-semibold text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                      />
                      <span className="truncate">{seg.segmentValue}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {seg.result.stepResults[0]?.userCount.toLocaleString() || 0}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono">
                      {seg.result.totalCompletedUsers.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {formatPercentage(seg.result.overallConversionRate)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-mono">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-semibold ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatPercentage(diff)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono">
                      {formatDuration(seg.result.overallTimeMetrics?.medianMs)}
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
