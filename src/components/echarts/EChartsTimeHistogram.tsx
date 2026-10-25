import React from 'react';
import ReactECharts from 'echarts-for-react';
import { TimeDistributionBin, StepTimeMetrics } from '../../types/funnel';

interface EChartsTimeHistogramProps {
  bins: TimeDistributionBin[];
  metrics?: StepTimeMetrics;
  completedCount?: number;
}

export const EChartsTimeHistogram: React.FC<EChartsTimeHistogramProps> = ({
  bins,
}) => {
  const xLabels = bins.map((b) => b.bucketLabel);
  const counts = bins.map((b) => b.count);

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
        const b = bins[idx];
        return `
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;">
            <div style="font-weight: 700; color: #f8fafc; margin-bottom: 4px;">區間：${b.bucketLabel}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94a3b8; margin-right: 12px;">完成人數:</span>
              <span style="font-weight: 600; color: #818cf8;">${b.count} 人</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94a3b8; margin-right: 12px;">佔比:</span>
              <span style="font-weight: 600; color: #34d399;">${b.percentage.toFixed(1)}%</span>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        interval: 0,
        rotate: bins.length > 5 ? 20 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value} 人',
      },
    },
    series: [
      {
        name: '人數',
        type: 'bar',
        barWidth: '40%',
        data: counts,
        itemStyle: {
          color: '#6366f1',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#cbd5e1',
          fontSize: 11,
          fontFamily: 'monospace',
          formatter: '{c} 人',
        },
      },
    ],
  };

  return (
    <div className="w-full">
      <ReactECharts
        option={option}
        style={{ height: '290px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
