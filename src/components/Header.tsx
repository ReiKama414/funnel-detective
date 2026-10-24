import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Database,
  Search,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { SampleDataset, SAMPLE_DATASETS } from '../data/sampleDatasets';
import { FunnelResult } from '../types/funnel';
import { exportFunnelMetricsCSV, exportFunnelJSON } from '../utils/export';

interface HeaderProps {
  currentDataset: SampleDataset | null;
  onSelectSampleDataset: (dataset: SampleDataset) => void;
  onOpenImportModal: () => void;
  funnelResult?: FunnelResult;
  totalEventsCount: number;
  uniqueUsersCount: number;
  activeTab: 'funnel' | 'time' | 'segments' | 'compare' | 'detective';
  setActiveTab: (tab: 'funnel' | 'time' | 'segments' | 'compare' | 'detective') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDataset,
  onSelectSampleDataset,
  onOpenImportModal,
  funnelResult,
  totalEventsCount,
  uniqueUsersCount,
  activeTab,
  setActiveTab,
}) => {
  const [datasetDropdownOpen, setDatasetDropdownOpen] = React.useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Search className="w-5 h-5 text-indigo-400 transform -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white m-0">Funnel Detective</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block m-0">
                事件轉換分析與流失偵測平台
              </p>
            </div>
          </div>

          {/* Dataset Switcher & Stats */}
          <div className="flex items-center space-x-3">
            {/* Dataset selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[130px] sm:max-w-[200px] truncate">
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
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      內建範例情境資料
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
                            ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-300'
                            : 'text-slate-200'
                        }`}
                      >
                        <span className="font-medium text-slate-100">{ds.name}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">{ds.description}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      onClick={() => {
                        setDatasetDropdownOpen(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-indigo-400 hover:bg-indigo-950/40 transition font-medium"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上傳外部 CSV / JSON...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Ingestion & Export Buttons */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">匯入資料</span>
            </button>

            {/* Export Dropdown */}
            {funnelResult && (
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
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
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50">
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
                        <span>匯出完整 JSON 報告</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Navigation Tabs & Dataset Quick Stats */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 pb-2 text-xs">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
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
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
            <span>事件總數：<strong className="text-slate-200">{totalEventsCount.toLocaleString()}</strong> 筆</span>
            <span className="text-slate-600">•</span>
            <span>獨立用戶：<strong className="text-slate-200">{uniqueUsersCount.toLocaleString()}</strong> 人</span>
          </div>
        </div>
      </div>
    </header>
  );
};
