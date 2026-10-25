import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Table,
  HardDrive,
} from 'lucide-react';
import { ColumnMapping, RawEvent } from '../types/funnel';
import { parseCSV, parseJSON, ParseResult } from '../utils/dataParser';
import { saveDataset } from '../services/db';

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
  const [saveToIndexedDB, setSaveToIndexedDB] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setParseResult({
        events: [],
        errors: ['檔案大小為 0 字節，內容為空。'],
        anomalies: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        detectedMapping: columnMapping,
        availableColumns: [],
        uniqueEventNames: [],
        uniqueUsersCount: 0,
      });
      setFileName(file.name);
      return;
    }

    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || !content.trim()) {
        setParseResult({
          events: [],
          errors: ['檔案內容為空。'],
          anomalies: [],
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          detectedMapping: columnMapping,
          availableColumns: [],
          uniqueEventNames: [],
          uniqueUsersCount: 0,
        });
        return;
      }

      const result = isJson ? parseJSON(content) : parseCSV(content);
      setParseResult(result);
      setColumnMapping(result.detectedMapping);
    };
    reader.readAsText(file);
  };

  const handlePasteParse = () => {
    if (!rawText.trim()) {
      setParseResult({
        events: [],
        errors: ['貼上內容為空，請輸入有效資料。'],
        anomalies: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        detectedMapping: columnMapping,
        availableColumns: [],
        uniqueEventNames: [],
        uniqueUsersCount: 0,
      });
      return;
    }
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

    if (parseResult && rawText) {
      const reParsed = fileType === 'json' ? parseJSON(rawText, updated) : parseCSV(rawText, updated);
      setParseResult(reParsed);
    }
  };

  const handleConfirm = async () => {
    if (!parseResult || parseResult.events.length === 0) return;
    const finalName = fileName || '自訂資料集';

    if (saveToIndexedDB) {
      try {
        await saveDataset({
          id: `dataset_${Date.now()}`,
          name: finalName,
          source: 'imported',
          createdAt: Date.now(),
          totalEvents: parseResult.events.length,
          uniqueUsers: parseResult.uniqueUsersCount,
          events: parseResult.events,
        });
      } catch {
        // Fallback gracefully
      }
    }

    onImportSuccess(parseResult.events, finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 m-0">匯入事件資料 (CSV / JSON)</h2>
              <p className="text-xs text-slate-400 m-0">
                嚴格驗證異常資料、空檔案與時序，支援 IndexedDB 持久化保存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-2.5">
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              檔案上傳 (.csv, .json)
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === 'paste'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              直接貼上文字內容
            </button>
          </div>

          {activeMode === 'upload' ? (
            <label className="border border-dashed border-slate-700 hover:border-indigo-500/70 rounded-lg p-7 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/20 transition group">
              <Upload className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition mb-2" />
              <span className="text-xs font-medium text-slate-200">
                點擊選擇檔案或拖曳 CSV / JSON 檔案至此
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                支援 ISO 8601、UNIX 毫秒/秒戳記與自訂擴充屬性
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
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handlePasteParse}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
              >
                解析內容
              </button>
            </div>
          )}

          {/* Parse Result Summary & Column Mapping */}
          {parseResult && (
            <div className="space-y-3.5 pt-1">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-400">總行數</span>
                  <p className="text-base font-bold text-slate-100 font-mono m-0">
                    {parseResult.totalRows.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-400">有效事件</span>
                  <p className="text-base font-bold text-emerald-400 font-mono m-0">
                    {parseResult.validRows.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-400">獨立使用者</span>
                  <p className="text-base font-bold text-indigo-400 font-mono m-0">
                    {parseResult.uniqueUsersCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-400">異常略過列</span>
                  <p
                    className={`text-base font-bold font-mono m-0 ${
                      parseResult.invalidRows > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {parseResult.invalidRows.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Column Mapping Selector */}
              {parseResult.events.length > 0 && (
                <div className="bg-slate-950/40 p-3.5 rounded border border-slate-800 space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-300 m-0 flex items-center space-x-1.5">
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                    <span>欄位對應確認</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        使用者 ID (user_id)
                      </label>
                      <select
                        value={columnMapping.userIdField}
                        onChange={(e) => handleRemap('userIdField', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
                        事件名稱 (event_name)
                      </label>
                      <select
                        value={columnMapping.eventNameField}
                        onChange={(e) => handleRemap('eventNameField', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
                        時間戳記 (timestamp)
                      </label>
                      <select
                        value={columnMapping.timestampField}
                        onChange={(e) => handleRemap('timestampField', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {parseResult.availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Anomalies and Errors List */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>解析警告或錯誤 ({parseResult.errors.length})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/80">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IndexedDB Persistence Checkbox */}
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveToIndexedDB}
                  onChange={(e) => setSaveToIndexedDB(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>將此資料集永久保存至本地 IndexedDB 資料庫（離線可用）</span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parseResult || parseResult.events.length === 0}
            className="px-4 py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white transition flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>確認匯入並開始分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};
