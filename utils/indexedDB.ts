// IndexedDB utilities for offline data storage
// Handles all PocketBase collections persistence when offline

const DB_NAME = 'SipomaOfflineDB';
const DB_VERSION = 2; // Increased version for new stores

// Store names for different data types
export const STORES = {
  // CCR Data
  CCR_PARAMETERS: 'ccr_parameters',
  CCR_SILO_DATA: 'ccr_silo_data',
  CCR_DOWNTIME: 'ccr_downtime',
  CCR_MATERIAL_USAGE: 'ccr_material_usage',
  CCR_FOOTER_DATA: 'ccr_footer_data',
  CCR_INFORMATION: 'ccr_information',

  // User Management
  USERS: 'users',
  PROFILES: 'profiles',
  PERMISSIONS: 'permissions',

  // Plant Operations
  PLANT_UNITS: 'plant_units',
  PARAMETER_SETTINGS: 'parameter_settings',
  SILO_CAPACITIES: 'silo_capacities',

  // System
  SYNC_QUEUE: 'sync_queue',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const;

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create object stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });

      // Handle migrations for version upgrades
      if (oldVersion < 2) {
        // Add new stores for version 2
        const newStores = [
          STORES.USERS,
          STORES.PROFILES,
          STORES.PERMISSIONS,
          STORES.PLANT_UNITS,
          STORES.AUDIT_LOGS,
          STORES.SETTINGS,
        ];

        newStores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      }
    };
  });
};

// Generic store/retrieve functions
export const storeData = async (storeName: string, data: any[]): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  // Clear existing data and store new data
  const clearRequest = store.clear();
  await new Promise<void>((resolve, reject) => {
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  // Store each item
  for (const item of data) {
    const request = store.add(item);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  db.close();
};

export const getData = async (storeName: string): Promise<any[]> => {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = reject;
  });
};

// Sync queue management for pending operations
export const addToSyncQueue = async (operation: {
  id: string;
  type: 'create' | 'update' | 'delete';
  storeName: string;
  data: any;
  timestamp: number;
}): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  const request = store.add(operation);
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSyncQueue = async (): Promise<any[]> => {
  return getData(STORES.SYNC_QUEUE);
};

export const removeFromSyncQueue = async (id: string): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  const request = store.delete(id);
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear all data (for testing or reset)
export const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(Object.values(STORES), 'readwrite');

  const promises = Object.values(STORES).map((storeName) => {
    const store = transaction.objectStore(storeName);
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);
  db.close();
};
