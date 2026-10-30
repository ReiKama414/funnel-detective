import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Database,
  Search,
  Upload,
  ChevronDown,
  HardDrive,
  FolderOpen,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
} from 'lucide-react';
import { SampleDataset, SAMPLE_DATASETS } from '../data/sampleDatasets';
import { FunnelResult } from '../types/funnel';
import { exportFunnelMetricsCSV, exportFunnelJSON } from '../utils/export';
import { useTheme } from '../context/useTheme';

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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'funnel', label: '漏斗主分析' },
    { id: 'time', label: '完成時間分布' },
    { id: 'segments', label: '屬性分群比較' },
    { id: 'compare', label: '多漏斗對比' },
    { id: 'detective', label: '偵探洞察報告' },
  ] as const;

  const handleSelectNav = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const CurrentThemeIcon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors select-none">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4 min-w-0">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 transform -rotate-45" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight font-mono text-zinc-900 dark:text-zinc-100 truncate">
                  Funnel Detective
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded shrink-0 inline-block">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:block truncate">
                純前端有序事件漏斗轉換分析工作台 · 嚴格防重複計量
              </p>
            </div>

            {/* Current Dataset Badge */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">資料集:</span>
              <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 max-w-[180px] truncate">
                {currentDataset ? currentDataset.name : '自訂匯入資料'}
              </span>
            </div>
          </div>

          {/* Action Toolbar Desktop */}
          <div className="hidden md:flex items-center space-x-2 shrink-0">
            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
                title={`目前主題: ${theme}`}
                data-testid="theme-toggle-btn"
              >
                <CurrentThemeIcon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span className="text-[11px]">
                  {theme === 'system' ? '系統跟隨' : theme === 'light' ? '淺色模式' : '深色模式'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {themeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        setTheme('system');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                        theme === 'system' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>系統跟隨</span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('light');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                        theme === 'light' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>淺色模式</span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('dark');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                        theme === 'dark' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>深色模式</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* IndexedDB Saved Funnels */}
            <button
              onClick={onOpenSavedFunnelsModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
              title="管理 IndexedDB 中的已儲存漏斗"
            >
              <FolderOpen className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>已存漏斗</span>
              {savedFunnelsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-mono text-zinc-800 dark:text-zinc-200">
                  {savedFunnelsCount}
                </span>
              )}
            </button>

            {/* Dataset Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
              >
                <Database className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="max-w-[140px] truncate">
                  {currentDataset ? currentDataset.name : '自訂匯入資料'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {datasetDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDatasetDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-72 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                      內建範例資料集
                    </div>
                    {SAMPLE_DATASETS.map((ds) => (
                      <button
                        key={ds.id}
                        onClick={() => {
                          onSelectSampleDataset(ds);
                          setDatasetDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                          currentDataset?.id === ds.id
                            ? 'bg-zinc-100 dark:bg-zinc-800/80 border-l-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <span className="font-semibold">{ds.name}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{ds.description}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <button
                      onClick={() => {
                        setDatasetDropdownOpen(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>上傳 CSV / JSON 檔案...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Ingestion Button */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>匯入資料</span>
            </button>

            {/* Export Dropdown */}
            {funnelResult && (
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
                  <span>匯出</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {exportDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl py-1 z-50">
                      <button
                        onClick={() => {
                          exportFunnelMetricsCSV(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-2 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>匯出指標 CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportFunnelJSON(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-2 transition"
                      >
                        <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>匯出完整 JSON</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar Mobile */}
          <div className="flex md:hidden items-center space-x-1.5">
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
              title="切換主題"
              data-testid="theme-toggle-btn-mobile"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-zinc-300" />
              ) : (
                <Sun className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
              title="功能導覽選單"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <div className="hidden md:flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 py-1 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto min-w-0">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectNav(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
            <div className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>IndexedDB 已連線</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>事件：<strong className="text-zinc-900 dark:text-zinc-200 font-mono">{totalEventsCount.toLocaleString()}</strong> 筆</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>獨立用戶：<strong className="text-zinc-900 dark:text-zinc-200 font-mono">{uniqueUsersCount.toLocaleString()}</strong> 人</span>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 py-3 space-y-3 animate-in fade-in duration-150">
            {/* Mobile Nav Tabs */}
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelectNav(tab.id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium text-left truncate transition ${
                    activeTab === tab.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Action Buttons */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenImportModal();
                }}
                className="flex-1 py-1.5 px-3 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium flex items-center justify-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>匯入資料</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSavedFunnelsModal();
                }}
                className="py-1.5 px-3 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center space-x-1"
              >
                <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
                <span>已存 ({savedFunnelsCount})</span>
              </button>

              {funnelResult && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    exportFunnelMetricsCSV(funnelResult);
                  }}
                  className="py-1.5 px-3 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>匯出 CSV</span>
                </button>
              )}
            </div>

            {/* Dataset quick switch on mobile */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="block mb-1 font-semibold">快速切換資料集：</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_DATASETS.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => {
                      onSelectSampleDataset(ds);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] border transition ${
                      currentDataset?.id === ds.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {ds.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
