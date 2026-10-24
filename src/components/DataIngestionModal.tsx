import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { ColumnMapping, RawEvent } from '../types/funnel';
import { parseCSV, parseJSON, ParseResult } from '../utils/dataParser';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (events: RawEvent[], datasetName: string) => void;
}

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    userIdField: 'user_id',
    eventNameField: 'event_name',
    timestampField: 'timestamp',
  });
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = isJson ? parseJSON(content) : parseCSV(content);
      setParseResult(result);
      setColumnMapping(result.detectedMapping);
    };
    reader.readAsText(file);
  };

  const handlePasteParse = () => {
    if (!rawText.trim()) return;
    const isJson = rawText.trim().startsWith('[') || rawText.trim().startsWith('{');
    setFileType(isJson ? 'json' : 'csv');
    setFileName(isJson ? 'pasted_data.json' : 'pasted_data.csv');

    const result = isJson ? parseJSON(rawText) : parseCSV(rawText);
    setParseResult(result);
    setColumnMapping(result.detectedMapping);
  };

  const handleRemap = (key: keyof ColumnMapping, value: string) => {
    const updated = { ...columnMapping, [key]: value };
    setColumnMapping(updated);

    // Re-parse with updated mapping if we have rawText or parseResult
    if (parseResult) {
      if (rawText) {
        const reParsed = fileType === 'json' ? parseJSON(rawText, updated) : parseCSV(rawText, updated);
        setParseResult(reParsed);
      }
    }
  };

  const handleConfirm = () => {
    if (!parseResult || parseResult.events.length === 0) return;
    onImportSuccess(parseResult.events, fileName || '自訂資料集');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 m-0">匯入事件資料 (CSV / JSON)</h2>
              <p className="text-xs text-slate-400 m-0">
                支援包含 user_id、event_name、timestamp 的檔案，並自動識別擴充屬性
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Tabs: Upload vs Paste */}
          <div className="flex space-x-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                activeMode === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              檔案上傳 (.csv, .json)
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                activeMode === 'paste'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              直接貼上文本
            </button>
          </div>

          {activeMode === 'upload' ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/20 transition group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition mb-2" />
              <span className="text-sm font-medium text-slate-200">
                點擊上傳或拖曳 CSV / JSON 檔案至此
              </span>
              <span className="text-xs text-slate-500 mt-1">
                支援 ISO8601、時間戳（毫秒/秒）與常用日期格式
              </span>
              <input
                type="file"
                accept=".csv, .json, text/csv, application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="貼上 CSV 文本或 JSON 陣列 (例如: user_id,event_name,timestamp,device...)"
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handlePasteParse}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                解析貼上的資料
              </button>
            </div>
          )}

          {/* Parse Result Summary & Column Mapping */}
          {parseResult && (
            <div className="space-y-4 pt-2">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">總行數 / 事件</span>
                  <p className="text-lg font-bold text-slate-100 m-0">
                    {parseResult.events.length.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">獨立使用者數</span>
                  <p className="text-lg font-bold text-indigo-400 m-0">
                    {parseResult.uniqueUsersCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">不重複事件類型</span>
                  <p className="text-lg font-bold text-cyan-400 m-0">
                    {parseResult.uniqueEventNames.length}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">解析狀態</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {parseResult.events.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">成功</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-medium text-rose-400">無有效事件</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Mapping Selector */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 m-0 flex items-center space-x-1.5">
                  <Table className="w-3.5 h-3.5 text-indigo-400" />
                  <span>欄位對應檢查與確認</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      使用者識別欄位 (user_id)
                    </label>
                    <select
                      value={columnMapping.userIdField}
                      onChange={(e) => handleRemap('userIdField', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {parseResult.availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      事件名稱欄位 (event_name)
                    </label>
                    <select
                      value={columnMapping.eventNameField}
                      onChange={(e) => handleRemap('eventNameField', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {parseResult.availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      時間戳欄位 (timestamp)
                    </label>
                    <select
                      value={columnMapping.timestampField}
                      onChange={(e) => handleRemap('timestampField', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {parseResult.availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detected Extra Properties */}
                {columnMapping.propertyFields && columnMapping.propertyFields.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-400">
                    <span>已提取附加屬性（可用於分群與篩選）：</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {columnMapping.propertyFields.map((prop) => (
                        <span
                          key={prop}
                          className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]"
                        >
                          {prop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Preview Table */}
              {parseResult.events.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400">前 5 筆預覽</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 text-[11px] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">User ID</th>
                          <th className="px-3 py-2">Event</th>
                          <th className="px-3 py-2">Timestamp</th>
                          <th className="px-3 py-2">Properties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {parseResult.events.slice(0, 5).map((ev, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="px-3 py-2 text-indigo-300">{ev.userId}</td>
                            <td className="px-3 py-2 text-emerald-400">{ev.eventName}</td>
                            <td className="px-3 py-2 text-slate-400">
                              {new Date(ev.timestamp).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-slate-300 text-[11px]">
                              {JSON.stringify(ev.properties)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors Display if any */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>部分資料警告 ({parseResult.errors.length} 條)</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/80">
                    {parseResult.errors.slice(0, 3).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {parseResult.errors.length > 3 && (
                      <li>...還有 {parseResult.errors.length - 3} 筆提示</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parseResult || parseResult.events.length === 0}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>確認匯入並分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};
