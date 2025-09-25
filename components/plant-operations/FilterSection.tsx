import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterIcon, X, ChevronDown, RefreshCw } from 'lucide-react';
import { EnhancedButton } from '../ui/EnhancedComponents';
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
  onReset?: () => void;
  isLoading?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  uniqueCategories,
  availableUnits,
  onFilterChange,
  onReset,
  isLoading = false,
}) => {
  const currentUser = useCurrentUser();
  const permissionChecker = usePermissions(currentUser.currentUser);
  const [isExpanded, setIsExpanded] = useState(true);
  const [animatingField, setAnimatingField] = useState<string | null>(null);

  // Check if user has any access to plant operations
  const hasPlantOperationsAccess = permissionChecker.canAccessPlantOperations();

  // If no access, don't render filters
  if (!hasPlantOperationsAccess) {
    return null;
  }

  // Filter categories and units based on user permissions
  const allowedCategories = uniqueCategories.filter((category) => {
    return availableUnits.some((unit) => {
      return permissionChecker.hasPlantOperationPermission(category, unit, 'READ');
    });
  });

  const allowedUnits = availableUnits.filter((unit) => {
    const category = uniqueCategories.find((cat) => unit.includes(cat)) || filters.plantCategory;
    return (
      category === 'all' || permissionChecker.hasPlantOperationPermission(category, unit, 'READ')
    );
  });

  const handleFieldChange = (key: keyof DashboardFilters, value: string | number) => {
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
    filters.plantCategory !== 'all',
    filters.plantUnit !== 'all',
    filters.timeRange !== 'all',
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { duration: 0.3 },
      }}
      className="relative"
    >
      {/* Glass morphism background with enhanced styling */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-success-500/10 dark:from-primary-500/20 dark:via-secondary-500/20 dark:to-success-500/20 border-b border-white/10 dark:border-slate-700/30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="p-2 bg-primary-500/20 dark:bg-primary-500/30 rounded-xl"
                >
                  <FilterIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Smart Filters
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Refine your data view
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full min-w-[20px] text-center"
                  >
                    {activeFiltersCount}
                  </motion.div>
                )}

                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2"
                  ariaLabel={isExpanded ? 'Collapse filters' : 'Expand filters'}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Plant Category Filter */}
                  <motion.div
                    className="space-y-3"
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
                      htmlFor="plantCategory"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Plant Category
                    </label>
                    <div className="relative">
                      <select
                        id="plantCategory"
                        value={filters.plantCategory}
                        onChange={(e) => handleFieldChange('plantCategory', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="all">All Categories</option>
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
                    className="space-y-3"
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
                      htmlFor="plantUnit"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Plant Unit
                    </label>
                    <div className="relative">
                      <select
                        id="plantUnit"
                        value={filters.plantUnit}
                        onChange={(e) => handleFieldChange('plantUnit', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="all">All Units</option>
                        {allowedUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Month Filter */}
                  <motion.div
                    className="space-y-3"
                    animate={
                      animatingField === 'month'
                        ? {
                            scale: [1, 1.02, 1],
                            transition: { duration: 0.3 },
                          }
                        : {}
                    }
                  >
                    <label
                      htmlFor="month"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Month
                    </label>
                    <div className="relative">
                      <select
                        id="month"
                        value={filters.month}
                        onChange={(e) => handleFieldChange('month', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Year Filter */}
                  <motion.div
                    className="space-y-3"
                    animate={
                      animatingField === 'year'
                        ? {
                            scale: [1, 1.02, 1],
                            transition: { duration: 0.3 },
                          }
                        : {}
                    }
                  >
                    <label
                      htmlFor="year"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Year
                    </label>
                    <div className="relative">
                      <select
                        id="year"
                        value={filters.year}
                        onChange={(e) => handleFieldChange('year', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
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
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw className="w-4 h-4 text-primary-500" />
                      </motion.div>
                    )}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {activeFiltersCount > 0
                        ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`
                        : 'No active filters'}
                    </span>
                  </div>

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
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={isLoading}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        ariaLabel="Reset all filters"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reset Filters
                      </EnhancedButton>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FilterSection;
