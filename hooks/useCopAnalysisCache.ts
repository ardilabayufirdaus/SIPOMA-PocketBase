/**
 * COP Analysis Cache Hook
 * Provides caching functionality for COP Analysis computations using PocketBase cache collection
 */

import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';

interface CopAnalysisCacheData {
  cache_key: string;
  category: string;
  unit: string;
  year: number;
  month: number;
  cement_type: string;
  analysis_data: string; // JSON string of analysis results
  created_at: string;
  expires_at: string;
  last_accessed: string;
  data_size: number;
}

import { ParameterDataType } from '../types';

interface AnalysisDataRow {
  parameter: {
    id: string;
    parameter: string;
    data_type: ParameterDataType;
    unit: string;
    category: string;
    min_value?: number;
    max_value?: number;
    opc_min_value?: number;
    opc_max_value?: number;
    pcc_min_value?: number;
    pcc_max_value?: number;
    [key: string]: any;
  };
  dailyValues: Array<{ value: number | null; raw: number | undefined }>;
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

export const useCopAnalysisCache = () => {
  const [isCacheEnabled] = useState(true);

  /**
   * Generate cache key for COP Analysis
   */
  const generateCacheKey = (
    category: string,
    unit: string,
    year: number,
    month: number,
    cementType: string
  ): string => {
    return `cop_analysis_${category}_${unit}_${year}_${month}_${cementType}`
      .toLowerCase()
      .replace(/\s+/g, '_');
  };

  /**
   * Get cached COP Analysis data
   */
  const getCachedAnalysis = useCallback(
    async (
      category: string,
      unit: string,
      year: number,
      month: number,
      cementType: string
    ): Promise<AnalysisDataRow[] | null> => {
      if (!isCacheEnabled) return null;

      // Check if user is authenticated
      if (!pb.authStore.isValid || !pb.authStore.model) {
        console.warn('User not authenticated or no auth model, skipping cache retrieval');
        return null;
      }

      try {
        const cacheKey = generateCacheKey(category, unit, year, month, cementType);

        // Check if cache collection exists and get data
        const cachedRecords = await pb.collection('cop_analysis_cache').getFullList({
          filter: `cache_key = "${cacheKey}"`,
          sort: '-created_at',
        });

        if (cachedRecords.length === 0) {
          return null;
        }

        const cachedRecord = cachedRecords[0] as unknown as CopAnalysisCacheData & { id: string };

        // Check if cache is expired
        const now = new Date();
        const expiresAt = new Date(cachedRecord.expires_at);

        if (now > expiresAt) {
          // Cache expired, delete it
          await pb.collection('cop_analysis_cache').delete(cachedRecord.id);
          return null;
        }

        // Update last accessed time
        await pb.collection('cop_analysis_cache').update(cachedRecord.id, {
          last_accessed: now.toISOString(),
        });

        // Parse and return cached data
        return JSON.parse(cachedRecord.analysis_data);
      } catch (error) {
        // If cache collection doesn't exist or other errors, return null
        console.warn('COP Analysis cache not available:', error);
        return null;
      }
    },
    [isCacheEnabled]
  );

  /**
   * Save COP Analysis data to cache
   */
  const saveAnalysisToCache = useCallback(
    async (
      category: string,
      unit: string,
      year: number,
      month: number,
      cementType: string,
      analysisData: AnalysisDataRow[]
    ): Promise<void> => {
      if (!isCacheEnabled || !analysisData || analysisData.length === 0) return;

      // Check if user is authenticated
      if (!pb.authStore.isValid || !pb.authStore.model) {
        console.warn('User not authenticated or no auth model, skipping cache save');
        return;
      }

      try {
        const cacheKey = generateCacheKey(category, unit, year, month, cementType);
        const now = new Date();

        // Set cache expiry to 24 hours from now
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Calculate data size (approximate)
        const dataSize = JSON.stringify(analysisData).length;

        const cacheData = {
          cache_key: cacheKey,
          category,
          unit,
          year,
          month,
          cement_type: cementType,
          analysis_data: JSON.stringify(analysisData),
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          last_accessed: now.toISOString(),
          data_size: dataSize,
        };

        // First, delete any existing cache for this key
        const existingRecords = await pb.collection('cop_analysis_cache').getFullList({
          filter: `cache_key = "${cacheKey}"`,
        });

        for (const record of existingRecords) {
          await pb.collection('cop_analysis_cache').delete(record.id);
        }

        // Save new cache data
        await pb.collection('cop_analysis_cache').create(cacheData);
      } catch (error) {
        // If cache collection doesn't exist or other errors, silently fail
        console.warn('Failed to save COP Analysis cache:', error);
        if (error.response) {
          console.warn('Cache save error details:', error.response.data);
        }
      }
    },
    [isCacheEnabled]
  );

  /**
   * Clear expired cache entries
   */
  const clearExpiredCache = async (): Promise<void> => {
    try {
      const now = new Date().toISOString();

      const expiredRecords = await pb.collection('cop_analysis_cache').getFullList({
        filter: `expires_at < "${now}"`,
      });

      // Optimize deletion with parallel execution
      const deletePromises = expiredRecords.map((record) =>
        pb.collection('cop_analysis_cache').delete(record.id)
      );
      await Promise.all(deletePromises);

      if (expiredRecords.length > 0) {
        console.log(`Cleaned up ${expiredRecords.length} expired COP Analysis cache entries`);
      }
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  };

  /**
   * Get cache statistics
   */
  const getCacheStats = async () => {
    try {
      const allRecords = await pb.collection('cop_analysis_cache').getFullList();
      const now = new Date();

      const stats = {
        totalEntries: allRecords.length,
        totalSize: allRecords.reduce(
          (sum, record) => sum + ((record as unknown as CopAnalysisCacheData).data_size || 0),
          0
        ),
        expiredEntries: allRecords.filter(
          (record) => new Date((record as unknown as CopAnalysisCacheData).expires_at) < now
        ).length,
        activeEntries: allRecords.filter(
          (record) => new Date((record as unknown as CopAnalysisCacheData).expires_at) >= now
        ).length,
      };

      return stats;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalEntries: 0, totalSize: 0, expiredEntries: 0, activeEntries: 0 };
    }
  };

  // Auto-clean expired cache on hook initialization
  useEffect(() => {
    clearExpiredCache();
  }, []);

  return {
    getCachedAnalysis,
    saveAnalysisToCache,
    clearExpiredCache,
    getCacheStats,
    isCacheEnabled,
  };
};
