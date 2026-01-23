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
        px-3 py-2 rounded-lg text-xs font-medium border flex justify-between items-center
        ${
          unit.status === 'running'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30'
            : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30'
        }
      `}
      title={unit.issue || 'Running Normal'}
    >
      <span className="truncate max-w-[100px]">{unit.unit}</span>
      <span
        className={`w-2 h-2 rounded-full ${unit.status === 'running' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* CM Operations */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full" />
            CM Operations
          </h3>
          <button
            onClick={() => onNavigate('operations', 'op_dashboard')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Dashboard &rarr;
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {cmUnits.slice(0, 6).map((unit) => (
              <StatusPill key={unit.id} unit={unit} />
            ))}
          </div>
          {cmUnits.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-4">No CM units found</p>
          )}
        </div>
      </motion.div>

      {/* RKC Operations */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full" />
            RKC Operations
          </h3>
          <button
            onClick={() => onNavigate('rkc_operations', 'op_dashboard')}
            className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
          >
            View Full Dashboard &rarr;
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {rkcUnits.slice(0, 6).map((unit) => (
              <StatusPill key={unit.id} unit={unit} />
            ))}
          </div>
          {rkcUnits.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-4">No RKC units found</p>
          )}
        </div>
      </motion.div>

      {/* Recent Alerts (Full Width below split view) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="col-span-1 lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
      >
        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
          Latest Production Alerts
        </h4>
        <div className="space-y-2">
          {topDowntimes.length > 0 ? (
            topDowntimes.map((downtime, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${downtime.isRkc ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {downtime.unit}
                    </p>
                    <p className="text-xs text-slate-500">{downtime.issue}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">Today</span>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-center text-slate-500">
              No active alerts required attention.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OperationsOverview;
