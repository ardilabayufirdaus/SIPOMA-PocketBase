import { useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { safeApiCall } from '../utils/connectionCheck';
import { logger } from '../utils/logger';

interface CcrFooterData {
  id?: string;
  date: string;
  parameter_id: string;
  plant_unit?: string;
  total: number;
  average: number;
  minimum: number;
  maximum: number;
  shift1_total: number;
  shift2_total: number;
  shift3_total: number;
  shift3_cont_total: number;
  shift1_average: number;
  shift2_average: number;
  shift3_average: number;
  shift3_cont_average: number;
  shift1_counter: number;
  shift2_counter: number;
  shift3_counter: number;
  shift3_cont_counter: number;
}

export const useCcrFooterData = () => {
  const saveFooterData = useCallback(async (footerData: CcrFooterData) => {
    // Helper function to round to 2 decimal places
    const roundToTwoDecimals = (value: number): number => {
      return parseFloat(value.toFixed(2));
    };

    const data = {
      date: footerData.date,
      parameter_id: footerData.parameter_id,
      plant_unit: footerData.plant_unit || 'CCR',
      total: roundToTwoDecimals(footerData.total),
      average: roundToTwoDecimals(footerData.average),
      minimum: roundToTwoDecimals(footerData.minimum),
      maximum: roundToTwoDecimals(footerData.maximum),
      shift1_total: roundToTwoDecimals(footerData.shift1_total),
      shift2_total: roundToTwoDecimals(footerData.shift2_total),
      shift3_total: roundToTwoDecimals(footerData.shift3_total),
      shift3_cont_total: roundToTwoDecimals(footerData.shift3_cont_total),
      shift1_average: roundToTwoDecimals(footerData.shift1_average),
      shift2_average: roundToTwoDecimals(footerData.shift2_average),
      shift3_average: roundToTwoDecimals(footerData.shift3_average),
      shift3_cont_average: roundToTwoDecimals(footerData.shift3_cont_average),
      shift1_counter: roundToTwoDecimals(footerData.shift1_counter),
      shift2_counter: roundToTwoDecimals(footerData.shift2_counter),
      shift3_counter: roundToTwoDecimals(footerData.shift3_counter),
      shift3_cont_counter: roundToTwoDecimals(footerData.shift3_cont_counter),
      updated_at: new Date().toISOString(),
    };

    // Check if record already exists for this date and parameter_id
    // Use date as-is (YYYY-MM-DD format)
    const existingRecords = await safeApiCall(
      () =>
        pb.collection('ccr_footer_data').getFullList({
          filter: `date="${footerData.date}" && parameter_id="${footerData.parameter_id}" && plant_unit="${footerData.plant_unit || 'CCR'}"`,
        }),
      { retries: 2, retryDelay: 2000 }
    ); // More conservative retry settings with throttling

    if (!existingRecords) {
      throw new Error('Unable to check existing records - connection issue');
    }

    if (existingRecords.length > 0) {
      // Update existing record
      const existingId = existingRecords[0].id;
      const updatedRecord = await safeApiCall(
        () => pb.collection('ccr_footer_data').update(existingId, data),
        { retries: 2, retryDelay: 2000 }
      ); // More conservative retry settings with throttling
      if (!updatedRecord) {
        throw new Error('Unable to update record - connection issue');
      }
      return { ...data, id: existingId };
    } else {
      // Create new record
      const record = await safeApiCall(() => pb.collection('ccr_footer_data').create(data), {
        retries: 2,
        retryDelay: 2000,
      }); // More conservative retry settings with throttling
      if (!record) {
        throw new Error('Unable to create record - connection issue');
      }
      return record;
    }
  }, []);

  const batchSaveFooterData = useCallback(
    async (footerDataArray: CcrFooterData[]) => {
      // Process footer data updates in batches to avoid overwhelming the server
      const batchSize = 3; // Process 3 footer updates at a time (smaller batch for footer data)
      const results = [];

      for (let i = 0; i < footerDataArray.length; i += batchSize) {
        const batch = footerDataArray.slice(i, i + batchSize);

        // Process batch concurrently
        const batchPromises = batch.map((footerData) =>
          saveFooterData(footerData).catch((error) => {
            logger.error(
              'Batch footer data save error for parameter:',
              footerData.parameter_id,
              error
            );
            return null;
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to prevent network congestion
        if (i + batchSize < footerDataArray.length) {
          await new Promise((resolve) => setTimeout(resolve, 300)); // Shorter delay for footer data
        }
      }

      // Return results summary
      const successful = results.filter((r) => r.status === 'fulfilled' && r.value !== null).length;
      const failed = results.length - successful;

      return { successful, failed, total: results.length };
    },
    [saveFooterData]
  );

  const getFooterDataForDate = useCallback(async (date: string, plantUnit?: string) => {
    // Use date as-is (YYYY-MM-DD format)
    const filter = `date="${date}"${plantUnit && plantUnit !== 'all' ? ` && plant_unit="${plantUnit}"` : ''}`;
    const records = await safeApiCall(
      () =>
        pb.collection('ccr_footer_data').getFullList({
          filter: filter,
        }),
      { retries: 2, retryDelay: 2000 }
    ); // Conservative retry settings with throttling

    return records || [];
  }, []);

  const deleteFooterData = useCallback(
    async (date: string, parameterId: string, plantUnit?: string) => {
      // Use date as-is (YYYY-MM-DD format)
      const filter = `date="${date}" && parameter_id="${parameterId}"${plantUnit ? ` && plant_unit="${plantUnit}"` : ''}`;
      const records = await safeApiCall(
        () =>
          pb.collection('ccr_footer_data').getFullList({
            filter: filter,
          }),
        { retries: 2, retryDelay: 2000 }
      );

      if (records) {
        for (const record of records) {
          await safeApiCall(() => pb.collection('ccr_footer_data').delete(record.id), {
            retries: 2,
            retryDelay: 2000,
          });
        }
      }
    },
    []
  );

  return {
    saveFooterData,
    batchSaveFooterData,
    getFooterDataForDate,
    deleteFooterData,
  };
};
