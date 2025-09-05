import React, { useState } from "react";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: React.ReactNode;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string; // For mobile view
  hideOnMobile?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className="overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table
          className={`min-w-full divide-y divide-slate-200 dark:divide-slate-700 ${className}`}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

export const ResponsiveTableHeader: React.FC<ResponsiveTableHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <thead className={`bg-slate-50 dark:bg-slate-800 ${className}`}>
      {children}
    </thead>
  );
};

export const ResponsiveTableBody: React.FC<ResponsiveTableBodyProps> = ({
  children,
  className = "",
}) => {
  return (
    <>
      {/* Desktop Body */}
      <tbody
        className={`hidden md:table-row-group bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700 ${className}`}
      >
        {children}
      </tbody>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 p-4">
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
          >
            {child}
          </div>
        ))}
      </div>
    </>
  );
};

export const ResponsiveTableRow: React.FC<ResponsiveTableRowProps> = ({
  children,
  className = "",
  mobileLayout,
}) => {
  return (
    <>
      {/* Desktop Row */}
      <tr
        className={`hidden md:table-row hover:bg-slate-50 dark:hover:bg-slate-800/50 ${className}`}
      >
        {children}
      </tr>

      {/* Mobile Layout */}
      {mobileLayout && <div className="md:hidden">{mobileLayout}</div>}
    </>
  );
};

export const ResponsiveTableCell: React.FC<ResponsiveTableCellProps> = ({
  children,
  className = "",
  label,
  hideOnMobile = false,
}) => {
  return (
    <>
      {/* Desktop Cell */}
      <td
        className={`hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm ${className}`}
      >
        {children}
      </td>

      {/* Mobile Layout */}
      {!hideOnMobile && label && (
        <div className="md:hidden flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}:
          </span>
          <span className="text-sm text-slate-900 dark:text-slate-100">
            {children}
          </span>
        </div>
      )}

      {!hideOnMobile && !label && (
        <div className="md:hidden py-2">{children}</div>
      )}
    </>
  );
};

export const ResponsiveTableHeaderCell: React.FC<ResponsiveTableCellProps> = ({
  children,
  className = "",
}) => {
  return (
    <th
      className={`hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
};
