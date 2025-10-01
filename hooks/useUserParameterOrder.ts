import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useCurrentUser } from './useCurrentUser';

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

      const { data, error: fetchError } = await supabase
        .from('user_parameter_orders')
        .select('parameter_order')
        .eq('user_id', currentUser.id)
        .eq('module', module)
        .eq('parameter_type', parameterType)
        .eq('category', category || null)
        .eq('unit', unit || null)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw fetchError;
      }

      if (data?.parameter_order) {
        setParameterOrder(data.parameter_order);
      } else {
        setParameterOrder([]);
      }
    } catch (err) {
      console.error('Error loading parameter order:', err);
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

        const { error: upsertError } = await supabase.from('user_parameter_orders').upsert(
          {
            user_id: currentUser.id,
            module,
            parameter_type: parameterType,
            category: category || null,
            unit: unit || null,
            parameter_order: newOrder,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,module,parameter_type,category,unit',
          }
        );

        if (upsertError) {
          throw upsertError;
        }

        setParameterOrder(newOrder);
      } catch (err) {
        console.error('Error saving parameter order:', err);
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
