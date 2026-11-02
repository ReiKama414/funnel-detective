import Papa from 'papaparse';
import { FunnelResult, RawEvent } from '../types/funnel';
import { formatDuration, formatPercentage } from './time';

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Make a string safe to use as a download filename (strip path / reserved characters). */
function toSafeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || 'export';
}

export function exportFunnelMetricsCSV(result: FunnelResult) {
  const rows = result.stepResults.map((s, idx) => ({
    '步驟序號': idx + 1,
    '步驟名稱': s.stepName,
    '事件名稱': s.eventName,
    '獨立使用者數': s.userCount,
    '步驟轉換率': formatPercentage(s.conversionRateFromPrev),
    '總體轉換率': formatPercentage(s.conversionRateFromStart),
    '流失使用者數': s.dropOffCount,
    '流失率': formatPercentage(s.dropOffRate),
    '中位數花費時間': s.stepTimeMetrics ? formatDuration(s.stepTimeMetrics.medianMs) : '—',
    '平均花費時間': s.stepTimeMetrics ? formatDuration(s.stepTimeMetrics.meanMs) : '—',
    'P90花費時間': s.stepTimeMetrics ? formatDuration(s.stepTimeMetrics.p90Ms) : '—',
  }));

  const csv = Papa.unparse(rows);
  const safeName = toSafeFileName(result.funnelName);
  downloadFile(`${safeName}_funnel_metrics.csv`, '\uFEFF' + csv, 'text/csv;charset=utf-8;');
}

export function exportUserCohortCSV(
  cohortName: string,
  userIds: string[],
  allEvents: RawEvent[]
) {
  // Aggregate user summary for cohort
  const userMap = new Map<string, { eventCount: number; firstSeen: number; lastSeen: number; properties: Record<string, string | number | boolean> }>();

  const userIdSet = new Set(userIds);

  for (const e of allEvents) {
    if (!userIdSet.has(e.userId)) continue;
    const existing = userMap.get(e.userId);
    if (!existing) {
      userMap.set(e.userId, {
        eventCount: 1,
        firstSeen: e.timestamp,
        lastSeen: e.timestamp,
        properties: { ...e.properties },
      });
    } else {
      existing.eventCount++;
      if (e.timestamp < existing.firstSeen) existing.firstSeen = e.timestamp;
      if (e.timestamp > existing.lastSeen) {
        existing.lastSeen = e.timestamp;
        existing.properties = { ...existing.properties, ...e.properties };
      }
    }
  }

  const rows = userIds.map((uid) => {
    const meta = userMap.get(uid);
    const row: Record<string, unknown> = {
      user_id: uid,
      total_events: meta?.eventCount || 0,
      first_seen: meta?.firstSeen ? new Date(meta.firstSeen).toISOString() : '',
      last_seen: meta?.lastSeen ? new Date(meta.lastSeen).toISOString() : '',
    };
    if (meta?.properties) {
      for (const [k, v] of Object.entries(meta.properties)) {
        row[k] = v;
      }
    }
    return row;
  });

  // escapeFormulae guards against CSV/Excel formula injection from imported values
  const csv = Papa.unparse(rows, { escapeFormulae: true });
  const safeName = toSafeFileName(cohortName);
  downloadFile(`${safeName}_users_${Date.now()}.csv`, '\uFEFF' + csv, 'text/csv;charset=utf-8;');
}

export function exportFunnelJSON(result: FunnelResult) {
  const json = JSON.stringify(result, null, 2);
  const safeName = toSafeFileName(result.funnelName);
  downloadFile(`${safeName}_report.json`, json, 'application/json');
}
