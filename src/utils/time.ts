// Time parsing and formatting utilities
import { TimeUnit } from '../types/funnel';

export function parseTimestamp(val: unknown): number | null {
  if (val === null || val === undefined) return null;

  // Already a number
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return null;
    // Unix seconds (e.g. 10 digits around 1.7e9)
    if (val > 1e8 && val < 1e11) {
      return Math.round(val * 1000);
    }
    // Unix milliseconds (e.g. 13 digits around 1.7e12)
    if (val >= 1e11 && val < 1e15) {
      return Math.round(val);
    }
    // Microseconds
    if (val >= 1e15) {
      return Math.round(val / 1000);
    }
    return null;
  }

  // String parsing
  const str = String(val).trim();
  if (!str) return null;

  // Pure numeric string
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      if (str.length === 10) return num * 1000;
      if (str.length === 13) return num;
      if (str.length === 16) return Math.round(num / 1000);
    }
  }

  // Try standard Date parsing
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return parsed;
  }

  // Handle common format "YYYY-MM-DD HH:mm:ss" by replacing space with 'T'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    const isoLike = str.replace(' ', 'T');
    const p = Date.parse(isoLike);
    if (!isNaN(p)) return p;
  }

  return null;
}

export function timeUnitToMs(value: number, unit: TimeUnit): number {
  switch (unit) {
    case 'minutes':
      return value * 60 * 1000;
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 60 * 1000;
  }
}

export function formatDuration(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || isNaN(ms)) return '—';
  if (ms < 0) ms = 0;

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) {
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function formatDateTime(ms: number | undefined | null): string {
  if (!ms || isNaN(ms)) return '—';
  const d = new Date(ms);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatPercentage(rate: number): string {
  if (isNaN(rate)) return '0.0%';
  return `${(rate * 100).toFixed(1)}%`;
}
