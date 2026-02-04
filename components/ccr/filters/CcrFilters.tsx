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
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#772953]/20 to-[#E95420]/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 transition-all duration-300">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800">{t.filters}</h3>
              <p className="text-sm font-medium text-slate-500">{t.filter_appearance_desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#772953]"></div>
                {t.select_category || 'Kategori'}
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white/60 border border-white/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#772953]/50 focus:border-[#772953] transition-all duration-300 text-slate-800 font-bold shadow-sm hover:shadow-md appearance-none"
                  aria-label={t.select_category}
                >
                  <option value="">{t.select_category || 'Pilih Kategori'}</option>
                  {plantCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Unit Filter */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E95420]"></div>
                {t.select_unit || 'Unit Kerja'}
              </label>
              <div className="relative">
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full pl-4 pr-10 py-3 bg-white/60 border border-white/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420]/50 focus:border-[#E95420] transition-all duration-300 text-slate-800 font-bold shadow-sm hover:shadow-md appearance-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                  aria-label={t.select_unit}
                >
                  <option value="">{t.select_unit || 'Pilih Unit'}</option>
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                {t.select_date || 'Tanggal Operasional'}
              </label>
              <div className="relative group/input">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-white/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500 transition-all duration-300 text-transparent font-bold shadow-sm hover:shadow-md relative z-10"
                  aria-label={t.select_date}
                />
                {formattedDateDisplay && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-800 font-bold z-0">
                    {formattedDateDisplay}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CcrFilters.displayName = 'CcrFilters';

export default CcrFilters;
