import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AutonomousRiskData } from '../types';
import { supabase } from '../utils/supabase';

// Query keys for React Query
const RISK_DATA_QUERY_KEY = ['autonomous-risk-data'];

export const useAutonomousRiskData = () => {
  const queryClient = useQueryClient();

  // Fetch all risk records with React Query caching
  const {
    data: records = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: RISK_DATA_QUERY_KEY,
    queryFn: async (): Promise<AutonomousRiskData[]> => {
      const { data, error: fetchError } = await supabase
        .from('autonomous_risk_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000);

      if (fetchError) {
        console.error('Error fetching autonomous risk data:', fetchError);
        throw new Error(`Failed to fetch risk data: ${fetchError.message}`);
      }

      return (data || []) as unknown as AutonomousRiskData[];
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
  const addRecordMutation = useMutation({
    mutationFn: async (record: Omit<AutonomousRiskData, 'id'>) => {
      const { error } = await supabase.from('autonomous_risk_data').insert([record]);
      if (error) {
        throw new Error(`Failed to add risk record: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (updatedRecord: AutonomousRiskData) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('autonomous_risk_data').update(updateData).eq('id', id);
      if (error) {
        throw new Error(`Failed to update risk record: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase.from('autonomous_risk_data').delete().eq('id', recordId);
      if (error) {
        throw new Error(`Failed to delete risk record: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  // Realtime subscription for autonomous_risk_data changes
  useEffect(() => {
    const channel = supabase
      .channel('autonomous_risk_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'autonomous_risk_data',
        },
        (payload) => {
          console.log('Autonomous risk data change received!', payload);
          queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Wrapper functions for backward compatibility
  const addRecord = async (record: Omit<AutonomousRiskData, 'id'>) => {
    try {
      await addRecordMutation.mutateAsync(record);
    } catch (error) {
      console.error('Error adding risk record:', error);
    }
  };

  const updateRecord = async (updatedRecord: AutonomousRiskData) => {
    try {
      await updateRecordMutation.mutateAsync(updatedRecord);
    } catch (error) {
      console.error('Error updating risk record:', error);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      await deleteRecordMutation.mutateAsync(recordId);
    } catch (error) {
      console.error('Error deleting risk record:', error);
    }
  };

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch,
  };
};
