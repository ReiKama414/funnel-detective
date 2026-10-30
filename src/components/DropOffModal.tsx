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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
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
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate m-0">
                {isDropped ? '流失用戶名單' : '抵達用戶名單'}：{step.stepName}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 m-0">
                共 {userIds.length.toLocaleString()} 位獨立匿名使用者
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {/* Controls: Search + Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋 User ID..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded pl-8 pr-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-500"
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
                className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded text-xs font-medium flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出名單 CSV</span>
              </button>
            </div>
          </div>

          {/* User ID List Table */}
          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950/60 max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 font-medium">
                <tr>
                  <th className="px-3 sm:px-4 py-1.5">序號</th>
                  <th className="px-3 sm:px-4 py-1.5">User ID</th>
                  <th className="px-3 sm:px-4 py-1.5 text-right">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUserIds.slice(0, 100).map((uid, index) => (
                  <tr key={uid} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50">
                    <td className="px-3 sm:px-4 py-1.5 text-zinc-400">{index + 1}</td>
                    <td className="px-3 sm:px-4 py-1.5 font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{uid}</td>
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
                    <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                      查無符合「{searchQuery}」的用戶
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUserIds.length > 100 && (
            <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 m-0">
              顯示前 100 筆，其餘可透過上方「匯出名單 CSV」下載完整名單。
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50 dark:bg-zinc-950/40">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
