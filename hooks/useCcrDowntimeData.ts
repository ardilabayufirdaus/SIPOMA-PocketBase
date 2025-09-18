import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CcrDowntimeData } from '../types';
import { supabase } from '../utils/supabase';

// Query keys for React Query
const DOWNTIME_QUERY_KEY = ['ccr-downtime-data'];

const useCcrDowntimeData = () => {
  const queryClient = useQueryClient();

  // Fetch all downtime data with React Query caching
  const {
    data: downtimeData = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: DOWNTIME_QUERY_KEY,
    queryFn: async (): Promise<CcrDowntimeData[]> => {
      const { data, error } = await supabase
        .from('ccr_downtime_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000); // Limit to last 1000 records for performance

      if (error) {
        console.error('Error fetching all downtime data:', error);
        throw new Error(`Failed to fetch downtime data: ${error.message}`);
      }

      // FIX: Database sebenarnya sudah menggunakan snake_case, tidak perlu mapping
      return ((data || []) as any[]).map((d) => ({
        id: d.id,
        date: d.date,
        start_time: d.start_time,
        end_time: d.end_time,
        pic: d.pic,
        problem: d.problem,
        unit: d.unit,
        action: d.action,
        corrective_action: d.corrective_action,
        status: d.status,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOWNTIME_QUERY_KEY });
    },
  });

  const updateDowntimeMutation = useMutation({
    mutationFn: async (updatedRecord: CcrDowntimeData) => {
      const { id, ...payload } = updatedRecord;
      const { error } = await supabase.from('ccr_downtime_data').update(payload).eq('id', id);
      if (error) {
        throw new Error(`Failed to update downtime: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOWNTIME_QUERY_KEY });
    },
  });

  const deleteDowntimeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase.from('ccr_downtime_data').delete().eq('id', recordId);
      if (error) {
        throw new Error(`Failed to delete downtime: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOWNTIME_QUERY_KEY });
    },
  });

  // Helper functions
  const getDowntimeForDate = (date: string): CcrDowntimeData[] => {
    return downtimeData.filter((d) => d.date === date);
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
    } catch (error) {
      console.error('Error deleting downtime:', error);
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
