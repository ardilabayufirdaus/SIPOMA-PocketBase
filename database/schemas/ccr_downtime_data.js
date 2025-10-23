/**
 * CCR Downtime Collection Schema Definition
 * Tanggal: 19 Oktober 2025
 *
 * File ini mendefinisikan skema untuk koleksi ccr_downtime_data di PocketBase
 * dan dapat digunakan sebagai referensi untuk import atau migrasi manual.
 */

module.exports = {
  name: 'ccr_downtime_data',
  type: 'base',
  schema: [
    {
      name: 'date',
      type: 'date',
      required: true,
      options: {
        min: '',
        max: '',
      },
    },
    {
      name: 'start_time',
      type: 'text',
      required: true,
      options: {
        min: 5,
        max: 5,
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
      },
    },
    {
      name: 'end_time',
      type: 'text',
      required: true,
      options: {
        min: 5,
        max: 5,
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
      },
    },
    {
      name: 'pic',
      type: 'text',
      required: true,
      options: {
        min: 1,
        max: 100,
      },
    },
    {
      name: 'problem',
      type: 'text',
      required: true,
      options: {
        min: 1,
        max: 500,
      },
    },
    {
      name: 'unit',
      type: 'text',
      required: true,
      options: {
        min: 1,
        max: 100,
      },
    },
    {
      name: 'action',
      type: 'text',
      required: false,
      options: {
        min: 0,
        max: 500,
      },
    },
    {
      name: 'corrective_action',
      type: 'text',
      required: false,
      options: {
        min: 0,
        max: 500,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: false,
      options: {
        values: ['Open', 'Close'],
      },
    },
    {
      name: 'duration_minutes',
      type: 'number',
      required: false,
      options: {
        min: 0,
      },
    },
  ],
};

