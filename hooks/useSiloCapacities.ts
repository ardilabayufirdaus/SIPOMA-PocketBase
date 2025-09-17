import { useState, useCallback, useEffect } from 'react';
import { SiloCapacity } from '../types';
import { supabase } from '../utils/supabase';

export const useSiloCapacities = () => {
  const [records, setRecords] = useState<SiloCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('silo_capacities').select('*').order('silo_name');

    if (error) {
      console.error('Error fetching silo capacities:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<SiloCapacity, 'id'>) => {
      const { error } = await supabase.from('silo_capacities').insert([record]);
      if (error) console.error('Error adding silo capacity:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: SiloCapacity) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('silo_capacities').update(updateData).eq('id', id);
      if (error) console.error('Error updating silo capacity:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('silo_capacities').delete().eq('id', recordId);
      if (error) console.error('Error deleting silo capacity:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<SiloCapacity, 'id'>[]) => {
      const { error: deleteError } = await supabase.from('silo_capacities').delete().neq('id', '0');
      if (deleteError) {
        console.error('Error clearing silo capacities:', deleteError);
        return;
      }
      const { error: insertError } = await supabase.from('silo_capacities').insert(newRecords);
      if (insertError) console.error('Error bulk inserting silo capacities:', insertError);
      else fetchRecords();
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};
