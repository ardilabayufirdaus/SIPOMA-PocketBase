import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AutonomousRiskData } from '../types';
import { pb } from '../utils/pocketbase';

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
      const result = await pb.collection('autonomous_risk_data').getFullList({
        sort: '-date',
        limit: 1000,
      });

      return (result || []) as unknown as AutonomousRiskData[];
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
      await pb.collection('autonomous_risk_data').create(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (updatedRecord: AutonomousRiskData) => {
      const { id, ...updateData } = updatedRecord;
      await pb.collection('autonomous_risk_data').update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await pb.collection('autonomous_risk_data').delete(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
    },
  });

  // Realtime subscription for autonomous_risk_data changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    pb.collection('autonomous_risk_data')
      .subscribe('*', () => {
        queryClient.invalidateQueries({ queryKey: RISK_DATA_QUERY_KEY });
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient]);

  // Wrapper functions for backward compatibility
  const addRecord = async (record: Omit<AutonomousRiskData, 'id'>) => {
    try {
      await addRecordMutation.mutateAsync(record);
    } catch {
      // Error handled by mutation
    }
  };

  const updateRecord = async (updatedRecord: AutonomousRiskData) => {
    try {
      await updateRecordMutation.mutateAsync(updatedRecord);
    } catch {
      // Error handled by mutation
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      await deleteRecordMutation.mutateAsync(recordId);
    } catch {
      // Error handled by mutation
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
