import { useState, useCallback, useEffect } from 'react';
import { PicSetting } from '../types';
import { supabase } from '../utils/supabase';

export const usePicSettings = () => {
  const [records, setRecords] = useState<PicSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pic_settings').select('*').order('pic');

    if (error) {
      console.error('Error fetching PIC settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as unknown as PicSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription for pic_settings changes
  useEffect(() => {
    const channel = supabase
      .channel('pic_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pic_settings',
        },
        (payload) => {
          console.log(
            'PIC settings realtime update:',
            payload.eventType,
            payload.new || payload.old
          );

          // Optimized state updates based on event type
          if (payload.eventType === 'INSERT' && payload.new) {
            setRecords((prev) =>
              [...prev, payload.new as PicSetting].sort((a, b) => a.pic.localeCompare(b.pic))
            );
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setRecords((prev) =>
              prev.map((record) =>
                record.id === payload.new.id ? (payload.new as PicSetting) : record
              )
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
    async (record: Omit<PicSetting, 'id'>) => {
      const { error } = await supabase.from('pic_settings').insert([record]);
      if (error) console.error('Error adding PIC setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: PicSetting) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('pic_settings').update(updateData).eq('id', id);
      if (error) console.error('Error updating PIC setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('pic_settings').delete().eq('id', recordId);
      if (error) console.error('Error deleting PIC setting:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<PicSetting, 'id'>[]) => {
      const { error: deleteError } = await supabase.from('pic_settings').delete().neq('id', '0');
      if (deleteError) {
        console.error('Error clearing PIC settings:', deleteError);
        return;
      }
      const { error: insertError } = await supabase.from('pic_settings').insert(newRecords);
      if (insertError) console.error('Error bulk inserting PIC settings:', insertError);
      else fetchRecords();
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};
