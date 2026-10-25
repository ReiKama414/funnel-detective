import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SegmentedFunnelResult } from '../../types/funnel';

interface EChartsSegmentComparisonProps {
  segmentedResult: SegmentedFunnelResult;
}

const SEGMENT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const EChartsSegmentComparison: React.FC<EChartsSegmentComparisonProps> = ({
  segmentedResult,
}) => {
  const { segments, overallResult } = segmentedResult;
  const steps = overallResult.stepResults;

  const categories = steps.map((s) => s.stepName);

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
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: any) => {
        if (!params || !params[0]) return '';
        let res = `<div style="font-weight:700;margin-bottom:4px;color:#f8fafc;">${params[0].axisValue}</div>`;
        for (const item of params) {
          res += `
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
              <span style="color:${item.color};">${item.seriesName}:</span>
              <span style="font-family:monospace;font-weight:600;color:#f8fafc;">${item.value}%</span>
            </div>
          `;
        }
        return res;
      },
    },
    legend: {
      data: segments.map((s) => s.segmentValue),
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
      icon: 'roundRect',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value}%',
      },
      max: 100,
    },
    series,
  };

  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height: '300px', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
