import { useState, useMemo, useEffect } from 'react';

export const usePagination = <T,>(data: T[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);
  
  useEffect(() => {
    // If data changes and current page becomes invalid, go to the last valid page.
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      // If all data is removed, reset to page 1.
      setCurrentPage(1);
    }
  }, [totalPages]);


  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    nextPage,
    prevPage,
  };
};