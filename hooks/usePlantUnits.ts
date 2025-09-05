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
      .order('unit');
    
    if (error) {
      console.error('Error fetching plant units:', error);
      setRecords([]);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(async (record: Omit<PlantUnit, 'id'>) => {
    const { error } = await supabase.from('plant_units').insert([record]);
    if (error) console.error('Error adding plant unit:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(async (updatedRecord: PlantUnit) => {
    const { id, ...updateData } = updatedRecord;
    const { error } = await supabase.from('plant_units').update(updateData).eq('id', id);
    if (error) console.error('Error updating plant unit:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (recordId: string) => {
    const { error } = await supabase.from('plant_units').delete().eq('id', recordId);
    if (error) console.error('Error deleting plant unit:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const setAllRecords = useCallback(async (newRecords: Omit<PlantUnit, 'id'>[]) => {
    // This is a more complex operation, ideally done in a transaction or server-side function.
    // For simplicity here, we'll delete all and insert new.
    // WARNING: This is destructive and not recommended for production without proper safeguards.
    const { error: deleteError } = await supabase.from('plant_units').delete().neq('id', '0'); // A trick to delete all rows
    if (deleteError) {
      console.error('Error clearing plant units:', deleteError);
      return;
    }
    const { error: insertError } = await supabase.from('plant_units').insert(newRecords);
    if (insertError) console.error('Error bulk inserting plant units:', insertError);
    else fetchRecords();
  }, [fetchRecords]);


  return { records, addRecord, updateRecord, deleteRecord, setAllRecords, loading };
};