import React from 'react';
import ReactECharts from 'echarts-for-react';
import { FunnelComparisonResult } from '../../types/funnel';

interface EChartsFunnelComparisonProps {
  comparison: FunnelComparisonResult;
}

export const EChartsFunnelComparison: React.FC<EChartsFunnelComparisonProps> = ({ comparison }) => {
  const { funnelA, funnelB, diffs } = comparison;
  const categories = diffs.map((d) => d.stepName);

  const series = [
    {
      name: funnelA.funnelName,
      type: 'bar',
      barGap: '20%',
      data: diffs.map((d) => Number((d.funnelAConversionRate * 100).toFixed(1))),
      itemStyle: {
        color: '#6366f1',
        borderRadius: [3, 3, 0, 0],
      },
    },
    {
      name: funnelB.funnelName,
      type: 'bar',
      data: diffs.map((d) => Number((d.funnelBConversionRate * 100).toFixed(1))),
      itemStyle: {
        color: '#06b6d4',
        borderRadius: [3, 3, 0, 0],
      },
    },
  ];

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
        const idx = params[0].dataIndex;
        const diff = diffs[idx];
        const isPos = diff.conversionRateDelta >= 0;

        let res = `<div style="font-weight:700;margin-bottom:4px;color:#f8fafc;">${params[0].axisValue}</div>`;
        for (const item of params) {
          res += `
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
              <span style="color:${item.color};">${item.seriesName}:</span>
              <span style="font-family:monospace;font-weight:600;color:#f8fafc;">${item.value}%</span>
            </div>
          `;
        }
        res += `
          <div style="border-top:1px solid #334155;margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;font-size:11px;">
            <span style="color:#94a3b8;">差異 (B - A):</span>
            <span style="font-family:monospace;font-weight:700;color:${isPos ? '#34d399' : '#f87171'};">
              ${isPos ? '+' : ''}${(diff.conversionRateDelta * 100).toFixed(1)}%
            </span>
          </div>
        `;
        return res;
      },
    },
    legend: {
      data: [funnelA.funnelName, funnelB.funnelName],
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
      <ReactECharts option={option} style={{ height: '280px', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
