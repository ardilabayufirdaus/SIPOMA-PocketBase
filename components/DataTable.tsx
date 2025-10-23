import { ReactNode, useState } from 'react';

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
}

/**
 * Generic data table component with pagination support using Tailwind CSS
 */
export default function DataTable({
  rows,
  columns,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  disablePagination = false,
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
    <div className="w-full overflow-hidden bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-600"
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
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {displayedRows.length > 0 ? (
              displayedRows.map((row, rowIndex) => (
                <tr
                  key={String(row.id || rowIndex)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={`${String(row.id || rowIndex)}-${column.field}`}
                      className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700"
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
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
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
        <div className="bg-white dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {/* Rows per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Page info and navigation */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {rows.length > 0
                ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, rows.length)} of ${rows.length}`
                : '0 of 0'}
            </span>

            <div className="flex space-x-1">
              <button
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>

              <button
                onClick={() => handleChangePage(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

