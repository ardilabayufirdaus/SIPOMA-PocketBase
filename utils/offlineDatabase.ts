// Offline-first database wrapper for PocketBase
// Provides seamless offline/online data access with automatic sync

import { pb } from './pocketbase-simple';
import {
  initDB,
  storeData,
  getData,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  STORES,
} from './indexedDB';
import { logger } from './logger';
import { detectConflict, resolveConflict, DataConflict } from './conflictResolution';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  storeName: string; // Add storeName for IndexedDB compatibility
  data: any;
  timestamp: number;
  retryCount?: number;
}

export class OfflineDatabase {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initialize IndexedDB
    this.init();
  }

  private async init() {
    try {
      await initDB();
      logger.info('Offline database initialized');
    } catch (error) {
      logger.error('Failed to initialize offline database:', error);
    }
  }

  // Generic collection operations with offline support
  async getFullList(collection: string, options: any = {}): Promise<any[]> {
    try {
      if (this.isOnline) {
        // Try to fetch from server
        const data = await pb.collection(collection).getFullList(options);

        // Cache the data for offline use
        await this.cacheCollectionData(collection, data);

        return data;
      } else {
        // Return cached data
        return await this.getCachedCollectionData(collection);
      }
    } catch (error) {
      logger.warn(`Failed to fetch ${collection} from server, using cache:`, error);

      // Fallback to cached data
      return await this.getCachedCollectionData(collection);
    }
  }

  async getOne(collection: string, id: string): Promise<any> {
    try {
      if (this.isOnline) {
        const data = await pb.collection(collection).getOne(id);

        // Cache individual record
        await this.cacheRecord(collection, data);

        return data;
      } else {
        return await this.getCachedRecord(collection, id);
      }
    } catch (error) {
      logger.warn(`Failed to fetch ${collection}/${id} from server, using cache:`, error);
      return await this.getCachedRecord(collection, id);
    }
  }

  async create(collection: string, data: any): Promise<any> {
    if (this.isOnline) {
      try {
        const result = await pb.collection(collection).create(data);

        // Update cache
        await this.cacheRecord(collection, result);

        return result;
      } catch (error) {
        logger.warn(`Failed to create ${collection} record, queuing for sync:`, error);

        // Queue for later sync
        await this.queueOperation({
          id: `create_${Date.now()}_${Math.random()}`,
          type: 'create',
          collection,
          storeName: this.getStoreNameForCollection(collection),
          data,
          timestamp: Date.now(),
        });

        // Return optimistic response
        return { ...data, id: `temp_${Date.now()}`, _isOffline: true };
      }
    } else {
      // Queue operation and return optimistic response
      await this.queueOperation({
        id: `create_${Date.now()}_${Math.random()}`,
        type: 'create',
        collection,
        storeName: this.getStoreNameForCollection(collection),
        data,
        timestamp: Date.now(),
      });

      return { ...data, id: `temp_${Date.now()}`, _isOffline: true };
    }
  }

  async update(collection: string, id: string, data: any): Promise<any> {
    if (this.isOnline) {
      try {
        const result = await pb.collection(collection).update(id, data);

        // Update cache
        await this.cacheRecord(collection, result);

        return result;
      } catch (error) {
        logger.warn(`Failed to update ${collection}/${id}, queuing for sync:`, error);

        // Queue for later sync
        await this.queueOperation({
          id: `update_${Date.now()}_${Math.random()}`,
          type: 'update',
          collection,
          storeName: this.getStoreNameForCollection(collection),
          data: { ...data, id },
          timestamp: Date.now(),
        });

        // Return optimistic response
        return { ...data, id, _isOffline: true };
      }
    } else {
      // Queue operation and return optimistic response
      await this.queueOperation({
        id: `update_${Date.now()}_${Math.random()}`,
        type: 'update',
        collection,
        storeName: this.getStoreNameForCollection(collection),
        data: { ...data, id },
        timestamp: Date.now(),
      });

      return { ...data, id, _isOffline: true };
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    if (this.isOnline) {
      try {
        await pb.collection(collection).delete(id);

        // Remove from cache
        await this.removeCachedRecord(collection, id);

        return true;
      } catch (error) {
        logger.warn(`Failed to delete ${collection}/${id}, queuing for sync:`, error);

        // Queue for later sync
        await this.queueOperation({
          id: `delete_${Date.now()}_${Math.random()}`,
          type: 'delete',
          collection,
          storeName: this.getStoreNameForCollection(collection),
          data: { id },
          timestamp: Date.now(),
        });

        // Return optimistic response
        return true;
      }
    } else {
      // Queue operation and return optimistic response
      await this.queueOperation({
        id: `delete_${Date.now()}_${Math.random()}`,
        type: 'delete',
        collection,
        storeName: this.getStoreNameForCollection(collection),
        data: { id },
        timestamp: Date.now(),
      });

      return true;
    }
  }

  // Caching methods
  private async cacheCollectionData(collection: string, data: any[]): Promise<void> {
    try {
      const storeName = this.getStoreNameForCollection(collection);
      await storeData(storeName, data);
    } catch (error) {
      logger.error(`Failed to cache ${collection} data:`, error);
    }
  }

  private async getCachedCollectionData(collection: string): Promise<any[]> {
    try {
      const storeName = this.getStoreNameForCollection(collection);
      return await getData(storeName);
    } catch (error) {
      logger.error(`Failed to get cached ${collection} data:`, error);
      return [];
    }
  }

  private async cacheRecord(collection: string, record: any): Promise<void> {
    try {
      const storeName = this.getStoreNameForCollection(collection);
      const existingData = await getData(storeName);

      // Update or add the record
      const updatedData = existingData.filter((item: any) => item.id !== record.id);
      updatedData.push(record);

      await storeData(storeName, updatedData);
    } catch (error) {
      logger.error(`Failed to cache ${collection} record:`, error);
    }
  }

  private async getCachedRecord(collection: string, id: string): Promise<any> {
    try {
      const cachedData = await this.getCachedCollectionData(collection);
      return cachedData.find((item: any) => item.id === id);
    } catch (error) {
      logger.error(`Failed to get cached ${collection} record:`, error);
      return null;
    }
  }

  private async removeCachedRecord(collection: string, id: string): Promise<void> {
    try {
      const storeName = this.getStoreNameForCollection(collection);
      const existingData = await getData(storeName);
      const filteredData = existingData.filter((item: any) => item.id !== id);
      await storeData(storeName, filteredData);
    } catch (error) {
      logger.error(`Failed to remove cached ${collection} record:`, error);
    }
  }

  // Queue management
  private async queueOperation(operation: OfflineOperation): Promise<void> {
    try {
      await addToSyncQueue(operation);
      logger.info(`Queued ${operation.type} operation for ${operation.collection}`);
    } catch (error) {
      logger.error('Failed to queue operation:', error);
    }
  }

  // Process sync queue when back online
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const queue = await getSyncQueue();

      for (const operation of queue) {
        try {
          await this.executeQueuedOperation(operation);
          await removeFromSyncQueue(operation.id);
          logger.info(`Synced ${operation.type} operation for ${operation.collection}`);
        } catch (error) {
          logger.error(`Failed to sync operation ${operation.id}:`, error);

          // Increment retry count
          operation.retryCount = (operation.retryCount || 0) + 1;

          // Remove from queue if too many retries
          if (operation.retryCount >= 3) {
            await removeFromSyncQueue(operation.id);
            logger.warn(`Removed failed operation ${operation.id} after 3 retries`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to process sync queue:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeQueuedOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await pb.collection(operation.collection).create(operation.data);
        break;
      case 'update':
        await pb.collection(operation.collection).update(operation.data.id, operation.data);
        break;
      case 'delete':
        await pb.collection(operation.collection).delete(operation.data.id);
        break;
    }
  }

  // Utility method to map collection names to store names
  private getStoreNameForCollection(collection: string): string {
    const mapping: Record<string, string> = {
      ccr_parameter_data: STORES.CCR_PARAMETERS,
      ccr_silo_data: STORES.CCR_SILO_DATA,
      ccr_downtime: STORES.CCR_DOWNTIME,
      ccr_material_usage: STORES.CCR_MATERIAL_USAGE,
      ccr_footer_data: STORES.CCR_FOOTER_DATA,
      ccr_information: STORES.CCR_INFORMATION,
      users: 'users',
      profiles: 'profiles',
      permissions: 'permissions',
      plant_units: 'plant_units',
      parameter_settings: 'parameter_settings',
      silo_capacities: 'silo_capacities',
    };

    return mapping[collection] || collection;
  }

  // Public methods for monitoring
  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean; queueLength: number } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: 0, // Will be implemented
    };
  }
}

// Export singleton instance
export const offlineDB = new OfflineDatabase();
