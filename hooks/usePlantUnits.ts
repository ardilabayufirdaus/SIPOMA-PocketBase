import { useState, useCallback, useEffect } from 'react';
import { PlantUnit } from '../types';
import { supabase } from '../utils/supabase';

export const usePlantUnits = () => {
  const [records, setRecords] = useState<PlantUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first (cache for 1 hour)
    const cacheKey = 'plant_units_cache';
    const cacheTimestampKey = 'plant_units_cache_timestamp';
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
        console.warn('Failed to parse cached plant units data:', error);
      }
    }

    const { data, error } = await supabase
      .from('plant_units')
      .select('*')
      .order('category')
      .order('unit')
      .limit(500) as { data: any; error: any }; // Limit for performance, plant units shouldn't be too many

    if (error) {
      console.error('Error fetching plant units:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as PlantUnit[]);
      // Cache the data
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data || []));
        localStorage.setItem(cacheTimestampKey, now.toString());
      } catch (error) {
        console.warn('Failed to cache plant units data:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<PlantUnit, 'id'>) => {
      const { error } = await supabase.from('plant_units').insert([record]);
      if (error) console.error('Error adding plant unit:', error);
      else {
        // Invalidate cache
        localStorage.removeItem('plant_units_cache');
        localStorage.removeItem('plant_units_cache_timestamp');
        fetchRecords();
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: PlantUnit) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('plant_units').update(updateData).eq('id', id);
      if (error) console.error('Error updating plant unit:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('plant_units').delete().eq('id', recordId);
      if (error) console.error('Error deleting plant unit:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<PlantUnit, 'id'>[]) => {
      try {
        // First, get all existing records to delete them properly
        const { data: existingRecords, error: fetchError } = await supabase
          .from('plant_units')
          .select('id') as { data: any; error: any };

        if (fetchError) {
          console.error('Error fetching existing plant units:', fetchError);
          return;
        }

        // Delete all existing records if any exist
        if (existingRecords && existingRecords.length > 0) {
          const { error: deleteError } = await supabase
            .from('plant_units')
            .delete()
            .in(
              'id',
              (existingRecords as { id: string }[]).map((r) => r.id)
            );

          if (deleteError) {
            console.error('Error clearing plant units:', deleteError);
            return;
          }
        }

        // Insert new records
        if (newRecords.length > 0) {
          const { error: insertError } = await supabase.from('plant_units').insert(newRecords);

          if (insertError) {
            console.error('Error bulk inserting plant units:', insertError);
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
    addRecord,
    updateRecord,
    deleteRecord,
    setAllRecords,
    loading,
  };
};
