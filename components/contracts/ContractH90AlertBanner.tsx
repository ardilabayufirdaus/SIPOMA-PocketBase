import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrichedContract } from '../../hooks/useContractsData';

interface ContractH90AlertBannerProps {
  contracts: EnrichedContract[];
  onSelectContract: (contract: EnrichedContract) => void;
  onFilterH90: () => void;
  t?: Record<string, string>;
}

export const ContractH90AlertBanner: React.FC<ContractH90AlertBannerProps> = ({
  contracts,
  onSelectContract,
  onFilterH90,
  t = {},
}) => {
  // Find contracts that are H-90 (daysRemaining >= 0 && daysRemaining <= 90)
  const expiringContracts = contracts
    .filter((c) => c.isH90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  if (expiringContracts.length === 0) return null;

  const criticalContracts = expiringContracts.filter((c) => c.isH30);
  const mostUrgent = expiringContracts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4 shadow-sm relative overflow-hidden"
      >
        {/* Background glow element */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5 md:mt-0">
              <svg
                className="w-5 h-5 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>
                    {t.h90_alert_banner_title || 'Peringatan Masa Berlaku Kontrak (H-90)'}
                  </span>
                  <span className="bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                    {expiringContracts.length} {t.h90_warning_badge || 'Mendekati Habis (H-90)'}
                  </span>
                </h4>
                {criticalContracts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    {criticalContracts.length} {t.h30_critical_badge || 'Kritis (<30 Hari)'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {mostUrgent && (
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    <span className="underline">{mostUrgent.po_number}</span> (
                    {mostUrgent.contract_title.slice(0, 45)}...) •{' '}
                    <strong className="text-rose-600 dark:text-rose-400">
                      {mostUrgent.daysRemaining} {t.days_left || 'hari lagi'}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            {mostUrgent && (
              <button
                onClick={() => onSelectContract(mostUrgent)}
                className="flex-1 md:flex-initial px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {t.contract_detail || 'Lihat Detail PO'}
              </button>
            )}
            <button
              onClick={onFilterH90}
              className="flex-1 md:flex-initial px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{t.view_all_h90 || 'Lihat Semua H-90'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContractH90AlertBanner;
