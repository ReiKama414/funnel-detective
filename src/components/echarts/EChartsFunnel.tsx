import React from 'react';
import ReactECharts from 'echarts-for-react';
import { FunnelResult } from '../../types/funnel';
import { formatDuration, formatPercentage } from '../../utils/time';

interface EChartsFunnelProps {
  funnel: FunnelResult;
  onSelectStep?: (stepIndex: number) => void;
}

export const EChartsFunnel: React.FC<EChartsFunnelProps> = ({ funnel, onSelectStep }) => {
  const steps = funnel.stepResults;
  const baseCount = steps[0]?.userCount || 1;

  // Prepare data for ECharts funnel or stage bars
  const stepNames = steps.map((s) => s.stepName);
  const userCounts = steps.map((s) => s.userCount);
  const conversionRates = steps.map((s) => Number(((s.conversionRateFromStart || 0) * 100).toFixed(1)));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
      },
      formatter: (params: any) => {
        if (!params || !params[0]) return '';
        const idx = params[0].dataIndex;
        const s = steps[idx];
        const isFirst = idx === 0;

        return `
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; min-width: 180px;">
            <div style="font-weight: 700; color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
              步驟 ${idx + 1}：${s.stepName}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">目標事件:</span>
              <span style="font-family: monospace; color: #67e8f9;">${s.eventName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">獨立使用者:</span>
              <span style="font-weight: 600; color: #f8fafc;">${s.userCount.toLocaleString()} 人</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">總體轉換率:</span>
              <span style="font-weight: 600; color: #818cf8;">${formatPercentage(s.conversionRateFromStart)}</span>
            </div>
            ${
              !isFirst
                ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">前步轉換率:</span>
              <span style="font-weight: 600; color: #34d399;">${formatPercentage(s.conversionRateFromPrev)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">此步流失人數:</span>
              <span style="font-weight: 600; color: #f87171;">${s.dropOffCount} 人 (${formatPercentage(s.dropOffRate)})</span>
            </div>
            ${
              s.stepTimeMetrics
                ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94a3b8;">中位推進耗時:</span>
              <span style="font-weight: 600; color: #fbbf24;">${formatDuration(s.stepTimeMetrics.medianMs)}</span>
            </div>
            `
                : ''
            }
            `
                : ''
            }
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '8%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value} 人',
      },
      max: baseCount > 0 ? Math.ceil(baseCount * 1.05) : undefined,
    },
    yAxis: {
      type: 'category',
      data: stepNames.slice().reverse(),
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    series: [
      {
        name: '獨立人數',
        type: 'bar',
        barWidth: 26,
        data: userCounts.slice().reverse().map((count, i) => {
          const originalIdx = steps.length - 1 - i;
          const isBottleneck = funnel.bottleneckStepIndex === originalIdx;
          return {
            value: count,
            itemStyle: {
              color: isBottleneck ? '#f43f5e' : '#6366f1',
              borderRadius: [0, 4, 4, 0],
            },
          };
        }),
        label: {
          show: true,
          position: 'right',
          color: '#e2e8f0',
          fontSize: 11,
          fontFamily: 'monospace',
          formatter: (params: any) => {
            const originalIdx = steps.length - 1 - params.dataIndex;
            const rate = conversionRates[originalIdx];
            return `${params.value.toLocaleString()} 人 (${rate}%)`;
          },
        },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (onSelectStep && params && typeof params.dataIndex === 'number') {
      const originalIdx = steps.length - 1 - params.dataIndex;
      onSelectStep(originalIdx);
    }
  };

  return (
    <div className="w-full">
      <ReactECharts
        option={option}
        style={{ height: `${Math.max(260, steps.length * 52)}px`, width: '100%' }}
        onEvents={{ click: onChartClick }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
