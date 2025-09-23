import { useState, useCallback, useEffect } from 'react';
import { PicSetting } from '../types';
import { supabase } from '../utils/supabase';

export const usePicSettings = () => {
  const [records, setRecords] = useState<PicSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = (await supabase.from('pic_settings').select('*').order('pic')) as {
      data: any;
      error: any;
    };

    if (error) {
      console.error('Error fetching PIC settings:', error);
      setRecords([]);
    } else {
      setRecords((data || []) as PicSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Realtime subscription for pic_settings changes
  useEffect(() => {
    const channel = supabase
      .channel('pic_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pic_settings',
        },
        (payload) => {
          console.log('PIC settings change received!', payload);
          fetchRecords();
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
