import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Database,
  Search,
  Upload,
  ChevronDown,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { SampleDataset, SAMPLE_DATASETS } from '../data/sampleDatasets';
import { FunnelResult } from '../types/funnel';
import { exportFunnelMetricsCSV, exportFunnelJSON } from '../utils/export';

interface HeaderProps {
  currentDataset: SampleDataset | null;
  onSelectSampleDataset: (dataset: SampleDataset) => void;
  onOpenImportModal: () => void;
  onOpenSavedFunnelsModal: () => void;
  funnelResult?: FunnelResult;
  totalEventsCount: number;
  uniqueUsersCount: number;
  activeTab: 'funnel' | 'time' | 'segments' | 'compare' | 'detective';
  setActiveTab: (tab: 'funnel' | 'time' | 'segments' | 'compare' | 'detective') => void;
  savedFunnelsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDataset,
  onSelectSampleDataset,
  onOpenImportModal,
  onOpenSavedFunnelsModal,
  funnelResult,
  totalEventsCount,
  uniqueUsersCount,
  activeTab,
  setActiveTab,
  savedFunnelsCount,
}) => {
  const [datasetDropdownOpen, setDatasetDropdownOpen] = React.useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Search className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-white">Funnel Detective</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  工作台
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block m-0">
                事件轉換分析與流失偵測平台
              </p>
            </div>
          </div>

          {/* Dataset Switcher & Controls */}
          <div className="flex items-center space-x-2.5">
            {/* IndexedDB Saved Funnels Button */}
            <button
              onClick={onOpenSavedFunnelsModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition"
              title="管理 IndexedDB 中的已儲存漏斗"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">已存漏斗</span>
              {savedFunnelsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] font-mono text-amber-300">
                  {savedFunnelsCount}
                </span>
              )}
            </button>

            {/* Dataset selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">
                  {currentDataset ? currentDataset.name : '自訂匯入資料'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {datasetDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDatasetDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-72 rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      內建範例資料集
                    </div>
                    {SAMPLE_DATASETS.map((ds) => (
                      <button
                        key={ds.id}
                        onClick={() => {
                          onSelectSampleDataset(ds);
                          setDatasetDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-800 transition ${
                          currentDataset?.id === ds.id
                            ? 'bg-indigo-950/40 border-l-2 border-indigo-500 text-indigo-300'
                            : 'text-slate-200'
                        }`}
                      >
                        <span className="font-semibold text-slate-100">{ds.name}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">{ds.description}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      onClick={() => {
                        setDatasetDropdownOpen(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-indigo-400 hover:bg-slate-800 transition font-medium"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上傳 CSV / JSON 檔案...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Ingestion & Export Buttons */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">匯入資料</span>
            </button>

            {/* Export Dropdown */}
            {funnelResult && (
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">匯出</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {exportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setExportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-1 z-50">
                      <button
                        onClick={() => {
                          exportFunnelMetricsCSV(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>匯出指標 CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportFunnelJSON(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2 transition"
                      >
                        <Database className="w-3.5 h-3.5 text-amber-400" />
                        <span>匯出完整 JSON</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 py-1.5 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {[
              { id: 'funnel', label: '漏斗主分析' },
              { id: 'time', label: '完成時間分布' },
              { id: 'segments', label: '屬性分群比較' },
              { id: 'compare', label: '多漏斗對比' },
              { id: 'detective', label: '偵探洞察報告' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-indigo-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1 text-slate-400">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>IndexedDB 已連線</span>
            </div>
            <span className="text-slate-600">|</span>
            <span>事件：<strong className="text-slate-200 font-mono">{totalEventsCount.toLocaleString()}</strong> 筆</span>
            <span className="text-slate-600">|</span>
            <span>獨立用戶：<strong className="text-slate-200 font-mono">{uniqueUsersCount.toLocaleString()}</strong> 人</span>
          </div>
        </div>
      </div>
    </header>
  );
};
