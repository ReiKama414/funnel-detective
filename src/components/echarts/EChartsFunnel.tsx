import React from 'react';
import ReactECharts from 'echarts-for-react';
import { FunnelResult } from '../../types/funnel';
import { formatDuration, formatPercentage } from '../../utils/time';
import { useTheme } from '../../context/useTheme';

interface EChartsFunnelProps {
  funnel: FunnelResult;
  onSelectStep?: (stepIndex: number) => void;
}

export const EChartsFunnel: React.FC<EChartsFunnelProps> = ({ funnel, onSelectStep }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const steps = funnel.stepResults;
  const baseCount = steps[0]?.userCount || 1;

  const stepNames = steps.map((s) => s.stepName);
  const userCounts = steps.map((s) => s.userCount);
  const conversionRates = steps.map((s) => Number(((s.conversionRateFromStart || 0) * 100).toFixed(1)));

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const labelColor = isDark ? '#cbd5e1' : '#1e293b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const splitLineColor = isDark ? '#1e293b' : '#f1f5f9';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: tooltipBg,
      borderColor: borderColor,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
        fontSize: 12,
      },
      formatter: (params: any) => {
        if (!params || !params[0]) return '';
        const idx = params[0].dataIndex;
        const s = steps[idx];
        const isFirst = idx === 0;

        return `
          <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; min-width: 180px;">
            <div style="font-weight: 700; color: ${tooltipText}; border-bottom: 1px solid ${borderColor}; padding-bottom: 4px; margin-bottom: 6px;">
              步驟 ${idx + 1}：${s.stepName}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: ${textColor};">目標事件:</span>
              <span style="font-family: monospace; color: #0284c7;">${s.eventName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: ${textColor};">獨立使用者:</span>
              <span style="font-weight: 600; color: ${tooltipText};">${s.userCount.toLocaleString()} 人</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: ${textColor};">總體轉換率:</span>
              <span style="font-weight: 600; color: #4f46e5;">${formatPercentage(s.conversionRateFromStart)}</span>
            </div>
            ${
              !isFirst
                ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: ${textColor};">前步轉換率:</span>
              <span style="font-weight: 600; color: #059669;">${formatPercentage(s.conversionRateFromPrev)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
              <span style="color: ${textColor};">此步流失人數:</span>
              <span style="font-weight: 600; color: #dc2626;">${s.dropOffCount} 人 (${formatPercentage(s.dropOffRate)})</span>
            </div>
            ${
              s.stepTimeMetrics
                ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: ${textColor};">中位推進耗時:</span>
              <span style="font-weight: 600; color: #d97706;">${formatDuration(s.stepTimeMetrics.medianMs)}</span>
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
      left: '2%',
      right: '4%',
      bottom: '8%',
      top: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: borderColor } },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: '{value} 人',
      },
      // Give 35% margin on the right so the right-positioned labels never clip or overflow
      max: (val: any) => {
        const peak = Math.max(val.max || 0, baseCount);
        return peak > 0 ? Math.ceil(peak * 1.35) : undefined;
      },
    },
    yAxis: {
      type: 'category',
      data: stepNames.slice().reverse(),
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: {
        color: labelColor,
        fontSize: 11,
        fontWeight: 500,
        width: 100,
        overflow: 'truncate',
        ellipsis: '...',
      },
    },
    series: [
      {
        name: '獨立人數',
        type: 'bar',
        barWidth: 24,
        data: userCounts.slice().reverse().map((count, i) => {
          const originalIdx = steps.length - 1 - i;
          const isBottleneck = funnel.bottleneckStepIndex === originalIdx;
          return {
            value: count,
            itemStyle: {
              color: isBottleneck ? '#e11d48' : '#4f46e5',
              borderRadius: [0, 4, 4, 0],
            },
          };
        }),
        label: {
          show: true,
          position: 'right',
          color: labelColor,
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
    <div className="w-full overflow-hidden">
      <ReactECharts
        option={option}
        style={{ height: `${Math.max(260, steps.length * 52)}px`, width: '100%' }}
        onEvents={{ click: onChartClick }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};
