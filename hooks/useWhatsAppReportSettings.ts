import { useState, useCallback, useEffect } from 'react';
import { WhatsAppReportSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';

export const useWhatsAppReportSettings = () => {
  const [records, setRecords] = useState<WhatsAppReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection('whatsapp_report_settings').getFullList({
        sort: 'category',
      });
      setRecords(result as unknown as WhatsAppReportSetting[]);
    } catch (error) {
      console.error('Error fetching WhatsApp report settings:', error);
      setRecords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<WhatsAppReportSetting, 'id'>) => {
      try {
        await pb.collection('whatsapp_report_settings').create(record);
        fetchRecords();
      } catch (error) {
        console.error('Error adding WhatsApp report setting:', error);
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: WhatsAppReportSetting) => {
      const { id, ...updateData } = updatedRecord;
      try {
        await pb.collection('whatsapp_report_settings').update(id, updateData);
        fetchRecords();
      } catch (error) {
        console.error('Error updating WhatsApp report setting:', error);
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('whatsapp_report_settings').delete(recordId);
        fetchRecords();
      } catch (error) {
        console.error('Error deleting WhatsApp report setting:', error);
      }
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<WhatsAppReportSetting, 'id'>[]) => {
      try {
        // First, get all existing records to delete them
        const existingRecords = await pb.collection('whatsapp_report_settings').getFullList();

        // Delete all existing records if any exist
        if (existingRecords && existingRecords.length > 0) {
          for (const record of existingRecords) {
            await pb.collection('whatsapp_report_settings').delete(record.id);
          }
        }

        // Insert new records
        if (newRecords.length > 0) {
          for (const record of newRecords) {
            await pb.collection('whatsapp_report_settings').create(record);
          }
        }

        fetchRecords();
      } catch (error) {
        console.error('Error in setAllRecords:', error);
      }
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

