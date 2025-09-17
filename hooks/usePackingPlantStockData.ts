import { useState, useCallback, useEffect } from 'react';
import { PackingPlantStockRecord } from '../types';
import { supabase } from '../utils/supabase';

const processRecords = (data: PackingPlantStockRecord[]): PackingPlantStockRecord[] => {
  const groupedByArea = data.reduce(
    (acc, record) => {
      if (!acc[record.area]) {
        acc[record.area] = [];
      }

      // Ensure numeric values are properly converted from strings
      const processedRecord = {
        ...record,
        opening_stock:
          typeof record.opening_stock === 'string'
            ? parseFloat(record.opening_stock) || 0
            : record.opening_stock || 0,
        stock_received:
          typeof record.stock_received === 'string'
            ? parseFloat(record.stock_received) || 0
            : record.stock_received || 0,
        stock_out:
          typeof record.stock_out === 'string'
            ? parseFloat(record.stock_out) || 0
            : record.stock_out || 0,
        closing_stock:
          typeof record.closing_stock === 'string'
            ? parseFloat(record.closing_stock) || 0
            : record.closing_stock || 0,
      };

      acc[record.area].push(processedRecord);
      return acc;
    },
    {} as Record<string, PackingPlantStockRecord[]>
  );

  return Object.values(groupedByArea).flatMap((areaRecords) => {
    const sortedData = [...areaRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedData.map((record, index, array) => {
      const opening_stock =
        index === 0
          ? (record.opening_stock ?? 0) // Rely on DB value for the first record
          : array[index - 1].closing_stock;
      const stock_received = record.closing_stock - (opening_stock - record.stock_out);

      return {
        ...record,
        opening_stock: Math.round(opening_stock),
        stock_received: Math.round(stock_received),
      };
    });
  });
};

export const usePackingPlantStockData = () => {
  const [records, setRecords] = useState<PackingPlantStockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packing_plant_stock')
      .select('id, date, area, opening_stock, stock_received, stock_out, closing_stock');

    if (error) {
      console.error('Error fetching stock records:', error);
    } else {
      const processedRecords = processRecords(data || []);
      setRecords(processedRecords);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<PackingPlantStockRecord, 'opening_stock' | 'stock_received'>) => {
      const recordWithDefaults: any = {
        date: record.date,
        area: record.area,
        stock_out: record.stock_out,
        closing_stock: record.closing_stock,
        opening_stock: 0,
        stock_received: 0,
        record_id: record.record_id || `${record.area}-${record.date}`,
      };

      // Only include id if it's a valid UUID (not empty string)
      if (record.id && record.id.trim() !== '') {
        recordWithDefaults.id = record.id;
      }

      const { error } = await supabase.from('packing_plant_stock').insert([recordWithDefaults]);
      if (error) console.error('Error adding stock record:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const addBulkRecords = useCallback(
    async (newRecords: Omit<PackingPlantStockRecord, 'opening_stock' | 'stock_received'>[]) => {
      const recordsWithDefaults = newRecords.map((record) => {
        const recordWithDefaults: any = {
          date: record.date,
          area: record.area,
          stock_out: record.stock_out,
          closing_stock: record.closing_stock,
          opening_stock: 0,
          stock_received: 0,
          record_id: record.record_id || `${record.area}-${record.date}`,
        };

        // Only include id if it's a valid UUID (not empty string)
        if (record.id && record.id.trim() !== '') {
          recordWithDefaults.id = record.id;
        }

        return recordWithDefaults;
      });

      const { error } = await supabase.from('packing_plant_stock').insert(recordsWithDefaults);
      if (error) console.error('Error bulk adding stock records:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: Omit<PackingPlantStockRecord, 'opening_stock' | 'stock_received'>) => {
      const { id, ...updateData } = updatedRecord;
      const { error } = await supabase.from('packing_plant_stock').update(updateData).eq('id', id);
      if (error) console.error('Error updating stock record:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  const upsertRecord = useCallback(
    async (record: PackingPlantStockRecord) => {
      // We only need to upsert the core, user-editable fields.
      // `processRecords` will recalculate the derived fields upon refetch.
      const payload: any = {
        date: record.date,
        area: record.area,
        stock_out: record.stock_out,
        closing_stock: record.closing_stock,
        opening_stock: record.opening_stock || 0,
        stock_received: record.stock_received || 0,
        record_id: record.record_id || `${record.area}-${record.date}`,
      };

      // Only include id if it's a valid UUID (not empty string)
      if (record.id && record.id.trim() !== '') {
        payload.id = record.id;
        // Including master ID for area ${record.area}: ${record.id}
      } else {
        // No valid master ID found for area ${record.area}, omitting from insert
      }

      try {
        // Use Supabase upsert with manual handling for better error control
        // First try to update existing record
        const { data: existingRecord, error: selectError } = await supabase
          .from('packing_plant_stock')
          .select('*')
          .eq('date', record.date)
          .eq('area', record.area)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking existing record:', selectError);
          return;
        }

        if (existingRecord) {
          // Record exists, perform update using unique identifier
          // Exclude id and record_id from update payload to avoid constraint violations
          const updatePayload = {
            date: record.date,
            area: record.area,
            stock_out: record.stock_out,
            closing_stock: record.closing_stock,
            opening_stock: record.opening_stock || 0,
            stock_received: record.stock_received || 0,
          };

          const { error: updateError } = await supabase
            .from('packing_plant_stock')
            .update(updatePayload)
            .eq('date', record.date)
            .eq('area', record.area);

          if (updateError) {
            console.error('Error updating stock record:', updateError);
          } else {
            console.log(`Successfully updated record for ${record.date} - ${record.area}`);
            fetchRecords();
          }
        } else {
          // Record doesn't exist, perform insert
          const { error: insertError } = await supabase
            .from('packing_plant_stock')
            .insert([payload]);

          if (insertError) {
            console.error('Error inserting stock record:', insertError);
          } else {
            console.log(`Successfully inserted new record for ${record.date} - ${record.area}`);
            fetchRecords();
          }
        }
      } catch (error) {
        console.error('Error upserting stock record:', error);
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error } = await supabase.from('packing_plant_stock').delete().eq('id', recordId);
      if (error) console.error('Error deleting stock record:', error);
      else fetchRecords();
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    addBulkRecords,
    upsertRecord,
  };
};
