import { FunnelComparisonDiff, FunnelComparisonResult, FunnelResult } from '../types/funnel';
import { formatPercentage, formatDuration } from '../utils/time';

export function compareFunnels(
  funnelA: FunnelResult,
  funnelB: FunnelResult
): FunnelComparisonResult {
  const maxSteps = Math.max(funnelA.stepResults.length, funnelB.stepResults.length);
  const diffs: FunnelComparisonDiff[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const stepA = funnelA.stepResults[i];
    const stepB = funnelB.stepResults[i];

    const stepName =
      stepA?.stepName || stepB?.stepName || `步驟 ${i + 1}`;
    const countA = stepA?.userCount ?? 0;
    const countB = stepB?.userCount ?? 0;
    const rateA = stepA?.conversionRateFromStart ?? 0;
    const rateB = stepB?.conversionRateFromStart ?? 0;

    const durA = stepA?.stepTimeMetrics?.medianMs;
    const durB = stepB?.stepTimeMetrics?.medianMs;

    let durDelta: number | undefined = undefined;
    if (durA !== undefined && durB !== undefined) {
      durDelta = durB - durA;
    }

    diffs.push({
      stepIndex: i,
      stepName,
      funnelAUserCount: countA,
      funnelBUserCount: countB,
      userCountDelta: countB - countA,
      funnelAConversionRate: rateA,
      funnelBConversionRate: rateB,
      conversionRateDelta: rateB - rateA,
      funnelAMedianDurationMs: durA,
      funnelBMedianDurationMs: durB,
      medianDurationDeltaMs: durDelta,
    });
  }

  const overallDelta = funnelB.overallConversionRate - funnelA.overallConversionRate;
  let overallDurationDeltaMs: number | undefined = undefined;
  if (
    funnelA.overallTimeMetrics?.medianMs !== undefined &&
    funnelB.overallTimeMetrics?.medianMs !== undefined
  ) {
    overallDurationDeltaMs =
      funnelB.overallTimeMetrics.medianMs - funnelA.overallTimeMetrics.medianMs;
  }

  // Generate automated comparative insight note
  let summaryNote = '';
  if (Math.abs(overallDelta) < 0.001) {
    summaryNote = `兩組漏斗總體轉換率相當（約 ${formatPercentage(funnelA.overallConversionRate)}）。`;
  } else if (overallDelta > 0) {
    summaryNote = `【${funnelB.funnelName}】總體轉換率高出 +${formatPercentage(overallDelta)}（${formatPercentage(funnelB.overallConversionRate)} vs ${formatPercentage(funnelA.overallConversionRate)}）。`;
  } else {
    summaryNote = `【${funnelA.funnelName}】總體轉換率高出 +${formatPercentage(-overallDelta)}（${formatPercentage(funnelA.overallConversionRate)} vs ${formatPercentage(funnelB.overallConversionRate)}）。`;
  }

  if (overallDurationDeltaMs !== undefined) {
    if (overallDurationDeltaMs < 0) {
      summaryNote += ` 且【${funnelB.funnelName}】轉換時間縮短了 ${formatDuration(-overallDurationDeltaMs)}。`;
    } else if (overallDurationDeltaMs > 0) {
      summaryNote += ` 但【${funnelB.funnelName}】完成耗時多了 ${formatDuration(overallDurationDeltaMs)}。`;
    }
  }

  return {
    funnelA,
    funnelB,
    diffs,
    overallConversionRateDelta: overallDelta,
    overallDurationDeltaMs,
    summaryNote,
  };
}
