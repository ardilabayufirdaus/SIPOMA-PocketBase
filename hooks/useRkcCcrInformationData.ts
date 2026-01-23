import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { formatDateToISO8601 } from '../utils/dateUtils';
import { safeApiCall } from '../utils/connectionCheck';

export interface CcrInformationData {
  id: string;
  date: string; // YYYY-MM-DD
  plant_unit: string;
  information: string;
  created_at?: string;
  updated_at?: string;
}

export const useRkcCcrInformationData = () => {
  const queryClient = useQueryClient();

  // Fetch information data for a specific date and plant unit from rkc_ccr_information_data
  const {
    data: informationData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rkc-ccr-information'],
    queryFn: async (): Promise<CcrInformationData[]> => {
      try {
        const records = await safeApiCall(() =>
          pb.collection('rkc_ccr_information').getFullList({
            sort: '-date',
          })
        );
        return records as unknown as CcrInformationData[];
      } catch (error) {
        if ((error as any)?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get information for specific date and plant unit
  const getInformationForDate = useCallback(
    (date: string, plantUnit: string): CcrInformationData | null => {
      if (!informationData) return null;

      // Format date consistently
      const formattedDate = formatDateToISO8601(date);

      return (
        informationData.find(
          (info) => info.date === formattedDate && info.plant_unit === plantUnit
        ) || null
      );
    },
    [informationData]
  );

  // Save/Update information mutation
  const saveInformationMutation = useMutation({
    mutationFn: async (data: { date: string; plantUnit: string; information: string }) => {
      const formattedDate = formatDateToISO8601(data.date);
      const allRecords = await safeApiCall(() =>
        pb.collection('rkc_ccr_information').getFullList()
      );

      if (!allRecords) {
        throw new Error('Failed to fetch existing records due to network issues');
      }

      const existingRecord = allRecords.find(
        (record) => record.date === formattedDate && record.plant_unit === data.plantUnit
      );

      let result;
      if (existingRecord) {
        // Update existing record
        result = await safeApiCall(() =>
          pb.collection('rkc_ccr_information').update(existingRecord.id, {
            information: data.information,
            updated_at: new Date().toISOString(),
          })
        );
      } else {
        // Create new record
        result = await safeApiCall(() =>
          pb.collection('rkc_ccr_information').create({
            date: formattedDate,
            plant_unit: data.plantUnit,
            information: data.information,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
      }

      if (!result) {
        throw new Error('Failed to save information due to network issues');
      }

      const formattedResult = {
        ...result,
        date: formatDateToISO8601(result.date || formattedDate),
      };

      return formattedResult as unknown as CcrInformationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rkc-ccr-information'] });
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
