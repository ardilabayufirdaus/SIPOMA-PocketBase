
import { useState, useMemo } from 'react';

/**
 * Hook untuk paginasi sisi klien.
 * @param data - Array data lengkap yang akan dipaginasi.
 * @param itemsPerPage - Jumlah item per halaman.
 * @returns Objek berisi data untuk halaman saat ini dan utilitas paginasi.
 */
export const usePagination = <T>(data: T[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Pastikan currentPage tidak melebihi totalPages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems: data.length,
  };
};
