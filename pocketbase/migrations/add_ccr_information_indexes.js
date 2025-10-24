/// <reference path="../pb_data/types.d.ts" />

migrate(
  (db) => {
    // Add indexes to ccr_information collection
    const collection = db.collection('ccr_information');

    // Add compound index for date + unit_id
    collection.createIndex('idx_ccr_information_date_unit', {
      type: 'unique', // Unique compound index to ensure only one record per date+unit
      options: {
        fields: ['date', 'unit_id'],
      },
    });

    // Add index for date field
    collection.createIndex('idx_ccr_information_date', {
      type: 'normal',
      options: {
        fields: ['date'],
      },
    });

    // Add index for unit_id field
    collection.createIndex('idx_ccr_information_unit', {
      type: 'normal',
      options: {
        fields: ['unit_id'],
      },
    });

    return collection;
  },
  (db) => {
    // Revert - remove all added indexes
    const collection = db.collection('ccr_information');
    collection.deleteIndex('idx_ccr_information_date_unit');
    collection.deleteIndex('idx_ccr_information_date');
    collection.deleteIndex('idx_ccr_information_unit');
    return collection;
  }
);
