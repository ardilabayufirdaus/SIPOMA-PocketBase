import { useState, useCallback, useEffect } from 'react';
import { PlantUnit } from '../types';
import { supabase } from '../utils/supabase';

export const usePlantUnits = () => {
  const [records, setRecords] = useState<PlantUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('plant_units')
      .select('*')
      .order('category')
      .order('unit')
      .limit(500);

    if (error) {
      console.error('Error fetching plant units:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as unknown as PlantUnit[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Realtime subscription for plant_units changes
  useEffect(() => {
    const channel = supabase
      .channel('plant_units_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plant_units',
        },
        (payload) => {
          console.log('Plant units change received!', payload);
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<PlantUnit, 'id'>) => {
      const { error } = await supabase.from('plant_units').insert([record]);
      if (error) console.error('Error adding plant unit:', error);
      else fetchRecords();
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
          .select('id');

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
              (existingRecords as unknown as { id: string }[]).map((r) => r.id)
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
