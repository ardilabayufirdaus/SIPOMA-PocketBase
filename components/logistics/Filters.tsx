import React from "react";

interface FiltersProps {
  areas: string[];
  filterArea: string;
  setFilterArea: (area: string) => void;
  filterMonth: number;
  setFilterMonth: (month: number) => void;
  filterYear: number;
  setFilterYear: (year: number) => void;
  monthOptions: { value: number; label: string }[];
  yearOptions: number[];
  t: any;
}

export const Filters: React.FC<FiltersProps> = ({
  areas,
  filterArea,
  setFilterArea,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  monthOptions,
  yearOptions,
  t,
}) => (
  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
    <div className="w-full sm:w-40">
      <label
        htmlFor="log-filter-area"
        className="block text-xs font-medium text-slate-600 mb-1"
      >
        {t.filter_by_area}
      </label>
      <select
        id="log-filter-area"
        value={filterArea}
        onChange={(e) => setFilterArea(e.target.value)}
        className="block w-full pl-2 pr-8 py-1.5 text-sm bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
        aria-label={t.filter_by_area}
      >
        <option value="All Areas">{t.all_areas}</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>
    </div>
    <div className="w-full sm:w-40">
      <label
        htmlFor="log-filter-month"
        className="block text-xs font-medium text-slate-600 mb-1"
      >
        {t.filter_by_month}
      </label>
      <select
        id="log-filter-month"
        value={filterMonth}
        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
        className="block w-full pl-2 pr-8 py-1.5 text-sm bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
        aria-label={t.filter_by_month}
      >
        {monthOptions.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
    </div>
    <div className="w-full sm:w-24">
      <label
        htmlFor="log-filter-year"
        className="block text-xs font-medium text-slate-600 mb-1"
      >
        {t.filter_by_year}
      </label>
      <select
        id="log-filter-year"
        value={filterYear}
        onChange={(e) => setFilterYear(parseInt(e.target.value))}
        className="block w-full pl-2 pr-8 py-1.5 text-sm bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
        aria-label={t.filter_by_year}
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  </div>
);
