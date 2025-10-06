import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface CcrInformationData {
  id: string;
  date: string; // YYYY-MM-DD
  plant_unit: string;
  information: string;
  created_at?: string;
  updated_at?: string;
}

export const useCcrInformationData = () => {
  const queryClient = useQueryClient();

  // Fetch information data for a specific date and plant unit
  const {
    data: informationData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ccr-information-data'],
    queryFn: async (): Promise<CcrInformationData[]> => {
      const { data, error } = await supabase
        .from('ccr_information')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch information data: ${error.message}`);
      }

      return (data || []) as unknown as CcrInformationData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get information for specific date and plant unit
  const getInformationForDate = useCallback(
    (date: string, plantUnit: string): CcrInformationData | null => {
      if (!informationData) return null;
      return (
        informationData.find((info) => info.date === date && info.plant_unit === plantUnit) || null
      );
    },
    [informationData]
  );

  // Save/Update information mutation
  const saveInformationMutation = useMutation({
    mutationFn: async (data: { date: string; plantUnit: string; information: string }) => {
      // Use upsert to handle both insert and update cases
      const { data: upsertedData, error } = await supabase
        .from('ccr_information')
        .upsert(
          {
            date: data.date,
            plant_unit: data.plantUnit,
            information: data.information,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'date,plant_unit',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save information: ${error.message}`);
      }

      return upsertedData as unknown as CcrInformationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ccr-information-data'] });
    },
  });

  return {
    informationData: informationData || [],
    loading,
    error,
    refetch,
    getInformationForDate,
    saveInformation: saveInformationMutation.mutate,
    saveInformationAsync: saveInformationMutation.mutateAsync,
    isSaving: saveInformationMutation.isPending,
  };
};
