import Papa from 'papaparse';
import { ColumnMapping, RawEvent } from '../types/funnel';
import { parseTimestamp } from './time';

export interface ParseAnomaly {
  row: number;
  reason: string;
  rawData?: Record<string, unknown>;
}

export interface ParseResult {
  events: RawEvent[];
  errors: string[];
  anomalies: ParseAnomaly[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  detectedMapping: ColumnMapping;
  availableColumns: string[];
  uniqueEventNames: string[];
  uniqueUsersCount: number;
  minTimestamp?: number;
  maxTimestamp?: number;
  isLargeFile?: boolean;
}

const USER_ID_CANDIDATES = [
  'user_id',
  'userid',
  'user_id_anon',
  'uid',
  'anonymous_id',
  'distinct_id',
  'customer_id',
  'user',
  'client_id',
  'id',
];

const EVENT_NAME_CANDIDATES = [
  'event_name',
  'eventname',
  'event',
  'action',
  'activity',
  'event_type',
  'type',
  'name',
];

const TIMESTAMP_CANDIDATES = [
  'timestamp',
  'time',
  'ts',
  'datetime',
  'date',
  'created_at',
  'occurred_at',
  'event_time',
];

export function detectColumns(columns: string[]): ColumnMapping {
  const lowerCols = columns.map((c) => ({
    original: c,
    lower: c.toLowerCase().trim().replace(/[\s-_]+/g, '_'),
  }));

  const findMatch = (candidates: string[]): string => {
    // 1. Exact match
    for (const cand of candidates) {
      const match = lowerCols.find((c) => c.lower === cand);
      if (match) return match.original;
    }
    // 2. Substring match
    for (const cand of candidates) {
      const match = lowerCols.find((c) => c.lower.includes(cand));
      if (match) return match.original;
    }
    return '';
  };

  const userIdField = findMatch(USER_ID_CANDIDATES) || columns[0] || 'user_id';
  const eventNameField =
    findMatch(EVENT_NAME_CANDIDATES) ||
    columns.find((c) => c !== userIdField) ||
    columns[1] ||
    'event_name';
  const timestampField =
    findMatch(TIMESTAMP_CANDIDATES) ||
    columns.find((c) => c !== userIdField && c !== eventNameField) ||
    columns[2] ||
    'timestamp';

  const propertyFields = columns.filter(
    (c) => c !== userIdField && c !== eventNameField && c !== timestampField
  );

  return {
    userIdField,
    eventNameField,
    timestampField,
    propertyFields,
  };
}

export function parseEventsFromRecords(
  records: Record<string, unknown>[],
  mapping: ColumnMapping
): ParseResult {
  const events: RawEvent[] = [];
  const errors: string[] = [];
  const anomalies: ParseAnomaly[] = [];
  const uniqueUsers = new Set<string>();
  const eventNamesSet = new Set<string>();
  let minTs = Infinity;
  let maxTs = -Infinity;

  if (!records || records.length === 0) {
    return {
      events: [],
      errors: ['檔案內容為空，無任何可供分析的事件資料列。'],
      anomalies: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedMapping: mapping,
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }

  // Row cap for browser safety (50,000 rows max in single memory parse)
  const isLargeFile = records.length > 50000;
  const processRecords = isLargeFile ? records.slice(0, 50000) : records;

  processRecords.forEach((row, index) => {
    const rowNum = index + 1;
    if (!row || typeof row !== 'object') {
      anomalies.push({ row: rowNum, reason: '資料列非有效物件結構' });
      return;
    }

    const rawUserId = row[mapping.userIdField];
    const rawEventName = row[mapping.eventNameField];
    const rawTimestamp = row[mapping.timestampField];

    if (rawUserId === undefined || rawUserId === null || String(rawUserId).trim() === '') {
      anomalies.push({
        row: rowNum,
        reason: `缺少使用者 ID (欄位: ${mapping.userIdField})`,
        rawData: row,
      });
      return;
    }

    if (rawEventName === undefined || rawEventName === null || String(rawEventName).trim() === '') {
      anomalies.push({
        row: rowNum,
        reason: `缺少事件名稱 (欄位: ${mapping.eventNameField})`,
        rawData: row,
      });
      return;
    }

    const ts = parseTimestamp(rawTimestamp);
    if (ts === null) {
      anomalies.push({
        row: rowNum,
        reason: `時間戳無法解析: "${String(rawTimestamp)}" (欄位: ${mapping.timestampField})`,
        rawData: row,
      });
      return;
    }

    const userId = String(rawUserId).trim();
    const eventName = String(rawEventName).trim();

    // Extract extra properties
    const properties: Record<string, string | number | boolean> = {};
    for (const key of Object.keys(row)) {
      if (
        key !== mapping.userIdField &&
        key !== mapping.eventNameField &&
        key !== mapping.timestampField
      ) {
        const val = row[key];
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          properties[key] = val;
        } else if (val !== null && val !== undefined) {
          properties[key] = String(val);
        }
      }
    }

    events.push({
      userId,
      eventName,
      timestamp: ts,
      properties,
      rawRecord: row,
    });

    uniqueUsers.add(userId);
    eventNamesSet.add(eventName);
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  });

  // Sort events strictly by timestamp ascending
  events.sort((a, b) => a.timestamp - b.timestamp);

  const availableColumns = records.length > 0 ? Object.keys(records[0]) : [];

  if (isLargeFile) {
    errors.push(`檔案包含 ${records.length.toLocaleString()} 列，為維護瀏覽器流暢性，已自動載入前 50,000 列。`);
  }

  return {
    events,
    errors,
    anomalies: anomalies.slice(0, 50), // Cap anomaly preview list
    totalRows: records.length,
    validRows: events.length,
    invalidRows: anomalies.length,
    detectedMapping: mapping,
    availableColumns,
    uniqueEventNames: Array.from(eventNamesSet).sort(),
    uniqueUsersCount: uniqueUsers.size,
    minTimestamp: minTs === Infinity ? undefined : minTs,
    maxTimestamp: maxTs === -Infinity ? undefined : maxTs,
    isLargeFile,
  };
}

export function parseCSV(fileContent: string, customMapping?: Partial<ColumnMapping>): ParseResult {
  const trimmed = fileContent ? fileContent.trim() : '';
  if (!trimmed) {
    return {
      events: [],
      errors: ['CSV 檔案為空或無有效字元。'],
      anomalies: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }

  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  const columns = parsed.meta.fields || [];
  if (columns.length === 0 || parsed.data.length === 0) {
    return {
      events: [],
      errors: ['CSV 檔案缺少標題欄或無有效資料列。'],
      anomalies: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }

  const defaultMapping = detectColumns(columns);
  const finalMapping: ColumnMapping = {
    userIdField: customMapping?.userIdField || defaultMapping.userIdField,
    eventNameField: customMapping?.eventNameField || defaultMapping.eventNameField,
    timestampField: customMapping?.timestampField || defaultMapping.timestampField,
    propertyFields: customMapping?.propertyFields || defaultMapping.propertyFields,
  };

  const res = parseEventsFromRecords(parsed.data, finalMapping);
  if (parsed.errors && parsed.errors.length > 0) {
    res.errors.unshift(...parsed.errors.slice(0, 5).map((e) => `CSV 格式異常 (第 ${e.row} 列): ${e.message}`));
  }
  return res;
}

export function parseJSON(jsonContent: string, customMapping?: Partial<ColumnMapping>): ParseResult {
  const trimmed = jsonContent ? jsonContent.trim() : '';
  if (!trimmed) {
    return {
      events: [],
      errors: ['JSON 檔案為空。'],
      anomalies: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }

  try {
    let parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed.events)) parsed = parsed.events;
      else if (Array.isArray(parsed.data)) parsed = parsed.data;
      else if (Array.isArray(parsed.rows)) parsed = parsed.rows;
      else {
        throw new Error('JSON 物件不包含 events、data 或 rows 事件陣列。');
      }
    }

    if (!Array.isArray(parsed)) {
      throw new Error('預期 JSON 為物件陣列結構 (例如: [{"user_id":"..."}, ...])');
    }

    if (parsed.length === 0) {
      return {
        events: [],
        errors: ['JSON 陣列為空，無任何事件資料。'],
        anomalies: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
        availableColumns: [],
        uniqueEventNames: [],
        uniqueUsersCount: 0,
      };
    }

    const columns = parsed.length > 0 ? Object.keys(parsed[0]) : [];
    const defaultMapping = detectColumns(columns);
    const finalMapping: ColumnMapping = {
      userIdField: customMapping?.userIdField || defaultMapping.userIdField,
      eventNameField: customMapping?.eventNameField || defaultMapping.eventNameField,
      timestampField: customMapping?.timestampField || defaultMapping.timestampField,
      propertyFields: customMapping?.propertyFields || defaultMapping.propertyFields,
    };

    return parseEventsFromRecords(parsed, finalMapping);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      events: [],
      errors: [`JSON 解析失敗: ${message}`],
      anomalies: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }
}
