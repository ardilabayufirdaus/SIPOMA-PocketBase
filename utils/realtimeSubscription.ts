import { useEffect } from 'react';
import { pb } from './pocketbase';
import { trackRealtimeSubscription, untrackRealtimeSubscription } from './realtimeMonitor';
import { logger } from './logger';
import { realtimeOptimizer } from './realtimeSubscriptionOptimizer';
import type { RecordSubscription, RecordModel } from 'pocketbase';

/**
 * A hook to safely subscribe to PocketBase realtime events with automatic error handling,
 * reconnection capabilities, and performance optimization.
 *
 * @param collection The collection name to subscribe to
 * @param event The event type ('*' for all events, or a specific event)
 * @param callback The callback to be called when an event is received
 * @param optimize Whether to use the performance optimizer (default: true)
 * @returns A cleanup function
 */
export const useRealtimeSubscription = <T = Record<string, unknown>>(
  collection: string,
  event: string = '*',
  callback: (data: T) => void,
  optimize: boolean = true
): (() => void) => {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        // Register this subscription with the monitor
        trackRealtimeSubscription(collection);

        // Create an optimized callback handler
        const handleUpdate = (data: unknown) => {
          try {
            if (optimize) {
              // Queue update for optimized processing
              realtimeOptimizer.queueUpdate(
                collection,
                data as Record<string, unknown>,
                (optimizedData) => callback(optimizedData as T)
              );
            } else {
              // Direct callback without optimization
              callback(data as T);
            }
          } catch (callbackError) {
            // Log but don't crash if callback errors
            logger.error(
              `Error in realtime subscription callback for ${collection}:`,
              callbackError
            );
          }
        };

        // Create the subscription with the optimized handler
        const unsub = await pb.collection(collection).subscribe(event, handleUpdate);

        unsubscribe = unsub;

        logger.info(
          `Realtime subscription created for collection "${collection}" (${optimize ? 'optimized' : 'standard'})`
        );
      } catch (error) {
        logger.error(
          `Failed to create realtime subscription for collection "${collection}":`,
          error
        );

        // Schedule a retry after 5 seconds
        setTimeout(setupSubscription, 5000);
      }
    };

    // Initial setup
    setupSubscription();

    // Cleanup
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
          logger.info(`Realtime subscription removed for collection "${collection}"`);
        } catch (error) {
          logger.error(`Error while unsubscribing from ${collection}:`, error);
        }
      }
      untrackRealtimeSubscription(collection);
    };
  }, [collection, event]); // Intentionally exclude callback from deps for stability

  // Return empty function for consistency with useEffect return type
  return () => {};
};

/**
 * A utility function to create a one-time subscription that automatically unsubscribes
 * after receiving the first event. Useful for waiting for a specific event to occur.
 *
 * @param collection The collection name to subscribe to
 * @param event The event type to listen for
 * @param callback The callback to be called when the event is received
 * @returns A promise that resolves with the unsubscribe function
 */
export const subscribeOnce = async <T = unknown>(
  collection: string,
  event: string = '*',
  callback: (data: T) => void
): Promise<() => void> => {
  let unsubscribe: (() => void) | null = null;

  try {
    // Track the subscription
    trackRealtimeSubscription(collection);

    // Create a wrapper that calls the callback and then unsubscribes
    const onceWrapper = async (data: RecordSubscription<RecordModel>) => {
      try {
        // Call user's callback with the data cast to T
        callback(data as T);
      } finally {
        // Always unsubscribe after first event
        if (unsubscribe) {
          unsubscribe();
          untrackRealtimeSubscription(collection);
        }
      }
    };

    // Create the subscription
    unsubscribe = await pb.collection(collection).subscribe(event, onceWrapper);

    // Return the unsubscribe function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        untrackRealtimeSubscription(collection);
      }
    };
  } catch (error) {
    logger.error(`Failed to create one-time subscription for ${collection}:`, error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};
