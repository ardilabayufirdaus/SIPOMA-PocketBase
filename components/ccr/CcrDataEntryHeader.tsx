import React from "react";

interface CcrDataEntryHeaderProps {
  t: any;
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-3 mb-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 truncate">
            {t.op_ccr_data_entry}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Kelola data CCR untuk monitoring performa pabrik
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 max-w-xs">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
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
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
                <button
                  onClick={onClearError}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row md:flex-row items-start gap-2 min-w-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-category"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
            >
              {t.plant_category_label}:
            </label>
            <select
              id="ccr-category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
            >
              <option value="">Pilih Kategori</option>
              {plantCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-unit"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
            >
              {t.unit_label}:
            </label>
            <select
              id="ccr-unit"
              value={selectedUnit}
              onChange={(e) => onUnitChange(e.target.value)}
              disabled={unitsForCategory.length === 0}
              className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <option value="">Pilih Unit</option>
              {unitsForCategory.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-date"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
            >
              {t.select_date}:
            </label>
            <input
              type="date"
              id="ccr-date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CcrDataEntryHeader;
