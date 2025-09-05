import { useState, useCallback, useEffect } from 'react';
import { ParameterSetting } from '../types';
import { supabase } from '../utils/supabase';

export const useParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parameter_settings')
      .select('*')
      .order('parameter');
      
    if (error) {
      console.error('Error fetching parameter settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(async (record: Omit<ParameterSetting, 'id'>) => {
    const { error } = await supabase.from('parameter_settings').insert([record as any]);
    if (error) console.error('Error adding parameter setting:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(async (updatedRecord: ParameterSetting) => {
    const { id, ...updateData } = updatedRecord;
    const { error } = await supabase.from('parameter_settings').update(updateData as any).eq('id', id);
    if (error) console.error('Error updating parameter setting:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (recordId: string) => {
    const { error } = await supabase.from('parameter_settings').delete().eq('id', recordId);
    if (error) console.error('Error deleting parameter setting:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const setAllRecords = useCallback(async (newRecords: Omit<ParameterSetting, 'id'>[]) => {
    const { error: deleteError } = await supabase.from('parameter_settings').delete().neq('id', '0');
    if (deleteError) {
      console.error('Error clearing parameter settings:', deleteError);
      return;
    }
    const { error: insertError } = await supabase.from('parameter_settings').insert(newRecords as any[]);
    if (insertError) console.error('Error bulk inserting parameter settings:', insertError);
    else fetchRecords();
  }, [fetchRecords]);

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};