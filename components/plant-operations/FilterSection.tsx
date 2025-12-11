import React from 'react';
import { FilterIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { EnhancedButton } from '../ui/EnhancedComponents';
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { PlantUnit } from '../../types';

export interface DashboardFilters {
  plantCategory: string;
  plantUnit: string;
  date: string;
  searchQuery: string;
}

interface FilterSectionProps {
  filters: DashboardFilters;
  plantUnits: PlantUnit[];
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  plantUnits,
  onFilterChange,
  onReset,
  isLoading = false,
}) => {
  const currentUser = useCurrentUser();
  const permissionChecker = usePermissions(currentUser.currentUser);

  // Check if user has any access to plant operations
  const hasPlantOperationsAccess = permissionChecker.canAccessPlantOperations();

  // If no access, don't render filters
  if (!hasPlantOperationsAccess) {
    return null;
  }

  // Filter categories and units based on user permissions
  const allowedCategories = plantUnits
    .filter((unit) =>
      permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
    )
    .map((unit) => unit.category)
    .filter((category, index, arr) => arr.indexOf(category) === index); // unique

  const allowedUnits = plantUnits
    .filter((unit) => {
      const hasPermission = permissionChecker.hasPlantOperationPermission(
        unit.category,
        unit.unit,
        'READ'
      );
      const categoryMatch = !filters.plantCategory || unit.category === filters.plantCategory;
      return hasPermission && categoryMatch;
    })
    .map((unit) => unit.unit);

  const handleFieldChange = (key: keyof DashboardFilters, value: string) => {
    onFilterChange(key, value);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const activeFiltersCount = [
    filters.plantCategory !== '',
    filters.plantUnit !== '',
    filters.date !== '',
  ].filter(Boolean).length;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md border border-slate-200/60 p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
            <FilterIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Smart Filters</h3>
            <p className="text-xs text-slate-500">Refine your data view</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Plant Category Filter */}
          <div className="flex-1 min-w-[180px]">
            <label
              htmlFor="plant-category"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Plant Category
            </label>
            <div className="relative">
              <select
                id="plant-category"
                value={filters.plantCategory}
                onChange={(e) => handleFieldChange('plantCategory', e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
              >
                <option value="">Choose Category</option>
                {allowedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Plant Unit Filter */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="plant-unit"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Unit
            </label>
            <div className="relative">
              <select
                id="plant-unit"
                value={filters.plantUnit}
                onChange={(e) => handleFieldChange('plantUnit', e.target.value)}
                disabled={allowedUnits.length === 0}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
              >
                <option value="">Choose Unit</option>
                {allowedUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor="filter-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Date
            </label>
            <input
              type="date"
              id="filter-date"
              value={filters.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          {onReset && activeFiltersCount > 0 && (
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="whitespace-nowrap px-4 py-2.5 h-auto border-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </EnhancedButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
