import React, { useState, useCallback, useMemo, useRef } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  className?: string;
  overscan?: number;
}

function VirtualTable<T>({
  data,
  itemHeight,
  containerHeight,
  renderRow,
  renderHeader,
  className = '',
  overscan = 5,
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range with overscan
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(data.length, start + visibleCount + overscan);

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      offsetY: overscanStart * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, data.length, overscan]);

  const visibleItems = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const totalHeight = data.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto border border-gray-300 dark:border-slate-600 rounded-md ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Sticky Header */}
        {renderHeader && (
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600">
            {renderHeader()}
          </div>
        )}

        {/* Offset spacer */}
        <div style={{ height: offsetY }} />

        {/* Visible rows */}
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              height: itemHeight,
              position: 'absolute',
              top: offsetY + index * itemHeight,
              left: 0,
              right: 0,
            }}
          >
            {renderRow(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Performance monitoring hook for virtual table
export const useVirtualTablePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
  });

  const measureRender = useCallback(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      setMetrics((prev) => ({
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime,
        averageRenderTime:
          (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1),
        memoryUsage:
          (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0,
      }));
    };
  }, []);

  return { metrics, measureRender };
};

// Optimized table row component with memoization
interface OptimizedTableRowProps<T> {
  item: T;
  index: number;
  renderCell: (item: T, field: string) => React.ReactNode;
  fields: string[];
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export const OptimizedTableRow = React.memo(
  <T,>({
    item,
    index,
    renderCell,
    fields,
    onRowClick,
    className = '',
  }: OptimizedTableRowProps<T>) => {
    const handleClick = useCallback(() => {
      onRowClick?.(item, index);
    }, [onRowClick, item, index]);

    return (
      <tr
        className={`border-t hover:bg-gray-50 dark:hover:bg-slate-700 ${className}`}
        onClick={handleClick}
        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
      >
        {fields.map((field) => (
          <td key={field} className="px-4 py-2">
            {renderCell(item, field)}
          </td>
        ))}
      </tr>
    );
  }
);

// Optimized table header component
interface OptimizedTableHeaderProps {
  fields: string[];
  renderHeader?: (field: string) => React.ReactNode;
  className?: string;
}

export const OptimizedTableHeader = React.memo(
  ({ fields, renderHeader, className = '' }: OptimizedTableHeaderProps) => {
    return (
      <thead className={`bg-gray-50 dark:bg-slate-800 ${className}`}>
        <tr>
          {fields.map((field) => (
            <th
              key={field}
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {renderHeader ? renderHeader(field) : field}
            </th>
          ))}
        </tr>
      </thead>
    );
  }
);

OptimizedTableRow.displayName = 'OptimizedTableRow';
OptimizedTableHeader.displayName = 'OptimizedTableHeader';

// Table pagination component
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageNumbers = 5,
}) => {
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [onPageChange, totalPages]
  );

  const pageNumbers = useMemo(() => {
    if (!showPageNumbers || totalPages <= 1) return [];

    const start = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    const end = Math.min(totalPages, start + maxPageNumbers - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, showPageNumbers, maxPageNumbers]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {showPageNumbers &&
          pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm border rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VirtualTable;


