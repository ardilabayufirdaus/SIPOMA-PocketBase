import React from 'react';
import { Page } from '../../types';

interface BreadcrumbItem {
  label: string;
  page?: Page;
  subPage?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (page: Page, subPage?: string) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg
                className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.page && !isLast && onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate(item.page!, item.subPage)}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -mx-1"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={
                  isLast || item.active
                    ? 'font-semibold text-slate-800 dark:text-slate-100 text-primary-600 dark:text-primary-400'
                    : ''
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
