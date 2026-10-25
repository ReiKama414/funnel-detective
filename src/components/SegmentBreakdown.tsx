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
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
];

export const SegmentBreakdown: React.FC<SegmentBreakdownProps> = ({
  segmentedResult,
  onSelectProperty,
  availableProperties,
}) => {
  const { property, segments, overallResult } = segmentedResult;

  if (!property || segments.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
        <Layers className="w-10 h-10 text-slate-600 mx-auto" />
        <div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">尚未選擇分群屬性</h3>
          <p className="text-xs text-slate-400 mt-1 m-0">
            請選擇一個事件屬性（例如：裝置、國家、行銷管道或方案），即可檢視各客群的漏斗轉換差異。
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto pt-2">
          {availableProperties.map((p) => (
            <button
              key={p}
              onClick={() => onSelectProperty(p)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 border border-slate-700 transition"
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
    <div className="space-y-5">
      {/* Property Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            目前分群維度：<span className="text-indigo-400 font-mono">{property}</span>
          </span>
          <span className="text-xs text-slate-500">({segments.length} 個分群)</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">切換分群：</span>
          <select
            value={property}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  表現最優客群
                </span>
                <span className="text-xs font-bold text-slate-100">
                  {bestSegment.segmentValue}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 m-0">
                總體轉換率達到{' '}
                <strong className="text-emerald-400 font-mono">
                  {formatPercentage(bestSegment.result.overallConversionRate)}
                </strong>
                ，高出總體平均{' '}
                <strong className="text-indigo-300 font-mono">
                  +
                  {formatPercentage(
                    bestSegment.result.overallConversionRate -
                      overallResult.overallConversionRate
                  )}
                </strong>
              </p>
            </div>
          </div>

          <div className="text-right self-end sm:self-center">
            <span className="text-[11px] text-slate-400 block">中位完成時間</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {formatDuration(bestSegment.result.overallTimeMetrics?.medianMs)}
            </span>
          </div>
        </div>
      )}

      {/* Grouped Bar Chart via ECharts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-100 m-0">
            各步驟轉換率跨分群對比 (ECharts Grouped Bars)
          </h3>
          <p className="text-xs text-slate-400 m-0">
            對照不同客群從起點到各步驟的留存率差異 (%)
          </p>
        </div>

        <EChartsSegmentComparison segmentedResult={segmentedResult} />
      </div>

      {/* Detailed Segment Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-100 m-0">分群指標詳表</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="px-4 py-2.5">分群名稱 ({property})</th>
                <th className="px-4 py-2.5">進入人數</th>
                <th className="px-4 py-2.5">完成人數</th>
                <th className="px-4 py-2.5">總體轉換率</th>
                <th className="px-4 py-2.5">與平均差異</th>
                <th className="px-4 py-2.5">中位耗時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {sortedSegments.map((seg, idx) => {
                const diff =
                  seg.result.overallConversionRate - overallResult.overallConversionRate;
                const isPositive = diff >= 0;

                return (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-200 flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                      />
                      <span>{seg.segmentValue}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono">
                      {seg.result.stepResults[0]?.userCount.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono">
                      {seg.result.totalCompletedUsers.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-100 font-mono">
                      {formatPercentage(seg.result.overallConversionRate)}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatPercentage(diff)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">
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
