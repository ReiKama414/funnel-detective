import React, { useState } from 'react';
import { X, Download, UserX, UserCheck, Search, HardDrive } from 'lucide-react';
import { RawEvent, StepResult } from '../types/funnel';
import { exportUserCohortCSV } from '../utils/export';
import { saveCohort } from '../services/db';

interface DropOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: StepResult | null;
  type: 'dropped' | 'reached';
  allEvents: RawEvent[];
  datasetId?: string;
}

export const DropOffModal: React.FC<DropOffModalProps> = ({
  isOpen,
  onClose,
  step,
  type,
  allEvents,
  datasetId = 'default',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [persistedNotice, setPersistedNotice] = useState(false);

  if (!isOpen || !step) return null;

  const userIds = type === 'dropped' ? step.usersDropped : step.usersReached;
  const isDropped = type === 'dropped';

  // Filter user IDs by search query
  const filteredUserIds = userIds.filter((uid) =>
    uid.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleExport = async () => {
    const cohortName = isDropped
      ? `${step.stepName}_流失名單`
      : `${step.stepName}_推進名單`;

    // Download CSV
    exportUserCohortCSV(cohortName, userIds, allEvents);

    // Persist to IndexedDB
    try {
      await saveCohort({
        id: `cohort_${Date.now()}`,
        name: cohortName,
        datasetId,
        stepName: step.stepName,
        type,
        userIds,
        createdAt: Date.now(),
      });
      setPersistedNotice(true);
      setTimeout(() => setPersistedNotice(false), 3000);
    } catch {
      // Ignore idb storage errors gracefully
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                isDropped
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
              }`}
            >
              {isDropped ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate m-0">
                {isDropped ? '流失用戶名單' : '抵達用戶名單'}：{step.stepName}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                共 {userIds.length.toLocaleString()} 位獨立匿名使用者
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {/* Controls: Search + Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋 User ID..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {persistedNotice && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>已備份</span>
                </span>
              )}

              <button
                onClick={handleExport}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出名單 CSV</span>
              </button>
            </div>
          </div>

          {/* User ID List Table */}
          <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/60 max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 font-medium">
                <tr>
                  <th className="px-3 sm:px-4 py-1.5">序號</th>
                  <th className="px-3 sm:px-4 py-1.5">User ID</th>
                  <th className="px-3 sm:px-4 py-1.5 text-right">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {filteredUserIds.slice(0, 100).map((uid, index) => (
                  <tr key={uid} className="hover:bg-slate-100/60 dark:hover:bg-slate-900/50">
                    <td className="px-3 sm:px-4 py-1.5 text-slate-400">{index + 1}</td>
                    <td className="px-3 sm:px-4 py-1.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{uid}</td>
                    <td className="px-3 sm:px-4 py-1.5 text-right">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isDropped
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDropped ? '已流失' : '已推進'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUserIds.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      查無符合「{searchQuery}」的用戶
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUserIds.length > 100 && (
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 m-0">
              顯示前 100 筆，其餘可透過上方「匯出名單 CSV」下載完整名單。
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
