import React from 'react';

interface CcrDataFiltersProps {
  t: any;
  selectedDate: string;
  plantUnit: string;
  onDateChange: (date: string) => void;
  onPlantUnitChange: (plantUnit: string) => void;
}

const CcrDataFilters: React.FC<CcrDataFiltersProps> = ({
  t,
  selectedDate,
  plantUnit,
  onDateChange,
  onPlantUnitChange,
}) => {
  return (
    <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
          {t.ccr_data_filters || 'CCR Data Filters'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label
            htmlFor="date"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
          >
            {t.date || 'Date'}
          </label>
          <div className="relative">
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="plantUnit"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
          >
            {t.plant_unit || 'Plant Unit'}
          </label>
          <div className="relative">
            <select
              id="plantUnit"
              value={plantUnit}
              onChange={(e) => onPlantUnitChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium appearance-none"
            >
              <option value="">Select Plant Unit</option>
              <option value="CCR1">CCR Unit 1</option>
              <option value="CCR2">CCR Unit 2</option>
              <option value="CCR3">CCR Unit 3</option>
            </select>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
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
      </div>
    </div>
  );
};

export default CcrDataFilters;
