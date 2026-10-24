import React from 'react';
import { Layers, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { SegmentedFunnelResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';

interface SegmentBreakdownProps {
  segmentedResult: SegmentedFunnelResult;
  onSelectProperty: (prop: string) => void;
  availableProperties: string[];
}

const SEGMENT_COLORS = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
];

export const SegmentBreakdown: React.FC<SegmentBreakdownProps> = ({
  segmentedResult,
  onSelectProperty,
  availableProperties,
}) => {
  const { property, segments, overallResult } = segmentedResult;

  if (!property || segments.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
        <Layers className="w-10 h-10 text-slate-600 mx-auto" />
        <div>
          <h3 className="text-base font-semibold text-slate-200 m-0">尚未選擇分群屬性</h3>
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

  // Prepare chart data: For each step, show conversion rate across segments
  const steps = overallResult.stepResults;
  const chartData = steps.map((s, stepIdx) => {
    const row: Record<string, string | number> = {
      stepName: s.stepName,
    };
    segments.forEach((seg) => {
      const segStep = seg.result.stepResults[stepIdx];
      row[seg.segmentValue] = Number(((segStep?.conversionRateFromStart || 0) * 100).toFixed(1));
    });
    return row;
  });

  // Find best performing segment
  const sortedSegments = [...segments].sort(
    (a, b) => b.result.overallConversionRate - a.result.overallConversionRate
  );
  const bestSegment = sortedSegments[0];

  return (
    <div className="space-y-6">
      {/* Property Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">
            目前分群屬性：<span className="text-indigo-400 font-mono">{property}</span>
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
        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  表現最優群體
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {bestSegment.segmentValue}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 m-0">
                總體轉換率達到{' '}
                <strong className="text-emerald-400">
                  {formatPercentage(bestSegment.result.overallConversionRate)}
                </strong>
                ，高出總體平均{' '}
                <strong className="text-indigo-300">
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
            <span className="text-xs text-slate-400 block">中位完成時間</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              {formatDuration(bestSegment.result.overallTimeMetrics?.medianMs)}
            </span>
          </div>
        </div>
      )}

      {/* Grouped Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 m-0">
            各步驟轉換率跨分群對比 (%)
          </h3>
          <p className="text-xs text-slate-400 m-0">
            比較不同客群在從第 1 步到各步驟的留存率差異
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="stepName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-100 m-0">{label}</p>
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between space-x-3 text-[11px]"
                          >
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-mono font-semibold text-slate-200">
                              {entry.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {segments.map((seg, idx) => (
                <Bar
                  key={seg.segmentValue}
                  dataKey={seg.segmentValue}
                  fill={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Segment Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 m-0">分群指標詳表</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">分群名稱 ({property})</th>
                <th className="px-4 py-3">進入人數</th>
                <th className="px-4 py-3">完成人數</th>
                <th className="px-4 py-3">總體轉換率</th>
                <th className="px-4 py-3">與平均差異</th>
                <th className="px-4 py-3">中位耗時</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {sortedSegments.map((seg, idx) => {
                const diff =
                  seg.result.overallConversionRate - overallResult.overallConversionRate;
                const isPositive = diff >= 0;

                return (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="px-4 py-3 font-semibold text-slate-200 flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                      />
                      <span>{seg.segmentValue}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {seg.result.stepResults[0]?.userCount.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {seg.result.totalCompletedUsers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-100 font-mono">
                      {formatPercentage(seg.result.overallConversionRate)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatPercentage(diff)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
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
