import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  Calendar,
  Users,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { SearchInput } from './ui/Input';
import { EnhancedButton } from './ui/EnhancedComponents';
import { User, UserRole } from '../types';

interface TableFiltersProps {
  users: User[];
  onFilteredDataChange: (filteredUsers: User[]) => void;
  className?: string;
}

interface FilterState {
  search: string;
  role: UserRole | 'all';
  status: 'active' | 'inactive' | 'all';
  dateRange: {
    start: string;
    end: string;
  };
}

const TableFilters: React.FC<TableFiltersProps> = ({
  users,
  onFilteredDataChange,
  className = '',
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
    dateRange: {
      start: '',
      end: '',
    },
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<keyof User>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExporting, setIsExporting] = useState(false);
  const [animatingField, setAnimatingField] = useState<string | null>(null);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const roles = Array.from(new Set(users.map((user) => user.role))).sort();
    return { roles };
  }, [users]);

  // Apply filters and sorting
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [user.full_name, user.role].join(' ').toLowerCase();

        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      // Role filter
      if (filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isActive = user.is_active;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const userDate = new Date(user.created_at);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && userDate < startDate) return false;
        if (endDate && userDate > endDate) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const comparison = Number(aValue) - Number(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return filtered;
  }, [users, filters, sortBy, sortDirection]);

  // Notify parent component when filtered data changes
  React.useEffect(() => {
    onFilteredDataChange(filteredAndSortedUsers);
  }, [filteredAndSortedUsers, onFilteredDataChange]);

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setAnimatingField(key as string);
      setFilters((prev) => ({ ...prev, [key]: value }));
      setTimeout(() => setAnimatingField(null), 300);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setAnimatingField('clear');
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      dateRange: { start: '', end: '' },
    });
    setSortBy('full_name');
    setSortDirection('asc');
    setTimeout(() => setAnimatingField(null), 300);
  }, []);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      // Convert filtered data to CSV
      const headers = ['Name', 'Role', 'Status', 'Created Date'];
      const csvData = [
        headers.join(','),
        ...filteredAndSortedUsers.map((user) =>
          [
            `"${user.full_name}"`,
            `"${user.role}"`,
            user.is_active ? 'Active' : 'Inactive',
            new Date(user.created_at).toLocaleDateString(),
          ].join(',')
        ),
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  }, [filteredAndSortedUsers]);

  // Calculate active filters count
  const activeFiltersCount = [
    filters.search !== '',
    filters.role !== 'all',
    filters.status !== 'all',
    filters.dateRange.start !== '' || filters.dateRange.end !== '',
  ].filter(Boolean).length;

  // Active filter chips
  const activeFilterChips = [
    filters.search && { key: 'search', label: `Search: "${filters.search}"`, icon: Search },
    filters.role !== 'all' && { key: 'role', label: `Role: ${filters.role}`, icon: Users },
    filters.status !== 'all' && { key: 'status', label: `Status: ${filters.status}`, icon: Filter },
    (filters.dateRange.start || filters.dateRange.end) && {
      key: 'dateRange',
      label: `Date: ${filters.dateRange.start || '...'} - ${filters.dateRange.end || '...'}`,
      icon: Calendar,
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { duration: 0.3 },
      }}
      className={`relative ${className}`}
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
                  <SlidersHorizontal className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Advanced Filters
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Refine and organize your data
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
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="p-2"
                  ariaLabel={
                    showAdvancedFilters ? 'Hide advanced filters' : 'Show advanced filters'
                  }
                >
                  <motion.div
                    animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <motion.div
              className="flex-1"
              animate={
                animatingField === 'search'
                  ? {
                      scale: [1, 1.02, 1],
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              <SearchInput
                placeholder="Search users by name, email, role, or department..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                fullWidth
                className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
              />
            </motion.div>

            <div className="flex gap-2">
              <motion.div
                animate={
                  animatingField === 'toggleFilters'
                    ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 0.3 },
                      }
                    : {}
                }
              >
                <EnhancedButton
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setAnimatingField('toggleFilters');
                    setShowAdvancedFilters(!showAdvancedFilters);
                    setTimeout(() => setAnimatingField(null), 300);
                  }}
                  className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  ariaLabel="Toggle advanced filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </EnhancedButton>
              </motion.div>

              <motion.div
                animate={
                  isExporting
                    ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 0.5, repeat: Infinity },
                      }
                    : {}
                }
              >
                <EnhancedButton
                  variant="outline"
                  size="md"
                  onClick={exportData}
                  disabled={isExporting}
                  className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 hover:bg-success-50 dark:hover:bg-success-900/20"
                  ariaLabel="Export filtered data to CSV"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export'}
                </EnhancedButton>
              </motion.div>
            </div>
          </div>

          {/* Active Filter Chips */}
          <AnimatePresence>
            {activeFilterChips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {activeFilterChips.map((chip) => (
                  <motion.div
                    key={chip.key}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200 dark:border-primary-800/50"
                  >
                    <chip.icon className="w-3 h-3" />
                    <span>{chip.label}</span>
                    <button
                      onClick={() => {
                        if (chip.key === 'search') handleFilterChange('search', '');
                        else if (chip.key === 'role') handleFilterChange('role', 'all');
                        else if (chip.key === 'status') handleFilterChange('status', 'all');
                        else if (chip.key === 'dateRange')
                          handleFilterChange('dateRange', { start: '', end: '' });
                      }}
                      className="hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${chip.key} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Role Filter */}
                    <motion.div
                      className="space-y-3"
                      animate={
                        animatingField === 'role'
                          ? {
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 },
                            }
                          : {}
                      }
                    >
                      <label
                        htmlFor="role"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Role
                      </label>
                      <div className="relative">
                        <select
                          id="role"
                          value={filters.role}
                          onChange={(e) =>
                            handleFilterChange('role', e.target.value as UserRole | 'all')
                          }
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 appearance-none"
                        >
                          <option value="all">All Roles</option>
                          {filterOptions.roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </motion.div>

                    {/* Status Filter */}
                    <motion.div
                      className="space-y-3"
                      animate={
                        animatingField === 'status'
                          ? {
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 },
                            }
                          : {}
                      }
                    >
                      <label
                        htmlFor="status"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Status
                      </label>
                      <div className="relative">
                        <select
                          id="status"
                          value={filters.status}
                          onChange={(e) =>
                            handleFilterChange(
                              'status',
                              e.target.value as 'active' | 'inactive' | 'all'
                            )
                          }
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 appearance-none"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </motion.div>

                    {/* Sort Options */}
                    <motion.div
                      className="space-y-3"
                      animate={
                        animatingField === 'sort'
                          ? {
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 },
                            }
                          : {}
                      }
                    >
                      <label
                        htmlFor="sort"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Sort By
                      </label>
                      <div className="relative">
                        <select
                          id="sort"
                          value={`${sortBy}-${sortDirection}`}
                          onChange={(e) => {
                            setAnimatingField('sort');
                            const [field, direction] = e.target.value.split('-');
                            setSortBy(field as keyof User);
                            setSortDirection(direction as 'asc' | 'desc');
                            setTimeout(() => setAnimatingField(null), 300);
                          }}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100 appearance-none"
                        >
                          <option value="full_name-asc">Name (A-Z)</option>
                          <option value="full_name-desc">Name (Z-A)</option>
                          <option value="email-asc">Email (A-Z)</option>
                          <option value="email-desc">Email (Z-A)</option>
                          <option value="role-asc">Role (A-Z)</option>
                          <option value="role-desc">Role (Z-A)</option>
                          <option value="created_at-asc">Date Created (Oldest)</option>
                          <option value="created_at-desc">Date Created (Newest)</option>
                          <option value="last_active-desc">Last Active (Recent)</option>
                          <option value="last_active-asc">Last Active (Oldest)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          {sortDirection === 'asc' ? (
                            <SortAsc className="w-4 h-4 text-slate-400" />
                          ) : (
                            <SortDesc className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Placeholder for future filter */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 opacity-0">
                        Placeholder
                      </label>
                      <div className="h-[48px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          More filters coming soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      className="space-y-3"
                      animate={
                        animatingField === 'dateRange'
                          ? {
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 },
                            }
                          : {}
                      }
                    >
                      <label
                        htmlFor="dateStart"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Created From
                      </label>
                      <div className="relative">
                        <input
                          id="dateStart"
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) =>
                            handleFilterChange('dateRange', {
                              ...filters.dateRange,
                              start: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      animate={
                        animatingField === 'dateRange'
                          ? {
                              scale: [1, 1.02, 1],
                              transition: { duration: 0.3 },
                            }
                          : {}
                      }
                    >
                      <label
                        htmlFor="dateEnd"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Created To
                      </label>
                      <div className="relative">
                        <input
                          id="dateEnd"
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) =>
                            handleFilterChange('dateRange', {
                              ...filters.dateRange,
                              end: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 dark:text-slate-100"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Filter Actions */}
                  <motion.div
                    className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Showing{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {filteredAndSortedUsers.length}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {users.length}
                        </span>{' '}
                        users
                      </span>
                    </div>

                    {activeFiltersCount > 0 && (
                      <motion.div
                        animate={
                          animatingField === 'clear'
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
                          onClick={clearFilters}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          ariaLabel="Clear all applied filters"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear All Filters
                        </EnhancedButton>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default TableFilters;
