import React from 'react';

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
    <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-orange-500 to-red-600 dark:from-red-600 dark:via-orange-600 dark:to-red-700 rounded-2xl shadow-2xl border border-red-200/20 dark:border-red-800/20 p-6 mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

      <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent mb-1">
                {t.op_ccr_data_entry}
              </h2>
              <p className="text-sm text-orange-100/80 font-medium">
                Kelola data CCR untuk monitoring performa pabrik
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Error Alert */}
        {error && (
          <div className="bg-red-50/90 dark:bg-red-900/90 backdrop-blur-md border border-red-200/50 dark:border-red-800/50 rounded-xl p-4 max-w-sm shadow-lg animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600 dark:text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
                <button
                  onClick={onClearError}
                  className="mt-3 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 dark:bg-red-800/50 dark:hover:bg-red-800/70 text-red-700 dark:text-red-300 rounded-lg transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row md:flex-row items-start gap-3 min-w-0">
          <div className="group flex items-center gap-3 w-full sm:w-auto">
            <label
              htmlFor="ccr-category"
              className="text-sm font-semibold text-white/90 whitespace-nowrap min-w-fit"
            >
              {t.plant_category_label}:
            </label>
            <div className="relative">
              <select
                id="ccr-category"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-medium transition-all duration-300 hover:bg-white/30"
              >
                <option value="" className="text-slate-800">
                  Pilih Kategori
                </option>
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
          <div className="group flex items-center gap-3 w-full sm:w-auto">
            <label
              htmlFor="ccr-unit"
              className="text-sm font-semibold text-white/90 whitespace-nowrap min-w-fit"
            >
              {t.unit_label}:
            </label>
            <div className="relative">
              <select
                id="ccr-unit"
                value={selectedUnit}
                onChange={(e) => onUnitChange(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="flex-1 min-w-0 px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 disabled:bg-white/10 disabled:cursor-not-allowed text-sm font-medium transition-all duration-300 hover:bg-white/30"
              >
                <option value="" className="text-slate-800">
                  Pilih Unit
                </option>
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit} className="text-slate-800">
                    {unit}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
          <div className="group flex items-center gap-3 w-full sm:w-auto">
            <label
              htmlFor="ccr-date"
              className="text-sm font-semibold text-white/90 whitespace-nowrap min-w-fit"
            >
              {t.select_date}:
            </label>
            <input
              type="date"
              id="ccr-date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-medium transition-all duration-300 hover:bg-white/30"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CcrDataEntryHeader;

