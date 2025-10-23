import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { CcrDowntimeData } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { logger } from '../utils/logger';

// Debounce utility for real-time updates
const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Normalisasi format tanggal untuk konsistensi
 */
const normalizeDateFormat = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';

  // Hilangkan whitespace
  const trimmed = dateStr.trim();

  // Verifikasi format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Coba parse sebagai tanggal jika format lain
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parse errors
  }

  // Return original if no conversion possible
  return trimmed;
};

const useCcrDowntimeData = (date?: string) => {
  const queryClient = useQueryClient();

  // Fetch downtime data with optional date filter for performance
  const {
    data: downtimeData = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ccr-downtime-data', date],
    queryFn: async (): Promise<CcrDowntimeData[]> => {
      try {
        let filter = '';
        if (date) {
          // Normalize date format untuk query
          const normalizedDate = normalizeDateFormat(date);
          filter = `date="${normalizedDate}"`;

          // Coba filter lebih fleksibel jika tanggal mungkin disimpan dalam format berbeda
          if (normalizedDate.includes('-')) {
            // Jika ada kemungkinan tanggal disimpan tanpa format yang konsisten,
            // kita bisa menggunakan filter lebih fleksibel, meski kurang efisien
            // filter = `date ~ "${normalizedDate}"`;
          }
        }

        logger.debug('Fetching downtime data with filter:', filter);

        // Implementasi dengan timeout yang lebih lama dan penanganan error yang lebih baik
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 detik timeout

        try {
          // Coba lebih fleksibel dalam query - menggunakan LIKE atau tanpa filter ketat
          // Ini memungkinkan untuk menangani perbedaan format tanggal dalam DB
          let records;

          if (date) {
            const normalizedDate = normalizeDateFormat(date);

            // Gunakan pendekatan query yang lebih sederhana dan langsung pada field date
            logger.debug(`Using direct date field query with date="${normalizedDate}"`);

            // 1. Coba dengan exact match pada field date
            records = await pb.collection('ccr_downtime_data').getFullList({
              filter: `date = "${normalizedDate}"`,
              sort: '-created',
              requestKey: `downtime-exact-${normalizedDate}-${Date.now()}`,
              signal: abortController.signal,
            });

            // 2. Jika tidak ada hasil, coba dengan filter fleksibel
            if (records.length === 0) {
              logger.debug(`No records with exact match, trying flexible filter`);

              records = await pb.collection('ccr_downtime_data').getFullList({
                filter: `date ~ "${normalizedDate}"`, // LIKE query instead of exact match
                sort: '-created',
                requestKey: `downtime-flex-${normalizedDate}-${Date.now()}`,
                signal: abortController.signal,
              });
            }

            // 3. Jika masih tidak ada hasil, coba dengan filter fleksibel pada kolom date
            if (records.length === 0) {
              logger.debug('Trying flexible date filter as last resort');

              records = await pb.collection('ccr_downtime_data').getFullList({
                filter: `date ~ "${normalizedDate}"`,
                sort: '-created',
                requestKey: `downtime-flexible-${normalizedDate}-${Date.now()}`,
                signal: abortController.signal,
              });
            }

            // Jika tidak ada hasil, coba tanpa filter sama sekali dan filter manual
            if (records.length === 0) {
              logger.debug('No records found with flexible query, trying without filter');

              // Ambil semua record (terbatas) dan filter manual
              const allRecords = await pb.collection('ccr_downtime_data').getFullList({
                sort: '-created',
                perPage: 100, // Batasi jumlah untuk performa
                requestKey: `downtime-all-${Date.now()}`,
                signal: abortController.signal,
              });

              // Filter manual
              records = allRecords.filter((record) => {
                const recordDate = normalizeDateFormat(record.date);
                return recordDate === normalizedDate;
              });

              logger.debug(`Manual filtering found ${records.length} records`);
            }
          } else {
            records = await pb.collection('ccr_downtime_data').getFullList({
              sort: '-created',
              perPage: 1000,
              requestKey: `downtime-all-${Date.now()}`,
              signal: abortController.signal,
            });
          }

          // Log the raw records and specifically check the date formats
          logger.debug('Raw PocketBase downtime records:', records);

          if (records.length > 0) {
            logger.debug('First record date format:', {
              rawDate: records[0].date,
              normalized: normalizeDateFormat(records[0].date),
              type: typeof records[0].date,
            });
          }
          return records as unknown as CcrDowntimeData[];
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // Handle different types of errors gracefully
        if (error instanceof Error) {
          if (error.message.includes('autocancelled')) {
            logger.info('Request was autocancelled, returning cached data if available');
            return (
              (queryClient.getQueryData(['ccr-downtime-data', date]) as CcrDowntimeData[]) || []
            );
          }

          if (error.name === 'AbortError') {
            logger.info('Request timed out, returning cached data if available');
            return (
              (queryClient.getQueryData(['ccr-downtime-data', date]) as CcrDowntimeData[]) || []
            );
          }
        }

        throw new Error(
          `Failed to fetch downtime data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    // Settings untuk data caching yang lebih optimal
    staleTime: 20 * 1000, // 20 detik - data dianggap stale setelah 20 detik
    gcTime: 5 * 60 * 1000, // 5 menit - garbage collection setelah 5 menit
    refetchOnMount: true, // Selalu refetch saat komponen di-mount
    refetchOnWindowFocus: true, // Selalu refetch saat window mendapat fokus
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Mutations for CRUD operations
  const addDowntimeMutation = useMutation({
    mutationFn: async (record: Omit<CcrDowntimeData, 'id'>) => {
      logger.debug('Adding downtime to PocketBase:', record);

      // Normalize date format
      const normalizedDate = normalizeDateFormat(record.date);

      // Normalize time format to ensure HH:MM format
      const normalizeTimeFormat = (timeStr: string): string => {
        if (!timeStr) return '';
        return timeStr.split(':').slice(0, 2).join(':'); // Ensure HH:MM format
      };

      // Create payload with proper formats
      const payload = {
        ...record,
        date: normalizedDate,
        start_time: normalizeTimeFormat(record.start_time),
        end_time: normalizeTimeFormat(record.end_time),
      };

      logger.debug('Enhanced payload for saving:', payload);

      try {
        const response = await pb.collection('ccr_downtime_data').create(payload);
        logger.debug('PocketBase create response:', response);
        return record;
      } catch (error) {
        logger.error('PocketBase create error:', error);
        throw error;
      }
    },
    onMutate: async (newRecord) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ccr-downtime-data', newRecord.date] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['ccr-downtime-data', newRecord.date]);

      // Optimistically update cache
      queryClient.setQueryData(
        ['ccr-downtime-data', newRecord.date],
        (old: CcrDowntimeData[] = []) => [
          { ...newRecord, id: `temp-${Date.now()}` }, // Temporary ID
          ...old,
        ]
      );

      return { previousData, date: newRecord.date };
    },
    onError: (err, newRecord, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['ccr-downtime-data', context.date], context.previousData);
      }
    },
    onSuccess: (record) => {
      logger.debug('Successfully added downtime record, invalidating queries');

      // Selectively invalidate to get real data
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data', record.date] });
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data'], exact: false });

      // Force refetch dengan delay untuk memastikan data terbaru
      setTimeout(() => {
        logger.debug('Delayed refetch of downtime data');
        queryClient.refetchQueries({ queryKey: ['ccr-downtime-data', record.date] });
        queryClient.refetchQueries({ queryKey: ['ccr-downtime-data'], exact: false });
      }, 1000);
    },
  });

  const updateDowntimeMutation = useMutation({
    mutationFn: async (updatedRecord: CcrDowntimeData) => {
      const { id, ...recordData } = updatedRecord;

      // Normalize time format to ensure HH:MM format
      const normalizeTimeFormat = (timeStr: string): string => {
        if (!timeStr) return '';
        return timeStr.split(':').slice(0, 2).join(':'); // Ensure HH:MM format
      };

      // Create payload with proper formats
      const payload = {
        ...recordData,
        date: normalizeDateFormat(recordData.date),
        start_time: normalizeTimeFormat(recordData.start_time),
        end_time: normalizeTimeFormat(recordData.end_time),
      };

      await pb.collection('ccr_downtime_data').update(id, payload);
      return updatedRecord;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data', record.date] });
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data'], exact: false });
    },
  });

  const deleteDowntimeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      // First fetch the record to get the date for selective invalidation
      const record = await pb.collection('ccr_downtime_data').getOne(recordId);

      if (!record) {
        throw new Error('Record not found for deletion');
      }

      await pb.collection('ccr_downtime_data').delete(recordId);

      return (record as unknown as { date: string }).date;
    },
    onSuccess: (date) => {
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data', date] });
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data'], exact: false });
    },
  });

  // Debounced invalidate function to prevent excessive re-renders
  const debouncedInvalidate = useCallback(
    debounce(() => {
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data'] });
    }, 1000), // 1 second debounce
    [queryClient]
  );

  // Realtime subscription for ccr_downtime_data changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    pb.collection('ccr_downtime_data')
      .subscribe('*', () => {
        // CCR downtime data change received
        debouncedInvalidate();
      })
      .then((unsubFunc) => {
        unsubscribe = unsubFunc;
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [queryClient]);

  // Helper functions
  const getDowntimeForDate = (targetDate: string): CcrDowntimeData[] => {
    // Normalize tanggal untuk mencegah masalah format
    const normalizedTargetDate = normalizeDateFormat(targetDate);

    logger.debug(
      `Getting downtime for targetDate: ${targetDate} (normalized: ${normalizedTargetDate})`
    );
    logger.debug(`Total records in memory: ${downtimeData.length}`);

    // Menangani variasi format tanggal (jika perlu)
    const isValidDateFormat = (dateStr: string) => {
      // Menerima format YYYY-MM-DD dan variasi format lainnya yang mungkin ada di DB
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    };

    if (!isValidDateFormat(normalizedTargetDate)) {
      logger.debug(`Invalid date format: "${normalizedTargetDate}". Returning empty array.`);
      return [];
    }

    if (downtimeData.length === 0) {
      logger.debug(
        `No data in memory. Date format is valid, but no records found. Returning empty array.`
      );
      return [];
    }

    // If hook was called with a specific date, data is already filtered
    if (date) {
      logger.debug(
        `Hook called with specific date: ${date}, comparing with ${normalizedTargetDate}`
      );
      // Membandingkan tanggal yang sudah dinormalisasi
      return date === normalizedTargetDate ? downtimeData : [];
    }

    // Otherwise filter client-side with normalized comparison
    const filteredData = downtimeData.filter((d) => {
      // Normalisasi tanggal dari database juga
      const dbDate = normalizeDateFormat(d.date);

      // Perbandingan fleksibel - coba exact match terlebih dahulu
      let matches = dbDate === normalizedTargetDate;

      // Jika tidak match dan ini adalah object dengan datetime stamp, cobalah bandingkan hanya tanggal
      if (!matches && typeof d.date === 'string' && d.date.includes('T')) {
        // Tanggal mungkin disimpan sebagai ISO string penuh (dengan waktu)
        const datePart = d.date.split('T')[0];
        matches = datePart === normalizedTargetDate;
      }

      logger.debug(
        `Comparing DB date: ${d.date} (normalized: ${dbDate}) with target: ${normalizedTargetDate}, matches: ${matches}`
      );
      return matches;
    });

    logger.debug(`Filtered data count: ${filteredData.length}`);

    // Log full records for debugging if there are only a few
    if (filteredData.length > 0 && filteredData.length < 5) {
      logger.debug('Filtered records:', filteredData);
    }

    return filteredData;
  };

  const getAllDowntime = (): CcrDowntimeData[] => {
    return downtimeData;
  };

  const addDowntime = async (record: Omit<CcrDowntimeData, 'id'>) => {
    try {
      await addDowntimeMutation.mutateAsync(record);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const updateDowntime = async (updatedRecord: CcrDowntimeData) => {
    try {
      await updateDowntimeMutation.mutateAsync(updatedRecord);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const deleteDowntime = async (recordId: string) => {
    try {
      await deleteDowntimeMutation.mutateAsync(recordId);
    } catch {
      // Error deleting downtime
    }
  };

  return {
    loading,
    error,
    getDowntimeForDate,
    getAllDowntime,
    addDowntime,
    updateDowntime,
    deleteDowntime,
    refetch,
  };
};

export default useCcrDowntimeData;

