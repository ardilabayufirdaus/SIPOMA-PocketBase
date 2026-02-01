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
      const date = new Date(selectedDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }, [selectedDate]);

    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {t.filters || 'Filter'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t.select_category || 'Kategori'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 font-medium hover:bg-white/70"
              aria-label={t.select_category}
            >
              <option value="">{t.select_category || 'Pilih Kategori'}</option>
              {plantCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t.select_unit || 'Unit'}
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 font-medium hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t.select_unit}
            >
              <option value="">{t.select_unit || 'Pilih Unit'}</option>
              {unitsForCategory.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t.select_date || 'Tanggal'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 font-medium hover:bg-white/70"
                aria-label={t.select_date}
              />
              {/* Display formatted date as placeholder/hint */}
              {formattedDateDisplay && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-slate-500">
                  {formattedDateDisplay}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CcrFilters.displayName = 'CcrFilters';

export default CcrFilters;
