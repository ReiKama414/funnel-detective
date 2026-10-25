import React, { useState } from 'react';
import {
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

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funnelNameInput.trim()) return;
    setIsSaving(true);
    try {
      await onSaveCurrentFunnel(funnelNameInput.trim());
      setSuccessMessage('已成功持久化至 IndexedDB');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCohort = (cohort: StoredCohort) => {
    exportUserCohortCSV(cohort.name, cohort.userIds, allEvents);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">IndexedDB 本地資料庫管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <button
              onClick={() => setActiveTab('funnels')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeTab === 'funnels'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              已存漏斗設定 ({savedFunnels.length})
            </button>
            <button
              onClick={() => setActiveTab('cohorts')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                activeTab === 'cohorts'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              已存受眾名單 ({savedCohorts.length})
            </button>
          </div>

          {activeTab === 'funnels' && (
            <div className="space-y-3.5">
              {/* Quick Save Current Funnel Form */}
              <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">
                  將目前配置儲存至 IndexedDB：
                </span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={funnelNameInput}
                    onChange={(e) => setFunnelNameInput(e.target.value)}
                    placeholder="輸入儲存名稱..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !funnelNameInput.trim()}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center space-x-1.5 transition shrink-0"
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
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">已存清單：</span>
                {savedFunnels.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                    目前尚未儲存任何自訂漏斗配置。可在上方輸入名稱後儲存。
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                    {savedFunnels.map((sf) => (
                      <div
                        key={sf.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate m-0">{sf.name}</h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>{sf.config.steps.length} 步</span>
                            <span>•</span>
                            <span>{sf.config.conversionWindow.value} {sf.config.conversionWindow.unit}</span>
                            <span>•</span>
                            <span>{new Date(sf.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onLoadFunnel(sf.config);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition"
                          >
                            載入
                          </button>
                          <button
                            onClick={() => onDeleteFunnel(sf.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
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
                <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                  目前尚未儲存任何受眾名單。在漏斗圖點擊「查看流失名單」並匯出時，受眾將自動備份至此。
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                  {savedCohorts.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate m-0">{sc.name}</h4>
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
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium flex items-center space-x-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => onDeleteCohort(sc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
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
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
