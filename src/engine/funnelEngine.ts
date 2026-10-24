import {
  ConversionWindow,
  FunnelConfig,
  FunnelResult,
  FunnelStepDefinition,
  PropertyFilter,
  RawEvent,
  SegmentedFunnelResult,
  StepResult,
} from '../types/funnel';
import { computeStepTimeMetrics, computeTimeDistributionBins } from '../utils/stats';
import { timeUnitToMs } from '../utils/time';

/**
 * Evaluates whether an event satisfies a given property filter
 */
export function evaluateFilter(
  properties: Record<string, string | number | boolean>,
  filter: PropertyFilter
): boolean {
  const propVal = properties[filter.property];

  if (filter.operator === 'exists') {
    return propVal !== undefined && propVal !== null && propVal !== '';
  }

  if (propVal === undefined || propVal === null) {
    return false;
  }

  const propStr = String(propVal).toLowerCase().trim();
  const targetStr = String(filter.value).toLowerCase().trim();

  switch (filter.operator) {
    case 'equals':
      if (typeof propVal === 'number' && !isNaN(Number(filter.value))) {
        return propVal === Number(filter.value);
      }
      return propStr === targetStr;

    case 'not_equals':
      if (typeof propVal === 'number' && !isNaN(Number(filter.value))) {
        return propVal !== Number(filter.value);
      }
      return propStr !== targetStr;

    case 'contains':
      return propStr.includes(targetStr);

    case 'not_contains':
      return !propStr.includes(targetStr);

    case 'greater_than': {
      const numProp = Number(propVal);
      const numTarget = Number(filter.value);
      return !isNaN(numProp) && !isNaN(numTarget) && numProp > numTarget;
    }

    case 'less_than': {
      const numProp = Number(propVal);
      const numTarget = Number(filter.value);
      return !isNaN(numProp) && !isNaN(numTarget) && numProp < numTarget;
    }

    case 'in': {
      const targets = targetStr.split(',').map((t) => t.trim());
      return targets.includes(propStr);
    }

    default:
      return true;
  }
}

/**
 * Evaluates whether an event satisfies all filters in an array
 */
export function matchesAllFilters(
  properties: Record<string, string | number | boolean>,
  filters: PropertyFilter[]
): boolean {
  if (!filters || filters.length === 0) return true;
  return filters.every((f) => evaluateFilter(properties, f));
}

/**
 * Checks if an event matches a step definition
 */
export function matchesStep(event: RawEvent, step: FunnelStepDefinition): boolean {
  if (event.eventName.trim().toLowerCase() !== step.eventName.trim().toLowerCase()) {
    return false;
  }
  return matchesAllFilters(event.properties, step.filters);
}

interface UserFunnelJourney {
  userId: string;
  stepsCompleted: number; // 0 up to K
  stepTimestamps: number[]; // timestamp for each completed step [t0, t1, ...]
}

/**
 * Computes a single user's funnel progression strictly avoiding duplicate counting.
 * Guarantees that each user produces at most one journey result.
 */
function computeUserJourney(
  userId: string,
  userEvents: RawEvent[],
  steps: FunnelStepDefinition[],
  window: ConversionWindow,
  mode: 'unique_user_first_touch' | 'unique_user_last_touch' | 'all_completed_journeys'
): UserFunnelJourney | null {
  if (steps.length === 0 || userEvents.length === 0) return null;

  const windowMs = timeUnitToMs(window.value, window.unit);

  // Helper to trace progression starting from a specific Step 0 candidate event
  const traceFromStep0 = (step0Index: number): UserFunnelJourney => {
    const step0Event = userEvents[step0Index];
    const timestamps = [step0Event.timestamp];
    let currentStepIdx = 1;
    let lastEventIdx = step0Index;

    while (currentStepIdx < steps.length) {
      const targetStep = steps[currentStepIdx];
      let matchedIdx = -1;

      for (let i = lastEventIdx + 1; i < userEvents.length; i++) {
        const ev = userEvents[i];

        // Strict chronological order check
        if (ev.timestamp < timestamps[currentStepIdx - 1]) {
          continue;
        }

        // Conversion window check
        const timeDiff =
          window.type === 'from_first_step'
            ? ev.timestamp - timestamps[0]
            : ev.timestamp - timestamps[currentStepIdx - 1];

        if (timeDiff > windowMs) {
          // Beyond window, stop searching for this step
          break;
        }

        if (matchesStep(ev, targetStep)) {
          matchedIdx = i;
          break;
        }
      }

      if (matchedIdx !== -1) {
        timestamps.push(userEvents[matchedIdx].timestamp);
        lastEventIdx = matchedIdx;
        currentStepIdx++;
      } else {
        // Dropped off
        break;
      }
    }

    return {
      userId,
      stepsCompleted: timestamps.length,
      stepTimestamps: timestamps,
    };
  };

  // Find all indices of events matching Step 0
  const step0Indices: number[] = [];
  for (let i = 0; i < userEvents.length; i++) {
    if (matchesStep(userEvents[i], steps[0])) {
      step0Indices.push(i);
    }
  }

  if (step0Indices.length === 0) {
    return null; // Did not enter Step 0
  }

  if (mode === 'unique_user_first_touch') {
    // Take the very first time the user entered Step 0
    return traceFromStep0(step0Indices[0]);
  } else if (mode === 'unique_user_last_touch') {
    // Choose the journey that achieved the highest progression, breaking ties with latest
    let bestJourney: UserFunnelJourney | null = null;
    for (let i = step0Indices.length - 1; i >= 0; i--) {
      const journey = traceFromStep0(step0Indices[i]);
      if (!bestJourney || journey.stepsCompleted > bestJourney.stepsCompleted) {
        bestJourney = journey;
        if (journey.stepsCompleted === steps.length) break; // Maximum progression achieved
      }
    }
    return bestJourney;
  } else {
    // Default fallback to first touch
    return traceFromStep0(step0Indices[0]);
  }
}

/**
 * Computes the complete funnel analysis strictly avoiding duplicate counting.
 */
export function calculateFunnel(events: RawEvent[], config: FunnelConfig): FunnelResult {
  const { steps, conversionWindow, deduplicationMode, globalFilters, dateRange } = config;

  if (steps.length === 0) {
    return {
      funnelId: config.id,
      funnelName: config.name,
      config,
      totalUniqueUsersInput: 0,
      stepResults: [],
      overallConversionRate: 0,
      totalCompletedUsers: 0,
      calculatedAt: new Date().toISOString(),
    };
  }

  // 1. Filter events by date range and global filters
  const filteredEvents = events.filter((ev) => {
    if (dateRange?.startMs !== undefined && ev.timestamp < dateRange.startMs) return false;
    if (dateRange?.endMs !== undefined && ev.timestamp > dateRange.endMs) return false;
    if (globalFilters && globalFilters.length > 0) {
      if (!matchesAllFilters(ev.properties, globalFilters)) return false;
    }
    return true;
  });

  // Group events by user_id and sort each user's timeline ascending
  const userEventsMap = new Map<string, RawEvent[]>();
  for (const ev of filteredEvents) {
    let list = userEventsMap.get(ev.userId);
    if (!list) {
      list = [];
      userEventsMap.set(ev.userId, list);
    }
    list.push(ev);
  }

  for (const list of userEventsMap.values()) {
    list.sort((a, b) => a.timestamp - b.timestamp);
  }

  const totalUniqueUsersInput = userEventsMap.size;

  // 2. Track unique users at each step
  // Each step maintains an exact Set of user IDs to strictly guarantee zero duplicates.
  const stepUsersSets: Set<string>[] = steps.map(() => new Set<string>());
  const stepDurationsFromPrev: number[][] = steps.map(() => []);
  const stepDurationsFromStart: number[][] = steps.map(() => []);
  const overallCompletedDurations: number[] = [];

  for (const [userId, uEvents] of userEventsMap.entries()) {
    const journey = computeUserJourney(
      userId,
      uEvents,
      steps,
      conversionWindow,
      deduplicationMode
    );

    if (!journey || journey.stepsCompleted === 0) {
      continue;
    }

    // Record user progress
    for (let s = 0; s < journey.stepsCompleted; s++) {
      stepUsersSets[s].add(userId);

      if (s > 0) {
        const stepDuration = journey.stepTimestamps[s] - journey.stepTimestamps[s - 1];
        stepDurationsFromPrev[s].push(stepDuration);

        const totalDuration = journey.stepTimestamps[s] - journey.stepTimestamps[0];
        stepDurationsFromStart[s].push(totalDuration);
      }
    }

    if (journey.stepsCompleted === steps.length) {
      const fullDuration =
        journey.stepTimestamps[steps.length - 1] - journey.stepTimestamps[0];
      overallCompletedDurations.push(fullDuration);
    }
  }

  // 3. Construct StepResult objects
  const stepResults: StepResult[] = [];
  const baseCount = stepUsersSets[0].size;
  let maxDropOffRate = -1;
  let bottleneckStepIndex: number | undefined = undefined;

  for (let i = 0; i < steps.length; i++) {
    const currentCount = stepUsersSets[i].size;
    const prevCount = i === 0 ? currentCount : stepUsersSets[i - 1].size;

    const conversionRateFromPrev = prevCount > 0 ? currentCount / prevCount : 0;
    const conversionRateFromStart = baseCount > 0 ? currentCount / baseCount : 0;
    const dropOffCount = prevCount - currentCount;
    const dropOffRate = prevCount > 0 ? dropOffCount / prevCount : 0;

    // Users dropped off between step i-1 and step i
    const usersDropped: string[] = [];
    if (i > 0) {
      const prevSet = stepUsersSets[i - 1];
      const currSet = stepUsersSets[i];
      for (const uid of prevSet) {
        if (!currSet.has(uid)) {
          usersDropped.push(uid);
        }
      }
    }

    // Check bottleneck
    if (i > 0 && dropOffRate > maxDropOffRate && prevCount > 0) {
      maxDropOffRate = dropOffRate;
      bottleneckStepIndex = i;
    }

    const stepTimeMetrics =
      i > 0 ? computeStepTimeMetrics(stepDurationsFromPrev[i]) : undefined;
    const totalTimeMetrics =
      i > 0 ? computeStepTimeMetrics(stepDurationsFromStart[i]) : undefined;
    const stepTimeBins =
      i > 0 ? computeTimeDistributionBins(stepDurationsFromPrev[i]) : undefined;

    stepResults.push({
      stepIndex: i,
      stepId: steps[i].id,
      stepName: steps[i].name || `步驟 ${i + 1}`,
      eventName: steps[i].eventName,
      userCount: currentCount,
      conversionRateFromPrev,
      conversionRateFromStart,
      dropOffCount,
      dropOffRate,
      usersReached: Array.from(stepUsersSets[i]),
      usersDropped,
      stepTimeMetrics,
      totalTimeMetrics,
      stepTimeBins,
    });
  }

  const finalCount = steps.length > 0 ? stepUsersSets[steps.length - 1].size : 0;
  const overallConversionRate = baseCount > 0 ? finalCount / baseCount : 0;
  const overallTimeMetrics = computeStepTimeMetrics(overallCompletedDurations);
  const overallTimeBins = computeTimeDistributionBins(overallCompletedDurations);

  return {
    funnelId: config.id,
    funnelName: config.name,
    config,
    totalUniqueUsersInput,
    stepResults,
    overallConversionRate,
    totalCompletedUsers: finalCount,
    overallTimeMetrics,
    overallTimeBins,
    calculatedAt: new Date().toISOString(),
    bottleneckStepIndex,
  };
}

/**
 * Computes segmented funnels by grouping users based on a breakdown property
 */
export function calculateSegmentedFunnel(
  events: RawEvent[],
  config: FunnelConfig,
  breakdownProperty: string
): SegmentedFunnelResult {
  const overallResult = calculateFunnel(events, config);

  if (!breakdownProperty) {
    return {
      property: '',
      segments: [{ segmentValue: '總體', result: overallResult }],
      overallResult,
    };
  }

  // Find segment value for each user (based on their first event containing this property)
  const userSegmentMap = new Map<string, string>();
  for (const ev of events) {
    if (!userSegmentMap.has(ev.userId)) {
      const val = ev.properties[breakdownProperty];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        userSegmentMap.set(ev.userId, String(val).trim());
      }
    }
  }

  // Group events by segment
  const segmentEventsMap = new Map<string, RawEvent[]>();
  for (const ev of events) {
    const seg = userSegmentMap.get(ev.userId) || '其他 (未分類)';
    let list = segmentEventsMap.get(seg);
    if (!list) {
      list = [];
      segmentEventsMap.set(seg, list);
    }
    list.push(ev);
  }

  const segments: { segmentValue: string; result: FunnelResult }[] = [];

  // Sort segments by event count descending
  const sortedEntries = Array.from(segmentEventsMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  for (const [segValue, segEvents] of sortedEntries) {
    const segConfig: FunnelConfig = {
      ...config,
      name: `${config.name} (${segValue})`,
    };
    const segResult = calculateFunnel(segEvents, segConfig);
    segments.push({
      segmentValue: segValue,
      result: segResult,
    });
  }

  return {
    property: breakdownProperty,
    segments,
    overallResult,
  };
}
