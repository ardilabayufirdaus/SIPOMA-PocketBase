import { useQuery } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useSupabaseQuery<T = unknown>(
  supabase: SupabaseClient,
  options: UseSupabaseQueryOptions
) {
  const { table, select = '*', filters = {}, orderBy, limit, offset, enabled = true } = options;

  return useQuery({
    queryKey: ['supabase', table, select, filters, orderBy, limit, offset],
    queryFn: async () => {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 1000) - 1);
      }

      const { data, error } = await query;
      if (error) {
        Sentry.captureException(error, {
          tags: { table, operation: 'query' },
          extra: { filters, select },
        });
        throw error;
      }
      return data as T[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
