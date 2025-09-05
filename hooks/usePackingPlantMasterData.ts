import { useState, useCallback, useEffect } from 'react';
import { PackingPlantMasterRecord } from '../types';
import { supabase } from '../utils/supabase';

export const usePackingPlantMasterData = () => {
  const [records, setRecords] = useState<PackingPlantMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packing_plant_master')
      .select('*')
      .order('area')
      .order('plant_code');
      
    if (error) {
      console.error('Error fetching packing plant master data:', error);
      setRecords([]);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(async (record: Omit<PackingPlantMasterRecord, 'id'>) => {
    const { error } = await supabase.from('packing_plant_master').insert([record]);
    if (error) console.error('Error adding packing plant master data:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(async (updatedRecord: PackingPlantMasterRecord) => {
    const { id, ...updateData } = updatedRecord;
    const { error } = await supabase.from('packing_plant_master').update(updateData).eq('id', id);
    if (error) console.error('Error updating packing plant master data:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (recordId: string) => {
    const { error } = await supabase.from('packing_plant_master').delete().eq('id', recordId);
    if (error) console.error('Error deleting packing plant master data:', error);
    else fetchRecords();
  }, [fetchRecords]);

  return { records, loading, addRecord, updateRecord, deleteRecord };
};