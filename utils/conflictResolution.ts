// Conflict resolution utilities for offline/online data synchronization
// Handles conflicts when local changes conflict with server state

import { pb } from './pocketbase-simple';
import { logger } from './logger';

export interface ConflictResolutionStrategy {
  type: 'server-wins' | 'client-wins' | 'manual' | 'merge';
  resolver?: (serverData: any, clientData: any) => any;
}

export interface DataConflict {
  collection: string;
  recordId: string;
  serverData: any;
  clientData: any;
  timestamp: number;
  resolved?: boolean;
  resolution?: any;
}

const DEFAULT_STRATEGY: ConflictResolutionStrategy = {
  type: 'server-wins', // Default to server priority
};

const CONFLICT_STRATEGIES: Record<string, ConflictResolutionStrategy> = {
  // CCR data: client wins for operational data
  ccr_parameter_data: { type: 'client-wins' },
  ccr_silo_data: { type: 'client-wins' },
  ccr_downtime: { type: 'client-wins' },
  ccr_material_usage: { type: 'client-wins' },

  // User data: server wins for security
  users: { type: 'server-wins' },
  profiles: { type: 'server-wins' },
  permissions: { type: 'server-wins' },

  // Settings: manual resolution
  settings: { type: 'manual' },
};

// Detect conflicts between server and client data
export const detectConflict = (serverData: any, clientData: any): boolean => {
  if (!serverData || !clientData) return false;

  // Compare timestamps if available
  if (serverData.updated && clientData.updated) {
    return new Date(clientData.updated) > new Date(serverData.updated);
  }

  // Compare key fields for common collections
  const keyFields = ['name', 'value', 'status', 'data'];

  for (const field of keyFields) {
    if (serverData[field] !== clientData[field]) {
      return true;
    }
  }

  return false;
};

// Resolve conflicts based on strategy
export const resolveConflict = async (conflict: DataConflict): Promise<any> => {
  const strategy = CONFLICT_STRATEGIES[conflict.collection] || DEFAULT_STRATEGY;

  logger.info(
    `Resolving conflict for ${conflict.collection}/${conflict.recordId} using ${strategy.type} strategy`
  );

  switch (strategy.type) {
    case 'server-wins':
      return conflict.serverData;

    case 'client-wins':
      return conflict.clientData;

    case 'merge':
      return strategy.resolver
        ? strategy.resolver(conflict.serverData, conflict.clientData)
        : { ...conflict.serverData, ...conflict.clientData };

    case 'manual':
      // For manual resolution, store conflict for user decision
      await storeConflictForManualResolution(conflict);
      return conflict.serverData; // Return server data as fallback

    default:
      return conflict.serverData;
  }
};

// Store conflicts that require manual resolution
const conflictStore: DataConflict[] = [];

export const storeConflictForManualResolution = async (conflict: DataConflict): Promise<void> => {
  conflictStore.push(conflict);
  logger.warn(`Conflict stored for manual resolution: ${conflict.collection}/${conflict.recordId}`);

  // Dispatch event for UI to handle
  window.dispatchEvent(
    new CustomEvent('conflict:detected', {
      detail: conflict,
    })
  );
};

// Get pending conflicts for manual resolution
export const getPendingConflicts = (): DataConflict[] => {
  return conflictStore.filter((c) => !c.resolved);
};

// Resolve manual conflict
export const resolveManualConflict = (conflictId: string, resolution: any): void => {
  const conflict = conflictStore.find((c) => `${c.collection}/${c.recordId}` === conflictId);
  if (conflict) {
    conflict.resolved = true;
    conflict.resolution = resolution;
    logger.info(`Manual conflict resolved: ${conflictId}`);
  }
};

// Smart merge for complex objects
export const mergeData = (serverData: any, clientData: any): any => {
  const merged = { ...serverData };

  // Merge arrays by combining unique items
  Object.keys(clientData).forEach((key) => {
    if (Array.isArray(clientData[key]) && Array.isArray(serverData[key])) {
      // Combine arrays, remove duplicates
      const combined = [...serverData[key], ...clientData[key]];
      merged[key] = combined.filter(
        (item, index, arr) =>
          arr.findIndex((i) => JSON.stringify(i) === JSON.stringify(item)) === index
      );
    } else if (typeof clientData[key] === 'object' && typeof serverData[key] === 'object') {
      // Recursively merge objects
      merged[key] = mergeData(serverData[key], clientData[key]);
    } else {
      // Use client data for primitive values
      merged[key] = clientData[key];
    }
  });

  return merged;
};

// Set custom strategy for a collection
export const setConflictStrategy = (
  collection: string,
  strategy: ConflictResolutionStrategy
): void => {
  CONFLICT_STRATEGIES[collection] = strategy;
  logger.info(`Conflict strategy set for ${collection}: ${strategy.type}`);
};

// Get current strategy for a collection
export const getConflictStrategy = (collection: string): ConflictResolutionStrategy => {
  return CONFLICT_STRATEGIES[collection] || DEFAULT_STRATEGY;
};
