import { useState, useCallback, useEffect } from 'react';
import { ParameterSetting } from '../types';
import { supabase } from '../utils/supabase';
import { cacheManager } from '../utils/cacheManager';

export const useParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cacheKey = 'parameter_settings';
    const cached = cacheManager.get<ParameterSetting[]>(cacheKey);
    if (cached) {
      setRecords(cached as unknown as ParameterSetting[]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('parameter_settings')
      .select('*')
      .order('parameter')
      .limit(500);

    if (error) {
      console.error('Error fetching parameter settings:', error);
      setRecords([]);
    } else {
      const typedData = (data || []) as unknown as ParameterSetting[];
      setRecords(typedData);
      // Cache for 30 minutes since parameter settings don't change frequently
      cacheManager.set(cacheKey, typedData, 30);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription for parameter_settings changes
  useEffect(() => {
    const channel = supabase
      .channel('parameter_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parameter_settings',
        },
        (payload) => {
          console.log(
            'Parameter settings realtime update:',
            payload.eventType,
            payload.new || payload.old
          );

          // Clear cache when data changes
          cacheManager.delete('parameter_settings');

          // Optimized state updates based on event type
          if (payload.eventType === 'INSERT' && payload.new) {
            setRecords((prev) =>
              [...prev, payload.new as ParameterSetting].sort((a, b) =>
                a.parameter.localeCompare(b.parameter)
              )
            );
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setRecords((prev) =>
              prev.map((record) =>
                record.id === payload.new.id ? (payload.new as ParameterSetting) : record
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setRecords((prev) => prev.filter((record) => record.id !== payload.old.id));
          } else {
            // Fallback to full refetch for complex changes
            fetchRecords();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<ParameterSetting, 'id'>) => {
      // Convert undefined values to null for Supabase compatibility
      const cleanedRecord = {
        ...record,
        min_value: record.min_value === undefined ? null : record.min_value,
        max_value: record.max_value === undefined ? null : record.max_value,
        opc_min_value: record.opc_min_value === undefined ? null : record.opc_min_value,
        opc_max_value: record.opc_max_value === undefined ? null : record.opc_max_value,
        pcc_min_value: record.pcc_min_value === undefined ? null : record.pcc_min_value,
        pcc_max_value: record.pcc_max_value === undefined ? null : record.pcc_max_value,
      };

      const { error } = await supabase.from('parameter_settings').insert([cleanedRecord]);
      if (error) console.error('Error adding parameter setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ParameterSetting) => {
      const { id, ...updateData } = updatedRecord;

      // Convert undefined values to null for Supabase compatibility
      const cleanedUpdateData = {
        ...updateData,
        min_value: updateData.min_value === undefined ? null : updateData.min_value,
        max_value: updateData.max_value === undefined ? null : updateData.max_value,
        opc_min_value: updateData.opc_min_value === undefined ? null : updateData.opc_min_value,
        opc_max_value: updateData.opc_max_value === undefined ? null : updateData.opc_max_value,
        pcc_min_value: updateData.pcc_min_value === undefined ? null : updateData.pcc_min_value,
        pcc_max_value: updateData.pcc_max_value === undefined ? null : updateData.pcc_max_value,
      };

      const { error } = await supabase
        .from('parameter_settings')
        .update(cleanedUpdateData)
        .eq('id', id);
      if (error) console.error('Error updating parameter setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('parameter_settings').delete().eq('id', recordId);
      if (error) console.error('Error deleting parameter setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ParameterSetting, 'id'>[]) => {
      try {
        // First, get all existing records to delete them properly
        const { data: existingRecords, error: fetchError } = await supabase
          .from('parameter_settings')
          .select('id');

        if (fetchError) {
          console.error('Error fetching existing parameter settings:', fetchError);
          return;
        }

        // Delete all existing records if any exist
        if (existingRecords && existingRecords.length > 0) {
          const { error: deleteError } = await supabase
            .from('parameter_settings')
            .delete()
            .in(
              'id',
              (existingRecords as unknown as { id: string }[]).map((r) => r.id)
            );

          if (deleteError) {
            console.error('Error clearing parameter settings:', deleteError);
            return;
          }
        }

        // Insert new records
        if (newRecords.length > 0) {
          const { error: insertError } = await supabase
            .from('parameter_settings')
            .insert(newRecords);

          if (insertError) {
            console.error('Error bulk inserting parameter settings:', insertError);
            return;
          }
        }

        // Refresh the data
        fetchRecords();
      } catch (error) {
        console.error('Error in setAllRecords:', error);
      }
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    setAllRecords,
  };
};
