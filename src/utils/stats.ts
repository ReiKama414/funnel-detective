import { StepTimeMetrics, TimeDistributionBin } from '../types/funnel';

/**
 * Calculates quantile value using linear interpolation
 */
export function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  if (p <= 0) return sortedValues[0];
  if (p >= 1) return sortedValues[sortedValues.length - 1];

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Computes time metrics (median, mean, p75, p90, p95, min, max) for an array of durations (ms)
 */
export function computeStepTimeMetrics(durationsMs: number[]): StepTimeMetrics | undefined {
  if (durationsMs.length === 0) return undefined;

  const valid = durationsMs.filter((v) => !isNaN(v) && v >= 0);
  if (valid.length === 0) return undefined;

  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    medianMs: calculatePercentile(sorted, 0.5),
    meanMs: Math.round(sum / sorted.length),
    p75Ms: calculatePercentile(sorted, 0.75),
    p90Ms: calculatePercentile(sorted, 0.9),
    p95Ms: calculatePercentile(sorted, 0.95),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
  };
}

/**
 * Generates intuitive time distribution histogram bins
 */
export function computeTimeDistributionBins(durationsMs: number[]): TimeDistributionBin[] {
  if (durationsMs.length === 0) return [];

  const valid = durationsMs.filter((v) => !isNaN(v) && v >= 0);
  if (valid.length === 0) return [];

  // Default intuitive time bins
  const binDefinitions: { label: string; minMs: number; maxMs: number }[] = [
    { label: '< 1 分鐘', minMs: 0, maxMs: 60 * 1000 },
    { label: '1 - 5 分鐘', minMs: 60 * 1000, maxMs: 5 * 60 * 1000 },
    { label: '5 - 15 分鐘', minMs: 5 * 60 * 1000, maxMs: 15 * 60 * 1000 },
    { label: '15 - 30 分鐘', minMs: 15 * 60 * 1000, maxMs: 30 * 60 * 1000 },
    { label: '30 分鐘 - 1 小時', minMs: 30 * 60 * 1000, maxMs: 60 * 60 * 1000 },
    { label: '1 - 4 小時', minMs: 60 * 60 * 1000, maxMs: 4 * 60 * 60 * 1000 },
    { label: '4 - 12 小時', minMs: 4 * 60 * 60 * 1000, maxMs: 12 * 60 * 60 * 1000 },
    { label: '12 - 24 小時', minMs: 12 * 60 * 60 * 1000, maxMs: 24 * 60 * 60 * 1000 },
    { label: '1 - 3 天', minMs: 24 * 60 * 60 * 1000, maxMs: 3 * 24 * 60 * 60 * 1000 },
    { label: '> 3 天', minMs: 3 * 24 * 60 * 60 * 1000, maxMs: Infinity },
  ];

  const counts = new Array(binDefinitions.length).fill(0);

  for (const dur of valid) {
    let placed = false;
    for (let i = 0; i < binDefinitions.length; i++) {
      const def = binDefinitions[i];
      if (dur >= def.minMs && (i === binDefinitions.length - 1 ? dur <= def.maxMs : dur < def.maxMs)) {
        counts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      counts[counts.length - 1]++;
    }
  }

  // Filter out trailing empty bins to make chart tight, but keep active range
  const total = valid.length;
  const result: TimeDistributionBin[] = [];

  let firstNonZero = counts.findIndex((c) => c > 0);
  if (firstNonZero === -1) firstNonZero = 0;
  let lastNonZero = -1;
  for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i] > 0) {
      lastNonZero = i;
      break;
    }
  }
  if (lastNonZero === -1) lastNonZero = binDefinitions.length - 1;

  for (let i = firstNonZero; i <= lastNonZero; i++) {
    result.push({
      bucketLabel: binDefinitions[i].label,
      minMs: binDefinitions[i].minMs,
      maxMs: binDefinitions[i].maxMs,
      count: counts[i],
      percentage: total > 0 ? (counts[i] / total) * 100 : 0,
    });
  }

  return result;
}
