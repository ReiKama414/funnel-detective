import React from 'react';
import ReactECharts from 'echarts-for-react';
import { FunnelComparisonResult } from '../../types/funnel';
import { useTheme } from '../../context/useTheme';

interface EChartsFunnelComparisonProps {
  comparison: FunnelComparisonResult;
}

export const EChartsFunnelComparison: React.FC<EChartsFunnelComparisonProps> = ({ comparison }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { funnelA, funnelB, diffs } = comparison;
  const categories = diffs.map((d) => d.stepName);

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const splitLineColor = isDark ? '#1e293b' : '#f1f5f9';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  const series = [
    {
      name: funnelA.funnelName,
      type: 'bar',
      barGap: '20%',
      data: diffs.map((d) => Number((d.funnelAConversionRate * 100).toFixed(1))),
      itemStyle: {
        color: '#4f46e5',
        borderRadius: [3, 3, 0, 0],
      },
    },
    {
      name: funnelB.funnelName,
      type: 'bar',
      data: diffs.map((d) => Number((d.funnelBConversionRate * 100).toFixed(1))),
      itemStyle: {
        color: '#0284c7',
        borderRadius: [3, 3, 0, 0],
      },
    },
  ];

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
        const idx = params[0].dataIndex;
        const diff = diffs[idx];
        const isPos = diff.conversionRateDelta >= 0;

        let res = `<div style="font-weight:700;margin-bottom:4px;color:${tooltipText};">${params[0].axisValue}</div>`;
        for (const item of params) {
          res += `
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
              <span style="color:${item.color};">${item.seriesName}:</span>
              <span style="font-family:monospace;font-weight:600;color:${tooltipText};">${item.value}%</span>
            </div>
          `;
        }
        res += `
          <div style="border-top:1px solid ${borderColor};margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;font-size:11px;">
            <span style="color:${textColor};">差異 (B - A):</span>
            <span style="font-family:monospace;font-weight:700;color:${isPos ? '#059669' : '#dc2626'};">
              ${isPos ? '+' : ''}${(diff.conversionRateDelta * 100).toFixed(1)}%
            </span>
          </div>
        `;
        return res;
      },
    },
    legend: {
      data: [funnelA.funnelName, funnelB.funnelName],
      textStyle: { color: textColor, fontSize: 11 },
      top: 0,
      icon: 'roundRect',
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '10%',
      top: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 },
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
      <ReactECharts option={option} style={{ height: '270px', width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  );
};
