import React, { useState, useCallback, useMemo } from "react";
import { SearchInput } from "./ui/Input";
import Button from "./ui/Button";
import { User, UserRole, Department } from "../types";

interface TableFiltersProps {
  users: User[];
  onFilteredDataChange: (filteredUsers: User[]) => void;
  className?: string;
}

interface FilterState {
  search: string;
  role: UserRole | "all";
  department: Department | "all";
  status: "active" | "inactive" | "all";
  dateRange: {
    start: string;
    end: string;
  };
}

const TableFilters: React.FC<TableFiltersProps> = ({
  users,
  onFilteredDataChange,
  className = "",
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "all",
    department: "all",
    status: "all",
    dateRange: {
      start: "",
      end: "",
    },
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<keyof User>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const roles = Array.from(new Set(users.map((user) => user.role))).sort();
    const departments = Array.from(
      new Set(users.map((user) => user.department))
    ).sort();

    return { roles, departments };
  }, [users]);

  // Apply filters and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          user.full_name,
          user.email,
          user.role,
          user.department,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      // Role filter
      if (filters.role !== "all" && user.role !== filters.role) {
        return false;
      }

      // Department filter
      if (
        filters.department !== "all" &&
        user.department !== filters.department
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== "all") {
        const isActive = user.is_active;
        if (filters.status === "active" && !isActive) return false;
        if (filters.status === "inactive" && isActive) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const userDate = new Date(user.created_at);
        const startDate = filters.dateRange.start
          ? new Date(filters.dateRange.start)
          : null;
        const endDate = filters.dateRange.end
          ? new Date(filters.dateRange.end)
          : null;

        if (startDate && userDate < startDate) return false;
        if (endDate && userDate > endDate) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        const comparison = Number(aValue) - Number(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
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
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSortChange = useCallback(
    (field: keyof User) => {
      if (field === sortBy) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDirection("asc");
      }
    },
    [sortBy]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      role: "all",
      department: "all",
      status: "all",
      dateRange: { start: "", end: "" },
    });
    setSortBy("full_name");
    setSortDirection("asc");
  }, []);

  const exportData = useCallback(() => {
    // Convert filtered data to CSV
    const headers = [
      "Name",
      "Email",
      "Role",
      "Department",
      "Status",
      "Created Date",
    ];
    const csvData = [
      headers.join(","),
      ...filteredAndSortedUsers.map((user) =>
        [
          `"${user.full_name}"`,
          `"${user.email}"`,
          `"${user.role}"`,
          `"${user.department}"`,
          user.is_active ? "Active" : "Inactive",
          new Date(user.created_at).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    // Download CSV file
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAndSortedUsers]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search users by name, email, role, or department..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            fullWidth
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="base"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
              />
            </svg>
            Filters
          </Button>

          <Button variant="outline" size="base" onClick={exportData}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) =>
                  handleFilterChange("role", e.target.value as UserRole | "all")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {filterOptions.roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange(
                    "department",
                    e.target.value as Department | "all"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  handleFilterChange(
                    "status",
                    e.target.value as "active" | "inactive" | "all"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split("-");
                  setSortBy(field as keyof User);
                  setSortDirection(direction as "asc" | "desc");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created From
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    start: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created To
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    end: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {filteredAndSortedUsers.length} of {users.length} users
            </span>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilters;
