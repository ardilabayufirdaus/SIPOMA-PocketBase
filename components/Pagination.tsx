import React from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { designSystem } from '../utils/designSystem';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - halfPagesToShow);
      let endPage = Math.min(totalPages, currentPage + halfPagesToShow);

      if (currentPage - halfPagesToShow < 1) {
        endPage = maxPagesToShow;
      }
      if (currentPage + halfPagesToShow > totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center py-3">
      <nav
        className="inline-flex items-center space-x-1 rounded-md shadow-sm"
        aria-label="Pagination"
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center px-2 py-2 text-sm font-medium rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            color: designSystem.colors.gray[500],
            backgroundColor: designSystem.colors.gray[50],
            border: `1px solid ${designSystem.colors.gray[300]}`,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = designSystem.colors.gray[100];
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = designSystem.colors.gray[50];
            }
          }}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        {pageNumbers.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium border transition-colors"
              style={{
                backgroundColor:
                  currentPage === page
                    ? designSystem.colors.primary[50]
                    : designSystem.colors.gray[50],
                color:
                  currentPage === page
                    ? designSystem.colors.primary[600]
                    : designSystem.colors.gray[500],
                borderColor:
                  currentPage === page
                    ? designSystem.colors.primary[500]
                    : designSystem.colors.gray[300],
              }}
              onMouseEnter={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.backgroundColor = designSystem.colors.gray[100];
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.backgroundColor = designSystem.colors.gray[50];
                }
              }}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="inline-flex items-center px-4 py-2 text-sm font-medium border"
              style={{
                color: designSystem.colors.gray[700],
                backgroundColor: designSystem.colors.gray[50],
                borderColor: designSystem.colors.gray[300],
              }}
            >
              {page}
            </span>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center px-2 py-2 text-sm font-medium rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            color: designSystem.colors.gray[500],
            backgroundColor: designSystem.colors.gray[50],
            border: `1px solid ${designSystem.colors.gray[300]}`,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = designSystem.colors.gray[100];
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = designSystem.colors.gray[50];
            }
          }}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
