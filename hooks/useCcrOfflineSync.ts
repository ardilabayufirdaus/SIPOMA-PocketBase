/**
 * useCcrOfflineSync - Hook untuk menyimpan data CCR ke IndexedDB secara otomatis
 * sebagai safety net ketika server offline.
 *
 * Fitur:
 * - Auto-save form data ke IndexedDB setiap kali ada perubahan
 * - Deteksi saat server kembali online dan sinkronisasi otomatis
 * - Recovery data yang belum tersimpan saat halaman dibuka kembali
 * - Integrasi dengan offline infrastructure yang sudah ada (offlineDatabase, syncManager)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { logger } from '../utils/logger';

// Constants
const STORAGE_PREFIX = 'sipoma_ccr_draft_';
const PENDING_QUEUE_KEY = 'sipoma_ccr_pending_queue';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 jam

// Types
export interface PendingOperation {
  id: string;
  type: 'parameter' | 'silo' | 'downtime' | 'information';
  timestamp: number;
  data: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
}

export interface DraftData {
  parameters: Record<string, Record<string, unknown>>;
  silos: Record<string, Record<string, unknown>>;
  information: string;
  date: string;
  unit: string;
  savedAt: number;
}

interface UseCcrOfflineSyncOptions {
  date: string;
  unit: string;
  autoSaveIntervalMs?: number;
}

interface UseCcrOfflineSyncReturn {
  // State
  hasDraft: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;

  // Actions - Draft Management
  saveDraft: (data: Partial<DraftData>) => void;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;

  // Actions - Pending Queue Management
  addToPendingQueue: (
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ) => void;
  processPendingQueue: () => Promise<{ success: number; failed: number }>;
  clearPendingQueue: () => void;

  // Actions - Parameter-specific
  saveParameterDraft: (
    parameterId: string,
    hour: number,
    value: string | number | null,
    userName: string
  ) => void;
  saveSiloDraft: (siloId: string, shift: string, field: string, value: number) => void;
  saveInformationDraft: (text: string) => void;
  removeParameterDraft: (parameterId: string, hour: number) => void;
  removeSiloDraft: (siloId: string, shift: string, field: string) => void;
}

// Helper: generate unique ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: get draft storage key based on date + unit
const getDraftKey = (date: string, unit: string): string => {
  return `${STORAGE_PREFIX}${date}_${unit}`;
};

export const useCcrOfflineSync = (options: UseCcrOfflineSyncOptions): UseCcrOfflineSyncReturn => {
  const { date, unit, autoSaveIntervalMs = 10000 } = options;
  const { isOnline, wasOffline, resetWasOffline } = useOfflineStatus();

  const [hasDraft, setHasDraft] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Use refs for the draft data buffer to avoid excessive re-renders
  const draftBuffer = useRef<Partial<DraftData>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ──────────────────────────────────────────────
  // Draft Data Management (localStorage)
  // ──────────────────────────────────────────────

  /**
   * Save draft data to localStorage
   */
  const saveDraft = useCallback(
    (data: Partial<DraftData>) => {
      if (!date || !unit) return;

      try {
        const key = getDraftKey(date, unit);
        const existingRaw = localStorage.getItem(key);
        const existing: DraftData = existingRaw
          ? JSON.parse(existingRaw)
          : { parameters: {}, silos: {}, information: '', date, unit, savedAt: 0 };

        const merged: DraftData = {
          ...existing,
          ...data,
          parameters: { ...existing.parameters, ...(data.parameters || {}) },
          silos: { ...existing.silos, ...(data.silos || {}) },
          information: data.information !== undefined ? data.information : existing.information,
          date,
          unit,
          savedAt: Date.now(),
        };

        localStorage.setItem(key, JSON.stringify(merged));
        setHasDraft(true);

        logger.debug('[OfflineSync] Draft saved', {
          date,
          unit,
          entriesCount: Object.keys(merged.parameters).length,
        });
      } catch (error) {
        logger.warn('[OfflineSync] Failed to save draft:', error);
      }
    },
    [date, unit]
  );

  /**
   * Load draft data from localStorage
   */
  const loadDraft = useCallback((): DraftData | null => {
    if (!date || !unit) return null;

    try {
      const key = getDraftKey(date, unit);
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const draft: DraftData = JSON.parse(raw);

      // Check if draft is too old (> 24 hours)
      if (Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
        localStorage.removeItem(key);
        setHasDraft(false);
        return null;
      }

      return draft;
    } catch (error) {
      logger.warn('[OfflineSync] Failed to load draft:', error);
      return null;
    }
  }, [date, unit]);

  /**
   * Clear draft for current date/unit
   */
  const clearDraft = useCallback(() => {
    if (!date || !unit) return;

    try {
      const key = getDraftKey(date, unit);
      localStorage.removeItem(key);
      setHasDraft(false);
      draftBuffer.current = {};
      logger.debug('[OfflineSync] Draft cleared', { date, unit });
    } catch (error) {
      logger.warn('[OfflineSync] Failed to clear draft:', error);
    }
  }, [date, unit]);

  // ──────────────────────────────────────────────
  // Pending Queue Management (localStorage)
  // ──────────────────────────────────────────────

  /**
   * Get pending operations from localStorage
   */
  const getPendingQueue = useCallback((): PendingOperation[] => {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Save pending queue to localStorage
   */
  const savePendingQueue = useCallback((queue: PendingOperation[]) => {
    try {
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
      setPendingCount(queue.length);
    } catch (error) {
      logger.warn('[OfflineSync] Failed to save pending queue:', error);
    }
  }, []);

  /**
   * Add operation to pending queue (when server is offline)
   */
  const addToPendingQueue = useCallback(
    (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) => {
      const queue = getPendingQueue();
      const newOp: PendingOperation = {
        ...operation,
        id: generateId(),
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 5,
      };

      // Deduplicate: if same type + same key data exists, replace it
      const dedupeKey = `${newOp.type}_${JSON.stringify(newOp.data)}`;
      const existingIdx = queue.findIndex((op) => {
        const opKey = `${op.type}_${JSON.stringify(op.data)}`;
        return opKey === dedupeKey;
      });

      if (existingIdx >= 0) {
        queue[existingIdx] = newOp;
      } else {
        queue.push(newOp);
      }

      savePendingQueue(queue);
      logger.debug('[OfflineSync] Added to pending queue', {
        type: newOp.type,
        queueSize: queue.length,
      });
    },
    [getPendingQueue, savePendingQueue]
  );

  /**
   * Process pending queue when back online
   */
  const processPendingQueue = useCallback(async (): Promise<{
    success: number;
    failed: number;
  }> => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }

    const queue = getPendingQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    let success = 0;
    let failed = 0;
    const remainingQueue: PendingOperation[] = [];

    logger.info('[OfflineSync] Processing pending queue', { count: queue.length });

    for (const op of queue) {
      try {
        // Import pb dynamically to avoid circular dependencies
        const { pb } = await import('../utils/pocketbase-simple');

        switch (op.type) {
          case 'parameter': {
            const {
              parameterId,
              date: opDate,
              hour,
              value,
              userName,
              selectedUnit,
            } = op.data as Record<string, unknown>;
            const normalizedDate = (opDate as string).split('T')[0];
            // Include plant_unit in filter for more specific targeting
            const filter = `date="${normalizedDate}" && parameter_id="${parameterId}" && plant_unit="${selectedUnit || 'Unknown'}"`;
            const existingRecords = await pb
              .collection('ccr_parameter_data')
              .getFullList({ filter });

            const hourField = `hour${hour}`;
            const userField = `hour${hour}_user`;

            // Normalize value: handle Indonesian decimal format and types
            let normalizedValue: string | number | null =
              value === '' || value === null ? null : value;
            if (typeof normalizedValue === 'string') {
              // Try to parse as number if it looks like one (handle both dot and comma)
              const sanitized = normalizedValue.replace(',', '.');
              const parsed = parseFloat(sanitized);
              if (!isNaN(parsed) && isFinite(parsed)) {
                normalizedValue = parsed;
              }
            }

            const updateFields: Record<string, unknown> = {
              [hourField]: normalizedValue,
              [userField]: userName || 'Unknown User',
              name: userName || 'Unknown User', // For backward compatibility
            };

            if (existingRecords.length > 0) {
              await pb.collection('ccr_parameter_data').update(existingRecords[0].id, updateFields);
            } else {
              await pb.collection('ccr_parameter_data').create({
                date: normalizedDate,
                parameter_id: parameterId,
                plant_unit: selectedUnit || 'Unknown',
                ...updateFields,
              });
            }
            success++;
            break;
          }

          case 'silo': {
            const {
              date: siloDate,
              siloId,
              shift,
              field,
              value: siloValue,
            } = op.data as Record<string, unknown>;
            const formattedField = field === 'emptySpace' ? 'empty_space' : 'content';
            const shiftNum = (shift as string).replace('shift', '');
            const flatFieldName = `shift${shiftNum}_${formattedField}`;
            const formattedDate = (siloDate as string).split('T')[0];

            const filter = `date="${formattedDate}" && silo_id="${siloId}"`;
            const existingRecords = await pb.collection('ccr_silo_data').getFullList({
              filter,
              expand: 'silo_id',
            });

            const updateData = { [flatFieldName]: siloValue };

            if (existingRecords.length > 0) {
              await pb.collection('ccr_silo_data').update(existingRecords[0].id, updateData);
            } else {
              await pb.collection('ccr_silo_data').create({
                date: formattedDate,
                silo_id: siloId,
                // Removed plant_unit as it's not in the ccr_silo_data schema
                [flatFieldName]: siloValue,
              });
            }
            success++;
            break;
          }

          case 'downtime': {
            const { id: downtimeId, ...downtimeData } = op.data as Record<string, unknown>;
            const { pb: pbDowntime } = await import('../utils/pocketbase-simple');

            if (downtimeId && !downtimeId.startsWith('temp-')) {
              // Update existing
              await pbDowntime
                .collection('ccr_downtime_data')
                .update(downtimeId as string, downtimeData);
            } else {
              // Create new
              await pbDowntime.collection('ccr_downtime_data').create(downtimeData);
            }
            success++;
            break;
          }

          case 'information': {
            const { date: infoDate, unit: infoUnit, text } = op.data as Record<string, unknown>;
            const { pb: pbInfo } = await import('../utils/pocketbase-simple');
            const filter = `date="${infoDate}" && plant_unit="${infoUnit}"`;
            const existing = await pbInfo.collection('ccr_information').getFullList({ filter });

            if (existing.length > 0) {
              await pbInfo
                .collection('ccr_information')
                .update(existing[0].id, { information: text });
            } else {
              await pbInfo.collection('ccr_information').create({
                date: infoDate,
                plant_unit: infoUnit,
                information: text,
              });
            }
            success++;
            break;
          }

          default:
            logger.warn('[OfflineSync] Unknown operation type:', op.type);
            failed++;
        }
      } catch (error) {
        logger.warn('[OfflineSync] Failed to process operation', { type: op.type, error });
        op.retryCount++;

        if (op.retryCount < op.maxRetries) {
          remainingQueue.push(op);
        } else {
          failed++;
          logger.error('[OfflineSync] Operation exceeded max retries, discarding', {
            type: op.type,
            data: op.data,
          });
        }
      }
    }

    savePendingQueue(remainingQueue);
    setIsSyncing(false);
    setLastSyncTime(new Date().toISOString());

    logger.info('[OfflineSync] Queue processing complete', {
      success,
      failed,
      remaining: remainingQueue.length,
    });

    return { success, failed };
  }, [isOnline, getPendingQueue, savePendingQueue]);

  /**
   * Clear the entire pending queue
   */
  const clearPendingQueue = useCallback(() => {
    savePendingQueue([]);
    logger.debug('[OfflineSync] Pending queue cleared');
  }, [savePendingQueue]);

  // ──────────────────────────────────────────────
  // Convenience Methods (shortcut for specific data types)
  // ──────────────────────────────────────────────

  /**
   * Save a single parameter value to draft
   */
  const saveParameterDraft = useCallback(
    (parameterId: string, hour: number, value: string | number | null, userName: string) => {
      const paramKey = `${parameterId}_${hour}`;
      draftBuffer.current = {
        ...draftBuffer.current,
        parameters: {
          ...(draftBuffer.current.parameters || {}),
          [paramKey]: { parameterId, hour, value, userName, savedAt: Date.now() },
        },
      };

      // Debounce the actual localStorage write
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveDraft(draftBuffer.current);
      }, 1000); // Write to localStorage after 1 second of inactivity
    },
    [saveDraft]
  );

  /**
   * Save a single silo value to draft
   */
  const saveSiloDraft = useCallback(
    (siloId: string, shift: string, field: string, value: number) => {
      const siloKey = `${siloId}_${shift}_${field}`;
      draftBuffer.current = {
        ...draftBuffer.current,
        silos: {
          ...(draftBuffer.current.silos || {}),
          [siloKey]: { siloId, shift, field, value, savedAt: Date.now() },
        },
      };

      // Debounce
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveDraft(draftBuffer.current);
      }, 1000);
    },
    [saveDraft]
  );

  /**
   * Remove a single parameter value from draft (called after successful server save)
   */
  const removeParameterDraft = useCallback(
    (parameterId: string, hour: number) => {
      if (!date || !unit) return;
      const paramKey = `${parameterId}_${hour}`;

      try {
        const key = getDraftKey(date, unit);
        const existingRaw = localStorage.getItem(key);
        if (!existingRaw) return;

        const existing: DraftData = JSON.parse(existingRaw);
        if (existing.parameters && existing.parameters[paramKey]) {
          const { [paramKey]: _, ...remainingParams } = existing.parameters;
          const updated: DraftData = {
            ...existing,
            parameters: remainingParams,
            savedAt: Date.now(),
          };

          // If everything is empty, just remove the whole key
          const hasParams = Object.keys(updated.parameters).length > 0;
          const hasSilos = Object.keys(updated.silos).length > 0;
          const hasInfo = !!updated.information;

          if (!hasParams && !hasSilos && !hasInfo) {
            localStorage.removeItem(key);
            setHasDraft(false);
          } else {
            localStorage.setItem(key, JSON.stringify(updated));
            setHasDraft(true);
          }
        }
      } catch (error) {
        logger.warn('[OfflineSync] Failed to remove parameter draft:', error);
      }
    },
    [date, unit]
  );

  /**
   * Remove a single silo value from draft
   */
  const removeSiloDraft = useCallback(
    (siloId: string, shift: string, field: string) => {
      if (!date || !unit) return;
      const siloKey = `${siloId}_${shift}_${field}`;

      try {
        const key = getDraftKey(date, unit);
        const existingRaw = localStorage.getItem(key);
        if (!existingRaw) return;

        const existing: DraftData = JSON.parse(existingRaw);
        if (existing.silos && existing.silos[siloKey]) {
          const { [siloKey]: _, ...remainingSilos } = existing.silos;
          const updated: DraftData = {
            ...existing,
            silos: remainingSilos,
            savedAt: Date.now(),
          };

          const hasParams = Object.keys(updated.parameters).length > 0;
          const hasSilos = Object.keys(updated.silos).length > 0;
          const hasInfo = !!updated.information;

          if (!hasParams && !hasSilos && !hasInfo) {
            localStorage.removeItem(key);
            setHasDraft(false);
          } else {
            localStorage.setItem(key, JSON.stringify(updated));
            setHasDraft(true);
          }
        }
      } catch (error) {
        logger.warn('[OfflineSync] Failed to remove silo draft:', error);
      }
    },
    [date, unit]
  );

  /**
   * Save information text to draft
   */
  const saveInformationDraft = useCallback(
    (text: string) => {
      draftBuffer.current = {
        ...draftBuffer.current,
        information: text,
      };

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveDraft(draftBuffer.current);
      }, 1000);
    },
    [saveDraft]
  );

  // ──────────────────────────────────────────────
  // Auto-sync when back online
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (isOnline && wasOffline) {
      logger.info('[OfflineSync] Back online! Starting auto-sync...');
      processPendingQueue()
        .then(({ success, failed }) => {
          if (success > 0 || failed > 0) {
            logger.info(`[OfflineSync] Auto-sync result: ${success} success, ${failed} failed`);
          }
          resetWasOffline();
        })
        .catch((err) => {
          logger.error('[OfflineSync] Auto-sync failed:', err);
        });
    }
  }, [isOnline, wasOffline, processPendingQueue, resetWasOffline]);

  // ──────────────────────────────────────────────
  // Periodic background auto-sync for pending queue
  // ──────────────────────────────────────────────
  useEffect(() => {
    // Only run if online, has pending items, and not already syncing
    if (!isOnline || pendingCount === 0 || isSyncing) return;

    const intervalId = setInterval(() => {
      processPendingQueue();
    }, 30000); // Try every 30 seconds

    return () => clearInterval(intervalId);
  }, [isOnline, pendingCount, isSyncing, processPendingQueue]);

  // ──────────────────────────────────────────────
  // Check for existing draft on mount / date+unit change
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (!date || !unit) return;

    const draft = loadDraft();
    setHasDraft(!!draft);

    const queue = getPendingQueue();
    setPendingCount(queue.length);
  }, [date, unit, loadDraft, getPendingQueue]);

  // ──────────────────────────────────────────────
  // Periodic auto-save of draft buffer
  // ──────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(draftBuffer.current).length > 0) {
        saveDraft(draftBuffer.current);
      }
    }, autoSaveIntervalMs);

    return () => clearInterval(interval);
  }, [autoSaveIntervalMs, saveDraft]);

  // ──────────────────────────────────────────────
  // Cleanup timer on unmount
  // ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Flush any remaining buffer on unmount
      if (Object.keys(draftBuffer.current).length > 0) {
        saveDraft(draftBuffer.current);
      }
    };
  }, [saveDraft]);

  // ──────────────────────────────────────────────
  // Clean up old drafts (> 24h) on mount
  // ──────────────────────────────────────────────

  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const data = JSON.parse(raw);
              if (Date.now() - data.savedAt > DRAFT_MAX_AGE_MS) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid data, remove it
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      if (keysToRemove.length > 0) {
        logger.debug(`[OfflineSync] Cleaned up ${keysToRemove.length} old drafts`);
      }
    } catch (error) {
      logger.warn('[OfflineSync] Failed to clean old drafts:', error);
    }
  }, []);

  return {
    hasDraft,
    pendingCount,
    isSyncing,
    lastSyncTime,
    saveDraft,
    loadDraft,
    clearDraft,
    addToPendingQueue,
    processPendingQueue,
    clearPendingQueue,
    saveParameterDraft,
    saveSiloDraft,
    saveInformationDraft,
    removeParameterDraft,
    removeSiloDraft,
  };
};

export default useCcrOfflineSync;

/**
 * Standalone function to flush offline sync data before logout.
 * Called from the logout flow to attempt syncing pending data to server.
 * If sync succeeds → clear local data. If fails → preserve for recovery after re-login.
 */
export const flushOfflineSyncBeforeLogout = async (): Promise<void> => {
  const PENDING_KEY = 'sipoma_ccr_pending_queue';
  const DRAFT_PREFIX = 'sipoma_ccr_draft_';

  try {
    // 1. Check if there's any pending data
    const raw = localStorage.getItem(PENDING_KEY);
    const queue: PendingOperation[] = raw ? JSON.parse(raw) : [];

    if (queue.length === 0) {
      // No pending operations — safe to clear all drafts
      clearAllDrafts(DRAFT_PREFIX);
      return;
    }

    // 2. Check if we're online
    if (!navigator.onLine) {
      // Offline — keep the data for recovery after re-login
      logger.info('[OfflineSync] Offline during logout, preserving pending data for recovery');
      return;
    }

    // 3. Try to flush the queue to server
    const { pb } = await import('../utils/pocketbase-simple');
    let allSuccess = true;
    const remainingQueue: PendingOperation[] = [];

    for (const op of queue) {
      try {
        switch (op.type) {
          case 'parameter': {
            const { parameterId, date, hour, value, userName, selectedUnit } = op.data as Record<
              string,
              unknown
            >;
            const normalizedDate = (date as string).split('T')[0];
            const filter = `date="${normalizedDate}" && parameter_id="${parameterId}"`;
            const records = await pb.collection('ccr_parameter_data').getFullList({ filter });

            const hourField = `hour${hour}`;
            const userField = `hour${hour}_user`;
            const fields: Record<string, unknown> = {
              [hourField]: value === '' || value === null ? null : value,
              [userField]: userName || 'Unknown User',
            };

            if (records.length > 0) {
              await pb.collection('ccr_parameter_data').update(records[0].id, fields);
            } else {
              await pb.collection('ccr_parameter_data').create({
                date: normalizedDate,
                parameter_id: parameterId,
                name: userName || 'Unknown User',
                plant_unit: selectedUnit || 'Unknown',
                ...fields,
              });
            }
            break;
          }

          case 'silo': {
            const { date, siloId, shift, field, value, selectedUnit } = op.data as Record<
              string,
              unknown
            >;
            const formattedField = field === 'emptySpace' ? 'empty_space' : 'content';
            const shiftNum = (shift as string).replace('shift', '');
            const flatFieldName = `shift${shiftNum}_${formattedField}`;
            const formattedDate = (date as string).split('T')[0];

            const filter = `date="${formattedDate}" && silo_id="${siloId}"`;
            const records = await pb
              .collection('ccr_silo_data')
              .getFullList({ filter, expand: 'silo_id' });

            if (records.length > 0) {
              await pb
                .collection('ccr_silo_data')
                .update(records[0].id, { [flatFieldName]: value });
            } else {
              await pb.collection('ccr_silo_data').create({
                date: formattedDate,
                silo_id: siloId,
                plant_unit: selectedUnit,
                [flatFieldName]: value,
              });
            }
            break;
          }

          case 'information': {
            const { date, unit, text } = op.data as Record<string, unknown>;
            const filter = `date="${date}" && plant_unit="${unit}"`;
            const records = await pb.collection('ccr_information').getFullList({ filter });

            if (records.length > 0) {
              await pb.collection('ccr_information').update(records[0].id, { information: text });
            } else {
              await pb.collection('ccr_information').create({
                date,
                plant_unit: unit,
                information: text,
              });
            }
            break;
          }

          default:
            break;
        }
      } catch {
        allSuccess = false;
        remainingQueue.push(op);
      }
    }

    if (allSuccess) {
      // All synced — safe to clear everything
      localStorage.removeItem(PENDING_KEY);
      clearAllDrafts(DRAFT_PREFIX);
      logger.info('[OfflineSync] All pending data flushed successfully before logout');
    } else {
      // Some failed — keep remaining for recovery
      localStorage.setItem(PENDING_KEY, JSON.stringify(remainingQueue));
      logger.warn(
        `[OfflineSync] ${remainingQueue.length} operations could not be flushed, preserving for recovery`
      );
    }
  } catch (error) {
    // Flush failed entirely — preserve all data
    logger.warn('[OfflineSync] Flush before logout failed, preserving data:', error);
  }
};

/** Helper: remove all draft keys from localStorage */
function clearAllDrafts(prefix: string): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
