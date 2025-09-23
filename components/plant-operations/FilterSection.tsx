import React from 'react';
import { motion } from 'framer-motion';
import { FilterIcon } from 'lucide-react';
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export interface DashboardFilters {
  plantCategory: string;
  plantUnit: string;
  timeRange: string;
  month: number;
  year: number;
}

interface FilterSectionProps {
  filters: DashboardFilters;
  uniqueCategories: string[];
  availableUnits: string[];
  onFilterChange: (key: keyof DashboardFilters, value: string | number) => void;
}

const FilterSection: React.FC<FilterSectionProps> = React.memo(
  ({ filters, uniqueCategories, availableUnits, onFilterChange }) => {
    const currentUser = useCurrentUser();
    const permissionChecker = usePermissions(currentUser);

    // Check if user has any access to plant operations
    const hasPlantOperationsAccess = permissionChecker.canAccessPlantOperations();

    // If no access, don't render filters
    if (!hasPlantOperationsAccess) {
      return null;
    }

    // Filter categories and units based on user permissions
    const allowedCategories = uniqueCategories.filter((category) => {
      // Check if user has access to any unit in this category
      return availableUnits.some((unit) => {
        return permissionChecker.hasPlantOperationPermission(category, unit, 'READ');
      });
    });

    const allowedUnits = availableUnits.filter((unit) => {
      // Find the category this unit belongs to
      // For simplicity, assume unit name contains category or we need to map it
      // This might need to be adjusted based on actual data structure
      const category = uniqueCategories.find((cat) => unit.includes(cat)) || filters.plantCategory;
      return (
        category === 'all' || permissionChecker.hasPlantOperationPermission(category, unit, 'READ')
      );
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plant Category Filter */}
          <div className="space-y-2">
            <label
              htmlFor="plantCategory"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Plant Category
            </label>
            <select
              id="plantCategory"
              value={filters.plantCategory}
              onChange={(e) => onFilterChange('plantCategory', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Categories</option>
              {allowedCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Plant Unit Filter */}
          <div className="space-y-2">
            <label
              htmlFor="plantUnit"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Plant Unit
            </label>
            <select
              id="plantUnit"
              value={filters.plantUnit}
              onChange={(e) => onFilterChange('plantUnit', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Units</option>
              {allowedUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="space-y-2">
            <label
              htmlFor="month"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Month
            </label>
            <select
              id="month"
              value={filters.month}
              onChange={(e) => onFilterChange('month', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <label
              htmlFor="year"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Year
            </label>
            <select
              id="year"
              value={filters.year}
              onChange={(e) => onFilterChange('year', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </motion.div>
    );
  }
);

export default FilterSection;
