import React from 'react';
import { motion } from 'framer-motion';
import { ContractSummaryStats } from '../../types';
import { formatContractCurrencyCompact } from '../../hooks/useContractsData';

interface ContractStatsHeaderProps {
  stats: ContractSummaryStats;
  onFilterH90Click?: () => void;
  onFilterExpiredClick?: () => void;
  onFilterAllClick?: () => void;
  activeFilter?: string;
  t?: Record<string, string>;
}

export const ContractStatsHeader: React.FC<ContractStatsHeaderProps> = ({
  stats,
  onFilterH90Click,
  onFilterExpiredClick,
  onFilterAllClick,
  activeFilter,
  t = {},
}) => {
  const formatCurrency = (val: number) => {
    return formatContractCurrencyCompact(val, 'IDR');
  };

  const activeContractsPct =
    stats.totalContracts > 0 ? (stats.activeContracts / stats.totalContracts) * 100 : 0;

  const h90ContractsPct =
    stats.totalContracts > 0 ? (stats.h90ExpiringContracts / stats.totalContracts) * 100 : 0;

  const expiredContractsPct =
    stats.totalContracts > 0 ? (stats.expiredContracts / stats.totalContracts) * 100 : 0;

  // Multi-currency details
  const currencies = stats.activeCurrencies || Object.keys(stats.byCurrency || {});
  const foreignCurrencies = currencies.filter((c) => c !== 'IDR');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total & Active Contracts */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onFilterAllClick}
        className={`cursor-pointer rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 shadow-sm relative h-full flex flex-col justify-between ${
          activeFilter === 'all'
            ? 'bg-blue-50/60 dark:bg-slate-850 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t.total_contracts || 'Total Kontrak'}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.totalContracts}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {stats.activeContracts} {t.active_badge || 'Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {stats.activeContracts} {t.active_badge || 'Aktif'} ({stats.totalContracts}{' '}
              Portofolio)
            </span>
            <span className="text-blue-600 dark:text-blue-400 ml-1 shrink-0">
              {activeContractsPct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, activeContractsPct)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Total Managed Budget & Absorption (Multi-Currency Aware) */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col justify-between"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t.total_managed_budget || 'Pagu Anggaran'}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
              {formatCurrency(stats.totalBudget)}
            </h3>

            {/* Foreign Currencies Sub-Badges */}
            {foreignCurrencies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {foreignCurrencies.map((fc) => {
                  const fcData = stats.byCurrency?.[fc];
                  if (!fcData || fcData.totalBudget === 0) return null;
                  return (
                    <span
                      key={fc}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{fc}:</span>
                      <span>{formatContractCurrencyCompact(fcData.totalBudget, fc)}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {t.absorbed || 'Terserap'}: {formatCurrency(stats.totalAbsorbedBudget)}
              {foreignCurrencies.length > 0 && ` (+${foreignCurrencies.join(', ')})`}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 ml-1 shrink-0">
              {stats.overallAbsorptionPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.overallAbsorptionPercentage)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 3. Peringatan H-90 (Expiring Soon) */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onFilterH90Click}
        className={`cursor-pointer rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 shadow-sm relative overflow-hidden h-full flex flex-col justify-between ${
          activeFilter === 'h90'
            ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700'
        }`}
      >
        {stats.h90ExpiringContracts > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        )}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider truncate">
              {t.h90_expiring_count || 'Peringatan H-90'}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.h90ExpiringContracts}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                &lt;90 {t.days_left || 'hari'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {stats.h90ExpiringContracts > 0
                ? `${stats.h90ExpiringContracts} ${t.need_renewal || 'Perlu Perpanjangan'}`
                : t.all_secure || 'Status Aman'}
            </span>
            <span className="text-amber-600 dark:text-amber-400 ml-1 shrink-0">
              {h90ContractsPct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.h90ExpiringContracts > 0
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-emerald-500/50'
              }`}
              style={{
                width: `${stats.h90ExpiringContracts > 0 ? Math.min(100, Math.max(10, h90ContractsPct)) : 100}%`,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* 4. Expired Contracts */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onFilterExpiredClick}
        className={`cursor-pointer rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 shadow-sm h-full flex flex-col justify-between ${
          activeFilter === 'expired'
            ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t.expired_contracts || 'Kedaluwarsa'}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {stats.expiredContracts}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                {t.expired_badge || 'Kedaluwarsa'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {stats.expiredContracts > 0
                ? `${stats.expiredContracts} ${t.expired_badge || 'Kedaluwarsa'}`
                : t.no_expired || 'Tidak ada kedaluwarsa'}
            </span>
            <span className="text-rose-600 dark:text-rose-400 ml-1 shrink-0">
              {expiredContractsPct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.expiredContracts > 0
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={{
                width: `${stats.expiredContracts > 0 ? Math.min(100, Math.max(10, expiredContractsPct)) : 100}%`,
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContractStatsHeader;
