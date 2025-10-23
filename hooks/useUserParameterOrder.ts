import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { useCurrentUser } from './useCurrentUser';
import { safeApiCall } from '../utils/connectionCheck';
import { logger } from '../utils/logger';

interface UserParameterOrder {
  id: string;
  user_id: string;
  module: string;
  parameter_type: string;
  category?: string;
  unit?: string;
  parameter_order: string[];
  created_at: string;
  updated_at: string;
}

interface UseUserParameterOrderOptions {
  module: string;
  parameterType: string;
  category?: string;
  unit?: string;
}

export const useUserParameterOrder = ({
  module,
  parameterType,
  category,
  unit,
}: UseUserParameterOrderOptions) => {
  const { currentUser } = useCurrentUser();
  const [parameterOrder, setParameterOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load parameter order from Supabase
  const loadParameterOrder = useCallback(async () => {
    if (!currentUser?.id) {
      setParameterOrder([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For relation fields, we can use the simpler syntax
      // PocketBase handles both syntaxes: user_id="id" or user_id.id="id"
      const filterParts = [
        `user_id = "${currentUser.id}"`,
        `module = "${module}"`,
        `parameter_type = "${parameterType}"`,
      ];

      if (category) filterParts.push(`category = "${category}"`);
      if (unit) filterParts.push(`unit = "${unit}"`);

      const filter = filterParts.join(' && ');

      try {
        // Use safeApiCall with getList to handle connection issues better
        const result = await safeApiCall(
          () => pb.collection('user_parameter_orders').getList(1, 1, { filter }),
          { retries: 2, retryDelay: 1000 } // Retry up to 2 times with 1s delay
        );

        if (result && result.items.length > 0) {
          setParameterOrder(result.items[0].parameter_order);
        } else {
          // No records found or API call returned null (offline/connection issue)
          // This is normal for first-time use or offline mode
          setParameterOrder([]);
        }
      } catch (apiError) {
        // Handle specific API errors
        logger.warn('API error loading parameter order:', apiError);
        setParameterOrder([]);
      }
    } catch (err) {
      // Handle known error cases gracefully
      if (err instanceof Error) {
        if (err.message?.includes('404')) {
          // 404 is normal when no order exists yet
          setParameterOrder([]);
          return;
        } else if (err.message?.includes('autocancelled')) {
          // Autocancellation happens on unmount - don't update state
          return;
        }
      }

      // Other unexpected errors
      logger.error('Error loading parameter order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load parameter order');
      setParameterOrder([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, module, parameterType, category, unit]);

  // Save parameter order to Supabase
  const saveParameterOrder = useCallback(
    async (newOrder: string[]) => {
      if (!currentUser?.id || newOrder.length === 0) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // For relation fields, we use the simple syntax
        const filterParts = [
          `user_id = "${currentUser.id}"`,
          `module = "${module}"`,
          `parameter_type = "${parameterType}"`,
        ];

        if (category) filterParts.push(`category = "${category}"`);
        if (unit) filterParts.push(`unit = "${unit}"`);

        const filter = filterParts.join(' && ');

        // Use getList instead of getFirstListItem for consistent behavior
        const records = await pb
          .collection('user_parameter_orders')
          .getList(1, 1, { filter })
          .catch(() => ({ items: [] }));

        const existing = records.items.length > 0 ? records.items[0] : null;

        if (existing) {
          await pb.collection('user_parameter_orders').update(existing.id, {
            parameter_order: newOrder,
            updated_at: new Date().toISOString(),
          });
        } else {
          // For relation fields, we pass the ID as the value
          await pb.collection('user_parameter_orders').create({
            user_id: currentUser.id, // This maps to a relation in PocketBase
            module,
            parameter_type: parameterType,
            category: category || null,
            unit: unit || null,
            parameter_order: newOrder,
          });
        }

        setParameterOrder(newOrder);
      } catch (err) {
        // Handle autocancellation gracefully
        if (err instanceof Error && err.message?.includes('autocancelled')) {
          // Just ignore autocancellation errors
          setLoading(false);
          return;
        }

        logger.error('Error saving parameter order:', err);
        setError(err instanceof Error ? err.message : 'Failed to save parameter order');
      } finally {
        setLoading(false);
      }
    },
    [currentUser?.id, module, parameterType, category, unit]
  );

  // Update parameter order (combines set and save)
  const updateParameterOrder = useCallback(
    async (newOrder: string[]) => {
      setParameterOrder(newOrder);
      await saveParameterOrder(newOrder);
    },
    [saveParameterOrder]
  );

  // Load on mount and when dependencies change
  useEffect(() => {
    loadParameterOrder();
  }, [loadParameterOrder]);

  return {
    parameterOrder,
    setParameterOrder: updateParameterOrder,
    loading,
    error,
    refetch: loadParameterOrder,
  };
};
