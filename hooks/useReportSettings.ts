import { useState, useCallback, useEffect } from 'react';
import { ReportSetting } from '../types';
import { supabase } from '../utils/supabase';

export const useReportSettings = () => {
  const [records, setRecords] = useState<ReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('report_settings')
      .select('*')
      .order('category');
      
    if (error) {
      console.error('Error fetching report settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(async (record: Omit<ReportSetting, 'id'>) => {
    const { error } = await supabase.from('report_settings').insert([record]);
    if (error) console.error('Error adding report setting:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(async (updatedRecord: ReportSetting) => {
    const { id, ...updateData } = updatedRecord;
    const { error } = await supabase.from('report_settings').update(updateData).eq('id', id);
    if (error) console.error('Error updating report setting:', error);
    else fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (recordId: string) => {
    const { error } = await supabase.from('report_settings').delete().eq('id', recordId);
    if (error) console.error('Error deleting report setting:', error);
    else fetchRecords();
  }, [fetchRecords]);
  
  const setAllRecords = useCallback(async (newRecords: Omit<ReportSetting, 'id'>[]) => {
    const { error: deleteError } = await supabase.from('report_settings').delete().neq('id', '0');
    if (deleteError) {
      console.error('Error clearing report settings:', deleteError);
      return;
    }
    const { error: insertError } = await supabase.from('report_settings').insert(newRecords);
    if (insertError) console.error('Error bulk inserting report settings:', insertError);
    else fetchRecords();
  }, [fetchRecords]);

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};