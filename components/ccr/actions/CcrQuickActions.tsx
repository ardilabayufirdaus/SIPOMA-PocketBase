import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface CcrQuickActionsProps {
  t: Record<string, string>;
  selectedCategory: string;
  selectedUnit: string;
  selectedDate: string;
  canWrite: boolean;
  isRefreshing: boolean;
  isExporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onImport: () => void;
  onMonthlyExportImport?: () => void;
  onDeleteAll: () => void;
}

const CcrQuickActions: React.FC<CcrQuickActionsProps> = memo(
  ({
    t,
    selectedCategory,
    selectedUnit,
    selectedDate,
    canWrite,
    isRefreshing,
    isExporting,
    onRefresh,
    onExport,
    onImport,
    onMonthlyExportImport,
    onDeleteAll,
  }) => {
    const isDisabled = !selectedCategory || !selectedUnit || !selectedDate;

    // Memoize individual button handlers
    const handleRefresh = useCallback(() => {
      if (!isDisabled && !isRefreshing) {
        onRefresh();
      }
    }, [isDisabled, isRefreshing, onRefresh]);

    const handleExport = useCallback(() => {
      if (!isDisabled && !isExporting) {
        onExport();
      }
    }, [isDisabled, isExporting, onExport]);

    const handleImport = useCallback(() => {
      if (!isDisabled && canWrite) {
        onImport();
      }
    }, [isDisabled, canWrite, onImport]);

    const handleDeleteAll = useCallback(() => {
      if (!isDisabled && canWrite) {
        onDeleteAll();
      }
    }, [isDisabled, canWrite, onDeleteAll]);

    return (
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {t.quick_actions}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.quick_actions_desc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Refresh Button - Secondary */}
            <button
              onClick={handleRefresh}
              disabled={isDisabled || isRefreshing}
              aria-label={t.refresh_data || 'Refresh Data'}
              className="min-h-[36px] h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.refresh_data || 'Refresh Data'}
            >
              <ArrowPathIcon
                className={`w-4 h-4 text-primary-600 dark:text-primary-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{t.refresh || 'Refresh'}</span>
            </button>

            {/* Export Button - Primary */}
            <button
              onClick={handleExport}
              disabled={isDisabled || isExporting}
              aria-label={t.export_to_excel || 'Export ke Excel'}
              className="min-h-[36px] h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500/50 rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.export_to_excel || 'Export ke Excel'}
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>{t.export || 'Export'}</span>
            </button>

            {/* Import Button - Secondary */}
            {canWrite && (
              <button
                onClick={handleImport}
                disabled={isDisabled}
                aria-label={t.import_from_excel || 'Import dari Excel'}
                className="min-h-[36px] h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.import_from_excel || 'Import dari Excel'}
              >
                <DocumentArrowUpIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>{t.import || 'Import'}</span>
              </button>
            )}

            {/* Monthly Export/Import Button - Secondary */}
            {onMonthlyExportImport && (
              <button
                onClick={onMonthlyExportImport}
                aria-label="Ekspor & Impor Data Bulanan"
                className="min-h-[36px] h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                title="Ekspor & Impor Data Bulanan"
              >
                <DocumentArrowDownIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bulanan (Excel)</span>
              </button>
            )}

            {/* Delete All Button - Danger */}
            {canWrite && (
              <button
                onClick={handleDeleteAll}
                disabled={isDisabled}
                aria-label={t.delete_all_data || 'Hapus Semua Data'}
                className="min-h-[36px] h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/50 rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.delete_all_data || 'Hapus Semua Data'}
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t.delete_all || 'Reset'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CcrQuickActions.displayName = 'CcrQuickActions';

export default CcrQuickActions;
