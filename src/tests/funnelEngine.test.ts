import { describe, it, expect } from 'vitest';
import { calculateFunnel, evaluateFilter } from '../engine/funnelEngine';
import { FunnelConfig, RawEvent } from '../types/funnel';
import { parseCSV, parseJSON } from '../utils/dataParser';
import { formatDuration, parseTimestamp } from '../utils/time';

describe('Funnel Detective - Rigorous Funnel Engine Edge Cases', () => {
  const baseConfig: FunnelConfig = {
    id: 'test_funnel',
    name: '測試漏斗',
    steps: [
      { id: 's1', name: '步驟 1', eventName: 'visit', filters: [] },
      { id: 's2', name: '步驟 2', eventName: 'signup', filters: [] },
      { id: 's3', name: '步驟 3', eventName: 'purchase', filters: [] },
    ],
    conversionWindow: {
      value: 24,
      unit: 'hours',
      type: 'from_first_step',
    },
    deduplicationMode: 'unique_user_first_touch',
    globalFilters: [],
  };

  it('嚴格去重：單一使用者多次觸發同一事件，各步驟僅計算一次 (No duplicate counts)', () => {
    const events: RawEvent[] = [
      { userId: 'u1', eventName: 'visit', timestamp: 1000, properties: {} },
      { userId: 'u1', eventName: 'visit', timestamp: 2000, properties: {} },
      { userId: 'u1', eventName: 'visit', timestamp: 3000, properties: {} },
      { userId: 'u1', eventName: 'signup', timestamp: 4000, properties: {} },
      { userId: 'u1', eventName: 'signup', timestamp: 5000, properties: {} },
      { userId: 'u1', eventName: 'purchase', timestamp: 6000, properties: {} },
    ];

    const result = calculateFunnel(events, baseConfig);

    expect(result.stepResults[0].userCount).toBe(1);
    expect(result.stepResults[1].userCount).toBe(1);
    expect(result.stepResults[2].userCount).toBe(1);
    expect(result.overallConversionRate).toBe(1.0);
    expect(result.totalCompletedUsers).toBe(1);
  });

  it('順序嚴格性：在進入第一步之前發生的後續步驟事件不可被計入 (Strict chronological order)', () => {
    const events: RawEvent[] = [
      { userId: 'u1', eventName: 'signup', timestamp: 1000, properties: {} },
      { userId: 'u1', eventName: 'visit', timestamp: 2000, properties: {} },
    ];

    const result = calculateFunnel(events, baseConfig);

    expect(result.stepResults[0].userCount).toBe(1);
    expect(result.stepResults[1].userCount).toBe(0);
    expect(result.stepResults[0].usersReached).toContain('u1');
    expect(result.stepResults[1].usersDropped).toContain('u1');
  });

  it('時間窗邊界測試：臨界毫秒值判定 (Window exact boundary check)', () => {
    const windowMs = 60 * 60 * 1000; // 1 hour
    const config1Hour: FunnelConfig = {
      ...baseConfig,
      steps: [
        { id: 's1', name: 'S1', eventName: 'step1', filters: [] },
        { id: 's2', name: 'S2', eventName: 'step2', filters: [] },
      ],
      conversionWindow: { value: 1, unit: 'hours', type: 'from_first_step' },
    };

    const events: RawEvent[] = [
      // u_exact: exactly at window boundary (+1 hour exactly) -> should convert
      { userId: 'u_exact', eventName: 'step1', timestamp: 1000, properties: {} },
      { userId: 'u_exact', eventName: 'step2', timestamp: 1000 + windowMs, properties: {} },

      // u_over: 1 millisecond beyond window -> should NOT convert
      { userId: 'u_over', eventName: 'step1', timestamp: 1000, properties: {} },
      { userId: 'u_over', eventName: 'step2', timestamp: 1000 + windowMs + 1, properties: {} },
    ];

    const result = calculateFunnel(events, config1Hour);
    expect(result.stepResults[0].userCount).toBe(2);
    expect(result.stepResults[1].userCount).toBe(1);
    expect(result.stepResults[1].usersReached).toContain('u_exact');
    expect(result.stepResults[1].usersDropped).toContain('u_over');
  });

  it('相鄰步驟時間窗模式 (step_to_step window)', () => {
    const configStepToStep: FunnelConfig = {
      ...baseConfig,
      steps: [
        { id: 's1', name: 'S1', eventName: 'step1', filters: [] },
        { id: 's2', name: 'S2', eventName: 'step2', filters: [] },
        { id: 's3', name: 'S3', eventName: 'step3', filters: [] },
      ],
      conversionWindow: { value: 1, unit: 'hours', type: 'step_to_step' },
    };

    const events: RawEvent[] = [
      // u1: step1 at 0, step2 at +30m, step3 at +80m (diff from s2 is 50m < 1h, though total from s1 is 80m > 1h)
      { userId: 'u1', eventName: 'step1', timestamp: 1000, properties: {} },
      { userId: 'u1', eventName: 'step2', timestamp: 1000 + 30 * 60 * 1000, properties: {} },
      { userId: 'u1', eventName: 'step3', timestamp: 1000 + 80 * 60 * 1000, properties: {} },
    ];

    const result = calculateFunnel(events, configStepToStep);
    expect(result.stepResults[2].userCount).toBe(1); // Converts because s3 was within 1h of s2!
  });

  it('過濾器運算子完整測試 (Filter operator tests)', () => {
    expect(evaluateFilter({ price: 100 }, { id: '1', property: 'price', operator: 'greater_than', value: 50 })).toBe(true);
    expect(evaluateFilter({ price: 100 }, { id: '2', property: 'price', operator: 'less_than', value: 50 })).toBe(false);
    expect(evaluateFilter({ city: 'Taipei City' }, { id: '3', property: 'city', operator: 'contains', value: 'taipei' })).toBe(true);
    expect(evaluateFilter({ city: 'Tokyo' }, { id: '4', property: 'city', operator: 'not_contains', value: 'taipei' })).toBe(true);
    expect(evaluateFilter({ role: 'admin' }, { id: '5', property: 'role', operator: 'in', value: 'admin, superuser' })).toBe(true);
    expect(evaluateFilter({ role: 'guest' }, { id: '6', property: 'role', operator: 'in', value: 'admin, superuser' })).toBe(false);
    expect(evaluateFilter({ email: 'test@example.com' }, { id: '7', property: 'email', operator: 'exists', value: '' })).toBe(true);
    expect(evaluateFilter({}, { id: '8', property: 'email', operator: 'exists', value: '' })).toBe(false);
  });

  it('亂序事件自動按時間遞增排序 (Out of order timestamps sorting)', () => {
    const events: RawEvent[] = [
      { userId: 'u1', eventName: 'purchase', timestamp: 3000, properties: {} },
      { userId: 'u1', eventName: 'visit', timestamp: 1000, properties: {} },
      { userId: 'u1', eventName: 'signup', timestamp: 2000, properties: {} },
    ];

    const result = calculateFunnel(events, baseConfig);
    expect(result.stepResults[0].userCount).toBe(1);
    expect(result.stepResults[1].userCount).toBe(1);
    expect(result.stepResults[2].userCount).toBe(1);
  });

  it('CSV 解析器正確識別欄位並提取屬性 (CSV parser and column detection)', () => {
    const csvData = `user_id,event_name,timestamp,device,country\nu1,view,2024-05-01T10:00:00Z,Desktop,TW\nu2,view,1714557600000,Mobile,US`;
    const parsed = parseCSV(csvData);

    expect(parsed.totalRows).toBe(2);
    expect(parsed.events.length).toBe(2);
    expect(parsed.uniqueUsersCount).toBe(2);
    expect(parsed.detectedMapping.userIdField).toBe('user_id');
    expect(parsed.detectedMapping.eventNameField).toBe('event_name');
    expect(parsed.events[0].properties.device).toBe('Desktop');
    expect(parsed.events[0].properties.country).toBe('TW');
  });

  it('JSON 解析器支援標準結構 (JSON parser)', () => {
    const jsonData = JSON.stringify([
      { userId: 'u1', event: 'visit', time: '2024-05-01 12:00:00', plan: 'pro' },
      { userId: 'u2', event: 'visit', time: '2024-05-01 13:00:00', plan: 'free' },
    ]);
    const parsed = parseJSON(jsonData);

    expect(parsed.totalRows).toBe(2);
    expect(parsed.events.length).toBe(2);
    expect(parsed.events[0].properties.plan).toBe('pro');
  });

  it('時間與持續時間格式化 (Time and duration formatting)', () => {
    expect(formatDuration(45000)).toBe('45s');
    expect(formatDuration(150000)).toBe('2m 30s');
    expect(formatDuration(3660000)).toBe('1h 1m');
    expect(formatDuration(90000000)).toBe('1d 1h');
    expect(parseTimestamp('1714521600000')).toBe(1714521600000);
    expect(parseTimestamp('2024-05-01T00:00:00Z')).toBe(Date.parse('2024-05-01T00:00:00Z'));
  });
});
