import { useState, useCallback, useEffect } from 'react';
import { ReportSetting } from '../types';
import { supabase } from '../utils/supabase';

export const useReportSettings = () => {
  const [records, setRecords] = useState<ReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('report_settings').select('*').order('order');

    if (error) {
      console.error('Error fetching report settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as unknown as ReportSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription for report_settings changes
  useEffect(() => {
    const channel = supabase
      .channel('report_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_settings',
        },
        (payload) => {
          console.log(
            'Report settings realtime update:',
            payload.eventType,
            payload.new || payload.old
          );

          // Optimized state updates based on event type
          if (payload.eventType === 'INSERT' && payload.new) {
            setRecords((prev) =>
              [...prev, payload.new as ReportSetting].sort((a, b) => a.order - b.order)
            );
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setRecords((prev) =>
              prev
                .map((record) =>
                  record.id === payload.new.id ? (payload.new as ReportSetting) : record
                )
                .sort((a, b) => a.order - b.order)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setRecords((prev) => prev.filter((record) => record.id !== payload.old.id));
          } else {
            // Fallback to full refetch for complex changes
            fetchRecords();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<ReportSetting, 'id'>) => {
      const { error } = await supabase.from('report_settings').insert([record]);
      if (error) console.error('Error adding report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ReportSetting) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('report_settings').update(updateData).eq('id', id);
      if (error) console.error('Error updating report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('report_settings').delete().eq('id', recordId);
      if (error) console.error('Error deleting report setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ReportSetting, 'id'>[]) => {
      const { error: deleteError } = await supabase.from('report_settings').delete().neq('id', '0');
      if (deleteError) {
        console.error('Error clearing report settings:', deleteError);
        return;
      }
      const { error: insertError } = await supabase.from('report_settings').insert(newRecords);
      if (insertError) console.error('Error bulk inserting report settings:', insertError);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateOrder = useCallback(
    async (orderedRecords: ReportSetting[]) => {
      const promises = orderedRecords.map((record, index) =>
        supabase.from('report_settings').update({ order: index }).eq('id', record.id)
      );
      const results = await Promise.all(promises);
      const hasError = results.some((result) => result.error);
      if (hasError) console.error('Error updating report settings order');
      else fetchRecords();
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords, updateOrder };
};
