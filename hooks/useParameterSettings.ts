import { useState, useCallback, useEffect } from 'react';
import { ParameterSetting } from '../types';
import { supabase } from '../utils/supabase';

export const useParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first (cache for 1 hour)
    const cacheKey = 'parameter_settings_cache';
    const cacheTimestampKey = 'parameter_settings_cache_timestamp';
    const now = Date.now();
    const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 3600000) {
      // 1 hour
      try {
        const parsedData = JSON.parse(cachedData);
        setRecords(parsedData);
        setLoading(false);
        return;
      } catch (error) {
        console.warn('Failed to parse cached parameter settings data:', error);
      }
    }

    const { data, error } = await supabase
      .from('parameter_settings')
      .select('*')
      .order('parameter')
      .limit(500) as { data: any; error: any }; // Limit for performance, parameter settings shouldn't be too many

    if (error) {
      console.error('Error fetching parameter settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as ParameterSetting[]);
      // Cache the data
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data || []));
        localStorage.setItem(cacheTimestampKey, now.toString());
      } catch (error) {
        console.warn('Failed to cache parameter settings data:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<ParameterSetting, 'id'>) => {
      const { error } = await supabase.from('parameter_settings').insert([record as any]);
      if (error) console.error('Error adding parameter setting:', error);
      else {
        // Invalidate cache
        localStorage.removeItem('parameter_settings_cache');
        localStorage.removeItem('parameter_settings_cache_timestamp');
        fetchRecords();
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ParameterSetting) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase
        .from('parameter_settings')
        .update(updateData as any)
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
          .select('id') as { data: any; error: any };

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
              (existingRecords as { id: string }[]).map((r) => r.id)
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
            .insert(newRecords as any[]);

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
