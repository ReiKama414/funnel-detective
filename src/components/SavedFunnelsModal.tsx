import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  X,
  Save,
  FolderOpen,
  Trash2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { StoredFunnelConfig, StoredCohort } from '../services/db';
import { FunnelConfig, RawEvent } from '../types/funnel';
import { exportUserCohortCSV } from '../utils/export';
import { useEscapeKey } from '../utils/useEscapeKey';

interface SavedFunnelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFunnels: StoredFunnelConfig[];
  savedCohorts: StoredCohort[];
  currentConfig: FunnelConfig;
  allEvents: RawEvent[];
  onSaveCurrentFunnel: (name: string) => Promise<void>;
  onLoadFunnel: (config: FunnelConfig) => void;
  onDeleteFunnel: (id: string) => Promise<void>;
  onDeleteCohort: (id: string) => Promise<void>;
}

export const SavedFunnelsModal: React.FC<SavedFunnelsModalProps> = ({
  isOpen,
  onClose,
  savedFunnels,
  savedCohorts,
  currentConfig,
  allEvents,
  onSaveCurrentFunnel,
  onLoadFunnel,
  onDeleteFunnel,
  onDeleteCohort,
}) => {
  const [activeTab, setActiveTab] = useState<'funnels' | 'cohorts'>('funnels');
  const [funnelNameInput, setFunnelNameInput] = useState(currentConfig.name);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  if (!isOpen) return null;

  const currentEventNames = new Set(allEvents.map((e) => e.eventName.trim().toLowerCase()));
  const hasMissingEvents = (cfg: FunnelConfig) =>
    allEvents.length > 0 &&
    cfg.steps.some((s) => !currentEventNames.has(s.eventName.trim().toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funnelNameInput.trim()) return;
    setIsSaving(true);
    try {
      await onSaveCurrentFunnel(funnelNameInput.trim());
      setSuccessMessage('已成功持久化至 IndexedDB');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCohort = (cohort: StoredCohort) => {
    exportUserCohortCSV(cohort.name, cohort.userIds, allEvents);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 m-0">IndexedDB 本地資料庫管理</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <button
              onClick={() => setActiveTab('funnels')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeTab === 'funnels'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              已存漏斗設定 ({savedFunnels.length})
            </button>
            <button
              onClick={() => setActiveTab('cohorts')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeTab === 'cohorts'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              已存受眾名單 ({savedCohorts.length})
            </button>
          </div>

          {activeTab === 'funnels' && (
            <div className="space-y-3.5">
              {/* Quick Save Current Funnel Form */}
              <form onSubmit={handleSave} className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-2">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 block">
                  將目前配置儲存至 IndexedDB：
                </span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={funnelNameInput}
                    onChange={(e) => setFunnelNameInput(e.target.value)}
                    placeholder="輸入儲存名稱..."
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !funnelNameInput.trim()}
                    className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 rounded text-xs font-medium flex items-center space-x-1.5 transition shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? '儲存中...' : '儲存配置'}</span>
                  </button>
                </div>
                {successMessage && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 m-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{successMessage}</span>
                  </p>
                )}
              </form>

              {/* Saved Funnels List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">已存清單：</span>
                {savedFunnels.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                    目前尚未儲存任何自訂漏斗配置。可在上方輸入名稱後儲存。
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
                    {savedFunnels.map((sf) => (
                      <div
                        key={sf.id}
                        className="p-3 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate m-0">{sf.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            <span>{sf.config.steps.length} 步</span>
                            <span>•</span>
                            <span>{sf.config.conversionWindow.value} {sf.config.conversionWindow.unit}</span>
                            <span>•</span>
                            <span>{new Date(sf.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {hasMissingEvents(sf.config) && (
                            <p className="flex items-center space-x-1 text-[11px] text-amber-600 dark:text-amber-400 m-0">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>含目前資料集中不存在的事件，載入後步驟可能無資料</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onLoadFunnel(sf.config);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded text-xs font-medium transition"
                          >
                            載入
                          </button>
                          <button
                            onClick={() => onDeleteFunnel(sf.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cohorts' && (
            <div className="space-y-2.5">
              {savedCohorts.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
                  目前尚未儲存任何受眾名單。在漏斗圖點擊「查看流失名單」並匯出時，受眾將自動備份至此。
                </p>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
                  {savedCohorts.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate m-0">{sc.name}</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                              sc.type === 'dropped'
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {sc.type === 'dropped' ? '流失群' : '留存群'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>{sc.userIds.length} 人</span>
                          <span>•</span>
                          <span className="truncate">{sc.stepName}</span>
                          <span>•</span>
                          <span>{new Date(sc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleDownloadCohort(sc)}
                          className="px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-medium flex items-center space-x-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => onDeleteCohort(sc.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50 dark:bg-zinc-950/40">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
