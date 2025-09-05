import React from "react";
import ChevronRightIcon from "../icons/ChevronRightIcon";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = "",
}) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRightIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          )}
          {item.onClick && !item.isActive ? (
            <button
              onClick={item.onClick}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-150 hover:underline focus:outline-none focus:underline"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={
                item.isActive
                  ? "text-slate-900 dark:text-slate-100 font-medium"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

interface PageNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  pages: { key: string; label: string }[];
  className?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onNavigate,
  pages,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {pages.map((page) => (
        <button
          key={page.key}
          onClick={() => onNavigate(page.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentPage === page.key
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          {page.label}
        </button>
      ))}
    </div>
  );
};
