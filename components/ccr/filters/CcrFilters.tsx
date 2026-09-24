import React, { memo, useMemo } from 'react';
import { formatDate } from '../../../utils/dateUtils';

interface CcrFiltersProps {
  t: Record<string, string>;
  plantCategories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  unitsForCategory: string[];
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const CcrFilters: React.FC<CcrFiltersProps> = memo(
  ({
    t,
    plantCategories,
    selectedCategory,
    setSelectedCategory,
    unitsForCategory,
    selectedUnit,
    setSelectedUnit,
    selectedDate,
    setSelectedDate,
  }) => {
    // Format date untuk display (dd/mm/yyyy)
    const formattedDateDisplay = useMemo(() => {
      if (!selectedDate) return '';
      return formatDate(selectedDate);
    }, [selectedDate]);

    return (
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4">
        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
              {t.filters}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {t.filter_appearance_desc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              {t.select_category || 'Kategori'}
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-slate-800 dark:text-slate-100 text-xs font-medium appearance-none cursor-pointer"
                aria-label={t.select_category}
              >
                <option
                  value=""
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {t.select_category || 'Pilih Kategori'}
                </option>
                {plantCategories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Unit Filter */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              {t.select_unit || 'Unit Kerja'}
            </label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={!selectedCategory}
                className="w-full pl-3 pr-8 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-slate-800 dark:text-slate-100 text-xs font-medium appearance-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
                aria-label={t.select_unit}
              >
                <option
                  value=""
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {t.select_unit || 'Pilih Unit'}
                </option>
                {unitsForCategory.map((unit) => (
                  <option
                    key={unit}
                    value={unit}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {unit}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
              {t.select_date || 'Tanggal Operasional'}
            </label>
            <div className="relative group/input">
              <div className="w-full px-3 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-medium flex items-center justify-between pointer-events-none group-hover/input:border-slate-300 dark:group-hover/input:border-slate-600">
                <span>{formattedDateDisplay || '--/--/----'}</span>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label={t.select_date}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CcrFilters.displayName = 'CcrFilters';

export default CcrFilters;
