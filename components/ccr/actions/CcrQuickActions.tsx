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
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#772953]/20 to-[#E95420]/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 transition-all duration-300 h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#772953] to-[#E95420] flex items-center justify-center shadow-lg shadow-[#772953]/30 ring-4 ring-[#772953]/10">
              <svg
                className="w-6 h-6 text-white"
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
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isDisabled || isRefreshing}
              className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:translate-y-0"
              title={t.refresh_data || 'Refresh Data'}
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-bold tracking-wide">{t.refresh || 'Refresh'}</span>
            </motion.button>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={isDisabled || isExporting}
              className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:translate-y-0"
              title={t.export_to_excel || 'Export ke Excel'}
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="font-bold tracking-wide">{t.export || 'Export'}</span>
            </motion.button>

            {/* Import Button - Only if can write */}
            {canWrite && (
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImport}
                disabled={isDisabled}
                className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:translate-y-0"
                title={t.import_from_excel || 'Import dari Excel'}
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                <span className="font-bold tracking-wide">{t.import || 'Import'}</span>
              </motion.button>
            )}

            {/* Delete All Button - Only if can write */}
            {canWrite && (
              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteAll}
                disabled={isDisabled}
                className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:translate-y-0"
                title={t.delete_all_data || 'Hapus Semua Data'}
              >
                <TrashIcon className="w-5 h-5" />
                <span className="font-bold tracking-wide">{t.delete_all || 'Reset'}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CcrQuickActions.displayName = 'CcrQuickActions';

export default CcrQuickActions;
