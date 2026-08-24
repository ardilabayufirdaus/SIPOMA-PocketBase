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
      <div className="relative group h-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-900/20 to-primary-600/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 transition-all duration-300 h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-secondary-900 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-primary-500/10">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800">
                {t.quick_actions}
              </h3>
              <p className="text-sm font-medium text-slate-500">{t.quick_actions_desc}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Refresh Button - Secondary */}
            <button
              onClick={handleRefresh}
              disabled={isDisabled || isRefreshing}
              aria-label={t.refresh_data || 'Refresh Data'}
              className="min-h-[44px] flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.refresh_data || 'Refresh Data'}
            >
              <ArrowPathIcon
                className={`w-5 h-5 text-primary-600 dark:text-primary-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="font-bold tracking-wide">{t.refresh || 'Refresh'}</span>
            </button>

            {/* Export Button - Primary */}
            <button
              onClick={handleExport}
              disabled={isDisabled || isExporting}
              aria-label={t.export_to_excel || 'Export ke Excel'}
              className="min-h-[44px] flex items-center gap-2.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.export_to_excel || 'Export ke Excel'}
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="font-bold tracking-wide">{t.export || 'Export'}</span>
            </button>

            {/* Import Button - Secondary */}
            {canWrite && (
              <button
                onClick={handleImport}
                disabled={isDisabled}
                aria-label={t.import_from_excel || 'Import dari Excel'}
                className="min-h-[44px] flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.import_from_excel || 'Import dari Excel'}
              >
                <DocumentArrowUpIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="font-bold tracking-wide">{t.import || 'Import'}</span>
              </button>
            )}

            {/* Monthly Export/Import Button - Secondary */}
            {onMonthlyExportImport && (
              <button
                onClick={onMonthlyExportImport}
                aria-label="Ekspor & Impor Data Bulanan"
                className="min-h-[44px] flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                title="Ekspor & Impor Data Bulanan"
              >
                <DocumentArrowDownIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold tracking-wide">Bulanan (Excel)</span>
              </button>
            )}

            {/* Delete All Button - Danger */}
            {canWrite && (
              <button
                onClick={handleDeleteAll}
                disabled={isDisabled}
                aria-label={t.delete_all_data || 'Hapus Semua Data'}
                className="min-h-[44px] flex items-center gap-2.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.delete_all_data || 'Hapus Semua Data'}
              >
                <TrashIcon className="w-5 h-5" />
                <span className="font-bold tracking-wide">{t.delete_all || 'Reset'}</span>
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
