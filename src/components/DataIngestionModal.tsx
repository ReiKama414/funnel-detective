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
import { useEscapeKey } from '../utils/useEscapeKey';

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
  // Raw content of the most recently loaded file / pasted text, used for re-mapping columns
  const [sourceText, setSourceText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setActiveMode('upload');
    setFileName('');
    setRawText('');
    setSourceText('');
    setParseResult(null);
    setIsDragging(false);
    setColumnMapping({
      userIdField: 'user_id',
      eventNameField: 'event_name',
      timestampField: 'timestamp',
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEscapeKey(isOpen, handleClose);

  if (!isOpen) return null;

  const processFile = (file: File) => {
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
    const isJson = file.name.toLowerCase().endsWith('.json');
    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onerror = () => {
      setParseResult({
        events: [],
        errors: ['讀取檔案失敗，請確認檔案是否可存取後重試。'],
        anomalies: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        detectedMapping: columnMapping,
        availableColumns: [],
        uniqueEventNames: [],
        uniqueUsersCount: 0,
      });
    };
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSourceText(content || '');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    // Allow re-selecting the same file afterwards
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
    setSourceText(rawText);

    const result = isJson ? parseJSON(rawText) : parseCSV(rawText);
    setParseResult(result);
    setColumnMapping(result.detectedMapping);
  };

  const handleRemap = (key: keyof ColumnMapping, value: string) => {
    const updated = { ...columnMapping, [key]: value };
    setColumnMapping(updated);

    if (parseResult && sourceText) {
      const reParsed =
        fileType === 'json' ? parseJSON(sourceText, updated) : parseCSV(sourceText, updated);
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
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl w-[calc(100vw-1.5rem)] sm:w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-900 dark:text-zinc-100 shrink-0">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate m-0">匯入事件資料 (CSV / JSON)</h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 m-0 truncate">
                嚴格驗證異常資料、空檔案與時序，支援 IndexedDB 持久化保存
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === 'upload'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              檔案上傳 (.csv, .json)
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeMode === 'paste'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              直接貼上文字內容
            </button>
          </div>

          {activeMode === 'upload' ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-6 sm:p-7 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/20 transition group ${
                isDragging
                  ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800/40'
                  : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/40'
              }`}
            >
              <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition mb-2" />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 text-center">
                點擊選擇檔案或拖曳 CSV / JSON 檔案至此
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 text-center">
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
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <button
                onClick={handlePasteParse}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-medium transition"
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
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">總行數</span>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono m-0">
                    {parseResult.totalRows.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">有效事件</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono m-0">
                    {parseResult.validRows.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">獨立使用者</span>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono m-0">
                    {parseResult.uniqueUsersCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">異常略過列</span>
                  <p
                    className={`text-sm sm:text-base font-bold font-mono m-0 ${
                      parseResult.invalidRows > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {parseResult.invalidRows.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Column Mapping Selector */}
              {parseResult.events.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 sm:p-3.5 rounded border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 m-0 flex items-center space-x-1.5">
                    <Table className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>欄位對應確認</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                        使用者 ID (user_id)
                      </label>
                      <select
                        value={columnMapping.userIdField}
                        onChange={(e) => handleRemap('userIdField', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {parseResult.availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                        事件名稱 (event_name)
                      </label>
                      <select
                        value={columnMapping.eventNameField}
                        onChange={(e) => handleRemap('eventNameField', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {parseResult.availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">
                        時間戳記 (timestamp)
                      </label>
                      <select
                        value={columnMapping.timestampField}
                        onChange={(e) => handleRemap('timestampField', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
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
                <div className="p-3 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>解析警告或錯誤 ({parseResult.errors.length})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-200/80">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IndexedDB Persistence Checkbox */}
              <label className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveToIndexedDB}
                  onChange={(e) => setSaveToIndexedDB(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                />
                <span className="flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  <span>將此資料集保存至本地 IndexedDB 資料庫（離線可用）</span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
          <button
            onClick={handleClose}
            className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parseResult || parseResult.events.length === 0}
            className="px-4 py-1.5 text-xs font-medium rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none text-white dark:text-zinc-900 transition flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>確認匯入並開始分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};
