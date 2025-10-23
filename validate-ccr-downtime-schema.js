/**
 * Validasi dan Update Skema CCR Downtime Data
 *
 * Script ini digunakan untuk memvalidasi dan memperbarui struktur koleksi ccr_downtime_data
 * sesuai dengan skema yang direkomendasikan
 */

import PocketBase from 'pocketbase';
import { logger } from './utils/logger';

async function validateAndUpdateCcrDowntimeSchema() {
  logger.info('Starting CCR Downtime Schema Validation...');
  const pb = new PocketBase('http://141.11.25.69:8090');

  try {
    // 1. Ambil informasi skema koleksi saat ini
    logger.info('Fetching current collection schema...');
    const collections = await pb.collections.getFullList();
    const ccrDowntimeCollection = collections.find((c) => c.name === 'ccr_downtime_data');

    if (!ccrDowntimeCollection) {
      logger.error('CCR Downtime collection not found!');
      return;
    }

    logger.info('Current schema:', ccrDowntimeCollection.schema);

    // 2. Definisikan skema yang direkomendasikan - untuk dokumentasi/referensi saja
    // Gunakan komentar untuk menghindari lint error unused variable
    /* 
    Recommended schema:
    [
      {
        name: "date",
        type: "date",
        required: true
      },
      {
        name: "start_time",
        type: "text",
        required: true
      },
      {
        name: "end_time",
        type: "text", 
        required: true
      },
      {
        name: "pic",
        type: "text",
        required: true
      },
      {
        name: "problem",
        type: "text",
        required: true
      },
      {
        name: "unit",
        type: "text",
        required: true
      },
      {
        name: "action",
        type: "text",
        required: false
      },
      {
        name: "corrective_action",
        type: "text",
        required: false
      },
      {
        name: "status",
        type: "select",
        required: false,
        options: {
          values: ["Open", "Close"]
        }
      },
      {
        name: "duration_minutes",
        type: "number",
        required: false
      }
    ]
    */

    // 3. Periksa apakah field duration_minutes sudah ada
    const currentSchema = ccrDowntimeCollection.schema;
    const hasDurationMinutes = currentSchema.some((field) => field.name === 'duration_minutes');

    if (!hasDurationMinutes) {
      logger.info('Adding duration_minutes field to schema...');

      // Salin schema saat ini dan tambahkan field duration_minutes
      const updatedSchema = [
        ...currentSchema,
        {
          name: 'duration_minutes',
          type: 'number',
          required: false,
        },
      ];

      // Update koleksi dengan schema yang diperbarui
      await pb.collections.update(ccrDowntimeCollection.id, {
        schema: updatedSchema,
      });

      logger.info('Schema updated successfully!');
    } else {
      logger.info('duration_minutes field already exists, no update needed.');
    }

    // 4. Validasi status field values
    const statusField = currentSchema.find((field) => field.name === 'status');
    if (statusField && statusField.type === 'select') {
      const currentValues = statusField.options?.values || [];
      const recommendedValues = ['Open', 'Close'];

      const hasAllValues = recommendedValues.every((v) => currentValues.includes(v));

      if (!hasAllValues) {
        logger.info('Updating status field options...');
        statusField.options = { ...statusField.options, values: recommendedValues };

        await pb.collections.update(ccrDowntimeCollection.id, {
          schema: currentSchema,
        });

        logger.info('Status field options updated successfully!');
      }
    }

    logger.info('Schema validation completed!');
  } catch (error) {
    logger.error('Error during schema validation:', error);
  }
}

validateAndUpdateCcrDowntimeSchema().catch((error) => logger.error('Unhandled error:', error));
