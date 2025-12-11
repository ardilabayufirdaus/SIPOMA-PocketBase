import { ReactNode, useState } from 'react';
import { cn } from '../utils/cn';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface Column {
  field: string;
  headerName: string;
  width?: number;
  renderCell?: (cellValue: unknown) => ReactNode;
}

interface DataTableProps {
  rows: Record<string, unknown>[];
  columns: Column[];
  pageSize?: number;
  rowsPerPageOptions?: number[];
  disablePagination?: boolean;
  className?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
}

/**
 * Generic data table component with pagination support and premium styling
 */
export default function DataTable({
  rows,
  columns,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  disablePagination = false,
  className,
  onRowClick,
}: DataTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate displayed rows based on pagination
  const displayedRows = disablePagination
    ? rows
    : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900',
        className
      )}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              {columns.map((column) => (
                <th
                  key={column.field}
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  style={{
                    width: column.width || 'auto',
                    minWidth: column.width ? `${column.width}px` : 'auto',
                  }}
                >
                  {column.headerName}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
            {displayedRows.length > 0 ? (
              displayedRows.map((row, rowIndex) => (
                <tr
                  key={String(row.id || rowIndex)}
                  className={cn(
                    'transition-colors duration-200',
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${String(row.id || rowIndex)}-${column.field}`}
                      className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {column.renderCell
                        ? column.renderCell(row[column.field])
                        : String(row[column.field] || '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!disablePagination && rows.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          {/* Rows per page selector */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Page info and navigation */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {rows.length > 0
                ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, rows.length)} of ${rows.length}`
                : '0 of 0'}
            </span>

            <div className="flex space-x-1">
              <button
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
                className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleChangePage(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Next page"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
