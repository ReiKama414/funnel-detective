import Papa from 'papaparse';
import { ColumnMapping, RawEvent } from '../types/funnel';
import { parseTimestamp } from './time';

export interface ParseResult {
  events: RawEvent[];
  errors: string[];
  totalRows: number;
  detectedMapping: ColumnMapping;
  availableColumns: string[];
  uniqueEventNames: string[];
  uniqueUsersCount: number;
  minTimestamp?: number;
  maxTimestamp?: number;
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
  const uniqueUsers = new Set<string>();
  const eventNamesSet = new Set<string>();
  let minTs = Infinity;
  let maxTs = -Infinity;

  records.forEach((row, index) => {
    const rawUserId = row[mapping.userIdField];
    const rawEventName = row[mapping.eventNameField];
    const rawTimestamp = row[mapping.timestampField];

    if (rawUserId === undefined || rawUserId === null || String(rawUserId).trim() === '') {
      errors.push(`Row ${index + 1}: Missing user_id (${mapping.userIdField})`);
      return;
    }

    if (rawEventName === undefined || rawEventName === null || String(rawEventName).trim() === '') {
      errors.push(`Row ${index + 1}: Missing event_name (${mapping.eventNameField})`);
      return;
    }

    const ts = parseTimestamp(rawTimestamp);
    if (ts === null) {
      errors.push(`Row ${index + 1}: Invalid timestamp "${rawTimestamp}"`);
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

  return {
    events,
    errors: errors.slice(0, 50), // Cap error list for performance
    totalRows: records.length,
    detectedMapping: mapping,
    availableColumns,
    uniqueEventNames: Array.from(eventNamesSet).sort(),
    uniqueUsersCount: uniqueUsers.size,
    minTimestamp: minTs === Infinity ? undefined : minTs,
    maxTimestamp: maxTs === -Infinity ? undefined : maxTs,
  };
}

export function parseCSV(fileContent: string, customMapping?: Partial<ColumnMapping>): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  const columns = parsed.meta.fields || [];
  const defaultMapping = detectColumns(columns);
  const finalMapping: ColumnMapping = {
    userIdField: customMapping?.userIdField || defaultMapping.userIdField,
    eventNameField: customMapping?.eventNameField || defaultMapping.eventNameField,
    timestampField: customMapping?.timestampField || defaultMapping.timestampField,
    propertyFields: customMapping?.propertyFields || defaultMapping.propertyFields,
  };

  const res = parseEventsFromRecords(parsed.data, finalMapping);
  if (parsed.errors && parsed.errors.length > 0) {
    res.errors.unshift(...parsed.errors.map((e) => `CSV parse error at line ${e.row}: ${e.message}`));
  }
  return res;
}

export function parseJSON(jsonContent: string, customMapping?: Partial<ColumnMapping>): ParseResult {
  try {
    let parsed = JSON.parse(jsonContent);
    // If wrapped in an object like { events: [...] } or { data: [...] }
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed.events)) parsed = parsed.events;
      else if (Array.isArray(parsed.data)) parsed = parsed.data;
      else if (Array.isArray(parsed.rows)) parsed = parsed.rows;
      else {
        throw new Error('JSON is not an array of event objects');
      }
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array of event objects');
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
      errors: [`JSON parse failure: ${message}`],
      totalRows: 0,
      detectedMapping: { userIdField: 'user_id', eventNameField: 'event_name', timestampField: 'timestamp' },
      availableColumns: [],
      uniqueEventNames: [],
      uniqueUsersCount: 0,
    };
  }
}
