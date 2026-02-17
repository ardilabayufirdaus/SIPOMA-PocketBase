import React from 'react';
import { UnitStatus } from '../../hooks/useDashboardData';
import { Page } from '../../types';

interface OperationsOverviewProps {
  unitStatuses: UnitStatus[];
  topDowntimes: { unit: string; issue: string; isRkc: boolean }[];
  onNavigate: (page: Page, subPage?: string) => void;
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

  const StatusPill: React.FC<{ unit: UnitStatus }> = ({ unit }) => (
    <div
      className={`
        group relative px-2.5 py-2.5 rounded-lg text-xs font-semibold border flex flex-col justify-between items-start gap-1 transition-all duration-200 h-full
        ${
          unit.status === 'running'
            ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30 dark:hover:bg-emerald-900/20'
            : 'bg-rose-50/50 text-rose-700 border-rose-100 hover:bg-rose-50 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/30 dark:hover:bg-rose-900/20'
        }
      `}
      title={unit.issue || (t.running_normal || 'Running Normal')}
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
          {unit.issue || (t.stopped || 'Stopped')}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 lg:gap-6">
      {/* Top Section: Unit Statuses */}
      <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 min-h-[170px]">
        {/* CM Operations */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#F7F7F7] dark:bg-slate-900/50">
            <h3 className="text-[11px] font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#772953] rounded-full"></span> Operasional CM
            </h3>
            <button
              onClick={() => onNavigate('operations', 'op_dashboard')}
              className="text-[10px] font-bold text-[#E95420] hover:underline uppercase tracking-tight"
            >
              LIHAT SEMUA
            </button>
          </div>
          <div className="p-3.5 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2.5">
              {cmUnits.slice(0, 8).map((unit) => (
                <StatusPill key={unit.id} unit={unit} />
              ))}
            </div>
            {cmUnits.length === 0 && (
              <p className="text-xs text-[#AEA79F] italic text-center py-5">
                {t.no_cm_units || 'Unit CM tidak ditemukan'}
              </p>
            )}
          </div>
        </div>

        {/* RKC Operations */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#F7F7F7] dark:bg-slate-900/50">
            <h3 className="text-[11px] font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E95420] rounded-full"></span> Operasional RKC
            </h3>
            <button
              onClick={() => onNavigate('rkc_operations', 'op_dashboard')}
              className="text-[10px] font-bold text-[#E95420] hover:underline uppercase tracking-tight"
            >
              LIHAT SEMUA
            </button>
          </div>
          <div className="p-3.5 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2.5">
              {rkcUnits.slice(0, 8).map((unit) => (
                <StatusPill key={unit.id} unit={unit} />
              ))}
            </div>
            {rkcUnits.length === 0 && (
              <p className="text-xs text-[#AEA79F] italic text-center py-5">
                {t.no_rkc_units || 'Unit RKC tidak ditemukan'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Alerts List */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-[#F7F7F7] dark:bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center">
          <h4 className="text-xs font-bold text-[#333333] dark:text-slate-200 uppercase tracking-widest">
            Isu Terbaru
          </h4>
          <span className="bg-[#EF2D56] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-[0.1em]">
            Live Feed
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {topDowntimes.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {topDowntimes.map((downtime, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default"
                >
                  <div
                    className={`w-1 h-8 rounded-full flex-shrink-0 ${downtime.isRkc ? 'bg-[#E95420]' : 'bg-[#772953]'} opacity-40 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-[#333333] dark:text-slate-200 uppercase tracking-tight">
                        {downtime.unit}
                      </span>
                      <span className="text-[10px] font-bold text-[#AEA79F] uppercase">
                        Hari Ini
                      </span>
                    </div>
                    <p className="text-xs text-[#808080] dark:text-slate-400 truncate group-hover:text-[#333333] dark:group-hover:text-slate-200 transition-colors font-medium">
                      {downtime.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#AEA79F] p-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F7F7F7] dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <svg
                  className="w-6 h-6 opacity-40"
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
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Tidak ada isu aktif yang dilaporkan.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
