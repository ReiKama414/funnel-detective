import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { FunnelResult, SegmentedFunnelResult } from '../types/funnel';
import { generateDetectiveReport } from '../engine/detective';

interface DetectiveInsightsProps {
  funnel: FunnelResult;
  segmentedResult?: SegmentedFunnelResult;
}

export const DetectiveInsights: React.FC<DetectiveInsightsProps> = ({
  funnel,
  segmentedResult,
}) => {
  const insights = React.useMemo(() => {
    return generateDetectiveReport(funnel, segmentedResult);
  }, [funnel, segmentedResult]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-1.5 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide m-0">
              漏斗偵探智慧診斷報告
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 m-0">
              演算法自動巡檢流失斷點、滯留延遲與分群異差，提供即戰力優化建議
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.map((item) => {
          let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
          let borderClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
          let iconColor = 'text-indigo-600 dark:text-indigo-400';
          let IconComponent = Lightbulb;

          if (item.type === 'danger') {
            badgeClass = 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30';
            borderClass = 'border-rose-200 dark:border-rose-500/40 bg-rose-50/40 dark:bg-slate-900';
            iconColor = 'text-rose-600 dark:text-rose-400';
            IconComponent = ShieldAlert;
          } else if (item.type === 'warning') {
            badgeClass = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
            borderClass = 'border-amber-200 dark:border-amber-500/40 bg-amber-50/40 dark:bg-slate-900';
            iconColor = 'text-amber-600 dark:text-amber-400';
            IconComponent = AlertTriangle;
          } else if (item.type === 'success') {
            badgeClass = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
            borderClass = 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-slate-900';
            iconColor = 'text-emerald-600 dark:text-emerald-400';
            IconComponent = CheckCircle;
          } else {
            badgeClass = 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30';
            borderClass = 'border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-slate-900';
            iconColor = 'text-indigo-600 dark:text-indigo-400';
            IconComponent = TrendingUp;
          }

          return (
            <div
              key={item.id}
              className={`border rounded-xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between transition-colors ${borderClass}`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <IconComponent className={`w-4 h-4 shrink-0 ${iconColor}`} />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words m-0">
                      {item.title}
                    </h3>
                  </div>
                  {item.metricBadge && (
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}
                    >
                      {item.metricBadge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                  {item.description}
                </p>
              </div>

              {item.recommendation && (
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:p-4 rounded-b-xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 px-1.5 py-0.2 rounded shrink-0">
                      偵探建議
                    </span>
                    <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-normal m-0">
                      {item.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
