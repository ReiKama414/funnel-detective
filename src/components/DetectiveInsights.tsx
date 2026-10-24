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
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 m-0">漏斗偵探智慧診斷報告</h2>
            <p className="text-xs text-slate-400 m-0">
              演算法自動巡檢流失斷點、滯留延遲與分群異差，提供即戰力優化建議
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => {
          let badgeClass = 'bg-slate-800 text-slate-300';
          let borderClass = 'border-slate-800';
          let IconComponent = Lightbulb;

          if (item.type === 'danger') {
            badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            borderClass = 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 to-slate-950';
            IconComponent = ShieldAlert;
          } else if (item.type === 'warning') {
            badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            borderClass = 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-slate-950';
            IconComponent = AlertTriangle;
          } else if (item.type === 'success') {
            badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            borderClass = 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-950';
            IconComponent = CheckCircle;
          } else {
            badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            borderClass = 'border-indigo-500/40 bg-gradient-to-br from-indigo-950/20 to-slate-950';
            IconComponent = TrendingUp;
          }

          return (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between ${borderClass}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-100 m-0">{item.title}</h3>
                  </div>
                  {item.metricBadge && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                    >
                      {item.metricBadge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  {item.description}
                </p>
              </div>

              {item.recommendation && (
                <div className="pt-3 border-t border-slate-800/80 bg-slate-950/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded shrink-0">
                      偵探建議
                    </span>
                    <p className="text-xs text-slate-300/90 leading-tight m-0">
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
