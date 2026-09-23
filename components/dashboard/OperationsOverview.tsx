import React from 'react';
import { UnitStatus } from '../../hooks/useDashboardData';
import { Page } from '../../types';
import { CementBallMillVector, RotaryKilnVector, VerticalRollerMillVector } from './vectors';

interface OperationsOverviewProps {
  unitStatuses: UnitStatus[];
  topDowntimes: { unit: string; issue: string; isRkc: boolean }[];
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
  language?: 'en' | 'id';
}

const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  unitStatuses,
  topDowntimes,
  onNavigate,
  t,
  language = 'id',
}) => {
  const cmUnits = unitStatuses.filter((u) => !u.isRkc);
  const rkcUnits = unitStatuses.filter((u) => u.isRkc);

  const renderUnitVector = (unit: UnitStatus, type: 'cm' | 'rkc') => {
    const unitNameLower = unit.unit.toLowerCase();

    if (type === 'cm') {
      // Khusus Cement Mill 552 dan Cement Mill 553 menggunakan Vertical Roller Mill (VRM)
      if (
        unitNameLower.includes('552') ||
        unitNameLower.includes('553') ||
        unitNameLower.includes('vrm')
      ) {
        return <VerticalRollerMillVector status={unit.status} className="w-full h-11" />;
      }
      return <CementBallMillVector status={unit.status} className="w-full h-11" />;
    }

    // Untuk RKC Operations:
    // Khusus Raw Mill menggunakan Vertical Roller Mill (VRM)
    if (
      unitNameLower.includes('raw mill') ||
      unitNameLower.includes('rm ') ||
      unitNameLower.includes('vrm')
    ) {
      return <VerticalRollerMillVector status={unit.status} className="w-full h-11" />;
    }
    // Kiln units menggunakan Rotary Kiln
    return <RotaryKilnVector status={unit.status} className="w-full h-11" />;
  };

  const UnitVectorCard: React.FC<{ unit: UnitStatus; type: 'cm' | 'rkc' }> = ({ unit, type }) => {
    const isRunning = unit.status === 'running';

    return (
      <div
        className={`
          group relative p-2 rounded-xl text-xs font-semibold border flex flex-col justify-between transition-all duration-300
          ${
            isRunning
              ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm'
              : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 hover:shadow-sm'
          }
        `}
        title={`${unit.unit}: ${unit.issue || (isRunning ? t.unit_running_normal || (language === 'en' ? 'Normal Operation' : 'Operasional Normal') : t.unit_stopped || (language === 'en' ? 'Shutdown Detected' : 'Pemberhentian Terdeteksi'))}`}
      >
        {/* Card Header: Unit Name & Status Badge */}
        <div className="flex justify-between items-center w-full mb-1">
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
            {unit.unit}
          </span>
          <span
            className={`
              inline-flex items-center gap-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider
              ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
              }`}
            />
            {isRunning ? t.unit_status_run || 'RUN' : t.unit_status_stop || 'STOP'}
          </span>
        </div>

        {/* Central Vector Illustration */}
        <div className="w-full my-0.5 flex items-center justify-center">
          {renderUnitVector(unit, type)}
        </div>

        {/* Footer: Issue or Running Status */}
        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 w-full text-[9px]">
          {!isRunning ? (
            <p className="text-rose-600 dark:text-rose-400 font-semibold truncate leading-tight">
              {unit.issue ||
                t.unit_stopped ||
                (language === 'en' ? 'Shutdown Detected' : 'Pemberhentian Terdeteksi')}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium truncate leading-tight">
              {t.unit_running_normal ||
                (language === 'en' ? 'Normal Operation' : 'Operasional Normal')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-2.5 sm:gap-3 overflow-hidden">
      {/* Top Section: Unit Statuses (CM & RKC) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {/* CM Operations */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/50 flex-shrink-0">
            <h2 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></span>{' '}
              {t.unit_cm_title || 'CM Operations'}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('operations', 'op_dashboard')}
              className="min-h-[26px] px-2 py-0.5 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-tight flex-shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none transition-colors"
            >
              {t.unit_view_all || (language === 'en' ? 'VIEW ALL' : 'LIHAT SEMUA')}
            </button>
          </div>
          <div className="p-2.5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {cmUnits.slice(0, 8).map((unit) => (
                <UnitVectorCard key={unit.id} unit={unit} type="cm" />
              ))}
            </div>
            {cmUnits.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                {t.unit_no_units ||
                  (language === 'en' ? 'No units found' : 'Tidak ada unit ditemukan')}
              </p>
            )}
          </div>
        </div>

        {/* RKC Operations */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/50 flex-shrink-0">
            <h2 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></span>{' '}
              {t.unit_rkc_title || 'RKC Operations'}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('rkc_operations', 'op_dashboard')}
              className="min-h-[26px] px-2 py-0.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none transition-colors"
            >
              {t.unit_view_all || (language === 'en' ? 'VIEW ALL' : 'LIHAT SEMUA')}
            </button>
          </div>
          <div className="p-2.5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {rkcUnits.slice(0, 8).map((unit) => (
                <UnitVectorCard key={unit.id} unit={unit} type="rkc" />
              ))}
            </div>
            {rkcUnits.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                {t.unit_no_units ||
                  (language === 'en' ? 'No units found' : 'Tidak ada unit ditemukan')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Alerts List */}
      <div className="h-[120px] sm:h-[130px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
        <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center flex-shrink-0">
          <h3 className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
            {t.unit_latest_issues ||
              (language === 'en' ? 'Latest Issues (Downtime)' : 'Isu Terkini (Downtime)')}
          </h3>
          <span className="bg-rose-500 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {t.unit_live_feed || 'Live Feed'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
          {topDowntimes.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topDowntimes.map((downtime, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default"
                >
                  <div
                    className={`w-1 h-6 rounded-full flex-shrink-0 ${downtime.isRkc ? 'bg-amber-500' : 'bg-cyan-500'} opacity-70 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                        {downtime.unit}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase flex-shrink-0 ml-2">
                        {t.unit_today || (language === 'en' ? 'Today' : 'Hari Ini')}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors font-medium">
                      {downtime.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 gap-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <svg
                  className="w-4 h-4 text-emerald-500 opacity-80"
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                {t.unit_no_active_issues ||
                  (language === 'en'
                    ? 'No active downtime issues.'
                    : 'Tidak ada isu downtime aktif.')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
