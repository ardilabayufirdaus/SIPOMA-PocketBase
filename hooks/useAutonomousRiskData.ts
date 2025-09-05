import { useState, useCallback, useEffect } from 'react';
import { AutonomousRiskData } from '../types';
import { supabase } from '../utils/supabase';

export const useAutonomousRiskData = () => {
  const [records, setRecords] = useState<AutonomousRiskData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('autonomous_risk_data')
        .select('*')
        .order('date', { ascending: false });

    if(error) {
        console.error('Error fetching autonomous risk data:', error);
        setRecords([]);
    } else {
        setRecords((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
      fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(async (record: Omit<AutonomousRiskData, 'id'>) => {
    const { error } = await supabase.from('autonomous_risk_data').insert([record]);
    if (error) console.error('Error adding risk record:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(async (updatedRecord: AutonomousRiskData) => {
    const { id, ...updateData } = updatedRecord;
    const { error } = await supabase.from('autonomous_risk_data').update(updateData).eq('id', id);
    if (error) console.error('Error updating risk record:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (recordId: string) => {
    const { error } = await supabase.from('autonomous_risk_data').delete().eq('id', recordId);
    if (error) console.error('Error deleting risk record:', error);
    else fetchRecords();
  }, [fetchRecords]);

  return { records, loading, addRecord, updateRecord, deleteRecord };
};