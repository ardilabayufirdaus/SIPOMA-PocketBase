import { useState, useCallback, useEffect } from 'react';
import { WhatsAppReportSetting } from '../types';
import { supabase } from '../utils/supabase';

export const useWhatsAppReportSettings = () => {
  const [records, setRecords] = useState<WhatsAppReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_report_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching WhatsApp report settings:', error);
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
    async (record: Omit<WhatsAppReportSetting, 'id'>) => {
      const { error } = await supabase.from('whatsapp_report_settings').insert([record]);
      if (error) console.error('Error adding WhatsApp report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: WhatsAppReportSetting) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase
        .from('whatsapp_report_settings')
        .update(updateData)
        .eq('id', id);
      if (error) console.error('Error updating WhatsApp report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('whatsapp_report_settings').delete().eq('id', recordId);
      if (error) console.error('Error deleting WhatsApp report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<WhatsAppReportSetting, 'id'>[]) => {
      const { error: deleteError } = await supabase
        .from('whatsapp_report_settings')
        .delete()
        .neq('id', '0');
      if (deleteError) {
        console.error('Error clearing WhatsApp report settings:', deleteError);
        return;
      }

      if (newRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('whatsapp_report_settings')
          .insert(newRecords);
        if (insertError) {
          console.error('Error inserting WhatsApp report settings:', insertError);
        }
      }

      fetchRecords();
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
    refetch: fetchRecords,
  };
};
