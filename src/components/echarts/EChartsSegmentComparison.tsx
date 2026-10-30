import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SegmentedFunnelResult } from '../../types/funnel';
import { useTheme } from '../../context/useTheme';

interface EChartsSegmentComparisonProps {
  segmentedResult: SegmentedFunnelResult;
}

const SEGMENT_COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#db2777', '#7c3aed'];

export const EChartsSegmentComparison: React.FC<EChartsSegmentComparisonProps> = ({
  segmentedResult,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { segments, overallResult } = segmentedResult;
  const steps = overallResult.stepResults;

  const categories = steps.map((s) => s.stepName);

  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const splitLineColor = isDark ? '#18181b' : '#f4f4f5';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipText = isDark ? '#f4f4f5' : '#09090b';

  const series = segments.map((seg, idx) => ({
    name: seg.segmentValue,
    type: 'bar',
    barGap: '15%',
    data: steps.map((_, sIdx) => {
      const segStep = seg.result.stepResults[sIdx];
      return Number(((segStep?.conversionRateFromStart || 0) * 100).toFixed(1));
    }),
    itemStyle: {
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
      borderRadius: [3, 3, 0, 0],
    },
  }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tooltipBg,
      borderColor: borderColor,
      borderWidth: 1,
      textStyle: { color: tooltipText, fontSize: 12 },
      formatter: (params: any) => {
        if (!params || !params[0]) return '';
        let res = `<div style="font-weight:700;margin-bottom:4px;color:${tooltipText};">${params[0].axisValue}</div>`;
        for (const item of params) {
          res += `
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
              <span style="color:${item.color};">${item.seriesName}:</span>
              <span style="font-family:monospace;font-weight:600;color:${tooltipText};">${item.value}%</span>
            </div>
          `;
        }
        return res;
      },
    },
    legend: {
      type: 'scroll',
      data: segments.map((s) => s.segmentValue),
      textStyle: { color: textColor, fontSize: 11 },
      top: 0,
      icon: 'roundRect',
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '12%',
      top: 42,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        interval: 0,
        rotate: categories.length > 3 ? 15 : 0,
        width: 80,
        overflow: 'truncate',
        ellipsis: '...',
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: borderColor } },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: '{value}%',
      },
      max: 100,
    },
    series,
  };

  return (
    <div className="w-full overflow-hidden">
      <ReactECharts option={option} style={{ height: '290px', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
