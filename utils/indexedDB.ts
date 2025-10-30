// IndexedDB utilities for offline data storage
// Handles CCR data persistence when offline

const DB_NAME = 'SipomaOfflineDB';
const DB_VERSION = 1;

// Store names for different data types
export const STORES = {
  CCR_PARAMETERS: 'ccr_parameters',
  CCR_SILO_DATA: 'ccr_silo_data',
  CCR_DOWNTIME: 'ccr_downtime',
  CCR_MATERIAL_USAGE: 'ccr_material_usage',
  CCR_FOOTER_DATA: 'ccr_footer_data',
  CCR_INFORMATION: 'ccr_information',
  SYNC_QUEUE: 'sync_queue',
} as const;

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
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
