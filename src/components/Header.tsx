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
  Laptop,
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

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform -rotate-45" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Funnel Detective
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  工作台
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="flex items-center space-x-1.5 px-2 py-1.5 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
                title={`目前主題: ${theme}`}
                data-testid="theme-toggle-btn"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-[11px] capitalize">
                  {theme === 'system' ? '系統' : theme === 'light' ? '淺色' : '深色'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {themeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-32 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        setTheme('system');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                        theme === 'system' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>系統跟隨</span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('light');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                        theme === 'light' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
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
                      className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                        theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
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
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="管理 IndexedDB 中的已儲存漏斗"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>已存漏斗</span>
              {savedFunnelsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-amber-300">
                  {savedFunnelsCount}
                </span>
              )}
            </button>

            {/* Dataset Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="max-w-[140px] truncate">
                  {currentDataset ? currentDataset.name : '自訂匯入資料'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {datasetDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDatasetDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-72 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      內建範例資料集
                    </div>
                    {SAMPLE_DATASETS.map((ds) => (
                      <button
                        key={ds.id}
                        onClick={() => {
                          onSelectSampleDataset(ds);
                          setDatasetDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                          currentDataset?.id === ds.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-2 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span className="font-semibold">{ds.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ds.description}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setDatasetDropdownOpen(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上傳 CSV / JSON 檔案...</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Ingestion Button */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>匯入資料</span>
            </button>

            {/* Export Dropdown */}
            {funnelResult && (
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                  <span>匯出</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {exportDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50">
                      <button
                        onClick={() => {
                          exportFunnelMetricsCSV(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>匯出指標 CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportFunnelJSON(funnelResult);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition"
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
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="切換主題"
              data-testid="theme-toggle-btn-mobile"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="功能導覽選單"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <div className="hidden md:flex items-center justify-between border-t border-slate-200 dark:border-slate-800 py-1.5 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto min-w-0">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectNav(tab.id)}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>IndexedDB 已連線</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>事件：<strong className="text-slate-900 dark:text-slate-200 font-mono">{totalEventsCount.toLocaleString()}</strong> 筆</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>獨立用戶：<strong className="text-slate-900 dark:text-slate-200 font-mono">{uniqueUsersCount.toLocaleString()}</strong> 人</span>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-3 animate-in fade-in duration-150">
            {/* Mobile Nav Tabs */}
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelectNav(tab.id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium text-left truncate transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Action Buttons */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenImportModal();
                }}
                className="flex-1 py-1.5 px-3 rounded bg-indigo-600 text-white font-medium flex items-center justify-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>匯入資料</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSavedFunnelsModal();
                }}
                className="py-1.5 px-3 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>已存 ({savedFunnelsCount})</span>
              </button>

              {funnelResult && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    exportFunnelMetricsCSV(funnelResult);
                  }}
                  className="py-1.5 px-3 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>匯出 CSV</span>
                </button>
              )}
            </div>

            {/* Dataset quick switch on mobile */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
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
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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
