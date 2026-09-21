import React from 'react';
import { ContractFilterState } from '../../types';

interface ContractFilterBarProps {
  filterState: ContractFilterState;
  onFilterChange: (updates: Partial<ContractFilterState>) => void;
  categories: string[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddClick: () => void;
  onExportClick?: () => void;
  totalFilteredCount: number;
  t?: Record<string, string>;
  canWrite?: boolean;
}

export const ContractFilterBar: React.FC<ContractFilterBarProps> = ({
  filterState,
  onFilterChange,
  categories,
  viewMode,
  onViewModeChange,
  onAddClick,
  onExportClick,
  totalFilteredCount,
  t = {},
  canWrite = true,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 mb-4 shadow-xs flex flex-col gap-2.5">
      {/* Top row: Search input & Primary Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={filterState.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={
              t.search_contract_placeholder ||
              'Cari nomor PO, judul kontrak, nama vendor, atau PIC...'
            }
            className="w-full pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {filterState.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Action buttons: Export, View Switcher, Add Contract */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* View Toggle (Grid / Table) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Export Excel Button */}
          {onExportClick && (
            <button
              onClick={onExportClick}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs min-h-[34px]"
              title={t.export_excel || 'Ekspor Data Rekapitulasi ke Excel (.xlsx)'}
            >
              <svg
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">{t.export_excel || 'Ekspor Excel'}</span>
            </button>
          )}

          {/* Add Contract Button (Primary) */}
          {canWrite && (
            <button
              onClick={onAddClick}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 min-h-[34px]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{t.add_contract || 'Tambah Kontrak'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Filters, Category selector, Sort By, and Quick Expiry Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        {/* Quick Expiry Filter Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>

          <button
            onClick={() => onFilterChange({ expiryFilter: 'all' })}
            className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
              filterState.expiryFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.all || 'Semua'}
          </button>

          <button
            onClick={() => onFilterChange({ expiryFilter: 'h90' })}
            className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterState.expiryFilter === 'h90'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {t.h90_warning_badge || 'Peringatan H-90'}
          </button>

          <button
            onClick={() => onFilterChange({ expiryFilter: 'h30' })}
            className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterState.expiryFilter === 'h30'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {t.h30_critical_badge || 'Kritis H-30'}
          </button>

          <button
            onClick={() => onFilterChange({ expiryFilter: 'active' })}
            className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
              filterState.expiryFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
            }`}
          >
            {t.active_badge || 'Aktif'}
          </button>

          <button
            onClick={() => onFilterChange({ expiryFilter: 'expired' })}
            className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
              filterState.expiryFilter === 'expired'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.expired_badge || 'Kedaluwarsa'}
          </button>
        </div>

        {/* Category & Sorting Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Selector */}
          <select
            value={filterState.currency || 'all'}
            onChange={(e) => onFilterChange({ currency: e.target.value })}
            aria-label="Currency"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">{t.all_currencies || 'Semua Mata Uang'}</option>
            <option value="IDR">IDR (Rp)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>

          {/* Category Selector */}
          <select
            value={filterState.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            aria-label="Category"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">{t.all_categories || 'Semua Kategori'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={filterState.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            aria-label="Sort"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="created_desc">{t.sort_created_desc || 'Terbaru Ditambahkan'}</option>
            <option value="end_date_asc">{t.sort_expiry_asc || 'Masa Berlaku Terdekat'}</option>
            <option value="end_date_desc">{t.sort_expiry_desc || 'Masa Berlaku Terjauh'}</option>
            <option value="budget_desc">{t.sort_budget_desc || 'Nilai Anggaran Tertinggi'}</option>
            <option value="po_asc">{t.sort_po_asc || 'Nomor PO (A-Z)'}</option>
          </select>

          <span className="text-[10px] font-bold text-slate-400 pl-1">
            ({totalFilteredCount} item)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContractFilterBar;
