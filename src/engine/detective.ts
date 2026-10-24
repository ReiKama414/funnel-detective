import { FunnelResult, SegmentedFunnelResult } from '../types/funnel';
import { formatDuration, formatPercentage } from '../utils/time';

export interface DetectiveInsight {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metricBadge?: string;
  recommendation?: string;
}

export function generateDetectiveReport(
  funnel: FunnelResult,
  segmentedResult?: SegmentedFunnelResult
): DetectiveInsight[] {
  const insights: DetectiveInsight[] = [];
  const steps = funnel.stepResults;

  if (steps.length <= 1) {
    return [
      {
        id: 'no-steps',
        type: 'info',
        title: '請設定至少 2 個步驟',
        description: '漏斗分析需要至少兩個有序步驟以計算轉換率與流失率。',
      },
    ];
  }

  // 1. Bottleneck Step: Highest drop-off rate
  let worstStepIdx = -1;
  let highestDropOff = -1;

  for (let i = 1; i < steps.length; i++) {
    const s = steps[i];
    if (s.dropOffRate > highestDropOff && steps[i - 1].userCount > 0) {
      highestDropOff = s.dropOffRate;
      worstStepIdx = i;
    }
  }

  if (worstStepIdx !== -1 && highestDropOff > 0) {
    const worstStep = steps[worstStepIdx];
    const prevStep = steps[worstStepIdx - 1];
    insights.push({
      id: 'biggest-bottleneck',
      type: highestDropOff > 0.5 ? 'danger' : 'warning',
      title: `最大流失瓶頸：步驟 ${worstStepIdx + 1}「${worstStep.stepName}」`,
      description: `從「${prevStep.stepName}」到「${worstStep.stepName}」之間流失了 ${worstStep.dropOffCount} 位使用者，流失率高達 ${formatPercentage(worstStep.dropOffRate)}。`,
      metricBadge: `流失率 ${formatPercentage(worstStep.dropOffRate)}`,
      recommendation: `建議檢查「${worstStep.stepName}」的載入效能、表單複雜度或是否有異常錯誤訊息，此處為轉化率最顯著的突破口。`,
    });
  }

  // 2. Slowest Transition Step: Longest median transition time
  let slowestStepIdx = -1;
  let longestMedianMs = -1;

  for (let i = 1; i < steps.length; i++) {
    const s = steps[i];
    const median = s.stepTimeMetrics?.medianMs;
    if (median !== undefined && median > longestMedianMs) {
      longestMedianMs = median;
      slowestStepIdx = i;
    }
  }

  if (slowestStepIdx !== -1 && longestMedianMs > 60000) {
    const slowStep = steps[slowestStepIdx];
    const prevStep = steps[slowestStepIdx - 1];
    insights.push({
      id: 'slowest-step',
      type: 'warning',
      title: `耗時最長推進步驟：到「${slowStep.stepName}」`,
      description: `使用者平均需花費 ${formatDuration(longestMedianMs)}（中位數）才從「${prevStep.stepName}」推進到此步驟。`,
      metricBadge: `中位數 ${formatDuration(longestMedianMs)}`,
      recommendation: `若此流程預期應在幾分鐘內完成，長停留時間通常代表使用者在猶豫、等待外部通知或卡在繁瑣輸入。可透過自動填入或推播提醒加速決策。`,
    });
  }

  // 3. Overall Funnel Performance
  if (funnel.overallConversionRate >= 0.3) {
    insights.push({
      id: 'healthy-funnel',
      type: 'success',
      title: '總體健康度優異',
      description: `全漏斗總體轉換率達到 ${formatPercentage(funnel.overallConversionRate)}，表現高於一般網路產品平均基準。`,
      metricBadge: `總轉換率 ${formatPercentage(funnel.overallConversionRate)}`,
    });
  } else if (funnel.overallConversionRate < 0.05 && steps[0].userCount > 50) {
    insights.push({
      id: 'critical-funnel',
      type: 'danger',
      title: '總體轉換率偏低警報',
      description: `全漏斗總體轉換率僅 ${formatPercentage(funnel.overallConversionRate)}（共 ${steps[0].userCount} 人進入，僅 ${funnel.totalCompletedUsers} 人完成）。`,
      metricBadge: `總轉換率 ${formatPercentage(funnel.overallConversionRate)}`,
      recommendation: '建議簡化流程步驟、縮短步驟間的必填要求，或評估部分非關鍵步驟改為可選。',
    });
  }

  // 4. Segment Breakdown Insights
  if (segmentedResult && segmentedResult.segments.length > 1) {
    const validSegments = segmentedResult.segments.filter(
      (s) => s.result.stepResults[0]?.userCount > 10
    );
    if (validSegments.length >= 2) {
      // Find highest and lowest conversion segment
      const sortedByConv = [...validSegments].sort(
        (a, b) => b.result.overallConversionRate - a.result.overallConversionRate
      );
      const best = sortedByConv[0];
      const worst = sortedByConv[sortedByConv.length - 1];
      const diff = best.result.overallConversionRate - worst.result.overallConversionRate;

      if (diff > 0.05) {
        insights.push({
          id: 'segment-disparity',
          type: 'info',
          title: `分群表現差異：${best.segmentValue} vs ${worst.segmentValue}`,
          description: `「${best.segmentValue}」總體轉換率為 ${formatPercentage(best.result.overallConversionRate)}，高於「${worst.segmentValue}」（${formatPercentage(worst.result.overallConversionRate)}）達 +${formatPercentage(diff)}。`,
          metricBadge: `差距 +${formatPercentage(diff)}`,
          recommendation: `針對「${worst.segmentValue}」族群體驗進行專項優化（例如針對行動裝置介面優化或特定國家載入延遲改善）。`,
        });
      }
    }
  }

  return insights;
}
