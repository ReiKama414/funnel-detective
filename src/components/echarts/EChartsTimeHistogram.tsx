import React from 'react';
import ReactECharts from 'echarts-for-react';
import { TimeDistributionBin, StepTimeMetrics } from '../../types/funnel';
import { useTheme } from '../../context/useTheme';

interface EChartsTimeHistogramProps {
  bins: TimeDistributionBin[];
  metrics?: StepTimeMetrics;
  completedCount?: number;
}

export const EChartsTimeHistogram: React.FC<EChartsTimeHistogramProps> = ({
  bins,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const xLabels = bins.map((b) => b.bucketLabel);
  const counts = bins.map((b) => b.count);

  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const labelColor = isDark ? '#e4e4e7' : '#18181b';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const splitLineColor = isDark ? '#18181b' : '#f4f4f5';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipText = isDark ? '#f4f4f5' : '#09090b';

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
        const b = bins[idx];
        return `
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;">
            <div style="font-weight: 700; color: ${tooltipText}; margin-bottom: 4px;">區間：${b.bucketLabel}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: ${textColor}; margin-right: 12px;">完成人數:</span>
              <span style="font-weight: 600; color: #4f46e5;">${b.count} 人</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: ${textColor}; margin-right: 12px;">佔比:</span>
              <span style="font-weight: 600; color: #059669;">${b.percentage.toFixed(1)}%</span>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '16%',
      top: '16%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        interval: 0,
        rotate: bins.length > 5 ? 25 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: borderColor } },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: '{value} 人',
      },
      // 20% margin on top so top labels never touch chart border
      max: (val: any) => {
        const peak = val.max || 0;
        return peak > 0 ? Math.ceil(peak * 1.2) : undefined;
      },
    },
    series: [
      {
        name: '人數',
        type: 'bar',
        barWidth: '40%',
        data: counts,
        itemStyle: {
          color: isDark ? '#e4e4e7' : '#18181b',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: labelColor,
          fontSize: 10,
          fontFamily: 'monospace',
          formatter: '{c} 人',
        },
      },
    ],
  };

  return (
    <div className="w-full overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: '280px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
