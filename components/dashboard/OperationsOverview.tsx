import React from 'react';
import { motion } from 'framer-motion';
import { UnitStatus } from '../../hooks/useDashboardData';

interface OperationsOverviewProps {
  unitStatuses: UnitStatus[];
  topDowntimes: { unit: string; issue: string; isRkc: boolean }[];
  onNavigate: (page: any, subPage?: string) => void;
  t: Record<string, string>;
}

const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  unitStatuses,
  topDowntimes,
  onNavigate,
  t,
}) => {
  const cmUnits = unitStatuses.filter((u) => !u.isRkc);
  const rkcUnits = unitStatuses.filter((u) => u.isRkc);

  const StatusPill = ({ unit }: { unit: UnitStatus }) => (
    <div
      className={`
        group relative px-2.5 py-2.5 rounded-lg text-xs font-semibold border flex flex-col justify-between items-start gap-1 transition-all duration-200 h-full
        ${
          unit.status === 'running'
            ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30 dark:hover:bg-emerald-900/20'
            : 'bg-rose-50/50 text-rose-700 border-rose-100 hover:bg-rose-50 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/30 dark:hover:bg-rose-900/20'
        }
      `}
      title={unit.issue || 'Running Normal'}
    >
      <div className="flex justify-between w-full items-center">
        <span className="truncate w-full font-bold">{unit.unit}</span>
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0 ml-1">
          {unit.status !== 'running' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${unit.status === 'running' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
        </span>
      </div>
      {unit.status !== 'running' && (
        <span className="text-[9px] leading-tight line-clamp-1 opacity-80 w-full">
          {unit.issue || 'Stopped'}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-3 lg:gap-5 overflow-hidden">
      {/* Top Section: Unit Statuses */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-3 lg:gap-5 h-[160px]">
        {/* CM Operations */}
        <div className="flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-4 py-2 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> CM
            </h3>
            <button
              onClick={() => onNavigate('operations', 'op_dashboard')}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              VIEW
            </button>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {cmUnits.slice(0, 8).map((unit) => (
                <StatusPill key={unit.id} unit={unit} />
              ))}
            </div>
            {cmUnits.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">No CM units found</p>
            )}
          </div>
        </div>

        {/* RKC Operations */}
        <div className="flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-4 py-2 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> RKC
            </h3>
            <button
              onClick={() => onNavigate('rkc_operations', 'op_dashboard')}
              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              VIEW
            </button>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {rkcUnits.slice(0, 8).map((unit) => (
                <StatusPill key={unit.id} unit={unit} />
              ))}
            </div>
            {rkcUnits.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">No RKC units found</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Alerts List */}
      <div className="flex-1 min-h-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm flex flex-col overflow-hidden relative">
        <div className="px-4 py-3 border-b border-slate-100/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 sticky top-0 z-10 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            Recent Issues
          </h4>
          <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Live Feed
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {topDowntimes.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {topDowntimes.map((downtime, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 hover:bg-white/80 dark:hover:bg-slate-700/40 transition-colors group cursor-default"
                >
                  <div
                    className={`w-1.5 h-full self-stretch rounded-full flex-shrink-0 ${downtime.isRkc ? 'bg-orange-400' : 'bg-blue-400'} opacity-50 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {downtime.unit}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400">TODAY</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {downtime.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg
                  className="w-5 h-5 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-xs opacity-70">No active issues reported.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
