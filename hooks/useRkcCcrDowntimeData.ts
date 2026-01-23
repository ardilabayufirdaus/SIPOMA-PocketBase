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

export const useRkcCcrDowntimeData = (date?: string) => {
  const queryClient = useQueryClient();

  // Fetch downtime data with optional date filter for performance
  const {
    data: downtimeData = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rkc-ccr-downtime-data', date],
    queryFn: async (): Promise<CcrDowntimeData[]> => {
      try {
        let filter = '';
        if (date) {
          const normalizedDate = normalizeDateFormat(date);
          filter = `date="${normalizedDate}"`;
        }

        logger.debug('Fetching RKC downtime data with filter:', filter);

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 30000);

        try {
          let records;

          if (date) {
            const normalizedDate = normalizeDateFormat(date);

            // 1. Exact match
            records = await pb.collection('rkc_ccr_downtime_data').getFullList({
              filter: `date = "${normalizedDate}"`,
              sort: '-created',
              requestKey: `rkc-downtime-exact-${normalizedDate}-${Date.now()}`,
              signal: abortController.signal,
            });

            // 2. Flexible match (LIKE) if exact fails
            if (records.length === 0) {
              records = await pb.collection('rkc_ccr_downtime_data').getFullList({
                filter: `date ~ "${normalizedDate}"`,
                sort: '-created',
                requestKey: `rkc-downtime-flex-${normalizedDate}-${Date.now()}`,
                signal: abortController.signal,
              });
            }

            // 3. Fallback: fetch all and filter client-side
            if (records.length === 0) {
              const allRecords = await pb.collection('rkc_ccr_downtime_data').getFullList({
                sort: '-created',
                perPage: 100,
                requestKey: `rkc-downtime-all-${Date.now()}`,
                signal: abortController.signal,
              });

              records = allRecords.filter((record) => {
                const recordDate = normalizeDateFormat(record.date);
                return recordDate === normalizedDate;
              });
            }
          } else {
            records = await pb.collection('rkc_ccr_downtime_data').getFullList({
              sort: '-created',
              perPage: 1000,
              requestKey: `rkc-downtime-all-${Date.now()}`,
              signal: abortController.signal,
            });
          }

          return records as unknown as CcrDowntimeData[];
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('autocancelled')) {
            return (
              (queryClient.getQueryData(['rkc-ccr-downtime-data', date]) as CcrDowntimeData[]) || []
            );
          }
          if (error.name === 'AbortError') {
            return (
              (queryClient.getQueryData(['rkc-ccr-downtime-data', date]) as CcrDowntimeData[]) || []
            );
          }
        }

        throw new Error(
          `Failed to fetch RKC downtime data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const addDowntimeMutation = useMutation({
    mutationFn: async (record: Omit<CcrDowntimeData, 'id'>) => {
      const normalizedDate = normalizeDateFormat(record.date);
      const normalizeTimeFormat = (timeStr: string): string => {
        if (!timeStr) return '';
        return timeStr.split(':').slice(0, 2).join(':');
      };

      const payload = {
        ...record,
        date: normalizedDate,
        start_time: normalizeTimeFormat(record.start_time),
        end_time: normalizeTimeFormat(record.end_time),
      };

      try {
        const response = await pb.collection('rkc_ccr_downtime_data').create(payload);
        return record;
      } catch (error) {
        throw error;
      }
    },
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: ['rkc-ccr-downtime-data', newRecord.date] });
      const previousData = queryClient.getQueryData(['rkc-ccr-downtime-data', newRecord.date]);

      queryClient.setQueryData(
        ['rkc-ccr-downtime-data', newRecord.date],
        (old: CcrDowntimeData[] = []) => [{ ...newRecord, id: `temp-${Date.now()}` }, ...old]
      );

      return { previousData, date: newRecord.date };
    },
    onError: (err, newRecord, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['rkc-ccr-downtime-data', context.date], context.previousData);
      }
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data', record.date] });
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data'], exact: false });

      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['rkc-ccr-downtime-data', record.date] });
        queryClient.refetchQueries({ queryKey: ['rkc-ccr-downtime-data'], exact: false });
      }, 1000);
    },
  });

  const updateDowntimeMutation = useMutation({
    mutationFn: async (updatedRecord: CcrDowntimeData) => {
      const { id, ...recordData } = updatedRecord;

      const normalizeTimeFormat = (timeStr: string): string => {
        if (!timeStr) return '';
        return timeStr.split(':').slice(0, 2).join(':');
      };

      const payload = {
        ...recordData,
        date: normalizeDateFormat(recordData.date),
        start_time: normalizeTimeFormat(recordData.start_time),
        end_time: normalizeTimeFormat(recordData.end_time),
      };

      await pb.collection('rkc_ccr_downtime_data').update(id, payload);
      return updatedRecord;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data', record.date] });
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data'], exact: false });
    },
  });

  const deleteDowntimeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const record = await pb.collection('rkc_ccr_downtime_data').getOne(recordId);
      if (!record) {
        throw new Error('Record not found for deletion');
      }
      await pb.collection('rkc_ccr_downtime_data').delete(recordId);
      return (record as unknown as { date: string }).date;
    },
    onSuccess: (date) => {
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data', date] });
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data'], exact: false });
    },
  });

  const debouncedInvalidate = useCallback(
    debounce(() => {
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-downtime-data'] });
    }, 1000),
    [queryClient]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    pb.collection('rkc_ccr_downtime_data')
      .subscribe('*', () => {
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

  const getDowntimeForDate = (targetDate: string): CcrDowntimeData[] => {
    const normalizedTargetDate = normalizeDateFormat(targetDate);
    const isValidDateFormat = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

    if (!isValidDateFormat(normalizedTargetDate)) return [];
    if (downtimeData.length === 0) return [];

    if (date) {
      return date === normalizedTargetDate ? downtimeData : [];
    }

    return downtimeData.filter((d) => {
      const dbDate = normalizeDateFormat(d.date);
      let matches = dbDate === normalizedTargetDate;
      if (!matches && typeof d.date === 'string' && d.date.includes('T')) {
        const datePart = d.date.split('T')[0];
        matches = datePart === normalizedTargetDate;
      }
      return matches;
    });
  };

  const getAllDowntime = (): CcrDowntimeData[] => {
    return downtimeData;
  };

  const addDowntime = async (record: Omit<CcrDowntimeData, 'id'>) => {
    try {
      await addDowntimeMutation.mutateAsync(record);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateDowntime = async (updatedRecord: CcrDowntimeData) => {
    try {
      await updateDowntimeMutation.mutateAsync(updatedRecord);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

export default useRkcCcrDowntimeData;
