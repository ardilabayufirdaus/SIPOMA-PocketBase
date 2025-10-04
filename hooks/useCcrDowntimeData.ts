import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { CcrDowntimeData } from '../types';
import { supabase } from '../utils/supabase';

// Debounce utility for real-time updates
const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
      let query = supabase
        .from('ccr_downtime_data')
        .select('*')
        .order('date', { ascending: false });

      // Apply date filter if provided for better performance
      if (date) {
        query = query.eq('date', date);
      } else {
        // Limit when fetching all data
        query = query.limit(1000);
      }

      const { data, error } = await query;

      if (error) {
        // Error fetching downtime data
        throw new Error(`Failed to fetch downtime data: ${error.message}`);
      }

      return (data || []) as unknown as CcrDowntimeData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      const payload = { ...record };
      const { error } = await supabase.from('ccr_downtime_data').insert([payload]);
      if (error) {
        throw new Error(`Failed to add downtime: ${error.message}`);
      }
      return record;
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
      // Selectively invalidate to get real data
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data', record.date] });
      queryClient.invalidateQueries({ queryKey: ['ccr-downtime-data'], exact: false });
    },
  });

  const updateDowntimeMutation = useMutation({
    mutationFn: async (updatedRecord: CcrDowntimeData) => {
      const { id, ...payload } = updatedRecord;
      const { error } = await supabase.from('ccr_downtime_data').update(payload).eq('id', id);
      if (error) {
        throw new Error(`Failed to update downtime: ${error.message}`);
      }
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
      const { data: record, error: fetchError } = await supabase
        .from('ccr_downtime_data')
        .select('date')
        .eq('id', recordId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch record for deletion: ${fetchError.message}`);
      }

      if (!record) {
        throw new Error('Record not found for deletion');
      }

      const { error } = await supabase.from('ccr_downtime_data').delete().eq('id', recordId);
      if (error) {
        throw new Error(`Failed to delete downtime: ${error.message}`);
      }

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
    const channel = supabase
      .channel('ccr_downtime_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ccr_downtime_data',
        },
        (_payload) => {
          // CCR downtime data change received
          debouncedInvalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Helper functions
  const getDowntimeForDate = (targetDate: string): CcrDowntimeData[] => {
    // If hook was called with a specific date, data is already filtered
    if (date) {
      return date === targetDate ? downtimeData : [];
    }
    // Otherwise filter client-side
    return downtimeData.filter((d) => d.date === targetDate);
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
