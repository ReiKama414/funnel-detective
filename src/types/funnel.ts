// Funnel Detective - Core Type Definitions

export type TimeUnit = 'minutes' | 'hours' | 'days';
export type WindowAnchorType = 'from_first_step' | 'step_to_step';
export type DeduplicationMode = 'unique_user_first_touch' | 'unique_user_last_touch' | 'all_completed_journeys';
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'exists';

export interface PropertyFilter {
  id: string;
  property: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export interface FunnelStepDefinition {
  id: string;
  name: string;
  eventName: string;
  filters: PropertyFilter[];
  color?: string;
}

export interface ConversionWindow {
  value: number;
  unit: TimeUnit;
  type: WindowAnchorType;
}

export interface FunnelConfig {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStepDefinition[];
  conversionWindow: ConversionWindow;
  deduplicationMode: DeduplicationMode;
  breakdownProperty?: string;
  globalFilters: PropertyFilter[];
  dateRange?: {
    startMs?: number;
    endMs?: number;
  };
}

export interface RawEvent {
  userId: string;
  eventName: string;
  timestamp: number; // Milliseconds Unix epoch
  properties: Record<string, string | number | boolean>;
  rawRecord?: Record<string, unknown>;
}

export interface StepTimeMetrics {
  medianMs: number;
  meanMs: number;
  p75Ms: number;
  p90Ms: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
}

export interface TimeDistributionBin {
  bucketLabel: string;
  minMs: number;
  maxMs: number;
  count: number;
  percentage: number;
}

export interface StepResult {
  stepIndex: number;
  stepId: string;
  stepName: string;
  eventName: string;
  userCount: number;
  conversionRateFromPrev: number; // 0 to 1 (1 = 100%)
  conversionRateFromStart: number; // 0 to 1
  dropOffCount: number;
  dropOffRate: number; // 0 to 1
  usersReached: string[]; // Set of user IDs who completed this step
  usersDropped: string[]; // Set of user IDs who dropped off after previous step
  stepTimeMetrics?: StepTimeMetrics; // Duration from previous step (for steps > 0)
  totalTimeMetrics?: StepTimeMetrics; // Duration from step 0 to this step
  stepTimeBins?: TimeDistributionBin[];
}

export interface FunnelResult {
  funnelId: string;
  funnelName: string;
  config: FunnelConfig;
  totalUniqueUsersInput: number; // Total distinct users in dataset (after global filters)
  stepResults: StepResult[];
  overallConversionRate: number; // Final step users / Step 1 users
  totalCompletedUsers: number;
  overallTimeMetrics?: StepTimeMetrics;
  overallTimeBins?: TimeDistributionBin[];
  calculatedAt: string;
  bottleneckStepIndex?: number; // Step with highest drop-off rate
}

export interface SegmentedFunnelResult {
  property: string;
  segments: {
    segmentValue: string;
    result: FunnelResult;
  }[];
  overallResult: FunnelResult;
}

export interface FunnelComparisonDiff {
  stepIndex: number;
  stepName: string;
  funnelAUserCount: number;
  funnelBUserCount: number;
  userCountDelta: number;
  funnelAConversionRate: number;
  funnelBConversionRate: number;
  conversionRateDelta: number; // e.g. +0.05 (+5%)
  funnelAMedianDurationMs?: number;
  funnelBMedianDurationMs?: number;
  medianDurationDeltaMs?: number;
}

export interface FunnelComparisonResult {
  funnelA: FunnelResult;
  funnelB: FunnelResult;
  diffs: FunnelComparisonDiff[];
  overallConversionRateDelta: number;
  overallDurationDeltaMs?: number;
  summaryNote: string;
}

export interface ColumnMapping {
  userIdField: string;
  eventNameField: string;
  timestampField: string;
  propertyFields?: string[];
}
