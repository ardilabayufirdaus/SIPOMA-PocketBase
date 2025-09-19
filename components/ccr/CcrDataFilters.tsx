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
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
        {t.ccr_data_filters || 'CCR Data Filters'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {t.date || 'Date'}
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="plantUnit"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {t.plant_unit || 'Plant Unit'}
          </label>
          <select
            id="plantUnit"
            value={plantUnit}
            onChange={(e) => onPlantUnitChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            <option value="all">{t.all_units || 'All Units'}</option>
            <option value="Cement Mill">Cement Mill</option>
            <option value="Raw Mill">Raw Mill</option>
            <option value="Kiln">Kiln</option>
            <option value="Packing Plant">Packing Plant</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CcrDataFilters;
