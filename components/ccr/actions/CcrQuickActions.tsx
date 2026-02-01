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
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {t.quick_actions || 'Quick Actions'}
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={isDisabled || isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title={t.refresh_data || 'Refresh Data'}
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">{t.refresh || 'Refresh'}</span>
          </motion.button>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isDisabled || isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title={t.export_to_excel || 'Export to Excel'}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span className="font-medium">{t.export || 'Export'}</span>
          </motion.button>

          {/* Import Button - Only if can write */}
          {canWrite && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImport}
              disabled={isDisabled}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={t.import_from_excel || 'Import from Excel'}
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              <span className="font-medium">{t.import || 'Import'}</span>
            </motion.button>
          )}

          {/* Delete All Button - Only if can write */}
          {canWrite && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteAll}
              disabled={isDisabled}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={t.delete_all_data || 'Delete All Data'}
            >
              <TrashIcon className="w-5 h-5" />
              <span className="font-medium">{t.delete_all || 'Delete All'}</span>
            </motion.button>
          )}
        </div>
      </div>
    );
  }
);

CcrQuickActions.displayName = 'CcrQuickActions';

export default CcrQuickActions;
