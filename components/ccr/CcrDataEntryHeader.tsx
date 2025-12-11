import React from 'react';
import { ChevronDown, BarChart3, Calendar, Building2, Layers } from 'lucide-react';

interface CcrDataEntryHeaderProps {
  t: Record<string, string>;
  error: string | null;
  selectedCategory: string;
  selectedUnit: string;
  selectedDate: string;
  plantCategories: string[];
  unitsForCategory: string[];
  onCategoryChange: (category: string) => void;
  onUnitChange: (unit: string) => void;
  onDateChange: (date: string) => void;
  onClearError: () => void;
}

const CcrDataEntryHeader: React.FC<CcrDataEntryHeaderProps> = ({
  t,
  error,
  selectedCategory,
  selectedUnit,
  selectedDate,
  plantCategories,
  unitsForCategory,
  onCategoryChange,
  onUnitChange,
  onDateChange,
  onClearError,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Header Title Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <BarChart3 className="w-7 h-7 text-indigo-200" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{t.op_ccr_data_entry}</h2>
            <p className="text-sm text-indigo-200/80 font-medium mt-0.5">
              {t.ccr_page_description || 'Manage CCR data for plant performance monitoring'}
            </p>
          </div>
        </div>

        {/* Enhanced Error Alert */}
        {error && (
          <div className="mt-4 bg-red-50/95 backdrop-blur-md border border-red-300/50 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                <button
                  onClick={onClearError}
                  className="mt-2 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Section - Separate Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md border border-slate-200/60 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Plant Category */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="ccr-category"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              {t.plant_category_label || 'Plant Category'}
            </label>
            <div className="relative">
              <select
                id="ccr-category"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
              >
                <option value="">-- Pilih Kategori --</option>
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Unit Name */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="ccr-unit"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              {t.unit_label || 'Unit Name'}
            </label>
            <div className="relative">
              <select
                id="ccr-unit"
                value={selectedUnit}
                onChange={(e) => onUnitChange(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
              >
                <option value="">-- Pilih Unit --</option>
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Select Date */}
          <div className="flex-1 min-w-[180px]">
            <label
              htmlFor="ccr-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              {t.select_date || 'Select Date'}
            </label>
            <input
              type="date"
              id="ccr-date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CcrDataEntryHeader;
