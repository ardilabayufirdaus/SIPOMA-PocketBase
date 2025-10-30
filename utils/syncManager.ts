// Background sync utilities for offline data synchronization
import { getSyncQueue, removeFromSyncQueue } from '../utils/indexedDB';
import { pb } from '../utils/pocketbase-simple';

export const syncPendingOperations = async (): Promise<void> => {
  try {
    const pendingOps = await getSyncQueue();

    for (const op of pendingOps) {
      try {
        switch (op.type) {
          case 'create':
            await pb.collection(op.storeName.replace('ccr_', '')).create(op.data);
            break;
          case 'update':
            await pb.collection(op.storeName.replace('ccr_', '')).update(op.data.id, op.data);
            break;
          case 'delete':
            await pb.collection(op.storeName.replace('ccr_', '')).delete(op.data.id);
            break;
        }

        // Remove from sync queue on success
        await removeFromSyncQueue(op.id);
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);
        // Keep in queue for retry
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

// Register background sync if supported
export const registerBackgroundSync = async (): Promise<void> => {
  if (
    'serviceWorker' in navigator &&
    'sync' in (window as any).ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('background-sync');
    } catch {
      console.log('Background sync not supported or failed to register');
    }
  }
};
