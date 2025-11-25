import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [animatingField, setAnimatingField] = useState<string | null>(null);

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
    setAnimatingField(key as string);
    onFilterChange(key, value);
    setTimeout(() => setAnimatingField(null), 300);
  };

  const handleReset = () => {
    if (onReset) {
      setAnimatingField('reset');
      onReset();
      setTimeout(() => setAnimatingField(null), 300);
    }
  };

  const activeFiltersCount = [
    filters.plantCategory !== '',
    filters.plantUnit !== '',
    filters.date !== '',
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="p-2 bg-primary-500/20 rounded-xl"
          >
            <FilterIcon className="w-5 h-5 text-primary-600" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Smart Filters</h3>
            <p className="text-sm text-slate-600">Refine your data view</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Plant Category Filter */}
          <motion.div
            className="flex items-center gap-3 min-w-0"
            animate={
              animatingField === 'plantCategory'
                ? {
                    scale: [1, 1.02, 1],
                    transition: { duration: 0.3 },
                  }
                : {}
            }
          >
            <label
              htmlFor="plant-category"
              className="text-sm font-semibold text-slate-700 whitespace-nowrap"
            >
              Plant Category:
            </label>
            <div className="relative min-w-[140px]">
              <select
                id="plant-category"
                value={filters.plantCategory}
                onChange={(e) => handleFieldChange('plantCategory', e.target.value)}
                className="w-full pl-4 pr-8 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-colors appearance-none"
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
          </motion.div>

          {/* Plant Unit Filter */}
          <motion.div
            className="flex items-center gap-3 min-w-0"
            animate={
              animatingField === 'plantUnit'
                ? {
                    scale: [1, 1.02, 1],
                    transition: { duration: 0.3 },
                  }
                : {}
            }
          >
            <label
              htmlFor="plant-unit"
              className="text-sm font-semibold text-slate-700 whitespace-nowrap"
            >
              Unit:
            </label>
            <div className="relative min-w-[120px]">
              <select
                id="plant-unit"
                value={filters.plantUnit}
                onChange={(e) => handleFieldChange('plantUnit', e.target.value)}
                disabled={allowedUnits.length === 0}
                className="w-full pl-4 pr-8 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm font-medium transition-colors appearance-none"
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
          </motion.div>

          {/* Date Filter */}
          <motion.div
            className="flex items-center gap-3 min-w-0"
            animate={
              animatingField === 'date'
                ? {
                    scale: [1, 1.02, 1],
                    transition: { duration: 0.3 },
                  }
                : {}
            }
          >
            <label
              htmlFor="filter-date"
              className="text-sm font-semibold text-slate-700 whitespace-nowrap"
            >
              Date:
            </label>
            <input
              type="date"
              id="filter-date"
              value={filters.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="min-w-[140px] px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-colors"
            />
          </motion.div>

          {/* Reset Button */}
          {onReset && activeFiltersCount > 0 && (
            <motion.div
              animate={
                animatingField === 'reset'
                  ? {
                      scale: [1, 1.05, 1],
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
                className="whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </EnhancedButton>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FilterSection;


